# RIE $0 MVP — Features and Step-by-Step Build Plan

## Goal

Build the first version of Review Intelligence Engine using only free resources.

This MVP should answer one seller question:

> Should I scale this listing, fix the product/listing, or investigate unusual review patterns?

## MVP feature list

### Feature 1 — Landing page

Purpose:

- Explain the product clearly.
- Position it as listing risk intelligence, not generic sentiment analysis.

Required sections:

1. Hero
2. Problem
3. How it works
4. Example decision output
5. Free/local privacy message
6. CTA: “Analyze Reviews”

Suggested hero:

> Know whether reviews signal a product problem, trust risk, or anomaly — before you scale your listing.

Acceptance criteria:

- Looks premium.
- CTA goes to `/analyze`.
- Does not claim certainty about fake reviews or competitor attacks.

---

### Feature 2 — Review input page

Route:

`/analyze`

Inputs:

- Product name optional
- Product URL optional
- Product category optional
- Raw review text area
- CSV upload
- Toggle: “My data includes ratings/dates”

Live preview:

- Review count
- Estimated data quality
- Missing metadata warnings
- Duplicate warning

Acceptance criteria:

- User can paste one review per line.
- Submit disabled below 10 reviews.
- Warning shown below 20 reviews.
- User can continue with low-quality data but confidence is reduced.

---

### Feature 3 — CSV upload

Supported columns:

- `text`
- `rating`
- `date`
- `verified`
- `reviewer_id`

Behavior:

- Validate required `text`.
- Ignore unknown columns.
- Show row-level parse errors.
- Allow user to proceed if enough rows are valid.

Acceptance criteria:

- CSV with text only works.
- CSV with rating/date improves confidence.
- Broken rows are shown, not silently hidden.

---

### Feature 4 — Input quality scoring

Metrics:

- Review count
- Text completeness
- Duplicate ratio
- Rating availability
- Date availability
- Average word count
- Metadata richness

Quality levels:

- HIGH: 30+ reviews with ratings and dates
- MEDIUM: 20+ reviews with at least one metadata type
- LOW: less than 20 reviews or missing ratings and dates

Acceptance criteria:

- User sees quality level before analysis.
- Report explains how quality affects confidence.

---

### Feature 5 — Deterministic review analysis engine

No paid AI APIs.

Core functions:

1. Normalize text
2. Tokenize text
3. Remove stopwords
4. Score sentiment
5. Detect repeated phrases
6. Detect generic short reviews
7. Detect rating/text mismatch
8. Group common complaint themes
9. Detect temporal bursts if dates exist

Acceptance criteria:

- Works offline.
- Produces same result for same input.
- Does not require Ollama or external APIs.

---

### Feature 6 — Risk scoring

Scores:

1. Product Experience Risk
2. Review Integrity Risk
3. Listing Anomaly Risk
4. Scale Readiness Score

Suggested formulas:

```text
Product Experience Risk =
  40% dominant complaint frequency
  25% negative sentiment ratio
  20% low-rating ratio
  15% issue persistence if dates exist

Review Integrity Risk =
  30% repeated phrase ratio
  25% generic short ratio
  25% rating/text mismatch ratio
  20% extreme rating with low detail ratio

Listing Anomaly Risk =
  40% burst signal
  25% sudden negative shift
  20% new theme concentration
  15% repeated delivery/packaging anomaly

Scale Readiness =
  100 - weighted risk
```

Acceptance criteria:

- Scores are 0–100.
- Each score has label LOW/MEDIUM/HIGH.
- Each score explains contributing factors.

---

### Feature 7 — Decision engine

Verdicts:

- `SAFE_TO_SCALE`
- `FIX_PRODUCT_FIRST`
- `INVESTIGATE_ANOMALY`
- `DO_NOT_SCALE`
- `INSUFFICIENT_DATA`

Decision priority:

1. If confidence low and review count < 20 → Insufficient Data
2. If product risk high and anomaly risk high → Do Not Scale
3. If anomaly risk high → Investigate Anomaly
4. If product risk high → Fix Product First
5. If all risks low and confidence high → Safe to Scale
6. Else → Fix Product First

