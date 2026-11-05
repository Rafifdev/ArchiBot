import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  MdButton,
  MdTextField,
  MdIconButton,
  RolesSkeleton,
  MdSelect,
  MdIcon,
  Badge,
  StatusBadge,
  MdDialog,
  ConfirmDialog,
  PageHeader,
  SurfaceCard,
  SwitchRow,
  ColorPickerField,
  toast,
} from '../components/ui';
import { RoleItem } from '../types/api';
import { useServerSwitch } from '../components/layout';

const PERMISSION_GROUPS = [
  {
    category: 'General Server Permissions',
    perms: [
      { key: 'Administrator', label: 'Administrator', danger: true },
      { key: 'ManageGuild', label: 'Manage Server' },
      { key: 'ManageRoles', label: 'Manage Roles' },
      { key: 'ManageChannels', label: 'Manage Channels' },
      { key: 'ViewAuditLog', label: 'View Audit Log' },
    ],
  },
  {
    category: 'Membership & Moderation',
    perms: [
      { key: 'KickMembers', label: 'Kick Members', danger: true },
      { key: 'BanMembers', label: 'Ban Members', danger: true },
      { key: 'ModerateMembers', label: 'Timeout Members' },
      { key: 'ChangeNickname', label: 'Change Nickname' },
      { key: 'ManageNicknames', label: 'Manage Nicknames' },
    ],
  },
  {
    category: 'Text Channel Permissions',
    perms: [
      { key: 'SendMessages', label: 'Send Messages' },
      { key: 'EmbedLinks', label: 'Embed Links' },
      { key: 'AttachFiles', label: 'Attach Files' },
      { key: 'AddReactions', label: 'Add Reactions' },
      { key: 'MentionEveryone', label: 'Mention @everyone', danger: true },
      { key: 'ManageMessages', label: 'Manage Messages' },
      { key: 'ReadMessageHistory', label: 'Read Message History' },
    ],
  },
  {
    category: 'Voice Channel Permissions',
    perms: [
      { key: 'Connect', label: 'Connect to Voice' },
      { key: 'Speak', label: 'Speak in Voice' },
      { key: 'Stream', label: 'Video / Screen Share' },
      { key: 'MuteMembers', label: 'Mute Members' },
      { key: 'DeafenMembers', label: 'Deafen Members' },
      { key: 'MoveMembers', label: 'Move Members' },
    ],
  },
];

