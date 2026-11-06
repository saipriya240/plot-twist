import MediaThumb from './MediaThumb';
import { monthLabel } from '@/lib/format';

export default function FinalePoster({ finale, photos = [], innerRef }) {
  const strip = photos.slice(0, 3);
  return (
    <div
      ref={innerRef}
      className="relative w-full overflow-hidden rounded-sm border border-ink-line bg-ink-base"
      style={{ aspectRatio: '4 / 5' }}
    >
      {finale.poster_cover ? (
        <MediaThumb fileRef={finale.poster_cover} className="absolute inset-0 h-full w-full object-cover opacity-55" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-base via-ink-base/70 to-ink-base/40" />
      <div className="relative flex h-full flex-col justify-between p-5">
        <div>
          <p className="t-cinema text-[13px] tracking-[0.4em] text-flare">Season finale</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-white/60">{monthLabel(finale.month, finale.year)}</p>
        </div>

        <div>
          <h3 className="t-episode t-over-image text-white">{finale.title}</h3>
          <p className="mt-3 line-clamp-5 text-[11.5px] leading-relaxed text-white/75">{finale.narrative}</p>
          {finale.closing_narration ? (
            <p className="t-quote mt-3 border-l border-flare pl-2.5 text-white/55">{finale.closing_narration}</p>
          ) : null}
        </div>

        <div className="flex gap-1.5">
          {strip.length
            ? strip.map((photo, index) => (
                <div key={`${photo}-${index}`} className="h-14 flex-1 overflow-hidden rounded-sm border border-white/10">
                  <MediaThumb fileRef={photo} className="h-full w-full object-cover" />
                </div>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}