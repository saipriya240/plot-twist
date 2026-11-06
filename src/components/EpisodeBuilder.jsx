import { useEffect, useRef, useState } from 'react';
import { Sparkles, Loader2, RefreshCw, Upload, X, Wand2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { uploadPrivate } from '@/lib/media';
import { GENRES, COVERS } from '@/lib/constants';
import { fmtShort, todayISO } from '@/lib/format';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const items = (res) => (Array.isArray(res) ? res : (res && res.items) || []);

const EMPTY = {
  title: '',
  synopsis: '',
  full_story: '',
  genre: GENRES[7],
  cover_image: COVERS[0],
  season_id: '',
  people_mentioned: [],
};

export default function EpisodeBuilder({ open, onOpenChange, episode = null, initialMemoryIds = [], defaultSeasonId = null, onSaved }) {
  const [memories, setMemories] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState('');
  const [saving, setSaving] = useState(false);
  const [makeCharacters, setMakeCharacters] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const preselected = useRef([]);

  useEffect(() => {
    if (!open) return;
    preselected.current = initialMemoryIds;
    (async () => {
      const [memRes, seaRes] = await Promise.all([
        base44.entities.Memory.filter({}, { sort: '-memory_date', limit: 60 }),
        base44.entities.Season.filter({}, { sort: '-season_number', limit: 50 }),
      ]);
      const mems = items(memRes);
      const seas = items(seaRes);
      setMemories(mems);
      setSeasons(seas);

      if (episode) {
        setSelected(episode.memory_ids || []);
        setForm({
          title: episode.title || '',
          synopsis: episode.synopsis || '',
          full_story: episode.full_story || '',
          genre: episode.genre || GENRES[7],
          cover_image: episode.cover_image || COVERS[0],
          season_id: episode.season_id || (seas[0] ? seas[0].id : ''),
          people_mentioned: episode.people_mentioned || [],
        });
        setMakeCharacters(false);
      } else {
        setSelected(initialMemoryIds);
        setForm({ ...EMPTY, cover_image: COVERS[0], season_id: defaultSeasonId || (seas[0] ? seas[0].id : '') });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleMemory = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectedSeason = seasons.find((s) => s.id === form.season_id);

  const runAI = async (part) => {
    if (!selected.length) {
      toast({ title: 'Select memories first', description: 'Your episode is built from real memories.' });
      return;
    }
    setBusy(part);
    try {
      const response = await base44.functions.invoke('generateEpisode', {
        memory_ids: selected,
        part,
        season_title: selectedSeason ? selectedSeason.title : 'Season 01',
      });
      const data = response.data || {};
      if (data.error) throw new Error(data.error);
      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        synopsis: data.synopsis || prev.synopsis,
        full_story: data.full_story || prev.full_story,
        genre: data.genre || prev.genre,
        people_mentioned: (data.people_mentioned || []).length ? data.people_mentioned : prev.people_mentioned,
      }));
      if (part === 'full') toast({ title: 'Episode written', description: 'Read it, edit anything, then publish.' });
    } catch (error) {
      toast({
        title: 'Story director unavailable',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setBusy('');
    }
  };

  const uploadCover = async (file) => {
    setUploading(true);
    try {
      const uri = await uploadPrivate(file);
      setForm((prev) => ({ ...prev, cover_image: uri }));
    } catch (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const save = async (status) => {
    if (!form.title.trim()) {
      toast({ title: 'Your episode needs a title' });
      return;
    }
    setSaving(true);
    try {
      const words = (form.full_story || '').trim().split(/\s+/).filter(Boolean).length;
      const payload = {
        title: form.title.trim(),
        synopsis: form.synopsis.trim(),
        full_story: form.full_story,
        genre: form.genre,
        cover_image: form.cover_image,
        season_id: form.season_id || null,
        people_mentioned: form.people_mentioned,
        memory_ids: selected,
        runtime_minutes: Math.max(2, Math.round(words / 140)),
        status,
      };

      let episodeId = episode ? episode.id : null;
      if (episode) {
        await base44.entities.Episode.update(episode.id, payload);
      } else {
        const sibling = await base44.entities.Episode.filter(
          form.season_id ? { season_id: form.season_id } : {},
          { sort: '-episode_number', limit: 1 }
        );
        const nextNumber = (items(sibling)[0] ? items(sibling)[0].episode_number || 0 : 0) + 1;
        const created = await base44.entities.Episode.create({
          ...payload,
          episode_number: nextNumber,
          release_date: todayISO(),
          character_ids: [],
          favourite: false,
        });
        episodeId = created.id;
      }

      await Promise.all(
        selected.map((memoryId) =>
          base44.entities.Memory.update(
            memoryId,
            form.season_id ? { episode_id: episodeId, season_id: form.season_id } : { episode_id: episodeId }
          )
        )
      );

      if (makeCharacters && form.people_mentioned.length) {
        const existing = items(await base44.entities.Character.filter({}, { limit: 100 }));
        const ids = new Set(episode && episode.character_ids ? episode.character_ids : []);
        for (const name of form.people_mentioned) {
          const match = existing.find((c) => c.name.toLowerCase() === String(name).toLowerCase());
          if (match) {
            ids.add(match.id);
          } else {
            const created = await base44.entities.Character.create({
              name,
              category: 'Recurring Character',
              first_appearance: todayISO(),
              episode_ids: [episodeId],
            });
            existing.push(created);
            ids.add(created.id);
          }
        }
        await base44.entities.Episode.update(episodeId, { character_ids: Array.from(ids) });
      }

      toast({ title: status === 'published' ? 'Episode published to your season' : 'Draft saved' });
      onOpenChange(false);
      onSaved?.(episodeId);
    } catch (error) {
      toast({ title: 'Could not save the episode', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto border-ink-line bg-ink-raised p-5">
        <DialogHeader>
          <DialogTitle className="t-episode text-white">
            {episode ? 'Edit episode' : 'Story director'}
          </DialogTitle>
          <DialogDescription className="text-[12px] leading-relaxed text-ink-soft">
            Choose real memories. The director writes only from what you recorded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">
                Source memories ({selected.length})
              </Label>
              <button
                type="button"
                onClick={() => setSelected(selected.length === memories.length ? [] : memories.map((m) => m.id))}
                className="text-[10px] uppercase tracking-[0.16em] text-white/40 hover:text-flare"
              >
                {selected.length === memories.length ? 'Clear' : 'Select all'}
              </button>
            </div>
            {memories.length ? (
              <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-md border border-ink-line bg-ink-card/60 p-2">
                {memories.map((memory) => (
                  <label
                    key={memory.id}
                    className="flex cursor-pointer items-start gap-2.5 rounded-sm px-2 py-1.5 transition hover:bg-white/5"
                  >
                    <Checkbox
                      checked={selected.includes(memory.id)}
                      onCheckedChange={() => toggleMemory(memory.id)}
                      className="mt-0.5 border-white/25"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[14px] leading-snug text-white/90">{memory.title}</span>
                      <span className="block text-[9px] uppercase tracking-[0.18em] text-white/30">
                        {fmtShort(memory.memory_date || memory.created_date)}
                        {memory.episode_id ? ' · in an episode' : ''}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-ink-line px-3 py-4 text-[12px] text-ink-soft">
                No memories yet. Save one first and come back.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => runAI('full')}
            disabled={!!busy || !selected.length}
            className="t-meta flex w-full items-center justify-center gap-2 rounded-sm bg-flare py-3.5 font-semibold tracking-[0.2em] text-white disabled:opacity-50"
          >
            {busy === 'full' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy === 'full' ? 'Directing your episode' : episode ? 'Regenerate story' : 'Turn into episode'}
          </button>

          <div className="space-y-4 border-t border-ink-line pt-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Episode title</Label>
                <button type="button" onClick={() => runAI('title')} disabled={!!busy || !selected.length} className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-flare disabled:opacity-40">
                  {busy === 'title' ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Retitle
                </button>
              </div>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="THE PEOPLE WHO STAY" className="border-ink-line bg-ink-card font-display text-[19px]" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Synopsis</Label>
                <button type="button" onClick={() => runAI('synopsis')} disabled={!!busy || !selected.length} className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-flare disabled:opacity-40">
                  {busy === 'synopsis' ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Rewrite
                </button>
              </div>
              <Textarea value={form.synopsis} onChange={(e) => setForm({ ...form, synopsis: e.target.value })} rows={2} className="border-ink-line bg-ink-card" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">The story</Label>
                <button type="button" onClick={() => runAI('story')} disabled={!!busy || !selected.length} className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-flare disabled:opacity-40">
                  {busy === 'story' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />} Rewrite
                </button>
              </div>
              <Textarea value={form.full_story} onChange={(e) => setForm({ ...form, full_story: e.target.value })} rows={7} className="border-ink-line bg-ink-card text-[13px] leading-relaxed" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Genre</Label>
                <Select value={form.genre} onValueChange={(value) => setForm({ ...form, genre: value })}>
                  <SelectTrigger className="border-ink-line bg-ink-card text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GENRES.map((genre) => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Season</Label>
                <Select value={form.season_id} onValueChange={(value) => setForm({ ...form, season_id: value })}>
                  <SelectTrigger className="border-ink-line bg-ink-card text-[12px]"><SelectValue placeholder="Season" /></SelectTrigger>
                  <SelectContent>
                    {seasons.map((season) => (
                      <SelectItem key={season.id} value={season.id}>{season.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Cover</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {COVERS.map((cover) => (
                  <button
                    key={cover}
                    type="button"
                    onClick={() => setForm({ ...form, cover_image: cover })}
                    className={`aspect-[3/4] overflow-hidden rounded-sm border-2 ${form.cover_image === cover ? 'border-flare' : 'border-transparent'}`}
                  >
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex aspect-[3/4] items-center justify-center rounded-sm border-2 border-dashed border-white/20 text-white/40"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadCover(file);
                  e.target.value = '';
                }}
              />
            </div>

            {form.people_mentioned.length ? (
              <div className="space-y-2">
                <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">People in this episode</Label>
                <div className="flex flex-wrap gap-1.5">
                  {form.people_mentioned.map((person) => (
                    <span key={person} className="flex items-center gap-1.5 rounded-full border border-ink-line bg-ink-card px-2.5 py-1 text-[11px] text-white/80">
                      {person}
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, people_mentioned: form.people_mentioned.filter((p) => p !== person) })}
                        aria-label={`Remove ${person}`}
                      >
                        <X className="h-3 w-3 text-white/40" />
                      </button>
                    </span>
                  ))}
                </div>
                <label className="flex cursor-pointer items-center gap-2 pt-1 text-[11px] text-white/55">
                  <Checkbox checked={makeCharacters} onCheckedChange={(value) => setMakeCharacters(Boolean(value))} className="border-white/25" />
                  Add these people to my characters
                </label>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2 pb-2">
            <button
              type="button"
              onClick={() => save('draft')}
              disabled={saving}
              className="t-meta flex-1 rounded-sm border border-white/20 py-3.5 font-semibold tracking-[0.18em] text-white/80 disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={() => save('published')}
              disabled={saving}
              className="t-meta flex flex-1 items-center justify-center gap-2 rounded-sm bg-flare py-3.5 font-semibold tracking-[0.18em] text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Publish
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}