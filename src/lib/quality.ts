/**
 * quality.ts — Input Quality Scoring
 * Deterministic. Runs before any analysis.
 */

import type { ReviewInput, InputQuality } from '@/lib/types';

export function scoreInputQuality(inputs: ReviewInput[]): InputQuality {
  const reviewCount = inputs.length;
  const ratingCount = inputs.filter(r => r.rating !== undefined).length;
  const dateCount = inputs.filter(r => r.date !== undefined).length;

  // Duplicate detection
  const texts = inputs.map(r => r.text.trim().toLowerCase());
  const unique = new Set(texts);
  const duplicateRatio = reviewCount > 0 ? (reviewCount - unique.size) / reviewCount : 0;

  // Word count
  const wordCounts = inputs.map(r => r.text.split(/\s+/).filter(Boolean).length);
  const avgWordCount = wordCounts.reduce((a, b) => a + b, 0) / (reviewCount || 1);

  // Completeness score (0-1)
  const hasRatings = ratingCount / (reviewCount || 1) >= 0.5;
  const hasDates = dateCount / (reviewCount || 1) >= 0.5;
  const completenessScore =
    0.5 +
    (hasRatings ? 0.25 : 0) +
    (hasDates ? 0.25 : 0);

  // Quality level
  let level: 'HIGH' | 'MEDIUM' | 'LOW';
  if (reviewCount >= 30 && hasRatings) level = 'HIGH';
  else if (reviewCount >= 20 || (reviewCount >= 15 && hasRatings)) level = 'MEDIUM';
  else level = 'LOW';

  // Warnings
  const warnings: string[] = [];
  if (reviewCount < 20) warnings.push('Small sample — results may not reflect true patterns.');
  if (!hasRatings) warnings.push('No ratings — mismatch detection unavailable.');
  if (!hasDates) warnings.push('No dates — burst detection unavailable.');
  if (duplicateRatio > 0.2) warnings.push(`${Math.round(duplicateRatio * 100)}% duplicate reviews detected.`);

  return {
    reviewCount,
    ratingCount,
    dateCount,
    duplicateRatio,
    avgWordCount,
    completenessScore,
    level,
    warnings,
  };
}