import { NextRequest, NextResponse } from 'next/server';
import { getOne, getMany, query } from '@/lib/db';
import { getCluster, getOpinion } from '@/lib/courtlistener';
import { generateSummary } from '@/lib/summarize';

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

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

    // If opinion_text is empty, fetch full text from CourtListener
    if (!caseData.opinion_text && caseData.courtlistener_id) {
      try {
        const clusterId = parseInt(caseData.courtlistener_id, 10);
        if (!isNaN(clusterId)) {
          const cluster = await getCluster(clusterId);

          let opinionText = '';
          let opinionHtml = '';

          if (cluster.sub_opinions && cluster.sub_opinions.length > 0) {
            const firstOp = cluster.sub_opinions[0];
            // sub_opinions can be URLs (strings) or objects with id
            const opinionId = typeof firstOp === 'string'
              ? parseInt(firstOp.replace(/\/$/, '').split('/').pop() || '', 10)
              : firstOp.id;
            const opinion = await getOpinion(opinionId);
            opinionHtml = opinion.html_with_citations || opinion.html || '';
            opinionText = opinion.plain_text || (opinionHtml ? stripHtml(opinionHtml) : '');
          }

          // Update the cache with the fetched opinion
          await query(
            `UPDATE cached_cases
             SET opinion_text = $1, opinion_html = $2, judges = $3, nature_of_suit = $4, citations = $5, fetched_at = NOW()
             WHERE id = $6`,
            [
              opinionText,
              opinionHtml,
              cluster.judges ? [cluster.judges] : caseData.judges,
              cluster.nature_of_suit || caseData.nature_of_suit,
              JSON.stringify(cluster.citations || []),
              id,
            ]
          );

          caseData.opinion_text = opinionText;
          caseData.opinion_html = opinionHtml;
          if (cluster.judges) caseData.judges = [cluster.judges];
          if (cluster.nature_of_suit) caseData.nature_of_suit = cluster.nature_of_suit;
          if (cluster.citations) caseData.citations = cluster.citations;
        }
      } catch (clErr) {
        console.error('Failed to fetch opinion from CourtListener:', clErr);
        // Continue with whatever data we have
      }
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
