# OpenHands Build Prompts for RIE $0 MVP

## How to use this document

Use one prompt at a time in OpenHands.

Do not ask OpenHands to build the whole app in one prompt. Build step by step, run checks after each step, then continue.

Before each prompt:

1. Commit or save your current working state.
2. Read the result.
3. Run the listed checks.
4. Fix errors before moving to the next prompt.

## Global instruction for every OpenHands task

Paste this at the top of each prompt:

```text
Important constraints:
- This project must cost $0 to build and run locally.
- Do not add paid APIs, paid auth, paid databases, paid scraping, Stripe, Anthropic, OpenAI, Clerk, or Supabase.
- Use Next.js, TypeScript, Tailwind, Prisma, and SQLite.
- The app must work offline/local-first.
- Do not implement Amazon scraping.
- Do not claim fake reviews or competitor attacks as proven facts. Use “risk signal,” “review integrity risk,” and “listing anomaly risk.”
- Prefer deterministic, testable code over LLM calls.
- Use clean/hexagonal architecture: keep domain analysis in lib/analysis, persistence in lib/db, HTTP in app/api, and UI in components/app routes.
- Make submit/analyze idempotent using an input hash so retries or double-clicks do not create duplicate reports.
- Separate facts, inferences, assumptions, and uncertainties in report output.
- Apply Privacy by Design: local-first storage, no trackers, no external review data sharing, and report deletion.
- Keep changes focused and run lint/typecheck/build when possible.
```

---

## Prompt 1 — Create the project

```text
Create a new Next.js TypeScript app for Review Intelligence Engine.

Use:
- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- Prisma
- SQLite

Do not add paid services or external AI APIs.

Create initial pages:
- /
- /analyze
- /dashboard
- /methodology

Landing page copy should position the app as listing risk intelligence for Amazon sellers.

After setup, run the app checks and tell me the commands used.
```

Expected checks:

```bash
npm run lint
npm run build
```

---

## Prompt 2 — Add database schema

```text
Add Prisma with SQLite for local-first persistence.

Create models:
- User optional for future use
- Report
- Review

Use these report fields:
- inputHash unique, derived from normalized input for idempotency
- productName
- productUrl
- productCategory
- reviewCount
- inputQualityLevel
- inputQualityScore
- productRiskScore
- integrityRiskScore
- anomalyRiskScore
- scaleReadinessScore
- finalVerdict
- confidence
- fullOutputJson
- createdAt

Create a Prisma client helper in lib/db/prisma.ts.
Create a report repository adapter in lib/db/report-repository.ts.

Run migration and verify Prisma client generation.
```

Expected checks:

```bash
npx prisma migrate dev --name init
npm run build
```

---

## Prompt 3 — Add analysis types

```text
Create lib/analysis/types.ts with all domain types needed for the pipeline:
- ReviewInput
- ReviewIR
- InputQualitySummary
- Theme
- PatternSignals
- RiskScores
- EvidenceCard
- ActionPlan
- ExecutiveDecision
- AnalysisReport
- RootCauseSummary
- BusinessImpactScore

EvidenceCard should include whether the evidence is a fact, inference, or assumption.

Use conservative naming:
- Product Experience Risk
- Review Integrity Risk
- Listing Anomaly Risk
- Scale Readiness

Do not use “fake review score” in user-facing types.

Ensure TypeScript compiles.
```

Expected checks:

```bash
npm run typecheck
npm run build
```

---

## Prompt 4 — Build input parser

```text
Implement lib/analysis/parser.ts.

It must support:
- pasted text with one review per line
- structured ReviewInput array
- CSV-parsed rows passed from the UI later

Rules:
- text is required
- rating is optional but must be 1-5 if present
- date is optional
- verified is optional
- ignore empty rows
- return warnings for invalid rows
- cap at 200 reviews

Add unit-like fixture tests or simple test functions if this project does not have a test runner yet.
```

Expected checks:

```bash
npm run typecheck
npm run build
```

---

## Prompt 5 — Build data quality module

```text
Implement lib/analysis/data-quality.ts.

Calculate:
- review count
- has ratings
- has dates
- duplicate ratio
- metadata richness
- average word count
- input quality score 0-100
- quality level HIGH/MEDIUM/LOW
- warnings

Rules:
- HIGH: 30+ reviews with ratings and dates
- MEDIUM: 20+ reviews with rating or date metadata
- LOW: less than 20 reviews or missing both ratings and dates

Return clear warnings that can be shown in the UI.
```

Expected checks:

```bash
npm run typecheck
npm run build
```

---

## Prompt 6 — Build deterministic NLP modules

```text
Implement deterministic local analysis modules:

Files:
- lib/analysis/normalization.ts
- lib/analysis/problem-framing.ts
- lib/analysis/signal-extraction.ts
- lib/analysis/noise-filter.ts
- lib/analysis/sentiment.ts
- lib/analysis/themes.ts
- lib/analysis/patterns.ts

Requirements:
- no paid APIs
- no external LLM
- classify request intent: pain discovery, product validation, feature extraction, risk detection, or scale-readiness decision
- normalize text
- tokenize text
- remove stopwords
- extract explicit pain points, repeated patterns, contradictions, and missing expectations
- score signals by frequency, intensity, specificity, business impact, and confidence
- filter generic praise, vague statements, isolated complaints, and non-actionable feedback
- score sentiment using local positive/negative word lists
- detect rating/text mismatch
- detect generic short reviews
- detect repeated 3, 4, and 5 word phrases
- assign complaint themes using local keyword dictionaries
- detect date-based bursts when dates exist

Keep logic deterministic and explainable.
```

Expected checks:

```bash
npm run typecheck
npm run build
```

