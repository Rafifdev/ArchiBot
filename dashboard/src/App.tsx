import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ServerSelectPage } from './pages/ServerSelectPage';
import { OverviewPage } from './pages/OverviewPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { RolesPage } from './pages/RolesPage';
import { MembersPage } from './pages/MembersPage';
import { ArchitectPage } from './pages/ArchitectPage';
import { VoicePage } from './pages/VoicePage';
import { EmbedsPage } from './pages/EmbedsPage';
import { BackupsPage } from './pages/BackupsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DashboardLayout } from './components/layout';
import { MdLoading } from './components/ui';
import { UserProfile } from './types/api';

export const AppContent: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-discord-canvas">
        <MdLoading />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/servers" replace /> : <LoginPage onLoginSuccess={setUser} />}
      />

      <Route
        path="/servers"
        element={
          user ? (
            <div className="min-h-screen bg-discord-canvas">
              <DashboardLayout user={user} onLogout={handleLogout} />
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<ServerSelectPage />} />
      </Route>

      <Route
        path="/guilds/:guildId"
        element={user ? <DashboardLayout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      >
        <Route index element={<OverviewPage />} />
        <Route path="channels" element={<ChannelsPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="architect" element={<ArchitectPage />} />
        <Route path="voice" element={<VoicePage />} />
        <Route path="embeds" element={<EmbedsPage />} />
        <Route path="backups" element={<BackupsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? '/servers' : '/login'} replace />} />
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
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
