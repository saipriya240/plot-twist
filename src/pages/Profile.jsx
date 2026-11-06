import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { Loader2, LogOut, Download, Trash2, KeyRound, ShieldCheck, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { profileOf, uploadPrivate } from '@/lib/media';
import { GENRES, STORYTELLING_STYLES } from '@/lib/constants';
import { toast } from '@/components/ui/use-toast';
import MediaThumb from '@/components/MediaThumb';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const items = (res) => (Array.isArray(res) ? res : (res && res.items) || []);

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ seasons: 0, episodes: 0, memories: 0, favourites: 0 });
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ display_name: '', series_title: '', preferred_genre: GENRES[7], storytelling_style: STORYTELLING_STYLES[0].value, avatar_url: '' });
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const me = await base44.auth.me();
    const current = profileOf(me);
    setProfile(current);
    setForm({
      display_name: current.display_name || current.full_name || '',
      series_title: current.series_title || '',
      preferred_genre: current.preferred_genre || GENRES[7],
      storytelling_style: current.storytelling_style || STORYTELLING_STYLES[0].value,
      avatar_url: current.avatar_url || '',
    });
    const [seasons, episodes, memories, favs] = await Promise.all([
      base44.entities.Season.count({}),
      base44.entities.Episode.count({}),
      base44.entities.Memory.count({}),
      base44.entities.Episode.filter({ favourite: true }, { sort: '-release_date', limit: 10 }),
    ]);
    setStats({ seasons, episodes, memories, favourites: items(favs).length });
    setFavourites(items(favs));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ ...form, display_name: form.display_name.trim() });
      toast({ title: 'Profile updated' });
      setEditOpen(false);
      load();
    } catch (error) {
      toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const setPref = async (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    try {
      await base44.auth.updateMe({ [key]: value });
    } catch (error) {
      toast({ title: 'Could not save preference', description: error.message, variant: 'destructive' });
    }
  };

  const uploadAvatar = async (file) => {
    setUploading(true);
    try {
      const uri = await uploadPrivate(file);
      setForm((prev) => ({ ...prev, avatar_url: uri }));
    } catch (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const exportData = async () => {
    try {
      const [seasons, memories, episodes, characters, finales, trailers] = await Promise.all([
        base44.entities.Season.filter({}, { limit: 200 }),
        base44.entities.Memory.filter({}, { limit: 500 }),
        base44.entities.Episode.filter({}, { limit: 300 }),
        base44.entities.Character.filter({}, { limit: 200 }),
        base44.entities.MonthlyFinale.filter({}, { limit: 100 }),
        base44.entities.LifeTrailer.filter({}, { limit: 100 }),
      ]);
      const bundle = {
        exported_at: new Date().toISOString(),
        profile: { display_name: profile.display_name, series_title: profile.series_title, email: profile.email },
        seasons: items(seasons),
        memories: items(memories),
        episodes: items(episodes),
        characters: items(characters),
        finales: items(finales),
        trailers: items(trailers),
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `plot-twist-${moment().format('YYYY-MM-DD')}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Your story has been exported' });
    } catch (error) {
      toast({ title: 'Export failed', description: error.message, variant: 'destructive' });
    }
  };

  const wipe = async () => {
    try {
      const me = await base44.auth.me();
      const owner = { created_by_id: me.id };
      await Promise.all([
        base44.entities.MonthlyFinale.deleteMany(owner),
        base44.entities.LifeTrailer.deleteMany(owner),
        base44.entities.Episode.deleteMany(owner),
        base44.entities.Character.deleteMany(owner),
        base44.entities.Memory.deleteMany(owner),
        base44.entities.Season.deleteMany(owner),
      ]);
      await base44.auth.updateMe({ onboarded: false, latest_recap: '', series_title: '', season_tagline: '' });
      toast({ title: 'Your data has been deleted' });
      navigate('/onboarding', { replace: true });
    } catch (error) {
      toast({ title: 'Could not delete everything', description: error.message, variant: 'destructive' });
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  const initials = (profile.display_name || profile.full_name || 'PT').slice(0, 2).toUpperCase();

  return (
    <div className="animate-fade-in px-5 pb-8 pt-7">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-ink-line bg-ink-card">
          {profile.avatar_url ? (
            <MediaThumb fileRef={profile.avatar_url} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-2xl italic text-white/40">{initials}</div>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="t-episode truncate text-white">{profile.display_name || profile.full_name}</h1>
          <p className="t-cinema mt-2 truncate text-[12px] tracking-[0.28em] text-flare">
            {profile.series_title || 'Your series'}
          </p>
          <p className="mt-1.5 truncate text-[11px] text-white/35">{profile.email}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2">
        {[
          { label: 'Seasons', value: stats.seasons },
          { label: 'Episodes', value: stats.episodes },
          { label: 'Memories', value: stats.memories },
          { label: 'Favourites', value: stats.favourites },
        ].map((stat) => (
          <div key={stat.label} className="rounded-md border border-ink-line bg-ink-raised px-2 py-3 text-center">
            <p className="t-stat text-white">{stat.value}</p>
            <p className="t-kicker mt-2 text-[9px] text-white/32">{stat.label}</p>
          </div>
        ))}
      </div>

      {favourites.length ? (
        <div className="mt-8">
          <p className="t-kicker mb-3 text-ink-soft">Favourite episodes</p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {favourites.map((episode) => (
              <div key={episode.id} className="w-28 shrink-0">
                <div className="aspect-[3/4] overflow-hidden rounded-md border border-ink-line bg-ink-card">
                  <MediaThumb fileRef={episode.cover_image} className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 line-clamp-2 font-display text-[13px] leading-tight text-white/75">{episode.title}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <p className="t-kicker mb-3 text-ink-soft">Settings</p>
        <div className="overflow-hidden rounded-md border border-ink-line bg-ink-raised">
          <button type="button" onClick={() => setEditOpen(true)} className="flex w-full items-center justify-between border-b border-ink-line px-4 py-3.5 text-left">
            <span className="text-[13px] text-white/85">Edit profile & preferences</span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">Open</span>
          </button>
          <div className="flex items-center justify-between border-b border-ink-line px-4 py-3.5">
            <span className="text-[13px] text-white/85">Weekly recap reminder</span>
            <Switch checked={Boolean(profile.notify_weekly)} onCheckedChange={(value) => setPref('notify_weekly', value)} />
          </div>
          <div className="flex items-center justify-between border-b border-ink-line px-4 py-3.5">
            <span className="text-[13px] text-white/85">Season finale reminder</span>
            <Switch checked={Boolean(profile.notify_finale)} onCheckedChange={(value) => setPref('notify_finale', value)} />
          </div>
          <div className="flex items-center justify-between border-b border-ink-line px-4 py-3.5">
            <div>
              <p className="text-[13px] text-white/85">Keep my series private</p>
              <p className="mt-0.5 text-[10.5px] text-white/30">Only you can open your memories and episodes.</p>
            </div>
            <Switch checked={profile.private_series !== false} onCheckedChange={(value) => setPref('private_series', value)} />
          </div>
          <button type="button" onClick={() => navigate('/forgot-password')} className="flex w-full items-center justify-between border-b border-ink-line px-4 py-3.5 text-left">
            <span className="flex items-center gap-2 text-[13px] text-white/85"><KeyRound className="h-3.5 w-3.5 text-white/40" /> Change password</span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">Email link</span>
          </button>
          <button type="button" onClick={() => navigate('/mfa')} className="flex w-full items-center justify-between border-b border-ink-line px-4 py-3.5 text-left">
            <span className="flex items-center gap-2 text-[13px] text-white/85"><ShieldCheck className="h-3.5 w-3.5 text-white/40" /> Two-factor authentication</span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">Manage</span>
          </button>
          <button type="button" onClick={exportData} className="flex w-full items-center justify-between border-b border-ink-line px-4 py-3.5 text-left">
            <span className="flex items-center gap-2 text-[13px] text-white/85"><Download className="h-3.5 w-3.5 text-white/40" /> Export my data</span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">JSON</span>
          </button>
          <button type="button" onClick={() => setDeleteOpen(true)} className="flex w-full items-center justify-between px-4 py-3.5 text-left">
            <span className="flex items-center gap-2 text-[13px] text-flare"><Trash2 className="h-3.5 w-3.5" /> Delete all my data</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => base44.auth.logout('/welcome')}
        className="t-meta mt-4 flex w-full items-center justify-center gap-2 rounded-sm border border-ink-line bg-ink-raised py-4 font-semibold tracking-[0.18em] text-white/70"
      >
        <LogOut className="h-3.5 w-3.5" /> Sign out
      </button>

      <p className="t-lead mt-9 text-center text-[13px] leading-relaxed text-white/28">
        {profile.season_tagline || 'Your life. Your stories. Your own Netflix series.'}
      </p>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto border-ink-line bg-ink-raised">
          <DialogHeader>
            <DialogTitle className="t-episode text-white">Edit profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-ink-line bg-ink-card">
                <MediaThumb fileRef={form.avatar_url} className="h-full w-full object-cover" />
              </div>
              <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-md border border-ink-line px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-white/60">
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Photo
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
              <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="border-ink-line bg-ink-card" />
            </div>
            <div className="space-y-2">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Series title</Label>
              <Input value={form.series_title} onChange={(e) => setForm({ ...form, series_title: e.target.value })} className="border-ink-line bg-ink-card font-display text-[15px]" />
            </div>
            <div className="space-y-2">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Life genre</Label>
              <Select value={form.preferred_genre} onValueChange={(value) => setForm({ ...form, preferred_genre: value })}>
                <SelectTrigger className="border-ink-line bg-ink-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GENRES.map((genre) => (<SelectItem key={genre} value={genre}>{genre}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Storytelling style</Label>
              <Select value={form.storytelling_style} onValueChange={(value) => setForm({ ...form, storytelling_style: value })}>
                <SelectTrigger className="border-ink-line bg-ink-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STORYTELLING_STYLES.map((style) => (<SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <button type="button" onClick={saveProfile} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-md bg-flare py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white disabled:opacity-60">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save profile
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-ink-line bg-ink-raised">
          <AlertDialogHeader>
            <AlertDialogTitle className="t-episode text-white">Delete everything?</AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px] text-ink-soft">
              All your seasons, memories, episodes, characters, finales and trailers will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-ink-line bg-ink-card text-white">Keep my story</AlertDialogCancel>
            <AlertDialogAction onClick={wipe} className="bg-flare text-white hover:bg-flare-deep">Delete everything</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}