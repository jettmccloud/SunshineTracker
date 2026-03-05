export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getMany } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const groupBy = req.nextUrl.searchParams.get('group_by') || 'year';

    let sql: string;

    switch (groupBy) {
      case 'year':
        sql = `
          SELECT EXTRACT(YEAR FROM date_filed)::text AS label, COUNT(*)::int AS count
          FROM cached_cases
          WHERE date_filed IS NOT NULL
          GROUP BY label
          ORDER BY label DESC
        `;
        break;

      case 'jurisdiction':
        sql = `
          SELECT jurisdiction_type AS label, COUNT(*)::int AS count
          FROM cached_cases
          GROUP BY jurisdiction_type
          ORDER BY count DESC
        `;
        break;

      case 'state':
        sql = `
          SELECT state AS label, COUNT(*)::int AS count
          FROM cached_cases
          WHERE state IS NOT NULL AND state != ''
          GROUP BY state
          ORDER BY count DESC
        `;
        break;

      case 'category':
        sql = `
          SELECT category AS label, COUNT(*)::int AS count
          FROM cached_cases
          GROUP BY category
          ORDER BY count DESC
        `;
        break;

      case 'court':
        sql = `
          SELECT court_name AS label, court_id, COUNT(*)::int AS count
          FROM cached_cases
          WHERE court_name IS NOT NULL
          GROUP BY court_name, court_id
          ORDER BY count DESC
          LIMIT 10
        `;
        break;

      case 'judge':
        sql = `
          SELECT TRIM(j) AS label, COUNT(*)::int AS count
          FROM cached_cases, UNNEST(judges) AS j
          WHERE j IS NOT NULL AND TRIM(j) != ''
          GROUP BY TRIM(j)
          ORDER BY count DESC
          LIMIT 10
        `;
        break;

      case 'keyword':
        sql = `
          SELECT TRIM(k) AS label, COUNT(*)::int AS count
          FROM cached_cases, UNNEST(matched_keywords) AS k
          WHERE k IS NOT NULL AND TRIM(k) != ''
          GROUP BY TRIM(k)
          ORDER BY count DESC
          LIMIT 15
        `;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid group_by value. Use: year, jurisdiction, state, category, court, judge, or keyword' },
          { status: 400 }
        );
    }

    const results = await getMany(sql);

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('Trends error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
