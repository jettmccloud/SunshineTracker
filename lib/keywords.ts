export interface KeywordGroup {
  id: string;
  label: string;
  category: string;
  terms: string[];
  query: string; // pre-built CourtListener query string
}

export const KEYWORD_GROUPS: KeywordGroup[] = [
  {
    id: 'foia_federal',
    label: 'FOIA (Federal)',
    category: 'foia',
    terms: ['freedom of information', 'FOIA', '5 U.S.C. § 552'],
    query: '"freedom of information" OR "FOIA" OR "5 U.S.C. § 552"',
  },
  {
    id: 'sunshine_laws',
    label: 'Sunshine / Open Records Laws',
    category: 'sunshine',
    terms: ['sunshine law', 'open records', 'public records act', 'open meetings'],
    query: '"sunshine law" OR "open records" OR "public records act" OR "open meetings"',
  },
  {
    id: 'missing_data',
    label: 'Missing / Destroyed Records',
    category: 'missing_data',
    terms: ['missing records', 'destroyed records', 'failure to produce', 'spoliation', 'missing public data'],
    query: '"missing records" OR "destroyed records" OR "failure to produce" OR "spoliation" OR "missing public data"',
  },
  {
    id: 'access_denied',
    label: 'Access Denied / Withheld',
    category: 'access_denied',
    terms: ['denial of access', 'withheld records', 'exemption', 'redacted'],
    query: '"denial of access" OR "withheld records" OR "exemption" OR "redacted"',
  },
];

export const CATEGORIES = [
  { id: 'foia', label: 'FOIA' },
  { id: 'sunshine', label: 'Sunshine Laws' },
  { id: 'missing_data', label: 'Missing Data' },
  { id: 'access_denied', label: 'Access Denied' },
];

export const JURISDICTION_TYPES = [
  { id: 'federal', label: 'Federal' },
  { id: 'state', label: 'State' },
  { id: 'county', label: 'County' },
];

export function categorizeCase(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('freedom of information') || lower.includes('foia') || lower.includes('5 u.s.c. § 552')) {
    return 'foia';
  }
  if (lower.includes('sunshine law') || lower.includes('open records') || lower.includes('public records act') || lower.includes('open meetings')) {
    return 'sunshine';
  }
  if (lower.includes('missing records') || lower.includes('destroyed records') || lower.includes('failure to produce') || lower.includes('spoliation')) {
    return 'missing_data';
  }
  if (lower.includes('denial of access') || lower.includes('withheld records') || lower.includes('exemption') || lower.includes('redacted')) {
    return 'access_denied';
  }
  return 'other';
}

export function findMatchedKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const group of KEYWORD_GROUPS) {
    for (const term of group.terms) {
      if (lower.includes(term.toLowerCase())) {
        matched.push(term);
      }
    }
  }
  return Array.from(new Set(matched));
}
