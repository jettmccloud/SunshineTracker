export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getOne, getMany, query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const caseId = req.nextUrl.searchParams.get('case_id');

    if (!caseId) {
      return NextResponse.json(
        { error: 'Query parameter "case_id" is required' },
        { status: 400 }
      );
    }

    const annotations = await getMany(
      `SELECT a.*, u.email AS user_email
       FROM annotations a
       JOIN users u ON u.id = a.user_id
       WHERE a.case_id = $1
       ORDER BY a.created_at DESC`,
      [caseId]
    );

    return NextResponse.json({ annotations });
  } catch (error) {
    console.error('Annotations list error:', error);
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
    const { case_id, note, tags } = body;

    if (!case_id || !note) {
      return NextResponse.json(
        { error: 'case_id and note are required' },
        { status: 400 }
      );
    }

    // Verify the case exists
    const caseExists = await getOne('SELECT id FROM cached_cases WHERE id = $1', [case_id]);
    if (!caseExists) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const annotation = await getOne(
      'INSERT INTO annotations (user_id, case_id, note, tags) VALUES ($1, $2, $3, $4) RETURNING *',
      [user.userId, case_id, note, tags || []]
    );

    return NextResponse.json({ annotation }, { status: 201 });
  } catch (error) {
    console.error('Annotation create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const annotationId = req.nextUrl.searchParams.get('id');

    if (!annotationId) {
      return NextResponse.json(
        { error: 'Query parameter "id" is required' },
        { status: 400 }
      );
    }

    // Verify the annotation exists and belongs to the user
    const annotation = await getOne(
      'SELECT id FROM annotations WHERE id = $1 AND user_id = $2',
      [annotationId, user.userId]
    );

    if (!annotation) {
      return NextResponse.json(
        { error: 'Annotation not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    await query('DELETE FROM annotations WHERE id = $1', [annotationId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Annotation delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
