import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MdButton, DiscordMark, NoticeBanner, SurfaceCard } from '../components/ui';
import { AuthStatus, UserProfile } from '../types/api';

interface LoginPageProps {
  onLoginSuccess?: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [botAvatarError, setBotAvatarError] = useState(false);

  const errorParam = searchParams.get('error');

  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => {});
  }, []);

  const getErrorMessage = (err: string | null) => {
    if (!err) return null;
    switch (err) {
      case 'oauth_not_configured':
        return 'Discord OAuth2 is not configured on the server. Please check your environment settings.';
      case 'missing_code':
        return 'Discord authorization was cancelled or incomplete.';
      case 'server_error':
        return 'An error occurred during Discord authentication. Please try again.';
      case 'access_denied':
        return 'Authorization was denied by Discord.';
      default:
        return `Authentication error: ${err}`;
    }
  };

  const errorMessage = getErrorMessage(errorParam);

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
              className="w-16 h-16 rounded-2xl object-cover shadow-lg mb-4 border border-discord-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-discord-blurple flex items-center justify-center text-discord-white shadow-lg mb-4">
              <DiscordMark className="w-9 h-9" />
            </div>
          )}
          <h1 className="text-xl font-normal text-discord-white uppercase tracking-wider">
            {status?.botName ? `${status.botName} DASHBOARD` : 'ARCHIBOT DASHBOARD'}
          </h1>
          <p className="text-discord-muted text-xs font-normal mt-1.5 leading-relaxed max-w-xs">
            Sign in with your Discord account to configure and manage your community servers.
          </p>
        </div>

        {errorMessage && <NoticeBanner message={errorMessage} tone="danger" />}

        {/* Main Login Card */}
        <SurfaceCard className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-xs font-normal text-discord-white">Authentication</h2>
            <p className="text-xs text-discord-muted font-normal">
              Authorize ArchiBot with your Discord account to view and manage servers where you have management permissions.
            </p>
          </div>

          <a href="/api/auth/login" className="no-underline block w-full">
            <MdButton variant="filled" className="w-full" size="lg">
              <DiscordMark className="w-5 h-5 mr-2.5 shrink-0" />
              <span>Login with Discord</span>
            </MdButton>
          </a>

          <p className="text-[11px] text-discord-muted text-center font-normal leading-relaxed">
            Standard Discord OAuth2 identity and guilds verification.
          </p>
        </SurfaceCard>
      </div>
    </div>
  );
};
