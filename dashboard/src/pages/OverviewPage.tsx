import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DiscordMark, OverviewSkeleton, SectionHeader, QuickActionCard, ModuleCard } from '../components/ui';
import { useServerSwitch } from '../components/layout';

export const OverviewPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { registerServerFetch } = useServerSwitch();

  const fetchOverview = () => {
    setLoading(true);
    const p = fetch(`/api/guilds/${guildId}/overview`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => {
        if (res.guild) setData(res.guild);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    registerServerFetch(p);
  };

  useEffect(() => {
    fetchOverview();
  }, [guildId]);

  if (loading && !data) return <OverviewSkeleton />;
  if (!data) return <div className="text-xs text-discord-muted">Failed to load server data.</div>;

  const quickActions = [
    {
      title: 'Documentation',
      subtitle: 'Guides and tutorials',
      icon: 'menu_book',
      iconBg: 'bg-discord-surface text-discord-blurple',
      external: true,
      onClick: () => window.open('https://github.com/yoapipp/ArchiBot#readme', '_blank'),
    },
    {
      title: 'Support Server',
      subtitle: 'Join community & donate',
      icon: 'favorite',
      iconBg: 'bg-discord-surface text-discord-fuchsia',
      external: true,
      onClick: () => window.open('https://discord.gg', '_blank'),
    },
    {
      title: 'Layout Snapshots',
      subtitle: 'Save & restore server layouts',
      icon: 'inventory_2',
      iconBg: 'bg-discord-surface text-discord-yellow',
      external: false,
      onClick: () => navigate(`/guilds/${guildId}/backups`),
    },
    {
      title: 'Member Milestones',
      subtitle: 'Celebrate member goals',
      icon: 'emoji_events',
      iconBg: 'bg-discord-surface text-discord-blurple',
      external: false,
      onClick: () => navigate(`/guilds/${guildId}/settings?tab=milestone`),
    },
  ];

  // Only modules that genuinely exist in ArchiBot (bot.js + Express routes)
  const modules = [
    {
      title: 'Channels & Categories',
      description: 'Create, lock, sync, and manage text, stage, and voice channels',
      icon: 'deployed_code',
      to: `/guilds/${guildId}/channels`,
    },
    {
      title: 'Server Architect',
      description: 'Build complete server structures from presets, Lego modules, or spec',
      icon: 'view_quilt',
      to: `/guilds/${guildId}/architect`,
    },
    {
      title: 'Roles & Permissions',
      description: 'Create and manage role colors, hierarchy, and permissions',
      icon: 'badge',
      to: `/guilds/${guildId}/roles`,
    },
    {
      title: 'Member Moderation',
      description: 'Review members, assign roles, timeout, kick, and ban',
      icon: 'group',
      to: `/guilds/${guildId}/members`,
    },
    {
      title: 'CAPTCHA Verification',
      description: 'Deploy distorted image CAPTCHA verification panels for newcomers',
      icon: 'verified_user',
      to: `/guilds/${guildId}/architect?tab=deployer`,
    },
    {
      title: 'Interactive Panels',
      description: 'Deploy self-assignable role panels, support tickets, and 15-button voice UI',
      icon: 'dashboard_customize',
      to: `/guilds/${guildId}/architect?tab=deployer`,
    },
    {
      title: 'Dynamic Voice Hubs',
      description: 'Manage Join-to-Create voice generators and live temporary voice rooms',
      icon: 'spatial_audio_off',
      to: `/guilds/${guildId}/voice`,
    },
    {
      title: 'Member Milestones',
      description: 'Generate custom milestone celebration banners and grant reward roles',
      icon: 'emoji_events',
      to: `/guilds/${guildId}/settings?tab=milestone`,
    },
    {
      title: 'Embed Publisher',
      description: 'Build rich announcements with live Discord message preview',
      icon: 'assignment',
      to: `/guilds/${guildId}/embeds`,
    },
    {
      title: 'Welcome & Goodbye',
      description: 'Configure automated greeting messages and system channels',
      icon: 'waving_hand',
      to: `/guilds/${guildId}/settings?tab=welcome`,
    },
    {
      title: 'Layout Backups',
      description: 'Snapshot server structure, export JSON, or restore saved layouts',
      icon: 'inventory_2',
      to: `/guilds/${guildId}/backups`,
    },
    {
      title: 'Audit Logs & Bot Profile',
      description: 'Inspect recent server actions and customize ArchiBot server nickname',
      icon: 'history',
      to: `/guilds/${guildId}/settings?tab=audit`,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Top Server Identity Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {data.icon ? (
            <img
              src={data.icon}
              alt={data.name}
              className="w-16 h-16 rounded-xl object-cover shadow-md shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-discord-blurple flex items-center justify-center text-discord-white shadow-md shrink-0">
              <DiscordMark className="w-9 h-9" />
            </div>
          )}
          <div>
            <div className="text-xs font-normal tracking-wider uppercase text-discord-muted">
              DASHBOARD
            </div>
            <h1 className="text-xl sm:text-2xl font-normal text-discord-white leading-tight mt-0.5">
              {data.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Quick Actions Section (Atomic Molecules) */}
      <div className="mb-8">
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((item) => (
            <QuickActionCard
              key={item.title}
              title={item.title}
              subtitle={item.subtitle}
              icon={item.icon}
              iconBg={item.iconBg}
              external={item.external}
              onClick={item.onClick}
            />
          ))}
        </div>
      </div>

      {/* Modules Grid Section (Atomic Molecules) */}
      <div>
        <SectionHeader title="Modules" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((mod) => (
            <ModuleCard
              key={mod.title}
              title={mod.title}
              description={mod.description}
              icon={mod.icon}
              onClick={() => navigate(mod.to)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
