export interface StateStatute {
  state: string;
  abbreviation: string;
  statute_name: string;
  search_terms: string[];
}

export const STATE_STATUTES: StateStatute[] = [
  { state: 'Alabama', abbreviation: 'AL', statute_name: 'Alabama Open Records Act', search_terms: ['Alabama Open Records Act'] },
  { state: 'Alaska', abbreviation: 'AK', statute_name: 'Alaska Public Records Act', search_terms: ['Alaska Public Records Act'] },
  { state: 'Arizona', abbreviation: 'AZ', statute_name: 'Arizona Public Records Law', search_terms: ['Arizona Public Records Law'] },
  { state: 'Arkansas', abbreviation: 'AR', statute_name: 'Arkansas Freedom of Information Act', search_terms: ['Arkansas Freedom of Information Act', 'Arkansas FOIA'] },
  { state: 'California', abbreviation: 'CA', statute_name: 'California Public Records Act', search_terms: ['California Public Records Act', 'CPRA'] },
  { state: 'Colorado', abbreviation: 'CO', statute_name: 'Colorado Open Records Act', search_terms: ['Colorado Open Records Act', 'CORA'] },
  { state: 'Connecticut', abbreviation: 'CT', statute_name: 'Connecticut Freedom of Information Act', search_terms: ['Connecticut Freedom of Information Act'] },
  { state: 'Delaware', abbreviation: 'DE', statute_name: 'Delaware Freedom of Information Act', search_terms: ['Delaware Freedom of Information Act'] },
  { state: 'Florida', abbreviation: 'FL', statute_name: 'Florida Public Records Act', search_terms: ['Florida Public Records Act', 'Florida Sunshine Law'] },
  { state: 'Georgia', abbreviation: 'GA', statute_name: 'Georgia Open Records Act', search_terms: ['Georgia Open Records Act'] },
  { state: 'Hawaii', abbreviation: 'HI', statute_name: 'Hawaii Uniform Information Practices Act', search_terms: ['Hawaii Uniform Information Practices Act', 'UIPA'] },
  { state: 'Idaho', abbreviation: 'ID', statute_name: 'Idaho Public Records Act', search_terms: ['Idaho Public Records Act'] },
  { state: 'Illinois', abbreviation: 'IL', statute_name: 'Illinois Freedom of Information Act', search_terms: ['Illinois Freedom of Information Act', 'Illinois FOIA'] },
  { state: 'Indiana', abbreviation: 'IN', statute_name: 'Indiana Access to Public Records Act', search_terms: ['Indiana Access to Public Records Act', 'APRA'] },
  { state: 'Iowa', abbreviation: 'IA', statute_name: 'Iowa Open Records Act', search_terms: ['Iowa Open Records Act'] },
  { state: 'Kansas', abbreviation: 'KS', statute_name: 'Kansas Open Records Act', search_terms: ['Kansas Open Records Act', 'KORA'] },
  { state: 'Kentucky', abbreviation: 'KY', statute_name: 'Kentucky Open Records Act', search_terms: ['Kentucky Open Records Act'] },
  { state: 'Louisiana', abbreviation: 'LA', statute_name: 'Louisiana Public Records Act', search_terms: ['Louisiana Public Records Act'] },
  { state: 'Maine', abbreviation: 'ME', statute_name: 'Maine Freedom of Access Act', search_terms: ['Maine Freedom of Access Act'] },
  { state: 'Maryland', abbreviation: 'MD', statute_name: 'Maryland Public Information Act', search_terms: ['Maryland Public Information Act'] },
  { state: 'Massachusetts', abbreviation: 'MA', statute_name: 'Massachusetts Public Records Law', search_terms: ['Massachusetts Public Records Law'] },
  { state: 'Michigan', abbreviation: 'MI', statute_name: 'Michigan Freedom of Information Act', search_terms: ['Michigan Freedom of Information Act', 'Michigan FOIA'] },
  { state: 'Minnesota', abbreviation: 'MN', statute_name: 'Minnesota Government Data Practices Act', search_terms: ['Minnesota Government Data Practices Act', 'MGDPA'] },
  { state: 'Mississippi', abbreviation: 'MS', statute_name: 'Mississippi Public Records Act', search_terms: ['Mississippi Public Records Act'] },
  { state: 'Missouri', abbreviation: 'MO', statute_name: 'Missouri Sunshine Law', search_terms: ['Missouri Sunshine Law'] },
  { state: 'Montana', abbreviation: 'MT', statute_name: 'Montana Constitution Right to Know', search_terms: ['Montana Right to Know'] },
  { state: 'Nebraska', abbreviation: 'NE', statute_name: 'Nebraska Public Records Statutes', search_terms: ['Nebraska Public Records'] },
  { state: 'Nevada', abbreviation: 'NV', statute_name: 'Nevada Public Records Act', search_terms: ['Nevada Public Records Act'] },
  { state: 'New Hampshire', abbreviation: 'NH', statute_name: 'New Hampshire Right-to-Know Law', search_terms: ['New Hampshire Right-to-Know Law'] },
  { state: 'New Jersey', abbreviation: 'NJ', statute_name: 'New Jersey Open Public Records Act', search_terms: ['New Jersey Open Public Records Act', 'OPRA'] },
  { state: 'New Mexico', abbreviation: 'NM', statute_name: 'New Mexico Inspection of Public Records Act', search_terms: ['New Mexico Inspection of Public Records Act', 'IPRA'] },
  { state: 'New York', abbreviation: 'NY', statute_name: 'New York Freedom of Information Law', search_terms: ['New York Freedom of Information Law', 'New York FOIL'] },
  { state: 'North Carolina', abbreviation: 'NC', statute_name: 'North Carolina Public Records Act', search_terms: ['North Carolina Public Records Act'] },
  { state: 'North Dakota', abbreviation: 'ND', statute_name: 'North Dakota Open Records Statutes', search_terms: ['North Dakota Open Records'] },
  { state: 'Ohio', abbreviation: 'OH', statute_name: 'Ohio Public Records Act', search_terms: ['Ohio Public Records Act'] },
  { state: 'Oklahoma', abbreviation: 'OK', statute_name: 'Oklahoma Open Records Act', search_terms: ['Oklahoma Open Records Act'] },
  { state: 'Oregon', abbreviation: 'OR', statute_name: 'Oregon Public Records Law', search_terms: ['Oregon Public Records Law'] },
  { state: 'Pennsylvania', abbreviation: 'PA', statute_name: 'Pennsylvania Right-to-Know Law', search_terms: ['Pennsylvania Right-to-Know Law'] },
  { state: 'Rhode Island', abbreviation: 'RI', statute_name: 'Rhode Island Access to Public Records Act', search_terms: ['Rhode Island Access to Public Records Act'] },
  { state: 'South Carolina', abbreviation: 'SC', statute_name: 'South Carolina Freedom of Information Act', search_terms: ['South Carolina Freedom of Information Act'] },
  { state: 'South Dakota', abbreviation: 'SD', statute_name: 'South Dakota Open Records Law', search_terms: ['South Dakota Open Records'] },
  { state: 'Tennessee', abbreviation: 'TN', statute_name: 'Tennessee Public Records Act', search_terms: ['Tennessee Public Records Act'] },
  { state: 'Texas', abbreviation: 'TX', statute_name: 'Texas Public Information Act', search_terms: ['Texas Public Information Act', 'TPIA'] },
  { state: 'Utah', abbreviation: 'UT', statute_name: 'Utah Government Records Access and Management Act', search_terms: ['Utah Government Records Access', 'GRAMA'] },
  { state: 'Vermont', abbreviation: 'VT', statute_name: 'Vermont Public Records Act', search_terms: ['Vermont Public Records Act'] },
  { state: 'Virginia', abbreviation: 'VA', statute_name: 'Virginia Freedom of Information Act', search_terms: ['Virginia Freedom of Information Act', 'Virginia FOIA'] },
  { state: 'Washington', abbreviation: 'WA', statute_name: 'Washington Public Records Act', search_terms: ['Washington Public Records Act'] },
  { state: 'West Virginia', abbreviation: 'WV', statute_name: 'West Virginia Freedom of Information Act', search_terms: ['West Virginia Freedom of Information Act'] },
  { state: 'Wisconsin', abbreviation: 'WI', statute_name: 'Wisconsin Open Records Law', search_terms: ['Wisconsin Open Records Law'] },
  { state: 'Wyoming', abbreviation: 'WY', statute_name: 'Wyoming Public Records Act', search_terms: ['Wyoming Public Records Act'] },
];

export const STATE_ABBREVIATIONS = STATE_STATUTES.reduce((acc, s) => {
  acc[s.abbreviation] = s.state;
  return acc;
}, {} as Record<string, string>);

export function getStateByAbbreviation(abbr: string): StateStatute | undefined {
  return STATE_STATUTES.find(s => s.abbreviation === abbr.toUpperCase());
}
