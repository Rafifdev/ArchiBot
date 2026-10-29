import React, { useState, useEffect, useMemo, useRef, useCallback, createContext, useContext } from 'react';
import { Link, useLocation, useNavigate, Outlet, useParams } from 'react-router-dom';
import { Badge, DiscordMark, MdDivider, MdIconButton, MdTextField, MdDialog } from '../ui';
import { GuildSummary, UserProfile } from '../../types/api';

export interface ServerSwitchContextValue {
  isSwitchingServer: boolean;
  registerServerFetch: (promise: Promise<any>) => void;
}

export const ServerSwitchContext = createContext<ServerSwitchContextValue>({
  isSwitchingServer: false,
  registerServerFetch: () => {},
});

export const useServerSwitch = () => useContext(ServerSwitchContext);

export interface NavEntry {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavEntry[];
}

function getBotNavigation(guildId?: string): { topNavItems: NavEntry[]; sectionGroups: NavGroup[] } {
  if (!guildId) {
    return { topNavItems: [], sectionGroups: [] };
  }

  // Only features that genuinely exist in ArchiBot (bot.js + Express routes)
  const topNavItems: NavEntry[] = [
    { to: `/guilds/${guildId}`, label: 'Home', icon: 'home', end: true },
    { to: `/guilds/${guildId}/architect`, label: 'Lego & Templates', icon: 'architecture' },
    { to: `/guilds/${guildId}/settings`, label: 'Settings', icon: 'tune' },
  ];

  const sectionGroups: NavGroup[] = [
    {
      title: 'SERVER MANAGEMENT',
      items: [
        { to: `/guilds/${guildId}/channels`, label: 'Channels & Categories', icon: 'deployed_code' },
        { to: `/guilds/${guildId}/roles`, label: 'Roles & Permissions', icon: 'badge' },
        { to: `/guilds/${guildId}/members`, label: 'Members & Moderation', icon: 'group' },
      ],
    },
    {
      title: 'VOICE & PANELS',
      items: [
        { to: `/guilds/${guildId}/voice`, label: 'Dynamic Voice Hubs', icon: 'spatial_audio_off' },
        { to: `/guilds/${guildId}/architect?tab=deployer`, label: 'Interactive Panels', icon: 'view_quilt' },
        { to: `/guilds/${guildId}/embeds`, label: 'Embed Publisher', icon: 'assignment' },
      ],
    },
    {
      title: 'BACKUPS & MILESTONES',
      items: [
        { to: `/guilds/${guildId}/backups`, label: 'Layout Backups', icon: 'inventory_2' },
        { to: `/guilds/${guildId}/settings?tab=milestone`, label: 'Member Milestones', icon: 'emoji_events' },
      ],
    },
  ];

  return { topNavItems, sectionGroups };
}

// ============================================================================
// TOP APP BAR
// ============================================================================

