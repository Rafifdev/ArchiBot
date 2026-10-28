import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdButton, MdTextField, MdLoading, DiscordMark, StatusBadge } from '../components/atoms';
import { PageHeader, SurfaceCard, EmptyState } from '../components/molecules';
import { GuildSummary } from '../types/api';

export const ServerSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const [guilds, setGuilds] = useState<GuildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchGuilds = (force = false) => {
    setLoading(true);
    fetch(`/api/auth/guilds${force ? '?refresh=true' : ''}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.guilds) setGuilds(data.guilds);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchGuilds();
  }, []);

  const filtered = guilds.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        category="SERVERS"
        title="Select a Server"
        description="Choose a server to configure with ArchiBot or invite the bot to a new community."
        actions={
          <>
            <div className="w-60">
              <MdTextField
                label="Search servers"
                value={search}
                onChange={setSearch}
                debounceMs={250}
                placeholder="Filter by server name"
              />
            </div>
            <MdButton
              variant="tonal"
              icon="refresh"
              onClick={() => {
                setRefreshing(true);
                fetchGuilds(true);
              }}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </MdButton>
          </>
        }
      />

      {loading ? (
        <MdLoading />
      ) : filtered.length === 0 ? (
        <SurfaceCard className="p-12">
          <EmptyState
            icon="dns"
            title="No servers found"
            description="You need Administrator or Manage Server permissions on a Discord server to manage it here."
          />
        </SurfaceCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <SurfaceCard
              key={g.id}
              onClick={() => {
                if (g.botInGuild) navigate(`/guilds/${g.id}`);
              }}
              className={`p-4 flex flex-col justify-between gap-4 transition-all ${
                g.botInGuild ? 'hover:bg-discord-card-hover hover:border-discord-border-hover cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center gap-3.5">
                {g.icon ? (
                  <img src={g.icon} alt={g.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-discord-blurple text-discord-white flex items-center justify-center shrink-0">
                    <DiscordMark className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-normal text-xs text-discord-white truncate">{g.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {g.botInGuild ? (
                      <StatusBadge label="Active" tone="green" />
                    ) : (
                      <StatusBadge label="Not Added" tone="neutral" />
                    )}
                    {g.isOwner && <StatusBadge label="Owner" tone="blurple" />}
                  </div>
                </div>
              </div>

              {g.botInGuild && g.memberCount !== null && (
                <div className="flex gap-4 text-xs text-discord-muted font-normal">
                  <span>{g.memberCount} members</span>
                  <span>•</span>
                  <span>{g.channelsCount} channels</span>
                  <span>•</span>
                  <span>{g.rolesCount} roles</span>
                </div>
              )}

              <div className="pt-3 border-t border-discord-border">
                {g.botInGuild ? (
                  <MdButton variant="filled" icon="arrow_forward" className="w-full">
                    Open Dashboard
                  </MdButton>
                ) : (
                  <a
                    href={g.inviteUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="no-underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MdButton variant="tonal" icon="add" className="w-full">
                      Invite ArchiBot
                    </MdButton>
                  </a>
                )}
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
};
