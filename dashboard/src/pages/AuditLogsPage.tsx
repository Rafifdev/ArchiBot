import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  BadgeTone,
  EmptyState,
  MdButton,
  MdChip,
  MdDivider,
  MdIcon,
  MdTextField,
  PageHeader,
  SettingsSkeleton,
  StatusBadge,
  SurfaceCard,
  toast,
} from '../components/ui';
import { useServerSwitch } from '../components/layout';

interface AuditLogEntry {
  id: string;
  action: string | number;
  actionType?: string;
  reason?: string;
  createdAt: string;
  targetId?: string;
  executor?: {
    id: string;
    username: string;
    avatar?: string;
  } | null;
}

type AuditFilterCategory = 'all' | 'moderation' | 'channels' | 'roles';

function formatActionLabel(rawAction: string | number): string {
  if (typeof rawAction === 'number') {
    switch (rawAction) {
      case 1:
        return 'Server Updated';
      case 10:
        return 'Channel Created';
      case 11:
        return 'Channel Updated';
      case 12:
        return 'Channel Deleted';
      case 20:
        return 'Member Role Updated';
      case 22:
        return 'Member Kicked';
      case 23:
        return 'Members Pruned';
      case 24:
        return 'Member Banned';
      case 25:
        return 'Member Unbanned';
      case 26:
        return 'Member Updated';
      case 30:
        return 'Role Created';
      case 31:
        return 'Role Updated';
      case 32:
        return 'Role Deleted';
      case 40:
        return 'Invite Created';
      case 41:
        return 'Invite Updated';
      case 42:
        return 'Invite Deleted';
      case 50:
        return 'Webhook Created';
      case 72:
        return 'Message Deleted';
      case 73:
        return 'Messages Bulk Deleted';
      default:
        return `Action #${rawAction}`;
    }
  }

  const str = String(rawAction || 'Action');
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getActionTone(action: string | number): BadgeTone {
  const str = String(action).toLowerCase();
  if (
    str.includes('ban') ||
    str.includes('kick') ||
    str.includes('delete') ||
    str.includes('remove') ||
    str.includes('prune')
  ) {
    return 'red';
  }
  if (str.includes('create') || str.includes('add')) {
    return 'green';
  }
  if (str.includes('update') || str.includes('edit')) {
    return 'blurple';
  }
  return 'neutral';
}

function getActionCategory(action: string | number): 'moderation' | 'channels' | 'roles' | 'other' {
  const str = String(action).toLowerCase();
  if (
    str.includes('ban') ||
    str.includes('kick') ||
    str.includes('timeout') ||
    str.includes('prune') ||
    action === 22 ||
    action === 23 ||
    action === 24 ||
    action === 25
  ) {
    return 'moderation';
  }
  if (str.includes('channel') || (typeof action === 'number' && action >= 10 && action <= 12)) {
    return 'channels';
  }
  if (str.includes('role') || (typeof action === 'number' && (action === 20 || (action >= 30 && action <= 32)))) {
    return 'roles';
  }
  return 'other';
}

function formatRelativeTime(isoDate: string): string {
  const target = new Date(isoDate).getTime();
  if (Number.isNaN(target)) return '—';
  const diffMs = Date.now() - target;
  const absMins = Math.round(Math.abs(diffMs) / 60_000);

  if (absMins < 1) return 'Just now';
  if (absMins < 60) return `${absMins}m ago`;
  const hours = Math.round(absMins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

const ITEMS_PER_PAGE = 10;

export const AuditLogsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const { registerServerFetch } = useServerSwitch();

  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AuditFilterCategory>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = () => {
    if (!guildId) return;
    setLoading(true);

    const p = fetch(`/api/guilds/${guildId}/audit`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.logs) {
          setAuditLogs(data.logs);
        } else if (data.error) {
          toast.error(data.error);
        }
      })
      .catch((err) => {
        toast.error(`Failed to load audit logs: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });

    registerServerFetch(p);
  };

  useEffect(() => {
    fetchLogs();
  }, [guildId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  // Statistics for KPI Cards
  const stats = useMemo(() => {
    let moderation = 0;
    let channelEdits = 0;
    let roleEdits = 0;
    const executors = new Set<string>();

    for (const log of auditLogs) {
      const cat = getActionCategory(log.action);
      if (cat === 'moderation') moderation += 1;
      if (cat === 'channels') channelEdits += 1;
      if (cat === 'roles') roleEdits += 1;
      executors.add(log.executor?.username || 'System');
    }

    return {
      total: auditLogs.length,
      moderation,
      channelAndRoles: channelEdits + roleEdits,
      executorsCount: executors.size,
    };
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return auditLogs.filter((log) => {
      if (categoryFilter !== 'all') {
        const cat = getActionCategory(log.action);
        if (cat !== categoryFilter) return false;
      }
      if (!q) return true;
      const exec = log.executor?.username?.toLowerCase() || '';
      const act = formatActionLabel(log.action).toLowerCase();
      const rsn = log.reason?.toLowerCase() || '';
      return exec.includes(q) || act.includes(q) || rsn.includes(q);
    });
  }, [auditLogs, searchQuery, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const startIndex = filteredLogs.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length);

  if (loading && auditLogs.length === 0) {
    return <SettingsSkeleton />;
  }

  const kpiCards = [
    {
      icon: 'history',
      label: 'TOTAL LOGS',
      value: stats.total,
      subtext: 'Recent audit entries fetched',
    },
    {
      icon: 'shield',
      label: 'MODERATION ACTIONS',
      value: stats.moderation,
      subtext: 'Bans, kicks, and timeouts',
    },
    {
      icon: 'tune',
      label: 'CHANNEL & ROLE EDITS',
      value: stats.channelAndRoles,
      subtext: 'Structural modifications',
    },
    {
      icon: 'manage_accounts',
      label: 'ACTIVE EXECUTORS',
      value: stats.executorsCount,
      subtext: 'Staff members and bots',
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* 1. Standardized PageHeader Molecule */}
      <PageHeader
        category="SERVER MANAGEMENT"
        title="Discord Audit Logs"
        description="Inspect administrative operations, moderation enforcements, and structural modifications recorded by Discord."
      />

      {/* 2. Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <SurfaceCard key={kpi.label} className="flex flex-col justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-discord-surface border border-discord-border flex items-center justify-center text-discord-muted shrink-0">
                <MdIcon name={kpi.icon} className="text-lg text-discord-muted" />
              </div>
              <span className="text-xs font-normal text-discord-muted truncate">
                {kpi.label}
              </span>
            </div>

            <div className="text-xl font-normal text-discord-white mt-3.5 tracking-tight">
              {kpi.value}
            </div>

            <div className="text-xs font-normal text-discord-muted mt-1 truncate">
              {kpi.subtext}
            </div>
          </SurfaceCard>
        ))}
      </div>

      {/* 3. Audit Log Filter & Entry List Card */}
      <SurfaceCard
        title={`Audit History (${filteredLogs.length})`}
        subtitle="Chronological list of administrative actions with executor details and reasons."
        className="flex flex-col gap-4"
      >
        {/* Search & Filter Chips Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <MdChip
              label={`All (${stats.total})`}
              selected={categoryFilter === 'all'}
              onClick={() => setCategoryFilter('all')}
            />
            <MdChip
              label={`Moderation (${stats.moderation})`}
              selected={categoryFilter === 'moderation'}
              onClick={() => setCategoryFilter('moderation')}
            />
            <MdChip
              label="Channels"
              selected={categoryFilter === 'channels'}
              onClick={() => setCategoryFilter('channels')}
            />
            <MdChip
              label="Roles"
              selected={categoryFilter === 'roles'}
              onClick={() => setCategoryFilter('roles')}
            />
          </div>

          <div className="w-full md:w-80">
            <MdTextField
              label="Search audit logs..."
              placeholder="Filter by executor, action, or reason..."
              value={searchQuery}
              onChange={setSearchQuery}
              debounceMs={250}
              icon="search"
              compact
            />
          </div>
        </div>

        <MdDivider />

        {/* Audit Log Entries or Empty State */}
        {filteredLogs.length === 0 ? (
          <EmptyState
            icon="history"
            title="No audit log entries found"
            description={
              searchQuery || categoryFilter !== 'all'
                ? 'No log entries match your selected filter. Try clearing the search or switching categories.'
                : 'Discord has not recorded recent audit events or the bot lacks the View Audit Log permission.'
            }
            className="py-12"
          />
        ) : (
          <div className="flex flex-col">
            {paginatedLogs.map((log, idx) => {
              const actionLabel = formatActionLabel(log.action);
              const actionTone = getActionTone(log.action);
              const executorName = log.executor?.username || 'System / Discord';

              return (
                <React.Fragment key={log.id}>
                  {idx > 0 && <MdDivider />}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 px-1">
                    {/* Left: Avatar + Details */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {log.executor?.avatar ? (
                        <img
                          src={log.executor.avatar}
                          alt={executorName}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-discord-border mt-0.5"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-discord-surface border border-discord-border flex items-center justify-center shrink-0 text-discord-muted mt-0.5">
                          <MdIcon name="person" className="text-lg" />
                        </div>
                      )}

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-normal text-discord-white truncate">
                            {executorName}
                          </span>
                          <StatusBadge
                            size="sm"
                            tone={actionTone}
                            label={actionLabel}
                          />
                          <span className="text-[11px] font-normal text-discord-muted">
                            #{log.id.slice(-6)}
                          </span>
                        </div>

                        {log.reason && log.reason !== 'No reason provided' ? (
                          <span className="text-xs font-normal text-discord-muted truncate mt-1">
                            Reason: {log.reason}
                          </span>
                        ) : (
                          <span className="text-xs font-normal text-discord-muted/60 mt-1 italic">
                            No specific reason provided
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Timestamp */}
                    <div className="text-xs font-normal text-discord-muted shrink-0 text-left sm:text-right pl-12 sm:pl-0">
                      <div>{formatRelativeTime(log.createdAt)}</div>
                      <div className="text-[11px] text-discord-muted/70 mt-0.5">
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {filteredLogs.length > 0 && (
          <>
            <MdDivider />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs font-normal text-discord-muted">
              <span>
                Showing <span className="text-discord-white font-normal">{startIndex}-{endIndex}</span> of{' '}
                <span className="text-discord-white font-normal">{filteredLogs.length}</span> entries
              </span>

              <div className="flex items-center gap-2">
                <MdButton
                  variant="tonal"
                  size="sm"
                  icon="chevron_left"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </MdButton>

                <span className="px-2 py-1 text-xs font-normal text-discord-white select-none">
                  Page {currentPage} of {totalPages}
                </span>

                <MdButton
                  variant="tonal"
                  size="sm"
                  icon="chevron_right"
                  iconTrailing
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </MdButton>
              </div>
            </div>
          </>
        )}
      </SurfaceCard>
    </div>
  );
};
