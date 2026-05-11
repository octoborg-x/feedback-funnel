/**
 * themes.ts — v2 multi-domain taxonomy
 * 22 aspects: SaaS core / Fintech / E-commerce / Healthcare
 */

import type { ReviewIR, Theme } from '@/lib/types';

const ASPECT_TAXONOMY = [
  { name: 'Performance', vertical: 'core',
    seeds: ['performance','speed','fast','slow','lag','loading','response','latency'],
    negativeSeeds: ['crash','crashes','freeze','frozen','hangs','unresponsive','timeout','bug','glitch'],
    positiveSeeds: ['smooth','snappy','instant','quick','blazing'] },
  { name: 'Onboarding', vertical: 'core',
    seeds: ['onboarding','setup','getting started','signup','register','tutorial','walkthrough'],
    negativeSeeds: ['confusing setup','hard to start','overwhelming','no guidance','no tutorial'],
    positiveSeeds: ['easy setup','quick start','smooth onboarding','guided'] },
  { name: 'Usability', vertical: 'core',
    seeds: ['interface','ui','ux','design','navigation','dashboard','layout','workflow'],
    negativeSeeds: ['confusing','cluttered','hard to find','unintuitive','hard to use','poor design'],
    positiveSeeds: ['intuitive','clean','easy to use','user friendly','simple'] },
  { name: 'Reliability', vertical: 'core',
    seeds: ['reliable','stability','uptime','downtime','outage','consistent'],
    negativeSeeds: ['broken','stopped working','failed','failure','error','down','unreliable','keeps breaking'],
    positiveSeeds: ['always works','never fails','dependable','rock solid'] },
  { name: 'Integrations', vertical: 'core',
    seeds: ['integration','connect','sync','api','webhook','zapier','slack','plugin'],
    negativeSeeds: ['not connecting','sync failed','broken integration','disconnect','api broken'],
    positiveSeeds: ['connects easily','syncs perfectly','api works well'] },
  { name: 'Pricing & Value', vertical: 'core',
    seeds: ['price','pricing','cost','expensive','value','worth','subscription','billing','fee'],
    negativeSeeds: ['too expensive','overpriced','not worth','waste of money','hidden fees','price increase'],
    positiveSeeds: ['great value','affordable','worth the price','fair pricing'] },
  { name: 'Customer Support', vertical: 'core',
    seeds: ['support','customer service','help','ticket','chat support','email support'],
    negativeSeeds: ['no response','slow response','unhelpful','ignored','ghosted','bad support'],
    positiveSeeds: ['quick response','helpful team','great support','fast reply'] },
  { name: 'Features', vertical: 'core',
    seeds: ['feature','features','functionality','missing','lacks','wish','capability'],
    negativeSeeds: ['missing feature','no way to','does not have','not possible','no option'],
    positiveSeeds: ['powerful features','everything i need','feature rich'] },
  { name: 'Data & Exports', vertical: 'core',
    seeds: ['data','export','import','reports','csv','download','backup','analytics'],
    negativeSeeds: ['cannot export','no export','lost data','data loss','no backup'],
    positiveSeeds: ['easy export','great reports','detailed analytics'] },
  { name: 'Mobile App', vertical: 'core',
    seeds: ['mobile','app','ios','android','phone','iphone'],
    negativeSeeds: ['mobile broken','app crashes','no mobile','poor mobile','buggy app'],
    positiveSeeds: ['great app','mobile works well'] },
  { name: 'Security & Privacy', vertical: 'core',
    seeds: ['security','privacy','encryption','gdpr','two factor','2fa','sso'],
    negativeSeeds: ['security breach','data leak','not secure','privacy concern','no encryption'],
    positiveSeeds: ['secure','great security','privacy focused','gdpr compliant'] },
  { name: 'Notifications', vertical: 'core',
    seeds: ['notification','notifications','alert','alerts','reminder'],
    negativeSeeds: ['no notification','spam notifications','missing alerts'],
    positiveSeeds: ['timely alerts','useful reminders'] },
  { name: 'KYC & Verification', vertical: 'fintech',
    seeds: ['kyc','identity verification','verify','verification','document upload','id check'],
    negativeSeeds: ['kyc failed','verification failed','rejected','kyc delay','document rejected','cannot verify'],
    positiveSeeds: ['quick verification','easy kyc','smooth verification'] },
  { name: 'Payments & Transactions', vertical: 'fintech',
    seeds: ['payment','transaction','transfer','payout','deposit','withdrawal','refund','invoice'],
    negativeSeeds: ['payment failed','transaction failed','money stuck','delayed payment','double charged'],
    positiveSeeds: ['fast payment','instant transfer','easy payments'] },
  { name: 'Compliance & Regulation', vertical: 'fintech',
    seeds: ['compliance','regulation','audit','aml','pci','sox','regulatory','license'],
    negativeSeeds: ['not compliant','compliance issue','failed audit'],
    positiveSeeds: ['fully compliant','audit ready'] },
  { name: 'Inventory & SKU Sync', vertical: 'ecommerce',
    seeds: ['inventory','sku','stock','catalog','product sync','listing','variant'],
    negativeSeeds: ['sku sync failed','inventory not syncing','stock mismatch','catalog error','out of sync'],
    positiveSeeds: ['inventory syncs well','sku sync works','stock accurate'] },
  { name: 'Shipping & Fulfillment', vertical: 'ecommerce',
    seeds: ['shipping','fulfillment','delivery','shipment','carrier','tracking','logistics'],
    negativeSeeds: ['shipping delay','not delivered','lost package','wrong item','damaged','late delivery'],
    positiveSeeds: ['fast shipping','on time delivery','tracking works'] },
  { name: 'Marketplace Channels', vertical: 'ecommerce',
    seeds: ['amazon','shopify','ebay','etsy','walmart','marketplace','storefront'],
    negativeSeeds: ['amazon sync broken','shopify not connecting','channel error'],
    positiveSeeds: ['amazon integration works','shopify syncs well'] },
  { name: 'Orders & Returns', vertical: 'ecommerce',
    seeds: ['order','orders','return','returns','refund','exchange','cancellation'],
    negativeSeeds: ['order not found','return rejected','refund denied','cannot cancel'],
    positiveSeeds: ['easy returns','fast refund','order management works'] },
  { name: 'EHR & Patient Records', vertical: 'healthcare',
    seeds: ['ehr','emr','patient record','charting','documentation','clinical notes'],
    negativeSeeds: ['records not syncing','ehr broken','charting error','lost records'],
    positiveSeeds: ['records sync well','easy charting','great documentation'] },
  { name: 'HIPAA & Compliance', vertical: 'healthcare',
    seeds: ['hipaa','patient privacy','phi','protected health','baa'],
    negativeSeeds: ['not hipaa compliant','compliance issue','data breach','privacy violation'],
    positiveSeeds: ['hipaa compliant','secure records','baa signed'] },
  { name: 'Scheduling & Appointments', vertical: 'healthcare',
    seeds: ['scheduling','appointment','booking','availability','slot','reminder'],
    negativeSeeds: ['scheduling error','double booking','appointment lost','booking failed'],
    positiveSeeds: ['easy scheduling','booking works','appointment reminders'] },
] as const;

