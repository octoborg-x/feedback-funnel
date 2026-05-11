import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const report = await prisma.report.findUnique({
    where: { id },
    include: { reviews: true }
  });
  
  if (!report) notFound();

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Analysis Report</h1>
        <p className="text-muted-foreground mb-6">
          {report.productName ?? 'Untitled'} • {report.reviewCount} reviews
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Quality</div>
            <div className="text-xl font-semibold">{report.qualityLevel}</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Verdict</div>
            <div className="text-xl font-semibold">{report.verdict}</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Confidence</div>
            <div className="text-xl font-semibold">{Math.round(report.confidence * 100)}%</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Scale Ready</div>
            <div className="text-xl font-semibold">{report.scaleReady}/100</div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Reason</h2>
          <p>{report.reason}</p>
        </div>
      </div>
    </main>
  );
}