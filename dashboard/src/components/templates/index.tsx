import React, { useState, useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { TopAppBar, NavigationDrawer, CommandSearchModal } from '../organisms';
import { GuildSummary, UserProfile } from '../../types/api';

export interface DashboardTemplateProps {
  user: UserProfile | null;
  onLogout: () => void;
}

export const DashboardTemplate: React.FC<DashboardTemplateProps> = ({ user, onLogout }) => {
  const { guildId } = useParams<{ guildId?: string }>();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [guildInfo, setGuildInfo] = useState<GuildSummary | null>(null);
  const [allGuilds, setAllGuilds] = useState<GuildSummary[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    fetch('/api/auth/guilds', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.guilds) setAllGuilds(data.guilds);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!guildId) {
      setGuildInfo(null);
      return;
    }
    fetch(`/api/guilds/${guildId}/overview`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.guild) {
          setGuildInfo(data.guild);
        }
      })
      .catch(() => {});
  }, [guildId]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-discord-canvas text-discord-text font-sans">
      {/* Top App Bar (Fixed at Top) */}
      <TopAppBar
        user={user}
        guildId={guildId}
        onToggleTheme={toggleTheme}
        onOpenSearch={() => setSearchOpen(true)}
        onLogout={onLogout}
      />

      {/* Middle Area: Fixed Left Sidebar (with Inner Scroll) + Scrollable Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {guildId && (
          <NavigationDrawer
            guildId={guildId}
            guildInfo={guildInfo}
            allGuilds={allGuilds}
          />
        )}

        {/* Main Content Area (Scrolls independently from Sidebar) */}
        <main className="flex-1 h-full overflow-y-auto px-6 sm:px-10 py-8 text-xs font-normal">
          <div className="max-w-6xl w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Command Search Modal Organism */}
      <CommandSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        guildId={guildId}
      />
    </div>
  );
};

export const Layout = DashboardTemplate;
