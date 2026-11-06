import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-ink-base">
      <main className="safe-bottom mx-auto w-full max-w-xl">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}