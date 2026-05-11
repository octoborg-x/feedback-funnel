/**
 * decision.ts — Verdict engine
 *
 * Rules applied in strict priority order.
 * No LLM involvement — purely deterministic.
 * Every verdict includes a reason and confidence level.
 */

import type { InputQuality, RiskScores, Verdict } from '@/lib/types';

export function makeVerdict(quality: InputQuality, risks: RiskScores): Verdict {
  const { productRisk, integrityRisk, anomalyRisk } = risks;

  // Rule 1: Insufficient data — always wins
  if (quality.level === 'LOW' && quality.reviewCount < 20) {
    return {
      type: 'INSUFFICIENT_DATA',
      reason: 'Sample too small for reliable analysis. Add at least 20 reviews.',
      confidence: 0.2,
    };
  }

  if (quality.level === 'LOW') {
    return {
      type: 'INSUFFICIENT_DATA',
      reason: 'Missing metadata (ratings, dates) prevents reliable scoring.',
      confidence: 0.3,
    };
  }

  // Rule 2: Both product AND anomaly high — highest urgency
  if (productRisk > 65 && anomalyRisk > 60) {
    return {
      type: 'DO_NOT_SCALE',
      reason: 'High product issues AND listing anomaly signals detected simultaneously.',
      confidence: confidenceFromQuality(quality),
    };
  }

  // Rule 3: Anomaly risk dominant
  if (anomalyRisk > 60 || (anomalyRisk > 45 && integrityRisk > 50)) {
    return {
      type: 'INVESTIGATE_ANOMALY',
      reason: 'Review patterns are inconsistent with organic activity. Investigate before scaling.',
      confidence: confidenceFromQuality(quality),
    };
  }

  // Rule 4: Product issues dominant
  if (productRisk > 60) {
    return {
      type: 'FIX_PRODUCT_FIRST',
      reason: 'Significant product complaints detected. Resolve before scaling ad spend.',
      confidence: confidenceFromQuality(quality),
    };
  }

  // Rule 5: All clear
  if (productRisk < 30 && anomalyRisk < 30 && integrityRisk < 40 && quality.level === 'HIGH') {
    return {
      type: 'SAFE_TO_SCALE',
      reason: 'No significant product issues or anomaly signals detected.',
      confidence: confidenceFromQuality(quality),
    };
  }

  // Default: moderate issues present
  return {
    type: 'FIX_PRODUCT_FIRST',
    reason: 'Mixed signals detected. Resolve product feedback before scaling.',
    confidence: confidenceFromQuality(quality) * 0.8,
  };
}

function confidenceFromQuality(quality: InputQuality): number {
  if (quality.level === 'HIGH') return 0.85;
  if (quality.level === 'MEDIUM') return 0.60;
  return 0.35;
}