export interface TopAppBarProps {
  user: UserProfile | null;
  guildId?: string;
  theme?: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onLogout: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  user,
  guildId,
  theme = 'dark',
  onToggleTheme,
  onOpenSearch,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [botAvatar, setBotAvatar] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [botAvatarError, setBotAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.id, user?.avatar]);

  const userAvatarUrl = useMemo(() => {
    if (!user?.avatar) return null;
    if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
      return user.avatar;
    }
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  }, [user?.id, user?.avatar]);

  const displayName = useMemo(() => {
    const raw = user?.global_name || user?.username || 'Account';
    return raw.replace(' (Local Admin)', '').trim();
  }, [user?.global_name, user?.username]);

  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((d) => {
        if (d.botAvatar) setBotAvatar(d.botAvatar);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 shrink-0 bg-discord-sidebar border-b border-discord-border flex items-center justify-between px-5 z-40">
      {/* Left: Brand Logo */}
      <Link to="/servers" className="flex items-center gap-3 no-underline text-discord-white hover:opacity-90">
        {botAvatar && !botAvatarError ? (
          <img
            src={botAvatar}
            alt="ARCHIBOT DASHBOARD"
            onError={() => setBotAvatarError(true)}
            className="w-9 h-9 rounded-lg object-cover border border-discord-border shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-discord-blurple flex items-center justify-center text-discord-white shrink-0 shadow-sm">
            <DiscordMark className="w-5 h-5" />
          </div>
        )}
        <span className="font-normal tracking-wider text-base uppercase text-discord-white">ARCHIBOT DASHBOARD</span>
      </Link>

      {/* Center: Material Search Bar (Search ... Ctrl K) */}
      <div className="hidden sm:flex items-center justify-center flex-1 max-w-md mx-6">
        <button
          type="button"
          onClick={onOpenSearch}
          className="relative overflow-hidden w-72 sm:w-96 h-10 bg-discord-surface/90 hover:bg-discord-surface border border-discord-border rounded-lg px-3.5 flex items-center justify-between text-xs text-discord-muted cursor-pointer transition-colors"
        >
          <md-ripple />
          <div className="flex items-center gap-2.5 relative z-10">
            <md-icon class="text-base text-discord-muted">search</md-icon>
            <span>Search...</span>
          </div>
          <kbd className="text-xs font-normal text-discord-muted px-1.5 py-0.5 rounded bg-discord-canvas/60 border border-discord-border relative z-10">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Material Icon Buttons & User Profile Dropdown */}
      <div className="flex items-center gap-2">
        <MdIconButton
          icon={theme === 'dark' ? 'light_mode' : 'dark_mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onClick={onToggleTheme}
          className={theme === 'dark' ? 'text-discord-yellow hover:opacity-90' : 'text-discord-blurple'}
        />

        <MdIconButton
          icon="search"
          title="Search (Ctrl+K)"
          onClick={onOpenSearch}
          className="sm:hidden text-discord-muted"
        />

        <div className="relative">
          <button
            type="button"
            onClick={() => setUserDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-discord-card-hover transition-colors cursor-pointer"
          >
            {userAvatarUrl && !avatarError ? (
              <img
                src={userAvatarUrl}
                alt=""
                onError={() => setAvatarError(true)}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-discord-white text-xs shrink-0 font-medium">
                {(displayName || user?.username || 'U')[0].toUpperCase()}
              </div>
            )}
            <span className="hidden md:inline text-xs font-normal text-discord-white max-w-36 truncate">
              {displayName}
            </span>
            <md-icon class="text-base text-discord-muted hidden md:inline">expand_more</md-icon>
          </button>

          {/* User Profile Dropdown Menu */}
          {userDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserDropdownOpen(false)}
              />
              <div
                className="absolute right-0 mt-2 w-64 bg-discord-card border border-discord-border rounded-xl shadow-xl py-2 z-50 text-xs"
                onClick={() => setUserDropdownOpen(false)}
              >
                <div className="px-4 py-2 border-b border-discord-border flex items-center gap-3">
                  {userAvatarUrl && !avatarError ? (
                    <img
                      src={userAvatarUrl}
                      alt=""
                      onError={() => setAvatarError(true)}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center text-discord-white text-sm shrink-0 font-medium">
                      {(displayName || user?.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <div className="font-medium text-discord-white truncate text-sm">
                      {displayName}
                    </div>
                    {user?.username && (
                      <div className="text-discord-muted truncate text-xs">@{user.username}</div>
                    )}
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/servers"
                    className="flex items-center gap-3 px-4 py-2 text-discord-text hover:bg-discord-surface hover:text-discord-white no-underline transition-colors"
                  >
                    <md-icon class="text-base text-discord-muted">dns</md-icon>
                    <span>Switch Server</span>
                  </Link>

                  <a
                    href="https://discord.gg"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-2 text-discord-text hover:bg-discord-surface hover:text-discord-white no-underline transition-colors"
                  >
                    <md-icon class="text-base text-discord-muted">support</md-icon>
                    <span>Support Community</span>
                  </a>
                </div>

                <MdDivider />

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-discord-red hover:bg-discord-red/10 transition-colors cursor-pointer"
                  >
                    <md-icon class="text-base text-discord-red">logout</md-icon>
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

// ============================================================================
// NAVIGATION DRAWER (SIDEBAR)
// ============================================================================

export interface NavigationDrawerProps {
  guildId?: string;
  guildInfo?: GuildSummary | null;
  allGuilds?: GuildSummary[];
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  guildId,
  guildInfo,
  allGuilds = [],
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);

  const { topNavItems, sectionGroups } = getBotNavigation(guildId);

  const checkActive = (item: NavEntry) => {
    if (item.end) {
      return location.pathname === item.to;
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <aside className="w-72 shrink-0 h-full bg-discord-sidebar border-r border-discord-border flex flex-col select-none overflow-hidden">
      {/* Server Header Card & Dropdown */}
      <div className="p-3 border-b border-discord-border relative">
        {guildInfo ? (
          <button
            type="button"
            onClick={() => setServerDropdownOpen((prev) => !prev)}
            className="relative overflow-hidden w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-discord-card hover:bg-discord-card-hover border border-discord-border transition-colors cursor-pointer"
          >
            <md-ripple />
            <div className="flex items-center gap-2.5 overflow-hidden">
              {guildInfo.icon ? (
                <img
                  src={guildInfo.icon}
                  alt={guildInfo.name}
                  className="w-7 h-7 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-discord-blurple flex items-center justify-center text-discord-white shrink-0">
                  <DiscordMark className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="text-left overflow-hidden">
                <div className="text-xs font-normal text-discord-white truncate leading-snug">
                  {guildInfo.name}
                </div>
                <div className="text-xs text-discord-muted truncate">Active Server</div>
              </div>
            </div>
            <md-icon class="text-base text-discord-muted shrink-0">expand_more</md-icon>
          </button>
        ) : (
          <div className="h-11 rounded-lg bg-discord-card/50 flex items-center px-3 text-xs text-discord-muted">
            Select a Server
          </div>
        )}

        {/* Server Switcher Popover */}
        {serverDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setServerDropdownOpen(false)} />
            <div
              className="absolute left-3 right-3 mt-1.5 bg-discord-card border border-discord-border rounded-xl shadow-2xl py-1 z-50 max-h-64 overflow-y-auto"
              onClick={() => setServerDropdownOpen(false)}
            >
              <md-list>
                {allGuilds
                  .filter((g) => g.botInGuild)
                  .map((g) => {
                    const currentIcon = g.id === guildId && guildInfo?.icon ? guildInfo.icon : g.icon;
                    return (
                      <md-list-item
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setServerDropdownOpen(false);
                          navigate(`/guilds/${g.id}`);
                        }}
                      >
                        {currentIcon ? (
                          <img
                            slot="start"
                            src={currentIcon}
                            alt={g.name}
                            className="w-7 h-7 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div
                            slot="start"
                            className="w-7 h-7 rounded-lg bg-discord-blurple flex items-center justify-center text-discord-white shrink-0"
                          >
                            <DiscordMark className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span
                          className={`text-xs truncate ${
                            g.id === guildId ? 'text-discord-white font-normal' : 'text-discord-muted font-normal'
                          }`}
                        >
                          {g.name}
                        </span>
                      </md-list-item>
                    );
                  })}
                <MdDivider />
                <md-list-item
                  type="button"
                  onClick={() => {
                    setServerDropdownOpen(false);
                    navigate('/servers');
                  }}
                >
                  <md-icon slot="start" class="text-base text-discord-blurple">
                    grid_view
                  </md-icon>
                  <span className="text-xs text-discord-blurple font-normal">View All Servers</span>
                </md-list-item>
              </md-list>
            </div>
          </>
        )}
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {/* Top items (Home, Lego, Settings) */}
        <div className="space-y-0.5">
          {topNavItems.map((item) => {
            const active = checkActive(item);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative overflow-hidden flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-normal no-underline transition-colors ${
                  active
                    ? 'bg-discord-surface text-discord-white'
                    : 'text-discord-muted hover:text-discord-white hover:bg-discord-surface/50'
                }`}
              >
                <md-ripple />
                <md-icon
                  class={`text-base shrink-0 ${
                    active ? 'text-discord-blurple' : 'text-discord-muted'
                  }`}
                >
                  {item.icon}
                </md-icon>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Section Groups */}
        {sectionGroups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            <div className="px-3 pb-1 text-[11px] font-normal tracking-wider uppercase text-discord-muted/80">
              {group.title}
            </div>
            {group.items.map((item) => {
              const active = checkActive(item);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative overflow-hidden flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-normal no-underline transition-colors ${
                    active
                      ? 'bg-discord-surface text-discord-white'
                      : 'text-discord-muted hover:text-discord-white hover:bg-discord-surface/50'
                  }`}
                >
                  <md-ripple />
                  <md-icon
                    class={`text-base shrink-0 ${
                      active ? 'text-discord-blurple' : 'text-discord-muted'
                    }`}
                  >
                    {item.icon}
                  </md-icon>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-discord-border">
        <Link
          to="/servers"
          className="relative overflow-hidden flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-discord-muted hover:text-discord-white hover:bg-discord-surface/50 no-underline transition-colors w-full"
        >
          <md-ripple />
          <md-icon class="text-base text-discord-muted">swap_horiz</md-icon>
          <span>Switch Server</span>
        </Link>
      </div>
    </aside>
  );
};

// ============================================================================
// COMMAND SEARCH MODAL (QUICK NAVIGATION PALETTE)
// ============================================================================

export interface CommandSearchModalProps {
  open: boolean;
  onClose: () => void;
  guildId?: string;
  allGuilds?: GuildSummary[];
}

export const CommandSearchModal: React.FC<CommandSearchModalProps> = ({
  open,
  onClose,
  guildId,
  allGuilds,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [internalGuilds, setInternalGuilds] = useState<GuildSummary[]>([]);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (open && !guildId && (!allGuilds || allGuilds.length === 0)) {
      fetch(`/api/auth/guilds?_t=${Date.now()}`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.guilds) {
            setInternalGuilds(
              (data.guilds as GuildSummary[]).filter(
                (g) =>
                  g.id !== 'dev-demo-guild-uninvited' &&
                  !g.id.includes('demo') &&
                  !g.name?.toLowerCase().includes('community & gaming')
              )
            );
          }
        })
        .catch(() => {});
    }
  }, [open, guildId, allGuilds]);

  const availableGuilds = allGuilds && allGuilds.length > 0 ? allGuilds : internalGuilds;

  const groupedSearchSections = useMemo(() => {
    if (!guildId) return [];
    const { topNavItems, sectionGroups } = getBotNavigation(guildId);
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const formatGroupTitle = (title: string) =>
      title.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

    return [
      { title: 'General', items: topNavItems },
      ...sectionGroups.map((g) => ({
        title: formatGroupTitle(g.title),
        items: g.items,
      })),
    ]
      .map((group) => ({
        ...group,
        items: normalizedQuery
          ? group.items.filter(
              (item) =>
                item.label.toLowerCase().includes(normalizedQuery) ||
                group.title.toLowerCase().includes(normalizedQuery)
            )
          : group.items,
      }))
      .filter((group) => group.items.length > 0);
  }, [guildId, searchQuery]);

  const filteredServerGroups = useMemo(() => {
    if (guildId) return [];
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filtered = availableGuilds.filter((g) =>
      normalizedQuery ? g.name.toLowerCase().includes(normalizedQuery) : true
    );

    const active = filtered.filter((g) => g.botInGuild);
    const others = filtered.filter((g) => !g.botInGuild);

    const groups: { title: string; guilds: GuildSummary[] }[] = [];
    if (active.length > 0) {
      groups.push({ title: 'Active Servers', guilds: active });
    }
    if (others.length > 0) {
      groups.push({ title: 'Other Servers', guilds: others });
    }
    return groups;
  }, [guildId, searchQuery, availableGuilds]);

  return (
    <MdDialog open={open} onClose={onClose} headline="Quick Navigation">
      <div className="border-b border-discord-divider mt-[2px] mb-5" />
      <div className="flex flex-col gap-4">
        <MdTextField
          label="Search"
          value={searchQuery}
          onChange={setSearchQuery}
          debounceMs={250}
          icon="search"
          placeholder={guildId ? 'Find modules, channels, roles, voice hubs...' : 'Find server by name...'}
        />
        <div className="command-palette-scroll h-[316px] max-h-[316px] overflow-y-auto">
          {!guildId ? (
            /* SERVER NAVIGATION (On Select a Server page) */
            <>
              {filteredServerGroups.map((group, groupIndex) => (
                <div key={group.title} className={groupIndex > 0 ? 'mt-3' : ''}>
                  <div className="h-7 mb-1 flex items-center text-xs font-normal text-discord-white select-none">
                    {group.title}
                  </div>
                  <md-list class="command-palette-list">
                    {group.guilds.map((g) => (
                      <md-list-item
                        key={g.id}
                        type="button"
                        onClick={() => {
                          onClose();
                          setSearchQuery('');
                          if (g.botInGuild) {
                            navigate(`/guilds/${g.id}`);
                          } else if (g.inviteUrl) {
                            window.open(g.inviteUrl, '_blank');
                          }
                        }}
                      >
                        {g.icon ? (
                          <img
                            slot="start"
                            src={g.icon}
                            alt={g.name}
                            className="w-7 h-7 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div
                            slot="start"
                            className="w-7 h-7 rounded-lg bg-discord-blurple flex items-center justify-center text-discord-white shrink-0"
                          >
                            <DiscordMark className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-normal text-discord-text truncate">
                            {g.name}
                          </span>
                          {g.botInGuild ? (
                            <Badge size="xs" variant="soft" tone="green" label="Active" />
                          ) : (
                            <Badge size="xs" variant="soft" tone="neutral" label="Invite" />
                          )}
                          {g.isOwner && (
                            <Badge size="xs" variant="soft" tone="blurple" label="Owner" />
                          )}
                        </div>
                        <div slot="end" className="flex items-center gap-2 text-discord-muted text-xs">
                          {g.memberCount !== null && (
                            <span className="text-[11px] hidden sm:inline text-discord-muted font-normal">
                              {g.memberCount.toLocaleString()} members
                            </span>
                          )}
                          <md-icon class="text-base w-5 h-5 text-discord-muted">
                            {g.botInGuild ? 'chevron_right' : 'open_in_new'}
                          </md-icon>
                        </div>
                      </md-list-item>
                    ))}
                  </md-list>
                </div>
              ))}
              {filteredServerGroups.length === 0 && (
                <div className="py-8 text-center text-xs text-discord-muted font-normal">
                  No matching servers found
                </div>
              )}
            </>
          ) : (
            /* MODULE NAVIGATION (Inside a server) */
            <>
              {groupedSearchSections.map((group, groupIndex) => (
                <div key={group.title} className={groupIndex > 0 ? 'mt-3' : ''}>
                  <div className="h-7 mb-1 flex items-center text-xs font-normal text-discord-white select-none">
                    {group.title}
                  </div>
                  <md-list class="command-palette-list">
                    {group.items.map((item) => (
                      <md-list-item
                        key={item.label}
                        type="button"
                        onClick={() => {
                          onClose();
                          setSearchQuery('');
                          navigate(item.to);
                        }}
                      >
                        <md-icon slot="start" class="text-xl w-6 h-6 text-discord-blurple">
                          {item.icon}
                        </md-icon>
                        <span className="text-xs font-normal text-discord-text">
                          {item.label}
                        </span>
                        <md-icon slot="end" class="text-base w-5 h-5 text-discord-muted">
                          chevron_right
                        </md-icon>
                      </md-list-item>
                    ))}
                  </md-list>
                </div>
              ))}
              {groupedSearchSections.length === 0 && (
                <div className="py-8 text-center text-xs text-discord-muted font-normal">
                  No matching modules found
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MdDialog>
  );
};

// ============================================================================
// DASHBOARD LAYOUT (PAGE SHELL TEMPLATE)
// ============================================================================

export interface DashboardLayoutProps {
  user: UserProfile | null;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, onLogout }) => {
  const { guildId } = useParams<{ guildId?: string }>();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('archibot_theme') as 'dark' | 'light') || 'dark';
  });
  const [guildInfo, setGuildInfo] = useState<GuildSummary | null>(null);
  const [allGuilds, setAllGuilds] = useState<GuildSummary[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSwitchingServer, setIsSwitchingServer] = useState(false);

  const prevGuildIdRef = useRef<string | undefined>(undefined);
  const isServerSwitchingRef = useRef(false);
  const activeFetchesRef = useRef<Set<Promise<any>>>(new Set());
  const switchTimeoutRef = useRef<any>(null);

  const registerServerFetch = useCallback((p: Promise<any>) => {
    // Only register fetch and trigger fullscreen blur if we are actively switching servers!
    // When navigating between menus inside the same server, do NOT trigger the blur overlay.
    if (!isServerSwitchingRef.current) return;

    setIsSwitchingServer(true);
    activeFetchesRef.current.add(p);

    p.finally(() => {
      activeFetchesRef.current.delete(p);
      if (activeFetchesRef.current.size === 0) {
        setIsSwitchingServer(false);
        isServerSwitchingRef.current = false;
        if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('archibot_theme', theme);
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
    fetch(`/api/auth/guilds?_t=${Date.now()}`, {
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache, no-store' },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.guilds) {
          setAllGuilds(
            (data.guilds as GuildSummary[]).filter(
              (g) =>
                g.id !== 'dev-demo-guild-uninvited' &&
                !g.id.includes('demo') &&
                !g.name?.toLowerCase().includes('community & gaming')
            )
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!guildId) {
      setGuildInfo(null);
      setIsSwitchingServer(false);
      isServerSwitchingRef.current = false;
      prevGuildIdRef.current = undefined;
      return;
    }

    const isRealServerSwitch = Boolean(prevGuildIdRef.current && prevGuildIdRef.current !== guildId);
    prevGuildIdRef.current = guildId;

    if (isRealServerSwitch) {
      isServerSwitchingRef.current = true;
      setIsSwitchingServer(true);

      if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
      switchTimeoutRef.current = setTimeout(() => {
        setIsSwitchingServer(false);
        isServerSwitchingRef.current = false;
        activeFetchesRef.current.clear();
      }, 4000);
    }

    const overviewPromise = fetch(`/api/guilds/${guildId}/overview`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.guild) {
          setGuildInfo(data.guild);
          setAllGuilds((prev) =>
            prev.map((g) =>
              g.id === data.guild.id ? { ...g, icon: data.guild.icon || g.icon } : g
            )
          );
        }
      })
      .catch(() => {});

    if (isRealServerSwitch) {
      registerServerFetch(overviewPromise);
    }
  }, [guildId, registerServerFetch]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ServerSwitchContext.Provider value={{ isSwitchingServer, registerServerFetch }}>
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-discord-canvas text-discord-text font-sans relative">
        {/* Top App Bar (Fixed at Top) */}
        <TopAppBar
          user={user}
          guildId={guildId}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenSearch={() => setSearchOpen(true)}
          onLogout={onLogout}
        />

        {/* Middle Area: Fixed Left Sidebar (with Inner Scroll) + Scrollable Main Content */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative">
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

        {/* Fullscreen Blur and Clean Circular Loading Overlay when switching server */}
        <div
          className={`fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center transition-all duration-300 ease-out pointer-events-none ${
            isSwitchingServer
              ? 'opacity-100 backdrop-blur-md bg-discord-canvas/50 pointer-events-auto'
              : 'opacity-0 backdrop-blur-none bg-transparent pointer-events-none'
          }`}
        >
          <md-circular-progress indeterminate class="scale-125" />
        </div>

        {/* Command Search Modal Organism */}
        <CommandSearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          guildId={guildId}
          allGuilds={allGuilds}
        />
      </div>
    </ServerSwitchContext.Provider>
  );
};

export const DashboardTemplate = DashboardLayout;
export const Layout = DashboardLayout;
