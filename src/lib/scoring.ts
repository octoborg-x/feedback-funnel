/**
 * scoring.ts — Evidence-accumulation scoring engine
 *
 * Academic basis: Signal Detection Theory (Wickens 2002)
 * "An Introduction to Signal Detection Theory"
 *
 * Core principle: Evidence accumulation with threshold-based signal firing.
 * Each signal fires (true/false) and contributes defined points.
 * Scores reflect COUNT of real signals, not arbitrary weighted fractions.
 */

import type { ReviewIR, InputQuality, RiskScores, Theme } from '@/lib/types';
import { analyzeCorpusSentiment, detectSentimentMismatch } from './analysis/sentiment';
import { detectRepeatedPhrases, detectGenericReviews, detectExtremeWithLowDetail, detectPsycholinguisticAnomalies } from './analysis/patterns';
import { getDominantComplaints } from './analysis/themes';
import { analyzeTemporalPatterns, detectSuddenNegativeShift } from './analysis/temporal';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ScoredCategory {
  score: number;
  label: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: ConfidenceLevel;
  evidence: { signal: string; points: number; fact: string }[];
}

export interface DetailedRiskScores extends RiskScores {
  productEvidence: ScoredCategory;
  integrityEvidence: ScoredCategory;
  anomalyEvidence: ScoredCategory;
}

// ─── Score label thresholds ───────────────────────────────────────────────────
function scoreLabel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  return 'HIGH';
}

// ─── Confidence calibration (independent of score) ────────────────────────────
function calibrateConfidence(
  reviewCount: number,
  hasRatings: boolean,
  hasTimestamps: boolean,
  signalCount: number
): ConfidenceLevel {
  if (reviewCount < 20) return 'LOW';
  if (reviewCount >= 50 && hasRatings && signalCount >= 2) return 'HIGH';
  if (reviewCount >= 30 && (hasRatings || hasTimestamps) && signalCount >= 1) return 'HIGH';
  if (reviewCount >= 20) return 'MEDIUM';
  return 'LOW';
}

// ─── SCORE A: Product Experience Risk ─────────────────────────────────────────
function scoreProductRisk(
  themes: Theme[],
  sentiment: ReturnType<typeof analyzeCorpusSentiment>,
  reviews: ReviewIR[],
  quality: InputQuality
): ScoredCategory {
  let points = 0;
  const evidence: ScoredCategory['evidence'] = [];
  let signalsFired = 0;

  const complaints = getDominantComplaints(themes, 0.08);
  const topComplaint = complaints[0];

  // Signal 1: Dominant complaint theme — tiered, not linear (max 35 pts)
  if (topComplaint) {
    const pct = topComplaint.percentage;
    if (pct >= 0.40) {
      points += 35;
      evidence.push({ signal: 'Dominant complaint theme', points: 35, fact: `${Math.round(pct * 100)}% of reviews mention ${topComplaint.name}` });
      signalsFired++;
    } else if (pct >= 0.25) {
      points += 22;
      evidence.push({ signal: 'High-frequency complaint theme', points: 22, fact: `${Math.round(pct * 100)}% of reviews mention ${topComplaint.name}` });
      signalsFired++;
    } else if (pct >= 0.12) {
      points += 12;
      evidence.push({ signal: 'Moderate complaint theme', points: 12, fact: `${Math.round(pct * 100)}% of reviews mention ${topComplaint.name}` });
      signalsFired++;
    }
  }

  // Signal 2: Overall negative sentiment ratio — tiered (max 25 pts)
  const negRatio = sentiment.negativeRatio;
  if (negRatio >= 0.45) {
    points += 25;
    evidence.push({ signal: 'High negative sentiment', points: 25, fact: `${Math.round(negRatio * 100)}% of reviews are negative` });
    signalsFired++;
  } else if (negRatio >= 0.28) {
    points += 15;
    evidence.push({ signal: 'Elevated negative sentiment', points: 15, fact: `${Math.round(negRatio * 100)}% of reviews are negative` });
    signalsFired++;
  } else if (negRatio >= 0.15) {
    points += 7;
    evidence.push({ signal: 'Moderate negative sentiment', points: 7, fact: `${Math.round(negRatio * 100)}% of reviews are negative` });
  }

  // Signal 3: Low ratings ratio (max 25 pts) — only if ratings available
  const ratedReviews = reviews.filter(r => r.rating !== undefined);
  if (ratedReviews.length >= 5) {
    const lowRatingRatio = ratedReviews.filter(r => r.rating! <= 2).length / ratedReviews.length;
    if (lowRatingRatio >= 0.40) {
      points += 25;
      evidence.push({ signal: 'High low-rating ratio', points: 25, fact: `${Math.round(lowRatingRatio * 100)}% of rated reviews are 1-2 stars` });
      signalsFired++;
    } else if (lowRatingRatio >= 0.20) {
      points += 14;
      evidence.push({ signal: 'Elevated low-rating ratio', points: 14, fact: `${Math.round(lowRatingRatio * 100)}% of rated reviews are 1-2 stars` });
      signalsFired++;
    } else if (lowRatingRatio >= 0.10) {
      points += 6;
      evidence.push({ signal: 'Moderate low-rating ratio', points: 6, fact: `${Math.round(lowRatingRatio * 100)}% of rated reviews are 1-2 stars` });
    }
  }

  // Signal 4: Multiple corroborating complaint themes (max 15 pts)
  const significantComplaints = complaints.filter(t => t.percentage >= 0.10);
  if (significantComplaints.length >= 3) {
    points += 15;
    evidence.push({ signal: 'Multiple corroborating complaints', points: 15, fact: `${significantComplaints.length} separate complaint themes detected` });
    signalsFired++;
  } else if (significantComplaints.length === 2) {
    points += 8;
    evidence.push({ signal: 'Two corroborating complaints', points: 8, fact: `2 separate complaint themes detected` });
  }

  const score = Math.min(100, points);

  // Confidence: quality-gated, not score-gated
  const confidence = calibrateConfidence(
    quality.reviewCount,
    quality.ratingCount > 0,
    quality.dateCount > 0,
    signalsFired
  );

  // Low confidence caps score at 60 (can't be HIGH on insufficient data)
  const cappedScore = confidence === 'LOW' ? Math.min(60, score) : score;

  return { score: cappedScore, label: scoreLabel(cappedScore), confidence, evidence };
}

