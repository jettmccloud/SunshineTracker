export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query, getMany } from '@/lib/db';
import { searchCourtListener, transformSearchResult } from '@/lib/courtlistener';
import { KEYWORD_GROUPS } from '@/lib/keywords';

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const q = params.get('q') || '';
    const category = params.get('category') || '';
    const jurisdictionType = params.get('jurisdiction_type') || '';
    const state = params.get('state') || '';
    const dateFrom = params.get('date_from') || '';
    const dateTo = params.get('date_to') || '';
    const court = params.get('court') || '';
    const page = Math.max(1, parseInt(params.get('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(params.get('per_page') || '20', 10)));
    const offset = (page - 1) * perPage;

    // Build local database query with optional text search + filters
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (q) {
      conditions.push(
        `(case_name ILIKE $${paramIdx} OR opinion_text ILIKE $${paramIdx} OR array_to_string(matched_keywords, ' ') ILIKE $${paramIdx})`
      );
      values.push(`%${q}%`);
      paramIdx++;
    }

    if (category) {
      conditions.push(`category = $${paramIdx}`);
      values.push(category);
      paramIdx++;
    }

    if (jurisdictionType) {
      // FilterPanel sends comma-separated, possibly capitalized values
      const jurTypes = jurisdictionType.split(',').map(j => j.trim().toLowerCase());
      const jurPlaceholders = jurTypes.map((_, i) => `$${paramIdx + i}`);
      conditions.push(`LOWER(jurisdiction_type) IN (${jurPlaceholders.join(',')})`);
      values.push(...jurTypes);
      paramIdx += jurTypes.length;
    }

    if (state) {
      conditions.push(`state = $${paramIdx}`);
      values.push(state);
      paramIdx++;
    }

    if (dateFrom) {
      conditions.push(`date_filed >= $${paramIdx}`);
      values.push(dateFrom);
      paramIdx++;
    }

    if (dateTo) {
      conditions.push(`date_filed <= $${paramIdx}`);
      values.push(dateTo);
      paramIdx++;
    }

    if (court) {
      conditions.push(`court_id = $${paramIdx}`);
      values.push(court);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total local results
    const countResult = await query(
      `SELECT COUNT(*) as total FROM cached_cases ${whereClause}`,
      values
    );
    const localTotal = parseInt(countResult.rows[0].total, 10);

    // Fetch local results
    const localCases = await getMany(
      `SELECT * FROM cached_cases ${whereClause} ORDER BY date_filed DESC NULLS LAST LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...values, perPage, offset]
    );

    let cases = localCases;
    let total = localTotal;

    // If local results are fewer than per_page, supplement from CourtListener
    // Works with text queries OR category-based keyword group queries
    if (localCases.length < perPage && (q || category)) {
      try {
        // If searching by category without a text query, build a CL query from keyword groups
        let clQuery = q;
        if (!clQuery && category) {
          const group = KEYWORD_GROUPS.find(g => g.category === category);
          if (group) clQuery = group.query;
        }

        if (clQuery) {
          const clResponse = await searchCourtListener({
            q: clQuery,
            court: court || undefined,
            filed_after: dateFrom || undefined,
            filed_before: dateTo || undefined,
            page: 1,
            page_size: perPage - localCases.length,
          });

          if (clResponse.results && clResponse.results.length > 0) {
            const newCases = [];

            for (const item of clResponse.results) {
              const transformed = transformSearchResult(item);

              if (category && transformed.category !== category) continue;
              if (jurisdictionType) {
                const jurTypes = jurisdictionType.split(',').map(j => j.trim().toLowerCase());
                if (!jurTypes.includes(transformed.jurisdiction_type.toLowerCase())) continue;
              }
              if (state && transformed.state !== state) continue;

              try {
                const inserted = await query(
                  `INSERT INTO cached_cases (
                    courtlistener_id, case_name, court_id, court_name,
                    jurisdiction_type, date_filed, date_decided, status,
                    opinion_text, opinion_html, citations, judges,
                    docket_number, nature_of_suit, source_url,
                    matched_keywords, category, state
                  ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
                  ON CONFLICT (courtlistener_id) DO UPDATE SET fetched_at = NOW()
                  RETURNING *`,
                  [
                    transformed.courtlistener_id, transformed.case_name,
                    transformed.court_id, transformed.court_name,
                    transformed.jurisdiction_type, transformed.date_filed,
                    transformed.date_decided, transformed.status,
                    transformed.opinion_text, transformed.opinion_html,
                    JSON.stringify(transformed.citations), transformed.judges,
                    transformed.docket_number, transformed.nature_of_suit,
                    transformed.source_url, transformed.matched_keywords,
                    transformed.category, transformed.state,
                  ]
                );

                if (inserted.rows[0]) {
                  newCases.push(inserted.rows[0]);
                }
              } catch (dbErr) {
                console.error('Failed to cache case:', dbErr);
              }
            }

            const existingIds = new Set(cases.map((c: any) => c.courtlistener_id));
            for (const nc of newCases) {
              if (!existingIds.has(nc.courtlistener_id)) {
                cases.push(nc);
              }
            }
            // Only use CL count as total if we aren't applying local-only
            // filters (jurisdiction, category, state) that CL doesn't support.
            // Otherwise the total is misleadingly high.
            const hasLocalOnlyFilters = jurisdictionType || category || state;
            if (!hasLocalOnlyFilters) {
              total = Math.max(total, clResponse.count);
            } else {
              // Recount from local DB with all filters applied to get accurate total
              const recountResult = await query(
                `SELECT COUNT(*) as total FROM cached_cases ${whereClause}`,
                values
              );
              total = parseInt(recountResult.rows[0].total, 10);
            }
          }
        }
      } catch (clErr) {
        console.error('CourtListener search failed, returning local results only:', clErr);
      }
    }

    return NextResponse.json({ cases, total, page, per_page: perPage });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
