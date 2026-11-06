import { useEffect, useRef, useState } from 'react';
import moment from 'moment';
import html2canvas from 'html2canvas';
import { Film, Loader2, Sparkles, Download, Share2, Pencil, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { monthName } from '@/lib/format';
import { pad } from '@/lib/constants';
import { toast } from '@/components/ui/use-toast';
import FinalePoster from '@/components/FinalePoster';
import MediaThumb from '@/components/MediaThumb';
import EmptyState from '@/components/EmptyState';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const items = (res) => (Array.isArray(res) ? res : (res && res.items) || []);
const photosOf = (memories) =>
  memories.flatMap((memory) => (memory.media || []).filter((item) => item.type !== 'video').map((item) => item.url)).slice(0, 6);

export default function Finales() {
  const [finales, setFinales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [month, setMonth] = useState(moment().month() + 1);
  const [year, setYear] = useState(moment().year());
  const [memoryCount, setMemoryCount] = useState(null);
  const [active, setActive] = useState(null);
  const [activePhotos, setActivePhotos] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState({ title: '', narrative: '', closing_narration: '' });
  const posterRef = useRef(null);

  const load = async () => {
    const res = await base44.entities.MonthlyFinale.filter({}, { sort: '-year', limit: 50 });
    setFinales(items(res));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const start = moment(`${year}-${pad(month)}-01`).format('YYYY-MM-DD');
    const end = moment(start).endOf('month').format('YYYY-MM-DD');
    base44.entities.Memory.count({ memory_date: { $gte: start, $lte: end } })
      .then(setMemoryCount)
      .catch(() => setMemoryCount(null));
  }, [month, year]);

  const generate = async () => {
    setGenerating(true);
    try {
      const start = moment(`${year}-${pad(month)}-01`).format('YYYY-MM-DD');
      const end = moment(start).endOf('month').format('YYYY-MM-DD');
      const memRes = await base44.entities.Memory.filter(
        { memory_date: { $gte: start, $lte: end } },
        { sort: 'memory_date', limit: 60 }
      );
      const memories = items(memRes);
      if (!memories.length) {
        toast({ title: 'Nothing to wrap up', description: `No memories saved in ${monthName(month, year)} ${year}.` });
        return;
      }

      const response = await base44.functions.invoke('generateFinale', {
        month_name: monthName(month, year),
        year,
        memory_ids: memories.map((m) => m.id),
      });
      const data = response.data || {};
      if (data.error) throw new Error(data.error);

      const photos = photosOf(memories);
      const created = await base44.entities.MonthlyFinale.create({
        month,
        year,
        title: data.title,
        narrative: data.narrative,
        highlights: data.highlights || [],
        memorable_moment: data.memorable_moment,
        people: data.people || [],
        themes: data.themes || [],
        closing_narration: data.closing_narration,
        poster_cover: photos[0] || '',
        memory_ids: memories.map((m) => m.id),
      });

      await load();
      setActive(created);
      setActivePhotos(photos);
      toast({ title: 'Your finale is ready' });
    } catch (error) {
      toast({ title: 'Could not write the finale', description: error.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const openFinale = async (finale) => {
    setActive(finale);
    setActivePhotos([]);
    if (finale.memory_ids && finale.memory_ids.length) {
      const memRes = await base44.entities.Memory.filter({ id: { $in: finale.memory_ids } }, { limit: 60 });
      setActivePhotos(photosOf(items(memRes)));
    }
  };

  const download = async () => {
    if (!posterRef.current) return;
    try {
      const canvas = await html2canvas(posterRef.current, { backgroundColor: '#090909', scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `${active.title.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast({ title: 'Poster downloaded' });
    } catch (error) {
      toast({
        title: 'Could not export the image',
        description: 'You can still share the finale text below.',
        variant: 'destructive',
      });
    }
  };

  const share = async () => {
    const text = `${active.title}\n${monthName(active.month, active.year)} season finale\n\n${active.narrative}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: active.title, text });
        return;
      } catch (error) {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Finale copied to clipboard' });
    } catch (error) {
      toast({ title: 'Sharing is not available here', variant: 'destructive' });
    }
  };

  const saveEdit = async () => {
    await base44.entities.MonthlyFinale.update(active.id, draft);
    setActive({ ...active, ...draft });
    setEditOpen(false);
    toast({ title: 'Finale updated' });
    load();
  };

  return (
    <div className="animate-fade-in px-5 pb-8 pt-7">
      <p className="t-kicker text-flare">Wrap the month</p>
      <h1 className="t-hero mt-2.5 text-white">Season finale</h1>
      <p className="mt-3 max-w-sm text-[12.5px] leading-relaxed text-ink-soft">
        A poster and a closing narration, built only from what you actually saved.
      </p>

      <div className="mt-5 rounded-md border border-ink-line bg-ink-raised p-4">
        <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Choose a month</Label>
        <Input
          type="month"
          value={`${year}-${pad(month)}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split('-');
            if (y && m) {
              setYear(Number(y));
              setMonth(Number(m));
            }
          }}
          className="mt-2 border-ink-line bg-ink-card"
        />
        <p className="mt-2 text-[11px] text-white/35">
          {memoryCount === null ? 'Checking your archive…' : `${memoryCount} memories saved in ${monthName(month, year)} ${year}`}
        </p>
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="t-meta mt-4 flex w-full items-center justify-center gap-2 rounded-sm bg-flare py-3.5 font-semibold tracking-[0.18em] text-white disabled:opacity-60"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? 'Writing your finale' : 'Generate finale'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
      ) : finales.length ? (
        <div className="mt-7">
          <p className="t-kicker mb-3 text-ink-soft">Previous finales</p>
          <div className="space-y-2">
            {finales.map((finale) => (
              <button
                key={finale.id}
                type="button"
                onClick={() => openFinale(finale)}
                className="flex w-full items-center gap-3 rounded-md border border-ink-line bg-ink-raised p-2.5 text-left transition hover:border-flare/40"
              >
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-sm bg-ink-card">
                  <MediaThumb fileRef={finale.poster_cover} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="t-cinema text-[11px] tracking-[0.26em] text-flare">{monthName(finale.month, finale.year)} {finale.year}</p>
                  <p className="mt-0.5 truncate font-display text-[17px] leading-tight text-white">{finale.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-[10.5px] text-white/35">{finale.narrative}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-7">
          <EmptyState
            icon={Film}
            title="No finales yet"
            body="When a month ends, turn it into a poster you can keep."
          />
        </div>
      )}

      <Dialog open={Boolean(active)} onOpenChange={(value) => !value && setActive(null)}>
        <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto border-ink-line bg-ink-raised">
          {active ? (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <DialogTitle className="t-episode text-white">{monthName(active.month, active.year)} {active.year}</DialogTitle>
                  <button type="button" onClick={() => setActive(null)} aria-label="Close" className="text-white/40">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </DialogHeader>

              <FinalePoster finale={active} photos={activePhotos} innerRef={posterRef} />

              {active.highlights && active.highlights.length ? (
                <div>
                  <p className="t-kicker mb-2 text-white/35">Highlights</p>
                  <ul className="space-y-1">
                    {active.highlights.map((highlight) => (
                      <li key={highlight} className="text-[12px] text-white/70">· {highlight}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {active.memorable_moment ? (
                <p className="t-quote rounded-sm border border-ink-line bg-ink-card px-3 py-2.5 text-[13px] text-white/70">
                  {active.memorable_moment}
                </p>
              ) : null}

              {active.themes && active.themes.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {active.themes.map((theme) => (
                    <span key={theme} className="rounded-full border border-ink-line px-2.5 py-1 text-[9.5px] uppercase tracking-[0.18em] text-white/50">
                      {theme}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={download} className="flex items-center justify-center gap-1.5 rounded-md border border-ink-line py-2.5 t-meta font-semibold tracking-[0.14em] text-white/75">
                  <Download className="h-3 w-3" /> Save
                </button>
                <button type="button" onClick={share} className="flex items-center justify-center gap-1.5 rounded-md border border-ink-line py-2.5 t-meta font-semibold tracking-[0.14em] text-white/75">
                  <Share2 className="h-3 w-3" /> Share
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft({ title: active.title, narrative: active.narrative, closing_narration: active.closing_narration || '' });
                    setEditOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-ink-line py-2.5 t-meta font-semibold tracking-[0.14em] text-white/75"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md border-ink-line bg-ink-raised">
          <DialogHeader>
            <DialogTitle className="t-episode text-white">Edit finale</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Title</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="border-ink-line bg-ink-card font-display text-[17px]" />
            </div>
            <div className="space-y-2">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Narrative</Label>
              <Textarea value={draft.narrative} onChange={(e) => setDraft({ ...draft, narrative: e.target.value })} rows={5} className="border-ink-line bg-ink-card text-[13px]" />
            </div>
            <div className="space-y-2">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Closing line</Label>
              <Textarea value={draft.closing_narration} onChange={(e) => setDraft({ ...draft, closing_narration: e.target.value })} rows={2} className="border-ink-line bg-ink-card text-[13px]" />
            </div>
            <button type="button" onClick={saveEdit} className="t-meta w-full rounded-sm bg-flare py-3.5 font-semibold tracking-[0.18em] text-white">
              Save changes
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}