// ─── SCORE B: Review Integrity Risk ───────────────────────────────────────────
function scoreIntegrityRisk(
  repeated: ReturnType<typeof detectRepeatedPhrases>,
  generic: ReturnType<typeof detectGenericReviews>,
  extreme: ReturnType<typeof detectExtremeWithLowDetail>,
  mismatch: ReturnType<typeof detectSentimentMismatch>,
  psycho: ReturnType<typeof detectPsycholinguisticAnomalies>,
  quality: InputQuality
): ScoredCategory {
  let points = 0;
  const evidence: ScoredCategory['evidence'] = [];
  let signalsFired = 0;

  // Signal 1: Significant repeated n-grams (max 30 pts)
  if (repeated.significantCount >= 3) {
    points += 30;
    evidence.push({ signal: 'Coordinated repeated phrasing', points: 30, fact: `${repeated.significantCount} distinct phrases repeated across 3+ reviews` });
    signalsFired++;
  } else if (repeated.significantCount >= 2) {
    points += 20;
    evidence.push({ signal: 'Repeated phrasing detected', points: 20, fact: `${repeated.significantCount} phrases repeated across 3+ reviews` });
    signalsFired++;
  } else if (repeated.significantCount >= 1) {
    points += 10;
    evidence.push({ signal: 'Minor repeated phrasing', points: 10, fact: `1 phrase repeated across multiple reviews` });
  }

  // Signal 2: Generic/low-specificity reviews (max 25 pts)
  if (generic.ratio >= 0.40) {
    points += 25;
    evidence.push({ signal: 'High generic review proportion', points: 25, fact: `${Math.round(generic.ratio * 100)}% of reviews lack specific detail` });
    signalsFired++;
  } else if (generic.ratio >= 0.25) {
    points += 15;
    evidence.push({ signal: 'Elevated generic reviews', points: 15, fact: `${Math.round(generic.ratio * 100)}% of reviews lack specific detail` });
    signalsFired++;
  } else if (generic.ratio >= 0.15) {
    points += 7;
    evidence.push({ signal: 'Some generic reviews', points: 7, fact: `${Math.round(generic.ratio * 100)}% of reviews lack specific detail` });
  }

  // Signal 3: Rating/text mismatch (only if ratings available, max 25 pts)
  if (quality.ratingCount > 0) {
    if (mismatch.ratio >= 0.20) {
      points += 25;
      evidence.push({ signal: 'High rating/text mismatch', points: 25, fact: `${Math.round(mismatch.ratio * 100)}% of reviews have mismatched rating and text sentiment` });
      signalsFired++;
    } else if (mismatch.ratio >= 0.12) {
      points += 15;
      evidence.push({ signal: 'Elevated rating/text mismatch', points: 15, fact: `${Math.round(mismatch.ratio * 100)}% of reviews have mismatched rating and text sentiment` });
      signalsFired++;
    } else if (mismatch.ratio >= 0.07) {
      points += 7;
      evidence.push({ signal: 'Some rating/text mismatch', points: 7, fact: `${Math.round(mismatch.ratio * 100)}% of reviews have mismatched rating and text` });
    }
  }

  // Signal 4: Psycholinguistic anomalies — Ott et al. 2011 (max 20 pts)
  if (psycho.anomalyRatio >= 0.30) {
    points += 20;
    evidence.push({ signal: 'Psycholinguistic anomalies', points: 20, fact: `${Math.round(psycho.anomalyRatio * 100)}% of reviews show deceptive language patterns (Ott et al.)` });
    signalsFired++;
  } else if (psycho.anomalyRatio >= 0.15) {
    points += 10;
    evidence.push({ signal: 'Some psycholinguistic anomalies', points: 10, fact: `${Math.round(psycho.anomalyRatio * 100)}% of reviews show linguistic anomaly patterns` });
  }

  const score = Math.min(100, points);
  const confidence = calibrateConfidence(quality.reviewCount, quality.ratingCount > 0, quality.dateCount > 0, signalsFired);
  const cappedScore = confidence === 'LOW' ? Math.min(55, score) : score;

  return { score: cappedScore, label: scoreLabel(cappedScore), confidence, evidence };
}

