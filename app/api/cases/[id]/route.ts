import { NextRequest, NextResponse } from 'next/server';
import { getOne, getMany, query } from '@/lib/db';
import { generateSummary } from '@/lib/summarize';
import { isStale, refreshCase, stripHtml } from '@/lib/refresh';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const caseData = await getOne('SELECT * FROM cached_cases WHERE id = $1', [id]);

    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // If opinion_text is empty, fetch full text from CourtListener (blocking)
    if (!caseData.opinion_text && caseData.courtlistener_id) {
      const updated = await refreshCase(id, caseData.courtlistener_id);
      if (updated) {
        const refreshed = await getOne('SELECT * FROM cached_cases WHERE id = $1', [id]);
        if (refreshed) Object.assign(caseData, refreshed);
      }
    }

    // If data exists but is stale, refresh in background (non-blocking)
    if (caseData.opinion_text && caseData.courtlistener_id && isStale(caseData.fetched_at)) {
      refreshCase(id, caseData.courtlistener_id).catch((err) =>
        console.error('Background refresh failed:', err)
      );
    }

    // Generate summary if we have opinion text/html but no cached summary
    const textForSummary = caseData.opinion_text || (caseData.opinion_html ? stripHtml(caseData.opinion_html) : '');
    if (textForSummary && !caseData.summary) {
      try {
        const summary = await generateSummary(
          textForSummary,
          caseData.case_name,
          caseData.date_filed,
          caseData.date_decided
        );

        // Cache the summary
        await query(
          'UPDATE cached_cases SET summary = $1 WHERE id = $2',
          [JSON.stringify(summary), id]
        );

        caseData.summary = summary;
      } catch (sumErr) {
        console.error('Failed to generate summary:', sumErr);
        // Continue without summary
      }
    }

    // Fetch annotations for this case
    const annotations = await getMany(
      'SELECT * FROM annotations WHERE case_id = $1 ORDER BY created_at DESC',
      [id]
    );

    return NextResponse.json({
      ...caseData,
      annotations,
    });
  } catch (error) {
    console.error('Case detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
