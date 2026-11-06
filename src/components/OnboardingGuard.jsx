import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { profileOf } from '@/lib/media';

export default function OnboardingGuard({ children }) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let alive = true;
    base44.auth
      .me()
      .then((me) => {
        if (!alive) return;
        setStatus(profileOf(me).onboarded ? 'ready' : 'onboarding');
      })
      .catch(() => {
        if (alive) setStatus('ready');
      });
    return () => {
      alive = false;
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-base">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-flare" />
      </div>
    );
  }

  if (status === 'onboarding') return <Navigate to="/onboarding" replace />;

  return children;
}