# RIE $0 Resource Plan

## Goal

Start and run the project without paying for tools, APIs, hosting, databases, auth, or scraping.

## Core resources

| Need | Free solution | Notes |
|---|---|---|
| Code editor/agent | OpenHands | User preference |
| Frontend/backend | Next.js | One app, less infrastructure |
| Language | TypeScript | Strong types |
| Styling | Tailwind CSS | Free |
| Database | SQLite | Local file DB |
| ORM | Prisma | Free |
| Auth | No auth at first / local auth later | Avoid paid auth |
| AI | Deterministic code | Free and reliable |
| Optional AI | Ollama local models | Free if machine can run it |
| Charts | Recharts | Free |
| CSV parsing | PapaParse | Free |
| Icons | Lucide React | Free |
| PDF/export | Browser print | Free |
| Hosting | Local first | True $0 |

## Avoid these at the start

| Avoid | Reason |
|---|---|
| Anthropic/OpenAI API | Paid usage |
| Clerk | Free tier exists but avoid dependency |
| Supabase | Free tier exists but local SQLite is simpler |
| Stripe | Not needed before monetization |
| Railway/Render paid | Not needed |
| ScraperAPI/Apify | Paid and ToS risk |
| Residential proxies | Paid and risky |
| Pinecone/Weaviate | Overkill and may cost later |
| Redis/BullMQ | Not needed for local MVP |

## Local-first setup

Run:

```bash
npm install
npm run dev
```

Database:

```bash
npx prisma migrate dev
```

No secrets needed.

## Optional local AI setup

Only later.

Install Ollama:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Pull a model:

```bash
ollama pull llama3.1:8b
```

Run:

```bash
ollama serve
```

Use only for optional theme-label improvement.

## Free deployment options

### Option A — Local only

Best for first MVP.

Pros:

- True $0
- Private
- Simple
- SQLite works perfectly

Cons:

- Not shareable online

### Option B — Vercel free demo

Pros:

- Easy public demo
- Free tier

Cons:

- SQLite persistence is not reliable on serverless
- Use demo mode or external free DB

### Option C — Netlify free demo

Similar to Vercel.

### Option D — Supabase free tier later

Pros:

- Hosted Postgres
- Free tier
- Easier public persistence

Cons:

- External service dependency
- Free tier limits

### Option E — Turso free tier later

Pros:

- SQLite-compatible hosted DB
- Good fit for local SQLite app

Cons:

- External service dependency
- Free tier limits

## Recommended path

1. Build local-first with SQLite.
2. Validate with real sellers manually.
3. If people want to try it online, create hosted demo with no sensitive data.
4. Add free hosted DB only if needed.
5. Add paid services only after user demand is proven.

## Cost-control rules

- No required API keys.
- No required cloud account.
- No background jobs that require servers.
- No scraping.
- No billing integration.
- No paid analytics.
- No paid email provider.

## Future paid upgrade map

Only after validation:

| Feature | Paid option later |
|---|---|
| Higher-quality semantic AI | Anthropic/OpenAI |
| Hosted multi-user app | Supabase/Neon/Turso |
| Auth | Clerk/Supabase Auth |
| Billing | Stripe |
| Monitoring alerts | Email provider |
| Enterprise | Dedicated hosting |

## Founder note

The $0 version should prove the core value:

> Can the app produce a decision report that sellers trust enough to change what they do?

If yes, paid infrastructure can come later. If no, paid infrastructure will not save the product.
