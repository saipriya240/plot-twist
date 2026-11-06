import { Link, NavLink } from 'react-router-dom';
import { Home as HomeIcon, Clapperboard, Plus, Users, User as UserIcon } from 'lucide-react';

const items = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/episodes', label: 'Episodes', icon: Clapperboard },
  { to: '/create', label: 'Create', icon: Plus },
  { to: '/characters', label: 'Characters', icon: Users },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-line/80 bg-ink-base/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-xl items-end justify-between px-3 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2">
        {items.map((item) => {
          if (item.to === '/create') {
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label="Create memory"
                className="relative -mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-flare text-white shadow-[0_10px_30px_-8px_rgba(229,9,20,0.9)] transition active:scale-95"
              >
                <Plus className="h-6 w-6" strokeWidth={2.5} />
              </Link>
            );
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex w-16 flex-col items-center gap-1 py-1 transition ${
                  isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.6} />
                  <span className="text-[9px] font-medium uppercase tracking-[0.16em]">{item.label}</span>
                  <span className={`h-0.5 w-4 rounded-full transition ${isActive ? 'bg-flare' : 'bg-transparent'}`} />
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}