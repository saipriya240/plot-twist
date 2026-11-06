import { useState } from 'react';
import { Play, Pause, RefreshCw, Loader2, Sparkles } from 'lucide-react';

export default function RecapCard({ recap, onRefresh, loading }) {
  const [speaking, setSpeaking] = useState(false);

  const toggle = () => {
    if (!recap) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(recap);
    utterance.rate = 0.94;
    utterance.pitch = 0.95;
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <div className="mx-5 overflow-hidden rounded-sm border border-ink-line bg-gradient-to-b from-ink-card to-ink-raised p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="t-cinema text-[15px] tracking-[0.32em] text-flare">Previously on</p>
          <p className="t-kicker mt-2 text-white/30">Your life, so far</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Regenerate recap"
          className="mt-1 text-white/35 transition hover:text-white disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </button>
      </div>

      {recap ? (
        <>
          <p className="t-lead mt-4 text-white/85">{recap}</p>
          <button
            type="button"
            onClick={toggle}
            className="t-kicker mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-white/75 transition hover:border-flare hover:text-white"
          >
            {speaking ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {speaking ? 'Pause recap' : 'Play recap'}
          </button>
        </>
      ) : (
        <>
          <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
            Your narrator can weave your latest memories into a short cinematic recap.
          </p>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="t-kicker mt-5 inline-flex items-center gap-2 rounded-sm bg-flare px-4 py-2.5 text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? 'Writing' : 'Write my recap'}
          </button>
        </>
      )}
    </div>
  );
}