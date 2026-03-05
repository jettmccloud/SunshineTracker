import { query } from '@/lib/db';
import { getCluster, getOpinion } from '@/lib/courtlistener';

const STALE_THRESHOLD_DAYS = 7;

export function stripHtml(html: string): string {
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

export function isStale(fetchedAt: string | Date | null): boolean {
  if (!fetchedAt) return true;
  const fetched = new Date(fetchedAt);
  const ageMs = Date.now() - fetched.getTime();
  return ageMs > STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Re-fetches a case from CourtListener and updates the DB cache.
 * Returns true if the case was updated, false if skipped/failed.
 * Clears the summary column so it regenerates on next view.
 */
export async function refreshCase(caseId: string, courtlistenerId: string): Promise<boolean> {
  try {
    const clusterId = parseInt(courtlistenerId, 10);
    if (isNaN(clusterId)) return false;

    const cluster = await getCluster(clusterId);

    let opinionText = '';
    let opinionHtml = '';

    if (cluster.sub_opinions && cluster.sub_opinions.length > 0) {
      const firstOp = cluster.sub_opinions[0];
      const opinionId = typeof firstOp === 'string'
        ? parseInt(firstOp.replace(/\/$/, '').split('/').pop() || '', 10)
        : firstOp.id;
      const opinion = await getOpinion(opinionId);
      opinionHtml = opinion.html_with_citations || opinion.html || '';
      opinionText = opinion.plain_text || (opinionHtml ? stripHtml(opinionHtml) : '');
    }

    await query(
      `UPDATE cached_cases
       SET opinion_text = $1, opinion_html = $2, judges = $3,
           nature_of_suit = $4, citations = $5, fetched_at = NOW(),
           summary = NULL
       WHERE id = $6`,
      [
        opinionText,
        opinionHtml,
        cluster.judges ? [cluster.judges] : null,
        cluster.nature_of_suit || null,
        JSON.stringify(cluster.citations || []),
        caseId,
      ]
    );

    return true;
  } catch (err) {
    console.error(`Failed to refresh case ${caseId}:`, err);
    return false;
  }
}
