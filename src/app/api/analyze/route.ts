/**
 * route.ts — POST /api/analyze
 * Wires the full pipeline in correct order.
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseTextInput, parseCSVInput, normalizeReview } from '@/lib/parser';
import { anonymizeBatch, minimizeBatch } from '@/lib/privacy';
import { scoreInputQuality } from '@/lib/quality';
import { generateReport } from '@/lib/report';
import { prisma } from '@/lib/db';

console.log('[analyze] Module loaded');

export async function POST(req: NextRequest) {
  console.log('[analyze] POST called');
  try {
    const body = await req.json();
    console.log('[analyze] Body keys:', Object.keys(body));
    const { text, csv, productName, reviews } = body;

    let rawInputs;
    
    // Accept reviews array directly or parse from text/csv
    if (reviews && Array.isArray(reviews)) {
      rawInputs = reviews.map((r: { text: string; rating?: number; date?: string; verified?: boolean }) => ({
        text: r.text,
        rating: r.rating,
        date: r.date,
        verified: r.verified,
      }));
    } else {
      rawInputs = csv
        ? parseCSVInput(csv)
        : parseTextInput(text ?? '');
    }

    console.log('[analyze] rawInputs.length =', rawInputs?.length ?? 'undefined');
    console.log('[analyze] reviews is array:', Array.isArray(reviews));
    console.log('[analyze] reviews?.length:', reviews?.length);

    if (rawInputs.length < 10) {
      return NextResponse.json(
        { error: 'Minimum 10 reviews required.' },
        { status: 400 }
      );
    }

    // Privacy: strip PII
    const batch = anonymizeBatch(rawInputs.map(r => r.text));
    const cleanInputs = rawInputs.map((input, i) => ({
      ...input,
      text: batch.reviews[i].cleanText,
    }));

    // Input quality
    const quality = scoreInputQuality(cleanInputs);
    quality.warnings.push(...(batch.piiCount > 0
      ? [`${batch.piiCount} review(s) contained PII — anonymized before processing.`]
      : []));

    // Normalize (VADER scoring per review)
    const scoredReviews = cleanInputs.map(normalizeReview);

    // Generate full report
    const report = await generateReport(scoredReviews, quality);

    // Minimize memory footprint before DB
    const safeReviews = minimizeBatch(scoredReviews);

    // Save to DB
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