---

## Prompt 7 — Build scoring, root-cause, and decision engine

```text
Implement:
- lib/analysis/scoring.ts
- lib/analysis/root-cause.ts
- lib/analysis/decision.ts

Scores:
- productExperienceRisk 0-100
- reviewIntegrityRisk 0-100
- listingAnomalyRisk 0-100
- scaleReadiness 0-100
- businessImpact LOW/MEDIUM/HIGH for prioritization

Verdicts:
- SAFE_TO_SCALE
- FIX_PRODUCT_FIRST
- INVESTIGATE_ANOMALY
- DO_NOT_SCALE
- INSUFFICIENT_DATA

Decision rules:
1. If confidence low and review count < 20 -> INSUFFICIENT_DATA
2. If product risk high and anomaly risk high -> DO_NOT_SCALE
3. If anomaly risk high -> INVESTIGATE_ANOMALY
4. If product risk high -> FIX_PRODUCT_FIRST
5. If all risks low and confidence high -> SAFE_TO_SCALE
6. Otherwise -> FIX_PRODUCT_FIRST

Every decision must include a short reason and confidence.
Root causes must separate facts, inferences, assumptions, and uncertainties.
```

Expected checks:

```bash
npm run typecheck
npm run build
```

---

## Prompt 8 — Build report builder and pipeline

```text
Implement:
- lib/analysis/report-builder.ts
- lib/analysis/pipeline.ts

The pipeline should:
1. Parse input
2. Normalize reviews
3. Compute input quality
4. Frame the problem and request intent
5. Score sentiment
6. Detect themes
7. Extract signals
8. Filter noise
9. Detect patterns
10. Calculate scores
11. Synthesize root causes
12. Make final decision
13. Build AnalysisReport

The report must include:
- executive decision
- input quality
- scores
- product issues
- evidence cards
- pattern insights
- root cause summary
- action plan
- methodology notes
- facts, inferences, assumptions, and uncertainties

Do not call any external AI API.
```

Expected checks:

```bash
npm run typecheck
npm run build
```

---

## Prompt 9 — Build API routes

```text
Build API routes:
- POST /api/analyze
- GET /api/reports
- GET /api/reports/[id]
- DELETE /api/reports/[id]

POST /api/analyze should:
- validate request
- reject fewer than 10 valid reviews
- compute inputHash from normalized input
- return an existing report if inputHash already exists
- run the analysis pipeline
- save report in SQLite
- save normalized reviews
- return report, reportId, and reusedExistingReport boolean

Use Zod for validation.
Do not add auth yet.
Make DELETE /api/reports/[id] safe to retry.
```

Expected checks:

```bash
npm run typecheck
npm run build
```

---

## Prompt 10 — Build analyze UI

```text
Build the /analyze page.

Features:
- product name input
- product URL input
- product category input
- large review paste textarea
- CSV upload using papaparse
- live review count
- input quality preview if possible
- warnings for missing ratings/dates
- submit button
- loading state
- error state
- navigate to report after successful analysis

Keep UI premium and clean.
```

Expected checks:

```bash
npm run typecheck
npm run build
```

---

## Prompt 11 — Build report UI

```text
Build /reports/[id] page and report components.

Components:
- DecisionBanner
- RiskScoreCard
- ScaleReadinessCard
- ProductIssueCard
- EvidenceCard
- PatternInsightList
- ActionPlan
- MethodologyNotes
- PrintReportButton

The page should show:
1. Executive decision
2. Input quality
3. Scale readiness
4. Risk cards
5. Product issues
6. Evidence
7. Pattern insights
8. Action plan
9. Methodology and limitations

Make the report feel premium and print-friendly.
```

Expected checks:

```bash
npm run typecheck
npm run build
```

---

## Prompt 12 — Build dashboard

```text
Build /dashboard page.

Show local report history:
- product name
- date
- review count
- input quality
- final verdict
- scale readiness
- actions: view, delete

Add empty state with CTA to analyze reviews.
Use the API routes already created.
```

Expected checks:

```bash
npm run typecheck
npm run build
```

---

## Prompt 13 — Build methodology page

```text
Build /methodology page.

Explain:
- What the app analyzes
- What the app does not prove
- How product experience risk works
- How review integrity risk works
- How listing anomaly risk works
- How confidence works
- Why missing dates/ratings reduce confidence
- Privacy: local-first and no paid external AI in the MVP

Use careful language. Do not claim fraud or competitor attacks are proven.
```

Expected checks:

```bash
npm run typecheck
npm run build
```

---

## Prompt 14 — Add fixtures and validation

```text
Add sample fixture CSV files:
- good_product_reviews.csv
- product_defect_reviews.csv
- repeated_generic_reviews.csv
- anomaly_burst_reviews.csv
- low_quality_reviews.csv

Add a README explaining expected verdict for each fixture.

Use these fixtures to manually validate the app.
```

Expected checks:

```bash
npm run typecheck
npm run build
```

---

## Prompt 15 — Polish for premium feel

```text
Polish the app:
- improve spacing and typography
- improve empty states
- improve loading states
- improve error messages
- add print CSS for reports
- add sample CSV download
- make mobile layout usable
- ensure no raw JSON is shown to users
- ensure all user-facing language avoids overclaiming

Run final checks.
```

Expected checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Final MVP acceptance checklist

- [ ] App runs locally
- [ ] No paid API keys required
- [ ] SQLite database works
- [ ] Paste input works
- [ ] CSV upload works
- [ ] Analysis is deterministic
- [ ] Report saves
- [ ] Dashboard shows report history
- [ ] Report can be printed
- [ ] Methodology is conservative
- [ ] UI feels premium
