import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import MediaThumb from './MediaThumb';
import { pad } from '@/lib/constants';
import { fmtShort } from '@/lib/format';

export default function EpisodeCard({ episode }) {
  return (
    <Link to={`/episode/${episode.id}`} className="group block w-[58vw] max-w-[240px] shrink-0">
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-ink-line/60 bg-ink-card">
        <MediaThumb
          fileRef={episode.cover_image}
          alt={episode.title}
          className="h-full w-full object-cover opacity-85 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-base via-ink-base/25 to-transparent" />
        {episode.favourite ? (
          <Star className="absolute right-2.5 top-2.5 h-3.5 w-3.5 fill-flare text-flare" />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="t-cinema text-[11px] tracking-[0.3em] text-flare">
            Episode {pad(episode.episode_number || 0)}
          </p>
          <p className="t-card t-over-image mt-1.5 text-white">{episode.title}</p>
          <p className="mt-1.5 text-[9.5px] uppercase tracking-[0.18em] text-white/45">
            {fmtShort(episode.release_date || episode.created_date)}
          </p>
        </div>
      </div>
      {episode.synopsis ? (
        <p className="mt-2 line-clamp-2 px-0.5 text-[11.5px] leading-relaxed text-ink-soft">{episode.synopsis}</p>
      ) : null}
    </Link>
  );
}