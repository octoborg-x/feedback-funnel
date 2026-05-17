# Review Intelligence Engine — $0 Architecture & System Design

## 1. Product direction

Review Intelligence Engine is a zero-cost MVP for Amazon sellers that turns pasted or uploaded reviews into a decision-focused report:

> Should I scale this listing, fix the product/listing first, or investigate suspicious review patterns?

The product should avoid sounding like a generic review summarizer. It should feel like a lightweight **listing risk intelligence system**.

## 2. Hard constraint

The project must cost **$0 to start and run**.

This means:

- No paid LLM API.
- No paid database.
- No paid auth provider.
- No paid hosting requirement.
- No Stripe subscription integration in the MVP.
- No paid scraping APIs.
- No residential proxies.
- No external vector database.

The MVP can be built and run locally for free, then optionally deployed later using free tiers.

## 3. Recommended zero-cost stack

### Core stack

| Layer | Choice | Cost | Reason |
|---|---:|---:|---|
| Frontend | Next.js + React + TypeScript | $0 | Full-stack app, easy routing/API, OpenHands-friendly |
| Styling | Tailwind CSS | $0 | Fast premium-looking UI |
| Backend | Next.js API routes / Server Actions | $0 | Avoid separate backend hosting |
| Database | SQLite with Prisma | $0 | Local-first, simple, reliable |
| Auth | Local email/password auth or passwordless dev mode | $0 | Avoid Clerk/Supabase paid limits |
| AI/NLP | Deterministic TypeScript + optional local Ollama | $0 | No paid APIs |
| Charts | Recharts | $0 | Timeline and score visuals |
| PDF export | Browser print / `react-to-print` | $0 | Avoid paid PDF services |
| Deployment | Local first; optional Vercel/Netlify free tier | $0 | Free start |
| Agent builder | OpenHands | $0 | User preference |

### Optional local AI

Use **Ollama** only as an optional enhancement.

Recommended local models:

- `llama3.1:8b`
- `mistral:7b`
- `qwen2.5:7b`

The system must still work without local AI. If Ollama is unavailable, use deterministic keyword/theme extraction.

## 4. Paid dependency replacements

| Original spec dependency | Replace with | Why |
|---|---|---|
| Anthropic Claude API | Deterministic NLP + optional Ollama | $0 |
| Supabase Postgres | SQLite + Prisma | $0 local start |
| Clerk / Supabase Auth | Local auth with hashed password | $0 |
| Stripe | Manual plan placeholder / disabled billing | $0 |
| Vercel + Railway backend | Single Next.js app | Simpler and free |
| Redis/BullMQ | In-process jobs / later SQLite job table | Not needed for MVP |
| Pinecone/Weaviate | No vector DB; later pgvector/sqlite-vss optional | Avoid complexity |
| Residential proxy scraping | Manual paste + CSV upload | Avoid legal/cost risk |
| ScraperAPI/Apify | Not in MVP | Paid and risky |

## 5. Architecture overview

```text
User Browser
   |
   | Paste reviews / upload CSV
   v
Next.js UI
   |
   | POST /api/analyze
   v
Analysis API Route
   |
   +--> Input parser
   +--> Data Quality Score
   +--> Review normalization
   +--> Deterministic NLP engine
   +--> Optional local Ollama semantic enhancement
   +--> Scoring engine
   +--> Decision engine
   +--> Report assembler
   |
   v
SQLite Database
   |
   v
Report View / Dashboard
```

## 5.1 Clean architecture / hexagonal architecture

Use hexagonal architecture so weak coding agents can work safely without mixing UI, database, and analysis logic.

The app has four layers:

```text
app/ and components/          = UI adapter
app/api/*                     = HTTP adapter
lib/analysis/*                = domain core
lib/db/* and prisma/*         = persistence adapter
lib/local-llm/*               = optional local AI adapter
```

Rules:

- The domain core must not import React, Next.js request objects, Prisma, or browser APIs.
- API routes may call the domain core and persistence adapter.
- UI components may call API routes but must not calculate final scores.
- Persistence code saves and loads reports but must not decide verdicts.
- Optional Ollama/local LLM code must be an adapter, not part of the scoring core.

Recommended dependency direction:

```text
UI -> API -> Application service -> Domain core
                      |
                      v
              Persistence adapter
```

Domain modules:

- Parser
- Normalizer
- Signal extractor
- Noise filter
- Scoring engine
- Decision engine
- Report builder

Adapters:

- HTTP API
- SQLite/Prisma
- CSV upload
- Optional Ollama
- Browser print/export

## 5.2 Idempotency and retryability

Even local apps should be safe to retry.

### Analyze request idempotency

When the user submits reviews, generate a deterministic `inputHash` from:

