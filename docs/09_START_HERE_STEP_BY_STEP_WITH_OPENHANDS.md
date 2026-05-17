# Start Here — How to Build RIE Step by Step with the Docs Zip and OpenHands

## Purpose

This guide tells you exactly how to start the Review Intelligence Engine project using the generated documentation zip.

You will use:

- OpenHands as the coding agent
- Only free/local resources
- Next.js + TypeScript + Tailwind
- SQLite + Prisma
- Deterministic local analysis
- No paid APIs
- No scraping
- No Stripe
- No Clerk/Supabase required

## The most important rule

Do **not** ask OpenHands to build the whole app in one message.

Build it in small checkpoints:

1. Project setup
2. Database
3. Analysis types
4. Parser
5. Data quality
6. Deterministic NLP
7. Scoring/decision engine
8. API routes
9. Analyze page
10. Report page
11. Dashboard
12. Methodology page
13. Fixtures/testing
14. Polish

This prevents weak LLMs from mixing architecture, UI, database, and logic incorrectly.

---

## 1. Unzip and organize the docs

Create a project folder on your machine:

```bash
mkdir rie-project
cd rie-project
```

Unzip the generated docs:

```bash
unzip RIE_zero_cost_docs_v2.zip
```

You should see:

```text
RIE_zero_cost_docs/
  00_ARCHITECTURE_AND_SYSTEM_DESIGN.md
  01_MVP_FEATURES_AND_BUILD_STEPS.md
  02_ANALYSIS_ENGINE_SPEC.md
  03_UI_UX_AND_PREMIUM_EXPERIENCE.md
  04_DATABASE_API_AND_LOCAL_SETUP.md
  05_PHASED_ROADMAP_ZERO_COST.md
  06_OPENHANDS_BUILD_PROMPTS.md
  07_ZERO_COST_RESOURCE_PLAN.md
  08_ADVANCED_ARCHITECTURE_UPDATES_FROM_INSTRU.md
  09_START_HERE_STEP_BY_STEP_WITH_OPENHANDS.md
```

If you do not have the zip, place these markdown files in a folder called:

```text
RIE_zero_cost_docs/
```

---

## 2. Read the docs in this order

Do not read everything randomly.

### Read first

1. `09_START_HERE_STEP_BY_STEP_WITH_OPENHANDS.md`
   - This file.
   - It tells you how to execute.

2. `07_ZERO_COST_RESOURCE_PLAN.md`
   - Understand what is allowed and what is not allowed.

3. `00_ARCHITECTURE_AND_SYSTEM_DESIGN.md`
   - Understand the system structure.

4. `06_OPENHANDS_BUILD_PROMPTS.md`
   - This is your prompt sequence for OpenHands.

### Read while building

5. `04_DATABASE_API_AND_LOCAL_SETUP.md`
   - Use during project/database/API setup.

6. `02_ANALYSIS_ENGINE_SPEC.md`
   - Use during analysis engine implementation.

7. `03_UI_UX_AND_PREMIUM_EXPERIENCE.md`
   - Use during UI/report building.

### Read for planning

8. `01_MVP_FEATURES_AND_BUILD_STEPS.md`
   - Feature checklist.

9. `05_PHASED_ROADMAP_ZERO_COST.md`
   - What comes now vs later.

10. `08_ADVANCED_ARCHITECTURE_UPDATES_FROM_INSTRU.md`
   - Why hexagonal architecture, idempotency, retryability, and privacy were added.

---

## 3. Create the actual app folder

Inside `rie-project`, create the app using OpenHands or manually.

Recommended final structure:

```text
rie-project/
  RIE_zero_cost_docs/
  rie/
    app/
    components/
    lib/
    prisma/
    package.json
```

The `RIE_zero_cost_docs` folder is your instruction/reference folder.

The `rie` folder is the real app.

---

## 4. Start OpenHands correctly

OpenHands should work inside the `rie-project` folder or directly inside the `rie` folder once it exists.

When you begin, tell OpenHands:

