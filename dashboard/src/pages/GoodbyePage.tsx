import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  MdSelect,
  MdSwitch,
  PageHeader,
  SettingsSkeleton,
  SurfaceCard,
  toast,
  UnsavedChangesBar,
} from '../components/ui';
import { DiscordMessageComposer, GreetingDeliveryConfig } from '../components/features';
import { useServerSwitch } from '../components/layout';
import { ChannelItem, UserProfile } from '../types/api';

const DEFAULT_GOODBYE_DELIVERY: GreetingDeliveryConfig = {
  content: '**{member.username}** has left **{guild.name}**.',
  embed: {
    enabled: false,
    color: '#5865F2',
    authorName: '',
    authorIconMode: 'none',
    authorIconUrl: '',
    title: '',
    description: '',
    thumbnailMode: 'none',
    thumbnailUrl: '',
    imageUrl: '',
    footerText: '',
    footerIconMode: 'none',
    footerIconUrl: '',
    timestamp: false,
    fields: [],
  },
  cardEnabled: false,
  cardPlacement: 'attachment',
};

interface SavedGoodbyeConfig {
  enabled: boolean;
  channelId: string;
  delivery: GreetingDeliveryConfig;
}

export interface GoodbyePageProps {
  user?: UserProfile | null;
}

export const GoodbyePage: React.FC<GoodbyePageProps> = ({ user }) => {
  const { guildId } = useParams<{ guildId: string }>();
  const { registerServerFetch } = useServerSwitch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingGoodbye, setTestingGoodbye] = useState(false);

  const [serverName, setServerName] = useState('Server');
  const [memberCount, setMemberCount] = useState(1234);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [botName, setBotName] = useState('Tickety');
  const [botAvatar, setBotAvatar] = useState<string | null>(null);

  // Goodbye Configuration State
  const [goodbyeEnabled, setGoodbyeEnabled] = useState(true);
  const [goodbyeChannelId, setGoodbyeChannelId] = useState('');
  const [delivery, setDelivery] = useState<GreetingDeliveryConfig>(DEFAULT_GOODBYE_DELIVERY);

  // Saved Snapshot to detect unsaved changes and allow reset
  const [savedConfig, setSavedConfig] = useState<SavedGoodbyeConfig | null>(null);

  useEffect(() => {
    if (!guildId) return;
    setLoading(true);

    const p = Promise.all([
      fetch(`/api/guilds/${guildId}/settings`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/guilds/${guildId}/channels`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([setData, chanData]) => {
        if (setData.general) {
          setServerName(setData.general.name || 'Server');
          setBotName(setData.general.botName || 'Tickety');
          setBotAvatar(setData.general.botAvatar || null);
          if (setData.general.memberCount) setMemberCount(setData.general.memberCount);
        }

        const initialEnabled = setData.goodbye ? Boolean(setData.goodbye.enabled) : true;
        const initialChannel = setData.goodbye?.channelId || '';
        let initialDelivery: GreetingDeliveryConfig = DEFAULT_GOODBYE_DELIVERY;

        if (setData.goodbye?.delivery) {
          initialDelivery = setData.goodbye.delivery;
        } else if (setData.goodbye?.message) {
          initialDelivery = {
            ...DEFAULT_GOODBYE_DELIVERY,
            content: setData.goodbye.message,
          };
        }

        setGoodbyeEnabled(initialEnabled);
        setGoodbyeChannelId(initialChannel);
        setDelivery(initialDelivery);
        setSavedConfig({
          enabled: initialEnabled,
          channelId: initialChannel,
          delivery: initialDelivery,
        });

        if (chanData.channels) {
          setChannels(chanData.channels.filter((c: ChannelItem) => c.typeName === 'text'));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    registerServerFetch(p);
  }, [guildId, registerServerFetch]);

  const previewUser = useMemo(() => {
    const raw = user?.global_name || user?.username || 'Member';
    return raw.replace(' (Local Admin)', '').trim() || 'Member';
  }, [user?.global_name, user?.username]);

  const sortedChannels = useMemo(
    () => [...channels].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [channels]
  );

  const channelOptions = useMemo(
    () => [
      { value: '', label: 'Select a channel...' },
      ...sortedChannels.map((c) => ({ value: c.id, label: `#${c.name}` })),
    ],
    [sortedChannels]
  );

  const isDirty = useMemo(() => {
    if (!savedConfig) return false;
    if (goodbyeEnabled !== savedConfig.enabled) return true;
    if (goodbyeChannelId !== savedConfig.channelId) return true;
    return JSON.stringify(delivery) !== JSON.stringify(savedConfig.delivery);
  }, [savedConfig, goodbyeEnabled, goodbyeChannelId, delivery]);

  if (loading && channels.length === 0) {
    return <SettingsSkeleton />;
  }

  const handleReset = () => {
    if (!savedConfig) return;
    setGoodbyeEnabled(savedConfig.enabled);
    setGoodbyeChannelId(savedConfig.channelId);
    setDelivery(savedConfig.delivery);
  };

  const handleSave = async () => {
    if (!guildId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          goodbye: {
            enabled: goodbyeEnabled,
            channelId: goodbyeChannelId || null,
            message: delivery.content || '**{member.username}** has left **{guild.name}**.',
            delivery,
          },
          systemChannels: {
            goodbyeId: goodbyeChannelId || null,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedConfig({
          enabled: goodbyeEnabled,
          channelId: goodbyeChannelId,
          delivery,
        });
        toast.success('Goodbye message settings saved successfully.');
      } else {
        toast.error(data.error || 'Failed to save configuration.');
      }
    } catch (err: any) {
      toast.error(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestGoodbye = async () => {
    if (!guildId) return;
    setTestingGoodbye(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/goodbye/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          channelId: goodbyeChannelId,
          goodbye: {
            enabled: goodbyeEnabled,
            channelId: goodbyeChannelId,
            message: delivery.content,
            delivery,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to send test leave message.');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setTestingGoodbye(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      <PageHeader
        title="Leave Message"
        description="A message posted when a member leaves."
      />

      <SurfaceCard
        title="Leave Message"
        subtitle="A message posted when a member leaves."
        headerAction={
          <MdSwitch
            checked={goodbyeEnabled}
            onChange={setGoodbyeEnabled}
          />
        }
      >
        {goodbyeEnabled && (
          <DiscordMessageComposer
            value={delivery}
            onChange={setDelivery}
            botName={botName}
            botAvatar={botAvatar}
            previewUser={previewUser}
            serverName={serverName}
            memberCount={Math.max(1, memberCount - 1)}
            showCardSection={false}
            contentPlaceholder="**{member.username}** has left **{guild.name}**."
            leadingSlot={
              <MdSelect
                label="Leave Channel"
                value={goodbyeChannelId}
                onChange={setGoodbyeChannelId}
                options={channelOptions}
              />
            }
            testAction={{
              label: 'Send Test',
              loading: testingGoodbye,
              disabled: !goodbyeChannelId,
              icon: 'outbox',
              onClick: handleTestGoodbye,
            }}
          />
        )}
      </SurfaceCard>

      {/* Floating Unsaved Changes Modal Bar at Bottom Center */}
      <UnsavedChangesBar
        show={isDirty}
        onReset={handleReset}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
};
