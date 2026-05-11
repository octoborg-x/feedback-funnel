'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

type FeedbackItem = { text: string; index: number };

function parseReviews(text: string): FeedbackItem[] {
  if (!text.trim()) return [];
  const lines = text.split(/[\n;]|(?:\d+\.\s)/).map(line => line.trim()).filter(line => line.length > 10);
  return lines.map((text, index) => ({ text, index }));
}

export default function AnalyzePage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const items = useMemo(() => parseReviews(text), [text]);
  const canSubmit = items.length >= 10;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: items.map(i => i.text).join('\n') })
      });
      const data = await response.json();
      if (data.reportId) {
        router.push(`/reports/${data.reportId}`);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [items, canSubmit, isLoading, router]);

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Import Feedback Data</h1>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste reviews here (one per line)..."
          className="w-full h-64 p-4 border rounded-lg"
        />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-muted-foreground">
            Items: {items.length} {items.length < 10 && `(${10 - items.length} more needed)`}
          </span>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            className="px-4 py-2 bg-foreground text-background rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Feedback'}
          </button>
        </div>
      </div>
    </main>
  );
}