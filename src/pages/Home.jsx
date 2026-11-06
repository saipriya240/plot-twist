import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import {
  Bell,
  Clapperboard,
  Clock,
  Film,
  Sparkles,
  Users,
  CalendarDays,
  ArrowUpRight,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { profileOf } from '@/lib/media';
import { todayISO } from '@/lib/format';
import HomeHero from '@/components/HomeHero';
import RecapCard from '@/components/RecapCard';
import EpisodeCard from '@/components/EpisodeCard';
import SectionTitle from '@/components/SectionTitle';
import EmptyState from '@/components/EmptyState';
import MediaThumb from '@/components/MediaThumb';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { pad } from '@/lib/constants';

const items = (res) => (Array.isArray(res) ? res : (res && res.items) || []);

const TOOLS = [
  { to: '/timemachine', label: 'Time Machine', icon: Clock },
  { to: '/finales', label: 'Season Finale', icon: Film },
  { to: '/trailer', label: 'Life Trailer', icon: Clapperboard },
  { to: '/plot-twists', label: 'Plot Twists', icon: Sparkles },
];

export default function Home() {
  const [state, setState] = useState({ loading: true });
  const [recapLoading, setRecapLoading] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const load = async () => {
    const me = await base44.auth.me();
    const profile = profileOf(me);
    const monthStart = moment().startOf('month').format('YYYY-MM-DD');

    const [seasonRes, episodeRes, memoryCount, episodeCount, characterCount, dateVals, unfinished, archive, recent] =
      await Promise.all([
        base44.entities.Season.filter({}, { sort: '-season_number', limit: 20 }),
        base44.entities.Episode.filter({}, { sort: '-episode_number', limit: 12 }),
        base44.entities.Memory.count({}),
        base44.entities.Episode.count({}),
        base44.entities.Character.count({}),
        base44.entities.Memory.list({ distinct: 'memory_date' }),
        base44.entities.Memory.filter({ episode_id: { $exists: false } }, { sort: '-memory_date', limit: 6 }),
        base44.entities.Memory.filter({ memory_date: { $lt: monthStart } }, { sort: '-memory_date', limit: 6 }),
        base44.entities.Memory.filter({}, { sort: '-created_date', limit: 5 }),
      ]);

    const seasons = items(seasonRes);
    const episodes = items(episodeRes);
    const active = seasons.find((s) => s.status === 'active') || seasons[0] || null;
    const seasonEpisodes = active ? episodes.filter((e) => e.season_id === active.id) : [];

    setState({
      loading: false,
      profile,
      season: active,
      seasons,
      episodes,
      seasonEpisodes,
      latestEpisode: episodes[0] || null,
      stats: {
        memories: memoryCount,
        episodes: episodeCount,
        characters: characterCount,
        days: (items(dateVals) || []).filter(Boolean).length,
      },
      unfinished: items(unfinished),
      archive: items(archive),
      recent: items(recent),
    });
  };

  useEffect(() => {
    load().catch((error) => {
      setState({ loading: false, error: error.message });
    });
  }, []);

  const refreshRecap = async () => {
    setRecapLoading(true);
    try {
      const res = await base44.entities.Memory.filter({}, { sort: '-memory_date', limit: 8 });
      const ids = items(res).map((m) => m.id);
      if (ids.length < 2) {
        toast({ title: 'Not enough memories yet', description: 'Add a couple of memories and your recap will write itself.' });
        return;
      }
      const response = await base44.functions.invoke('generateRecap', { memory_ids: ids });
      if (response.data && response.data.error) throw new Error(response.data.error);
      const recap = response.data.recap;
      await base44.auth.updateMe({ latest_recap: recap, recap_date: todayISO() });
      setState((prev) => ({ ...prev, profile: { ...prev.profile, latest_recap: recap } }));
    } catch (error) {
      toast({ title: 'Recap unavailable', description: error.message, variant: 'destructive' });
    } finally {
      setRecapLoading(false);
    }
  };

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-flare" />
      </div>
    );
  }

  const { profile = {}, season, stats = {}, unfinished = [], archive = [], episodes = [], recent = [] } = state;
  const firstName = (profile.display_name || profile.full_name || 'there').split(' ')[0];
  const initials = (profile.display_name || profile.full_name || 'PT').slice(0, 2).toUpperCase();

  return (
    <div className="animate-fade-in">
      <header className="flex items-center justify-between px-5 pb-4 pt-6">
        <div className="flex items-center gap-3">
          {profile.avatar_url ? (
            <MediaThumb fileRef={profile.avatar_url} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-ink-card font-display text-[13px] italic text-white/70">
              {initials}
            </div>
          )}
          <div>
            <p className="t-kicker text-white/35">Welcome back</p>
            <p className="mt-1 font-heading text-[13.5px] font-medium tracking-tight text-white">{firstName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setNotesOpen(true)}
          aria-label="What's new"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ink-line text-white/60 transition hover:text-white"
        >
          <Bell className="h-4 w-4" />
          {recent.length ? <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-flare" /> : null}
        </button>
      </header>

      {season ? (
        <HomeHero
          season={season}
          episodeCount={state.seasonEpisodes.length}
          memoryCount={stats.memories || 0}
          latestEpisode={state.latestEpisode}
          updated={state.latestEpisode ? state.latestEpisode.release_date || state.latestEpisode.created_date : season.updated_date}
        />
      ) : (
        <div className="px-5">
          <EmptyState
            icon={Clapperboard}
            title="No season yet"
            body="Start Season 01 and your series gets its opening titles."
            actionLabel="Start a season"
            to="/episodes?tab=seasons"
          />
        </div>
      )}

      <div className="mt-8">
        <RecapCard recap={profile.latest_recap} onRefresh={refreshRecap} loading={recapLoading} />
      </div>

      <div className="mt-9">
        <SectionTitle label="Your latest episodes" action="All episodes" actionTo="/episodes" />
        {episodes.length ? (
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-2">
            {episodes.slice(0, 8).map((episode) => (
              <EpisodeCard key={episode.id} episode={episode} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Clapperboard}
            title="Your first episode is waiting"
            body="Pick a few memories and let the story director write your opening episode."
            actionLabel="Write an episode"
            to="/episodes"
          />
        )}
      </div>

      <div className="mt-9 px-5">
        <SectionTitle label="Your season so far" />
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Memories', value: stats.memories || 0, icon: CalendarDays },
            { label: 'Episodes', value: stats.episodes || 0, icon: Clapperboard },
            { label: 'People', value: stats.characters || 0, icon: Users },
            { label: 'Days documented', value: stats.days || 0, icon: Sparkles },
          ].map((stat) => (
            <div key={stat.label} className="rounded-md border border-ink-line bg-ink-raised px-4 py-4">
              <stat.icon className="h-3.5 w-3.5 text-flare" strokeWidth={1.8} />
              <p className="t-stat mt-3 text-white">{stat.value}</p>
              <p className="t-kicker mt-2 text-white/32">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-9">
        <SectionTitle label="Unfinished stories" action="Memories" actionTo="/create" />
        {unfinished.length ? (
          <div className="space-y-2 px-5">
            {unfinished.map((memory) => (
              <Link
                key={memory.id}
                to={`/episodes?build=${memory.id}`}
                className="flex items-center gap-3 rounded-md border border-ink-line bg-ink-raised p-3 transition hover:border-flare/40"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-sm bg-ink-card">
                  {memory.media && memory.media[0] ? (
                    <MediaThumb fileRef={memory.media[0].url} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[9px] uppercase text-white/25">
                      {pad(new Date(memory.memory_date || memory.created_date).getDate())}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[15px] leading-tight text-white">{memory.title}</p>
                  <p className="mt-1 text-[9.5px] uppercase tracking-[0.18em] text-white/35">
                    {memory.memory_date || 'undated'} · not in an episode
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-white/30" />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="Everything is in a story"
            body="Every memory you've saved has found its place in an episode."
            actionLabel="Add a memory"
            to="/create"
          />
        )}
      </div>

      {archive.length ? (
        <div className="mt-9">
          <SectionTitle label="From your archive" action="Time machine" actionTo="/timemachine" />
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-2">
            {archive.map((memory) => (
              <div key={memory.id} className="w-[42%] shrink-0">
                <div className="aspect-square overflow-hidden rounded-md border border-ink-line bg-ink-card">
                  {memory.media && memory.media[0] ? (
                    <MediaThumb fileRef={memory.media[0].url} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-3 text-center text-[10px] uppercase tracking-[0.16em] text-white/25">
                      {memory.mood || 'memory'}
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 font-display text-[14px] leading-snug text-white/80">{memory.title}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/30">{memory.memory_date}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-9 px-5">
        <SectionTitle label="Story tools" />
        <div className="grid grid-cols-2 gap-2.5">
          {TOOLS.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="flex items-center gap-2.5 rounded-md border border-ink-line bg-ink-raised px-4 py-3.5 transition hover:border-flare/40"
            >
              <tool.icon className="h-4 w-4 text-flare" strokeWidth={1.7} />
              <span className="font-heading text-[11.5px] font-medium tracking-tight text-white/85">{tool.label}</span>
            </Link>
          ))}
        </div>
        <p className="t-lead mt-10 text-center text-[14px] leading-relaxed text-white/30">
          Someday, your ordinary days will become your favourite stories.
        </p>
      </div>

      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto border-ink-line bg-ink-raised">
          <DialogHeader>
            <DialogTitle className="t-episode text-white">New in your series</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {recent.length ? (
              recent.map((memory) => (
                <div key={memory.id} className="rounded-md border border-ink-line bg-ink-card px-3 py-2.5">
                  <p className="font-display text-[15px] leading-snug text-white">{memory.title}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/35">
                    {memory.memory_date || 'undated'} · saved
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[12.5px] text-ink-soft">Nothing yet. Your first memory will show up here.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}