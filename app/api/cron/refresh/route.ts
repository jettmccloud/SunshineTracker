import { NextRequest, NextResponse } from 'next/server';
import { getMany } from '@/lib/db';
import { refreshCase } from '@/lib/refresh';

const BATCH_SIZE = 10;
const DELAY_BETWEEN_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const staleCases = await getMany(
    `SELECT id, courtlistener_id FROM cached_cases
     WHERE courtlistener_id IS NOT NULL
     ORDER BY fetched_at ASC NULLS FIRST
     LIMIT $1`,
    [BATCH_SIZE]
  );

  const results: { id: string; success: boolean }[] = [];

  for (let i = 0; i < staleCases.length; i++) {
    const row = staleCases[i];
    const success = await refreshCase(row.id, row.courtlistener_id);
    results.push({ id: row.id, success });

    if (i < staleCases.length - 1) {
      await sleep(DELAY_BETWEEN_MS);
    }
  }

  return NextResponse.json({
    refreshed: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    total: staleCases.length,
    details: results,
  });
}
