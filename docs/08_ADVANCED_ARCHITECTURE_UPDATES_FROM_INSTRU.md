# Advanced Architecture Updates from `instru.docx`

## Purpose

The uploaded instruction document adds useful best-practice concepts that should be incorporated into RIE:

- Hexagonal architecture
- Idempotency
- Retryability
- Separation of concerns
- Event-driven thinking
- Observability
- Privacy by Design
- Anti-hallucination rules
- Founder-oriented business translation

These concepts improve the original docs, especially for weak LLMs or agentic builders like OpenHands.

## What should be added to the project docs

### 1. Stronger reasoning pipeline

The analysis engine should follow:

1. Problem framing
2. Signal extraction
3. Signal scoring
4. Noise filtering
5. Root-cause synthesis
6. Business translation
7. Decision output

This improves the previous pipeline by adding explicit problem framing, noise filtering, and business translation.

### 2. Facts vs inferences vs assumptions

Every report should separate:

- Facts from input
- Inferences from analysis
- Assumptions caused by missing data
- Uncertainties / limitations

This is important for trust and anti-hallucination.

### 3. Hexagonal architecture

The app should be split into:

- Domain core: `lib/analysis/*`
- HTTP adapter: `app/api/*`
- UI adapter: `app/*` and `components/*`
- Persistence adapter: `lib/db/*`
- Optional AI adapter: `lib/local-llm/*`

The domain core should never import Prisma, React, Next request objects, or browser APIs.

### 4. Idempotent analysis requests

The app should compute `inputHash` from normalized input.

If the same input is submitted twice:

- Return the existing report.
- Do not create duplicate reports.

This handles:

- Double-click submit
- Browser refresh
- Retry after timeout
- OpenHands/API retry behavior

### 5. Retry-safe operations

Rules:

- Analysis functions should be pure.
- Database writes happen only after analysis succeeds.
- Delete should be safe to retry.
- Failed analysis should not create partial reports.

### 6. Privacy by Design

RIE should:

- Store data locally by default.
- Avoid external APIs in the $0 MVP.
- Avoid trackers.
- Avoid storing unnecessary buyer/reviewer data.
- Let users delete reports.
- Explain privacy clearly in the methodology page.

### 7. Business impact scoring

Signals should be prioritized by:

- Frequency
- Intensity
- Specificity
- Business impact
- Confidence

Business impact should not invent revenue numbers. It should classify impact as LOW/MEDIUM/HIGH unless the user provides revenue/ad-spend data.

## Docs updated

The following documents were updated:

- `00_ARCHITECTURE_AND_SYSTEM_DESIGN.md`
- `02_ANALYSIS_ENGINE_SPEC.md`
- `04_DATABASE_API_AND_LOCAL_SETUP.md`
- `06_OPENHANDS_BUILD_PROMPTS.md`

## Founder takeaway

The uploaded instruction is useful. It does not replace the $0 architecture, but it makes it more robust and agent-friendly.

The most important additions are:

1. Clean architecture boundaries
2. Idempotent report creation
3. Fact/inference/assumption separation
4. Privacy by Design
5. Business-impact prioritization
