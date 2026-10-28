import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  MdButton,
  MdTextField,
  MdSelect,
  MdIconButton,
  MdLoading,
  MdIcon,
  Badge,
  StatusBadge,
  MdDialog,
  MdTabs,
  PageHeader,
  SurfaceCard,
  EmptyState,
} from '../components/ui';
import { MemberItem, RoleItem } from '../types/api';
import { useServerSwitch } from '../components/layout';

export const MembersPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [tabIndex, setTabIndex] = useState(0);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const { registerServerFetch } = useServerSwitch();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [bans, setBans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');

  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [memberRoleIds, setMemberRoleIds] = useState<string[]>([]);
  const [manageLoading, setManageLoading] = useState(false);

  const [timeoutMember, setTimeoutMember] = useState<MemberItem | null>(null);
  const [timeoutDuration, setTimeoutDuration] = useState('300');
  const [timeoutReason, setTimeoutReason] = useState('');

  const [warnMember, setWarnMember] = useState<MemberItem | null>(null);
  const [warnReason, setWarnReason] = useState('');

  const [kickMember, setKickMember] = useState<MemberItem | null>(null);
  const [kickReason, setKickReason] = useState('');
  const [banMember, setBanMember] = useState<MemberItem | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDays, setBanDays] = useState('0');

  const fetchMembers = () => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (selectedRoleFilter) params.set('roleId', selectedRoleFilter);

    setLoading(true);
    const p = fetch(`/api/guilds/${guildId}/members?${params.toString()}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.members) setMembers(data.members);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    registerServerFetch(p);
  };

  const fetchRoles = () => {
    fetch(`/api/guilds/${guildId}/roles`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.roles) setRoles(data.roles);
      });
  };

  const fetchBans = () => {
    fetch(`/api/guilds/${guildId}/bans`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.bans) setBans(data.bans);
      });
  };

  useEffect(() => {
    fetchMembers();
    fetchRoles();
    fetchBans();
  }, [guildId, search, selectedRoleFilter]);

  const handleSaveMember = async () => {
    if (!selectedMember) return;
    setManageLoading(true);

    const initialRoleIds = new Set(selectedMember.roles.map((r) => r.id));
    const addRoles = memberRoleIds.filter((id) => !initialRoleIds.has(id));
    const removeRoles = [...initialRoleIds].filter((id) => !memberRoleIds.includes(id));

    try {
      const res = await fetch(`/api/guilds/${guildId}/members/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nickname: editNickname,
          addRoles,
          removeRoles,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedMember(null);
        fetchMembers();
      } else {
        alert(data.error || 'Failed to update member');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setManageLoading(false);
    }
  };

  const handleTimeout = async () => {
    if (!timeoutMember) return;
    try {
      const res = await fetch(`/api/guilds/${guildId}/members/${timeoutMember.id}/timeout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          durationSeconds: timeoutDuration,
          reason: timeoutReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTimeoutMember(null);
        fetchMembers();
      } else {
        alert(data.error || 'Failed to timeout member');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleWarn = async () => {
    if (!warnMember || !warnReason.trim()) return;
    try {
      const res = await fetch(`/api/guilds/${guildId}/members/${warnMember.id}/warnings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: warnReason }),
      });
      const data = await res.json();
      if (data.success) {
        setWarnMember(null);
        setWarnReason('');
        fetchMembers();
      } else {
        alert(data.error || 'Failed to warn member');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleKick = async () => {
    if (!kickMember) return;
    try {
      const res = await fetch(`/api/guilds/${guildId}/members/${kickMember.id}/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: kickReason }),
      });
      const data = await res.json();
      if (data.success) {
        setKickMember(null);
        fetchMembers();
      } else {
        alert(data.error || 'Failed to kick member');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleBan = async () => {
    if (!banMember) return;
    try {
      const res = await fetch(`/api/guilds/${guildId}/members/${banMember.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          deleteMessageDays: banDays,
          reason: banReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBanMember(null);
        fetchMembers();
        fetchBans();
      } else {
        alert(data.error || 'Failed to ban member');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/bans/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) fetchBans();
      else alert(data.error || 'Failed to unban user');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading && members.length === 0) return <MdLoading />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        category="SERVER MANAGEMENT"
        title="Members & Moderation"
        description="Search members, assign roles, timeout, warn, kick, ban, and inspect punishment records."
      />

      <MdTabs
        activeIndex={tabIndex}
        onChange={setTabIndex}
        tabs={[
          { id: 'members', label: `Active Members (${members.length})`, icon: 'group' },
          { id: 'bans', label: `Banned Users (${bans.length})`, icon: 'block' },
        ]}
      />

      {tabIndex === 0 && (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <MdTextField
                label="Search members"
                value={search}
                onChange={setSearch}
                debounceMs={250}
                placeholder="Search username, nickname, or ID"
              />
            </div>
            <div className="w-56">
              <MdSelect
                label="Filter by Role"
                value={selectedRoleFilter}
                onChange={setSelectedRoleFilter}
                options={[{ value: '', label: 'All Roles' }, ...roles.map((r) => ({ value: r.id, label: r.name }))]}
              />
            </div>
          </div>

          <SurfaceCard noPadding>
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-discord-surface border-b border-discord-border text-discord-muted font-normal">
                  <th className="py-3 px-4 font-normal">User</th>
                  <th className="py-3 px-4 font-normal">Roles</th>
                  <th className="py-3 px-4 font-normal">Status</th>
                  <th className="py-3 px-4 text-right font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-discord-border last:border-b-0 bg-discord-card hover:bg-discord-card-hover transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.avatar}
                          alt={m.username}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div>
                          <div className="font-normal text-xs text-discord-text flex items-center gap-1.5">
                            <span>{m.displayName}</span>
                            {m.bot && <StatusBadge label="BOT" tone="blurple" />}
                            {m.isOwner && <StatusBadge label="Owner" tone="green" />}
                          </div>
                          <div className="text-xs text-discord-muted font-normal">
                            @{m.username} • {m.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {m.roles.map((r) => (
                          <StatusBadge key={r.id} label={r.name} tone="neutral" className="rounded-full" />
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        {m.timedOut && <StatusBadge label="Timed Out" tone="red" className="w-fit" />}
                        {m.warningsCount > 0 && (
                          <StatusBadge label={`${m.warningsCount} warnings`} tone="yellow" className="w-fit" />
                        )}
                        {!m.timedOut && m.warningsCount === 0 && (
                          <span className="text-xs text-discord-green font-normal">Clear</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-0.5">
                        <MdIconButton
                          icon="manage_accounts"
                          title="Manage Roles & Nickname"
                          onClick={() => {
                            setSelectedMember(m);
                            setEditNickname(m.displayName !== m.username ? m.displayName : '');
                            setMemberRoleIds(m.roles.map((r) => r.id));
                          }}
                        />
                        <MdIconButton
                          icon="timer"
                          title="Timeout (Mute)"
                          disabled={!m.moderatable}
                          onClick={() => {
                            setTimeoutMember(m);
                            setTimeoutReason('');
                          }}
                        />
                        <MdIconButton
                          icon="warning"
                          title="Issue Warning"
                          onClick={() => {
                            setWarnMember(m);
                            setWarnReason('');
                          }}
                        />
                        <MdIconButton
                          icon="person_remove"
                          title="Kick Member"
                          disabled={!m.manageable}
                          onClick={() => {
                            setKickMember(m);
                            setKickReason('');
                          }}
                        />
                        <MdIconButton
                          icon="block"
                          title="Ban Member"
                          disabled={!m.moderatable && !m.manageable}
                          onClick={() => {
                            setBanMember(m);
                            setBanReason('');
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SurfaceCard>
        </>
      )}

      {tabIndex === 1 && (
        <SurfaceCard className="p-4">
          <h3 className="text-xs font-normal text-discord-white mb-4">Server Bans ({bans.length})</h3>
          {bans.length === 0 ? (
            <EmptyState
              icon="verified_user"
              description="No members are currently banned on this server."
              className="py-6"
            />
          ) : (
            <div className="flex flex-col gap-2">
              {bans.map((b) => (
                <div
                  key={b.userId}
                  className="flex items-center justify-between px-4 py-2.5 bg-discord-surface border border-discord-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <img src={b.avatar} alt={b.username} className="w-8 h-8 rounded-full" />
                    <div>
                      <div className="font-normal text-xs text-discord-text">{b.username}</div>
                      <div className="text-xs text-discord-muted font-normal">Reason: {b.reason}</div>
                    </div>
                  </div>
                  <MdButton variant="tonal" onClick={() => handleUnban(b.userId)}>
                    Unban
                  </MdButton>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      )}

      <MdDialog
        open={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        headline={`Manage ${selectedMember?.displayName}`}
        actions={
          <>
            <MdButton variant="text" onClick={() => setSelectedMember(null)}>
              Cancel
            </MdButton>
            <MdButton variant="filled" onClick={handleSaveMember} disabled={manageLoading}>
              {manageLoading ? 'Saving...' : 'Save Changes'}
            </MdButton>
          </>
        }
      >
        <MdTextField
          label="Server Nickname"
          value={editNickname}
          onChange={setEditNickname}
          placeholder="Leave blank to reset"
        />

        <div className="mt-2">
          <h4 className="text-xs font-normal text-discord-white mb-2">Assign / Remove Roles</h4>
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
            {roles
              .filter((r) => !r.isEveryone && r.editable)
              .map((r) => {
                const assigned = memberRoleIds.includes(r.id);
                return (
                  <div
                    key={r.id}
                    onClick={() => {
                      if (assigned) setMemberRoleIds((prev) => prev.filter((id) => id !== r.id));
                      else setMemberRoleIds((prev) => [...prev, r.id]);
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer border transition-colors ${
                      assigned
                        ? 'bg-discord-active border-discord-blurple/40 text-discord-white'
                        : 'bg-discord-surface border-discord-border text-discord-muted'
                    }`}
                  >
                    <span className="font-normal text-xs">{r.name}</span>
                    <MdIcon
                      name={assigned ? 'check_box' : 'check_box_outline_blank'}
                      className={`text-base ${assigned ? 'text-discord-blurple' : 'text-discord-muted'}`}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </MdDialog>

      <MdDialog
        open={Boolean(timeoutMember)}
        onClose={() => setTimeoutMember(null)}
        headline={`Timeout @${timeoutMember?.username}`}
        actions={
          <>
            <MdButton variant="text" onClick={() => setTimeoutMember(null)}>
              Cancel
            </MdButton>
            <MdButton variant="filled" onClick={handleTimeout}>
              Apply Timeout
            </MdButton>
          </>
        }
      >
        <MdSelect
          label="Duration"
          value={timeoutDuration}
          onChange={setTimeoutDuration}
          options={[
            { value: '60', label: '60 Seconds' },
            { value: '300', label: '5 Minutes' },
            { value: '600', label: '10 Minutes' },
            { value: '3600', label: '1 Hour' },
            { value: '86400', label: '1 Day' },
            { value: '604800', label: '1 Week' },
            { value: '0', label: 'Remove Timeout (Unmute)' },
          ]}
        />
        <MdTextField
          label="Reason (Audit Log)"
          value={timeoutReason}
          onChange={setTimeoutReason}
          placeholder="e.g. Spamming in chat"
        />
      </MdDialog>

      <MdDialog
        open={Boolean(warnMember)}
        onClose={() => setWarnMember(null)}
        headline={`Warn @${warnMember?.username}`}
        actions={
          <>
            <MdButton variant="text" onClick={() => setWarnMember(null)}>
              Cancel
            </MdButton>
            <MdButton variant="filled" onClick={handleWarn} disabled={!warnReason.trim()}>
              Issue Warning
            </MdButton>
          </>
        }
      >
        <MdTextField
          label="Warning Reason"
          value={warnReason}
          onChange={setWarnReason}
          placeholder="e.g. Breaking rules in general chat"
          required
        />
      </MdDialog>

      <MdDialog
        open={Boolean(kickMember)}
        onClose={() => setKickMember(null)}
        headline={`Kick @${kickMember?.username}`}
        actions={
          <>
            <MdButton variant="text" onClick={() => setKickMember(null)}>
              Cancel
            </MdButton>
            <MdButton variant="danger" onClick={handleKick}>
              Kick Member
            </MdButton>
          </>
        }
      >
        <p className="text-discord-muted text-xs font-normal">
          This will kick the member from the server. They can rejoin with an invite link.
        </p>
        <MdTextField
          label="Kick Reason (Optional)"
          value={kickReason}
          onChange={setKickReason}
          placeholder="Reason for audit log"
        />
      </MdDialog>

      <MdDialog
        open={Boolean(banMember)}
        onClose={() => setBanMember(null)}
        headline={`Ban @${banMember?.username}`}
        actions={
          <>
            <MdButton variant="text" onClick={() => setBanMember(null)}>
              Cancel
            </MdButton>
            <MdButton variant="danger" onClick={handleBan}>
              Ban User
            </MdButton>
          </>
        }
      >
        <p className="text-discord-red text-xs font-normal">
          This will permanently ban the user from the server.
        </p>
        <MdSelect
          label="Delete Message History"
          value={banDays}
          onChange={setBanDays}
          options={[
            { value: '0', label: "Don't delete any messages" },
            { value: '1', label: 'Previous 24 Hours' },
            { value: '7', label: 'Previous 7 Days' },
          ]}
        />
        <MdTextField
          label="Ban Reason (Optional)"
          value={banReason}
          onChange={setBanReason}
          placeholder="Reason for audit log"
        />
      </MdDialog>
    </div>
  );
};