- normalized review texts
- ratings
- dates
- product URL
- product name

Before creating a new report:

1. Compute `inputHash`.
2. Check whether a report with that hash already exists.
3. If yes, return the existing report unless the user requests “run again.”
4. If no, create a new report.

This prevents duplicate reports when the user double-clicks submit or refreshes during analysis.

### Safe retry rules

- Parsing and analysis functions must be pure where possible.
- Database writes should happen after analysis succeeds.
- Report creation should be atomic.
- Failed report creation should return an error without partial UI state.
- Delete report should be safe to call twice: second call returns “already deleted” or success.

## 5.3 Privacy by Design

The MVP should protect seller data by default.

Rules:

- Local-first SQLite storage.
- No external AI API calls.
- No scraping.
- No analytics trackers by default.
- No review data leaves the machine unless the user intentionally deploys/exports.
- Store only what is needed for reports.
- Allow report deletion.
- Show methodology and privacy notes in the UI.

Avoid storing:

- Buyer personal information
- Full reviewer profiles
- Unnecessary account identifiers
- Secrets or API keys

If `reviewerId` exists, treat it as optional and use it only for duplicate detection.

## 5.4 Observability for founder trust

The app should distinguish:

- Known facts from the input
- Inferences from analysis
- Assumptions caused by missing data
- Uncertainties and confidence limits

Every report should include:

- Facts: counts, dates, ratings, repeated phrases
- Inferences: likely issue themes, risk levels
- Assumptions: what the system assumes when metadata is missing
- Limitations: what cannot be proven

This makes the product safer and more premium.

## 6. Main modules

### 6.1 UI module

Pages:

1. Landing page
2. Dashboard
3. New analysis
4. Report detail
5. Settings/about methodology

Components:

- Review input form
- CSV upload component
- Input quality preview
- Score cards
- Decision banner
- Evidence cards
- Pattern insights panel
- Timeline chart
- Action plan checklist
- Report export/print button

### 6.2 Input parser

Supports:

- One review per line
- Structured pasted text
- CSV upload

Recommended CSV columns:

- `text` required
- `rating` optional
- `date` optional
- `verified` optional
- `reviewer_id` optional

The parser should normalize messy input and show warnings instead of failing too easily.

### 6.3 Data quality module

Calculates:

- Review count
- Metadata completeness
- Rating availability
- Date availability
- Duplicate ratio
- Average review length
- Input quality level

Output:

- `HIGH`
- `MEDIUM`
- `LOW`
- Warnings
- Confidence impact

### 6.4 Review normalization module

Transforms raw input into internal review objects:

```ts
interface ReviewIR {
  id: string;
  text: string;
  rating: number | null;
  date: string | null;
  verified: boolean | null;
  reviewerId: string | null;
  wordCount: number;
  sentiment: number;
  tokens: string[];
}
```

### 6.5 Deterministic NLP module

Because the MVP must cost $0, this module should not depend on paid APIs.

It should implement:

- Keyword extraction
- Common phrase detection
- Review length scoring
- Generic language detection
- Product-specific language detection
- Sentiment scoring using lexicons
- Rating/text mismatch detection
- Basic complaint theme grouping

Suggested approach:

- Normalize text.
- Remove stopwords.
- Extract noun-like terms and repeated phrases.
- Match words against configurable theme dictionaries.
- Group reviews by top repeated complaint terms.
- Use a simple sentiment lexicon for positive/negative scoring.

### 6.6 Optional local LLM adapter

This module is optional.

If Ollama is installed and enabled:

- Send normalized review snippets to local model.
- Ask for strict JSON themes.
- Validate JSON.
- Fall back to deterministic themes if model fails.

Rules:

- Never require Ollama.
- Never block analysis if Ollama fails.
- Never use local LLM for final score calculation.
- Use it only for semantic theme labels and nicer explanations.

### 6.7 Pattern detection module

Detects:

- Repeated phrases
- Generic short reviews
- Extreme ratings with low detail
- Rating/text mismatch
- Review bursts if dates are present
- New complaint theme if multiple dates exist
- Delivery/packaging repeated complaints

### 6.8 Scoring engine

Recommended score categories:

1. **Product Experience Risk**
2. **Review Integrity Risk**
3. **Listing Anomaly Risk**
4. **Scale Readiness Score**

Avoid calling the core category “Fake Review Score” in the UI. It is hard to prove and may create trust/legal problems.

### 6.9 Decision engine

Possible verdicts:

- `SAFE_TO_SCALE`
- `FIX_PRODUCT_FIRST`
- `INVESTIGATE_ANOMALY`
- `DO_NOT_SCALE`
- `INSUFFICIENT_DATA`

Decision rules should be deterministic and explainable.

### 6.10 Report assembler

