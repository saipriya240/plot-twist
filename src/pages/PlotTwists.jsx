import { useEffect, useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fmtDate } from '@/lib/format';
import { toast } from '@/components/ui/use-toast';
import EmptyState from '@/components/EmptyState';

const items = (res) => (Array.isArray(res) ? res : (res && res.items) || []);

const KIND_LABEL = {
  change: 'A turn',
  new: 'Something new',
  recurring: 'A pattern',
  milestone: 'A milestone',
  people: 'People',
};

export default function PlotTwists() {
  const [memories, setMemories] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    base44.entities.Memory
      .filter({}, { sort: '-memory_date', limit: 60 })
      .then((res) => setMemories(items(res)))
      .finally(() => setLoading(false));
  }, []);

  const scan = async () => {
    if (memories.length < 2) {
      toast({ title: 'Not enough to compare', description: 'Save a few more memories across different days.' });
      return;
    }
    setScanning(true);
    try {
      const response = await base44.functions.invoke('detectPlotTwists', {
        memory_ids: memories.map((m) => m.id),
      });
      const data = response.data || {};
      if (data.error) throw new Error(data.error);
      setInsights(data.insights || []);
    } catch (error) {
      toast({ title: 'Could not scan your story', description: error.message, variant: 'destructive' });
    } finally {
      setScanning(false);
    }
  };

  const memoryById = (id) => memories.find((m) => m.id === id);

  return (
    <div className="animate-fade-in px-5 pb-8 pt-7">
      <p className="t-kicker text-flare">Pattern finder</p>
      <h1 className="t-hero mt-2.5 text-white">Plot twists</h1>
      <p className="mt-3 max-w-sm text-[12.5px] leading-relaxed text-ink-soft">
        What changed, what keeps coming back, and what you might have missed — with the memories that prove it.
      </p>

      <button
        type="button"
        onClick={scan}
        disabled={scanning || loading}
        className="t-meta mt-6 flex w-full items-center justify-center gap-2 rounded-sm bg-flare py-3.5 font-semibold tracking-[0.18em] text-white disabled:opacity-60"
      >
        {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : insights ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        {scanning ? 'Reading your story' : insights ? 'Scan again' : 'Scan my story'}
      </button>

      {insights === null ? (
        <div className="mt-6">
          <EmptyState
            icon={Sparkles}
            title="No scan yet"
            body="Your memories are the evidence. Nothing here is guessed or diagnosed."
          />
        </div>
      ) : insights.length ? (
        <div className="mt-6 space-y-3">
          {insights.map((insight) => (
            <div key={insight.title} className="rounded-md border border-ink-line bg-ink-raised p-4">
              <p className="t-cinema text-[11px] tracking-[0.3em] text-flare">{KIND_LABEL[insight.kind] || 'Insight'}</p>
              <p className="t-episode mt-2 text-white">{insight.title}</p>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/75">{insight.insight}</p>
              <div className="mt-3 space-y-1.5 border-t border-ink-line pt-3">
                {insight.memory_ids.map((id) => {
                  const memory = memoryById(id);
                  if (!memory) return null;
                  return (
                    <div key={id} className="flex items-baseline gap-2">
                      <span className="t-cinema shrink-0 text-[10px] tracking-[0.2em] text-white/25">{fmtDate(memory.memory_date || memory.created_date)}</span>
                      <span className="truncate font-display text-[13px] text-white/55">{memory.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={Sparkles}
            title="Nothing conclusive yet"
            body="There isn't enough saved detail for a pattern. Keep writing — the story will show itself."
          />
        </div>
      )}
    </div>
  );
}