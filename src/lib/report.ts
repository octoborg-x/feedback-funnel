/**
 * report.ts — Report assembly with graceful semantic fallback
 *
 * Handles two modes:
 * A) Full mode: VADER + themes + LLM semantic (Gemini or Groq)
 * B) Deterministic-only: VADER + themes + patterns (no LLM)
 *
 * Mode B activates automatically when all LLM providers are exhausted.
 * Report still returns valid output — confidence is downgraded, warning added.
 */

import type { AnalysisReport, ReviewIR, InputQuality, Evidence } from '@/lib/types';
import { calculateRiskScores } from './scoring';
import { makeVerdict } from './decision';
import { detectThemes, getDominantComplaints, getDominantPraise } from './analysis/themes';
import { detectRepeatedPhrases } from './analysis/patterns';
import { detectSentimentMismatch } from './analysis/sentiment';
import { runSemanticAnalysis } from './analysis/semantic';

export async function generateReport(
  reviews: ReviewIR[],
  quality: InputQuality
): Promise<Omit<AnalysisReport, 'id' | 'createdAt'>> {

  // Run semantic analysis — may return null if all providers exhausted
  const semantic = await runSemanticAnalysis(reviews);

  // Warn user if deterministic-only mode
  if (!semantic) {
    quality.warnings.push(
      'AI quota reached — theme clustering unavailable. Core signals (sentiment, patterns, burst) still active.'
    );
  }

  const { themes } = detectThemes(reviews);
  const risks = calculateRiskScores(reviews, themes, quality);
  const verdict = makeVerdict(quality, risks);

  const evidence: Evidence[] = [];

  // Product complaints
  for (const complaint of getDominantComplaints(themes, 0.10).slice(0, 3)) {
    evidence.push({
      type: 'complaint',
      title: `${complaint.name} Issues`,
      description: `${Math.round(complaint.percentage * 100)}% of reviews mention ${complaint.name.toLowerCase()} problems`,
      reviews: [],
    });
  }

  // Love signals
  for (const praise of getDominantPraise(themes, 0.10).slice(0, 2)) {
    evidence.push({
      type: 'praise',
      title: `${praise.name} — Users Love This`,
      description: `${Math.round(praise.percentage * 100)}% of reviews praise ${praise.name.toLowerCase()}`,
      reviews: [],
    });
  }

  // LLM-derived themes (only in full mode)
  if (semantic) {
    for (const theme of semantic.themes.slice(0, 3)) {
      evidence.push({
        type: theme.sentiment === 'positive' ? 'praise' : 'complaint',
        title: theme.name,
        description: theme.description,
        reviews: [],
      });
    }

    // Coordination signals
    if (semantic.coordinationSignals.length > 0) {
      evidence.push({
        type: 'anomaly',
        title: 'Coordination Signals Detected',
        description: `${semantic.coordinationSignals.length} group(s) of reviews show similar patterns`,
        reviews: semantic.coordinationSignals.map(s => s.reason),
      });
    }
  }

  // Pattern evidence (always available — deterministic)
  const repeated = detectRepeatedPhrases(reviews);
  if (repeated.significantCount >= 1) {
    evidence.push({
      type: 'pattern',
      title: 'Repeated Phrasing Detected',
      description: `${repeated.significantCount} phrase(s) appear across 3+ reviews`,
      reviews: repeated.repeated.filter(r => r.isSignificant).slice(0, 3).map(r => r.phrase),
    });
  }

  // Mismatch evidence (always available — deterministic)
  const mismatch = detectSentimentMismatch(reviews);
  if (mismatch.ratio >= 0.10) {
    evidence.push({
      type: 'anomaly',
      title: 'Rating/Text Mismatch',
      description: `${Math.round(mismatch.ratio * 100)}% of reviews have mismatched rating and text sentiment`,
      reviews: mismatch.mismatches.slice(0, 3).map(m => m.review),
    });
  }

  return {
    productName: undefined,
    quality,
    risks,
    verdict,
    themes,
    evidence,
    semanticProvider: semantic?.provider ?? 'deterministic-only',
  };
}