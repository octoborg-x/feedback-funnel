/**
 * temporal.ts — Z-score burst detection and trend analysis
 *
 * Academic basis:
 * "Finding Deceptive Opinion Spam by Any Stretch of the Imagination"
 * Ott, Choi, Cardie, Hancock — ACL 2011
 *
 * Burst detection method: Z-score (standardized deviation from mean)
 *   Z = (observed_count - mean_daily) / std_daily
 *   Burst threshold: Z > 2.0 (statistically significant at ~95% confidence)
 *
 * Why Z-score beats the prior "> avgPerWeek * 3" approach:
 * - Self-calibrating: adapts to the listing's actual review velocity
 * - A product with 2 reviews/day firing at 6 is different from
 *   a product with 50/day firing at 150 — Z-score handles both correctly
 * - Statistically grounded — not an arbitrary multiplier
 *
 * IMPORTANT: All temporal analysis requires timestamps.
 * If timestamps are absent, return empty results with a clear flag.
 * Do NOT invent time-based signals from non-temporal data.
 */

import type { ReviewIR } from '@/lib/types';

export interface BurstWindow {
  date: string;           // ISO date string of the burst day
  count: number;          // reviews that day
  zScore: number;         // how many standard deviations above mean
  isSignificant: boolean; // z > 2.0
  negativeRatio: number;  // fraction of burst reviews that are negative
}

export interface TemporalAnalysis {
  hasTimestamps: boolean;
  burstWindows: BurstWindow[];
  hasBurst: boolean;
  hasNegativeBurst: boolean;  // burst AND mostly negative
  ratingTrend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  trendSlope: number;         // negative = worsening, positive = improving
  emergingThemeWindow?: {     // only if burst detected
    startDate: string;
    endDate: string;
    reviewCount: number;
  };
}

/**
 * analyzeTemporalPatterns — main entry point
 */
export function analyzeTemporalPatterns(reviews: ReviewIR[]): TemporalAnalysis {
  const datedReviews = reviews.filter(r => r.date instanceof Date && !isNaN(r.date.getTime()));

  if (datedReviews.length < 5) {
    return {
      hasTimestamps: datedReviews.length > 0,
      burstWindows: [],
      hasBurst: false,
      hasNegativeBurst: false,
      ratingTrend: 'insufficient_data',
      trendSlope: 0,
    };
  }

  const sorted = [...datedReviews].sort((a, b) => a.date!.getTime() - b.date!.getTime());
  const burstWindows = detectZScoreBursts(sorted);
  const { trend, slope } = detectRatingTrend(sorted);

  const negativeBursts = burstWindows.filter(b => b.isSignificant && b.negativeRatio >= 0.6);

  // Identify the time window of the most significant burst (for emerging theme detection)
  const topBurst = burstWindows.filter(b => b.isSignificant).sort((a, b) => b.zScore - a.zScore)[0];
  const emergingThemeWindow = topBurst
    ? { startDate: topBurst.date, endDate: topBurst.date, reviewCount: topBurst.count }
    : undefined;

  return {
    hasTimestamps: true,
    burstWindows,
    hasBurst: burstWindows.some(b => b.isSignificant),
    hasNegativeBurst: negativeBursts.length > 0,
    ratingTrend: trend,
    trendSlope: slope,
    emergingThemeWindow,
  };
}

/**
 * detectZScoreBursts — Z-score based burst detection
 *
 * Algorithm:
 * 1. Count reviews per day (ISO date string as key)
 * 2. Compute mean and standard deviation across all days WITH reviews
 * 3. Flag any day where Z = (count - mean) / std > 2.0 as a burst
 *
 * Edge case: if std = 0 (all days have same count), no burst possible.
 */
function detectZScoreBursts(sorted: ReviewIR[]): BurstWindow[] {
  // Count reviews per calendar day
  const dayCounts: Map<string, ReviewIR[]> = new Map();

  for (const review of sorted) {
    const dayKey = review.date!.toISOString().split('T')[0]; // YYYY-MM-DD
    const existing = dayCounts.get(dayKey) || [];
    existing.push(review);
    dayCounts.set(dayKey, existing);
  }

  if (dayCounts.size < 3) return []; // Need at least 3 data points for meaningful std

  const counts = Array.from(dayCounts.values()).map(r => r.length);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;
  const std = Math.sqrt(variance);

  if (std === 0) return []; // All days same — no burst possible

  const bursts: BurstWindow[] = [];

  for (const [date, dayReviews] of dayCounts) {
    const count = dayReviews.length;
    const zScore = (count - mean) / std;
    const isSignificant = zScore > 2.0; // ~95% confidence threshold

    if (isSignificant || zScore > 1.5) { // Surface borderline cases too (not just significant)
      const negativeCount = dayReviews.filter(r => r.sentimentScore < -0.05).length;
      bursts.push({
        date,
        count,
        zScore: Math.round(zScore * 100) / 100,
        isSignificant,
        negativeRatio: count > 0 ? negativeCount / count : 0,
      });
    }
  }

  return bursts.sort((a, b) => b.zScore - a.zScore);
}

/**
 * detectRatingTrend — linear trend in ratings over time
 *
 * Uses linear regression slope on (time_index, rating) pairs.
 * slope < -0.02/review = declining (meaningful degradation)
 * slope > +0.02/review = improving
 *
 * Returns 'insufficient_data' if fewer than 8 rated reviews.
 */
function detectRatingTrend(sorted: ReviewIR[]): {
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  slope: number;
} {
  const ratedReviews = sorted.filter(r => r.rating !== undefined);

  if (ratedReviews.length < 8) {
    return { trend: 'insufficient_data', slope: 0 };
  }

  const n = ratedReviews.length;
  const xs = ratedReviews.map((_, i) => i); // Sequential index as time proxy
  const ys = ratedReviews.map(r => r.rating!);

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
  const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  let trend: 'improving' | 'declining' | 'stable';
  if (slope < -0.02) trend = 'declining';
  else if (slope > 0.02) trend = 'improving';
  else trend = 'stable';

  return { trend, slope: Math.round(slope * 1000) / 1000 };
}

/**
 * detectSuddenNegativeShift — detects if recent period is significantly worse.
 *
 * Compares first half vs second half of review timeline.
 * Requires minimum 10 rated reviews split across both halves.
 */
export function detectSuddenNegativeShift(reviews: ReviewIR[]): {
  hasShift: boolean;
  earlyAvg: number;
  recentAvg: number;
  dropMagnitude: number;
} {
  const dated = reviews
    .filter(r => r.date && r.rating !== undefined)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime());

  if (dated.length < 10) {
    return { hasShift: false, earlyAvg: 0, recentAvg: 0, dropMagnitude: 0 };
  }

  const mid = Math.floor(dated.length / 2);
  const firstHalf = dated.slice(0, mid);
  const secondHalf = dated.slice(mid);

  const avg = (arr: ReviewIR[]) =>
    arr.reduce((sum, r) => sum + r.rating!, 0) / arr.length;

  const earlyAvg = avg(firstHalf);
  const recentAvg = avg(secondHalf);
  const dropMagnitude = earlyAvg - recentAvg;

  // Significant shift = drop > 1.0 star on average (consistent with V2.1 spec threshold)
  return {
    hasShift: dropMagnitude > 1.0,
    earlyAvg: Math.round(earlyAvg * 100) / 100,
    recentAvg: Math.round(recentAvg * 100) / 100,
    dropMagnitude: Math.round(dropMagnitude * 100) / 100,
  };
}