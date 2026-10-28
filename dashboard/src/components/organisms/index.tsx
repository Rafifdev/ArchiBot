import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DiscordMark, MdDivider, MdIconButton, MdTextField } from '../atoms';
import { MdDialog } from '../molecules';
import { GuildSummary, UserProfile } from '../../types/api';

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

export function getBotNavigation(guildId?: string): { topNavItems: NavEntry[]; sectionGroups: NavGroup[] } {
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

export interface TopAppBarProps {
  user: UserProfile | null;
  guildId?: string;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onLogout: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  user,
  guildId,
  onToggleTheme,
  onOpenSearch,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="h-16 shrink-0 bg-discord-sidebar border-b border-discord-border flex items-center justify-between px-5 z-40">
      {/* Left: Brand Logo */}
      <Link to="/servers" className="flex items-center gap-3 no-underline text-discord-white hover:opacity-90">
        <div className="w-9 h-9 rounded-lg bg-discord-surface border border-discord-border flex items-center justify-center text-discord-white font-normal text-base">
          A
        </div>
        <span className="font-normal tracking-wider text-base uppercase text-discord-white">ARCHIBOT</span>
      </Link>

      {/* Center: Material Search Bar (Search ... Ctrl K) */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="relative overflow-hidden w-72 sm:w-96 h-10 bg-discord-surface/90 hover:bg-discord-surface border border-discord-border rounded-lg px-3.5 flex items-center justify-between text-xs text-discord-muted cursor-pointer transition-colors"
      >
        <md-ripple />
        <span className="flex items-center gap-2.5 relative z-10">
          <md-icon class="text-lg text-discord-muted">search</md-icon>
          <span className="font-normal text-discord-text text-xs">Search</span>
        </span>
        <kbd className="text-xs font-normal text-discord-muted px-1.5 py-0.5 rounded bg-discord-canvas/60 border border-discord-border relative z-10">
          Ctrl K
        </kbd>
      </button>

      {/* Right: Material Icon Buttons & User Profile Dropdown */}
      <div className="flex items-center gap-2">
        <MdIconButton
          icon="auto_awesome"
          title="Toggle Theme"
          onClick={onToggleTheme}
          className="text-discord-blurple"
        />

        <MdIconButton
          icon="notifications"
          title="Server Audit Logs"
          onClick={() => guildId && navigate(`/guilds/${guildId}/settings?tab=audit`)}
        />

        {user && (
          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => setUserDropdownOpen((prev) => !prev)}
              className="relative overflow-hidden flex items-center gap-2 cursor-pointer bg-transparent border-0 p-1 rounded-lg"
            >
              <md-ripple />
              {user.avatar ? (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                  alt={user.username}
                  className="w-8 h-8 rounded-full object-cover relative z-10"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-xs font-normal text-discord-white relative z-10">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <md-icon class="text-base text-discord-muted relative z-10">expand_more</md-icon>
            </button>

            {userDropdownOpen && (
              <div
                onMouseLeave={() => setUserDropdownOpen(false)}
                className="absolute right-0 mt-2 w-64 bg-discord-card border border-discord-border rounded-xl shadow-xl py-2 z-50 text-xs"
              >
                <div className="px-4 py-3">
                  <div className="font-normal text-xs text-discord-text truncate">
                    {user.global_name || user.username}
                  </div>
                  <div className="text-xs text-discord-muted truncate font-normal">@{user.username}</div>
                </div>
                <MdDivider />
                <md-list>
                  <md-list-item
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      navigate('/servers');
                    }}
                  >
                    <md-icon slot="start">dns</md-icon>
                    <span className="text-xs font-normal">Switch Server</span>
                  </md-list-item>
                  <md-list-item
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                  >
                    <md-icon slot="start" class="text-discord-red">logout</md-icon>
                    <span className="text-xs font-normal text-discord-red">Log Out</span>
                  </md-list-item>
                </md-list>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export interface NavigationDrawerProps {
  guildId: string;
  guildInfo: GuildSummary | null;
  allGuilds: GuildSummary[];
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  guildId,
  guildInfo,
  allGuilds,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);

  const { topNavItems, sectionGroups } = getBotNavigation(guildId);

  const checkActive = (item: NavEntry) => {
    if (item.end) {
      return location.pathname === item.to && !location.search;
    }
    if (item.to.includes('?')) {
      const [pathPart, queryPart] = item.to.split('?');
      return location.pathname === pathPart && location.search === `?${queryPart}`;
    }
    return location.pathname === item.to && !location.search;
  };

  return (
    <aside className="w-72 shrink-0 h-full bg-discord-sidebar border-r border-discord-border flex flex-col select-none overflow-hidden">
      {/* Pinned Top: Server Selector Dropdown Box */}
      <div className="relative p-3 pb-2 shrink-0">
        <button
          type="button"
          onClick={() => setServerDropdownOpen((prev) => !prev)}
          className="relative overflow-hidden w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-discord-card hover:bg-discord-card-hover border border-discord-border transition-colors cursor-pointer"
        >
          <md-ripple />
          <div className="flex items-center gap-2.5 min-w-0 relative z-10">
            {guildInfo?.icon ? (
              <img
                src={guildInfo.icon}
                alt={guildInfo.name}
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-discord-blurple flex items-center justify-center text-discord-white shrink-0">
                <DiscordMark className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="text-xs font-normal text-discord-text truncate">
              {guildInfo?.name || 'Loading server...'}
            </span>
          </div>
          <md-icon class="text-base text-discord-muted shrink-0 relative z-10">expand_more</md-icon>
        </button>

        {serverDropdownOpen && (
          <div
            onMouseLeave={() => setServerDropdownOpen(false)}
            className="absolute left-3 right-3 mt-1.5 bg-discord-card border border-discord-border rounded-xl shadow-2xl py-1 z-50 max-h-64 overflow-y-auto"
          >
            <md-list>
              {allGuilds
                .filter((g) => g.botInGuild)
                .map((g) => (
                  <md-list-item
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setServerDropdownOpen(false);
                      navigate(`/guilds/${g.id}`);
                    }}
                  >
                    <div
                      slot="start"
                      className="w-7 h-7 rounded-full bg-discord-blurple flex items-center justify-center text-discord-white shrink-0"
                    >
                      <DiscordMark className="w-3.5 h-3.5" />
                    </div>
                    <span
                      className={`text-xs truncate ${
                        g.id === guildId ? 'text-discord-white font-normal' : 'text-discord-muted font-normal'
                      }`}
                    >
                      {g.name}
                    </span>
                  </md-list-item>
                ))}
              <MdDivider />
              <md-list-item
                type="button"
                onClick={() => {
                  setServerDropdownOpen(false);
                  navigate('/servers');
                }}
              >
                <md-icon slot="start" class="text-discord-blurple text-base">grid_view</md-icon>
                <span className="text-xs text-discord-blurple font-normal">
                  View All Servers
                </span>
              </md-list-item>
            </md-list>
          </div>
        )}
      </div>

      {/* Inner Scrollable Sidebar Navigation Area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-4">
        {/* Top Primary Navigation */}
        <nav className="flex flex-col gap-1">
          {topNavItems.map((item) => {
            const isActive = checkActive(item);
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`relative overflow-hidden flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs no-underline transition-colors ${
                  isActive
                    ? 'bg-discord-active text-discord-white font-normal'
                    : 'text-discord-muted hover:text-discord-text hover:bg-discord-card/60 font-normal'
                }`}
              >
                <md-ripple />
                <md-icon class={`text-lg relative z-10 ${isActive ? 'text-discord-blurple' : 'text-discord-muted'}`}>
                  {item.icon}
                </md-icon>
                <span className="relative z-10 truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Categorized Sections (Only Real Bot Features) */}
        {sectionGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-1">
            <div className="px-3 pb-1 text-[11px] font-normal tracking-wider uppercase text-discord-muted/80">
              {group.title}
            </div>
            {group.items.map((item) => {
              const isActive = checkActive(item);
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`relative overflow-hidden flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs no-underline transition-colors ${
                    isActive
                      ? 'bg-discord-active text-discord-white font-normal'
                      : 'text-discord-muted hover:text-discord-text hover:bg-discord-card/60 font-normal'
                  }`}
                >
                  <md-ripple />
                  <md-icon class={`text-lg relative z-10 ${isActive ? 'text-discord-blurple' : 'text-discord-muted'}`}>
                    {item.icon}
                  </md-icon>
                  <span className="relative z-10 truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
};

export interface CommandSearchModalProps {
  open: boolean;
  onClose: () => void;
  guildId?: string;
}

export const CommandSearchModal: React.FC<CommandSearchModalProps> = ({ open, onClose, guildId }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  const groupedSearchSections = useMemo(() => {
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

  return (
    <MdDialog open={open} onClose={onClose} headline="Quick Navigation">
      <div className="flex flex-col gap-4">
        <MdTextField
          label="Search"
          value={searchQuery}
          onChange={setSearchQuery}
          debounceMs={250}
          icon="search"
          placeholder="Find modules, channels, roles, voice hubs..."
        />
        <div className="command-palette-scroll h-[316px] max-h-[316px] overflow-y-auto">
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
        </div>
      </div>
    </MdDialog>
  );
};

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface EmbedData {
  title?: string;
  description?: string;
  url?: string;
  color?: string;
  authorName?: string;
  authorIcon?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  footerText?: string;
  footerIcon?: string;
  timestamp?: boolean;
  fields?: EmbedField[];
}

export const DiscordEmbedPreview: React.FC<{ content?: string; embed: EmbedData }> = ({ content, embed }) => {
  return (
    <div className="bg-discord-sidebar rounded-xl p-4 font-sans text-discord-text border border-discord-border">
      {/* Simulated Bot Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center font-normal text-discord-white text-xs">
          A
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-normal text-xs text-discord-white">ArchiBot</span>
            <span className="bg-discord-blurple text-discord-white text-xs font-normal px-1.5 py-0.5 rounded">
              APP
            </span>
            <span className="text-xs text-discord-muted ml-1 font-normal">Today at 12:00 PM</span>
          </div>
        </div>
      </div>

      {/* Plain message content */}
      {content && <div className="mb-2 pl-10 text-xs font-normal text-discord-text whitespace-pre-wrap">{content}</div>}

      {/* Embed Box */}
      <div
        className="ml-10 bg-discord-card rounded border-l-4 p-3.5 max-w-lg"
        style={{ borderLeftColor: embed.color || '#5865F2' }}
      >
        <div className="flex justify-between gap-4">
          <div className="flex-1 min-w-0">
            {embed.authorName && (
              <div className="flex items-center gap-2 mb-2">
                {embed.authorIcon && (
                  <img src={embed.authorIcon} alt="" className="w-5 h-5 rounded-full object-cover" />
                )}
                <span className="text-xs font-normal text-discord-white">{embed.authorName}</span>
              </div>
            )}

            {embed.title && (
              <div className="text-xs font-normal text-discord-white mb-1.5 break-words">{embed.title}</div>
            )}

            {embed.description && (
              <div className="text-xs text-discord-text/90 whitespace-pre-wrap leading-relaxed mb-3 break-words font-normal">
                {embed.description}
              </div>
            )}

            {embed.fields && embed.fields.length > 0 && (
              <div className="grid grid-cols-12 gap-3 mb-3">
                {embed.fields.map((f, idx) => (
                  <div key={idx} className={f.inline ? 'col-span-4' : 'col-span-12'}>
                    <div className="text-xs font-normal text-discord-white mb-1">{f.name || '\u200b'}</div>
                    <div className="text-xs text-discord-muted whitespace-pre-wrap font-normal">{f.value || '\u200b'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {embed.thumbnailUrl && (
            <img src={embed.thumbnailUrl} alt="thumb" className="w-20 h-20 rounded-md object-cover shrink-0" />
          )}
        </div>

        {embed.imageUrl && (
          <img src={embed.imageUrl} alt="banner" className="w-full max-h-64 object-cover rounded-md mt-2" />
        )}

        {(embed.footerText || embed.timestamp) && (
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-discord-muted">
            {embed.footerIcon && <img src={embed.footerIcon} alt="" className="w-4 h-4 rounded-full" />}
            <span>
              {embed.footerText}
              {embed.footerText && embed.timestamp ? ' • ' : ''}
              {embed.timestamp ? new Date().toLocaleDateString() : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
