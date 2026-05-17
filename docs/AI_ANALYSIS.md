# RIE Zero Cost Docs - Independent Analysis

> **File Type:** AI-to-AI Context Metadata  
> **Purpose:** Provide context for AI agents working in this repository  
> **Generated:** 2026-05-02  
> **Author:** OpenHands AI Agent

---

## What This Repository Is About

This repository contains documentation for building a **Review Intelligence Engine (RIE)** - a zero-cost Amazon review analysis tool for sellers. The product answers one question:

> "Should I scale this listing, fix the product/listing first, or investigate suspicious review patterns?"

---

## Documentation Structure

| File | Purpose |
|------|---------|
| `00_ARCHITECTURE_AND_SYSTEM_DESIGN.md` | Technical architecture, stack choices, hexagonal architecture |
| `01_MVP_FEATURES_AND_BUILD_STEPS.md` | 11 MVP features with step-by-step build sequence |
| `02_ANALYSIS_ENGINE_SPEC.md` | Deterministic NLP and scoring engine specification |
| `03_UI_UX_AND_PREMIUM_EXPERIENCE.md` | Design guidelines |
| `04_DATABASE_API_AND_LOCAL_SETUP.md` | Prisma/SQLite setup, API design |
| `05_PHASED_ROADMAP_ZERO_COST.md` | Build phases |
| `06_OPENHANDS_BUILD_PROMPTS.md` | AI agent prompts for building |
| `07_ZERO_COST_RESOURCE_PLAN.md` | Free tool recommendations |
| `08_ADVANCED_ARCHITECTURE_UPDATES_FROM_INSTRU.md` | Advanced updates |
| `09_START_HERE_STEP_BY_STEP_WITH_OPENHANDS.md` | Step-by-step guide |

---

## Key Technical Constraints

1. **$0 Cost** - No paid APIs, databases, or services allowed in MVP
2. **Deterministic-first** - Use keyword/pattern matching before optional Ollama
3. **Local-first** - SQLite with Prisma, no external database initially
4. **Conservative claims** - Never claim "fake review" detection, use "review integrity risk" instead
5. **Privacy-focused** - Reviews stay local unless user intentionally deploys

---

## Recommended Stack

- **Frontend:** Next.js + React + TypeScript + Tailwind CSS
- **Backend:** Next.js API routes / Server Actions
- **Database:** SQLite with Prisma
- **AI/NLP:** Deterministic TypeScript + optional Ollama
- **Deployment:** Local first, then Vercel/Netlify free tier

---

## Important Context for AI Agents

### Known Issues in These Docs

1. **Scope Creep** - The "MVP" feature list (11 features) is actually larger than a true minimum viable product would need. Consider prioritizing core features first.

2. **Arbitrary Scoring Weights** - Risk scoring formulas (e.g., 40% dominant complaint + 25% negative sentiment) are not validated. They may need adjustment based on real-world testing.

3. **Pattern Detection Limitations** - The "generic short review" detection may flag legitimate reviews as suspicious. Short positive reviews are common and valid.

4. **Data Source Not Specified** - Docs assume reviews are available but don't explain how users obtain them.

5. **SQLite on Serverless** - Vercel serverless + SQLite file storage doesn't work well. Consider Turso or Supabase later.

### What's Missing

- Validation test datasets
- Competitive analysis
- Revenue model
- Evidence for why specific signals predict outcomes

---

## How to Use These Docs

For AI agents building this project:

1. Start with `00_ARCHITECTURE_AND_SYSTEM_DESIGN.md` for technical context
2. Follow `01_MVP_FEATURES_AND_BUILD_STEPS.md` build sequence
3. Reference `02_ANALYSIS_ENGINE_SPEC.md` for analysis logic
4. Build incrementally - don't try to implement everything at once

**Suggested MVP priority:**
1. Parse pasted reviews
2. Simple sentiment scoring
3. Basic decision (scale/fix/investigate)
4. Report display
5. Dashboard (optional for v1)
6. CSV upload (optional for v1)

---

## Repository Status

- **Remote:** https://github.com/octoborg-x/rie-project
- **Default Branch:** main
- **Language:** Markdown documentation

---

> This metadata file helps AI agents understand the project context without needing to analyze all documentation files from scratch.