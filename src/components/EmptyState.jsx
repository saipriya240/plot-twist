import { Link } from 'react-router-dom';

export default function EmptyState({ icon: Icon, title, body, actionLabel, onAction, to }) {
  return (
    <div className="mx-5 rounded-sm border border-dashed border-ink-line bg-ink-raised/50 px-6 py-10 text-center">
      {Icon ? <Icon className="mx-auto h-5 w-5 text-white/25" strokeWidth={1.3} /> : null}
      <p className="t-card mx-auto mt-4 max-w-[15rem] text-white/85">{title}</p>
      {body ? <p className="mx-auto mt-2.5 max-w-[17rem] text-[12.5px] leading-relaxed text-ink-soft">{body}</p> : null}
      {actionLabel && to ? (
        <Link
          to={to}
          className="t-meta mt-6 inline-flex rounded-sm bg-flare px-5 py-2.5 font-semibold tracking-[0.18em] text-white transition hover:bg-flare-deep"
        >
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="t-meta mt-6 inline-flex rounded-sm bg-flare px-5 py-2.5 font-semibold tracking-[0.18em] text-white transition hover:bg-flare-deep"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}