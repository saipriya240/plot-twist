import { Link } from 'react-router-dom';
import { Play, ArrowRight } from 'lucide-react';
import MediaThumb from './MediaThumb';
import { pad } from '@/lib/constants';
import { fmtDate } from '@/lib/format';

export default function HomeHero({ season, episodeCount, memoryCount, latestEpisode, updated }) {
  return (
    <section className="relative">
      <div className="relative h-[64vh] min-h-[420px] w-full overflow-hidden">
        <MediaThumb
          fileRef={season.cover_image}
          alt={season.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-base via-ink-base/55 to-ink-base/15" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-8">
          <p className="t-cinema text-[13px] tracking-[0.42em] text-flare">
            Season {pad(season.season_number || 1)}
          </p>
          <h1 className="t-season t-over-image mt-3 text-white">{season.title}</h1>
          {season.description ? (
            <p className="mt-3 max-w-sm text-[12.5px] leading-relaxed tracking-[0.005em] text-white/70">{season.description}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] uppercase tracking-[0.2em] text-white/45">
            <span>{episodeCount} episodes</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>{memoryCount} memories</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>Updated {fmtDate(updated, 'today')}</span>
          </div>
          <div className="mt-6 flex gap-2">
            <Link
              to={latestEpisode ? `/episode/${latestEpisode.id}` : '/episodes'}
              className="tap t-meta flex flex-1 items-center justify-center gap-2 rounded-sm bg-white py-3.5 font-semibold tracking-[0.16em] text-ink-base"
            >
              <Play className="h-3.5 w-3.5 fill-ink-base" />
              Continue watching
            </Link>
            <Link
              to={`/season/${season.id}`}
              className="tap t-meta flex items-center justify-center gap-1.5 rounded-sm border border-white/30 px-4 py-3.5 font-semibold tracking-[0.16em] text-white"
            >
              View season
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}