// ─── SCORE C: Anomaly Risk ─────────────────────────────────────────────────────
function scoreAnomalyRisk(
  temporal: ReturnType<typeof analyzeTemporalPatterns>,
  shift: ReturnType<typeof detectSuddenNegativeShift>,
  quality: InputQuality
): ScoredCategory {
  let points = 0;
  const evidence: ScoredCategory['evidence'] = [];
  let signalsFired = 0;

  if (!temporal.hasTimestamps) {
    // Without timestamps, anomaly detection is severely limited
    // Return LOW score with explicit note — never invent temporal signals
    return {
      score: 0,
      label: 'LOW',
      confidence: 'LOW',
      evidence: [{ signal: 'No timestamps', points: 0, fact: 'Temporal anomaly detection unavailable without review dates' }],
    };
  }

  // Signal 1: Z-score burst with negative concentration (max 40 pts)
  if (temporal.hasNegativeBurst) {
    const topBurst = temporal.burstWindows.find(b => b.isSignificant && b.negativeRatio >= 0.6);
    if (topBurst) {
      points += 40;
      evidence.push({
        signal: 'Negative review burst',
        points: 40,
        fact: `${topBurst.count} reviews on ${topBurst.date} (Z=${topBurst.zScore}, ${Math.round(topBurst.negativeRatio * 100)}% negative)`,
      });
      signalsFired++;
    }
  } else if (temporal.hasBurst) {
    const topBurst = temporal.burstWindows[0];
    points += 20;
    evidence.push({
      signal: 'Review volume burst',
      points: 20,
      fact: `${topBurst.count} reviews on ${topBurst.date} (Z=${topBurst.zScore})`,
    });
    signalsFired++;
  }

  // Signal 2: Sudden rating decline (max 30 pts)
  if (shift.hasShift) {
    if (shift.dropMagnitude >= 1.5) {
      points += 30;
      evidence.push({
        signal: 'Severe rating decline',
        points: 30,
        fact: `Rating dropped from ${shift.earlyAvg} to ${shift.recentAvg} (drop: ${shift.dropMagnitude} stars)`,
      });
      signalsFired++;
    } else if (shift.dropMagnitude >= 1.0) {
      points += 18;
      evidence.push({
        signal: 'Significant rating decline',
        points: 18,
        fact: `Rating dropped from ${shift.earlyAvg} to ${shift.recentAvg} (drop: ${shift.dropMagnitude} stars)`,
      });
      signalsFired++;
    }
  }

  // Signal 3: Consistent negative trend (max 30 pts)
  if (temporal.ratingTrend === 'declining') {
    points += 20;
    evidence.push({
      signal: 'Declining rating trend',
      points: 20,
      fact: `Rating trend is consistently declining (slope: ${temporal.trendSlope} per review)`,
    });
    signalsFired++;
  }

  const score = Math.min(100, points);
  const confidence = calibrateConfidence(quality.reviewCount, quality.ratingCount > 0, true, signalsFired);

  return { score, label: scoreLabel(score), confidence, evidence };
}

// ─── MAIN EXPORT: calculateRiskScores ─────────────────────────────────────────
export function calculateRiskScores(
  reviews: ReviewIR[],
  themes: Theme[],
  quality: InputQuality
): DetailedRiskScores {
  const sentiment = analyzeCorpusSentiment(reviews);
  const repeated = detectRepeatedPhrases(reviews);
  const generic = detectGenericReviews(reviews);
  const extreme = detectExtremeWithLowDetail(reviews);
  const mismatch = detectSentimentMismatch(reviews);
  const psycho = detectPsycholinguisticAnomalies(reviews);
  const temporal = analyzeTemporalPatterns(reviews);
  const shift = detectSuddenNegativeShift(reviews);

  const productEvidence = scoreProductRisk(themes, sentiment, reviews, quality);
  const integrityEvidence = scoreIntegrityRisk(repeated, generic, extreme, mismatch, psycho, quality);
  const anomalyEvidence = scoreAnomalyRisk(temporal, shift, quality);

  // Scale readiness: weighted by business impact
  // Anomaly = highest urgency (0.40), Product = most common (0.35), Integrity = supporting (0.25)
  const weightedRisk =
    productEvidence.score * 0.35 +
    integrityEvidence.score * 0.25 +
    anomalyEvidence.score * 0.40;
  const scaleReady = Math.round(Math.max(0, 100 - weightedRisk));

  return {
    productRisk: productEvidence.score,
    integrityRisk: integrityEvidence.score,
    anomalyRisk: anomalyEvidence.score,
    scaleReady,
    productEvidence,
    integrityEvidence,
    anomalyEvidence,
  };
}

export function getScoreLabel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  return scoreLabel(score);
}