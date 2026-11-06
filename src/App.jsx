import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import OnboardingGuard from '@/components/OnboardingGuard';
// Add page imports here
import Welcome from '@/pages/Welcome';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Mfa from '@/pages/Mfa';
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import Episodes from '@/pages/Episodes';
import Create from '@/pages/Create';
import Characters from '@/pages/Characters';
import Profile from '@/pages/Profile';
import EpisodeViewer from '@/pages/EpisodeViewer';
import SeasonDetail from '@/pages/SeasonDetail';
import TimeMachine from '@/pages/TimeMachine';
import Finales from '@/pages/Finales';
import Trailer from '@/pages/Trailer';
import PlotTwists from '@/pages/PlotTwists';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-ink-base">
        <div className="w-8 h-8 border-2 border-white/15 border-t-flare rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/mfa" element={<Mfa />} />

      {/* Signed in */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/welcome" replace />} />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<OnboardingGuard><AppLayout /></OnboardingGuard>}>
          <Route path="/" element={<Home />} />
          <Route path="/episodes" element={<Episodes />} />
          <Route path="/create" element={<Create />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/episode/:id" element={<EpisodeViewer />} />
          <Route path="/season/:id" element={<SeasonDetail />} />
          <Route path="/timemachine" element={<TimeMachine />} />
          <Route path="/finales" element={<Finales />} />
          <Route path="/trailer" element={<Trailer />} />
          <Route path="/plot-twists" element={<PlotTwists />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App