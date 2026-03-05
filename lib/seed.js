const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const CL_BASE = 'https://www.courtlistener.com/api/rest/v4';
const CL_TOKEN = process.env.COURTLISTENER_API_TOKEN || '';

// Keyword groups to search
const KEYWORD_GROUPS = [
  { query: '"freedom of information" OR "FOIA" OR "5 U.S.C. § 552"', category: 'foia', label: 'FOIA Federal', pages: 5 },
  { query: '"sunshine law" OR "open records" OR "public records act" OR "open meetings"', category: 'sunshine', label: 'Sunshine Laws', pages: 5 },
  { query: '"missing records" OR "destroyed records" OR "failure to produce" OR "spoliation"', category: 'missing_data', label: 'Missing Data', pages: 3 },
  { query: '"denial of access" OR "withheld records" OR "exemption" AND "public records"', category: 'access_denied', label: 'Access Denied', pages: 3 },
  // State-specific searches for high-population states
  { query: '"California Public Records Act" OR "CPRA"', category: 'sunshine', label: 'California PRA', pages: 2 },
  { query: '"Texas Public Information Act"', category: 'sunshine', label: 'Texas PIA', pages: 2 },
  { query: '"New York Freedom of Information Law" OR "New York FOIL"', category: 'sunshine', label: 'New York FOIL', pages: 2 },
  { query: '"Florida Public Records Act" OR "Florida Sunshine Law"', category: 'sunshine', label: 'Florida Sunshine', pages: 2 },
  { query: '"Illinois Freedom of Information Act" OR "Illinois FOIA"', category: 'foia', label: 'Illinois FOIA', pages: 2 },
  { query: '"Michigan Freedom of Information Act" OR "Michigan FOIA"', category: 'foia', label: 'Michigan FOIA', pages: 2 },
];

const KEYWORD_TERMS = [
  'freedom of information', 'FOIA', '5 U.S.C. § 552',
  'sunshine law', 'open records', 'public records act', 'open meetings',
  'missing records', 'destroyed records', 'failure to produce', 'spoliation', 'missing public data',
  'denial of access', 'withheld records', 'exemption', 'redacted',
];

function findMatchedKeywords(text) {
  const lower = text.toLowerCase();
  const matched = [];
  for (const term of KEYWORD_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      matched.push(term);
    }
  }
  return [...new Set(matched)];
}

function categorizeCase(text) {
  const lower = text.toLowerCase();
  if (lower.includes('freedom of information') || lower.includes('foia') || lower.includes('5 u.s.c. § 552')) return 'foia';
  if (lower.includes('sunshine law') || lower.includes('open records') || lower.includes('public records act') || lower.includes('open meetings')) return 'sunshine';
  if (lower.includes('missing records') || lower.includes('destroyed records') || lower.includes('failure to produce') || lower.includes('spoliation')) return 'missing_data';
  if (lower.includes('denial of access') || lower.includes('withheld records') || lower.includes('redacted')) return 'access_denied';
  return 'other';
}

function inferJurisdiction(courtId) {
  if (!courtId) return 'federal';
  const id = courtId.toLowerCase();
  if (id.startsWith('scotus') || id.startsWith('ca') || id.includes('district') || id.includes('bankr') || id.includes('fed')) return 'federal';
  if (id.includes('county') || id.includes('municipal')) return 'county';
  return 'state';
}

const STATE_MAP = {
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

function inferState(courtId, courtName) {
  const combined = `${courtId} ${courtName}`.toLowerCase();
  for (const [key, state] of Object.entries(STATE_MAP)) {
    if (combined.includes(key)) return state;
  }
  return '';
}

function clHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (CL_TOKEN) headers['Authorization'] = `Token ${CL_TOKEN}`;
  return headers;
}