const PermissionsMatrix: React.FC<{
  permissions: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
  disabled?: boolean;
}> = ({ permissions, onChange, disabled }) => (
  <div className="flex flex-col gap-2 pt-2 border-t border-discord-border">
    <div className="flex items-center justify-between">
      <h4 className="text-xs font-normal text-discord-white">Permissions Matrix</h4>
      <span className="text-[11px] text-discord-muted">{permissions.length} active</span>
    </div>

    <div className="flex flex-col gap-3.5 max-h-64 overflow-y-auto pr-1 rounded-xl bg-discord-surface/40 p-3 border border-discord-border">
      {PERMISSION_GROUPS.map((group, gIdx) => (
        <div key={gIdx} className="flex flex-col gap-1.5">
          <span className="text-[10px] text-discord-blurple font-normal uppercase tracking-wider">
            {group.category}
          </span>
          {group.perms.map((p) => {
            const active = permissions.includes(p.key);
            return (
              <SwitchRow
                key={p.key}
                label={p.label}
                danger={p.danger}
                boxed
                className="px-3 py-1.5"
                checked={active}
                disabled={disabled}
                onChange={(checked) => {
                  if (checked) onChange((prev) => [...prev, p.key]);
                  else onChange((prev) => prev.filter((k) => k !== p.key));
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  </div>
);

export const RolesPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const { registerServerFetch } = useServerSwitch();
  const [autoRoles, setAutoRoles] = useState<{ memberRoleId: string | null; verifiedRoleId: string | null }>({
    memberRoleId: null,
    verifiedRoleId: null,
  });
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createColor, setCreateColor] = useState('#5865F2');
  const [createHoist, setCreateHoist] = useState(false);
  const [createMentionable, setCreateMentionable] = useState(false);
  const [createPermissions, setCreatePermissions] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);

  const [editRole, setEditRole] = useState<RoleItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#5865F2');
  const [editHoist, setEditHoist] = useState(false);
  const [editMentionable, setEditMentionable] = useState(false);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteRole, setDeleteRole] = useState<RoleItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchRoles = () => {
    setLoading(true);
    const p = fetch(`/api/guilds/${guildId}/roles`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.roles) setRoles(data.roles);
        if (data.autoRoles) setAutoRoles(data.autoRoles);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    registerServerFetch(p);
  };

  useEffect(() => {
    fetchRoles();
  }, [guildId]);

  const autoRoleOptions = useMemo(
    () => [
      { value: '', label: 'None' },
      ...roles
        .filter((r) => !r.isEveryone)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
        .map((r) => ({ value: r.id, label: r.name })),
    ],
    [roles]
  );

  const handleCreateRole = async () => {
    if (!createName.trim()) return;
    setCreateLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: createName,
          color: createColor,
          hoist: createHoist,
          mentionable: createMentionable,
          permissions: createPermissions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateOpen(false);
        setCreateName('');
        setCreateColor('#5865F2');
        setCreateHoist(false);
        setCreateMentionable(false);
        setCreatePermissions([]);
        fetchRoles();
        toast.success(`Role "${createName}" created successfully.`);
      } else {
        toast.error(data.error || 'Failed to create role');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditRole = async () => {
    if (!editRole) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/roles/${editRole.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editName,
          color: editColor,
          hoist: editHoist,
          mentionable: editMentionable,
          permissions: editPermissions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditRole(null);
        fetchRoles();
        toast.success(`Role "${editName}" updated successfully.`);
      } else {
        toast.error(data.error || 'Failed to update role');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteRole) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/roles/${deleteRole.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteRole(null);
        fetchRoles();
        toast.success(`Role "${deleteRole.name}" deleted successfully.`);
      } else {
        toast.error(data.error || 'Failed to delete role');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveAutoRoles = async (memberRoleId: string, verifiedRoleId: string) => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/auto-roles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ memberRoleId, verifiedRoleId }),
      });
      const data = await res.json();
      if (data.success) {
        setAutoRoles({ memberRoleId, verifiedRoleId });
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading && roles.length === 0) return <RolesSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        category="SERVER MANAGEMENT"
        title="Roles & Permissions"
        description="Inspect role hierarchy, customize colors, toggle permissions matrix, and configure auto-roles."
        actions={
          <MdButton
            variant="filled"
            icon="add"
            onClick={() => {
              setCreateName('');
              setCreateColor('#5865F2');
              setCreateHoist(false);
              setCreateMentionable(false);
              setCreatePermissions([]);
              setCreateOpen(true);
            }}
          >
            Create Role
          </MdButton>
        }
      />

      <SurfaceCard className="p-4 flex flex-col gap-3.5">
        <div className="flex items-center gap-2 text-discord-white">
          <MdIcon name="assignment_ind" className="text-xl text-discord-blurple shrink-0" />
          <h3 className="text-base font-normal text-discord-white">Automatic Role Assignment</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MdSelect
            label="Default Member Role (On Join)"
            value={autoRoles.memberRoleId || ''}
            onChange={(val) => handleSaveAutoRoles(val, autoRoles.verifiedRoleId || '')}
            options={autoRoleOptions}
          />
          <MdSelect
            label="Verified Role (After CAPTCHA)"
            value={autoRoles.verifiedRoleId || ''}
            onChange={(val) => handleSaveAutoRoles(autoRoles.memberRoleId || '', val)}
            options={autoRoleOptions}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-4">
        <h3 className="text-xs font-normal text-discord-muted uppercase tracking-wider mb-3">
          Server Role Hierarchy ({roles.length})
        </h3>

        <div className="flex flex-col gap-1.5">
          {roles.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between px-3.5 py-2.5 bg-discord-surface hover:bg-discord-card-hover border border-discord-border rounded-lg gap-3 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: r.color === '#000000' ? '#878C99' : r.color }}
                />
                <span className="font-normal text-xs text-discord-text truncate">{r.name}</span>

                <span className="text-xs text-discord-muted font-normal">{r.memberCount} members</span>

                {r.hoist && <StatusBadge label="Hoisted" tone="neutral" />}
                {r.permissions.includes('Administrator') && <StatusBadge label="Admin" tone="red" />}
                {!r.editable && !r.isEveryone && <StatusBadge label="Above Bot Role" tone="neutral" />}
              </div>

              <div className="flex items-center gap-1">
                <MdIconButton
                  icon="edit"
                  onClick={() => {
                    setEditRole(r);
                    setEditName(r.name);
                    setEditColor(r.color);
                    setEditHoist(r.hoist);
                    setEditMentionable(r.mentionable);
                    setEditPermissions([...r.permissions]);
                  }}
                  title={
                    r.isEveryone
                      ? 'Edit @everyone permissions'
                      : !r.editable
                      ? 'View Role (Position above bot)'
                      : 'Edit Role & Permissions Matrix'
                  }
                />
                {!r.isEveryone && !r.managed && (
                  <MdIconButton
                    icon="delete"
                    disabled={!r.editable}
                    onClick={() => setDeleteRole(r)}
                    title={!r.editable ? 'Cannot delete role above bot' : 'Delete Role'}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <MdDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        headline="Create New Role"
        actions={
          <>
            <MdButton variant="text" onClick={() => setCreateOpen(false)}>
              Cancel
            </MdButton>
            <MdButton variant="filled" onClick={handleCreateRole} disabled={createLoading || !createName.trim()}>
              {createLoading ? 'Creating...' : 'Create Role'}
            </MdButton>
          </>
        }
      >
        <MdTextField label="Role Name" value={createName} onChange={setCreateName} required />
        <ColorPickerField label="Hex Color" value={createColor} onChange={setCreateColor} />
        <SwitchRow
          boxed
          label="Display members separately (Hoist)"
          description="Shows members with this role in a separate list category"
          checked={createHoist}
          onChange={setCreateHoist}
        />
        <SwitchRow
          boxed
          label="Allow anyone to @mention this role"
          description="Allows all members to ping this role in chat"
          checked={createMentionable}
          onChange={setCreateMentionable}
        />
        <PermissionsMatrix permissions={createPermissions} onChange={setCreatePermissions} />
      </MdDialog>

      <MdDialog
        open={Boolean(editRole)}
        onClose={() => setEditRole(null)}
        headline={editRole?.isEveryone ? 'Edit @everyone Permissions' : `Edit Role: ${editRole?.name || ''}`}
        actions={
          <>
            <MdButton variant="text" onClick={() => setEditRole(null)} disabled={editLoading}>
              Cancel
            </MdButton>
            <MdButton
              variant="filled"
              onClick={handleEditRole}
              disabled={
                editLoading ||
                (!editRole?.isEveryone && !editName.trim()) ||
                (!editRole?.editable && !editRole?.isEveryone)
              }
            >
              {editLoading
                ? 'Saving...'
                : !editRole?.editable && !editRole?.isEveryone
                ? 'Locked (Above Bot Role)'
                : 'Save Changes'}
            </MdButton>
          </>
        }
      >
        {!editRole?.editable && !editRole?.isEveryone && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-discord-surface border border-discord-border text-discord-muted text-xs">
            <MdIcon name="lock" className="text-discord-red text-base shrink-0" />
            <span>Role ini memiliki posisi lebih tinggi dari role ArchiBot di Discord. Geser role ArchiBot ke atas role ini di <b>Discord Server Settings &gt; Roles</b> untuk mengizinkan perubahan.</span>
          </div>
        )}

        {!editRole?.isEveryone ? (
          <>
            <MdTextField
              label="Role Name"
              value={editName}
              onChange={setEditName}
              disabled={!editRole?.editable}
              required
            />
            <ColorPickerField
              label="Hex Color"
              value={editColor}
              onChange={setEditColor}
            />
            <SwitchRow
              boxed
              label="Display separately (Hoist)"
              description="Shows members with this role in a separate list category"
              checked={editHoist}
              onChange={setEditHoist}
              disabled={!editRole?.editable}
            />
            <SwitchRow
              boxed
              label="Allow anyone to @mention"
              description="Allows all members to ping this role in chat"
              checked={editMentionable}
              onChange={setEditMentionable}
              disabled={!editRole?.editable}
            />
          </>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-discord-surface border border-discord-border text-discord-muted text-xs">
            <MdIcon name="public" className="text-discord-blurple text-base shrink-0" />
            <span>Mengatur izin default untuk seluruh member di server Discord (@everyone).</span>
          </div>
        )}

        <PermissionsMatrix
          permissions={editPermissions}
          onChange={setEditPermissions}
          disabled={!editRole?.editable && !editRole?.isEveryone}
        />
      </MdDialog>

      <ConfirmDialog
        open={Boolean(deleteRole)}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${deleteRole?.name}"? This action cannot be undone.`}
        confirmLabel={deleteLoading ? 'Deleting...' : 'Delete Role'}
        danger
        loading={deleteLoading}
        onConfirm={handleDeleteRole}
        onClose={() => {
          if (!deleteLoading) setDeleteRole(null);
        }}
      />
    </div>
  );
};
