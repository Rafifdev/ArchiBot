import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { BlogPage } from './pages/BlogPage';
import { ServerSelectPage } from './pages/ServerSelectPage';
import { OverviewPage } from './pages/OverviewPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { RolesPage } from './pages/RolesPage';
import { MembersPage } from './pages/MembersPage';
import { ArchitectPage } from './pages/ArchitectPage';
import { VoicePage } from './pages/VoicePage';
import { EmbedsPage } from './pages/EmbedsPage';
import { BackupsPage } from './pages/BackupsPage';
import { SettingsPage } from './pages/SettingsPage';
import { MilestonesPage } from './pages/MilestonesPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { WelcomePage } from './pages/WelcomePage';
import { GoodbyePage } from './pages/GoodbyePage';
import { GiveawaysPage } from './pages/GiveawaysPage';
import { DashboardLayout } from './components/layout';
import { MdLoading, Toaster } from './components/ui';
import { UserProfile } from './types/api';

export const AppContent: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => {
        if (r.ok) return r.json();
        throw new Error('Not authenticated');
      })
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setUser(null);
    navigate('/');
  };

  const isLandingRoute = location.pathname === '/' || location.pathname === '/id' || location.pathname === '/blog';

  if (loading && !isLandingRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-discord-canvas">
        <MdLoading />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage user={user} />} />
      <Route path="/id" element={<LandingPage user={user} />} />
      <Route path="/blog" element={<BlogPage user={user} />} />

      {/* Redirect /login ke landing page / servers karena login page telah ditiadakan */}
      <Route
        path="/login"
        element={<Navigate to={user ? '/servers' : '/'} replace />}
      />

      <Route
        path="/servers"
        element={
          user ? (
            <div className="min-h-screen bg-discord-canvas">
              <DashboardLayout user={user} onLogout={handleLogout} />
            </div>
          ) : (
            <Navigate to="/" replace />
          )
        }
      >
        <Route index element={<ServerSelectPage />} />
      </Route>

      <Route
        path="/guilds/:guildId"
        element={user ? <DashboardLayout user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />}
      >
        <Route index element={<OverviewPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="channels" element={<ChannelsPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="architect" element={<ArchitectPage />} />
        <Route path="welcome" element={<WelcomePage user={user} />} />
        <Route path="goodbye" element={<GoodbyePage user={user} />} />
        <Route path="giveaways" element={<GiveawaysPage mode="management" />} />
        <Route path="giveaways/config" element={<GiveawaysPage mode="config" />} />
        <Route path="voice" element={<VoicePage />} />
        <Route path="embeds" element={<EmbedsPage />} />
        <Route path="backups" element={<BackupsPage />} />
        <Route path="milestones" element={<MilestonesPage user={user} />} />
        <Route path="audit" element={<AuditLogsPage />} />
        <Route path="audit-logs" element={<Navigate to="audit" replace />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? '/servers' : '/'} replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Toaster position="top-right" maxVisible={5} />
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
