import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
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
  StatusBadge,
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
    name: 'Gaming & Esports',
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

function stripLeadingEmoji(text?: string): string {
  if (!text) return '';
  return text.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D]+\s*/u, '').trim() || text;
}

export const ArchitectPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tabIndex, setTabIndex] = useState(0);
  const [templates, setTemplates] = useState<any[]>([]);
  const [legoModules, setLegoModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { registerServerFetch } = useServerSwitch();
  const [executing, setExecuting] = useState(false);

  const [replaceChannels, setReplaceChannels] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  const [selectedMods, setSelectedMods] = useState<string[]>(['news', 'chat', 'voice_casual']);
  const [customCat, setCustomCat] = useState('');
  const [customText, setCustomText] = useState('');
  const [customVoice, setCustomVoice] = useState('');
  const [customRoles, setCustomRoles] = useState('Admin, Moderator, Member, VIP');

  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [keepGeneral, setKeepGeneral] = useState(true);

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

  const handleBuildTemplate = async (templateKey: string) => {
    setExecuting(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/architect/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          templateKey,
          replace: replaceChannels,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setPreviewTemplate(null);
      } else {
        toast.error(data.error || 'Failed to build template');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleBuildLego = async () => {
    setExecuting(true);
    try {
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

      const res = await fetch(`/api/guilds/${guildId}/architect/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          selectedModules: selectedMods,
          customSpec,
          customRoles,
          replace: replaceChannels,
          includeMusic: selectedMods.includes('music'),
        }),
      });
      const data = await res.json();
      if (data.success) toast.success(data.message);
      else toast.error(data.error || 'Failed to build custom layout');
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleClearServer = async () => {
    setExecuting(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/architect/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keepFreshGeneral: keepGeneral }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('All old channels cleared successfully.');
        setClearDialogOpen(false);
      } else {
        toast.error(data.error || 'Failed to clear channels');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setExecuting(false);
    }
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

      {(tabIndex === 0 || tabIndex === 1) && (
        <SurfaceCard className="p-4">
          <SwitchRow
            label={replaceChannels ? 'Replace Existing Channels' : 'Merge with Existing Channels'}
            description={
              replaceChannels
                ? 'Deletes all existing categories and channels before deploying the new layout.'
                : 'Adds new categories and channels while keeping your existing server structure intact.'
            }
            checked={replaceChannels}
            onChange={setReplaceChannels}
            danger={replaceChannels}
          />
        </SurfaceCard>
      )}

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
                        <StatusBadge label="Preset" tone="green" variant="soft" />
                        <StatusBadge label={meta.badge} tone={meta.tone} variant="soft" />
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
                    onClick={() => handleBuildTemplate(tpl.key)}
                  >
                    {executing ? 'Building...' : 'Apply Template'}
                  </MdButton>
                  {tpl.specPreview && (
                    <MdButton
                      variant="tonal"
                      size="md"
                      icon="visibility"
                      onClick={() => setPreviewTemplate({ ...tpl, displayName })}
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
                <StatusBadge label={`${selectedMods.length} Selected`} tone="blurple" variant="soft" />
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
                            <StatusBadge
                              label={isSelected ? 'Selected' : 'Optional'}
                              tone={isSelected ? 'blurple' : 'neutral'}
                              variant="soft"
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

            <div className="pt-3.5 border-t border-discord-border flex justify-end">
              <MdButton
                variant="filled"
                icon="construction"
                onClick={handleBuildLego}
                disabled={executing || (selectedMods.length === 0 && !customCat.trim())}
              >
                {executing ? 'Building Layout...' : `Build Custom Layout (${selectedMods.length} Modules)`}
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
                <StatusBadge label="Destructive Action" tone="red" variant="soft" />
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
                onClick={() => handleBuildTemplate(previewTemplate.key)}
              >
                {executing ? 'Building...' : 'Apply Template'}
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
            <div className="p-3.5 rounded-xl bg-discord-surface border border-discord-border text-xs font-mono max-h-72 overflow-y-auto whitespace-pre-wrap text-discord-text leading-relaxed">
              {previewTemplate.specPreview}
            </div>
          </div>
        )}
      </MdDialog>
    </div>
  );
};