function matchesAspect(text: string, aspect: typeof ASPECT_TAXONOMY[number]) {
  for (const seed of aspect.negativeSeeds)
    if (new RegExp(`\\b${seed.replace(/\s+/g, '\\s+')}\\b`, 'i').test(text))
      return { matched: true, sentimentOverride: -0.4 };
  for (const seed of aspect.positiveSeeds)
    if (new RegExp(`\\b${seed.replace(/\s+/g, '\\s+')}\\b`, 'i').test(text))
      return { matched: true, sentimentOverride: 0.4 };
  for (const seed of aspect.seeds)
    if (new RegExp(`\\b${seed.replace(/\s+/g, '\\s+')}\\b`, 'i').test(text))
      return { matched: true, sentimentOverride: null };
  return { matched: false, sentimentOverride: null };
}

export function detectThemes(reviews: ReviewIR[]): {
  themes: Theme[];
  unmatchedReviews: ReviewIR[];
} {
  if (!reviews.length) return { themes: [], unmatchedReviews: [] };
  const matchedIndices = new Set<number>();
  const themes: Theme[] = [];

  for (const aspect of ASPECT_TAXONOMY) {
    const matches: { sentimentScore: number }[] = [];
    reviews.forEach((review, idx) => {
      const { matched, sentimentOverride } = matchesAspect(review.normalizedText, aspect);
      if (!matched) return;
      const score = sentimentOverride ?? review.sentimentScore;
      if (Math.abs(score) > 0.05) {
        matches.push({ sentimentScore: score });
        matchedIndices.add(idx);
      }
    });
    if (matches.length > 0) {
      themes.push({
        name: aspect.name,
        keywords: [...aspect.seeds].slice(0, 3),
        count: matches.length,
        percentage: matches.length / reviews.length,
        sentiment: matches.reduce((s, r) => s + r.sentimentScore, 0) / matches.length,
      });
    }
  }
  return {
    themes: themes.sort((a, b) => b.count - a.count),
    unmatchedReviews: reviews.filter((_, i) => !matchedIndices.has(i)),
  };
}

export function getDominantComplaints(themes: Theme[], min = 0.08) {
  return themes.filter(t => t.sentiment < -0.1 && t.percentage >= min)
    .sort((a, b) => b.percentage - a.percentage);
}

export function getDominantPraise(themes: Theme[], min = 0.08) {
  return themes.filter(t => t.sentiment > 0.1 && t.percentage >= min)
    .sort((a, b) => b.percentage - a.percentage);
}