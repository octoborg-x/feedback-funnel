/**
 * route.ts — POST /api/analyze
 * Wires the full pipeline in correct order.
 *
 * Pipeline:
 * 1. Parse input
 * 2. Privacy — strip PII
 * 3. Quality score
 * 4. Normalize (VADER sentiment per review)
 * 5. Generate report (themes → scoring → decision)
 * 6. Minimize (remove tokens before DB save)
 * 7. Save + return
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseTextInput, parseCSVInput, normalizeReview } from '@/lib/parser';
import { anonymizeBatch, minimizeBatch } from '@/lib/privacy';
import { scoreInputQuality } from '@/lib/quality';
import { generateReport } from '@/lib/report';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, csv, productName } = body;

    // Step 1 — Parse
    const rawInputs = csv
      ? parseCSVInput(csv)
      : parseTextInput(text ?? '');

    if (rawInputs.length < 10) {
      return NextResponse.json(
        { error: 'Minimum 10 reviews required.' },
        { status: 400 }
      );
    }

    // Step 2 — Privacy: strip PII before any processing
    const batch = anonymizeBatch(rawInputs.map(r => r.text));
    const cleanInputs = rawInputs.map((input, i) => ({
      ...input,
      text: batch.reviews[i].cleanText, // use anonymized text throughout
    }));

    // Step 3 — Input quality
    const quality = scoreInputQuality(cleanInputs);
    quality.warnings.push(...(batch.piiCount > 0
      ? [`${batch.piiCount} review(s) contained PII — anonymized before processing.`]
      : []));

    // Step 4 — Normalize (VADER scoring per review)
    const reviews = cleanInputs.map(normalizeReview);

    // Step 5 — Generate full report
    const report = await generateReport(reviews, quality);

    // Step 6 — Minimize memory footprint before DB
    const safeReviews = minimizeBatch(reviews);

    // Step 7 — Save to DB
    const saved = await prisma.report.create({
      data: {
        productName: productName ?? null,
        reviewCount: quality.reviewCount,
        qualityLevel: quality.level,
        qualityScore: quality.completenessScore,
        productRisk: report.risks.productRisk,
        integrityRisk: report.risks.integrityRisk,
        anomalyRisk: report.risks.anomalyRisk,
        scaleReady: report.risks.scaleReady,
        verdict: report.verdict.type,
        reason: report.verdict.reason,
        confidence: report.verdict.confidence,
        reviews: {
          create: safeReviews.map((r, i) => ({
            text: r.text,
            rating: cleanInputs[i].rating ?? null,
            date: cleanInputs[i].date ? new Date(cleanInputs[i].date!) : null,
            verified: cleanInputs[i].verified ?? null,
          })),
        },
      },
    });

    return NextResponse.json({ reportId: saved.id, report });
  } catch (err) {
    console.error('[analyze]', err);
    return NextResponse.json({ error: 'Analysis failed.' }, { status: 500 });
  }
}