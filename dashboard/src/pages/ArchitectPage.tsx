import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Badge,
  EmptyState,
  MdButton,
  MdIconButton,
  ArchitectSkeleton,
  MdIcon,
  MdTabs,
  MdDialog,
  ConfirmDialog,
  PageHeader,
  SurfaceCard,
  SwitchRow,
  toast,
} from '../components/ui';
import { useServerSwitch } from '../components/layout';

const TEMPLATE_META: Record<
  string,
  { name: string; description: string; badge: string; tone: 'blurple' | 'green' | 'fuchsia' | 'yellow'; icon: string }
> = {
  general: {
    name: 'General Hangout',
    description: 'Casual lounge with general chat, media galleries, minigames, and auto voice rooms.',
    badge: 'Hangout',
    tone: 'green',
    icon: 'forum',
  },
  community: {
    name: 'Community Hub',
    description: 'Creator & community hub with introductions, showcases, stage events, and hangout lounges.',
    badge: 'Community',
    tone: 'blurple',
    icon: 'public',
  },
  games: {
    name: 'Gaming',
    description: 'Gaming community with tournament news, 10 popular game hubs, casual & ranked voice rooms.',
    badge: 'Esports',
    tone: 'fuchsia',
    icon: 'sports_esports',
  },
  study: {
    name: 'Study & Projects',
    description: 'Focused workspace with study resources, homework help, tech channels, and silent study rooms.',
    badge: 'Productivity',
    tone: 'yellow',
    icon: 'menu_book',
  },
};

const MODULE_ICONS: Record<string, string> = {
  server_stats: 'analytics',
  gateway: 'shield',
  news: 'campaign',
  events: 'celebration',
  chat: 'chat',
  galleries: 'photo_library',
  games: 'sports_esports',
  minigames: 'videogame_asset',
  study: 'menu_book',
  music: 'music_note',
  voice_casual: 'headset_mic',
  voice_comp: 'emoji_events',
  voice_hangout: 'weekend',
  voice_study: 'hearing_disabled',
};

interface BuilderModuleItem {
  id: string;
  shortLabel?: string;
  label: string;
  description: string;
  category: string;
  spec: string;
  isCore?: boolean;
}

const CORE_MODULES: BuilderModuleItem[] = [
  {
    id: 'server_stats',
    shortLabel: 'Server Stats',
    label: 'Server Stats',
    description: 'Live read-only voice counters displaying today’s date, online members, and total server members.',
    category: 'SERVER STATS',
    isCore: true,
    spec: `voice: 📅 Date Counter\nvoice: 🟢 Online Members\nvoice: Users: Total Members`,
  },
  {
    id: 'gateway',
    shortLabel: 'Gateway',
    label: 'Gateway',
    description: 'Welcome greetings, rules embed, CAPTCHA verification, role picker, booster/invite logs, and goodbye.',
    category: 'GATEWAY',
    isCore: true,
    spec: `readonly: 🛬・welcome\nreadonly: 📜・rules\nreadonly: ✅・verify\nreadonly: 📍・roles-pick\nreadonly: 🚀・booster-logs\nreadonly: 📥・invite-logs\nreadonly: 👋🏻・goodbye`,
  },
];

interface ModuleOptionCardProps {
  mod: BuilderModuleItem;
  isSelected: boolean;
  onToggle: () => void;
  onPreview: () => void;
}

