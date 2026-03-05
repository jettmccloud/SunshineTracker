import { categorizeCase, findMatchedKeywords } from './keywords';

const CL_BASE = 'https://www.courtlistener.com/api/rest/v4';
const CL_TOKEN = process.env.COURTLISTENER_API_TOKEN || '';

function clHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (CL_TOKEN) {
    headers['Authorization'] = `Token ${CL_TOKEN}`;
  }
  return headers;
}

export interface CLSearchParams {
  q: string;
  type?: 'o' | 'd'; // opinions or dockets
  court?: string;
  filed_after?: string;
  filed_before?: string;
  stat?: string; // precedential status
  page?: number;
  page_size?: number;
}

export interface CLSearchResultItem {
  absolute_url: string;
  caseName: string;
  court: string;
  court_id: string;
  court_citation_string: string;
  dateFiled: string;
  dateArgued: string;
  docketNumber: string;
  judge: string;
  lexisCite: string;
  neutralCite: string;
  suitNature: string;
  citeCount: number;
  cluster_id: number;
  id: number;
  snippet: string;
  status: string;
}

export interface CLSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CLSearchResultItem[];
}

export async function searchCourtListener(params: CLSearchParams): Promise<CLSearchResponse> {
  const url = new URL(`${CL_BASE}/search/`);
  url.searchParams.set('q', params.q);
  url.searchParams.set('type', params.type || 'o');
  if (params.court) url.searchParams.set('court', params.court);
  if (params.filed_after) url.searchParams.set('filed_after', params.filed_after);
  if (params.filed_before) url.searchParams.set('filed_before', params.filed_before);
  if (params.stat) url.searchParams.set('stat', params.stat);
  url.searchParams.set('page', String(params.page || 1));
  url.searchParams.set('page_size', String(params.page_size || 20));

  const res = await fetch(url.toString(), { headers: clHeaders() });
  if (!res.ok) {
    throw new Error(`CourtListener search failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface CLOpinionDetail {
  id: number;
  absolute_url: string;
  cluster: string;
  author_str: string;
  plain_text: string;
  html: string;
  html_with_citations: string;
  date_created: string;
}

export async function getOpinion(id: number): Promise<CLOpinionDetail> {
  const res = await fetch(`${CL_BASE}/opinions/${id}/`, { headers: clHeaders() });
  if (!res.ok) {
    throw new Error(`CourtListener opinion fetch failed: ${res.status}`);
  }
  return res.json();
}

export interface CLClusterDetail {
  id: number;
  absolute_url: string;
  case_name: string;
  date_filed: string;
  docket: string;
  judges: string;
  nature_of_suit: string;
  citation_count: number;
  precedential_status: string;
  sub_opinions: (string | { id: number })[];
  citations: { volume: number; reporter: string; page: string }[];
}

export async function getCluster(id: number): Promise<CLClusterDetail> {
  const res = await fetch(`${CL_BASE}/clusters/${id}/`, { headers: clHeaders() });
  if (!res.ok) {
    throw new Error(`CourtListener cluster fetch failed: ${res.status}`);
  }
  return res.json();
}

export interface CLDocketDetail {
  id: number;
  absolute_url: string;
  case_name: string;
  court: string;
  court_id: string;
  date_filed: string;
  docket_number: string;
  nature_of_suit: string;
}

export async function getDocket(id: number | string): Promise<CLDocketDetail> {
  // id can be a full URL or an integer
  const url = typeof id === 'string' && id.startsWith('http')
    ? id
    : `${CL_BASE}/dockets/${id}/`;
  const res = await fetch(url, { headers: clHeaders() });
  if (!res.ok) {
    throw new Error(`CourtListener docket fetch failed: ${res.status}`);
  }
  return res.json();
}

export function inferJurisdiction(courtId: string): string {
  if (!courtId) return 'federal';
  const id = courtId.toLowerCase();
  if (id.startsWith('scotus') || id.startsWith('ca') || id.includes('district') || id.includes('bankr') || id.includes('fed')) {
    return 'federal';
  }
  if (id.includes('county') || id.includes('municipal') || id.includes('circuit')) {
    return 'county';
  }
  return 'state';
}

export function inferState(courtId: string, courtName: string): string {
  const stateMap: Record<string, string> = {
    'cal': 'California', 'ny': 'New York', 'tex': 'Texas', 'fla': 'Florida',
    'ill': 'Illinois', 'pa': 'Pennsylvania', 'ohio': 'Ohio', 'mich': 'Michigan',
    'ga': 'Georgia', 'nc': 'North Carolina', 'nj': 'New Jersey', 'va': 'Virginia',
    'wa': 'Washington', 'az': 'Arizona', 'ma': 'Massachusetts', 'tn': 'Tennessee',
    'ind': 'Indiana', 'mo': 'Missouri', 'md': 'Maryland', 'wi': 'Wisconsin',
    'co': 'Colorado', 'mn': 'Minnesota', 'sc': 'South Carolina', 'al': 'Alabama',
    'la': 'Louisiana', 'ky': 'Kentucky', 'or': 'Oregon', 'ok': 'Oklahoma',
    'ct': 'Connecticut', 'ut': 'Utah', 'ia': 'Iowa', 'nv': 'Nevada',
    'ar': 'Arkansas', 'ms': 'Mississippi', 'ks': 'Kansas', 'nm': 'New Mexico',
    'ne': 'Nebraska', 'id': 'Idaho', 'wv': 'West Virginia', 'hi': 'Hawaii',
    'nh': 'New Hampshire', 'me': 'Maine', 'mt': 'Montana', 'ri': 'Rhode Island',
    'de': 'Delaware', 'sd': 'South Dakota', 'nd': 'North Dakota', 'ak': 'Alaska',
    'vt': 'Vermont', 'wy': 'Wyoming',
  };

  const combined = `${courtId} ${courtName}`.toLowerCase();
  for (const [key, state] of Object.entries(stateMap)) {
    if (combined.includes(key)) return state;
  }
  return '';
}

export function transformSearchResult(item: CLSearchResultItem) {
  const text = `${item.caseName} ${item.snippet}`;
  return {
    courtlistener_id: String(item.cluster_id || item.id),
    case_name: item.caseName,
    court_id: item.court_id,
    court_name: item.court || item.court_citation_string,
    jurisdiction_type: inferJurisdiction(item.court_id),
    date_filed: item.dateFiled || null,
    date_decided: null,
    status: item.status || 'unknown',
    opinion_text: '',
    opinion_html: '',
    citations: [],
    judges: item.judge ? [item.judge] : [],
    docket_number: item.docketNumber,
    nature_of_suit: item.suitNature || '',
    source_url: `https://www.courtlistener.com${item.absolute_url}`,
    matched_keywords: findMatchedKeywords(text),
    category: categorizeCase(text),
    state: inferState(item.court_id, item.court || ''),
    snippet: item.snippet,
  };
}
