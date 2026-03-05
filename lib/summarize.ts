import { CaseSummary, SummaryFlag, TimelineEvent } from './types';

// --- Rule-based extraction patterns ---

const DATE_PATTERN = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi;
const PARTY_PATTERN = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+v\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
const HOLDING_PATTERNS = [
  /\b(?:we\s+)?(?:hold|conclude|find|determine|rule)\s+that\b[^.]+\./gi,
  /\bit\s+is\s+(?:hereby\s+)?(?:ordered|adjudged|decreed)\s+that\b[^.]+\./gi,
  /\bthe\s+court\s+(?:holds|concludes|finds|determines|rules)\s+that\b[^.]+\./gi,
  /\bjudgment\s+(?:is\s+)?(?:affirmed|reversed|vacated|remanded)\b[^.]+\./gi,
];
const OUTCOME_PATTERNS = [
  /\b(?:affirmed|reversed|vacated|remanded|dismissed|granted|denied|sustained|overruled)\b/i,
  /\bsummary\s+judgment\s+(?:is\s+)?(?:granted|denied)\b[^.]+\./i,
  /\bmotion\s+(?:to\s+\w+\s+)?(?:is\s+)?(?:granted|denied)\b[^.]+\./i,
];

// Journalist-relevant flag patterns
const FLAG_PATTERNS: { type: SummaryFlag['type']; label: string; severity: SummaryFlag['severity']; patterns: RegExp[]; description: string }[] = [
  {
    type: 'ephemeral_messaging',
    label: 'Ephemeral Messaging',
    severity: 'high',
    description: 'Case references ephemeral or auto-deleting messaging platforms, suggesting potential evidence preservation issues.',
    patterns: [
      /\b(?:signal|whatsapp|telegram|snapchat|wickr|confide)\b/i,
      /\b(?:auto[- ]?delet(?:e|ing|ed)|ephemeral\s+messag|disappearing\s+messag|self[- ]?destruct)/i,
    ],
  },
  {
    type: 'record_destruction',
    label: 'Record Destruction',
    severity: 'high',
    description: 'Case involves allegations of record destruction, spoliation, or evidence tampering.',
    patterns: [
      /\b(?:spoliation|spoliated)\b/i,
      /\b(?:shredded|shredding|destroyed|destruction)\s+(?:of\s+)?(?:records|documents|evidence|files)\b/i,
      /\b(?:records|documents|evidence)\s+(?:were\s+)?(?:destroyed|shredded|deleted|wiped|purged)\b/i,
    ],
  },
  {
    type: 'unreasonable_delay',
    label: 'Unreasonable Delay',
    severity: 'medium',
    description: 'Case duration exceeds two years, suggesting unreasonable delay in resolving the matter.',
    patterns: [], // Detected by date comparison, not regex
  },
  {
    type: 'exemption_overuse',
    label: 'Exemption Overuse',
    severity: 'medium',
    description: 'Case cites three or more FOIA exemptions, suggesting broad withholding of records.',
    patterns: [
      /\bexemption\s+\d\b/gi, // Matched individually, counted for threshold
    ],
  },
];

function extractDates(text: string): string[] {
  const matches = text.match(DATE_PATTERN) || [];
  return Array.from(new Set(matches));
}

function extractParties(text: string, caseName: string): string[] {
  const parties = new Set<string>();

  // From case name (e.g., "Smith v. Jones")
  const nameMatch = caseName.match(/^(.+?)\s+v\.?\s+(.+?)(?:\s*$|\s*,)/);
  if (nameMatch) {
    parties.add(nameMatch[1].trim());
    parties.add(nameMatch[2].trim());
  }

  // From opinion text
  let partyMatch;
  const partyRegex = new RegExp(PARTY_PATTERN.source, PARTY_PATTERN.flags);
  while ((partyMatch = partyRegex.exec(text)) !== null) {
    parties.add(partyMatch[1].trim());
    parties.add(partyMatch[2].trim());
  }

  return Array.from(parties).slice(0, 10);
}

