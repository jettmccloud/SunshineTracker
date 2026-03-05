export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getOne, getMany } from '@/lib/db';
import { generateCaseReport, generateFoiaTemplate } from '@/lib/templates';

const CSV_HEADERS = [
  'id', 'case_name', 'court_id', 'court_name', 'jurisdiction_type',
  'date_filed', 'date_decided', 'status', 'docket_number',
  'nature_of_suit', 'category', 'state', 'source_url',
  'matched_keywords', 'judges',
];

function escapeCsvField(value: any): string {
  if (value === null || value === undefined) return '';
  const str = Array.isArray(value) ? value.join('; ') : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function casesToCsv(cases: any[]): string {
  const lines: string[] = [CSV_HEADERS.join(',')];
  for (const row of cases) {
    const values = CSV_HEADERS.map((header) => escapeCsvField(row[header]));
    lines.push(values.join(','));
  }
  return lines.join('\n');
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const format = params.get('format') || 'json';
    const collectionId = params.get('collection_id');
    const caseId = params.get('case_id');

    const validFormats = ['csv', 'json', 'report', 'foia'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use "csv", "json", "report", or "foia".' },
        { status: 400 }
      );
    }

    // Single-case report or FOIA template
    if ((format === 'report' || format === 'foia') && caseId) {
      const caseData = await getOne('SELECT * FROM cached_cases WHERE id = $1', [caseId]);
      if (!caseData) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
      }

      const text = format === 'report'
        ? generateCaseReport(caseData)
        : generateFoiaTemplate(caseData);

      const filename = format === 'report'
        ? `case-report-${Date.now()}.txt`
        : `foia-template-${Date.now()}.txt`;

      return new NextResponse(text, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    let cases: any[];

    if (collectionId) {
      // Export all cases from a collection
      cases = await getMany(
        `SELECT cc2.*
         FROM collection_cases cc
         JOIN cached_cases cc2 ON cc2.id = cc.case_id
         WHERE cc.collection_id = $1
         ORDER BY cc2.date_filed DESC NULLS LAST`,
        [collectionId]
      );
    } else {
      // Export based on search params
      const q = params.get('q');
      const category = params.get('category');
      const jurisdictionType = params.get('jurisdiction_type');
      const state = params.get('state');
      const dateFrom = params.get('date_from');
      const dateTo = params.get('date_to');
      const court = params.get('court');

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

      cases = await getMany(
        `SELECT * FROM cached_cases ${whereClause} ORDER BY date_filed DESC NULLS LAST LIMIT 10000`,
        values
      );
    }

    if (format === 'csv') {
      const csv = casesToCsv(cases);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="sunshine-tracker-export.csv"',
        },
      });
    }

    // JSON format
    return NextResponse.json({ cases, total: cases.length });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
