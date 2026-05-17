# RIE $0 Analysis Engine Specification

## Purpose

This document defines the zero-cost analysis engine. It must work without paid APIs, external LLMs, scraping services, or cloud databases.

## Design principle

The engine must be:

- Deterministic
- Explainable
- Offline-capable
- Testable
- Conservative in claims

It should not say “this is fake” or “this is a competitor attack.” It should say:

- “Review integrity risk is elevated.”
- “Listing anomaly risk is high.”
- “Investigate before scaling.”

## Pipeline

```text
Raw input
  -> Parse
  -> Normalize
  -> Data quality score
  -> Problem framing
  -> Signal extraction
  -> Noise filtering
  -> Sentiment scoring
  -> Theme extraction
  -> Pattern detection
  -> Root cause synthesis
  -> Business translation
  -> Time analysis
  -> Risk scoring
  -> Decision engine
  -> Report builder
```

## 0. Reasoning contract

The engine should follow a consistent reasoning sequence so weaker models or deterministic code can still produce structured output.

### Step 1 — Problem framing

Identify:

- Product/listing being analyzed
- Seller intent
- Review data quality
- Main analysis type:
  - Pain discovery
  - Product validation
  - Feature extraction
  - Risk detection
  - Scale-readiness decision

### Step 2 — Signal extraction

Extract:

- Explicit pain points
- Repeated patterns
- Rating/text contradictions
- Missing expectations
- Product-specific complaints
- Review-integrity signals
- Listing-anomaly signals

Tone-based inference can be used, but it must be labeled as inference.

### Step 3 — Signal scoring

Score each signal using:

- Frequency
- Intensity
- Specificity
- Business impact
- Confidence

Use LOW/MEDIUM/HIGH plus numeric 0–100 where useful.

### Step 4 — Noise filtering

Reduce priority for:

- Generic praise
- Vague complaints
- Isolated one-off complaints
- Non-actionable feedback
- Low-detail extreme ratings

Prioritize:

- Specific complaints
- Repeated friction points
- High-impact problems
- Patterns supported by metadata

### Step 5 — Synthesis

Convert signals into:

- Core problems
- Likely root causes
- Affected customer expectations
- Opportunity areas

### Step 6 — Business translation

Transform findings into:

- What to fix
- What to ignore
- What to monitor
- Whether to scale, pause, or investigate
- Potential SaaS/product opportunities if the app is used for broader review research

## 0.1 Facts, inferences, assumptions, uncertainties

Every report must separate:

- **Facts**: directly observed counts, ratings, dates, phrases.
- **Inferences**: likely themes or root causes.
- **Assumptions**: needed because data is incomplete.
- **Uncertainties**: what cannot be concluded from the input.

Never fabricate statistics or missing metadata.

## 1. Input

```ts
interface ReviewInput {
  text: string;
  rating?: number;
  date?: string;
  verified?: boolean;
  reviewerId?: string;
}
```

Validation:

- `text` is required.
- `rating` must be 1–5 if present.
- `date` should parse as valid date if present.
- Empty reviews are ignored with warning.

## 2. Internal representation

```ts
interface ReviewIR {
  id: string;
  text: string;
  normalizedText: string;
  rating: number | null;
  date: Date | null;
  verified: boolean | null;
  reviewerId: string | null;
  wordCount: number;
  tokens: string[];
  sentiment: number;
  hasRatingTextMismatch: boolean;
  isGenericShort: boolean;
  themeIds: string[];
}
```

## 3. Text normalization

Steps:

1. Lowercase text
2. Remove URLs
3. Remove excessive punctuation
4. Normalize whitespace
5. Tokenize
6. Remove stopwords
7. Keep meaningful product words

Stopwords can be a local TypeScript array.

## 4. Sentiment scoring

Use a free local lexicon.

Create:

- `positiveWords`
- `negativeWords`
- `intensifiers`
- `negations`

Example:

```ts
sentiment = (positiveCount - negativeCount) / meaningfulTokenCount
```

Clamp to:

```text
-1 to +1
```

