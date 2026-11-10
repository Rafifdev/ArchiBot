import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdButton,
  MdSelect,
  MdLoading,
  DiscordMark,
  StatusBadge,
  PageHeader,
  SurfaceCard,
  EmptyState,
} from '../components/ui';
import { GuildSummary } from '../types/api';
import { useRealtime } from '../hooks/useRealtime';

type ViewMode = 'featured' | 'grid' | 'list';

const GuildAvatar: React.FC<{
  icon?: string | null;
  name: string;
  sizeClass?: string;
  roundedClass?: string;
  ringClass?: string;
}> = ({
  icon,
  name,
  sizeClass = 'w-12 h-12',
  roundedClass = 'rounded-lg',
  ringClass = '',
}) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [icon]);

  if (icon && !error) {
    return (
      <img
        src={icon}
        alt={name}
        onError={() => setError(true)}
        className={`${sizeClass} ${roundedClass} ${ringClass} object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${roundedClass} ${ringClass} bg-discord-blurple text-white flex items-center justify-center shrink-0 shadow-xs`}
    >
      <DiscordMark className="w-1/2 h-1/2" />
    </div>
  );
};

const ServerSelectSkeleton: React.FC<{ viewMode: ViewMode }> = ({ viewMode }) => {
  if (viewMode === 'featured') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="relative rounded-2xl overflow-hidden bg-discord-card border border-discord-border flex flex-col justify-between select-none animate-pulse"
          >
            {/* Top Banner Skeleton */}
            <div className="relative h-36 bg-gradient-to-b from-discord-blurple/20 via-discord-blurple/8 to-discord-card flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-discord-surface/80 ring-4 ring-discord-card/80" />
            </div>
            {/* Bottom Info Row Skeleton */}
            <div className="p-3.5 px-4 flex items-center justify-between gap-3 bg-discord-card min-h-[56px]">
              <div className="h-4 w-28 bg-discord-surface/90 rounded-md" />
              <div className="h-9 w-20 bg-discord-surface/90 rounded-lg shrink-0" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-4 flex flex-col justify-between gap-4 bg-discord-card border border-discord-border rounded-xl select-none animate-pulse"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-lg bg-discord-surface/90 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-32 bg-discord-surface/90 rounded-md mb-2" />
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-14 bg-discord-surface/80 rounded" />
                  <div className="h-4 w-14 bg-discord-surface/80 rounded" />
                </div>
              </div>
            </div>
            <div className="min-h-[20px] flex items-center">
              <div className="h-3 w-44 bg-discord-surface/70 rounded-md" />
            </div>
            <div className="pt-3.5 border-t border-discord-border">
              <div className="h-10 w-full bg-discord-surface/90 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="p-3.5 px-5 flex items-center justify-between gap-4 bg-discord-card border border-discord-border rounded-xl select-none animate-pulse"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-discord-surface/90 shrink-0" />
            <div className="min-w-0">
              <div className="h-4 w-36 bg-discord-surface/90 rounded-md mb-2" />
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-12 bg-discord-surface/80 rounded" />
                <div className="h-4 w-12 bg-discord-surface/80 rounded" />
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 px-2">
            <div className="h-3 w-48 bg-discord-surface/70 rounded-md" />
          </div>
          <div className="shrink-0">
            <div className="h-8 w-20 bg-discord-surface/90 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ServerSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const [guilds, setGuilds] = useState<GuildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('server_view_mode') as ViewMode) || 'featured';
  });

  const viewOptions: { value: ViewMode; label: string; icon: string }[] = [
    { value: 'featured', label: 'Featured Cards', icon: 'dashboard' },
    { value: 'grid', label: 'Grid Cards', icon: 'view_module' },
    { value: 'list', label: 'List View', icon: 'view_list' },
  ];

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('server_view_mode', mode);
  };

  const fetchGuilds = (force = false) => {
    setLoading(true);
    fetch(`/api/auth/guilds?_t=${Date.now()}${force ? '&refresh=true' : ''}`, {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.guilds) {
          const sanitized = (data.guilds as GuildSummary[]).filter(
            (g) =>
              g.id !== 'dev-demo-guild-uninvited' &&
              !g.id.includes('demo') &&
              !g.name?.toLowerCase().includes('community & gaming')
          );
          setGuilds(sanitized);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGuilds();
  }, []);

  // Auto-sync in realtime whenever bot joins or leaves a server
  useRealtime(undefined, (msg) => {
    if (msg.event === 'GUILD_CREATE' || msg.event === 'GUILD_DELETE') {
      fetchGuilds(true);
    }
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        category="SERVERS"
        title="Select a Server"
        description="Choose a server to configure with ArchiBot or invite the bot to a new community."
        actions={
          <div className="flex items-center gap-2">
            <MdSelect
              compact
              value={viewMode}
              onChange={(val) => handleSetViewMode(val as ViewMode)}
              options={viewOptions}
              className="w-48"
            />
          </div>
        }
      />

      {loading ? (
        <div className="pt-2 pb-6">
          <ServerSelectSkeleton viewMode={viewMode} />
        </div>
      ) : guilds.length === 0 ? (
        <SurfaceCard className="p-12">
          <EmptyState
            icon="dns"
            title="No servers found"
            description="You need Administrator or Manage Server permissions on a Discord server to manage it here."
          />
        </SurfaceCard>
      ) : (
        <div className="pt-2 pb-6">
          {viewMode === 'featured' ? (
            /* OPSI 1: Featured vertical square card with top banner & centered avatar - 4 columns */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {guilds.map((g) => (
                <div
                  key={g.id}
                  onClick={() => {
                    if (g.botInGuild) {
                      navigate(`/guilds/${g.id}`);
                    } else if (g.inviteUrl) {
                      window.open(g.inviteUrl, '_blank');
                    }
                  }}
                  className="relative rounded-2xl overflow-hidden bg-discord-card border border-discord-border transition-all duration-200 ease-out flex flex-col justify-between group select-none hover:-translate-y-1 hover:shadow-[var(--md-elevation-card-hover)] cursor-pointer"
                >
                  {/* Top Banner Area with subtle controller aura & centered circular avatar */}
                  <div className="relative h-36 bg-gradient-to-b from-discord-blurple/20 via-discord-blurple/8 to-discord-card flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none scale-125 text-discord-blurple">
                      <DiscordMark className="w-28 h-28" />
                    </div>

                    <GuildAvatar
                      icon={g.icon}
                      name={g.name}
                      sizeClass="w-14 h-14"
                      roundedClass="rounded-full"
                      ringClass="ring-4 ring-discord-card/80 shadow-md relative z-10 transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>

                  {/* Bottom Info Row: Server Name on left & Manage / Invite Button on right */}
                  <div className="p-3.5 px-4 flex items-center justify-between gap-3 bg-discord-card min-h-[56px]">
                    <span
                      className="font-normal text-xs sm:text-sm text-discord-white truncate min-w-0 flex-1 leading-normal"
                      title={g.name}
                    >
                      {g.name}
                    </span>

                    <div className="shrink-0 flex items-center">
                      {g.botInGuild ? (
                        <MdButton
                          size="sm"
                          variant="filled"
                          className="px-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/guilds/${g.id}`);
                          }}
                        >
                          Manage
                        </MdButton>
                      ) : (
                        <a
                          href={g.inviteUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="no-underline inline-flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MdButton size="sm" variant="tonal" icon="add" className="px-3.5">
                            Invite
                          </MdButton>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'grid' ? (
            /* OPSI 2: Compact grid cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {guilds.map((g) => (
                <SurfaceCard
                  key={g.id}
                  onClick={() => {
                    if (g.botInGuild) {
                      navigate(`/guilds/${g.id}`);
                    } else if (g.inviteUrl) {
                      window.open(g.inviteUrl, '_blank');
                    }
                  }}
                  className="p-4 flex flex-col justify-between gap-4 transition-all duration-200 ease-out select-none hover:-translate-y-1 hover:shadow-[var(--md-elevation-card-hover)] cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <GuildAvatar
                      icon={g.icon}
                      name={g.name}
                      sizeClass="w-12 h-12"
                      roundedClass="rounded-lg"
                      ringClass="shadow-xs border border-discord-border/50"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="font-normal text-sm text-discord-white truncate leading-tight" title={g.name}>
                        {g.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {g.botInGuild ? (
                          <StatusBadge label="Active" tone="green" variant="soft" />
                        ) : (
                          <StatusBadge label="Not Added" tone="neutral" variant="soft" />
                        )}
                        {g.isOwner && <StatusBadge label="Owner" tone="blurple" variant="soft" />}
                      </div>
                    </div>
                  </div>

                  <div className="min-h-[20px] flex items-center gap-3 text-xs text-discord-muted font-normal">
                    {g.botInGuild && g.memberCount !== null ? (
                      <>
                        <span>{g.memberCount.toLocaleString()} members</span>
                        <span>•</span>
                        <span>{g.channelsCount} channels</span>
                        <span>•</span>
                        <span>{g.rolesCount} roles</span>
                      </>
                    ) : (
                      <span className="text-discord-muted/70 text-[11px] italic">Not connected to ArchiBot</span>
                    )}
                  </div>

                  <div className="pt-3.5 border-t border-discord-border">
                    {g.botInGuild ? (
                      <MdButton
                        variant="filled"
                        size="md"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/guilds/${g.id}`);
                        }}
                      >
                        Manage
                      </MdButton>
                    ) : (
                      <a
                        href={g.inviteUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="no-underline block w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MdButton variant="tonal" size="md" className="w-full" icon="add">
                          Invite
                        </MdButton>
                      </a>
                    )}
                  </div>
                </SurfaceCard>
              ))}
            </div>
          ) : (
            /* OPSI 3: List view (Horizontal rows) */
            <div className="flex flex-col gap-3">
              {guilds.map((g) => (
                <SurfaceCard
                  key={g.id}
                  onClick={() => {
                    if (g.botInGuild) {
                      navigate(`/guilds/${g.id}`);
                    } else if (g.inviteUrl) {
                      window.open(g.inviteUrl, '_blank');
                    }
                  }}
                  className="p-3.5 px-5 flex items-center justify-between gap-4 transition-all duration-200 hover:bg-discord-card-hover hover:border-discord-border-hover cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <GuildAvatar
                      icon={g.icon}
                      name={g.name}
                      sizeClass="w-10 h-10"
                      roundedClass="rounded-lg"
                      ringClass="shadow-xs border border-discord-border/50"
                    />

                    <div className="min-w-0">
                      <div className="font-normal text-sm text-discord-white truncate leading-tight" title={g.name}>
                        {g.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {g.botInGuild ? (
                          <StatusBadge label="Active" tone="green" variant="soft" />
                        ) : (
                          <StatusBadge label="Not Added" tone="neutral" variant="soft" />
                        )}
                        {g.isOwner && <StatusBadge label="Owner" tone="blurple" variant="soft" />}
                      </div>
                    </div>
                  </div>

                  {g.botInGuild && g.memberCount !== null && (
                    <div className="hidden md:flex items-center gap-4 text-xs text-discord-muted font-normal shrink-0 px-2">
                      <span>{g.memberCount.toLocaleString()} members</span>
                      <span>•</span>
                      <span>{g.channelsCount} channels</span>
                      <span>•</span>
                      <span>{g.rolesCount} roles</span>
                    </div>
                  )}

                  <div className="shrink-0 flex items-center">
                    {g.botInGuild ? (
                      <MdButton
                        size="sm"
                        variant="filled"
                        className="px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/guilds/${g.id}`);
                        }}
                      >
                        Manage
                      </MdButton>
                    ) : (
                      <a
                        href={g.inviteUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="no-underline inline-flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MdButton size="sm" variant="tonal" icon="add" className="px-3.5">
                          Invite
                        </MdButton>
                      </a>
                    )}
                  </div>
                </SurfaceCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
