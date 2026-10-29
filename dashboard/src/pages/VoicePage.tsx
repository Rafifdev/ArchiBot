import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  MdButton,
  MdTextField,
  MdSelect,
  MdIconButton,
  VoiceSkeleton,
  MdIcon,
  Badge,
  StatusBadge,
  MdDialog,
  PageHeader,
  SurfaceCard,
  EmptyState,
} from '../components/ui';
import { TempVoiceRoom } from '../types/api';
import { useServerSwitch } from '../components/layout';

export const VoicePage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [hubs, setHubs] = useState<any[]>([]);
  const [tempRooms, setTempRooms] = useState<TempVoiceRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { registerServerFetch } = useServerSwitch();

  const [createHubOpen, setCreateHubOpen] = useState(false);
  const [hubName, setHubName] = useState('➕ Create Voice');
  const [createLoading, setCreateLoading] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState<TempVoiceRoom | null>(null);
  const [editName, setEditName] = useState('');
  const [editLimit, setEditLimit] = useState(0);

  const fetchVoiceData = () => {
    setLoading(true);
    const p = fetch(`/api/guilds/${guildId}/voice`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.hubs) setHubs(data.hubs);
        if (data.tempRooms) setTempRooms(data.tempRooms);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    registerServerFetch(p);
  };

  useEffect(() => {
    fetchVoiceData();
    const interval = setInterval(fetchVoiceData, 10000);
    return () => clearInterval(interval);
  }, [guildId]);

  const handleCreateHub = async () => {
    setCreateLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/voice/hubs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: hubName }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateHubOpen(false);
        fetchVoiceData();
      } else {
        alert(data.error || 'Failed to create hub');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteHub = async (chId: string) => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/voice/hubs/${chId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ deleteChannel: true }),
      });
      const data = await res.json();
      if (data.success) fetchVoiceData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleToggleRoomPrivacy = async (room: TempVoiceRoom) => {
    const nextMode = room.isLocked ? 'open' : 'locked';
    try {
      const res = await fetch(`/api/guilds/${guildId}/voice/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ privacy: nextMode }),
      });
      const data = await res.json();
      if (data.success) fetchVoiceData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSaveRoom = async () => {
    if (!selectedRoom) return;
    try {
      const res = await fetch(`/api/guilds/${guildId}/voice/rooms/${selectedRoom.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editName,
          userLimit: editLimit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedRoom(null);
        fetchVoiceData();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCloseRoom = async (chId: string) => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/voice/rooms/${chId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) fetchVoiceData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDisconnectMember = async (roomId: string, memberId: string) => {
    try {
      await fetch(`/api/guilds/${guildId}/voice/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ disconnectMemberId: memberId }),
      });
      fetchVoiceData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading && hubs.length === 0 && tempRooms.length === 0) return <VoiceSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        category="VOICE & PANELS"
        title="Dynamic Voice Hubs"
        description="Manage Join-to-Create voice generator channels and supervise active personal voice rooms in real-time."
        actions={
          <MdButton variant="filled" icon="add" onClick={() => setCreateHubOpen(true)}>
            New Auto-Voice Hub
          </MdButton>
        }
      />

      <SurfaceCard>
        <h3 className="text-xs font-normal text-discord-white mb-3">
          Auto-Voice Generator Hubs ({hubs.length})
        </h3>
        {hubs.length === 0 ? (
          <p className="text-discord-muted text-xs font-normal">
            No Auto-Voice hubs configured yet. Click "New Auto-Voice Hub" above to create one.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hubs.map((hub) => (
              <div
                key={hub.id}
                className="flex items-center justify-between px-4 py-3 bg-discord-surface border border-discord-border rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MdIcon name="add_circle" className="text-xl text-discord-blurple" />
                  <div className="min-w-0">
                    <div className="font-normal text-xs text-discord-white truncate">{hub.name}</div>
                    <div className="text-xs text-discord-muted font-normal">ID: {hub.id}</div>
                  </div>
                </div>

                <MdIconButton icon="delete" onClick={() => handleDeleteHub(hub.id)} title="Delete Hub" />
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-normal text-discord-white">
            Live Temporary Voice Rooms ({tempRooms.length})
          </h3>
          <span className="text-xs text-discord-green font-normal">● Auto-refreshing</span>
        </div>

        {tempRooms.length === 0 ? (
          <EmptyState
            icon="voice_chat"
            description="No active personal voice rooms right now. When members join an Auto-Voice hub, their rooms appear here."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tempRooms.map((room) => (
              <div
                key={room.id}
                className="flex flex-col p-4 bg-discord-surface border border-discord-border rounded-xl gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-normal text-xs text-discord-white flex items-center gap-2">
                      <span>{room.name}</span>
                      {room.isLocked && <StatusBadge label="Locked" tone="red" />}
                    </div>
                    <div className="text-xs text-discord-muted font-normal mt-0.5">
                      Owner: <span className="text-discord-text">{room.ownerName}</span>
                    </div>
                  </div>

                  <StatusBadge
                    label={`${room.memberCount} ${room.userLimit > 0 ? `/ ${room.userLimit}` : ''} users`}
                    tone="blurple"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {room.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-1.5 bg-discord-card border border-discord-border px-2.5 py-1 rounded-full text-xs"
                    >
                      <img src={m.avatar} alt={m.username} className="w-4 h-4 rounded-full" />
                      <span className="text-xs font-normal text-discord-text">{m.username}</span>
                      <button
                        type="button"
                        onClick={() => handleDisconnectMember(room.id, m.id)}
                        className="text-discord-red hover:opacity-80 cursor-pointer bg-transparent border-0 flex items-center"
                        title="Disconnect member"
                      >
                        <MdIcon name="close" className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-3 border-t border-discord-border">
                  <MdButton
                    variant="tonal"
                    icon={room.isLocked ? 'lock_open' : 'lock'}
                    onClick={() => handleToggleRoomPrivacy(room)}
                  >
                    {room.isLocked ? 'Unlock' : 'Lock'}
                  </MdButton>
                  <MdButton
                    variant="text"
                    icon="edit"
                    onClick={() => {
                      setSelectedRoom(room);
                      setEditName(room.name.replace(/^🔊\s*/, ''));
                      setEditLimit(room.userLimit);
                    }}
                  >
                    Settings
                  </MdButton>
                  <MdButton
                    variant="danger"
                    icon="close"
                    onClick={() => handleCloseRoom(room.id)}
                  >
                    Close
                  </MdButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>

      <MdDialog
        open={createHubOpen}
        onClose={() => setCreateHubOpen(false)}
        headline="Create Auto-Voice Generator Hub"
        actions={
          <>
            <MdButton variant="text" onClick={() => setCreateHubOpen(false)}>
              Cancel
            </MdButton>
            <MdButton variant="filled" onClick={handleCreateHub} disabled={createLoading || !hubName.trim()}>
              {createLoading ? 'Creating...' : 'Create Hub'}
            </MdButton>
          </>
        }
      >
        <MdTextField
          label="Hub Channel Name"
          value={hubName}
          onChange={setHubName}
          placeholder="➕ Create Voice"
          required
        />
        <p className="text-xs text-discord-muted font-normal leading-relaxed">
          When any member joins this voice channel, ArchiBot will instantly create a temporary private voice room for them and move them into it.
        </p>
      </MdDialog>

      <MdDialog
        open={Boolean(selectedRoom)}
        onClose={() => setSelectedRoom(null)}
        headline="Edit Temporary Voice Room"
        actions={
          <>
            <MdButton variant="text" onClick={() => setSelectedRoom(null)}>
              Cancel
            </MdButton>
            <MdButton variant="filled" onClick={handleSaveRoom}>
              Save Changes
            </MdButton>
          </>
        }
      >
        <MdTextField label="Room Name" value={editName} onChange={setEditName} required />
        <MdSelect
          label="Member Limit"
          value={String(editLimit)}
          onChange={(val) => setEditLimit(Number(val))}
          options={[
            { value: '0', label: 'No Limit (Unlimited)' },
            { value: '2', label: '2 Members (Duo)' },
            { value: '3', label: '3 Members (Trio)' },
            { value: '4', label: '4 Members (Squad)' },
            { value: '5', label: '5 Members (Party)' },
            { value: '10', label: '10 Members' },
          ]}
        />
      </MdDialog>
    </div>
  );
};