Rules:

- If text has “not good”, treat as negative.
- If text has “not bad”, treat as mildly positive/neutral.
- If text has strong negative words like “broken”, “defective”, “dangerous”, boost negative score.

## 5. Rating/text mismatch

Mismatch if:

- Sentiment > 0.15 and rating <= 2
- Sentiment < -0.15 and rating >= 4

Output:

- Count
- Percentage
- Example reviews

## 6. Generic short detection

Generic short review if:

- Word count < 15
- AND lacks product-specific terms

Examples:

- “Great product”
- “Very bad”
- “Works fine”

Do not treat every short review as suspicious. Short can be normal. Use it as one signal only.

## 7. Repeated phrase detection

Generate n-grams:

- 3-word phrases
- 4-word phrases
- 5-word phrases

Ignore phrases made mostly of stopwords.

Flag:

- Same 4+ word phrase appears in 3+ reviews
- Same normalized text appears in 2+ reviews

Output:

```ts
interface RepeatedPhraseSignal {
  phrase: string;
  count: number;
  reviewIds: string[];
}
```

## 8. Theme extraction

Zero-cost MVP approach:

Use dictionary-assisted clustering.

### Theme dictionaries

Create dictionaries for common Amazon complaint areas:

- Durability
- Size/fit
- Battery/power
- Smell/chemical
- Packaging
- Delivery
- Missing parts
- Quality/material
- Usability
- Noise
- Heat/safety
- Listing mismatch
- Price/value
- Customer support

Each theme has keywords.

Example:

```ts
const THEMES = {
  durability: ["broke", "broken", "crack", "cracked", "durable", "lasted"],
  packaging: ["package", "box", "damaged", "arrived", "shipping"],
  sizeFit: ["small", "large", "tight", "loose", "fit", "size"],
};
```

### Theme assignment

For each review:

- Count theme keyword matches.
- Assign top 1–3 themes.
- If no theme matches, assign `general`.

### Theme metrics

For each theme:

- Review count
- Frequency %
- Average rating
- Average sentiment
- Example quotes

## 9. Product-specific language score

Measure whether review includes:

- Specific nouns
- Measurements
- Use-case words
- Product-related terms
- Concrete defect words

Low specificity + extreme rating can increase review integrity risk.

## 10. Time analysis

Only if dates are present.

### Burst detection

Flag burst if:

- More than 5 reviews in any 48-hour window
- OR more than 30% of reviews occur in 7 days

### Sentiment shift

Flag shift if:

- Average rating drops by more than 1 star between adjacent time windows
- OR negative review ratio increases by 30+ percentage points

### New theme detection

If a theme appears mostly after a certain date:

- More than 70% of theme mentions occur in the later half of timeline
- Theme frequency > 15%

## 11. Delivery / packaging anomaly

Delivery complaints:

- 1–2 isolated mentions: logistics noise
- 3+ mentions: product/fulfillment issue
- 3+ mentions in burst window: anomaly signal

## 12. Risk scoring

### Product Experience Risk

```text
dominantThemeScore = maxThemeFrequency
negativeSentimentScore = negativeReviews / totalReviews
lowRatingScore = reviewsWithRating <= 2 / ratedReviews
persistenceScore = issueSpreadAcrossTime

ProductRisk =
  0.40 * dominantThemeScore +
  0.25 * negativeSentimentScore +
  0.20 * lowRatingScore +
  0.15 * persistenceScore
```

Convert to 0–100.

### Review Integrity Risk

```text
ReviewIntegrityRisk =
  0.30 * repeatedPhraseRatio +
  0.25 * genericShortRatio +
  0.25 * mismatchRatio +
  0.20 * extremeLowDetailRatio
```

Convert to 0–100.

### Listing Anomaly Risk

```text
ListingAnomalyRisk =
  0.40 * burstSignal +
  0.25 * suddenNegativeShift +
  0.20 * newThemeConcentration +
  0.15 * deliveryBurstSignal
```

Convert to 0–100.

If no dates exist:

