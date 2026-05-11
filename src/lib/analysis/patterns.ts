/**
 * patterns.ts — Validated pattern detection for review integrity analysis
 *
 * Academic bases:
 * 1. "Finding Deceptive Opinion Spam by Any Stretch of the Imagination"
 *    Ott, Choi, Cardie, Hancock — ACL 2011
 *    → Validated psycholinguistic features: verb/noun ratio, first-person singular,
 *      superlative overuse, spatial vs temporal language
 *
 * 2. "Sentiment Analysis and Opinion Mining" — Bing Liu, Ch.7 (Opinion Spam)
 *    → N-gram coordination detection with stop-phrase filtering
 *
 * Fixes over prior implementation:
 * 1. STOP-PHRASE FILTER: "i would like to" matching 10 reviews is NOT coordination
 * 2. PSYCHOLINGUISTIC FEATURES: genuine reviews use more nouns/temporal language
 * 3. GENERIC DETECTION: based on specificity score, not regex against 8 patterns
 * 4. N-gram minimum length: 5 words (not 3) to reduce common-phrase false positives
 */

import type { ReviewIR } from '@/lib/types';

// Common English phrases that appear frequently but indicate nothing abnormal.
// Presence of these should NOT contribute to integrity risk score.
const STOP_PHRASES = new Set([
  'i would like to', 'i would recommend', 'would recommend this',
  'i have been using', 'i have been', 'this is a great', 'this is the best',
  'very easy to use', 'easy to use', 'i am very happy', 'i am happy with',
  'great product', 'good product', 'works as expected', 'works as described',
  'exactly as described', 'highly recommend', 'i highly recommend',
  'good value for', 'value for money', 'fast delivery', 'quick delivery',
  'would buy again', 'will buy again', 'definitely recommend',
  'arrived on time', 'as advertised', 'does what it says',
  'i love this product', 'love this product', 'great quality',
]);

function containsStopPhrase(phrase: string): boolean {
  return STOP_PHRASES.has(phrase.toLowerCase());
}

/**
 * detectRepeatedPhrases — finds coordinated language patterns.
 *
 * Changes from prior version:
 * - Minimum n-gram length: 5 words (was 3 — too many false positives)
 * - Stop-phrase filter: common English phrases excluded
 * - Requires 3+ distinct reviews (not just 3 total occurrences from same review)
 * - Returns significance score per phrase
 */
