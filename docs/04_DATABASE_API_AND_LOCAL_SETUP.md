# RIE $0 Database, API, and Local Setup

## Goal

Create a local-first app that stores reports on the user's machine using SQLite.

No cloud database is required for the MVP.

## 1. Local setup

### Requirements

- Node.js 20+
- npm
- Git
- OpenHands

Optional:

- Ollama for local LLM enhancement

### Create project

```bash
npx create-next-app@latest rie \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir false \
  --import-alias "@/*"
```

### Install dependencies

```bash
cd rie
npm install prisma @prisma/client
npm install zod papaparse recharts lucide-react
npm install -D @types/papaparse
```

Optional print helper:

```bash
npm install react-to-print
```

### Initialize Prisma

```bash
npx prisma init --datasource-provider sqlite
```

`.env`:

```env
DATABASE_URL="file:./dev.db"
```

This is local and free.

## 2. Prisma schema

Use this as initial `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String?
  createdAt    DateTime @default(now())
  reports      Report[]
}

model Report {
  id                  String   @id @default(cuid())
  inputHash           String   @unique
  userId              String?
  productName         String?
  productUrl          String?
  productCategory     String?
  reviewCount         Int
  inputQualityLevel   String
  inputQualityScore   Int
  productRiskScore    Int
  integrityRiskScore  Int
  anomalyRiskScore    Int
  scaleReadinessScore Int
  finalVerdict        String
  confidence          String
  fullOutputJson      String
  createdAt           DateTime @default(now())

  user    User?    @relation(fields: [userId], references: [id])
  reviews Review[]
}

model Review {
  id          String    @id @default(cuid())
  reportId    String
  text        String
  rating      Float?
  reviewDate  DateTime?
  verified    Boolean?
  reviewerId  String?
  wordCount   Int
  sentiment   Float
  hasMismatch Boolean   @default(false)
  isGeneric   Boolean   @default(false)
  theme       String?
  createdAt   DateTime  @default(now())

  report Report @relation(fields: [reportId], references: [id], onDelete: Cascade)
}
```

Create database:

```bash
npx prisma migrate dev --name init
```

## 3. API routes

### POST `/api/analyze`

Purpose:

- Receive reviews
- Run analysis
- Save report
- Return report
- Avoid duplicate reports through `inputHash`

Request:

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

Validation:

- Reject if fewer than 10 valid reviews.
- Warn if fewer than 20 reviews.
- Reject if no valid text.
- Cap at 200 reviews for MVP.

Response:

```ts
interface AnalyzeResponse {
  reportId: string;
  report: AnalysisReport;
  reusedExistingReport: boolean;
}
```

Idempotency:

- Compute `inputHash` from normalized review text, rating, date, product URL, product name, and product category.
- If a report with the same `inputHash` exists, return it instead of creating a duplicate.
- If the user explicitly requests a fresh run later, add a `forceNew` option.
- This makes browser refreshes, double-click submits, and API retries safe.

### GET `/api/reports`

Returns:

```ts
interface ReportSummary {
  id: string;
  productName: string | null;
  reviewCount: number;
  inputQualityLevel: string;
  finalVerdict: string;
  scaleReadinessScore: number;
  createdAt: string;
}
```

### GET `/api/reports/[id]`

Returns:

```ts
interface ReportDetailResponse {
  report: AnalysisReport;
}
```

### DELETE `/api/reports/[id]`

Deletes:

- Report
- Related reviews by cascade

Returns:

```ts
{ "ok": true }
```

Idempotency:

- Deleting an already-deleted report should not crash the UI.
- Return success or a clear `not_found` response that the UI treats as already complete.

## 4. App routes

### `/`

Landing page.

### `/analyze`

Review input and upload page.

### `/dashboard`

Report history.

### `/reports/[id]`

Full report detail.

### `/methodology`

Transparent explanation page.

## 5. Library structure

```text
lib/
  analysis/
    types.ts
    parser.ts
    normalization.ts
    problem-framing.ts
    signal-extraction.ts
    noise-filter.ts
    data-quality.ts
    sentiment.ts
    themes.ts
    patterns.ts
    scoring.ts
    decision.ts
    report-builder.ts
    pipeline.ts
  db/
    prisma.ts
    report-repository.ts
  utils/
    hash.ts
    format.ts
```

## 6. Pipeline function

Create a single main function:

```ts
export async function analyzeReviews(input: AnalyzeRequest): Promise<AnalysisReport> {
  const parsed = parseInput(input);
  const normalized = normalizeReviews(parsed);
  const inputQuality = computeInputQuality(normalized);
  const framing = frameProblem(input, inputQuality);
  const sentiment = scoreSentiment(normalized);
  const themes = detectThemes(sentiment);
  const rawSignals = extractSignals(sentiment, themes);
  const filteredSignals = filterNoise(rawSignals, inputQuality);
  const patterns = detectPatterns(sentiment, themes, filteredSignals);
  const scores = calculateScores(sentiment, themes, patterns, filteredSignals, inputQuality);
  const decision = makeDecision(scores, inputQuality, patterns);
  return buildReport({
    input,
    framing,
    reviews: sentiment,
    inputQuality,
    themes,
    signals: filteredSignals,
    patterns,
    scores,
    decision,
  });
}
```

The pipeline should remain pure: it receives input and returns a report object. API routes handle database reads/writes.

## 7. Validation with Zod

Use Zod for API input validation.

Example:

```ts
const ReviewInputSchema = z.object({
  text: z.string().min(1),
  rating: z.number().min(1).max(5).optional(),
  date: z.string().optional(),
  verified: z.boolean().optional(),
  reviewerId: z.string().optional(),
});
```

## 8. Local auth recommendation

For the earliest $0 MVP, make auth optional.

Best order:

1. No auth: local single-user app
2. Add simple local auth later
3. Add hosted auth only if deploying publicly

Reason:

- The app is local-first.
- SQLite local history does not need multi-user auth.
- Avoid building account complexity before product validation.

If auth is needed:

- Use `bcryptjs`
- Use cookie sessions
- Keep it local

## 9. Environment variables

Required:

```env
DATABASE_URL="file:./dev.db"
```

Optional:

```env
OLLAMA_BASE_URL="http://localhost:11434"
ENABLE_LOCAL_LLM="false"
```

No paid keys are required.

## 10. Testing commands

Recommended scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

## 11. Sample data

Create:

```text
fixtures/
  good_product_reviews.csv
  product_defect_reviews.csv
  repeated_generic_reviews.csv
  anomaly_burst_reviews.csv
  low_quality_reviews.csv
```

Each fixture should include expected verdict in comments or separate README.

## 12. Zero-cost deployment notes

Local-first is safest.

If deploying to free hosting:

- SQLite persistence may not work reliably on serverless.
- Use hosted deployment only for demo without long-term persistence.
- For free hosted persistence, evaluate Supabase free tier or Turso free tier later.

Do not add hosted dependencies until the local MVP is valuable.
