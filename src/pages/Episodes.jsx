import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clapperboard, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import EpisodeBuilder from '@/components/EpisodeBuilder';
import SeasonDialog from '@/components/SeasonDialog';
import EmptyState from '@/components/EmptyState';
import MediaThumb from '@/components/MediaThumb';
import { fmtDate } from '@/lib/format';
import { pad } from '@/lib/constants';

const items = (res) => (Array.isArray(res) ? res : (res && res.items) || []);

export default function Episodes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'seasons' ? 'seasons' : 'episodes');
  const [episodes, setEpisodes] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [preselect, setPreselect] = useState([]);

  const load = async () => {
    const [epRes, seaRes] = await Promise.all([
      base44.entities.Episode.filter({}, { sort: '-episode_number', limit: 100 }),
      base44.entities.Season.filter({}, { sort: '-season_number', limit: 50 }),
    ]);
    setEpisodes(items(epRes));
    setSeasons(items(seaRes));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const buildId = searchParams.get('build');
    if (buildId) {
      setPreselect([buildId]);
      setBuilderOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const seasonById = (id) => seasons.find((s) => s.id === id);

  return (
    <div className="animate-fade-in px-5 pb-6 pt-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="t-kicker text-flare">Your series</p>
          <h1 className="t-hero mt-2.5 text-white">Episodes</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setPreselect([]);
            if (tab === 'seasons') setSeasonOpen(true);
            else setBuilderOpen(true);
          }}
          className="tap t-meta mt-2 flex items-center gap-1.5 rounded-sm bg-flare px-3.5 py-2.5 font-semibold tracking-[0.16em] text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          {tab === 'seasons' ? 'Season' : 'Episode'}
        </button>
      </div>

      <div className="mt-6 flex gap-1 rounded-md border border-ink-line bg-ink-raised p-1">
        {[
          { key: 'episodes', label: 'Episodes' },
          { key: 'seasons', label: 'Seasons' },
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setTab(option.key)}
            className={`t-meta flex-1 rounded-sm py-2.5 font-semibold tracking-[0.18em] transition ${
              tab === option.key ? 'bg-white text-ink-base' : 'text-white/45'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-white/40" />
        </div>
      ) : tab === 'episodes' ? (
        <div className="mt-5 space-y-2.5">
          {episodes.length ? (
            episodes.map((episode) => (
              <Link
                key={episode.id}
                to={`/episode/${episode.id}`}
                className="flex items-center gap-3 rounded-md border border-ink-line bg-ink-raised p-2.5 transition hover:border-flare/40"
              >
                <div className="h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-ink-card">
                  <MediaThumb fileRef={episode.cover_image} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="t-cinema text-[12px] tracking-[0.3em] text-flare">
                    Episode {pad(episode.episode_number || 0)}
                    {episode.status === 'draft' ? <span className="ml-2 font-heading text-[8.5px] tracking-[0.2em] text-white/35">Draft</span> : null}
                  </p>
                  <p className="t-card mt-1 truncate text-white">{episode.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-ink-soft">{episode.synopsis}</p>
                  <p className="mt-1.5 text-[9px] uppercase tracking-[0.18em] text-white/30">
                    {fmtDate(episode.release_date || episode.created_date)}
                    {episode.season_id && seasonById(episode.season_id) ? ` · ${seasonById(episode.season_id).title}` : ''}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
              </Link>
            ))
          ) : (
            <EmptyState
              icon={Clapperboard}
              title="No episodes yet"
              body="Select a few memories and let the story director cut them into your first episode."
              actionLabel="Write an episode"
              onAction={() => setBuilderOpen(true)}
            />
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-2.5">
          {seasons.length ? (
            seasons.map((season) => {
              const count = episodes.filter((e) => e.season_id === season.id).length;
              return (
                <Link
                  key={season.id}
                  to={`/season/${season.id}`}
                  className="flex items-center gap-3 rounded-md border border-ink-line bg-ink-raised p-2.5 transition hover:border-flare/40"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-ink-card">
                    <MediaThumb fileRef={season.cover_image} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="t-cinema text-[12px] tracking-[0.3em] text-flare">
                      Season {pad(season.season_number || 1)}
                      <span className="ml-2 font-heading text-[8.5px] tracking-[0.2em] text-white/35">
                        {season.status === 'archived' ? 'Archived' : 'Active'}
                      </span>
                    </p>
                    <p className="t-card mt-1 truncate text-white">{season.title}</p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/30">{count} episodes</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
                </Link>
              );
            })
          ) : (
            <EmptyState
              icon={Clapperboard}
              title="Start Season 01"
              body="Every series needs a first season. Name the chapter you're in right now."
              actionLabel="Create a season"
              onAction={() => setSeasonOpen(true)}
            />
          )}
        </div>
      )}

      <EpisodeBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        initialMemoryIds={preselect}
        onSaved={load}
      />

      <SeasonDialog
        open={seasonOpen}
        onOpenChange={setSeasonOpen}
        nextNumber={(seasons[0] ? seasons[0].season_number || 0 : 0) + 1}
        onSaved={load}
      />
    </div>
  );
}