function extractKeyFacts(text: string): string[] {
  const facts: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 30 && s.length < 500);

  // Look for factual statements
  const factIndicators = [
    /\bplaintiff\s+(?:filed|submitted|requested|sought)\b/i,
    /\bdefendant\s+(?:refused|denied|failed|withheld)\b/i,
    /\bagency\s+(?:refused|denied|failed|withheld|released|produced)\b/i,
    /\bthe\s+(?:request|appeal|complaint)\s+(?:was|is)\b/i,
    /\brecords?\s+(?:were|was|are|is)\s+(?:withheld|released|produced|denied|requested)\b/i,
    /\bFOIA\s+request/i,
    /\bpublic\s+records?\s+(?:request|act|law)/i,
  ];

  for (const sentence of sentences) {
    if (factIndicators.some((p) => p.test(sentence))) {
      facts.push(sentence.trim());
      if (facts.length >= 5) break;
    }
  }

  return facts;
}

function extractTimeline(text: string, dateFiled: string | null, dateDecided: string | null): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (dateFiled) {
    events.push({ date: dateFiled, description: 'Case filed' });
  }

  // Extract dated events from text
  const dateRegex = /(?:on|dated?|filed|submitted|received)\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/gi;
  let match;
  while ((match = dateRegex.exec(text)) !== null) {
    const contextStart = Math.max(0, match.index - 50);
    const contextEnd = Math.min(text.length, match.index + match[0].length + 100);
    const context = text.slice(contextStart, contextEnd);
    // Get the sentence containing this date
    const sentenceMatch = context.match(/[^.]*\b\w+\b[^.]*/);
    if (sentenceMatch) {
      events.push({
        date: match[1],
        description: sentenceMatch[0].trim().slice(0, 200),
      });
    }
    if (events.length >= 8) break;
  }

  if (dateDecided) {
    events.push({ date: dateDecided, description: 'Decision issued' });
  }

  return events;
}

