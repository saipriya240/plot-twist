import { Link } from 'react-router-dom';

export default function SectionTitle({ label, action, actionTo, children }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4 px-5">
      <div className="min-w-0">
        <p className="t-section text-white">{label}</p>
        {children}
      </div>
      {action && actionTo ? (
        <Link to={actionTo} className="t-kicker shrink-0 whitespace-nowrap text-white/40 transition hover:text-flare">
          {action}
        </Link>
      ) : (
        <span className="t-kicker shrink-0 whitespace-nowrap text-white/40">{action}</span>
      )}
    </div>
  );
}