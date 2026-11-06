import { useEffect, useRef, useState } from 'react';
import moment from 'moment';
import html2canvas from 'html2canvas';
import { Clapperboard, Loader2, Sparkles, Play, Pause, Download, Share2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { pad } from '@/lib/constants';
import { monthName } from '@/lib/format';
import { toast } from '@/components/ui/use-toast';
import Storyboard from '@/components/Storyboard';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const items = (res) => (Array.isArray(res) ? res : (res && res.items) || []);

const SCOPES = [
  { key: 'month', label: 'This month' },
  { key: 'season', label: 'This season' },
  { key: 'year', label: 'This year' },
  { key: 'custom', label: 'Custom' },
];

export default function Trailer() {
  const [scope, setScope] = useState('month');
  const [memories, setMemories] = useState([]);
  const [season, setSeason] = useState(null);
  const [month, setMonth] = useState(moment().month() + 1);
  const [year, setYear] = useState(moment().year());
  const [customIds, setCustomIds] = useState([]);
  const [trailer, setTrailer] = useState(null);
  const [saved, setSaved] = useState([]);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  const sheetRef = useRef(null);

  const load = async () => {
    const [memRes, seasonRes, trailerRes] = await Promise.all([
      base44.entities.Memory.filter({}, { sort: '-memory_date', limit: 150 }),
      base44.entities.Season.filter({}, { sort: '-season_number', limit: 1 }),
      base44.entities.LifeTrailer.filter({}, { sort: '-created_date', limit: 20 }),
    ]);
    setMemories(items(memRes));
    setSeason(items(seasonRes)[0] || null);
    setSaved(items(trailerRes));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      setFrame((current) => {
        const total = trailer?.storyboard?.length || 1;
        return (current + 1) % total;
      });
    }, 2600);
    return () => clearInterval(timer);
  }, [playing, trailer]);

  const scopeMemories = () => {
    if (scope === 'custom') return memories.filter((m) => customIds.includes(m.id));
    if (scope === 'season') {
      return season ? memories.filter((m) => m.season_id === season.id) : [];
    }
    if (scope === 'year') return memories.filter((m) => String(m.memory_date || '').startsWith(String(year)));
    return memories.filter((m) => {
      const value = String(m.memory_date || '');
      return value.startsWith(`${year}-${pad(month)}`);
    });
  };

  const scopeLabel = () => {
    if (scope === 'month') return `${monthName(month, year)} ${year}`;
    if (scope === 'season') return season ? `Season ${pad(season.season_number || 1)} · ${season.title}` : 'This season';
    if (scope === 'year') return String(year);
    return 'Selected memories';
  };

  const generate = async () => {
    const chosen = scopeMemories();
    if (!chosen.length) {
      toast({ title: 'No memories in this range', description: 'Pick another scope or add a memory first.' });
      return;
    }
    setBusy(true);
    try {
      const response = await base44.functions.invoke('generateTrailer', {
        memory_ids: chosen.map((m) => m.id),
        scope_label: scopeLabel(),
      });
      const data = response.data || {};
      if (data.error) throw new Error(data.error);

      const photos = chosen
        .flatMap((memory) => (memory.media || []).filter((item) => item.type !== 'video').map((item) => item.url))
        .slice(0, 10);
      const lines = data.lines && data.lines.length ? data.lines : ['A story in progress.'];
      const storyboard = lines.slice(0, 8).map((line, index) => ({
        line,
        photo: photos.length ? photos[index % photos.length] : '',
      }));

      const record = await base44.entities.LifeTrailer.create({
        title: data.title,
        script: data.script,
        scope,
        scope_label: scopeLabel(),
        memory_ids: chosen.map((m) => m.id),
        storyboard,
      });

      setTrailer({ ...record, storyboard });
      setFrame(0);
      setPlaying(false);
      load();
      toast({ title: 'Your trailer is cut' });
    } catch (error) {
      toast({ title: 'Could not cut the trailer', description: error.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!sheetRef.current) return;
    try {
      const canvas = await html2canvas(sheetRef.current, { backgroundColor: '#090909', scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `${String(trailer.title).replace(/\s+/g, '-').toLowerCase()}-storyboard.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast({ title: 'Storyboard downloaded' });
    } catch (error) {
      toast({ title: 'Could not export the storyboard', description: 'Copy the script instead.', variant: 'destructive' });
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: trailer.title, text: trailer.script });
        return;
      } catch (error) {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${trailer.title}\n\n${trailer.script}`);
      toast({ title: 'Script copied' });
    } catch (error) {
      toast({ title: 'Sharing is not available here', variant: 'destructive' });
    }
  };

  return (
    <div className="animate-fade-in px-5 pb-8 pt-7">
      <p className="t-kicker text-flare">Coming soon</p>
      <h1 className="t-hero mt-2.5 text-white">Life trailer</h1>
      <p className="mt-3 max-w-sm text-[12.5px] leading-relaxed text-ink-soft">
        A voiceover script and a storyboard built from your real photographs.
      </p>

      <div className="no-scrollbar mt-5 flex gap-1.5 overflow-x-auto">
        {SCOPES.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setScope(item.key)}
            className={`t-meta shrink-0 rounded-full border px-3.5 py-2 tracking-[0.14em] transition ${
              scope === item.key ? 'border-flare bg-flare/10 text-white' : 'border-ink-line bg-ink-raised text-white/45'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-md border border-ink-line bg-ink-raised p-4">
        {scope === 'month' ? (
          <Input type="month" value={`${year}-${pad(month)}`} onChange={(e) => {
            const [y, m] = e.target.value.split('-');
            if (y && m) {
              setYear(Number(y));
              setMonth(Number(m));
            }
          }} className="border-ink-line bg-ink-card" />
        ) : null}

        {scope === 'year' ? (
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="border-ink-line bg-ink-card" />
        ) : null}

        {scope === 'season' ? (
          <p className="font-display text-[16px] text-white/70">
            {season ? `Season ${pad(season.season_number || 1)} · ${season.title}` : 'No season yet'}
          </p>
        ) : null}

        {scope === 'custom' ? (
          <div>
            <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Select memories ({customIds.length})</Label>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {memories.map((memory) => (
                <label key={memory.id} className="flex cursor-pointer items-center gap-2.5 rounded-sm px-1 py-1.5">
                  <Checkbox
                    checked={customIds.includes(memory.id)}
                    onCheckedChange={() =>
                      setCustomIds((prev) => (prev.includes(memory.id) ? prev.filter((id) => id !== memory.id) : [...prev, memory.id]))
                    }
                    className="border-white/25"
                  />
                  <span className="truncate text-[12px] text-white/80">{memory.title}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-3 text-[11px] text-white/35">{scopeMemories().length} memories in this cut</p>

        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="t-meta mt-4 flex w-full items-center justify-center gap-2 rounded-sm bg-flare py-3.5 font-semibold tracking-[0.18em] text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? 'Cutting your trailer' : 'Generate trailer'}
        </button>
      </div>

      {trailer ? (
        <div className="mt-7">
          {playing ? (
            <Storyboard trailer={trailer} frame={frame} />
          ) : (
            <Storyboard trailer={trailer} innerRef={sheetRef} />
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-ink-line bg-ink-raised py-2.5 t-meta font-semibold tracking-[0.14em] text-white/80"
            >
              {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {playing ? 'Stop' : 'Play'}
            </button>
            <button type="button" onClick={download} className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-ink-line bg-ink-raised py-2.5 t-meta font-semibold tracking-[0.14em] text-white/80">
              <Download className="h-3 w-3" /> Storyboard
            </button>
            <button type="button" onClick={share} className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-ink-line bg-ink-raised py-2.5 t-meta font-semibold tracking-[0.14em] text-white/80">
              <Share2 className="h-3 w-3" /> Share
            </button>
          </div>

          <div className="mt-4 rounded-md border border-ink-line bg-ink-raised p-4">
            <p className="t-cinema text-[12px] tracking-[0.28em] text-white/40">Voiceover script</p>
            <p className="t-body mt-3 whitespace-pre-line text-[13.5px] leading-[1.85] text-white/80">{trailer.script}</p>
          </div>
        </div>
      ) : null}

      {saved.length ? (
        <div className="mt-8">
          <p className="t-kicker mb-3 text-ink-soft">Your trailers</p>
          <div className="space-y-1.5">
            {saved.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTrailer(item);
                  setPlaying(false);
                  setFrame(0);
                }}
                className="flex w-full items-center justify-between rounded-md border border-ink-line bg-ink-raised px-3.5 py-3 text-left"
              >
                <span className="truncate font-display text-[16px] text-white">{item.title}</span>
                <span className="t-cinema ml-2 shrink-0 text-[10px] tracking-[0.2em] text-white/30">{item.scope_label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}