- Cap Listing Anomaly Risk at 60.
- Confidence max is MEDIUM.

### Scale Readiness

```text
weightedRisk =
  0.45 * ProductRisk +
  0.25 * ReviewIntegrityRisk +
  0.30 * ListingAnomalyRisk

ScaleReadiness = 100 - weightedRisk
```

## 13. Score labels

For risk scores:

- 0–30: LOW
- 31–60: MEDIUM
- 61–100: HIGH

For scale readiness:

- 80–100: READY
- 50–79: CAUTION
- 0–49: NOT READY

## 14. Confidence calibration

HIGH confidence:

- 30+ reviews
- Ratings present
- Dates present
- Duplicate ratio under 20%

MEDIUM confidence:

- 20+ reviews
- Rating or date present
- Signals are consistent

LOW confidence:

- Less than 20 reviews
- No ratings and no dates
- High duplicate ratio
- Very short/generic data

## 15. Decision logic

```text
IF confidence LOW and review_count < 20:
  INSUFFICIENT_DATA

ELSE IF ProductRisk > 65 and ListingAnomalyRisk > 65:
  DO_NOT_SCALE

ELSE IF ListingAnomalyRisk > 60:
  INVESTIGATE_ANOMALY

ELSE IF ProductRisk > 60:
  FIX_PRODUCT_FIRST

ELSE IF ScaleReadiness > 80 and confidence HIGH:
  SAFE_TO_SCALE

ELSE:
  FIX_PRODUCT_FIRST
```

## 16. Evidence cards

Every major conclusion should create evidence cards.

```ts
interface EvidenceCard {
  title: string;
  signalType: "product" | "integrity" | "anomaly" | "quality";
  severity: "low" | "medium" | "high";
  confidence: "low" | "medium" | "high";
  basis: "fact" | "inference" | "assumption";
  explanation: string;
  examples: string[];
  affectedReviewCount: number;
}
```

## 17. Root cause synthesis

Root causes should be conservative and evidence-backed.

Possible root-cause groups:

- Product defect
- Listing expectation mismatch
- Packaging/fulfillment issue
- Review integrity concern
- Listing anomaly concern
- Insufficient data
- Mixed signals

Root cause output:

```ts
interface RootCauseSummary {
  primary: string;
  confidence: "low" | "medium" | "high";
  facts: string[];
  inferences: string[];
  assumptions: string[];
  uncertainties: string[];
}
```

Rules:

- Do not assign a root cause from one isolated review.
- Prefer “mixed signals” when product and anomaly signals are both strong.
- Prefer “insufficient data” when metadata is missing and signals are weak.

## 18. Action plan generation

Generate actions from top risks.

Examples:

Product issue:

- “Fix packaging complaints before increasing ad spend.”
- “Audit supplier batch for durability complaints.”
- “Update listing copy to set expectations about sizing.”

Integrity risk:

- “Review repeated phrases manually.”
- “Separate low-detail extreme ratings from detailed complaints.”

Anomaly risk:

- “Collect timestamped export before making a decision.”
- “Prepare evidence pack if the burst is confirmed.”

## 19. Business impact scoring

Use business impact as a prioritization layer, not as fake financial precision.

Business impact score uses:

- Rating impact
- Frequency
- Severity/intensity
- Whether issue blocks purchase
- Whether issue affects trust
- Fixability

Labels:

- LOW: monitor
- MEDIUM: prioritize when convenient
- HIGH: address before scaling

Do not invent revenue numbers unless the user provides revenue/ad spend data.

## 20. Methodology limitations

Always include:

- The system identifies risk signals, not proof.
- Missing dates reduce anomaly confidence.
- Missing ratings reduce mismatch confidence.
- Small samples can mislead.
- Manual review is recommended before major business decisions.

## 21. Test datasets to create

Create local fixtures:

1. `good_product_reviews.csv`
2. `product_defect_reviews.csv`
3. `generic_repeated_reviews.csv`
4. `burst_negative_reviews.csv`
5. `small_low_quality_reviews.csv`

Each fixture should assert a different verdict.
