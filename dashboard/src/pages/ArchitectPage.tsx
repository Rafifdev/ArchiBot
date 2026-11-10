import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Badge,
  MdButton,
  MdTextField,
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

function getCustomBuildStages(replace: boolean, hasCustomCat: boolean, includeMusic: boolean): BuildStage[] {
  const stages: BuildStage[] = [
    { progress: 12, text: 'Compiling selected modular layout...' },
    replace
      ? { progress: 28, text: 'Removing old categories and channels...' }
      : { progress: 28, text: 'Inspecting existing server layout for merge...' },
    { progress: 46, text: 'Creating custom roles and access rules...' },
    { progress: 64, text: 'Constructing modular categories and channels...' },
  ];

  if (hasCustomCat) {
    stages.push({ progress: 78, text: 'Adding custom text and voice channels...' });
  }
  if (includeMusic) {
    stages.push({ progress: 86, text: 'Deploying music request channel & controls...' });
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
  name: string;
  type: 'text' | 'voice' | 'jtc' | 'stage' | 'adminvoice';
  readOnly: boolean;
}

interface ParsedCategoryGroup {
  category: string | null;
  channels: ParsedChannelItem[];
}

function parseTemplatePreview(spec?: string): ParsedCategoryGroup[] {
  const groups: ParsedCategoryGroup[] = [];
  let current: ParsedCategoryGroup | null = null;

  for (const raw of String(spec ?? '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const catMatch = line.match(/^\[(.+)]$/);
    if (catMatch) {
      current = { category: catMatch[1].trim(), channels: [] };
      groups.push(current);
      continue;
    }

    let ch: ParsedChannelItem | null = null;
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
      current = { category: null, channels: [] };
      groups.push(current);
    }
    current.channels.push(ch);
  }

  return groups;
}

const ChannelTreePreview: React.FC<{ spec?: string; maxHeightClass?: string }> = ({
  spec,
  maxHeightClass = 'max-h-44',
}) => {
  const groups = parseTemplatePreview(spec);
  if (groups.length === 0) return null;

  return (
    <div
      className={`p-3 rounded-xl bg-discord-surface ${maxHeightClass} overflow-y-auto scrollbar-thin flex flex-col gap-3`}
    >
      {groups.map((group, gi) => (
        <div key={`${group.category || 'root'}-${gi}`} className="flex flex-col gap-0.5">
          {group.category && (
            <div className="flex items-center gap-1 px-1.5 pb-1 text-[11px] font-normal text-discord-muted uppercase tracking-wider">
              <MdIcon name="expand_more" className="text-sm leading-none" />
              <span className="truncate">{group.category}</span>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            {group.channels.map((ch, ci) => {
              const iconName =
                ch.type === 'jtc'
                  ? 'add_circle_outline'
                  : ch.type === 'stage'
                  ? 'podcasts'
                  : ch.type === 'voice' || ch.type === 'adminvoice'
                  ? 'volume_up'
                  : ch.readOnly
                  ? 'lock'
                  : 'tag';

              return (
                <div
                  key={`${ch.name}-${ci}`}
                  className="flex items-center justify-between gap-2 px-2 py-1 rounded-md text-xs font-normal text-discord-text"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MdIcon name={iconName} className="text-sm text-discord-muted shrink-0" />
                    <span className="truncate">{ch.name}</span>
                  </div>
                  {ch.readOnly && (
                    <span className="text-[10px] text-discord-muted shrink-0">Read-only</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
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
  const [applyModalTemplate, setApplyModalTemplate] = useState<any | null>(null);
  const [applyReplace, setApplyReplace] = useState(false);
  const [applyIncludeRoles, setApplyIncludeRoles] = useState(true);
  const [applyIncludeMusic, setApplyIncludeMusic] = useState(true);

  // Modular Builder state
  const [customReplaceChannels, setCustomReplaceChannels] = useState(false);
  const [selectedMods, setSelectedMods] = useState<string[]>(['news', 'chat', 'voice_casual']);
  const [customCat, setCustomCat] = useState('');
  const [customText, setCustomText] = useState('');
  const [customVoice, setCustomVoice] = useState('');
  const [customRoles, setCustomRoles] = useState('Admin, Moderator, Member, VIP');

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
          }),
        });
        return res.json();
      }
    );
  };

  const handleBuildLego = async () => {
    let customSpec = '';
    if (customCat.trim()) {
      customSpec = `[${customCat.trim()}]\n`;
      if (customText.trim()) {
        customText.split(',').forEach((c) => (customSpec += `💬・${c.trim()}\n`));
      }
      if (customVoice.trim()) {
        customVoice.split(',').forEach((v) => (customSpec += `voice: 🔊 ${v.trim()}\n`));
      }
    }

    await runTrackedBuild(
      'Building Custom Server Layout',
      getCustomBuildStages(customReplaceChannels, Boolean(customCat.trim()), selectedMods.includes('music')),
      'Custom server layout built successfully!',
      async () => {
        const res = await fetch(`/api/guilds/${guildId}/architect/setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            selectedModules: selectedMods,
            customSpec,
            customRoles,
            replace: customReplaceChannels,
            includeMusic: selectedMods.includes('music'),
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
          <SurfaceCard className="p-4 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-discord-border">
              <div>
                <h3 className="text-sm font-normal text-discord-white">Feature Modules</h3>
                <p className="text-xs text-discord-muted font-normal mt-0.5">
                  Select the channel groups to include in your custom server layout.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge label={`${selectedMods.length} Selected`} tone="blurple" />
                <MdButton
                  variant="text"
                  size="sm"
                  onClick={() =>
                    setSelectedMods(
                      selectedMods.length === legoModules.length ? [] : legoModules.map((m) => m.id)
                    )
                  }
                >
                  {selectedMods.length === legoModules.length ? 'Clear All' : 'Select All'}
                </MdButton>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {legoModules.map((mod) => {
                const isSelected = selectedMods.includes(mod.id);
                const cleanTitle = mod.shortLabel || stripLeadingEmoji(mod.label);
                const iconName = MODULE_ICONS[mod.id] || 'folder';
                const channelLines = mod.spec
                  ? String(mod.spec)
                      .split(/\r?\n/)
                      .filter((l: string) => l.trim().length > 0).length
                  : 0;

                return (
                  <SurfaceCard
                    key={mod.id}
                    onClick={() => {
                      if (isSelected) setSelectedMods((prev) => prev.filter((id) => id !== mod.id));
                      else setSelectedMods((prev) => [...prev, mod.id]);
                    }}
                    className={`p-4 flex flex-col justify-between gap-3 cursor-pointer select-none transition-all duration-150 ${
                      isSelected
                        ? 'border-discord-blurple bg-discord-blurple/5'
                        : 'hover:border-discord-border-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-discord-blurple text-white'
                              : 'bg-discord-surface border border-discord-border text-discord-muted'
                          }`}
                        >
                          <MdIcon name={iconName} className="text-lg" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-normal text-discord-white truncate leading-tight">
                            {cleanTitle}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge
                              label={isSelected ? 'Selected' : 'Optional'}
                              tone={isSelected ? 'blurple' : 'neutral'}
                            />
                          </div>
                        </div>
                      </div>

                      <MdIcon
                        name={isSelected ? 'check_circle' : 'radio_button_unchecked'}
                        className={`text-xl shrink-0 ${
                          isSelected ? 'text-discord-blurple' : 'text-discord-muted'
                        }`}
                      />
                    </div>

                    <p className="text-xs text-discord-muted font-normal leading-relaxed">
                      {mod.description}
                    </p>

                    <div className="pt-2.5 border-t border-discord-border flex items-center gap-2 text-xs text-discord-muted font-normal">
                      <span>{mod.category || 'CATEGORY'}</span>
                      {channelLines > 0 && (
                        <>
                          <span>•</span>
                          <span>{channelLines} channels</span>
                        </>
                      )}
                    </div>
                  </SurfaceCard>
                );
              })}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-4 flex flex-col gap-4">
            <div className="pb-3 border-b border-discord-border">
              <h3 className="text-sm font-normal text-discord-white">Custom Category & Roles</h3>
              <p className="text-xs text-discord-muted font-normal mt-0.5">
                Optionally append a custom category and initial roles to your generated layout.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <MdTextField
                label="Custom Category Name"
                value={customCat}
                onChange={setCustomCat}
                placeholder="e.g. VIP LOUNGE"
              />
              <MdTextField
                label="Text Channels (comma-separated)"
                value={customText}
                onChange={setCustomText}
                placeholder="vip-chat, announcements"
              />
              <MdTextField
                label="Voice Rooms (comma-separated)"
                value={customVoice}
                onChange={setCustomVoice}
                placeholder="VIP 1, VIP 2"
              />
            </div>

            <MdTextField
              label="Server Roles to Create (comma-separated)"
              value={customRoles}
              onChange={setCustomRoles}
              placeholder="Admin, Moderator, Member, VIP"
            />

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
                disabled={executing || (selectedMods.length === 0 && !customCat.trim())}
              >
                Build Custom Layout ({selectedMods.length} Modules)
              </MdButton>
            </div>
          </SurfaceCard>
        </div>
      )}

      {tabIndex === 2 && (
        <SurfaceCard className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-discord-red/15 text-discord-red flex items-center justify-center shrink-0">
              <MdIcon name="delete_sweep" className="text-2xl" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-normal text-discord-white leading-tight">
                Reset All Server Channels
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Badge label="Destructive Action" tone="red" />
              </div>
            </div>
          </div>

          <p className="text-xs text-discord-muted font-normal leading-relaxed">
            Permanently deletes all categories, text channels, and voice rooms in this Discord server so you can start from a clean slate.
          </p>

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

            {applyModalTemplate.specPreview && (
              <div className="flex flex-col gap-2">
                <div className="text-xs font-normal text-discord-white">Channel Preview</div>
                <ChannelTreePreview spec={applyModalTemplate.specPreview} maxHeightClass="max-h-60" />
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
            <ChannelTreePreview spec={previewTemplate.specPreview} maxHeightClass="max-h-72" />
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
