/**
 * parser.ts — Input parsing and normalization
 * UPDATED: uses vaderScore() from sentiment.ts (replaces broken sentimentScore())
 */

import type { ReviewInput, ReviewIR } from '@/lib/types';
import { vaderScore, classifySentiment } from './analysis/sentiment';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his',
  'her', 'its', 'our', 'their', 'to', 'of', 'in', 'for', 'on', 'with',
  'this', 'that', 'these', 'those', 'have', 'has', 'had', 'do', 'does', 'did'
]);

export function parseTextInput(text: string): ReviewInput[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(text => ({ text }));
}

export function parseCSVInput(csv: string): ReviewInput[] {
  const lines = csv.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  const idx = (col: string) => headers.indexOf(col);

  return lines.slice(1).map(line => {
    const cols = parseCSVLine(line);
    const dateStr = idx('date') >= 0 ? cols[idx('date')] : undefined;
    return {
      text: idx('text') >= 0 ? cols[idx('text')] : '',
      rating: idx('rating') >= 0 ? parseInt(cols[idx('rating')]) || undefined : undefined,
      date: dateStr ? parseDate(dateStr) : undefined,
      verified: idx('verified') >= 0 ? cols[idx('verified')] === 'true' : undefined,
    };
  }).filter(r => r.text);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else current += char;
  }
  result.push(current.trim());
  return result;
}

function parseDate(str: string): string | undefined {
  const date = new Date(str);
  return isNaN(date.getTime()) ? undefined : date.toISOString().split('T')[0];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w));
}

export function normalizeReview(input: ReviewInput): ReviewIR {
  const text = input.text.trim();
  const compound = vaderScore(text); // ← VADER replaces old sentimentScore()
  return {
    text,
    normalizedText: text.toLowerCase(),
    rating: input.rating,
    date: input.date ? new Date(input.date) : undefined,
    verified: input.verified,
    tokens: tokenize(text),
    sentiment: classifySentiment(compound),
    sentimentScore: compound,
  };
}

export function extractRatings(inputs: ReviewInput[]): number[] {
  return inputs
    .map(i => i.rating)
    .filter((r): r is number => r !== undefined && r >= 1 && r <= 5);
}