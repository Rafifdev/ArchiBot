import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  MdButton,
  MdTextField,
  MdSelect,
  MdIconButton,
  ChannelsSkeleton,
  MdIcon,
  Badge,
  StatusBadge,
  MdDialog,
  ConfirmDialog,
  PageHeader,
  SurfaceCard,
  SwitchRow,
} from '../components/ui';
import { ChannelItem } from '../types/api';
import { useServerSwitch } from '../components/layout';
import { useRealtime } from '../hooks/useRealtime';

export const ChannelsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { registerServerFetch } = useServerSwitch();
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('text');
  const [newParent, setNewParent] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newSlowmode, setNewSlowmode] = useState(0);
  const [newNsfw, setNewNsfw] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [editChannel, setEditChannel] = useState<ChannelItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editSlowmode, setEditSlowmode] = useState(0);
  const [editNsfw, setEditNsfw] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  const fetchChannels = () => {
    setLoading(true);
    const p = fetch(`/api/guilds/${guildId}/channels`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.channels) setChannels(data.channels);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    registerServerFetch(p);
  };

  useEffect(() => {
    fetchChannels();
  }, [guildId]);

  // Real-time WebSocket synchronization with Discord events
  const { connected: wsConnected } = useRealtime(
    guildId,
    useCallback(
      (msg) => {
        if (msg.event && msg.event.startsWith('CHANNEL_')) {
          // Refetch channels silently without full-page spinner flicker
          fetch(`/api/guilds/${guildId}/channels`, { credentials: 'include' })
            .then((r) => r.json())
            .then((data) => {
              if (data.channels) setChannels(data.channels);
            })
            .catch(() => {});
        }
      },
      [guildId]
    )
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreateLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newName,
          type: newType,
          parentId: newParent || null,
          topic: newTopic,
          rateLimitPerUser: newSlowmode,
          nsfw: newNsfw,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateOpen(false);
        setNewName('');
        setNewTopic('');
        fetchChannels();
      } else {
        alert(data.error || 'Failed to create channel');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editChannel) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/channels/${editChannel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editName,
          topic: editTopic,
          rateLimitPerUser: editSlowmode,
          nsfw: editNsfw,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditChannel(null);
        fetchChannels();
      } else {
        alert(data.error || 'Failed to update channel');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleLock = async (ch: ChannelItem) => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/channels/${ch.id}/lock`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) fetchChannels();
    } catch (err: any) {
      alert(`Lock error: ${err.message}`);
    }
  };

  const handleSyncPermissions = async (ch: ChannelItem) => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/channels/${ch.id}/sync`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) fetchChannels();
      else alert(data.error || 'Failed to sync');
    } catch (err: any) {
      alert(`Sync error: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/guilds/${guildId}/channels/${deleteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteId(null);
        fetchChannels();
      } else {
        alert(data.error || 'Failed to delete channel');
      }
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  if (loading && channels.length === 0) return <ChannelsSkeleton />;

  const filtered = channels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const categories = filtered.filter((c) => c.typeName === 'category');
  const categoryIds = new Set(categories.map((c) => c.id));
  const unparented = filtered.filter((c) => c.typeName !== 'category' && (!c.parentId || !categoryIds.has(c.parentId)));

  const categoryOptions = [
    { value: '', label: 'None (Root Level)' },
    ...channels.filter((c) => c.typeName === 'category').map((c) => ({ value: c.id, label: c.name })),
  ];

  const channelTypeIcon = (type: string, isAutoVoice: boolean) => {
    if (isAutoVoice) return 'add_circle';
    if (type === 'voice') return 'volume_up';
    if (type === 'stage') return 'podium';
    if (type === 'announcement') return 'campaign';
    if (type === 'forum') return 'forum';
    return 'tag';
  };

  const renderChannelRow = (ch: ChannelItem) => (
    <div
      key={ch.id}
      className="flex items-center justify-between px-3.5 py-2.5 bg-discord-surface hover:bg-discord-card-hover border border-discord-border rounded-lg mb-1.5 gap-3 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <MdIcon name={channelTypeIcon(ch.typeName, ch.isAutoVoiceHub)} className="text-xl text-discord-muted" />
        <span className="font-normal text-xs text-discord-text truncate">{ch.name}</span>

        {ch.isAutoVoiceHub && <StatusBadge label="Auto Voice" tone="blurple" />}
        {ch.isLocked && <StatusBadge label="Locked" tone="red" />}
        {ch.nsfw && <StatusBadge label="NSFW" tone="red" />}
        {ch.rateLimitPerUser > 0 && <StatusBadge label={`Slow ${ch.rateLimitPerUser}s`} tone="neutral" />}
      </div>

      <div className="flex items-center gap-1">
        <MdIconButton
          icon={ch.isLocked ? 'lock' : 'lock_open'}
          onClick={() => handleToggleLock(ch)}
          title={ch.isLocked ? 'Unlock Channel' : 'Lock Channel'}
        />
        {ch.parentId && (
          <MdIconButton icon="sync" onClick={() => handleSyncPermissions(ch)} title="Sync permissions with category" />
        )}
        <MdIconButton
          icon="edit"
          onClick={() => {
            setEditChannel(ch);
            setEditName(ch.name);
            setEditTopic(ch.topic || '');
            setEditSlowmode(ch.rateLimitPerUser);
            setEditNsfw(ch.nsfw);
          }}
          title="Edit Channel"
        />
        <MdIconButton
          icon="delete"
          onClick={() => {
            setDeleteId(ch.id);
            setDeleteName(ch.name);
          }}
          title="Delete Channel"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        category="SERVER MANAGEMENT"
        title="Channels & Categories"
        description="Organize categories, lock or unlock channels, and configure channel properties."
        actions={
          <>
            {wsConnected && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-discord-green/10 border border-discord-green/20 text-discord-green text-xs font-normal">
                <span className="w-2 h-2 rounded-full bg-discord-green animate-pulse" />
                <span>Live Sync</span>
              </div>
            )}
            <div className="w-56">
              <MdTextField
                label="Search channels"
                value={search}
                onChange={setSearch}
                debounceMs={250}
                placeholder="Filter by name"
              />
            </div>
            <MdButton variant="filled" icon="add" onClick={() => setCreateOpen(true)}>
              Create Channel
            </MdButton>
          </>
        }
      />

      {unparented.length > 0 && (
        <SurfaceCard className="p-4">
          <h3 className="text-xs font-normal text-discord-muted uppercase tracking-wider mb-3">
            Unparented Channels
          </h3>
          {unparented.map(renderChannelRow)}
        </SurfaceCard>
      )}

      {categories.map((cat) => {
        const children = filtered.filter((c) => c.parentId === cat.id);
        return (
          <SurfaceCard key={cat.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <MdIcon name="folder" className="text-xl text-discord-blurple" />
                <span className="font-normal text-xs text-discord-white uppercase tracking-wider">{cat.name}</span>
                <span className="text-xs text-discord-muted font-normal">({children.length})</span>
              </div>

              <div className="flex items-center gap-1">
                <MdIconButton
                  icon="add"
                  title="Add Channel to Category"
                  onClick={() => {
                    setNewParent(cat.id);
                    setCreateOpen(true);
                  }}
                />
                <MdIconButton
                  icon="delete"
                  title="Delete Category"
                  onClick={() => {
                    setDeleteId(cat.id);
                    setDeleteName(cat.name);
                  }}
                />
              </div>
            </div>

            {children.length === 0 ? (
              <div className="text-xs text-discord-muted font-normal px-3 py-2">
                No channels inside this category.
              </div>
            ) : (
              children.map(renderChannelRow)
            )}
          </SurfaceCard>
        );
      })}

      <MdDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        headline="Create New Channel or Category"
        actions={
          <>
            <MdButton variant="text" onClick={() => setCreateOpen(false)}>
              Cancel
            </MdButton>
            <MdButton variant="filled" onClick={handleCreate} disabled={createLoading || !newName.trim()}>
              {createLoading ? 'Creating...' : 'Create'}
            </MdButton>
          </>
        }
      >
        <MdTextField label="Channel Name" value={newName} onChange={setNewName} placeholder="e.g. general-chat" required />
        <MdSelect
          label="Channel Type"
          value={newType}
          onChange={setNewType}
          options={[
            { value: 'text', label: 'Text Channel' },
            { value: 'voice', label: 'Voice Channel' },
            { value: 'category', label: 'Category' },
            { value: 'announcement', label: 'Announcement Channel' },
            { value: 'autovoice', label: 'Join-to-Create Auto Voice Hub' },
            { value: 'readonly', label: 'Read-Only Info Channel' },
            { value: 'stage', label: 'Stage Room' },
          ]}
        />
        {newType !== 'category' && (
          <MdSelect label="Parent Category" value={newParent} onChange={setNewParent} options={categoryOptions} />
        )}
        {newType === 'text' && (
          <>
            <MdTextField label="Channel Topic" value={newTopic} onChange={setNewTopic} placeholder="Optional topic" />
            <MdSelect
              label="Slowmode"
              value={String(newSlowmode)}
              onChange={(val) => setNewSlowmode(Number(val))}
              options={[
                { value: '0', label: 'Off' },
                { value: '5', label: '5 seconds' },
                { value: '10', label: '10 seconds' },
                { value: '30', label: '30 seconds' },
                { value: '60', label: '1 minute' },
                { value: '300', label: '5 minutes' },
              ]}
            />
            <SwitchRow label="Age-Restricted (NSFW)" checked={newNsfw} onChange={setNewNsfw} />
          </>
        )}
      </MdDialog>

      <MdDialog
        open={Boolean(editChannel)}
        onClose={() => setEditChannel(null)}
        headline={`Edit #${editChannel?.name}`}
        actions={
          <>
            <MdButton variant="text" onClick={() => setEditChannel(null)}>
              Cancel
            </MdButton>
            <MdButton variant="filled" onClick={handleEdit} disabled={editLoading || !editName.trim()}>
              {editLoading ? 'Saving...' : 'Save Changes'}
            </MdButton>
          </>
        }
      >
        <MdTextField label="Channel Name" value={editName} onChange={setEditName} required />
        <MdTextField label="Channel Topic" value={editTopic} onChange={setEditTopic} />
        <MdSelect
          label="Slowmode"
          value={String(editSlowmode)}
          onChange={(val) => setEditSlowmode(Number(val))}
          options={[
            { value: '0', label: 'Off' },
            { value: '5', label: '5 seconds' },
            { value: '10', label: '10 seconds' },
            { value: '30', label: '30 seconds' },
            { value: '60', label: '1 minute' },
            { value: '300', label: '5 minutes' },
          ]}
        />
        <SwitchRow label="Age-Restricted (NSFW)" checked={editNsfw} onChange={setEditNsfw} />
      </MdDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Channel"
        message={`Are you sure you want to permanently delete "${deleteName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};