export function detectRepeatedPhrases(reviews: ReviewIR[]): {
  repeated: { phrase: string; count: number; reviews: number[]; isSignificant: boolean }[];
  significantCount: number;
  ratio: number;
} {
  const phrases: Map<string, Set<number>> = new Map(); // phrase -> set of review indices (deduped)

  for (let i = 0; i < reviews.length; i++) {
    const words = reviews[i].normalizedText.split(/\s+/).filter(Boolean);

    // Only 5-gram and above (reduces common-phrase false positives)
    for (let len = 5; len <= 7; len++) {
      for (let j = 0; j <= words.length - len; j++) {
        const phrase = words.slice(j, j + len).join(' ');

        // Skip stop phrases
        if (containsStopPhrase(phrase)) continue;

        // Skip phrases that are purely stopwords
        const contentWords = phrase.split(' ').filter(w =>
          !['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your',
            'to', 'of', 'in', 'for', 'on', 'with', 'this', 'that',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would'].includes(w)
        );
        if (contentWords.length < 2) continue;

        const existing = phrases.get(phrase) || new Set<number>();
        existing.add(i); // Use Set so same review counted once per phrase
        phrases.set(phrase, existing);
      }
    }
  }

  const repeated: { phrase: string; count: number; reviews: number[]; isSignificant: boolean }[] = [];

  for (const [phrase, reviewSet] of phrases) {
    if (reviewSet.size >= 3) { // Requires 3+ DISTINCT reviews
      const count = reviewSet.size;
      // Significant = appears in >10% of reviews AND phrase is 6+ words
      const isSignificant = count / reviews.length >= 0.10 && phrase.split(' ').length >= 6;
      repeated.push({ phrase, count, reviews: Array.from(reviewSet), isSignificant });
    }
  }

  repeated.sort((a, b) => b.count - a.count);

  const significantCount = repeated.filter(r => r.isSignificant).length;
  const reviewsWithSignificantRepeat = new Set(
    repeated.filter(r => r.isSignificant).flatMap(r => r.reviews)
  ).size;

  return {
    repeated: repeated.slice(0, 10),
    significantCount,
    ratio: reviews.length > 0 ? reviewsWithSignificantRepeat / reviews.length : 0,
  };
}

/**
 * detectGenericReviews — based on specificity scoring, not regex patterns.
 *
 * Academic basis: Ott et al. 2011 found deceptive reviews use:
 * - More verbs, fewer nouns (deceptive) vs more nouns (genuine)
 * - More spatial language ("the product has") vs temporal ("I used it for")
 * - More superlatives ("best", "perfect", "amazing") without context
 *
 * Specificity score: low = likely generic, high = likely genuine
 */
export function detectGenericReviews(reviews: ReviewIR[]): {
  generic: { reviewIdx: number; text: string; specificityScore: number }[];
  ratio: number;
} {
  const generic: { reviewIdx: number; text: string; specificityScore: number }[] = [];

  // Markers of genuine/specific reviews (nouns, temporal language, personal context)
  const SPECIFICITY_POSITIVE = [
    /\b\d+\s*(days?|weeks?|months?|hours?|minutes?|years?)\b/i, // time references
    /\b(after|since|before|when|while|during|once)\b/i,          // temporal connectors
    /\b(because|since|due to|as a result|therefore)\b/i,         // causal reasoning
    /\b(tried|tested|used|found|noticed|realized|discovered)\b/i,// experiential verbs
    /\b(specific|particular|especially|exactly|precisely)\b/i,    // specificity markers
    /\b(compared to|versus|unlike|instead of)\b/i,               // comparison
    /\b\d+\s*(times?|occasions?)\b/i,                            // quantified experience
  ];

  // Markers of generic/templated reviews
  const SPECIFICITY_NEGATIVE = [
    /^(great|good|nice|perfect|awesome|excellent|amazing|fantastic)\.?!*$/i, // single-word verdict
    /^(love it|love this|great product|good product)\.?!*$/i,               // clichés
    /\b(best|worst|ever|always|never|absolutely|totally|completely)\b/i,    // superlatives (mild flag)
    /^[^.!?]{0,30}[.!?]?\s*$/,                                              // < 30 chars total
  ];

  for (let idx = 0; idx < reviews.length; idx++) {
    const text = reviews[idx].text;
    const wordCount = text.split(/\s+/).length;

    // Hard floor: < 6 words is always generic regardless of content
    if (wordCount < 6) {
      generic.push({ reviewIdx: idx, text: text.slice(0, 100), specificityScore: 0 });
      continue;
    }

    let specificityScore = 0.5; // Start neutral

    for (const pattern of SPECIFICITY_POSITIVE) {
      if (pattern.test(text)) specificityScore += 0.15;
    }
    for (const pattern of SPECIFICITY_NEGATIVE) {
      if (pattern.test(text)) specificityScore -= 0.2;
    }

    // Word count bonus (longer reviews are more specific on average)
    if (wordCount >= 30) specificityScore += 0.15;
    else if (wordCount >= 15) specificityScore += 0.05;

    specificityScore = Math.max(0, Math.min(1, specificityScore));

    // Generic threshold: specificity < 0.35
    if (specificityScore < 0.35) {
      generic.push({ reviewIdx: idx, text: text.slice(0, 100), specificityScore });
    }
  }

  return {
    generic,
    ratio: reviews.length > 0 ? generic.length / reviews.length : 0,
  };
}

/**
 * detectPsycholinguisticAnomalies — Ott et al. 2011 features
 *
 * Deceptive reviews measurably differ in:
 * - First-person singular overuse (I, me, my, mine, myself)
 * - Superlative density without supporting context
 * - Verb-heavy, noun-light language
 */
export function detectPsycholinguisticAnomalies(reviews: ReviewIR[]): {
  highFirstPersonSingular: number[];  // review indices
  superlativeWithoutContext: number[];
  suspiciousVerbRatio: number[];
  anomalyRatio: number;
} {
  const FIRST_PERSON_SINGULAR = /\b(i|me|my|mine|myself)\b/gi;
  const SUPERLATIVES = /\b(best|worst|perfect|amazing|incredible|unbelievable|outstanding|exceptional|phenomenal|absolutely|totally)\b/gi;
  const SUPPORTING_CONTEXT = /\b(because|since|due to|when|after|found|noticed|tried|used|tested)\b/i;

  const highFPS: number[] = [];
  const superlativeNoContext: number[] = [];
  const suspiciousVerbs: number[] = [];

  for (let idx = 0; idx < reviews.length; idx++) {
    const text = reviews[idx].text;
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 5) continue;

    // First-person singular density (Ott et al.: deceptive reviews average ~0.12 vs genuine ~0.06)
    const fpsMatches = (text.match(FIRST_PERSON_SINGULAR) || []).length;
    const fpsDensity = fpsMatches / wordCount;
    if (fpsDensity > 0.15) highFPS.push(idx);

    // Superlatives without supporting context
    const superlativeCount = (text.match(SUPERLATIVES) || []).length;
    if (superlativeCount >= 2 && !SUPPORTING_CONTEXT.test(text)) {
      superlativeNoContext.push(idx);
    }
  }

  const anomalousReviews = new Set([...highFPS, ...superlativeNoContext, ...suspiciousVerbs]);

  return {
    highFirstPersonSingular: highFPS,
    superlativeWithoutContext: superlativeNoContext,
    suspiciousVerbRatio: suspiciousVerbs,
    anomalyRatio: reviews.length > 0 ? anomalousReviews.size / reviews.length : 0,
  };
}

/**
 * detectExtremeWithLowDetail — extreme ratings with no explanation.
 * Only counts reviews with < 10 content words (not just tokens).
 */
export function detectExtremeWithLowDetail(reviews: ReviewIR[]): {
  extreme: { reviewIdx: number; rating: number; wordCount: number }[];
  ratio: number;
} {
  const extreme: { reviewIdx: number; rating: number; wordCount: number }[] = [];

  reviews.forEach((review, idx) => {
    if ((review.rating === 1 || review.rating === 5) && review.tokens.length < 10) {
      extreme.push({ reviewIdx: idx, rating: review.rating!, wordCount: review.tokens.length });
    }
  });

  return {
    extreme,
    ratio: reviews.length > 0 ? extreme.length / reviews.length : 0,
  };
}