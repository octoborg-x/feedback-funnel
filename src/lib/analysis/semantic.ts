/**
 * semantic.ts — LLM semantic analysis with provider fallback chain
 *
 * Priority order:
 * 1. Gemini 2.5 Flash-Lite (free, 1500 req/day)
 * 2. Groq Llama 3.3 70B (free, 800 req/day)
 * 3. Deterministic-only mode (no LLM — VADER + patterns still run)
 *
 * Rules:
 * - Never throw to caller — always return SemanticResult | null
 * - null = deterministic-only mode, caller handles gracefully
 * - Log which provider was used for observability
 */

import type { ReviewIR } from '@/lib/types';

export interface SemanticTheme {
  name: string;
  description: string;
  reviewIndices: number[];
  sentiment: 'positive' | 'negative' | 'mixed';
  isChurnRelated: boolean;
}

export interface SemanticResult {
  themes: SemanticTheme[];
  coordinationSignals: { indices: number[]; reason: string }[];
  provider: string;   // which provider was used — for logging
}

// ─── PROMPT ───────────────────────────────────────────────────────────────────

function buildPrompt(texts: string[]): string {
  return `You are a product feedback analyst. Analyze these customer feedback items.

Return ONLY valid JSON. No markdown, no explanation.

Schema:
{
  "themes": [
    {
      "name": "string (e.g. Onboarding, Performance, Pricing)",
      "description": "one sentence",
      "reviewIndices": [0, 1, 2],
      "sentiment": "positive | negative | mixed",
      "isChurnRelated": true | false
    }
  ],
  "coordinationSignals": [
    {
      "indices": [0, 1],
      "reason": "why these look coordinated"
    }
  ]
}

Rules:
- Only include themes with 2+ reviews
- coordinationSignals only if genuinely suspicious — default to empty array
- reviewIndices are 0-based positions in the input list

Feedback items:
${texts.map((t, i) => `[${i}] ${t}`).join('\n')}`;
}

// ─── PROVIDER: GEMINI ─────────────────────────────────────────────────────────

async function callGemini(texts: string[]): Promise<SemanticResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(texts) }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2000 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw Object.assign(new Error('Gemini error'), { status: res.status, detail: err });
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
  return { ...parsed, provider: 'gemini-flash-lite' };
}

// ─── PROVIDER: GROQ ───────────────────────────────────────────────────────────

async function callGroq(texts: string[]): Promise<SemanticResult> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 2000,
      messages: [{ role: 'user', content: buildPrompt(texts) }],
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw Object.assign(new Error('Groq error'), { status: res.status, detail: err });
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '';
  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
  return { ...parsed, provider: 'groq-llama-3.3' };
}

// ─── FALLBACK CHAIN ───────────────────────────────────────────────────────────

export async function runSemanticAnalysis(
  reviews: ReviewIR[]
): Promise<SemanticResult | null> {
  const texts = reviews.map(r => r.text);

  // Provider 1: Gemini free
  try {
    const result = await callGemini(texts);
    console.log('[semantic] provider=gemini-flash-lite');
    return result;
  } catch (err: any) {
    const isQuota = err.status === 429 || err.status === 503;
    console.warn(`[semantic] Gemini failed (${err.status}) — ${isQuota ? 'quota' : 'error'}`);
  }

  // Provider 2: Groq (only if key configured)
  if (process.env.GROQ_API_KEY) {
    try {
      const result = await callGroq(texts);
      console.log('[semantic] provider=groq-llama-3.3 (fallback)');
      return result;
    } catch (err: any) {
      console.warn(`[semantic] Groq failed (${err.status}) — falling back to deterministic`);
    }
  }

  // Provider 3: Deterministic-only — null tells caller to skip semantic fields
  console.warn('[semantic] All providers failed — deterministic-only mode');
  return null;
}