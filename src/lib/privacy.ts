/**
 * privacy.ts — Privacy by Design layer
 * Runs BEFORE any processing. Deterministic only — no AI.
 */

const PII_PATTERNS: { label: string; pattern: RegExp; replacement: string }[] = [
  { label: 'email',   pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
  { label: 'phone',   pattern: /(\+?\d{1,3}[\s\-]?)?(\(?\d{3}\)?[\s\-]?)?\d{3}[\s\-]?\d{4}/g, replacement: '[PHONE]' },
  { label: 'url',     pattern: /https?:\/\/[^\s]+/g, replacement: '[URL]' },
  { label: 'name',    pattern: /\b(my name is|i am|i'm|contact me at|signed|regards|sincerely)[,:\s]+[A-Z][a-z]+(\s[A-Z][a-z]+)?/gi, replacement: '[NAME]' },
  { label: 'address', pattern: /\d{1,5}\s[\w\s]{1,20}(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr)\b/gi, replacement: '[ADDRESS]' },
];

export interface PrivacyResult {
  cleanText: string;
  originalText: string;
  containsPII: boolean;
  detectedTypes: string[];
}

export function stripPII(text: string): PrivacyResult {
  let cleanText = text;
  const detectedTypes: string[] = [];

  for (const { label, pattern, replacement } of PII_PATTERNS) {
    if (pattern.test(cleanText)) {
      detectedTypes.push(label);
      cleanText = cleanText.replace(pattern, replacement);
    }
    pattern.lastIndex = 0;
  }

  return { cleanText, originalText: text, containsPII: detectedTypes.length > 0, detectedTypes };
}

export function anonymizeBatch(texts: string[]): {
  reviews: PrivacyResult[];
  piiCount: number;
  piiRatio: number;
} {
  const reviews = texts.map(stripPII);
  const piiCount = reviews.filter(r => r.containsPII).length;
  return { reviews, piiCount, piiRatio: texts.length > 0 ? piiCount / texts.length : 0 };
}

// Call after calculateRiskScores() — removes tokens from memory before DB save
export function minimizeBatch<T extends { tokens?: string[]; normalizedText?: string }>(
  reviews: T[]
): Omit<T, 'tokens' | 'normalizedText'>[] {
  return reviews.map(({ tokens, normalizedText, ...safe }) => safe);
}