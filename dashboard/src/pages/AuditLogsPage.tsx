import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  EmptyState,
  MdButton,
  MdIcon,
  MdTextField,
  PageHeader,
  SettingsSkeleton,
  SurfaceCard,
  toast,
} from '../components/ui';
import { useServerSwitch } from '../components/layout';

interface AuditLogEntry {
  id: string;
  action: string;
  reason?: string;
  createdAt: string;
  executor?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export const AuditLogsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const { registerServerFetch } = useServerSwitch();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = (isRefresh = false) => {
    if (!guildId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

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
        setRefreshing(false);
      });

    registerServerFetch(p);
  };

  useEffect(() => {
    fetchLogs(false);
  }, [guildId]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return auditLogs;
    const q = searchQuery.toLowerCase().trim();
    return auditLogs.filter((log) => {
      const exec = log.executor?.username?.toLowerCase() || '';
      const act = log.action?.toLowerCase() || '';
      const rsn = log.reason?.toLowerCase() || '';
      return exec.includes(q) || act.includes(q) || rsn.includes(q);
    });
  }, [auditLogs, searchQuery]);

  if (loading && auditLogs.length === 0) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl pb-16">
      <PageHeader
        title="Discord Audit Logs"
        description="View recent administrative events, moderation logs, and role changes recorded by Discord."
        actions={
          <MdButton
            variant="tonal"
            icon="refresh"
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Logs'}
          </MdButton>
        }
      />

      <SurfaceCard
        title={`Audit History (${filteredLogs.length})`}
        subtitle="Recent administrative actions taken within this Discord server."
        className="flex flex-col gap-4"
      >
        <div className="max-w-md">
          <MdTextField
            label="Search audit logs..."
            value={searchQuery}
            onChange={setSearchQuery}
            debounceMs={250}
            icon="search"
            placeholder="Filter by executor, action, or reason"
          />
        </div>

        {filteredLogs.length === 0 ? (
          <EmptyState
            icon="history"
            title="No audit log entries found"
            description={
              searchQuery
                ? 'No log entries matched your search filter.'
                : 'Discord has not recorded recent audit events or bot lacks View Audit Log permission.'
            }
            className="py-10"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-discord-surface border border-discord-border hover:border-discord-border-hover transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {log.executor?.avatar ? (
                    <img
                      src={log.executor.avatar}
                      alt={log.executor.username}
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-discord-border"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-discord-card flex items-center justify-center shrink-0 border border-discord-border text-discord-muted">
                      <MdIcon name="person" className="text-lg" />
                    </div>
                  )}

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-normal text-discord-white truncate">
                        {log.executor?.username || 'System'}
                      </span>
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-discord-card border border-discord-border text-discord-blurple">
                        {log.action}
                      </span>
                    </div>

                    {log.reason ? (
                      <span className="text-xs font-normal text-discord-muted truncate mt-0.5">
                        Reason: {log.reason}
                      </span>
                    ) : (
                      <span className="text-xs font-normal text-discord-muted/60 mt-0.5 italic">
                        No reason provided
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs font-normal text-discord-muted shrink-0 text-left sm:text-right">
                  {new Date(log.createdAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
};