async function searchCL(query, page = 1) {
  const url = new URL(`${CL_BASE}/search/`);
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'o');
  url.searchParams.set('page', String(page));
  url.searchParams.set('page_size', '20');

  const res = await fetch(url.toString(), { headers: clHeaders() });
  if (!res.ok) {
    if (res.status === 429) {
      console.log('    Rate limited, waiting 60s...');
      await sleep(60000);
      return searchCL(query, page);
    }
    throw new Error(`CourtListener search failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function upsertCase(item, categoryHint) {
  const text = `${item.caseName || ''} ${item.snippet || ''}`;
  const detectedCategory = categorizeCase(text);
  const category = detectedCategory !== 'other' ? detectedCategory : categoryHint;
  const courtId = item.court_id || '';
  const courtName = item.court || item.court_citation_string || '';

  const values = [
    String(item.cluster_id || item.id),           // courtlistener_id
    item.caseName || 'Untitled',                   // case_name
    courtId,                                        // court_id
    courtName,                                      // court_name
    inferJurisdiction(courtId),                     // jurisdiction_type
    item.dateFiled || null,                         // date_filed
    item.status || 'unknown',                       // status
    item.docketNumber || '',                        // docket_number
    item.suitNature || '',                          // nature_of_suit
    `https://www.courtlistener.com${item.absolute_url || ''}`, // source_url
    findMatchedKeywords(text),                      // matched_keywords
    category,                                       // category
    inferState(courtId, courtName),                 // state
    item.judge ? [item.judge] : [],                 // judges
  ];

  const sql = `
    INSERT INTO cached_cases (
      courtlistener_id, case_name, court_id, court_name, jurisdiction_type,
      date_filed, status, docket_number, nature_of_suit, source_url,
      matched_keywords, category, state, judges
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    ON CONFLICT (courtlistener_id) DO UPDATE SET
      category = CASE WHEN cached_cases.category = 'other' THEN EXCLUDED.category ELSE cached_cases.category END,
      matched_keywords = (
        SELECT ARRAY(SELECT DISTINCT unnest(cached_cases.matched_keywords || EXCLUDED.matched_keywords))
      )
    RETURNING id
  `;

  const res = await pool.query(sql, values);
  return res.rows[0]?.id;
}

async function seed() {
  console.log('Starting SunshineTracker database seed...\n');

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const group of KEYWORD_GROUPS) {
    console.log(`\n[${group.label}] Searching: ${group.query.substring(0, 60)}...`);

    for (let page = 1; page <= group.pages; page++) {
      try {
        console.log(`  Page ${page}/${group.pages}...`);
        const data = await searchCL(group.query, page);

        if (!data.results || data.results.length === 0) {
          console.log('    No more results.');
          break;
        }

        let pageInserted = 0;
        for (const item of data.results) {
          try {
            await upsertCase(item, group.category);
            pageInserted++;
          } catch (err) {
            totalSkipped++;
          }
        }

        totalInserted += pageInserted;
        console.log(`    Cached ${pageInserted} cases (${data.count} total available)`);

        // Respect rate limits: ~750ms between requests
        await sleep(750);

        if (!data.next) {
          console.log('    No more pages.');
          break;
        }
      } catch (err) {
        console.error(`    Error on page ${page}:`, err.message);
        await sleep(2000);
      }
    }
  }

  // Print summary stats
  console.log('\n--- Seed Complete ---');
  console.log(`Total cases cached: ${totalInserted}`);
  console.log(`Skipped/errors: ${totalSkipped}`);

  const stats = await pool.query(`
    SELECT
      count(*) as total,
      count(*) FILTER (WHERE category = 'foia') as foia,
      count(*) FILTER (WHERE category = 'sunshine') as sunshine,
      count(*) FILTER (WHERE category = 'missing_data') as missing_data,
      count(*) FILTER (WHERE category = 'access_denied') as access_denied,
      count(*) FILTER (WHERE category = 'other') as other,
      count(DISTINCT state) FILTER (WHERE state != '') as states
    FROM cached_cases
  `);

  const s = stats.rows[0];
  console.log(`\nDatabase totals:`);
  console.log(`  Total:          ${s.total}`);
  console.log(`  FOIA:           ${s.foia}`);
  console.log(`  Sunshine Laws:  ${s.sunshine}`);
  console.log(`  Missing Data:   ${s.missing_data}`);
  console.log(`  Access Denied:  ${s.access_denied}`);
  console.log(`  Other:          ${s.other}`);
  console.log(`  States covered: ${s.states}`);

  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