const ModuleOptionCard: React.FC<ModuleOptionCardProps> = ({
  mod,
  isSelected,
  onToggle,
  onPreview,
}) => {
  const cleanTitle = mod.shortLabel || stripLeadingEmoji(mod.label);
  const iconName = MODULE_ICONS[mod.id] || 'folder';
  const channelCount = mod.spec
    ? String(mod.spec)
        .split(/\r?\n/)
        .filter((l) => l.trim().length > 0).length
    : 0;

  return (
    <div
      onClick={onToggle}
      className={`rounded-xl border-0 p-4 flex flex-col justify-between gap-3.5 cursor-pointer select-none transition-colors duration-150 ${
        isSelected
          ? 'bg-[color-mix(in_srgb,var(--color-discord-blurple)_18%,var(--color-discord-surface))]'
          : 'bg-discord-surface hover:bg-discord-card-hover'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isSelected
                ? 'bg-discord-blurple text-white'
                : 'bg-discord-card text-discord-muted'
            }`}
          >
            <MdIcon name={iconName} className="text-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className={`text-sm font-normal truncate leading-tight ${
                isSelected ? 'text-discord-white' : 'text-discord-muted'
              }`}
            >
              {cleanTitle}
            </div>
            <p className="text-xs text-discord-muted font-normal mt-1 leading-relaxed">
              {mod.description}
            </p>
          </div>
        </div>

        <MdIcon
          name={isSelected ? 'check_circle' : 'radio_button_unchecked'}
          className={`text-xl shrink-0 mt-0.5 ${
            isSelected ? 'text-discord-blurple' : 'text-discord-muted'
          }`}
        />
      </div>

      <div className="pt-2.5 border-t border-discord-border flex items-center justify-between gap-2 text-xs text-discord-muted font-normal">
        <div className="flex items-center gap-2 min-w-0 truncate">
          <span className="truncate">{mod.category || 'CATEGORY'}</span>
          {channelCount > 0 && (
            <>
              <span>•</span>
              <span className="shrink-0">{channelCount} channels</span>
            </>
          )}
        </div>

        <MdIconButton
          icon="visibility"
          title={`Preview ${cleanTitle}`}
          className="text-discord-muted hover:text-discord-white -my-2 -mr-2 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
        />
      </div>
    </div>
  );
};

interface BuildStage {
  progress: number;
  text: string;
}

function getTemplateBuildStages(replace: boolean, includeRoles: boolean, includeMusic: boolean): BuildStage[] {
  const stages: BuildStage[] = [
    { progress: 10, text: 'Initializing server architecture blueprint...' },
    replace
      ? { progress: 24, text: 'Clearing old categories and channels...' }
      : { progress: 24, text: 'Scanning existing categories for safe merge...' },
  ];

  if (includeRoles) {
    stages.push({ progress: 40, text: 'Creating server roles and permission presets...' });
  } else {
    stages.push({ progress: 40, text: 'Verifying member & verified role permissions...' });
  }

  stages.push(
    { progress: 56, text: 'Provisioning information and welcome sections...' },
    { progress: 72, text: 'Building category hierarchy and text channels...' },
    includeMusic
      ? { progress: 84, text: 'Setting up voice lounges and music controls...' }
      : { progress: 84, text: 'Configuring voice rooms and channel access...' },
    { progress: 92, text: 'Syncing channel order and finalizing server state...' }
  );

  return stages;
}

function getCustomBuildStages(replace: boolean, includeMusic: boolean): BuildStage[] {
  const stages: BuildStage[] = [
    { progress: 12, text: 'Compiling selected modular layout...' },
    replace
      ? { progress: 28, text: 'Removing old categories and channels...' }
      : { progress: 28, text: 'Inspecting existing server layout for merge...' },
    { progress: 46, text: 'Creating server roles and access rules...' },
    { progress: 68, text: 'Constructing modular categories and channels...' },
  ];

  if (includeMusic) {
    stages.push({ progress: 84, text: 'Deploying music request channel & controls...' });
  }
  stages.push({ progress: 93, text: 'Finalizing server synchronization...' });
  return stages;
}

function getClearStages(keepGeneral: boolean): BuildStage[] {
  return [
    { progress: 15, text: 'Preparing server channel cleanup...' },
    { progress: 42, text: 'Deleting existing categories and text channels...' },
    { progress: 68, text: 'Removing voice rooms and leftover hubs...' },
    keepGeneral
      ? { progress: 88, text: 'Creating fresh #general fallback channel...' }
      : { progress: 88, text: 'Finishing empty server reset...' },
  ];
}

function stripLeadingEmoji(text?: string): string {
  if (!text) return '';
  return text.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D]+\s*/u, '').trim() || text;
}

interface ParsedChannelItem {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'jtc' | 'stage' | 'adminvoice';
  readOnly: boolean;
}

interface ParsedCategoryGroup {
  id: string;
  category: string | null;
  channels: ParsedChannelItem[];
}

function parseTemplatePreview(spec?: string, prefix = 'tpl'): ParsedCategoryGroup[] {
  const groups: ParsedCategoryGroup[] = [];
  let current: ParsedCategoryGroup | null = null;
  let catSeq = 0;
  let chSeq = 0;

  for (const raw of String(spec ?? '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const catMatch = line.match(/^\[(.+)]$/);
    if (catMatch) {
      const catName = catMatch[1].trim();
      current = {
        id: `cat:${prefix}:${catSeq++}:${catName}`,
        category: catName,
        channels: [],
      };
      groups.push(current);
      continue;
    }

    let ch: Omit<ParsedChannelItem, 'id'> | null = null;
    if (/^(\+|autovoice:|auto:|jtc:)/i.test(line)) {
      const name = line.replace(/^(\+|autovoice:|auto:|jtc:)\s*/i, '').trim();
      if (name) ch = { name, type: 'jtc', readOnly: false };
    } else if (/^stage:/i.test(line)) {
      const name = line.replace(/^stage:\s*/i, '').trim();
      if (name) ch = { name, type: 'stage', readOnly: false };
    } else if (/^adminvoice:/i.test(line)) {
      const name = line.replace(/^adminvoice:\s*/i, '').trim();
      if (name) ch = { name, type: 'adminvoice', readOnly: false };
    } else if (/^v(oice)?:/i.test(line)) {
      const name = line.replace(/^v(oice)?:\s*/i, '').trim();
      if (name) ch = { name, type: 'voice', readOnly: false };
    } else if (/^(!|readonly:)/i.test(line)) {
      const name = line.replace(/^(!|readonly:)\s*#?\s*/i, '').trim();
      if (name) ch = { name, type: 'text', readOnly: true };
    } else {
      const name = line.replace(/^(text:\s*)?#*\s*/i, '').trim();
      if (name) ch = { name, type: 'text', readOnly: false };
    }

    if (!ch) continue;
    if (!current) {
      current = { id: `cat:${prefix}:${catSeq++}:root`, category: null, channels: [] };
      groups.push(current);
    }
    current.channels.push({
      id: `ch:${prefix}:${chSeq++}:${ch.name}`,
      ...ch,
    });
  }

  return groups;
}

function serializeGroupsToSpec(
  groups: ParsedCategoryGroup[],
  excludeCategoryNames?: Set<string>
): string {
  const blocks: string[] = [];
  for (const g of groups) {
    if (g.category && excludeCategoryNames?.has(g.category.trim().toUpperCase())) continue;
    const lines: string[] = [];
    if (g.category) lines.push(`[${g.category}]`);
    for (const ch of g.channels) {
      if (ch.type === 'jtc') lines.push(`autovoice: ${ch.name}`);
      else if (ch.type === 'stage') lines.push(`stage: ${ch.name}`);
      else if (ch.type === 'adminvoice') lines.push(`adminvoice: ${ch.name}`);
      else if (ch.type === 'voice') lines.push(`voice: ${ch.name}`);
      else if (ch.readOnly) lines.push(`readonly: ${ch.name}`);
      else lines.push(ch.name);
    }
    if (lines.length > 0) blocks.push(lines.join('\n'));
  }
  return blocks.join('\n\n');
}

function mergeOrderedPreviewGroups(
  prev: ParsedCategoryGroup[],
  fresh: ParsedCategoryGroup[]
): ParsedCategoryGroup[] {
  const freshCatMap = new Map(fresh.map((g) => [g.id, g]));
  const freshChMap = new Map<string, ParsedChannelItem>();
  for (const g of fresh) {
    for (const ch of g.channels) freshChMap.set(ch.id, ch);
  }

  const usedCatIds = new Set<string>();
  const usedChIds = new Set<string>();
  const merged: ParsedCategoryGroup[] = [];

  for (const prevCat of prev) {
    if (!freshCatMap.has(prevCat.id)) continue;
    usedCatIds.add(prevCat.id);
    const keptChannels: ParsedChannelItem[] = [];
    for (const prevCh of prevCat.channels) {
      const updated = freshChMap.get(prevCh.id);
      if (updated && !usedChIds.has(prevCh.id)) {
        keptChannels.push(updated);
        usedChIds.add(prevCh.id);
      }
    }
    merged.push({ ...freshCatMap.get(prevCat.id)!, channels: keptChannels });
  }

  const mergedCatMap = new Map(merged.map((g) => [g.id, g]));
  for (const freshCat of fresh) {
    if (!usedCatIds.has(freshCat.id)) {
      const remainingChannels = freshCat.channels.filter((ch) => !usedChIds.has(ch.id));
      for (const ch of remainingChannels) usedChIds.add(ch.id);
      merged.push({ ...freshCat, channels: remainingChannels });
    } else {
      const targetCat = mergedCatMap.get(freshCat.id)!;
      for (const ch of freshCat.channels) {
        if (!usedChIds.has(ch.id)) {
          targetCat.channels.push(ch);
          usedChIds.add(ch.id);
        }
      }
    }
  }

  return merged;
}

function getPreviewChannelIcon(ch: ParsedChannelItem): string {
  if (ch.type === 'jtc') return 'add_circle_outline';
  if (ch.type === 'stage') return 'podcasts';
  if (ch.type === 'voice' || ch.type === 'adminvoice') return 'volume_up';
  return ch.readOnly ? 'lock' : 'tag';
}

const PreviewChannelRowContent: React.FC<{ ch: ParsedChannelItem }> = ({ ch }) => (
  <>
    <div className="flex items-center gap-2 min-w-0">
      <MdIcon name={getPreviewChannelIcon(ch)} className="text-sm text-discord-muted shrink-0" />
      <span className="truncate">{ch.name}</span>
    </div>
    {ch.readOnly && <span className="text-[10px] text-discord-muted shrink-0">Read-only</span>}
  </>
);

const SortablePreviewChannelRow: React.FC<{
  ch: ParsedChannelItem;
  parentId: string;
  dropPosition?: 'top' | 'bottom' | null;
}> = ({ ch, parentId, dropPosition }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ch.id,
    data: { type: 'channel', channel: ch, parentId },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition || 'transform 180ms cubic-bezier(0.2, 0, 0, 1)',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative flex items-center justify-between gap-2 px-2 py-1 rounded-md text-xs font-normal text-discord-text cursor-move select-none ${
        isDragging ? 'opacity-25' : ''
      }`}
    >
      {dropPosition && (
        <div
          className={`absolute left-1.5 right-1.5 h-[1.5px] bg-discord-blurple rounded-full pointer-events-none z-10 ${
            dropPosition === 'top' ? '-top-[1px]' : '-bottom-[1px]'
          }`}
        />
      )}
      <PreviewChannelRowContent ch={ch} />
    </div>
  );
};