Every report should include:

1. Executive decision
2. Input quality
3. Scale readiness
4. Product experience risks
5. Review integrity risks
6. Listing anomaly risks
7. Evidence cards
8. Pattern insights
9. Action plan
10. Methodology and limitations

## 7. Data model

Use SQLite through Prisma.

### User

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String?
  createdAt    DateTime @default(now())
  reports      Report[]
}
```

### Report

```prisma
model Report {
  id                    String   @id @default(cuid())
  userId                String?
  productName           String?
  productUrl            String?
  productCategory       String?
  reviewCount           Int
  inputQualityLevel     String
  inputQualityScore     Int
  productRiskScore      Int
  integrityRiskScore    Int
  anomalyRiskScore      Int
  scaleReadinessScore   Int
  finalVerdict          String
  confidence            String
  fullOutputJson        String
  createdAt             DateTime @default(now())
  user                  User?    @relation(fields: [userId], references: [id])
  reviews               Review[]
}
```

### Review

```prisma
model Review {
  id          String   @id @default(cuid())
  reportId    String
  text        String
  rating      Float?
  reviewDate  DateTime?
  verified    Boolean?
  wordCount   Int
  sentiment   Float
  hasMismatch Boolean  @default(false)
  theme       String?
  report      Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
}
```

## 8. API design

### POST `/api/analyze`

Input:

```ts
interface AnalyzeRequest {
  inputType: "paste" | "csv";
  rawText?: string;
  reviews?: ReviewInput[];
  productName?: string;
  productUrl?: string;
  productCategory?: string;
  options?: {
    useLocalLLM?: boolean;
  };
}
```

Output:

```ts
interface AnalysisReport {
  id: string;
  executiveDecision: ExecutiveDecision;
  inputQuality: InputQualitySummary;
  scores: RiskScores;
  productIssues: ProductIssue[];
  integritySignals: EvidenceCard[];
  anomalySignals: EvidenceCard[];
  patternInsights: PatternInsights;
  actionPlan: ActionPlan;
  methodology: MethodologyNote[];
}
```

### GET `/api/reports`

Returns report summaries.

### GET `/api/reports/:id`

Returns one full report.

### DELETE `/api/reports/:id`

Deletes one report locally.

## 9. Zero-cost AI strategy

### Phase 1: no LLM

Build with deterministic logic first:

- Faster
- Free
- Testable
- Explainable
- Works offline

### Phase 2: optional local LLM

Add Ollama as a user-enabled local enhancement:

- Better theme names
- Cleaner explanations
- More natural action plan wording

Do not make the product dependent on it.

## 10. Security and privacy

Because this handles seller/business data:

- Store data locally by default.
- Do not send reviews to external APIs in the $0 MVP.
- Add a “Delete report” button.
- Add clear methodology and privacy language.
- Do not scrape Amazon in the MVP.
- Do not claim certainty about fake reviews or attacks.

## 11. Deployment options at $0

### Best starting option

Run locally:

```bash
npm install
npm run dev
```

### Optional free deployment

Possible later:

- Vercel free tier for frontend/serverless
- Netlify free tier
- Render free tier if available

But SQLite persistence on serverless is tricky. For true $0 hosted persistence, use:

- Local-only app first, or
- Supabase free tier later, or
- Turso free tier later

The purest $0 architecture is **local-first SQLite**.

## 12. Recommended folder structure

```text
rie/
  app/
    page.tsx
    dashboard/page.tsx
    analyze/page.tsx
    reports/[id]/page.tsx
    api/analyze/route.ts
    api/reports/route.ts
    api/reports/[id]/route.ts
  components/
    input/
    report/
    dashboard/
    ui/
  lib/
    analysis/
      parser.ts
      normalization.ts
      data-quality.ts
      sentiment.ts
      themes.ts
      patterns.ts
      scoring.ts
      decision.ts
      report-builder.ts
    db/
      prisma.ts
    local-llm/
      ollama.ts
  prisma/
    schema.prisma
  docs/
  tests/
```

## 13. MVP build order

1. Project setup
2. Data types and schemas
3. Input parser
4. Deterministic analysis engine
5. Scoring and decision engine
6. Report UI
7. Dashboard/history
8. CSV upload
9. Export/print
10. Optional local Ollama
11. Polish and validation

## 14. Definition of done for the $0 MVP

The MVP is ready when:

- User can paste 20–200 reviews.
- User can upload a CSV.
- App computes input quality.
- App detects top complaint themes.
- App detects repeated/generic suspicious patterns.
- App detects rating/text mismatches.
- App shows evidence cards.
- App returns a clear scale/fix/investigate decision.
- App saves reports locally.
- User can revisit previous reports.
- User can print/export a report.
- App works without paid APIs.
