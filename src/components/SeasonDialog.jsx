import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { COVERS } from '@/lib/constants';
import { todayISO } from '@/lib/format';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function SeasonDialog({ open, onOpenChange, season = null, nextNumber = 1, onSaved }) {
  const [form, setForm] = useState({ title: '', description: '', cover_image: COVERS[0], start_date: todayISO(), status: 'active' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (season) {
      setForm({
        title: season.title || '',
        description: season.description || '',
        cover_image: season.cover_image || COVERS[0],
        start_date: season.start_date || todayISO(),
        status: season.status || 'active',
      });
    } else {
      setForm({ title: '', description: '', cover_image: COVERS[0], start_date: todayISO(), status: 'active' });
    }
  }, [open, season]);

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Give your season a title' });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, title: form.title.trim() };
      if (season) await base44.entities.Season.update(season.id, payload);
      else await base44.entities.Season.create({ ...payload, season_number: nextNumber });
      toast({ title: season ? 'Season updated' : 'Season created' });
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      toast({ title: 'Could not save the season', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto border-ink-line bg-ink-raised">
        <DialogHeader>
          <DialogTitle className="t-episode text-white">{season ? 'Edit season' : 'New season'}</DialogTitle>
          <DialogDescription className="text-[12px] leading-relaxed text-ink-soft">
            Seasons hold the chapters of your life — a year, a city, a version of you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Season title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="The Beginning" className="border-ink-line bg-ink-card font-display text-[17px]" />
          </div>
          <div className="space-y-2">
            <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What is this chapter about?" className="border-ink-line bg-ink-card" />
          </div>
          <div className="space-y-2">
            <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Cover</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {COVERS.map((cover) => (
                <button
                  key={cover}
                  type="button"
                  onClick={() => setForm({ ...form, cover_image: cover })}
                  className={`aspect-square overflow-hidden rounded-sm border-2 ${
                    form.cover_image === cover ? 'border-flare' : 'border-transparent'
                  }`}
                >
                  <img src={cover} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Starts</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="border-ink-line bg-ink-card" />
            </div>
            <div className="space-y-2">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger className="border-ink-line bg-ink-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="t-meta flex w-full items-center justify-center gap-2 rounded-sm bg-flare py-3.5 font-semibold tracking-[0.2em] text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {season ? 'Save season' : 'Create season'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}