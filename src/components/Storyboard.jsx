import MediaThumb from './MediaThumb';

export default function Storyboard({ trailer, frame = null, innerRef }) {
  const frames = trailer.storyboard || [];

  if (frame !== null) {
    const current = frames[frame] || frames[0];
    return (
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-sm border border-ink-line bg-ink-base">
        {current?.photo ? (
          <MediaThumb fileRef={current.photo} className="absolute inset-0 h-full w-full object-cover opacity-80" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-base via-ink-base/30 to-ink-base/60" />
        <div className="absolute inset-0 flex flex-col justify-between p-5">
          <p className="t-cinema text-[11px] tracking-[0.4em] text-flare">{trailer.title}</p>
          <p className="t-episode t-over-image text-white">{current?.line}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={innerRef} className="rounded-sm border border-ink-line bg-ink-base p-3">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="t-card text-white">{trailer.title}</p>
        <p className="t-cinema shrink-0 text-[11px] tracking-[0.24em] text-flare">{trailer.scope_label}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {frames.map((item, index) => (
          <div key={`${item.photo}-${index}`} className="relative aspect-[4/5] overflow-hidden rounded-sm bg-ink-card">
            {item.photo ? <MediaThumb fileRef={item.photo} className="h-full w-full object-cover opacity-80" /> : null}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-base to-transparent" />
            <p className="t-quote absolute inset-x-0 bottom-0 p-2 text-white">{item.line}</p>
          </div>
        ))}
      </div>
    </div>
  );
}