```text
You are building the Review Intelligence Engine project.

Read these docs first:
- RIE_zero_cost_docs/00_ARCHITECTURE_AND_SYSTEM_DESIGN.md
- RIE_zero_cost_docs/04_DATABASE_API_AND_LOCAL_SETUP.md
- RIE_zero_cost_docs/06_OPENHANDS_BUILD_PROMPTS.md
- RIE_zero_cost_docs/07_ZERO_COST_RESOURCE_PLAN.md

Follow the constraints exactly:
- $0 local-first project
- No paid APIs
- No paid auth
- No paid database
- No Stripe
- No scraping
- No Anthropic/OpenAI
- No Clerk/Supabase required
- Use Next.js, TypeScript, Tailwind, Prisma, SQLite
- Use clean/hexagonal architecture
- Keep domain analysis in lib/analysis
- Keep database code in lib/db
- Keep HTTP routes in app/api
- Keep UI in app routes and components
- Make analysis idempotent with inputHash
- Apply Privacy by Design
- Separate facts, inferences, assumptions, and uncertainties

Do not build everything at once. Wait for my next prompt.
```

Then use the prompts from:

```text
RIE_zero_cost_docs/06_OPENHANDS_BUILD_PROMPTS.md
```

one by one.

---

## 5. Step-by-step execution plan

## Step 1 — Create the project

Use Prompt 1 from `06_OPENHANDS_BUILD_PROMPTS.md`.

Expected result:

- Next.js app created
- Tailwind works
- Basic pages exist
- App runs locally

Run:

```bash
npm run build
```

Only continue if build passes.

Checkpoint:

```text
Project shell exists and builds.
```

---

## Step 2 — Add SQLite/Prisma database

Use Prompt 2.

Important:

- Include `inputHash` as unique on `Report`.
- Do not add hosted database.
- Do not add auth provider.

Run:

```bash
npx prisma migrate dev --name init
npm run build
```

Checkpoint:

```text
SQLite database works and Prisma client is generated.
```

---

## Step 3 — Add domain types

Use Prompt 3.

Important types:

- ReviewInput
- ReviewIR
- InputQualitySummary
- EvidenceCard
- RootCauseSummary
- AnalysisReport
- RiskScores
- ExecutiveDecision

Make sure evidence can be labeled as:

- fact
- inference
- assumption

Run:

```bash
npm run build
```

Checkpoint:

```text
Domain contracts exist before business logic.
```

---

## Step 4 — Build parser

Use Prompt 4.

Parser must support:

- Paste input
- Structured review array
- Later CSV rows

Rules:

- Ignore empty rows
- Reject fewer than 10 valid reviews
- Warn below 20 reviews
- Cap at 200 reviews

Run:

```bash
npm run build
```

Checkpoint:

```text
Raw user input can become clean ReviewInput[].
```

---

## Step 5 — Build data quality module

Use Prompt 5.

Output:

- quality score 0–100
- HIGH/MEDIUM/LOW
- warnings
- confidence impact

Run:

```bash
npm run build
```

Checkpoint:

```text
The app can explain whether the input is trustworthy.
```

---

## Step 6 — Build deterministic analysis modules

Use Prompt 6.

Modules:

- normalization
- problem framing
- signal extraction
- noise filter
- sentiment
- themes
- patterns

Do not use paid APIs.

Run:

```bash
npm run build
```

Checkpoint:

```text
The system can extract signals offline.
```

---

## Step 7 — Build scoring, root cause, and decision engine

Use Prompt 7.

Scores:

- Product Experience Risk
- Review Integrity Risk
- Listing Anomaly Risk
- Scale Readiness
- Business Impact

Verdicts:

- SAFE_TO_SCALE
- FIX_PRODUCT_FIRST
- INVESTIGATE_ANOMALY
- DO_NOT_SCALE
- INSUFFICIENT_DATA

Run:

```bash
npm run build
```

Checkpoint:

```text
The system can turn signals into a decision.
```

---

## Step 8 — Build pipeline and report builder

Use Prompt 8.

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
- facts/inferences/assumptions/uncertainties

Run:

```bash
npm run build
```

Checkpoint:

```text
One function can analyze reviews and produce a full report object.
```

---

## Step 9 — Build API routes

Use Prompt 9.

Routes:

- POST `/api/analyze`
- GET `/api/reports`
- GET `/api/reports/[id]`
- DELETE `/api/reports/[id]`

Important:

- Compute `inputHash`
- Return existing report if same input already exists
- Make delete safe to retry

Run:

```bash
npm run build
```

Checkpoint:

```text
Frontend can call the backend and reports are persisted.
```

