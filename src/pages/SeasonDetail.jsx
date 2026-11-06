import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, ArrowUp, ArrowDown, Archive, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fmtDate } from '@/lib/format';
import { pad } from '@/lib/constants';
import MediaThumb from '@/components/MediaThumb';
import EmptyState from '@/components/EmptyState';
import SeasonDialog from '@/components/SeasonDialog';
import EpisodeBuilder from '@/components/EpisodeBuilder';
import { toast } from '@/components/ui/use-toast';

const items = (res) => (Array.isArray(res) ? res : (res && res.items) || []);

export default function SeasonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [season, setSeason] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [memoryCount, setMemoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);

  const load = async () => {
    const current = await base44.entities.Season.get(id);
    const [epRes, memCount] = await Promise.all([
      base44.entities.Episode.filter({ season_id: id }, { sort: 'episode_number', limit: 100 }),
      base44.entities.Memory.count({ season_id: id }),
    ]);
    setSeason(current);
    setEpisodes(items(epRes));
    setMemoryCount(memCount);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [id]);

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= episodes.length) return;
    const a = episodes[index];
    const b = episodes[target];
    await base44.entities.bulkUpdate([
      { id: a.id, episode_number: b.episode_number || target + 1 },
      { id: b.id, episode_number: a.episode_number || index + 1 },
    ]);
    load();
  };

  const archive = async () => {
    await base44.entities.Season.update(id, { status: season.status === 'archived' ? 'active' : 'archived' });
    toast({ title: season.status === 'archived' ? 'Season restored' : 'Season archived' });
    load();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (!season) {
    return (
      <div className="px-5 pt-24 text-center">
        <p className="t-season">Season not found</p>
        <Link to="/episodes?tab=seasons" className="mt-6 inline-block rounded-md bg-flare px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em]">
          All seasons
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-8">
      <div className="relative h-[42vh] min-h-[280px] w-full overflow-hidden">
        <MediaThumb fileRef={season.cover_image} alt={season.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-base via-ink-base/50 to-ink-base/25" />
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="absolute left-4 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-ink-base/70 text-white backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
          <p className="t-cinema text-[13px] tracking-[0.4em] text-flare">
            Season {pad(season.season_number || 1)} · {season.status === 'archived' ? 'Archived' : 'Active'}
          </p>
          <h1 className="t-season t-over-image mt-3 text-white">{season.title}</h1>
          {season.description ? <p className="mt-3 max-w-sm text-[12.5px] leading-relaxed text-white/70">{season.description}</p> : null}
        </div>
      </div>

      <div className="px-5 pt-5">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Episodes', value: episodes.length },
            { label: 'Memories', value: memoryCount },
            { label: 'Since', value: season.start_date ? fmtDate(season.start_date).slice(0, 6) : '—' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-md border border-ink-line bg-ink-raised px-3 py-3 text-center">
              <p className="t-stat text-white">{stat.value}</p>
              <p className="t-kicker mt-2 text-white/32">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setBuilderOpen(true)} className="t-meta flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-flare py-3.5 font-semibold tracking-[0.16em] text-white">
            <Plus className="h-3.5 w-3.5" /> Add episode
          </button>
          <button type="button" onClick={() => setEditOpen(true)} className="t-meta flex items-center justify-center gap-1.5 rounded-sm border border-ink-line bg-ink-raised px-4 py-3.5 font-semibold tracking-[0.16em] text-white/80">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button type="button" onClick={archive} aria-label="Archive season" className="flex items-center justify-center gap-1.5 rounded-sm border border-ink-line bg-ink-raised px-4 py-3.5 text-white/60">
            <Archive className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="t-kicker mb-3 mt-9 text-ink-soft">Episode order</p>
        {episodes.length ? (
          <div className="space-y-2">
            {episodes.map((episode, index) => (
              <div key={episode.id} className="flex items-center gap-2 rounded-md border border-ink-line bg-ink-raised p-2.5">
                <Link to={`/episode/${episode.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded-sm bg-ink-card">
                    <MediaThumb fileRef={episode.cover_image} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="t-cinema text-[11px] tracking-[0.26em] text-flare">EP {pad(episode.episode_number || index + 1)}</p>
                    <p className="mt-0.5 truncate font-display text-[16px] leading-tight text-white">{episode.title}</p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-white/30">{fmtDate(episode.release_date || episode.created_date)}</p>
                  </div>
                </Link>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => move(index, -1)} aria-label="Move up" className="rounded-sm border border-ink-line p-1 text-white/40 hover:text-white">
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => move(index, 1)} aria-label="Move down" className="rounded-sm border border-ink-line p-1 text-white/40 hover:text-white">
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Plus}
            title="This season is empty"
            body="Add your first episode from the memories you've saved."
            actionLabel="Write an episode"
            onAction={() => setBuilderOpen(true)}
          />
        )}
      </div>

      <SeasonDialog open={editOpen} onOpenChange={setEditOpen} season={season} onSaved={load} />
      <EpisodeBuilder open={builderOpen} onOpenChange={setBuilderOpen} defaultSeasonId={season.id} onSaved={load} />
    </div>
  );
}