const SortablePreviewCategoryBlock: React.FC<{
  group: ParsedCategoryGroup;
  isCollapsed: boolean;
  onToggleCollapse: (id: string) => void;
  dropPosition?: 'top' | 'bottom' | 'header' | null;
  children: React.ReactNode;
}> = ({ group, isCollapsed, onToggleCollapse, dropPosition, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
    data: { type: 'category', group },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition || 'transform 180ms cubic-bezier(0.2, 0, 0, 1)',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex flex-col gap-0.5 ${isDragging ? 'opacity-30' : ''}`}
    >
      {dropPosition === 'top' && (
        <div className="absolute -top-1.5 left-1 right-1 h-[1.5px] bg-discord-blurple rounded-full pointer-events-none z-10" />
      )}
      {group.category && (
        <div
          {...attributes}
          {...listeners}
          onClick={() => onToggleCollapse(group.id)}
          className="relative flex items-center gap-1 px-1.5 pb-1 text-[11px] font-normal text-discord-muted uppercase tracking-wider cursor-pointer select-none"
        >
          <MdIcon
            name="expand_more"
            className={`text-sm leading-none transition-transform duration-150 ${
              isCollapsed ? '-rotate-90' : ''
            }`}
          />
          <span className="truncate">{group.category}</span>
          {dropPosition === 'header' && (
            <div className="absolute bottom-0 left-1.5 right-1.5 h-[1.5px] bg-discord-blurple rounded-full pointer-events-none z-10" />
          )}
        </div>
      )}
      {!isCollapsed && (
        <SortableContext items={group.channels.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-0.5 min-h-[4px]">{children}</div>
        </SortableContext>
      )}
      {dropPosition === 'bottom' && (
        <div className="absolute -bottom-1.5 left-1 right-1 h-[1.5px] bg-discord-blurple rounded-full pointer-events-none z-10" />
      )}
    </div>
  );
};

const ChannelTreePreview: React.FC<{
  spec?: string;
  groups?: ParsedCategoryGroup[];
  onGroupsChange?: (nextGroups: ParsedCategoryGroup[]) => void;
  maxHeightClass?: string;
}> = ({ spec, groups: controlledGroups, onGroupsChange, maxHeightClass = 'max-h-44' }) => {
  const groups = useMemo(
    () => controlledGroups ?? parseTemplatePreview(spec),
    [controlledGroups, spec]
  );

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [activeItem, setActiveItem] = useState<
    | { type: 'category'; group: ParsedCategoryGroup }
    | { type: 'channel'; channel: ParsedChannelItem }
    | null
  >(null);
  const [dropIndicator, setDropIndicator] = useState<{
    id: string;
    type: 'category' | 'channel';
    position: 'top' | 'bottom' | 'header';
  } | null>(null);

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  if (groups.length === 0) return null;

  if (!onGroupsChange) {
    return (
      <div
        className={`p-3 rounded-xl bg-discord-surface ${maxHeightClass} overflow-y-auto scrollbar-thin flex flex-col gap-3`}
      >
        {groups.map((group) => {
          const isCollapsed = collapsedIds.has(group.id);
          return (
            <div key={group.id} className="flex flex-col gap-0.5">
              {group.category && (
                <button
                  type="button"
                  onClick={() => toggleCollapse(group.id)}
                  className="flex items-center gap-1 px-1.5 pb-1 text-[11px] font-normal text-discord-muted uppercase tracking-wider text-left cursor-pointer select-none bg-transparent border-0"
                >
                  <MdIcon
                    name="expand_more"
                    className={`text-sm leading-none transition-transform duration-150 ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  />
                  <span className="truncate">{group.category}</span>
                </button>
              )}
              {!isCollapsed && (
                <div className="flex flex-col gap-0.5">
                  {group.channels.map((ch) => (
                    <div
                      key={ch.id}
                      className="flex items-center justify-between gap-2 px-2 py-1 rounded-md text-xs font-normal text-discord-text"
                    >
                      <PreviewChannelRowContent ch={ch} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const findContainerById = (id: string) => {
    const directCat = groups.find((g) => g.id === id);
    if (directCat) return directCat.id;
    const ownerCat = groups.find((g) => g.channels.some((c) => c.id === id));
    return ownerCat?.id ?? null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    setDropIndicator(null);
    if (data?.type === 'category') {
      setActiveItem({ type: 'category', group: data.group });
    } else if (data?.type === 'channel') {
      setActiveItem({ type: 'channel', channel: data.channel });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setDropIndicator(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) {
      setDropIndicator(null);
      return;
    }

    const activeType = active.data.current?.type;
    if (activeType === 'category') {
      const oldIdx = groups.findIndex((g) => g.id === activeId);
      const targetCatId = findContainerById(overId);
      const newIdx = targetCatId ? groups.findIndex((g) => g.id === targetCatId) : -1;
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx && targetCatId) {
        setDropIndicator({
          id: targetCatId,
          type: 'category',
          position: oldIdx < newIdx ? 'bottom' : 'top',
        });
      } else {
        setDropIndicator(null);
      }
      return;
    }

    if (activeType !== 'channel') return;

    const activeContainer = findContainerById(activeId);
    const overContainer = findContainerById(overId);
    if (!activeContainer || !overContainer) {
      setDropIndicator(null);
      return;
    }

    if (activeContainer === overContainer) {
      const cat = groups.find((g) => g.id === activeContainer);
      if (!cat) return;
      if (overId === activeContainer) {
        setDropIndicator({ id: overContainer, type: 'category', position: 'header' });
        return;
      }
      const oldIdx = cat.channels.findIndex((c) => c.id === activeId);
      const newIdx = cat.channels.findIndex((c) => c.id === overId);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        setDropIndicator({
          id: overId,
          type: 'channel',
          position: oldIdx < newIdx ? 'bottom' : 'top',
        });
      }
      return;
    }

    const sourceCatIdx = groups.findIndex((g) => g.id === activeContainer);
    const targetCatIdx = groups.findIndex((g) => g.id === overContainer);
    if (sourceCatIdx === -1 || targetCatIdx === -1) return;

    const sourceChannels = [...groups[sourceCatIdx].channels];
    const targetChannels = [...groups[targetCatIdx].channels];
    const movingIdx = sourceChannels.findIndex((c) => c.id === activeId);
    if (movingIdx === -1) return;

    const [movingItem] = sourceChannels.splice(movingIdx, 1);
    const overChIdx = targetChannels.findIndex((c) => c.id === overId);
    const insertIdx = overChIdx >= 0 ? overChIdx : targetChannels.length;
    targetChannels.splice(insertIdx, 0, movingItem);

    if (overChIdx >= 0) {
      setDropIndicator({ id: overId, type: 'channel', position: 'top' });
    } else {
      setDropIndicator({ id: overContainer, type: 'category', position: 'header' });
    }

    const nextGroups = groups.map((g, idx) => {
      if (idx === sourceCatIdx) return { ...g, channels: sourceChannels };
      if (idx === targetCatIdx) return { ...g, channels: targetChannels };
      return g;
    });
    onGroupsChange(nextGroups);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    setDropIndicator(null);
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeType = active.data.current?.type;

    if (activeType === 'category') {
      const oldIdx = groups.findIndex((g) => g.id === activeId);
      const targetCatId = findContainerById(overId);
      const newIdx = targetCatId ? groups.findIndex((g) => g.id === targetCatId) : -1;
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        onGroupsChange(arrayMove(groups, oldIdx, newIdx));
      }
      return;
    }

    if (activeType === 'channel') {
      const catId = findContainerById(activeId);
      const overCatId = findContainerById(overId);
      if (!catId || catId !== overCatId) return;

      const catIdx = groups.findIndex((g) => g.id === catId);
      if (catIdx === -1) return;

      const oldIdx = groups[catIdx].channels.findIndex((c) => c.id === activeId);
      const newIdx = groups[catIdx].channels.findIndex((c) => c.id === overId);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const nextGroups = groups.map((g, idx) =>
          idx === catIdx ? { ...g, channels: arrayMove(g.channels, oldIdx, newIdx) } : g
        );
        onGroupsChange(nextGroups);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={() => {
        setActiveItem(null);
        setDropIndicator(null);
      }}
      onDragEnd={handleDragEnd}
    >
      <div
        className={`p-3 rounded-xl bg-discord-surface ${maxHeightClass} overflow-y-auto scrollbar-thin flex flex-col gap-3`}
      >
        <SortableContext items={groups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          {groups.map((group) => (
            <SortablePreviewCategoryBlock
              key={group.id}
              group={group}
              isCollapsed={collapsedIds.has(group.id)}
              onToggleCollapse={toggleCollapse}
              dropPosition={
                dropIndicator?.type === 'category' && dropIndicator.id === group.id
                  ? dropIndicator.position
                  : null
              }
            >
              {group.channels.map((ch) => (
                <SortablePreviewChannelRow
                  key={ch.id}
                  ch={ch}
                  parentId={group.id}
                  dropPosition={
                    dropIndicator?.type === 'channel' && dropIndicator.id === ch.id &&
                    (dropIndicator.position === 'top' || dropIndicator.position === 'bottom')
                      ? dropIndicator.position
                      : null
                  }
                />
              ))}
            </SortablePreviewCategoryBlock>
          ))}
        </SortableContext>
      </div>

      <DragOverlay>
        {activeItem?.type === 'category' && activeItem.group.category ? (
          <div className="flex items-center gap-1 px-1.5 pb-1 text-[11px] font-normal text-discord-muted uppercase tracking-wider cursor-pointer select-none">
            <MdIcon
              name="expand_more"
              className={`text-sm leading-none ${
                collapsedIds.has(activeItem.group.id) ? '-rotate-90' : ''
              }`}
            />
            <span className="truncate">{activeItem.group.category}</span>
          </div>
        ) : activeItem?.type === 'channel' ? (
          <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-md text-xs font-normal text-discord-text cursor-move select-none">
            <PreviewChannelRowContent ch={activeItem.channel} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export const ArchitectPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tabIndex, setTabIndex] = useState(0);
  const [templates, setTemplates] = useState<any[]>([]);
  const [legoModules, setLegoModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { registerServerFetch } = useServerSwitch();
  const [executing, setExecuting] = useState(false);

  // Preview & Apply Template Modal state
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [previewModule, setPreviewModule] = useState<{
    id: string;
    title: string;
    category: string;
    channelCount: number;
    spec: string;
    isCore?: boolean;
  } | null>(null);
  const [applyModalTemplate, setApplyModalTemplate] = useState<any | null>(null);
  const [applyPreviewGroups, setApplyPreviewGroups] = useState<ParsedCategoryGroup[]>([]);
  const [applyOrderCustomized, setApplyOrderCustomized] = useState(false);
  const [applyReplace, setApplyReplace] = useState(false);
  const [applyIncludeRoles, setApplyIncludeRoles] = useState(true);
  const [applyIncludeMusic, setApplyIncludeMusic] = useState(true);

  // Modular Builder state
  const [customReplaceChannels, setCustomReplaceChannels] = useState(false);
  const [selectedCoreMods, setSelectedCoreMods] = useState<string[]>(['server_stats', 'gateway']);
  const [selectedMods, setSelectedMods] = useState<string[]>(['news', 'chat', 'voice_casual']);
  const [pendingCoreConfirm, setPendingCoreConfirm] = useState<
    { type: 'single'; mod: BuilderModuleItem } | { type: 'all' } | null
  >(null);
  const [customPreviewGroups, setCustomPreviewGroups] = useState<ParsedCategoryGroup[]>([]);
  const [isOrderCustomized, setIsOrderCustomized] = useState(false);

  // Reset Channels state
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [keepGeneral, setKeepGeneral] = useState(true);

  // Game-style Fullscreen Blur Building Overlay state
  const [buildOverlay, setBuildOverlay] = useState<{
    active: boolean;
    title: string;
    progress: number;
    statusText: string;
  }>({
    active: false,
    title: '',
    progress: 0,
    statusText: '',
  });
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'lego') setTabIndex(1);
    else if (tab === 'danger') setTabIndex(2);
    else setTabIndex(0);
  }, [searchParams]);

  const handleTabChange = (idx: number) => {
    setTabIndex(idx);
    if (idx === 1) setSearchParams({ tab: 'lego' });
    else if (idx === 2) setSearchParams({ tab: 'danger' });
    else setSearchParams({});
  };

  useEffect(() => {
    setLoading(true);
    const p = fetch(`/api/guilds/${guildId}/architect`, { credentials: 'include' })
      .then((r) => r.json())
      .then((archData) => {
        if (archData.templates) setTemplates(archData.templates);
        if (archData.legoModules) setLegoModules(archData.legoModules);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    registerServerFetch(p);
  }, [guildId]);

  const openApplyModal = (tpl: any) => {
    setPreviewTemplate(null);
    setApplyReplace(false);
    setApplyIncludeRoles(true);
    setApplyIncludeMusic(true);
    setApplyPreviewGroups(tpl.specPreview ? parseTemplatePreview(tpl.specPreview, `tpl-${tpl.key}`) : []);
    setApplyOrderCustomized(false);
    setApplyModalTemplate(tpl);
  };

  const runTrackedBuild = async (
    title: string,
    stages: BuildStage[],
    completionText: string,
    requestFn: () => Promise<{ success?: boolean; message?: string; error?: string }>
  ) => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);

    let stageIdx = 0;
    let currentProgress = stages[0]?.progress ?? 10;

    setExecuting(true);
    setBuildOverlay({
      active: true,
      title,
      progress: currentProgress,
      statusText: stages[0]?.text ?? 'Initializing...',
    });

    progressTimerRef.current = setInterval(() => {
      if (stageIdx < stages.length - 1) {
        stageIdx += 1;
        currentProgress = stages[stageIdx].progress;
        setBuildOverlay((prev) => ({
          ...prev,
          progress: currentProgress,
          statusText: stages[stageIdx].text,
        }));
      } else {
        currentProgress = Math.min(96, currentProgress + 0.6);
        setBuildOverlay((prev) => ({
          ...prev,
          progress: currentProgress,
        }));
      }
    }, 650);

    try {
      const data = await requestFn();
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      if (data.success) {
        setBuildOverlay({
          active: true,
          title,
          progress: 100,
          statusText: completionText,
        });

        await new Promise<void>((resolve) => {
          finishTimeoutRef.current = setTimeout(() => {
            setBuildOverlay((prev) => ({ ...prev, active: false }));
            resolve();
          }, 450);
        });

        toast.success(data.message || completionText);
      } else {
        setBuildOverlay((prev) => ({ ...prev, active: false }));
        toast.error(data.error || 'Operation failed');
      }
    } catch (err: any) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setBuildOverlay((prev) => ({ ...prev, active: false }));
      toast.error(`Error: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleConfirmApplyTemplate = async () => {
    if (!applyModalTemplate) return;
    const tpl = applyModalTemplate;
    const reorderedSpec = applyOrderCustomized ? serializeGroupsToSpec(applyPreviewGroups) : undefined;
    const reorderedCats = applyOrderCustomized
      ? applyPreviewGroups.map((g) => g.category).filter(Boolean)
      : undefined;
    setApplyModalTemplate(null);

    await runTrackedBuild(
      `Building "${tpl.displayName}"`,
      getTemplateBuildStages(applyReplace, applyIncludeRoles, applyIncludeMusic),
      `Template "${tpl.displayName}" applied cleanly!`,
      async () => {
        const res = await fetch(`/api/guilds/${guildId}/architect/setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            templateKey: tpl.key,
            replace: applyReplace,
            includeRoles: applyIncludeRoles,
            includeMusic: applyIncludeMusic,
            ...(reorderedSpec ? { overrideSpec: reorderedSpec, orderedCategories: reorderedCats } : {}),
          }),
        });
        return res.json();
      }
    );
  };

  const openModulePreview = (mod: BuilderModuleItem) => {
    const cleanTitle = mod.shortLabel || stripLeadingEmoji(mod.label);
    const channelCount = mod.spec
      ? String(mod.spec)
          .split(/\r?\n/)
          .filter((l) => l.trim().length > 0).length
      : 0;
    setPreviewModule({
      id: mod.id,
      title: cleanTitle,
      category: mod.category,
      channelCount,
      spec: `[${mod.category}]\n${mod.spec}`,
      isCore: mod.isCore,
    });
  };

  const toggleCoreModule = (id: string) => {
    if (selectedCoreMods.includes(id)) {
      const mod = CORE_MODULES.find((m) => m.id === id);
      if (mod) {
        setPendingCoreConfirm({ type: 'single', mod });
        return;
      }
    }
    setSelectedCoreMods((prev) => [...prev, id]);
  };

  const handleConfirmCoreUnselect = () => {
    if (!pendingCoreConfirm) return;
    if (pendingCoreConfirm.type === 'all') {
      setSelectedCoreMods([]);
      setSelectedMods([]);
    } else {
      const targetId = pendingCoreConfirm.mod.id;
      setSelectedCoreMods((prev) => prev.filter((item) => item !== targetId));
    }
    setPendingCoreConfirm(null);
  };

  const toggleFeatureModule = (id: string) => {
    setSelectedMods((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const totalSelectedModulesCount = selectedCoreMods.length + selectedMods.length;
  const allModulesSelected =
    selectedCoreMods.length === CORE_MODULES.length &&
    legoModules.length > 0 &&
    selectedMods.length === legoModules.length;

  const customLayoutPreview = useMemo(() => {
    const freshGroups: ParsedCategoryGroup[] = [];
    const activeLabels: { id: string; label: string; isCore?: boolean }[] = [];

    for (const coreMod of CORE_MODULES) {
      if (selectedCoreMods.includes(coreMod.id)) {
        const parsed = parseTemplatePreview(`[${coreMod.category}]\n${coreMod.spec}`, coreMod.id);
        freshGroups.push(...parsed);
        activeLabels.push({ id: coreMod.id, label: coreMod.shortLabel || coreMod.label, isCore: true });
      }
    }

    for (const mod of legoModules) {
      if (selectedMods.includes(mod.id)) {
        const parsed = parseTemplatePreview(`[${mod.category}]\n${mod.spec}`, mod.id);
        freshGroups.push(...parsed);
        activeLabels.push({ id: mod.id, label: mod.shortLabel || stripLeadingEmoji(mod.label) });
      }
    }

    const totalChannels = freshGroups.reduce((acc, g) => acc + g.channels.length, 0);

    return {
      freshGroups,
      activeLabels,
      categoryCount: freshGroups.length,
      channelCount: totalChannels,
    };
  }, [selectedCoreMods, selectedMods, legoModules]);

  useEffect(() => {
    setCustomPreviewGroups((prev) =>
      isOrderCustomized ? mergeOrderedPreviewGroups(prev, customLayoutPreview.freshGroups) : customLayoutPreview.freshGroups
    );
  }, [customLayoutPreview.freshGroups, isOrderCustomized]);

  const handleBuildLego = async () => {
    const fixedCategorySet = new Set(['SERVER STATS', 'GATEWAY', 'MUSIC AREA']);
    const orderedCustomSpec = serializeGroupsToSpec(customPreviewGroups, fixedCategorySet);
    const orderedCategories = customPreviewGroups
      .map((g) => g.category)
      .filter((c): c is string => Boolean(c));

    await runTrackedBuild(
      'Building Custom Server Layout',
      getCustomBuildStages(customReplaceChannels, selectedMods.includes('music')),
      'Custom server layout built successfully!',
      async () => {
        const res = await fetch(`/api/guilds/${guildId}/architect/setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            selectedModules: selectedMods,
            customSpec: orderedCustomSpec,
            orderedCategories,
            replace: customReplaceChannels,
            includeMusic: selectedMods.includes('music'),
            includeStats: selectedCoreMods.includes('server_stats'),
            includeGateway: selectedCoreMods.includes('gateway'),
          }),
        });
        return res.json();
      }
    );
  };

  const handleClearServer = async () => {
    setClearDialogOpen(false);
    await runTrackedBuild(
      'Resetting Server Channels',
      getClearStages(keepGeneral),
      'All old channels cleared successfully.',
      async () => {
        const res = await fetch(`/api/guilds/${guildId}/architect/clear`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ keepFreshGeneral: keepGeneral }),
        });
        return res.json();
      }
    );
  };

  if (loading && templates.length === 0 && legoModules.length === 0) return <ArchitectSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        category="CHANNELS & TEMPLATES"
        title="Template Builder"
        description="Deploy ready-made server layouts or assemble custom channel modules in one click."
      />

      <MdTabs
        activeIndex={tabIndex}
        onChange={handleTabChange}
        tabs={[
          { id: 'templates', label: 'Server Templates', icon: 'dashboard_customize' },
          { id: 'lego', label: 'Modular Builder', icon: 'view_quilt' },
          { id: 'danger', label: 'Reset Channels', icon: 'delete_sweep' },
        ]}
      />

      {tabIndex === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates.map((tpl) => {
            const meta = TEMPLATE_META[tpl.key] || {
              name: tpl.name || tpl.label || tpl.key,
              description: tpl.description || 'Complete Discord server layout with organized categories and roles.',
              badge: 'Preset',
              tone: 'blurple' as const,
              icon: 'forum',
            };
            const displayName = tpl.name || meta.name;
            const displayDesc = tpl.description || meta.description;
            const enrichedTpl = { ...tpl, displayName, displayDesc, meta };

            return (
              <SurfaceCard
                key={tpl.key}
                className="p-4 flex flex-col justify-between gap-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[var(--md-elevation-card-hover)]"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-lg bg-discord-blurple text-white flex items-center justify-center shrink-0 shadow-xs">
                      <MdIcon name={meta.icon} className="text-2xl" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-normal text-sm text-discord-white truncate leading-tight">
                        {displayName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Badge label="Preset" tone="green" />
                        <Badge label={meta.badge} tone={meta.tone} />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-discord-muted font-normal leading-relaxed">
                    {displayDesc}
                  </p>

                  <div className="min-h-[20px] flex items-center gap-3 text-xs text-discord-muted font-normal">
                    <span>{tpl.categoryCount} categories</span>
                    <span>•</span>
                    <span>{tpl.channelCount} channels</span>
                    <span>•</span>
                    <span>{tpl.rolesCount} roles</span>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-discord-border flex items-center gap-2">
                  <MdButton
                    variant="filled"
                    size="md"
                    className="flex-1"
                    disabled={executing}
                    onClick={() => openApplyModal(enrichedTpl)}
                  >
                    Apply Template
                  </MdButton>
                  {tpl.specPreview && (
                    <MdButton
                      variant="tonal"
                      size="md"
                      icon="visibility"
                      disabled={executing}
                      onClick={() => setPreviewTemplate(enrichedTpl)}
                    >
                      Preview
                    </MdButton>
                  )}
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      )}

      {tabIndex === 1 && (
        <div className="flex flex-col gap-6">
          <SurfaceCard className="p-4 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-discord-border">
              <div>
                <h3 className="text-sm font-normal text-discord-white">Feature Modules</h3>
                <p className="text-xs text-discord-muted font-normal mt-0.5">
                  Configure built-in server modules and optional channel packs for your custom server layout.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge size="md" label={`${totalSelectedModulesCount} Selected`} tone="blurple" />
                <MdButton
                  variant="text"
                  size="sm"
                  onClick={() => {
                    if (allModulesSelected) {
                      if (selectedCoreMods.length > 0) {
                        setPendingCoreConfirm({ type: 'all' });
                      } else {
                        setSelectedMods([]);
                      }
                    } else {
                      setSelectedCoreMods(CORE_MODULES.map((m) => m.id));
                      setSelectedMods(legoModules.map((m) => m.id));
                    }
                  }}
                >
                  {allModulesSelected ? 'Clear All' : 'Select All'}
                </MdButton>
              </div>
            </div>

            {/* Built-in Core Modules Section */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-normal text-discord-white">Built-in Server Modules</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {CORE_MODULES.map((mod) => (
                  <ModuleOptionCard
                    key={mod.id}
                    mod={mod}
                    isSelected={selectedCoreMods.includes(mod.id)}
                    onToggle={() => toggleCoreModule(mod.id)}
                    onPreview={() => openModulePreview(mod)}
                  />
                ))}
              </div>
            </div>

            {/* Standard Feature Modules Section */}
            <div className="flex flex-col gap-3 pt-1">
              <h4 className="text-xs font-normal text-discord-white">Channel & Activity Modules</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {legoModules.map((mod) => (
                  <ModuleOptionCard
                    key={mod.id}
                    mod={mod}
                    isSelected={selectedMods.includes(mod.id)}
                    onToggle={() => toggleFeatureModule(mod.id)}
                    onPreview={() => openModulePreview(mod)}
                  />
                ))}
              </div>
            </div>
          </SurfaceCard>

          {/* Selected Modules & Channels Live Preview Section (Collapsible via Reusable SurfaceCard) */}
          <SurfaceCard
            collapsible
            defaultOpen={true}
            title="Selected Layout Preview"
            subtitle="Live overview of the selected modules, categories, and channels that will be created on your server."
            headerAction={
              <div className="flex items-center gap-2.5">
                <span className="hidden sm:inline text-xs text-discord-muted font-normal">
                  {customLayoutPreview.activeLabels.length} modules • {customPreviewGroups.length} categories •{' '}
                  {customLayoutPreview.channelCount} channels
                </span>
                {isOrderCustomized && (
                  <MdButton
                    variant="tonal"
                    size="xs"
                    onClick={() => {
                      setIsOrderCustomized(false);
                      setCustomPreviewGroups(customLayoutPreview.freshGroups);
                    }}
                  >
                    Reset Order
                  </MdButton>
                )}
              </div>
            }
          >
            <div className="flex flex-col gap-3.5">
              {customLayoutPreview.activeLabels.length > 0 && (
                <div className="text-xs text-discord-muted font-normal leading-relaxed">
                  Selected modules:{' '}
                  <span className="text-discord-text">
                    {customLayoutPreview.activeLabels.map((item) => item.label).join(', ')}
                  </span>
                </div>
              )}

              {customPreviewGroups.length > 0 ? (
                <ChannelTreePreview
                  groups={customPreviewGroups}
                  onGroupsChange={(next) => {
                    setIsOrderCustomized(true);
                    setCustomPreviewGroups(next);
                  }}
                  maxHeightClass="resize-y min-h-[200px] h-80 max-h-[80vh]"
                />
              ) : (
                <EmptyState
                  icon="view_quilt"
                  title="No modules selected"
                  description="Select one or more built-in or activity modules above to preview your server layout."
                  className="py-6"
                />
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-4 flex flex-col gap-4">
            <SwitchRow
              boxed
              label={customReplaceChannels ? 'Replace Existing Channels' : 'Merge with Existing Channels'}
              description={
                customReplaceChannels
                  ? 'Deletes all existing categories and channels before building this layout.'
                  : 'Adds new categories and channels while keeping your existing server structure intact.'
              }
              checked={customReplaceChannels}
              onChange={setCustomReplaceChannels}
              danger={customReplaceChannels}
            />

            <div className="pt-3.5 border-t border-discord-border flex justify-end">
              <MdButton
                variant="filled"
                icon="construction"
                onClick={handleBuildLego}
                disabled={executing || totalSelectedModulesCount === 0}
              >
                Build Custom Layout ({totalSelectedModulesCount} Modules)
              </MdButton>
            </div>
          </SurfaceCard>
        </div>
      )}

      {tabIndex === 2 && (
        <SurfaceCard className="p-4 flex flex-col gap-4">
          <div className="flex items-end gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-discord-red/15 text-discord-red flex items-center justify-center shrink-0">
              <MdIcon name="delete_sweep" className="text-2xl" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-normal text-discord-white leading-tight">
                Reset All Server Channels
              </div>
              <p className="text-xs text-discord-muted font-normal mt-1 leading-relaxed">
                Permanently deletes all categories, text channels, and voice rooms in this Discord server so you can start from a clean slate.
              </p>
            </div>
          </div>

          <SwitchRow
            boxed
            label="Create a clean #general channel after clearing"
            description="Ensures the server retains a single default text channel after all existing channels are removed."
            checked={keepGeneral}
            onChange={setKeepGeneral}
          />

          <div className="pt-3.5 border-t border-discord-border flex justify-end">
            <MdButton
              variant="danger"
              icon="delete_forever"
              disabled={executing}
              onClick={() => setClearDialogOpen(true)}
            >
              Clear All Channels
            </MdButton>
          </div>

          <ConfirmDialog
            open={clearDialogOpen}
            title="Permanently Clear All Channels?"
            message="This action will delete all categories and channels currently in this server. It cannot be undone."
            confirmLabel="Delete All Channels"
            danger
            loading={executing}
            onConfirm={handleClearServer}
            onClose={() => setClearDialogOpen(false)}
          />
        </SurfaceCard>
      )}

      {/* Apply Template Options Modal */}
      <MdDialog
        open={Boolean(applyModalTemplate)}
        onClose={() => setApplyModalTemplate(null)}
        headline={applyModalTemplate ? `Apply "${applyModalTemplate.displayName}"` : 'Apply Template'}
        actions={
          <>
            <MdButton variant="text" onClick={() => setApplyModalTemplate(null)}>
              Cancel
            </MdButton>
            {applyModalTemplate && (
              <MdButton
                variant="filled"
                disabled={executing}
                onClick={handleConfirmApplyTemplate}
              >
                Apply Template
              </MdButton>
            )}
          </>
        }
      >
        {applyModalTemplate && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-discord-surface">
              <div className="w-10 h-10 rounded-lg bg-discord-blurple text-white flex items-center justify-center shrink-0">
                <MdIcon name={applyModalTemplate.meta?.icon || 'forum'} className="text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-normal text-discord-white truncate leading-tight">
                  {applyModalTemplate.displayName}
                </div>
                <div className="text-xs text-discord-muted font-normal mt-1">
                  {applyModalTemplate.categoryCount} categories • {applyModalTemplate.channelCount} channels •{' '}
                  {applyModalTemplate.rolesCount} roles
                </div>
              </div>
            </div>

            {applyPreviewGroups.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-normal text-discord-white">Channel Preview</div>
                  {applyOrderCustomized && (
                    <MdButton
                      variant="tonal"
                      size="xs"
                      onClick={() => {
                        setApplyOrderCustomized(false);
                        setApplyPreviewGroups(
                          parseTemplatePreview(applyModalTemplate.specPreview, `tpl-${applyModalTemplate.key}`)
                        );
                      }}
                    >
                      Reset Order
                    </MdButton>
                  )}
                </div>
                <ChannelTreePreview
                  groups={applyPreviewGroups}
                  onGroupsChange={(next) => {
                    setApplyOrderCustomized(true);
                    setApplyPreviewGroups(next);
                  }}
                  maxHeightClass="max-h-60"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="text-xs font-normal text-discord-white">Channel Deployment Mode</div>

              <div
                role="radiogroup"
                aria-label="Channel Deployment Mode"
                className="flex flex-col gap-2"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={!applyReplace}
                  onClick={() => setApplyReplace(false)}
                  className={`relative overflow-hidden w-full text-left p-3.5 rounded-xl border-0 outline-none transition-colors duration-150 cursor-pointer flex items-center gap-3.5 select-none ${
                    !applyReplace
                      ? 'bg-discord-active'
                      : 'bg-discord-surface hover:bg-discord-card-hover'
                  }`}
                >
                  <md-ripple />
                  <span
                    className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-150 ${
                      !applyReplace ? 'bg-discord-blurple' : 'bg-discord-canvas/80'
                    }`}
                  >
                    <span
                      className={`rounded-full transition-all duration-150 ${
                        !applyReplace
                          ? 'w-2 h-2 bg-white scale-100'
                          : 'w-2 h-2 bg-discord-muted/40 scale-75'
                      }`}
                    />
                  </span>

                  <div className="relative z-10 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-normal text-discord-white leading-tight truncate">
                        Merge with Existing Channels
                      </span>
                      <Badge label="Recommended" tone="green" className="shrink-0" />
                    </div>
                    <p className="text-xs text-discord-muted font-normal mt-1 leading-relaxed">
                      Adds the template&apos;s categories and channels while keeping your existing server channels intact.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={applyReplace}
                  onClick={() => setApplyReplace(true)}
                  className={`relative overflow-hidden w-full text-left p-3.5 rounded-xl border-0 outline-none transition-colors duration-150 cursor-pointer flex items-center gap-3.5 select-none ${
                    applyReplace
                      ? 'bg-discord-red/12'
                      : 'bg-discord-surface hover:bg-discord-card-hover'
                  }`}
                >
                  <md-ripple />
                  <span
                    className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-150 ${
                      applyReplace ? 'bg-discord-red' : 'bg-discord-canvas/80'
                    }`}
                  >
                    <span
                      className={`rounded-full transition-all duration-150 ${
                        applyReplace
                          ? 'w-2 h-2 bg-white scale-100'
                          : 'w-2 h-2 bg-discord-muted/40 scale-75'
                      }`}
                    />
                  </span>

                  <div className="relative z-10 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`text-xs font-normal leading-tight truncate ${
                          applyReplace ? 'text-discord-red' : 'text-discord-white'
                        }`}
                      >
                        Replace Existing Channels
                      </span>
                      <Badge label="Destructive" tone="red" className="shrink-0" />
                    </div>
                    <p className="text-xs text-discord-muted font-normal mt-1 leading-relaxed">
                      Permanently deletes all current categories and channels first, then generates this layout from scratch.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-xs font-normal text-discord-white">Additional Setup Options</div>
              <SwitchRow
                boxed
                label="Create Template Roles"
                description="Automatically create and configure preset roles included in this template."
                checked={applyIncludeRoles}
                onChange={setApplyIncludeRoles}
              />
              <SwitchRow
                boxed
                label="Include Music Channel & Controls"
                description="Add a dedicated music request channel with interactive player buttons."
                checked={applyIncludeMusic}
                onChange={setApplyIncludeMusic}
              />
            </div>
          </div>
        )}
      </MdDialog>

      {/* Built-in Module Unselect Warning Modal */}
      <ConfirmDialog
        open={Boolean(pendingCoreConfirm)}
        title={
          pendingCoreConfirm?.type === 'all'
            ? 'Unselect Built-in Server Modules?'
            : pendingCoreConfirm
            ? `Unselect "${pendingCoreConfirm.mod.shortLabel || pendingCoreConfirm.mod.label}"?`
            : 'Unselect Built-in Module?'
        }
        message={
          pendingCoreConfirm?.type === 'all'
            ? 'Clearing all modules will also remove Built-in Server Modules (Server Stats and Gateway), which manage live member counters, rules, welcome greetings, and CAPTCHA verification.'
            : pendingCoreConfirm?.mod.id === 'server_stats'
            ? 'Server Stats provides live voice counters for date, online members, and total members. Without it, those automatic stat channels will not be created in this layout.'
            : 'Gateway provides essential onboarding channels including welcome greetings, rules, CAPTCHA verification, and self-role picking. Without it, new members will not see verification or onboarding channels in this layout.'
        }
        confirmLabel="Unselect Module"
        danger
        onConfirm={handleConfirmCoreUnselect}
        onClose={() => setPendingCoreConfirm(null)}
      />

      {/* Module Channel Preview Modal */}
      <MdDialog
        open={Boolean(previewModule)}
        onClose={() => setPreviewModule(null)}
        headline={previewModule ? `${previewModule.title} Channels` : 'Module Channels'}
        actions={
          <>
            <MdButton variant="text" onClick={() => setPreviewModule(null)}>
              Close
            </MdButton>
            {previewModule && (
              <MdButton
                variant="filled"
                onClick={() => {
                  if (previewModule.isCore) toggleCoreModule(previewModule.id);
                  else toggleFeatureModule(previewModule.id);
                  setPreviewModule(null);
                }}
              >
                {(
                  previewModule.isCore
                    ? selectedCoreMods.includes(previewModule.id)
                    : selectedMods.includes(previewModule.id)
                )
                  ? 'Unselect Module'
                  : 'Select Module'}
              </MdButton>
            )}
          </>
        }
      >
        {previewModule && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-xs text-discord-muted font-normal">
              <span>{previewModule.category}</span>
              <span>•</span>
              <span>{previewModule.channelCount} channels</span>
            </div>
            <ChannelTreePreview spec={previewModule.spec} maxHeightClass="min-h-[260px] max-h-[55vh]" />
          </div>
        )}
      </MdDialog>

      {/* Template Structure Preview Modal */}
      <MdDialog
        open={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        headline={previewTemplate ? `${previewTemplate.displayName} Structure` : 'Template Structure'}
        actions={
          <>
            <MdButton variant="text" onClick={() => setPreviewTemplate(null)}>
              Close
            </MdButton>
            {previewTemplate && (
              <MdButton
                variant="filled"
                disabled={executing}
                onClick={() => openApplyModal(previewTemplate)}
              >
                Apply Template
              </MdButton>
            )}
          </>
        }
      >
        {previewTemplate && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-xs text-discord-muted font-normal">
              <span>{previewTemplate.categoryCount} categories</span>
              <span>•</span>
              <span>{previewTemplate.channelCount} channels</span>
              <span>•</span>
              <span>{previewTemplate.rolesCount} roles</span>
            </div>
            <ChannelTreePreview spec={previewTemplate.specPreview} maxHeightClass="min-h-[360px] max-h-[58vh]" />
          </div>
        )}
      </MdDialog>

      {/* Fullscreen Blur & Game-Style Progression Loading Overlay (Template Builder Only) */}
      <div
        aria-hidden={!buildOverlay.active}
        className={`fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center p-6 transition-all duration-300 ease-out ${
          buildOverlay.active
            ? 'opacity-100 backdrop-blur-md bg-discord-canvas/60 pointer-events-auto'
            : 'opacity-0 backdrop-blur-none bg-transparent pointer-events-none'
        }`}
      >
        <div className="w-full max-w-md flex flex-col items-center text-center gap-5 select-none">
          <md-circular-progress indeterminate class="scale-125" />

          <div className="w-full flex flex-col gap-2.5">
            <div className="text-sm font-normal text-discord-white">
              {buildOverlay.title}
            </div>

            <md-linear-progress
              value={Math.min(1, Math.max(0, buildOverlay.progress / 100))}
              class="w-full rounded-full overflow-hidden"
            />

            <div className="flex items-center justify-between gap-3 text-xs font-normal text-discord-muted">
              <span className="truncate">{buildOverlay.statusText}</span>
              <span className="shrink-0 tabular-nums text-discord-white">
                {Math.round(buildOverlay.progress)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