Acceptance criteria:

- Always returns one verdict.
- Shows a one-sentence reason.
- Shows confidence.

---

### Feature 8 — Report page

Route:

`/reports/[id]`

Sections:

1. Decision banner
2. Input quality summary
3. Scale readiness score
4. Three risk score cards
5. Product issue cards
6. Evidence cards
7. Pattern insights
8. Action plan
9. Methodology and limitations

Acceptance criteria:

- User knows the answer within 30 seconds.
- Evidence supports every major claim.
- Report looks premium and clean.

---

### Feature 9 — Dashboard/history

Route:

`/dashboard`

Shows:

- Previous reports
- Date
- Product name
- Review count
- Verdict
- Scale readiness
- Input quality

Acceptance criteria:

- Reports are saved in SQLite.
- User can open old reports.
- User can delete reports.

---

### Feature 10 — Print/export

Use browser print or `react-to-print`.

Acceptance criteria:

- Report has print-friendly styling.
- User can save as PDF using browser.
- No paid PDF service.

---

### Feature 11 — Methodology page

Route:

`/methodology`

Explain:

- What the app detects
- What it does not prove
- How confidence works
- Why no paid external AI is used in the $0 version
- Privacy: reviews stay local unless user deploys differently

Acceptance criteria:

- Builds trust.
- Reduces legal risk.
- Avoids overclaiming.

## Build sequence

### Step 1 — Create project

Use:

- Next.js
- TypeScript
- Tailwind
- ESLint
- Prisma
- SQLite

Expected output:

- App runs at `localhost:3000`
- Landing page renders

### Step 2 — Add Prisma schema

Create:

- User optional
- Report
- Review

Expected output:

- SQLite database created
- Prisma client generated

### Step 3 — Add TypeScript domain types

Create types for:

- ReviewInput
- ReviewIR
- InputQualitySummary
- RiskScores
- EvidenceCard
- ActionPlan
- AnalysisReport

Expected output:

- Types compile
- Analysis modules can share contracts

### Step 4 — Build parser

Implement:

- Parse pasted text
- Parse CSV rows
- Normalize ratings/dates/verified

Expected output:

- Parser unit tests pass

### Step 5 — Build data quality module

Implement:

- DQS score
- Quality level
- Warning generation

Expected output:

- Quality preview works in UI

### Step 6 — Build deterministic analysis modules

Implement:

- Sentiment
- Theme detection
- Pattern detection
- Mismatch detection
- Burst detection

Expected output:

- Analysis works with sample review data

### Step 7 — Build scoring and decision engine

Implement:

- Risk scores
- Confidence
- Final verdict
- Reason generation

Expected output:

- Same input always produces same output

### Step 8 — Build `/api/analyze`

Implement:

- Validate request
- Run pipeline
- Save report and reviews
- Return report id/result

Expected output:

- UI can submit analysis and navigate to report

### Step 9 — Build report UI

Implement:

- Decision banner
- Score cards
- Evidence cards
- Action plan
- Methodology section

Expected output:

- Report is readable and premium-looking

### Step 10 — Build dashboard

Implement:

- List reports
- Open report
- Delete report

Expected output:

- User has local report history

### Step 11 — Add print/export

Implement:

- Print button
- Print CSS

Expected output:

- Browser can save report as PDF

### Step 12 — Polish

Improve:

- Empty states
- Loading states
- Error handling
- Mobile layout
- Color contrast
- Sample data

Expected output:

- MVP feels trustworthy.

## What not to build in MVP

- Paid LLM calls
- Stripe billing
- Amazon scraper
- Residential proxies
- External vector database
- Multi-seat agency dashboard
- API access
- White-labeling
- Complex background queues

## MVP completion checklist

- [ ] Runs locally for $0
- [ ] No required paid API keys
- [ ] Paste input works
- [ ] CSV upload works
- [ ] Input quality scoring works
- [ ] Review analysis works offline
- [ ] Report is saved locally
- [ ] Dashboard history works
- [ ] Report can be printed/exported
- [ ] Methodology avoids overclaims
- [ ] UI feels premium
