export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface CachedCase {
  id: string;
  courtlistener_id: string;
  case_name: string;
  court_id: string;
  court_name: string;
  jurisdiction_type: string;
  date_filed: string | null;
  date_decided: string | null;
  status: string;
  opinion_text: string;
  opinion_html: string;
  citations: any;
  judges: string[];
  docket_number: string;
  nature_of_suit: string;
  source_url: string;
  matched_keywords: string[];
  category: string;
  state: string;
  summary: CaseSummary | null;
  fetched_at: string;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  case_count?: number;
}

export interface CollectionCase {
  collection_id: string;
  case_id: string;
  added_at: string;
}

export interface Annotation {
  id: string;
  user_id: string;
  case_id: string;
  note: string;
  tags: string[];
  created_at: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  query: string;
  filters: any;
  alert_enabled: boolean;
  last_run_at: string | null;
  created_at: string;
}

export interface SearchFilters {
  category?: string;
  jurisdiction_type?: string;
  state?: string;
  date_from?: string;
  date_to?: string;
  court?: string;
}

export interface SearchResult {
  cases: CachedCase[];
  total: number;
  page: number;
  per_page: number;
}

export interface TrendData {
  year: string;
  count: number;
  category?: string;
  jurisdiction_type?: string;
  state?: string;
}

export interface CLSearchResult {
  count: number;
  next: string | null;
  previous: string | null;
  results: CLOpinion[];
}

export interface CLOpinion {
  id: number;
  absolute_url: string;
  cluster: string;
  author_str: string;
  plain_text: string;
  html: string;
  html_with_citations: string;
  date_created: string;
  date_modified: string;
}

export interface CLCluster {
  id: number;
  absolute_url: string;
  case_name: string;
  date_filed: string;
  docket: string;
  judges: string;
  nature_of_suit: string;
  citation_count: number;
  precedential_status: string;
  sub_opinions: CLOpinion[];
}

export interface CLDocket {
  id: number;
  absolute_url: string;
  case_name: string;
  court: string;
  court_id: string;
  date_filed: string;
  docket_number: string;
  nature_of_suit: string;
}

export interface TimelineEvent {
  date: string;
  description: string;
}

export interface SummaryFlag {
  type: 'ephemeral_messaging' | 'record_destruction' | 'unreasonable_delay' | 'exemption_overuse';
  label: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface CaseSummary {
  key_facts: string[];
  timeline: TimelineEvent[];
  outcome: string;
  parties: string[];
  legal_issues: string[];
  flags: SummaryFlag[];
  generated_at: string;
  method: 'rule_based' | 'claude_api';
}
