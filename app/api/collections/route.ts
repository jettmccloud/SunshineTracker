export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getOne, getMany, query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const collections = await getMany(
      `SELECT c.*, COUNT(cc.case_id)::int AS case_count
       FROM collections c
       LEFT JOIN collection_cases cc ON cc.collection_id = c.id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [user.userId]
    );

    return NextResponse.json({ collections });
  } catch (error) {
    console.error('Collections list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      const { name, description } = body;

      if (!name) {
        return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
      }

      const collection = await getOne(
        'INSERT INTO collections (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
        [user.userId, name, description || '']
      );

      return NextResponse.json({ collection }, { status: 201 });
    }

    if (action === 'add_case') {
      const { collection_id, case_id } = body;

      if (!collection_id || !case_id) {
        return NextResponse.json(
          { error: 'collection_id and case_id are required' },
          { status: 400 }
        );
      }

      // Verify user owns the collection
      const collection = await getOne(
        'SELECT id FROM collections WHERE id = $1 AND user_id = $2',
        [collection_id, user.userId]
      );
      if (!collection) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }

      // Verify case exists
      const caseExists = await getOne('SELECT id FROM cached_cases WHERE id = $1', [case_id]);
      if (!caseExists) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
      }

      await query(
        'INSERT INTO collection_cases (collection_id, case_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [collection_id, case_id]
      );

      return NextResponse.json({ success: true }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action. Use "create" or "add_case".' }, { status: 400 });
  } catch (error) {
    console.error('Collection create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { collection_id, case_id } = body;

    if (!collection_id || !case_id) {
      return NextResponse.json(
        { error: 'collection_id and case_id are required' },
        { status: 400 }
      );
    }

    // Verify user owns the collection
    const collection = await getOne(
      'SELECT id FROM collections WHERE id = $1 AND user_id = $2',
      [collection_id, user.userId]
    );
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    await query(
      'DELETE FROM collection_cases WHERE collection_id = $1 AND case_id = $2',
      [collection_id, case_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Collection remove case error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
