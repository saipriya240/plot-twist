import { useEffect, useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { uploadPrivate } from '@/lib/media';
import { CHARACTER_CATEGORIES } from '@/lib/constants';
import { todayISO } from '@/lib/format';
import { toast } from '@/components/ui/use-toast';
import MediaThumb from '@/components/MediaThumb';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function CharacterDialog({ open, onOpenChange, character = null, characters = [], onSaved }) {
  const [form, setForm] = useState({ name: '', category: CHARACTER_CATEGORIES[5], description: '', avatar: '', first_appearance: todayISO() });
  const [mergeInto, setMergeInto] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (character) {
      setForm({
        name: character.name || '',
        category: character.category || CHARACTER_CATEGORIES[5],
        description: character.description || '',
        avatar: character.avatar || '',
        first_appearance: character.first_appearance || todayISO(),
      });
    } else {
      setForm({ name: '', category: CHARACTER_CATEGORIES[5], description: '', avatar: '', first_appearance: todayISO() });
    }
    setMergeInto('');
  }, [open, character]);

  const uploadAvatar = async (file) => {
    setUploading(true);
    try {
      const uri = await uploadPrivate(file);
      setForm((prev) => ({ ...prev, avatar: uri }));
    } catch (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Give this character a name' });
      return;
    }
    setSaving(true);
    try {
      if (character && mergeInto) {
        const target = characters.find((c) => c.id === mergeInto);
        if (target) {
          const episodes = await base44.entities.Episode.filter({}, { limit: 200 });
          const list = Array.isArray(episodes) ? episodes : episodes.items || [];
          await Promise.all(
            list
              .filter((episode) => (episode.character_ids || []).includes(character.id))
              .map((episode) => {
                const ids = new Set(episode.character_ids.filter((cid) => cid !== character.id));
                ids.add(target.id);
                return base44.entities.Episode.update(episode.id, { character_ids: Array.from(ids) });
              })
          );
          await base44.entities.Character.update(target.id, {
            episode_ids: Array.from(new Set([...(target.episode_ids || []), ...(character.episode_ids || [])])),
          });
          await base44.entities.Character.delete(character.id);
          toast({ title: `Merged into ${target.name}` });
          onOpenChange(false);
          onSaved?.();
          return;
        }
      }

      const payload = { ...form, name: form.name.trim() };
      if (character) await base44.entities.Character.update(character.id, payload);
      else await base44.entities.Character.create({ ...payload, episode_ids: [] });
      toast({ title: character ? 'Character updated' : 'Character added' });
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto border-ink-line bg-ink-raised">
        <DialogHeader>
          <DialogTitle className="t-episode text-white">{character ? 'Edit character' : 'New character'}</DialogTitle>
          <DialogDescription className="text-[12px] leading-relaxed text-ink-soft">
            Only add what you know. Nothing here is inferred automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-ink-line bg-ink-card">
              <MediaThumb fileRef={form.avatar} className="h-full w-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-md border border-ink-line px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-white/60"
            >
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              Photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar(file);
                e.target.value = '';
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ananya" className="border-ink-line bg-ink-card font-display text-[17px]" />
          </div>

          <div className="space-y-2">
            <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Cast category</Label>
            <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
              <SelectTrigger className="border-ink-line bg-ink-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHARACTER_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Who are they in your story?" className="border-ink-line bg-ink-card text-[13px]" />
          </div>

          <div className="space-y-2">
            <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">First appearance</Label>
            <Input type="date" value={form.first_appearance} onChange={(e) => setForm({ ...form, first_appearance: e.target.value })} className="border-ink-line bg-ink-card" />
          </div>

          {character && characters.filter((c) => c.id !== character.id).length ? (
            <div className="space-y-2">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Merge into another character</Label>
              <Select value={mergeInto} onValueChange={setMergeInto}>
                <SelectTrigger className="border-ink-line bg-ink-card"><SelectValue placeholder="Keep separate" /></SelectTrigger>
                <SelectContent>
                  {characters.filter((c) => c.id !== character.id).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-white/25">This character is removed and their episodes move to the one you choose.</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="t-meta flex w-full items-center justify-center gap-2 rounded-sm bg-flare py-3.5 font-semibold tracking-[0.2em] text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {mergeInto ? 'Merge characters' : 'Save character'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}