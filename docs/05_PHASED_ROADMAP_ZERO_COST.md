# RIE Zero-Cost Phased Roadmap

## Principle

Every phase must be useful without paid infrastructure.

Do not add paid APIs, paid scraping, or paid hosting until the product proves value.

## Phase 0 — Product foundation

Goal:

Clarify the product before building.

Deliverables:

- Final product name
- Positioning statement
- Core verdict labels
- Report sections
- Methodology language
- Sample review datasets

Decisions:

- Use “review integrity risk,” not “fake review detector.”
- Use “listing anomaly risk,” not “competitor attack detector.”
- Build local-first.

Done when:

- Product has a clear promise.
- UI copy avoids overclaiming.
- Sample reports can be sketched.

## Phase 1 — Local MVP

Goal:

Build a working local app that analyzes pasted reviews and returns a premium-looking decision report.

Features:

- Next.js app
- SQLite database
- Paste reviews
- Input quality score
- Deterministic analysis
- Risk scores
- Final decision
- Report page
- Dashboard/history
- Print/export

No:

- Paid AI
- Scraping
- Billing
- Multi-user accounts

Done when:

- User can paste 20–200 reviews.
- App returns a useful decision report.
- Report is saved locally.
- User can print/save PDF.

## Phase 2 — CSV and data quality upgrade

Goal:

Make input reliable and easier.

Features:

- CSV upload
- CSV validation
- Sample CSV template
- Better parse errors
- Input quality preview before submit
- Row-level warnings
- Data cleanup suggestions

Done when:

- Messy user data can be imported safely.
- User understands what metadata improves accuracy.

## Phase 3 — Premium report experience

Goal:

Make the report feel like a paid consulting output.

Features:

- Executive decision brief
- Evidence cards
- Timeline if dates exist
- Action plan grouped by priority
- Methodology/limitations
- Print-friendly report
- Better visual hierarchy

Done when:

- A seller can understand what to do in 30 seconds.
- Every claim has evidence.

## Phase 4 — Optional local AI enhancement

Goal:

Improve theme labels and explanations using free local AI.

Tool:

- Ollama

Features:

- Optional local model connection
- Theme label enhancement
- Summary rewriting
- Action plan wording improvement

Rules:

- App must work without Ollama.
- Deterministic scoring stays in code.
- Local model output must be validated.

Done when:

- Enabling Ollama improves language quality.
- Disabling Ollama still leaves the product fully functional.

## Phase 5 — Local monitoring mode

Goal:

Create recurring usage without paid cloud.

Features:

- Saved product/listing profiles
- Multiple reports per product
- Compare latest report vs previous report
- “What changed?” section
- Trend chart
- New issue detection
- Resolved issue detection

Done when:

- User has a reason to run the app repeatedly.

## Phase 6 — Evidence pack

Goal:

Create a premium deliverable for anomaly cases.

Features:

- Anomaly evidence summary
- Review examples
- Timeline table
- Metadata gaps
- Suggested manual investigation checklist
- Draft message for internal team or Amazon support

Important:

- Do not claim attack proof.
- Say “evidence pack for investigation.”

Done when:

- High anomaly reports produce a shareable investigation packet.

## Phase 7 — Hosted demo, still $0

Goal:

Allow others to try the app without local setup.

Options:

- Vercel free tier
- Netlify free tier
- Render free tier if available

Persistence options:

- Demo mode with no persistence
- Browser localStorage
- Supabase free tier
- Turso free tier

Recommended:

- Keep the serious version local-first.
- Use hosted demo only for marketing and feedback.

Done when:

- Demo can run without paid services.
- Data privacy limitations are clear.

## Phase 8 — Validation before monetization

Goal:

Prove that sellers would pay.

Do manually:

- Share reports with 10 Amazon sellers.
- Ask if the decision was useful.
- Ask what action they would take.
- Ask what they would pay monthly.

Metrics:

- Report usefulness score
- Would-pay score
- Accuracy feedback
- Time saved
- Repeat usage intent

Done when:

- At least 5 sellers say the report would change a business decision.

## Phase 9 — Paid version later

Only after validation.

Possible paid upgrades:

- Hosted database
- Auth provider
- Paid LLM API
- Billing
- Team accounts
- Monitoring alerts
- Integrations
- API

Do not build this until the local MVP proves value.

## Founder priority order

1. Useful decision
2. Evidence behind decision
3. Premium report design
4. Repeat usage
5. Optional local AI
6. Hosted demo
7. Monetization

## What to avoid

- Building scraping too early
- Paying for AI before proving the workflow
- Overbuilding auth/billing
- Creating complex infrastructure
- Claiming fraud/attacks as fact
- Building dashboards before reports are useful
