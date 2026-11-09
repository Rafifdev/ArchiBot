import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  closestCenter,
  closestCorners,
  defaultDropAnimationSideEffects,
  DropAnimation,
  CollisionDetection,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  toast,
} from '../components/ui';
import { ChannelItem } from '../types/api';
import { useServerSwitch } from '../components/layout';
import { useRealtime } from '../hooks/useRealtime';

interface SortableChannelRowProps {
  ch: ChannelItem;
  parentCategory: string | null;
  isSearchActive: boolean;
  isLocking: boolean;
  onToggleLock: (ch: ChannelItem) => void;
  onSyncPermissions: (ch: ChannelItem) => void;
  onEdit: (ch: ChannelItem) => void;
  onDelete: (id: string, name: string) => void;
  channelTypeIcon: (type: string, isAutoVoice: boolean) => string;
}

const SortableChannelRow: React.FC<SortableChannelRowProps> = ({
  ch,
  parentCategory,
  isSearchActive,
  isLocking,
  onToggleLock,
  onSyncPermissions,
  onEdit,
  onDelete,
  channelTypeIcon,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ch.id,
    disabled: isSearchActive || isLocking,
    data: {
      type: 'channel',
      channel: ch,
      parentId: parentCategory,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      title={!isSearchActive ? 'Tarik untuk mengubah urutan atau memindahkan antar kategori' : undefined}
      className={`relative flex items-center justify-between px-3.5 py-2.5 bg-discord-surface hover:bg-discord-card-hover border border-discord-border rounded-lg mb-1.5 gap-3 transition-colors duration-150 ${
        !isSearchActive && !isLocking ? 'cursor-move select-none' : ''
      } ${isDragging ? 'opacity-25' : ''}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <MdIcon name={channelTypeIcon(ch.typeName, ch.isAutoVoiceHub)} className="text-xl text-discord-muted shrink-0" />
        <span className="font-normal text-xs text-discord-text truncate">{ch.name}</span>

        {ch.isAutoVoiceHub && <StatusBadge label="Auto Voice" tone="blurple" />}
        {ch.isLocked && <StatusBadge label="Locked" tone="red" />}
        {ch.nsfw && <StatusBadge label="NSFW" tone="red" />}
        {ch.rateLimitPerUser > 0 && <StatusBadge label={`Slow ${ch.rateLimitPerUser}s`} tone="neutral" />}
      </div>

      <div
        className="flex items-center gap-1 cursor-default pointer-events-auto"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <MdIconButton
          icon={isLocking ? 'sync' : ch.isLocked ? 'lock' : 'lock_open'}
          className={`${isLocking ? 'animate-spin text-discord-blurple' : ch.isLocked ? 'text-discord-red hover:text-red-400' : 'text-discord-muted hover:text-discord-white'} transition-all`}
          disabled={isLocking}
          onClick={() => onToggleLock(ch)}
          title={isLocking ? 'Memperbarui status lock...' : ch.isLocked ? 'Unlock Channel' : 'Lock Channel'}
        />
        {ch.parentId && (
          <MdIconButton icon="sync" onClick={() => onSyncPermissions(ch)} title="Sync permissions with category" />
        )}
        <MdIconButton
          icon="edit"
          onClick={() => onEdit(ch)}
          title="Edit Channel"
        />
        <MdIconButton
          icon="delete"
          onClick={() => onDelete(ch.id, ch.name)}
          title="Delete Channel"
        />
      </div>
    </div>
  );
};

const DroppableCategoryCard: React.FC<{
  cat: ChannelItem;
  childrenChannels: ChannelItem[];
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onAddChannel: (catId: string) => void;
  onDeleteCategory: (catId: string, name: string) => void;
  children: React.ReactNode;
}> = ({
  cat,
  childrenChannels,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onAddChannel,
  onDeleteCategory,
  children,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `category-${cat.id}`,
    data: {
      type: 'category',
      categoryId: cat.id,
    },
  });

  return (
    <SurfaceCard
      ref={setNodeRef}
      className={`p-4 transition-all ${
        isOver ? 'ring-2 ring-discord-blurple bg-discord-blurple/5' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <MdIcon name="folder" className="text-xl text-discord-blurple" />
          <span className="font-normal text-xs text-discord-white uppercase tracking-wider">{cat.name}</span>
          <span className="text-xs text-discord-muted font-normal">({childrenChannels.length})</span>
        </div>

        <div className="flex items-center gap-1">
          {onMoveUp && (
            <MdIconButton
              icon="arrow_upward"
              title="Move Category Up"
              disabled={!canMoveUp}
              onClick={onMoveUp}
            />
          )}
          {onMoveDown && (
            <MdIconButton
              icon="arrow_downward"
              title="Move Category Down"
              disabled={!canMoveDown}
              onClick={onMoveDown}
            />
          )}
          <MdIconButton
            icon="add"
            title="Add Channel to Category"
            onClick={() => onAddChannel(cat.id)}
          />
          <MdIconButton
            icon="delete"
            title="Delete Category"
            onClick={() => onDeleteCategory(cat.id, cat.name)}
          />
        </div>
      </div>

      <SortableContext
        items={childrenChannels.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {childrenChannels.length === 0 ? (
          <div
            className={`text-xs text-center border-2 border-dashed rounded-lg py-4 transition-all ${
              isOver
                ? 'border-discord-blurple bg-discord-blurple/15 text-discord-white font-medium'
                : 'border-discord-border/50 text-discord-muted'
            }`}
          >
            Tarik channel ke sini untuk memindahkannya ke kategori ini.
          </div>
        ) : (
          children
        )}
      </SortableContext>
    </SurfaceCard>
  );
};

const DroppableUnparentedCard: React.FC<{
  channels: ChannelItem[];
  children: React.ReactNode;
}> = ({ channels, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'category-root',
    data: {
      type: 'category',
      categoryId: null,
    },
  });

  return (
    <SurfaceCard
      ref={setNodeRef}
      className={`p-4 border-dashed transition-all ${
        isOver ? 'ring-2 ring-discord-blurple bg-discord-blurple/5 border-discord-blurple' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MdIcon name="grid_view" className="text-xl text-discord-muted" />
          <h3 className="text-xs font-normal text-discord-muted uppercase tracking-wider">
            Uncategorized Channels ({channels.length})
          </h3>
        </div>
      </div>

      <SortableContext
        items={channels.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {channels.length === 0 ? (
          <div
            className={`text-xs text-center border-2 border-dashed rounded-lg py-3.5 transition-all ${
              isOver
                ? 'border-discord-blurple bg-discord-blurple/15 text-discord-white font-medium'
                : 'border-discord-border/50 text-discord-muted'
            }`}
          >
            Lepaskan channel di sini untuk memindahkannya keluar dari kategori (root level).
          </div>
        ) : (
          children
        )}
      </SortableContext>
    </SurfaceCard>
  );
};

const dropAnimationConfig: DropAnimation = {
  duration: 200,
  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.25',
      },
    },
  }),
};

// Custom collision detection: prioritize individual sortable channel items so
// adjacent channels immediately animate/slide when dragged over, falling back
// to category/root cards only when dragging over empty spaces.
const customCollisionDetection: CollisionDetection = (args) => {
  // 1. If pointer is hovering inside a specific channel item, prioritize that channel
  const pointerCollisions = pointerWithin(args);
  const channelPointerCollision = pointerCollisions.find(
    (c) => c.data?.droppableContainer?.data?.current?.type === 'channel'
  );
  if (channelPointerCollision) {
    return [channelPointerCollision];
  }

  // 2. If pointer is hovering directly on a category or root droppable container
  const containerPointerCollision = pointerCollisions.find(
    (c) => c.data?.droppableContainer?.data?.current?.type === 'category'
  );
  if (containerPointerCollision) {
    return [containerPointerCollision];
  }

  // 3. Fallback to rect intersection among sortable channels
  const intersections = rectIntersection(args);
  const channelIntersection = intersections.find(
    (c) => c.data?.droppableContainer?.data?.current?.type === 'channel'
  );
  if (channelIntersection) {
    return [channelIntersection];
  }

  // 4. Fallback to closestCenter among channels only
  const channelContainers = args.droppableContainers.filter(
    (c) => c.data.current?.type === 'channel'
  );
  if (channelContainers.length > 0) {
    const channelClosest = closestCenter({
      ...args,
      droppableContainers: channelContainers,
    });
    if (channelClosest.length > 0) {
      return channelClosest;
    }
  }

  return closestCorners(args);
};

export const ChannelsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { registerServerFetch } = useServerSwitch();
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createFromCatId, setCreateFromCatId] = useState<string | null>(null);
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
  const [lockingIds, setLockingIds] = useState<Set<string>>(new Set());
  const lockingRef = useRef<Set<string>>(new Set());
  const wsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // @dnd-kit Drag and Drop State
  const [activeChannel, setActiveChannel] = useState<ChannelItem | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    sourceCh: ChannelItem;
    targetParentId: string | null;
    targetCh?: ChannelItem;
    placement?: 'before' | 'after';
    categoryName: string;
  } | null>(null);
  const isReorderingRef = useRef(false);
  const reorderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    })
  );

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

  // Real-time WebSocket synchronization with Discord events (debounced + protected against stale cache overwrite)
  useRealtime(
    guildId,
    useCallback(
      (msg) => {
        if (msg.event && msg.event.startsWith('CHANNEL_')) {
          if (isReorderingRef.current) return;
          if (wsDebounceRef.current) clearTimeout(wsDebounceRef.current);
          wsDebounceRef.current = setTimeout(() => {
            fetch(`/api/guilds/${guildId}/channels`, { credentials: 'include' })
              .then((r) => r.json())
              .then((data) => {
                if (data.channels) {
                  setChannels((prev) =>
                    data.channels.map((newCh: ChannelItem) => {
                      // Preserve optimistic lock state while channel is still undergoing a lock operation
                      if (lockingRef.current.has(newCh.id)) {
                        const existing = prev.find((p) => p.id === newCh.id);
                        if (existing) {
                          return { ...newCh, isLocked: existing.isLocked };
                        }
                      }
                      return newCh;
                    })
                  );
                }
              })
              .catch(() => {});
          }, 350);
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
        toast.success(`Channel #${newName} created successfully.`);
      } else {
        toast.error(data.error || 'Failed to create channel');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
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
        toast.success(`Channel #${editName} updated successfully.`);
      } else {
        toast.error(data.error || 'Failed to update channel');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleLock = async (ch: ChannelItem) => {
    // 1. Immediate synchronous lock prevents double-clicks in the same event loop frame
    if (lockingRef.current.has(ch.id)) return;
    lockingRef.current.add(ch.id);
    setLockingIds(new Set(lockingRef.current));

    // 2. Deterministic target state + optimistic UI update
    const prevLocked = Boolean(ch.isLocked);
    const targetLocked = !prevLocked;

    setChannels((prev) =>
      prev.map((c) => (c.id === ch.id ? { ...c, isLocked: targetLocked } : c))
    );

    try {
      // 3. Send explicit target state `locked` so backend never misinterprets rapid requests
      const res = await fetch(`/api/guilds/${guildId}/channels/${ch.id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ locked: targetLocked }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (typeof data.locked === 'boolean') {
          setChannels((prev) =>
            prev.map((c) => (c.id === ch.id ? { ...c, isLocked: data.locked } : c))
          );
          toast.success(`Channel #${ch.name} ${data.locked ? 'locked' : 'unlocked'}.`);
        }
      } else {
        // Rollback optimistic update on failure
        setChannels((prev) =>
          prev.map((c) => (c.id === ch.id ? { ...c, isLocked: prevLocked } : c))
        );
        toast.error(data.error || 'Gagal mengubah status lock channel.');
      }
    } catch (err: any) {
      // Rollback optimistic update on network error
      setChannels((prev) =>
        prev.map((c) => (c.id === ch.id ? { ...c, isLocked: prevLocked } : c))
      );
      toast.error(`Lock error: ${err.message}`);
    } finally {
      // 4. Cooldown grace period (400ms) to ensure smooth transition and avoid Discord rate limits
      setTimeout(() => {
        lockingRef.current.delete(ch.id);
        setLockingIds(new Set(lockingRef.current));
      }, 400);
    }
  };

  const handleSyncPermissions = async (ch: ChannelItem) => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/channels/${ch.id}/sync`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        fetchChannels();
        toast.success(`Channel #${ch.name} permissions synced.`);
      } else {
        toast.error(data.error || 'Failed to sync');
      }
    } catch (err: any) {
      toast.error(`Sync error: ${err.message}`);
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
        toast.success('Channel deleted successfully.');
      } else {
        toast.error(data.error || 'Failed to delete channel');
      }
    } catch (err: any) {
      toast.error(`Delete error: ${err.message}`);
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

  // --- @dnd-kit Drag and Drop Handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    if (search.trim()) return;
    const ch = channels.find((c) => c.id === event.active.id);
    if (ch && ch.typeName !== 'category') {
      setActiveChannel(ch);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveChannel(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const sourceCh = channels.find((c) => c.id === activeId);
    if (!sourceCh) return;

    let targetParentId: string | null = null;
    let targetCh: ChannelItem | undefined;

    if (overId === 'category-root') {
      targetParentId = null;
    } else if (overId.startsWith('category-')) {
      targetParentId = overId.replace('category-', '');
    } else {
      targetCh = channels.find((c) => c.id === overId);
      if (targetCh) {
        targetParentId = targetCh.parentId || null;
      }
    }

    const currentParentId = sourceCh.parentId || null;

    // Moving into a new category: prompt modal alert to prevent accidental permission loss (Opsi B)
    if (targetParentId && targetParentId !== currentParentId) {
      const cat = channels.find((c) => c.id === targetParentId);
      setPendingMove({
        sourceCh,
        targetParentId,
        targetCh,
        placement: 'after',
        categoryName: cat?.name || 'Kategori Baru',
      });
      return;
    }

    // Moving within same category or to root: execute immediately
    executeReorder(sourceCh, targetParentId, targetCh, 'after', false);
  };

  const executeReorder = async (
    sourceCh: ChannelItem,
    targetParentId: string | null,
    targetCh?: ChannelItem,
    placement?: 'before' | 'after',
    lockPermissions = false
  ) => {
    const previousChannels = [...channels];
    const currentParentKey = sourceCh.parentId || null;
    const targetParentKey = targetParentId || null;

    let updatedChannels: ChannelItem[] = [];
    let updates: { id: string; position: number; parentId: string | null; lockPermissions: boolean }[] = [];

    // CASE 1: Reordering within the SAME category (or both root)
    if (currentParentKey === targetParentKey) {
      if (!targetCh || targetCh.id === sourceCh.id) return;

      const siblings = channels
        .filter((c) => c.typeName !== 'category' && (c.parentId || null) === targetParentKey)
        .sort((a, b) => a.position - b.position);

      const oldIndex = siblings.findIndex((c) => c.id === sourceCh.id);
      const newIndex = siblings.findIndex((c) => c.id === targetCh.id);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reorderedSiblings = arrayMove(siblings, oldIndex, newIndex).map((ch, idx) => ({
        ...ch,
        position: idx,
      }));

      const otherChannels = channels.filter(
        (c) => (c.parentId || null) !== targetParentKey || c.typeName === 'category'
      );
      updatedChannels = [...otherChannels, ...reorderedSiblings];

      updates = reorderedSiblings.map((ch) => ({
        id: ch.id,
        position: ch.position,
        parentId: undefined, // Same category reorder: DO NOT pass parentId
        lockPermissions: false,
      }));
    } else {
      // CASE 2: Moving into a DIFFERENT category (cross-category)
      const currentSiblings = channels
        .filter((c) => c.typeName !== 'category' && (c.parentId || null) === targetParentKey && c.id !== sourceCh.id)
        .sort((a, b) => a.position - b.position);

      let nextSiblings: ChannelItem[] = [];
      if (targetCh) {
        const targetIdx = currentSiblings.findIndex((c) => c.id === targetCh.id);
        const insertAt = placement === 'before'
          ? (targetIdx >= 0 ? targetIdx : 0)
          : (targetIdx >= 0 ? targetIdx + 1 : currentSiblings.length);
        nextSiblings = [...currentSiblings];
        nextSiblings.splice(insertAt, 0, { ...sourceCh, parentId: targetParentKey });
      } else {
        nextSiblings = [...currentSiblings, { ...sourceCh, parentId: targetParentKey }];
      }

      const indexedSiblings = nextSiblings.map((ch, idx) => ({
        ...ch,
        position: idx,
      }));

      const otherChannels = channels.filter(
        (c) => (c.parentId || null) !== targetParentKey && c.id !== sourceCh.id
      );
      updatedChannels = [...otherChannels, ...indexedSiblings];

      updates = indexedSiblings.map((ch) => ({
        id: ch.id,
        position: ch.position,
        // Discord rule: Only the single channel changing its parent may have parentId set!
        parentId: ch.id === sourceCh.id ? targetParentKey : undefined,
        lockPermissions: ch.id === sourceCh.id ? lockPermissions : false,
      }));
    }

    // Optimistic UI update
    setChannels(updatedChannels);
    isReorderingRef.current = true;

    try {
      const res = await fetch(`/api/guilds/${guildId}/channels/positions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Server error (${res.status} ${res.statusText || 'Unknown'})`);
      }

      if (targetParentKey !== currentParentKey) {
        const cat = channels.find((c) => c.id === targetParentKey);
        toast.success(`Channel #${sourceCh.name} berhasil dipindahkan ke kategori "${cat?.name || 'Tanpa Kategori'}".`);
      } else {
        toast.success(`Posisi channel #${sourceCh.name} berhasil diperbarui.`);
      }
    } catch (err: any) {
      console.error('Channel @dnd-kit reorder error:', err);
      setChannels(previousChannels);
      toast.error(`Gagal memindahkan posisi channel: ${err.message}`);
    } finally {
      if (reorderTimeoutRef.current) clearTimeout(reorderTimeoutRef.current);
      reorderTimeoutRef.current = setTimeout(() => {
        isReorderingRef.current = false;
      }, 700);
    }
  };

  const handleMoveCategory = async (catId: string, direction: 'up' | 'down') => {
    const catList = channels
      .filter((c) => c.typeName === 'category')
      .sort((a, b) => a.position - b.position);

    const currentIndex = catList.findIndex((c) => c.id === catId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= catList.length) return;

    const reordered = arrayMove(catList, currentIndex, targetIndex).map((cat, idx) => ({
      ...cat,
      position: idx,
    }));

    const otherChannels = channels.filter((c) => c.typeName !== 'category');
    const previousChannels = [...channels];
    const updatedChannels = [...otherChannels, ...reordered];

    setChannels(updatedChannels);

    const updates = reordered.map((c) => ({
      id: c.id,
      position: c.position,
    }));

    try {
      const res = await fetch(`/api/guilds/${guildId}/channels/positions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Gagal mengubah posisi kategori');
      }
      const catObj = catList[currentIndex];
      toast.success(`Posisi kategori "${catObj.name}" berhasil diperbarui.`);
    } catch (err: any) {
      setChannels(previousChannels);
      toast.error(`Gagal memindahkan posisi kategori: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        category="CHANNELS & TEMPLATES"
        title="Channels & Categories"
        description="Organize categories, lock or unlock channels, and configure channel properties."
        actions={
          <div className="flex items-center gap-2.5">
            <div className="w-60 sm:w-64">
              <MdTextField
                compact
                icon="search"
                value={search}
                onChange={setSearch}
                debounceMs={250}
                placeholder="Search channels..."
              />
            </div>
            <MdButton
              variant="tonal"
              icon="create_new_folder"
              onClick={() => {
                setCreateFromCatId(null);
                setNewParent('');
                setNewType('category');
                setNewName('');
                setNewTopic('');
                setNewSlowmode(0);
                setNewNsfw(false);
                setCreateOpen(true);
              }}
            >
              Create Category
            </MdButton>
            <MdButton
              variant="filled"
              icon="add"
              onClick={() => {
                setCreateFromCatId(null);
                setNewParent('');
                setNewType('text');
                setNewName('');
                setNewTopic('');
                setNewSlowmode(0);
                setNewNsfw(false);
                setCreateOpen(true);
              }}
            >
              Create Channel
            </MdButton>
          </div>
        }
      />

      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {(unparented.length > 0 || (activeChannel && activeChannel.parentId)) && (
          <DroppableUnparentedCard channels={unparented}>
            {unparented.map((ch) => (
              <SortableChannelRow
                key={ch.id}
                ch={ch}
                parentCategory={null}
                isSearchActive={Boolean(search.trim())}
                isLocking={lockingIds.has(ch.id)}
                onToggleLock={handleToggleLock}
                onSyncPermissions={handleSyncPermissions}
                onEdit={(c) => {
                  setEditChannel(c);
                  setEditName(c.name);
                  setEditTopic(c.topic || '');
                  setEditSlowmode(c.rateLimitPerUser);
                  setEditNsfw(c.nsfw);
                }}
                onDelete={(id, name) => {
                  setDeleteId(id);
                  setDeleteName(name);
                }}
                channelTypeIcon={channelTypeIcon}
              />
            ))}
          </DroppableUnparentedCard>
        )}

        {categories.map((cat, catIdx) => {
          const children = filtered.filter((c) => c.parentId === cat.id);
          return (
            <DroppableCategoryCard
              key={cat.id}
              cat={cat}
              childrenChannels={children}
              canMoveUp={catIdx > 0}
              canMoveDown={catIdx < categories.length - 1}
              onMoveUp={() => handleMoveCategory(cat.id, 'up')}
              onMoveDown={() => handleMoveCategory(cat.id, 'down')}
              onAddChannel={(catId) => {
                setCreateFromCatId(catId);
                setNewParent(catId);
                setNewType('text');
                setNewName('');
                setNewTopic('');
                setNewSlowmode(0);
                setNewNsfw(false);
                setCreateOpen(true);
              }}
              onDeleteCategory={(catId, name) => {
                setDeleteId(catId);
                setDeleteName(name);
              }}
            >
              {children.map((ch) => (
                <SortableChannelRow
                  key={ch.id}
                  ch={ch}
                  parentCategory={cat.id}
                  isSearchActive={Boolean(search.trim())}
                  isLocking={lockingIds.has(ch.id)}
                  onToggleLock={handleToggleLock}
                  onSyncPermissions={handleSyncPermissions}
                  onEdit={(c) => {
                    setEditChannel(c);
                    setEditName(c.name);
                    setEditTopic(c.topic || '');
                    setEditSlowmode(c.rateLimitPerUser);
                    setEditNsfw(c.nsfw);
                  }}
                  onDelete={(id, name) => {
                    setDeleteId(id);
                    setDeleteName(name);
                  }}
                  channelTypeIcon={channelTypeIcon}
                />
              ))}
            </DroppableCategoryCard>
          );
        })}

        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeChannel ? (
            <div className="w-full h-full box-border flex items-center justify-between px-3.5 py-2.5 bg-discord-surface rounded-lg shadow-2xl gap-3 cursor-move select-none">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <MdIcon
                  name={channelTypeIcon(activeChannel.typeName, activeChannel.isAutoVoiceHub)}
                  className="text-xl text-discord-muted shrink-0"
                />
                <span className="font-normal text-xs text-discord-text truncate">{activeChannel.name}</span>

                {activeChannel.isAutoVoiceHub && <StatusBadge label="Auto Voice" tone="blurple" />}
                {activeChannel.isLocked && <StatusBadge label="Locked" tone="red" />}
                {activeChannel.nsfw && <StatusBadge label="NSFW" tone="red" />}
                {activeChannel.rateLimitPerUser > 0 && (
                  <StatusBadge label={`Slow ${activeChannel.rateLimitPerUser}s`} tone="neutral" />
                )}
              </div>

              <div className="flex items-center gap-1 opacity-70 pointer-events-none">
                <MdIconButton
                  icon={activeChannel.isLocked ? 'lock' : 'lock_open'}
                  className={activeChannel.isLocked ? 'text-discord-red' : 'text-discord-muted'}
                />
                {activeChannel.parentId && <MdIconButton icon="sync" />}
                <MdIconButton icon="edit" />
                <MdIconButton icon="delete" />
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <MdDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateFromCatId(null);
        }}
        headline={
          newType === 'category' ? (
            <div className="flex items-center gap-1.5 animate-modal-switch">
              {createFromCatId === null && (
                <MdIconButton
                  icon="arrow_back"
                  title="Back to Channel Creation"
                  onClick={() => {
                    setNewType('text');
                    setNewName('');
                  }}
                  className="-ml-2 text-discord-muted hover:text-discord-white transition-colors"
                />
              )}
              <span>Create New Category</span>
            </div>
          ) : createFromCatId ? (
            <div className="animate-modal-switch">
              Create Channel in {categories.find((c) => c.id === createFromCatId)?.name || 'Category'}
            </div>
          ) : (
            <div className="animate-modal-switch">Create New Channel</div>
          )
        }
        actions={
          <>
            <MdButton
              variant="text"
              onClick={() => {
                setCreateOpen(false);
                setCreateFromCatId(null);
              }}
            >
              Cancel
            </MdButton>
            <MdButton variant="filled" onClick={handleCreate} disabled={createLoading || !newName.trim()}>
              {createLoading ? 'Creating...' : 'Create'}
            </MdButton>
          </>
        }
      >
        <div
          key={newType === 'category' ? 'mode-category' : 'mode-channel'}
          className="flex flex-col gap-4.5 animate-modal-switch"
        >
          <MdTextField
            label={newType === 'category' ? 'Category Name' : 'Channel Name'}
            value={newName}
            onChange={setNewName}
            placeholder={newType === 'category' ? 'e.g. INFORMATION' : 'e.g. general-chat'}
          />
          {newType !== 'category' && (
            <MdSelect
              label="Channel Type"
              value={newType}
              onChange={setNewType}
              options={[
                { value: 'text', label: 'Text Channel' },
                { value: 'voice', label: 'Voice Channel' },
                { value: 'announcement', label: 'Announcement Channel' },
                { value: 'autovoice', label: 'Join-to-Create Auto Voice Hub' },
                { value: 'readonly', label: 'Read-Only Info Channel' },
                { value: 'stage', label: 'Stage Room' },
              ]}
            />
          )}
          {!createFromCatId && newType !== 'category' && (
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <MdSelect
                  label="Parent Category"
                  value={newParent}
                  onChange={setNewParent}
                  options={categoryOptions}
                  className="w-full"
                />
              </div>
              <MdIconButton
                icon="create_new_folder"
                variant="outlined"
                title="Create New Category"
                className="input-matched-icon-button shrink-0"
                onClick={() => {
                  setNewType('category');
                  setNewName('');
                  setNewParent('');
                }}
              />
            </div>
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
              <SwitchRow
                boxed
                label="Age-Restricted (NSFW)"
                description="Requires members to be 18+ to view this channel"
                checked={newNsfw}
                onChange={setNewNsfw}
              />
            </>
          )}
        </div>
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
        <MdTextField label="Channel Name" value={editName} onChange={setEditName} />
        <MdTextField label="Channel Topic" value={editTopic} onChange={setEditTopic} placeholder="Optional topic" />
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
        <SwitchRow
          boxed
          label="Age-Restricted (NSFW)"
          description="Requires members to be 18+ to view this channel"
          checked={editNsfw}
          onChange={setEditNsfw}
        />
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

      {/* Category Move Permission Sync Alert Modal */}
      <MdDialog
        open={Boolean(pendingMove)}
        onClose={() => setPendingMove(null)}
        headline="Sinkronisasi Izin Kategori?"
        actions={
          <>
            <MdButton variant="text" onClick={() => setPendingMove(null)}>
              Batal
            </MdButton>
            <MdButton
              variant="tonal"
              onClick={() => {
                if (pendingMove) {
                  executeReorder(
                    pendingMove.sourceCh,
                    pendingMove.targetParentId,
                    pendingMove.targetCh,
                    pendingMove.placement,
                    false
                  );
                  setPendingMove(null);
                }
              }}
            >
              Pertahankan Izin Lama
            </MdButton>
            <MdButton
              variant="filled"
              icon="sync"
              onClick={() => {
                if (pendingMove) {
                  executeReorder(
                    pendingMove.sourceCh,
                    pendingMove.targetParentId,
                    pendingMove.targetCh,
                    pendingMove.placement,
                    true
                  );
                  setPendingMove(null);
                }
              }}
            >
              Sinkronkan Izin
            </MdButton>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <p className="text-discord-text text-xs leading-relaxed">
            Channel <strong className="text-discord-white font-medium">#{pendingMove?.sourceCh.name}</strong> dipindahkan ke kategori <strong className="text-discord-white font-medium">{pendingMove?.categoryName}</strong>.
          </p>
          <div className="p-3.5 rounded-xl bg-discord-surface border border-discord-border space-y-2">
            <div className="flex items-center gap-2 text-discord-white text-xs font-medium">
              <MdIcon name="warning" className="text-base text-amber-400 shrink-0" />
              <span>Pemberitahuan Izin Channel</span>
            </div>
            <p className="text-discord-muted text-xs leading-relaxed">
              Memilih <strong>Sinkronkan Izin</strong> akan mengatur channel untuk otomatis menyelaraskan permission dengan kategori baru. Izin khusus lama pada channel ini akan disesuaikan dengan aturan kategori.
            </p>
            <p className="text-discord-muted text-xs leading-relaxed">
              Pilih <strong>Pertahankan Izin Lama</strong> jika channel ini memiliki izin akses khusus yang tidak ingin diubah.
            </p>
          </div>
        </div>
      </MdDialog>
    </div>
  );
};
