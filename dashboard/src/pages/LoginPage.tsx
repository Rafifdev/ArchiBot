import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdButton, MdTextField, DiscordMark, MdIcon, NoticeBanner, SurfaceCard } from '../components/ui';
import { AuthStatus, UserProfile } from '../types/api';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [devLoading, setDevLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [botAvatarError, setBotAvatarError] = useState(false);

  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((data) => {
        setStatus(data);
        if (!data.configured) setShowWizard(true);
      })
      .catch(() => {});
  }, []);

  const handleDevLogin = async () => {
    setDevLoading(true);
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
        navigate('/servers');
      } else {
        alert(data.error || 'Dev login failed');
      }
    } catch (err: any) {
      alert(`Error during dev login: ${err.message}`);
    } finally {
      setDevLoading(false);
    }
  };

  const handleSaveOAuth = async () => {
    if (!clientSecret.trim()) return;
    setSaveLoading(true);
    try {
      const res = await fetch('/api/auth/setup-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientSecret }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage('OAuth secret saved! You can now log in with Discord.');
        setStatus((prev) => (prev ? { ...prev, configured: true } : null));
        setShowWizard(false);
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-discord-canvas">
      <div className="max-w-md w-full flex flex-col gap-6">
        {/* Brand header */}
        <div className="text-center flex flex-col items-center">
          {status?.botAvatar && !botAvatarError ? (
            <img
              src={status.botAvatar}
              alt="ARCHIBOT DASHBOARD"
              onError={() => setBotAvatarError(true)}
              className="w-14 h-14 rounded-2xl object-cover shadow-lg mb-4 border border-discord-border"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-discord-blurple flex items-center justify-center text-discord-white shadow-lg mb-4">
              <DiscordMark className="w-8 h-8" />
            </div>
          )}
          <h1 className="text-xl font-normal text-discord-white uppercase tracking-wider">ARCHIBOT DASHBOARD</h1>
          <p className="text-discord-muted text-xs font-normal mt-1.5 leading-relaxed max-w-xs">
            Sign in with your Discord account to configure and manage your community servers.
          </p>
        </div>

        {saveMessage && <NoticeBanner message={saveMessage} tone="success" />}

        {/* Main Login Card */}
        <SurfaceCard className="p-6 flex flex-col gap-4">
          <h2 className="text-xs font-normal text-discord-white">Authentication</h2>

          <a
            href={status?.configured ? '/api/auth/login' : '#'}
            onClick={(e) => {
              if (!status?.configured) {
                e.preventDefault();
                setShowWizard(true);
              }
            }}
            className="no-underline"
          >
            <MdButton variant="filled" className="w-full" icon="login">
              Continue with Discord
            </MdButton>
          </a>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-discord-border" />
            <span className="text-xs uppercase tracking-wider text-discord-muted font-normal">OR</span>
            <div className="flex-1 h-px bg-discord-border" />
          </div>

          <MdButton
            variant="tonal"
            onClick={handleDevLogin}
            disabled={devLoading}
            icon="admin_panel_settings"
            className="w-full"
          >
            {devLoading ? 'Signing In...' : 'Quick Login as Bot Owner (Localhost)'}
          </MdButton>
          <span className="text-xs text-discord-muted text-center font-normal">
            Zero-config instant access for local development.
          </span>
        </SurfaceCard>

        {showWizard && (
          <SurfaceCard className="flex flex-col gap-3.5">
            <div className="flex items-center gap-2 text-discord-white">
              <MdIcon name="settings_suggest" className="text-xl text-discord-blurple" />
              <h3 className="text-xs font-normal">Discord OAuth2 Setup Assistant</h3>
            </div>
            <p className="text-xs text-discord-muted font-normal leading-relaxed">
              Paste your <span className="text-discord-text font-normal">Client Secret</span> from the Discord Developer Portal to activate standard OAuth2 login:
            </p>

            <div className="text-xs bg-discord-surface border border-discord-border p-2.5 rounded-lg">
              <div className="text-discord-muted mb-1">Redirect URI to add in portal:</div>
              <code className="text-discord-blurple break-all">
                {status?.redirectUri || 'http://localhost:5173/api/auth/callback'}
              </code>
            </div>

            <MdTextField
              label="DISCORD_CLIENT_SECRET"
              value={clientSecret}
              onChange={setClientSecret}
              type="password"
              placeholder="Paste Client Secret..."
            />

            <MdButton variant="filled" onClick={handleSaveOAuth} disabled={saveLoading || !clientSecret.trim()}>
              {saveLoading ? 'Saving...' : 'Save & Enable Discord OAuth'}
            </MdButton>
          </SurfaceCard>
        )}
      </div>
    </div>
  );
};