function extractOutcome(text: string): string {
  // Check the last ~2000 chars for outcome language
  const tail = text.slice(-2000);

  for (const pattern of HOLDING_PATTERNS) {
    const matches = tail.match(pattern);
    if (matches && matches.length > 0) {
      return matches[matches.length - 1].trim();
    }
  }

  // Fall back to outcome keywords
  for (const pattern of OUTCOME_PATTERNS) {
    const match = tail.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  return 'Outcome not clearly identified from opinion text.';
}

function extractLegalIssues(text: string): string[] {
  const issues = new Set<string>();

  const issuePatterns = [
    { pattern: /\bFreedom\s+of\s+Information\s+Act\b/i, label: 'Freedom of Information Act (FOIA)' },
    { pattern: /\bExemption\s+(\d)\b/gi, label: 'FOIA Exemption' },
    { pattern: /\bVaughn\s+index/i, label: 'Vaughn Index requirement' },
    { pattern: /\bin\s+camera\s+review/i, label: 'In camera review' },
    { pattern: /\bsummary\s+judgment/i, label: 'Summary judgment' },
    { pattern: /\bstanding\b/i, label: 'Standing' },
    { pattern: /\bmootness\b/i, label: 'Mootness' },
    { pattern: /\bsovereign\s+immunity/i, label: 'Sovereign immunity' },
    { pattern: /\bdue\s+process/i, label: 'Due process' },
    { pattern: /\bpublic\s+interest/i, label: 'Public interest' },
    { pattern: /\bdeliberat(?:ive|ion)\s+process/i, label: 'Deliberative process privilege' },
    { pattern: /\blaw\s+enforcement/i, label: 'Law enforcement exemption' },
    { pattern: /\bnational\s+security/i, label: 'National security' },
    { pattern: /\bprivacy\b/i, label: 'Privacy concerns' },
    { pattern: /\battorney[- ]client\s+privilege/i, label: 'Attorney-client privilege' },
  ];

  for (const { pattern, label } of issuePatterns) {
    if (pattern.test(text)) {
      issues.add(label);
    }
  }

  return Array.from(issues).slice(0, 10);
}

function detectFlags(text: string, dateFiled: string | null, dateDecided: string | null): SummaryFlag[] {
  const flags: SummaryFlag[] = [];

  // Check ephemeral messaging
  const ephemeralDef = FLAG_PATTERNS.find((f) => f.type === 'ephemeral_messaging')!;
  if (ephemeralDef.patterns.some((p) => p.test(text))) {
    flags.push({
      type: 'ephemeral_messaging',
      label: ephemeralDef.label,
      description: ephemeralDef.description,
      severity: ephemeralDef.severity,
    });
  }

  // Check record destruction
  const destructionDef = FLAG_PATTERNS.find((f) => f.type === 'record_destruction')!;
  if (destructionDef.patterns.some((p) => p.test(text))) {
    flags.push({
      type: 'record_destruction',
      label: destructionDef.label,
      description: destructionDef.description,
      severity: destructionDef.severity,
    });
  }

  // Check unreasonable delay (>2 years between filed and decided)
  if (dateFiled && dateDecided) {
    const filed = new Date(dateFiled);
    const decided = new Date(dateDecided);
    const diffYears = (decided.getTime() - filed.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (diffYears > 2) {
      const delayDef = FLAG_PATTERNS.find((f) => f.type === 'unreasonable_delay')!;
      flags.push({
        type: 'unreasonable_delay',
        label: delayDef.label,
        description: delayDef.description,
        severity: delayDef.severity,
      });
    }
  }

  // Check exemption overuse (3+ distinct exemptions cited)
  const exemptionMatches = text.match(/\bexemption\s+(\d)\b/gi) || [];
  const uniqueExemptions = new Set(exemptionMatches.map((m) => m.toLowerCase()));
  if (uniqueExemptions.size >= 3) {
    const exemptionDef = FLAG_PATTERNS.find((f) => f.type === 'exemption_overuse')!;
    flags.push({
      type: 'exemption_overuse',
      label: exemptionDef.label,
      description: `${uniqueExemptions.size} FOIA exemptions cited. ${exemptionDef.description}`,
      severity: exemptionDef.severity,
    });
  }

  return flags;
}

export function generateRuleBasedSummary(
  opinionText: string,
  caseName: string,
  dateFiled: string | null,
  dateDecided: string | null
): CaseSummary {
  const text = opinionText || '';

  return {
    key_facts: extractKeyFacts(text),
    timeline: extractTimeline(text, dateFiled, dateDecided),
    outcome: extractOutcome(text),
    parties: extractParties(text, caseName),
    legal_issues: extractLegalIssues(text),
    flags: detectFlags(text, dateFiled, dateDecided),
    generated_at: new Date().toISOString(),
    method: 'rule_based',
  };
}

export async function generateClaudeSummary(
  opinionText: string,
  caseName: string,
  dateFiled: string | null,
  dateDecided: string | null
): Promise<CaseSummary | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !opinionText) return null;

  try {
    // Truncate to ~80k chars to stay within token limits
    const truncatedText = opinionText.slice(0, 80000);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Analyze this court opinion and return JSON only (no markdown fences). The case is "${caseName}", filed ${dateFiled || 'unknown'}, decided ${dateDecided || 'unknown'}.

Return this exact JSON structure:
{
  "key_facts": ["up to 5 key factual findings"],
  "timeline": [{"date": "YYYY-MM-DD", "description": "event"}],
  "outcome": "single sentence describing the court's holding/disposition",
  "parties": ["party names"],
  "legal_issues": ["legal issues addressed"],
  "flags": [{"type": "ephemeral_messaging|record_destruction|unreasonable_delay|exemption_overuse", "label": "Short Label", "description": "Why this matters for journalists", "severity": "high|medium|low"}]
}

Flag types to check: ephemeral messaging (Signal, auto-delete, disappearing messages), record destruction (spoliation, shredding, deletion), unreasonable delay (>2 years), exemption overuse (3+ FOIA exemptions).

Opinion text:
${truncatedText}`,
          },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = data.content?.[0]?.text;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      ...parsed,
      generated_at: new Date().toISOString(),
      method: 'claude_api' as const,
    };
  } catch (err) {
    console.error('Claude API summary failed, falling back to rule-based:', err);
    return null;
  }
}

export async function generateSummary(
  opinionText: string,
  caseName: string,
  dateFiled: string | null,
  dateDecided: string | null
): Promise<CaseSummary> {
  // Try Claude API first if available
  const claudeSummary = await generateClaudeSummary(opinionText, caseName, dateFiled, dateDecided);
  if (claudeSummary) return claudeSummary;

  // Fall back to rule-based
  return generateRuleBasedSummary(opinionText, caseName, dateFiled, dateDecided);
}