---

## Step 10 — Build Analyze UI

Use Prompt 10.

Must include:

- product fields
- paste textarea
- CSV upload
- review count
- input quality preview
- submit/loading/error state

Run:

```bash
npm run build
```

Checkpoint:

```text
User can submit real reviews from the browser.
```

---

## Step 11 — Build Report UI

Use Prompt 11.

This is the most important user experience.

Report sections:

1. Decision banner
2. Input quality
3. Scale readiness
4. Risk score cards
5. Product issues
6. Evidence cards
7. Pattern insights
8. Root cause
9. Action plan
10. Methodology

Run:

```bash
npm run build
```

Checkpoint:

```text
The report feels premium and decision-focused.
```

---

## Step 12 — Build Dashboard

Use Prompt 12.

Dashboard shows:

- old reports
- verdict
- product name
- date
- scale readiness
- delete/view actions

Run:

```bash
npm run build
```

Checkpoint:

```text
User has local report history.
```

---

## Step 13 — Build Methodology page

Use Prompt 13.

Must explain:

- what the system detects
- what it does not prove
- confidence
- limitations
- privacy
- no paid AI in MVP

Run:

```bash
npm run build
```

Checkpoint:

```text
Product feels trustworthy and does not overclaim.
```

---

## Step 14 — Add fixtures

Use Prompt 14.

Create sample CSVs:

- good product
- product defect
- repeated generic reviews
- anomaly burst
- low quality

Use these to manually test the app.

Checkpoint:

```text
You can test all verdict types.
```

---

## Step 15 — Polish

Use Prompt 15.

Polish:

- spacing
- typography
- empty states
- loading states
- error states
- mobile layout
- print CSS
- sample CSV download

Run:

```bash
npm run lint
npm run build
```

Checkpoint:

```text
MVP is ready for first user feedback.
```

---

## 6. How to know if OpenHands did a bad job

Stop and correct OpenHands if it:

- Adds OpenAI, Anthropic, Clerk, Supabase, Stripe, or paid APIs
- Adds Amazon scraping
- Puts scoring logic inside React components
- Puts Prisma/database code inside analysis functions
- Claims “fake reviews proven” or “competitor attack confirmed”
- Creates duplicate reports on repeated submit
- Stores unnecessary personal data
- Shows raw JSON to users
- Skips build checks
- Builds many phases in one giant change

Correction prompt:

```text
Stop. This violates the project constraints.

Fix the implementation:
- Keep the app $0 and local-first.
- Remove paid/external dependencies.
- Move domain logic into lib/analysis.
- Move database logic into lib/db.
- Keep UI separate from scoring.
- Use conservative language.
- Run the build again.
```

---

## 7. Minimum test before showing anyone

Before showing the app to a seller, test:

1. Paste 20 generic good reviews
2. Paste 30 product defect reviews
3. Upload CSV with ratings and dates
4. Submit same reviews twice and confirm no duplicate report
5. Delete a report
6. Print/save report as PDF
7. Open dashboard and old report
8. Check methodology page

The MVP is acceptable only if:

- It runs without paid keys
- It creates useful reports
- It avoids overclaiming
- It saves history locally
- It looks professional enough to share

---

## 8. Recommended first-week schedule

### Day 1

- Read docs
- Create project
- Add database
- Add types

### Day 2

- Parser
- Data quality
- Normalization

### Day 3

- Sentiment
- Themes
- Pattern detection
- Noise filtering

### Day 4

- Scoring
- Decision engine
- Report builder
- API routes

### Day 5

- Analyze UI
- Report UI

### Day 6

- Dashboard
- Methodology
- Print/export

### Day 7

- Fixtures
- Manual tests
- Polish
- Share with 3–5 sellers for feedback

---

## 9. What to build later, not now

Do not build these in the first MVP:

- Stripe billing
- Auth provider
- Paid LLM integration
- Scraping
- Residential proxies
- API access
- Multi-seat dashboard
- White-label reports
- Hosted cloud database

Only add them after sellers confirm the report is useful.

---

## 10. Final instruction to yourself

Your goal is not to build a huge platform first.

Your goal is to prove:

> Can a $0 local app turn reviews into a decision report that an Amazon seller trusts enough to act on?

If yes, then you can upgrade infrastructure later.
