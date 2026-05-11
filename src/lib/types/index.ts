/**
 * types/index.ts — Shared interfaces for the full pipeline
 */

// ─── INPUT ────────────────────────────────────────────────────────────────────

export interface ReviewInput {
  text: string;
  rating?: number;       // 1–5
  date?: string;         // ISO date string YYYY-MM-DD
  verified?: boolean;
}

// ─── NORMALIZED REVIEW (post-parser, post-VADER) ──────────────────────────────

export interface ReviewIR {
  text: string;
  normalizedText: string;
  rating?: number;
  date?: Date;
  verified?: boolean;
  tokens: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;   // VADER compound: -1.0 to +1.0
}

// ─── INPUT QUALITY ────────────────────────────────────────────────────────────

export interface InputQuality {
  reviewCount: number;
  ratingCount: number;
  dateCount: number;
  duplicateRatio: number;
  avgWordCount: number;
  completenessScore: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  warnings: string[];
}

// ─── THEME ────────────────────────────────────────────────────────────────────

export interface Theme {
  name: string;
  keywords: string[];
  count: number;
  percentage: number;
  sentiment: number;      // avg VADER compound for reviews in this theme
}

// ─── RISK SCORES ──────────────────────────────────────────────────────────────

export interface RiskScores {
  productRisk: number;       // 0–100
  integrityRisk: number;     // 0–100
  anomalyRisk: number;       // 0–100
  scaleReady: number;        // 0–100 (inverse weighted risk)
}

// ─── VERDICT ─────────────────────────────────────────────────────────────────

export type VerdictType =
  | 'SAFE_TO_SCALE'
  | 'FIX_PRODUCT_FIRST'
  | 'INVESTIGATE_ANOMALY'
  | 'DO_NOT_SCALE'
  | 'INSUFFICIENT_DATA';

export interface Verdict {
  type: VerdictType;
  reason: string;
  confidence: number;       // 0–1
}

// ─── EVIDENCE ────────────────────────────────────────────────────────────────

export interface Evidence {
  type: 'complaint' | 'praise' | 'pattern' | 'anomaly';
  title: string;
  description: string;
  reviews: string[];        // example quotes or phrases
}

// ─── FULL REPORT ─────────────────────────────────────────────────────────────

export interface AnalysisReport {
  id?: string;
  createdAt?: Date;
  productName?: string;
  quality: InputQuality;
  risks: RiskScores;
  verdict: Verdict;
  themes: Theme[];
  evidence: Evidence[];
  semanticProvider?: string;
}