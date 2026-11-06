import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Plus,
  Image as ImageIcon,
  Sparkles,
  Star,
  Trash2,
  Loader2,
  Clock,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fmtDate } from '@/lib/format';
import { pad, COVERS } from '@/lib/constants';
import MediaThumb from '@/components/MediaThumb';
import EpisodeBuilder from '@/components/EpisodeBuilder';
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
import { toast } from '@/components/ui/use-toast';

const items = (res) => (Array.isArray(res) ? res : (res && res.items) || []);

export default function EpisodeViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const load = async () => {
    try {
      const episode = await base44.entities.Episode.get(id);
      const [memRes, charRes] = await Promise.all([
        episode.memory_ids && episode.memory_ids.length
          ? base44.entities.Memory.filter({ id: { $in: episode.memory_ids } }, { limit: 50 })
          : { items: [] },
        episode.character_ids && episode.character_ids.length
          ? base44.entities.Character.filter({ id: { $in: episode.character_ids } }, { limit: 50 })
          : { items: [] },
      ]);
      setData({ episode, memories: items(memRes), characters: items(charRes) });
    } catch (error) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!notFound) return undefined;
    const meta = document.createElement('meta');
    meta.name = 'prerender-status-code';
    meta.content = '404';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, [notFound]);

  const toggleFavourite = async () => {
    const next = !data.episode.favourite;
    setData({ ...data, episode: { ...data.episode, favourite: next } });
    await base44.entities.Episode.update(data.episode.id, { favourite: next });
  };

  const changeCover = async (cover) => {
    await base44.entities.Episode.update(data.episode.id, { cover_image: cover });
    setData({ ...data, episode: { ...data.episode, cover_image: cover } });
    setCoverOpen(false);
    toast({ title: 'Cover updated' });
  };

  const regenerate = async () => {
    if (!data.episode.memory_ids || !data.episode.memory_ids.length) {
      toast({ title: 'No source memories', description: 'This episode has no memories attached yet.' });
      return;
    }
    setRegenerating(true);
    try {
      const response = await base44.functions.invoke('generateEpisode', {
        memory_ids: data.episode.memory_ids,
        part: 'full',
      });
      const result = response.data || {};
      if (result.error) throw new Error(result.error);
      const patch = {
        title: result.title,
        synopsis: result.synopsis,
        full_story: result.full_story,
        genre: result.genre,
        people_mentioned: result.people_mentioned || data.episode.people_mentioned || [],
      };
      await base44.entities.Episode.update(data.episode.id, patch);
      setData({ ...data, episode: { ...data.episode, ...patch } });
      toast({ title: 'Episode rewritten' });
    } catch (error) {
      toast({ title: 'Could not regenerate', description: error.message, variant: 'destructive' });
    } finally {
      setRegenerating(false);
    }
  };

  const remove = async () => {
    await base44.entities.Episode.delete(data.episode.id);
    toast({ title: 'Episode removed' });
    navigate('/episodes', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="px-5 pt-24 text-center">
        <p className="t-season">Episode not found</p>
        <p className="mt-2 text-[13px] text-ink-soft">It may have been deleted.</p>
        <Link to="/episodes" className="mt-6 inline-block rounded-md bg-flare px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em]">
          Back to episodes
        </Link>
      </div>
    );
  }

  const { episode, memories, characters } = data;
  const photos = memories.flatMap((memory) =>
    (memory.media || []).filter((item) => item.type !== 'video').map((item) => ({ ...item, memory }))
  );
  const videos = memories.flatMap((memory) =>
    (memory.media || []).filter((item) => item.type === 'video').map((item) => ({ ...item, memory }))
  );
  const paragraphs = String(episode.full_story || '').split(/\n{2,}/).filter(Boolean);

  return (
    <div className="animate-fade-in pb-8">
      <div className="relative h-[54vh] min-h-[340px] w-full overflow-hidden">
        <MediaThumb fileRef={episode.cover_image} alt={episode.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-base via-ink-base/45 to-ink-base/20" />
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="absolute left-4 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-ink-base/70 text-white backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
          <p className="t-cinema text-[13px] tracking-[0.4em] text-flare">
            Episode {pad(episode.episode_number || 0)}
          </p>
          <h1 className="t-season t-over-image mt-3 text-white">{episode.title}</h1>
          <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] uppercase tracking-[0.18em] text-white/50">
            <span>{fmtDate(episode.release_date || episode.created_date)}</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>{episode.genre}</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{episode.runtime_minutes || 3} min read</span>
            {episode.status === 'draft' ? <><span className="h-1 w-1 rounded-full bg-white/30" /><span className="text-white/70">Draft</span></> : null}
          </div>
        </div>
      </div>

      {regenerating ? (
        <div className="mx-5 mt-6 flex items-center gap-3 rounded-md border border-flare/30 bg-flare/5 px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-flare" />
          <p className="text-[11.5px] uppercase tracking-[0.16em] text-white/70">Rewriting your episode…</p>
        </div>
      ) : null}

      <div className="px-5 pt-6">
        {episode.synopsis ? (
          <p className="t-lead border-l-2 border-flare pl-4 text-white/85">{episode.synopsis}</p>
        ) : null}

        <div className="mt-8 space-y-5">
          {paragraphs.length ? (
            paragraphs.map((paragraph, index) => (
              <p key={index} className="t-body text-[15px] leading-[1.85] text-white/85">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-[13px] leading-relaxed text-ink-soft">
              This episode has no story yet. Use Regenerate Story to have the director write it from your memories.
            </p>
          )}
        </div>

        {photos.length ? (
          <div className="mt-8">
            <p className="t-kicker mb-3 text-ink-soft">Scenes</p>
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo, index) => (
                <figure key={`${photo.url}-${index}`} className="overflow-hidden rounded-md border border-ink-line">
                  <MediaThumb fileRef={photo.url} alt={photo.caption || ''} className="aspect-square w-full object-cover" />
                  {photo.caption ? (
                    <figcaption className="bg-ink-raised px-2 py-1.5 text-[10.5px] text-white/50">{photo.caption}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </div>
        ) : null}

        {videos.length ? (
          <div className="mt-8 space-y-3">
            <p className="t-kicker mb-3 text-ink-soft">Footage</p>
            {videos.map((video, index) => (
              <MediaThumb key={`${video.url}-${index}`} fileRef={video.url} kind="video" className="w-full rounded-md border border-ink-line" />
            ))}
          </div>
        ) : null}

        {memories.length ? (
          <div className="mt-8">
            <p className="t-kicker mb-3 text-ink-soft">From your memories</p>
            <div className="space-y-2">
              {memories.map((memory) => (
                <div key={memory.id} className="rounded-md border border-ink-line bg-ink-raised px-3.5 py-3">
                  <p className="font-display text-[15px] leading-snug text-white">{memory.title}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/30">{fmtDate(memory.memory_date || memory.created_date)}</p>
                  {memory.content ? <p className="mt-2 line-clamp-3 text-[11.5px] leading-relaxed text-ink-soft">{memory.content}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {characters.length ? (
          <div className="mt-8">
            <p className="t-kicker mb-3 text-ink-soft">Appearing in this episode</p>
            <div className="flex flex-wrap gap-2">
              {characters.map((character) => (
                <Link key={character.id} to="/characters" className="flex items-center gap-2 rounded-full border border-ink-line bg-ink-raised py-1 pl-1 pr-3">
                  <span className="h-6 w-6 overflow-hidden rounded-full bg-ink-card">
                    <MediaThumb fileRef={character.avatar} className="h-full w-full object-cover" />
                  </span>
                  <span className="text-[11.5px] text-white/80">{character.name}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-9 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setEditOpen(true)} className="flex items-center justify-center gap-1.5 rounded-md border border-ink-line bg-ink-raised py-3 t-meta rounded-sm font-semibold tracking-[0.16em] text-white/80">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <Link to={`/create?episode=${episode.id}`} className="flex items-center justify-center gap-1.5 rounded-md border border-ink-line bg-ink-raised py-3 t-meta rounded-sm font-semibold tracking-[0.16em] text-white/80">
            <Plus className="h-3.5 w-3.5" /> Add memory
          </Link>
          <button type="button" onClick={() => setCoverOpen(true)} className="flex items-center justify-center gap-1.5 rounded-md border border-ink-line bg-ink-raised py-3 t-meta rounded-sm font-semibold tracking-[0.16em] text-white/80">
            <ImageIcon className="h-3.5 w-3.5" /> Change cover
          </button>
          <button type="button" onClick={regenerate} disabled={regenerating} className="flex items-center justify-center gap-1.5 rounded-md border border-ink-line bg-ink-raised py-3 t-meta rounded-sm font-semibold tracking-[0.16em] text-white/80 disabled:opacity-50">
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Regenerate
          </button>
          <button type="button" onClick={toggleFavourite} className="flex items-center justify-center gap-1.5 rounded-md border border-ink-line bg-ink-raised py-3 t-meta rounded-sm font-semibold tracking-[0.16em] text-white/80">
            <Star className={`h-3.5 w-3.5 ${episode.favourite ? 'fill-flare text-flare' : ''}`} />
            {episode.favourite ? 'Favourited' : 'Favourite'}
          </button>
          <button type="button" onClick={() => setDeleteOpen(true)} className="flex items-center justify-center gap-1.5 rounded-md border border-ink-line bg-ink-raised py-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/60 hover:text-flare">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      <EpisodeBuilder
        open={editOpen}
        onOpenChange={setEditOpen}
        episode={episode}
        onSaved={load}
      />

      <Dialog open={coverOpen} onOpenChange={setCoverOpen}>
        <DialogContent className="max-w-md border-ink-line bg-ink-raised">
          <DialogHeader>
            <DialogTitle className="t-episode text-white">Choose a cover</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-1.5">
            {COVERS.map((cover) => (
              <button key={cover} type="button" onClick={() => changeCover(cover)} className="aspect-[3/4] overflow-hidden rounded-sm border border-ink-line">
                <img src={cover} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-ink-line bg-ink-raised">
          <AlertDialogHeader>
            <AlertDialogTitle className="t-episode text-white">Delete this episode?</AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px] text-ink-soft">
              The episode is removed, but your memories stay safe in your archive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-ink-line bg-ink-card text-white">Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-flare text-white hover:bg-flare-deep">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}