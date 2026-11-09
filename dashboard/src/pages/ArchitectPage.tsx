import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  MdButton,
  MdTextField,
  ArchitectSkeleton,
  MdIcon,
  MdTabs,
  ConfirmDialog,
  PageHeader,
  SurfaceCard,
  SwitchRow,
  toast,
} from '../components/ui';
import { useServerSwitch } from '../components/layout';

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

  const [selectedMods, setSelectedMods] = useState<string[]>(['news', 'chat', 'casual_voice']);
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
      if (data.success) toast.success(data.message);
      else toast.error(data.error || 'Failed to build template');
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
      if (data.success) toast.success('All old channels cleared successfully.');
      else toast.error(data.error || 'Failed to clear channels');
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
        description="Generate complete Discord server structures in seconds using 1-click preset templates or the custom Modular Builder."
      />

      <MdTabs
        activeIndex={tabIndex}
        onChange={handleTabChange}
        tabs={[
          { id: 'templates', label: 'Server Templates', icon: 'auto_awesome' },
          { id: 'lego', label: 'Modular Builder', icon: 'view_quilt' },
          { id: 'danger', label: 'Danger Zone', icon: 'warning' },
        ]}
      />

      {(tabIndex === 0 || tabIndex === 1) && (
        <SwitchRow
          label={replaceChannels ? 'Replace Mode (Delete Old Channels)' : 'Smart Merge Mode (Keep Existing Channels)'}
          description={
            replaceChannels
              ? 'Deletes all existing categories and channels before generating the new layout.'
              : 'Adds the new layout without deleting your current channels.'
          }
          checked={replaceChannels}
          onChange={setReplaceChannels}
          danger={replaceChannels}
          className={`px-4 py-3.5 rounded-xl border ${
            replaceChannels
              ? 'bg-discord-red/10 border-discord-red/30'
              : 'bg-discord-card border-discord-border'
          }`}
        />
      )}

      {tabIndex === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates.map((tpl) => (
            <SurfaceCard
              key={tpl.key}
              className="hover:border-discord-border-hover flex flex-col justify-between gap-5 transition-colors"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-discord-surface border border-discord-border flex items-center justify-center text-discord-blurple">
                    <MdIcon
                      name={
                        tpl.key === 'community'
                          ? 'public'
                          : tpl.key === 'games'
                          ? 'sports_esports'
                          : tpl.key === 'study'
                          ? 'menu_book'
                          : 'forum'
                      }
                      className="text-lg"
                    />
                  </div>
                  <h3 className="text-xs font-normal text-discord-white">{tpl.name}</h3>
                </div>
                <p className="text-xs text-discord-muted font-normal leading-relaxed mb-3">
                  {tpl.description}
                </p>

                <div className="flex gap-3 text-xs text-discord-blurple font-normal">
                  <span>{tpl.categoryCount} Categories</span>
                  <span>•</span>
                  <span>{tpl.channelCount} Channels</span>
                  <span>•</span>
                  <span>{tpl.rolesCount} Roles</span>
                </div>
              </div>

              <MdButton
                variant="filled"
                icon="bolt"
                disabled={executing}
                onClick={() => handleBuildTemplate(tpl.key)}
              >
                {executing ? 'Building...' : `Build ${tpl.name}`}
              </MdButton>
            </SurfaceCard>
          ))}
        </div>
      )}

      {tabIndex === 1 && (
        <div className="flex flex-col gap-6">
          <SurfaceCard>
            <h3 className="text-xs font-normal text-discord-white mb-1">Select Feature Modules</h3>
            <p className="text-xs text-discord-muted font-normal mb-4">
              Toggle the Lego modules you want to include in your custom server layout:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {legoModules.map((mod) => {
                const isSelected = selectedMods.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => {
                      if (isSelected) setSelectedMods((prev) => prev.filter((id) => id !== mod.id));
                      else setSelectedMods((prev) => [...prev, mod.id]);
                    }}
                    className={`flex flex-col justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-discord-active border-discord-blurple/50 text-discord-white'
                        : 'bg-discord-surface border-discord-border text-discord-muted hover:border-discord-border-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-normal text-xs text-discord-white">{mod.label}</span>
                      <MdIcon
                        name={isSelected ? 'check_box' : 'check_box_outline_blank'}
                        className={`text-base ${isSelected ? 'text-discord-blurple' : 'text-discord-muted'}`}
                      />
                    </div>
                    <span className="text-xs text-discord-muted font-normal mt-1.5 leading-relaxed">
                      {mod.description}
                    </span>
                  </div>
                );
              })}
            </div>
          </SurfaceCard>

          <SurfaceCard className="flex flex-col gap-4">
            <h3 className="text-xs font-normal text-discord-white">Add Custom Channels (Optional)</h3>
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

            <MdButton variant="filled" icon="construction" onClick={handleBuildLego} disabled={executing}>
              {executing ? 'Building Layout...' : `Build Custom Server (${selectedMods.length} Modules)`}
            </MdButton>
          </SurfaceCard>
        </div>
      )}

      {tabIndex === 2 && (
        <SurfaceCard className="border-discord-red/40 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-discord-red">
            <MdIcon name="warning" className="text-xl" />
            <h3 className="text-xs font-normal">Wipe All Server Channels</h3>
          </div>
          <p className="text-xs text-discord-muted font-normal">
            This will permanently delete every category, text channel, and voice channel on this Discord server.
          </p>

          <SwitchRow
            label="Create a clean #general text channel after clearing"
            checked={keepGeneral}
            onChange={setKeepGeneral}
            className="py-2"
          />

          <div>
            <MdButton
              variant="danger"
              icon="delete_forever"
              onClick={() => setClearDialogOpen(true)}
            >
              Clear All Server Channels
            </MdButton>
          </div>

          <ConfirmDialog
            open={clearDialogOpen}
            title="Permanently Clear All Channels?"
            message="This action will delete all categories and channels currently in this server. It cannot be undone."
            confirmLabel="Yes, Delete All Channels"
            danger
            onConfirm={handleClearServer}
            onClose={() => setClearDialogOpen(false)}
          />
        </SurfaceCard>
      )}
    </div>
  );
};
