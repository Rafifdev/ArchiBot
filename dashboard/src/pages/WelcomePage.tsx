import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  ColorPickerField,
  DiscordMark,
  MdButton,
  MdChip,
  MdIcon,
  MdIconButton,
  MdSelect,
  MdSlider,
  MdSwitch,
  MdTextField,
  PageHeader,
  SettingsSkeleton,
  SurfaceCard,
  SwitchRow,
  toast,
  UnsavedChangesBar,
} from '../components/ui';
import { DiscordMessageComposer, GreetingDeliveryConfig } from '../components/features';
import { useServerSwitch } from '../components/layout';
import { ChannelItem, RoleItem, UserProfile } from '../types/api';

export interface OnboardingChannelItem {
  id: string;
  action: string;
  channelId: string;
}

type CardLayoutType = 'centered' | 'sidebar' | 'custom';
type CardBgType =
  | 'transparent'
  | 'midnight'
  | 'aurora'
  | 'sunset'
  | 'ocean'
  | 'forest'
  | 'nebula'
  | 'custom';

interface BgPreset {
  id: CardBgType;
  label: string;
  style: React.CSSProperties;
  stars?: boolean;
}

const CHECKERBOARD_STYLE: React.CSSProperties = {
  backgroundColor: '#171a22',
  backgroundImage:
    'linear-gradient(45deg, #212531 25%, transparent 25%), linear-gradient(-45deg, #212531 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #212531 75%), linear-gradient(-45deg, transparent 75%, #212531 75%)',
  backgroundSize: '18px 18px',
  backgroundPosition: '0 0, 0 9px, 9px -9px, -9px 0',
};

const BG_PRESETS: BgPreset[] = [
  {
    id: 'transparent',
    label: 'Transparent',
    style: CHECKERBOARD_STYLE,
  },
  {
    id: 'midnight',
    label: 'Midnight',
    stars: true,
    style: {
      background: 'radial-gradient(circle at 75% 22%, #29387a 0%, #141b42 48%, #0a0e24 100%)',
    },
  },
  {
    id: 'aurora',
    label: 'Aurora',
    stars: true,
    style: {
      background:
        'radial-gradient(ellipse at 50% 35%, rgba(45, 212, 191, 0.52) 0%, rgba(16, 185, 129, 0.28) 38%, #071921 85%)',
    },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    style: {
      background: 'linear-gradient(180deg, #2b1640 0%, #7c2d5a 45%, #d96b43 78%, #f5a642 100%)',
    },
  },
  {
    id: 'ocean',
    label: 'Ocean',
    style: {
      background:
        'radial-gradient(ellipse at 50% 0%, #1d7ca8 0%, #0c446a 48%, #061b30 100%)',
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    style: {
      background: 'linear-gradient(180deg, #1b4332 0%, #143124 55%, #0a1912 100%)',
    },
  },
  {
    id: 'nebula',
    label: 'Nebula',
    stars: true,
    style: {
      background:
        'radial-gradient(circle at 65% 42%, rgba(219, 39, 119, 0.55) 0%, rgba(109, 40, 217, 0.45) 42%, #110a1f 92%)',
    },
  },
];

const DEFAULT_CHANNEL_DELIVERY: GreetingDeliveryConfig = {
  content: 'Welcome {user} to **{server}**! You are member **#{memberCount}**.',
  embed: {
    enabled: true,
    color: '#5865F2',
    authorName: '',
    authorIconMode: 'none',
    authorIconUrl: '',
    title: '🛬 Welcome to {server}!',
    description: 'Glad to have you with us, {user}! Explore our channels and enjoy your stay.',
    thumbnailMode: 'member',
    thumbnailUrl: '',
    imageUrl: '',
    footerText: '{server} • Member #{memberCount}',
    footerIconMode: 'server',
    footerIconUrl: '',
    timestamp: true,
    fields: [],
  },
  cardEnabled: true,
  cardPlacement: 'attachment',
};

const DEFAULT_DM_DELIVERY: GreetingDeliveryConfig = {
  content: 'Welcome to **{server}**, {username}!',
  embed: {
    enabled: true,
    color: '#5865F2',
    authorName: '',
    authorIconMode: 'none',
    authorIconUrl: '',
    title: '👋 Welcome to {server}!',
    description:
      'Glad you joined **{server}**, {username}! Feel free to read our rules, pick your roles, and say hello.',
    thumbnailMode: 'server',
    thumbnailUrl: '',
    imageUrl: '',
    footerText: '{server}',
    footerIconMode: 'server',
    footerIconUrl: '',
    timestamp: false,
    fields: [],
  },
  cardEnabled: false,
  cardPlacement: 'attachment',
};

function getCardBackgroundStyle(bg: CardBgType, customBg: string): React.CSSProperties {
  if (bg === 'custom') {
    return {
      background: `linear-gradient(135deg, ${customBg} 0%, #0e1015 100%)`,
    };
  }
  const found = BG_PRESETS.find((p) => p.id === bg);
  return found ? found.style : BG_PRESETS[1].style;
}

export interface WelcomePageProps {
  user?: UserProfile | null;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ user }) => {
  const { guildId } = useParams<{ guildId: string }>();
  const { registerServerFetch } = useServerSwitch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingWelcome, setTestingWelcome] = useState(false);
  const [testingDm, setTestingDm] = useState(false);

  const [serverName, setServerName] = useState('Server');
  const [serverIconUrl, setServerIconUrl] = useState<string | null>(null);
  const [botName, setBotName] = useState('ArchiBot');
  const [botAvatar, setBotAvatar] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(1234);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [avatarBroken, setAvatarBroken] = useState(false);

  // 1. General Welcomer Settings
  const [welcomerEnabled, setWelcomerEnabled] = useState(true);
  const [autoRoleIds, setAutoRoleIds] = useState<string[]>([]);

  // 2. Welcome Card Design Settings
  const [cardLayout, setCardLayout] = useState<CardLayoutType>('centered');
  const [cardBg, setCardBg] = useState<CardBgType>('midnight');
  const [cardCustomBg, setCardCustomBg] = useState('#1E2238');
  const [cardDim, setCardDim] = useState(25);
  const [cardAccent, setCardAccent] = useState('#5865F2');
  const [cardTitle, setCardTitle] = useState('WELCOME');

  // 3. Welcome Messages (Channel & DM Rich Composers)
  const [messageEnabled, setMessageEnabled] = useState(true);
  const [welcomeChannelId, setWelcomeChannelId] = useState('');
  const [channelDelivery, setChannelDelivery] = useState<GreetingDeliveryConfig>(DEFAULT_CHANNEL_DELIVERY);

  const [dmEnabled, setDmEnabled] = useState(false);
  const [dmDelivery, setDmDelivery] = useState<GreetingDeliveryConfig>(DEFAULT_DM_DELIVERY);

  // 4. Onboarding Quick-Start Channels (Merged inside Welcome Message)
  const [onboardingEnabled, setOnboardingEnabled] = useState(true);
  const [onboardingChannels, setOnboardingChannels] = useState<OnboardingChannelItem[]>([
    { id: 'rules', action: 'read', channelId: '' },
    { id: 'verify', action: 'verify in', channelId: '' },
    { id: 'roles', action: 'pick your roles in', channelId: '' },
  ]);

  // Saved Snapshot to detect unsaved changes and allow reset
  const [savedSnapshot, setSavedSnapshot] = useState<{
    welcomerEnabled: boolean;
    autoRoleIds: string[];
    cardLayout: CardLayoutType;
    cardBg: CardBgType;
    cardCustomBg: string;
    cardDim: number;
    cardAccent: string;
    cardTitle: string;
    messageEnabled: boolean;
    welcomeChannelId: string;
    channelDelivery: GreetingDeliveryConfig;
    dmEnabled: boolean;
    dmDelivery: GreetingDeliveryConfig;
    onboardingEnabled: boolean;
    onboardingChannels: OnboardingChannelItem[];
  } | null>(null);

  useEffect(() => {
    setAvatarBroken(false);
  }, [user?.id, user?.avatar]);

  useEffect(() => {
    if (!guildId) return;
    setLoading(true);

    const p = Promise.all([
      fetch(`/api/guilds/${guildId}/settings`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/guilds/${guildId}/channels`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`/api/guilds/${guildId}/roles`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([setData, chanData, roleData]) => {
        if (setData.general) {
          setServerName(setData.general.name || 'Server');
          setServerIconUrl(setData.general.serverIcon || null);
          setBotName(setData.general.botName || 'ArchiBot');
          setBotAvatar(setData.general.botAvatar || null);
          if (setData.general.memberCount) setMemberCount(setData.general.memberCount);
        }

        let loadedOnboardingEnabled = true;
        let loadedOnboardingChannels: OnboardingChannelItem[] = [
          { id: 'rules', action: 'read', channelId: '' },
          { id: 'verify', action: 'verify in', channelId: '' },
          { id: 'roles', action: 'pick your roles in', channelId: '' },
        ];

        if (setData.welcome) {
          const w = setData.welcome;
          setWelcomerEnabled(Boolean(w.enabled));
          setAutoRoleIds(Array.isArray(w.autoRoleIds) ? w.autoRoleIds : []);
          setCardLayout((w.cardLayout as CardLayoutType) || 'centered');
          setCardBg((w.cardBg as CardBgType) || 'midnight');
          setCardCustomBg(w.cardCustomBg || '#1E2238');
          setCardDim(w.cardDim !== undefined ? Number(w.cardDim) : 25);
          setCardAccent(w.cardAccent || '#5865F2');
          setCardTitle(w.cardTitle || 'WELCOME');
          setMessageEnabled(w.messageEnabled !== undefined ? Boolean(w.messageEnabled) : true);
          setWelcomeChannelId(w.channelId || '');

          if (w.channelDelivery) {
            setChannelDelivery({
              ...DEFAULT_CHANNEL_DELIVERY,
              ...w.channelDelivery,
              embed: { ...DEFAULT_CHANNEL_DELIVERY.embed, ...(w.channelDelivery.embed || {}) },
            });
          }

          setDmEnabled(Boolean(w.dmEnabled));
          if (w.dmDelivery) {
            setDmDelivery({
              ...DEFAULT_DM_DELIVERY,
              ...w.dmDelivery,
              embed: { ...DEFAULT_DM_DELIVERY.embed, ...(w.dmDelivery.embed || {}) },
            });
          }

          loadedOnboardingEnabled = w.onboardingEnabled !== undefined ? Boolean(w.onboardingEnabled) : true;
          setOnboardingEnabled(loadedOnboardingEnabled);

          if (Array.isArray(w.onboardingChannels) && w.onboardingChannels.length > 0) {
            loadedOnboardingChannels = w.onboardingChannels.map((c: any, i: number) => ({
              id: c.id || `ob-${i}-${Date.now()}`,
              action: c.action || 'check out',
              channelId: c.channelId || '',
            }));
            setOnboardingChannels(loadedOnboardingChannels);
          } else if (setData.systemChannels) {
            const sc = setData.systemChannels;
            const seed: OnboardingChannelItem[] = [];
            if (sc.rulesId) seed.push({ id: 'rules', action: 'read', channelId: sc.rulesId });
            if (sc.verifyId) seed.push({ id: 'verify', action: 'verify in', channelId: sc.verifyId });
            if (sc.rolesPickId) seed.push({ id: 'roles', action: 'pick your roles in', channelId: sc.rolesPickId });
            if (seed.length > 0) {
              loadedOnboardingChannels = seed;
              setOnboardingChannels(seed);
            }
          }
        } else if (setData.systemChannels) {
          const sc = setData.systemChannels;
          const seed: OnboardingChannelItem[] = [];
          if (sc.rulesId) seed.push({ id: 'rules', action: 'read', channelId: sc.rulesId });
          if (sc.verifyId) seed.push({ id: 'verify', action: 'verify in', channelId: sc.verifyId });
          if (sc.rolesPickId) seed.push({ id: 'roles', action: 'pick your roles in', channelId: sc.rolesPickId });
          if (seed.length > 0) {
            loadedOnboardingChannels = seed;
            setOnboardingChannels(seed);
          }
        }

        if (chanData.channels) {
          setChannels(chanData.channels.filter((c: ChannelItem) => c.typeName === 'text'));
        }
        if (roleData.roles) {
          setRoles(roleData.roles);
        }

        const loadedWelcomerEnabled = Boolean(setData.welcome?.enabled);
        const loadedAutoRoleIds = Array.isArray(setData.welcome?.autoRoleIds) ? setData.welcome.autoRoleIds : [];
        const loadedCardLayout = (setData.welcome?.cardLayout as CardLayoutType) || 'centered';
        const loadedCardBg = (setData.welcome?.cardBg as CardBgType) || 'midnight';
        const loadedCardCustomBg = setData.welcome?.cardCustomBg || '#1E2238';
        const loadedCardDim = setData.welcome?.cardDim !== undefined ? Number(setData.welcome.cardDim) : 25;
        const loadedCardAccent = setData.welcome?.cardAccent || '#5865F2';
        const loadedCardTitle = setData.welcome?.cardTitle || 'WELCOME';
        const loadedMessageEnabled =
          setData.welcome?.messageEnabled !== undefined ? Boolean(setData.welcome.messageEnabled) : true;
        const loadedWelcomeChannelId = setData.welcome?.channelId || '';

        const loadedChannelDelivery: GreetingDeliveryConfig = setData.welcome?.channelDelivery
          ? {
              ...DEFAULT_CHANNEL_DELIVERY,
              ...setData.welcome.channelDelivery,
              embed: { ...DEFAULT_CHANNEL_DELIVERY.embed, ...(setData.welcome.channelDelivery.embed || {}) },
            }
          : DEFAULT_CHANNEL_DELIVERY;

        const loadedDmEnabled = Boolean(setData.welcome?.dmEnabled);
        const loadedDmDelivery: GreetingDeliveryConfig = setData.welcome?.dmDelivery
          ? {
              ...DEFAULT_DM_DELIVERY,
              ...setData.welcome.dmDelivery,
              embed: { ...DEFAULT_DM_DELIVERY.embed, ...(setData.welcome.dmDelivery.embed || {}) },
            }
          : DEFAULT_DM_DELIVERY;

        setSavedSnapshot({
          welcomerEnabled: loadedWelcomerEnabled,
          autoRoleIds: loadedAutoRoleIds,
          cardLayout: loadedCardLayout,
          cardBg: loadedCardBg,
          cardCustomBg: loadedCardCustomBg,
          cardDim: loadedCardDim,
          cardAccent: loadedCardAccent,
          cardTitle: loadedCardTitle,
          messageEnabled: loadedMessageEnabled,
          welcomeChannelId: loadedWelcomeChannelId,
          channelDelivery: loadedChannelDelivery,
          dmEnabled: loadedDmEnabled,
          dmDelivery: loadedDmDelivery,
          onboardingEnabled: loadedOnboardingEnabled,
          onboardingChannels: loadedOnboardingChannels,
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    registerServerFetch(p);
  }, [guildId, registerServerFetch]);

  const previewUser = useMemo(() => {
    const raw = user?.global_name || user?.username || 'Member';
    return raw.replace(' (Local Admin)', '').trim() || 'Member';
  }, [user?.global_name, user?.username]);

  const previewAvatarUrl = useMemo(() => {
    if (!user?.avatar) return null;
    if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
      return user.avatar;
    }
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  }, [user?.id, user?.avatar]);

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

  const optionalChannelOptions = useMemo(
    () => [
      { value: '', label: 'None (Disabled)' },
      ...sortedChannels.map((c) => ({ value: c.id, label: `#${c.name}` })),
    ],
    [sortedChannels]
  );

  const sortedAssignableRoles = useMemo(
    () =>
      roles
        .filter((r) => !r.isEveryone && !r.managed && r.editable)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [roles]
  );

  const availableAutoRoleOptions = useMemo(
    () => [
      { value: '', label: 'Select roles...' },
      ...sortedAssignableRoles
        .filter((r) => !autoRoleIds.includes(r.id))
        .map((r) => ({
          value: r.id,
          label: r.name,
          color: r.color && r.color !== '#000000' ? r.color : '#80848e',
        })),
    ],
    [sortedAssignableRoles, autoRoleIds]
  );

  const onboardingPreviewNote = useMemo(() => {
    if (!onboardingEnabled) return undefined;
    const findChName = (id: string) => channels.find((c) => c.id === id)?.name;
    const steps = onboardingChannels
      .filter((ch) => ch.channelId && findChName(ch.channelId))
      .map((ch) => `${ch.action || 'check out'} #${findChName(ch.channelId)}`);
    return steps.length ? `📌 Quick start: ${steps.join(' • ')}.` : undefined;
  }, [onboardingEnabled, onboardingChannels, channels]);

  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    if (welcomerEnabled !== savedSnapshot.welcomerEnabled) return true;
    if (JSON.stringify(autoRoleIds) !== JSON.stringify(savedSnapshot.autoRoleIds)) return true;
    if (cardLayout !== savedSnapshot.cardLayout) return true;
    if (cardBg !== savedSnapshot.cardBg) return true;
    if (cardCustomBg !== savedSnapshot.cardCustomBg) return true;
    if (cardDim !== savedSnapshot.cardDim) return true;
    if (cardAccent !== savedSnapshot.cardAccent) return true;
    if (cardTitle !== savedSnapshot.cardTitle) return true;
    if (messageEnabled !== savedSnapshot.messageEnabled) return true;
    if (welcomeChannelId !== savedSnapshot.welcomeChannelId) return true;
    if (JSON.stringify(channelDelivery) !== JSON.stringify(savedSnapshot.channelDelivery)) return true;
    if (dmEnabled !== savedSnapshot.dmEnabled) return true;
    if (JSON.stringify(dmDelivery) !== JSON.stringify(savedSnapshot.dmDelivery)) return true;
    if (onboardingEnabled !== savedSnapshot.onboardingEnabled) return true;
    if (JSON.stringify(onboardingChannels) !== JSON.stringify(savedSnapshot.onboardingChannels)) return true;
    return false;
  }, [
    savedSnapshot,
    welcomerEnabled,
    autoRoleIds,
    cardLayout,
    cardBg,
    cardCustomBg,
    cardDim,
    cardAccent,
    cardTitle,
    messageEnabled,
    welcomeChannelId,
    channelDelivery,
    dmEnabled,
    dmDelivery,
    onboardingEnabled,
    onboardingChannels,
  ]);

  if (loading && channels.length === 0 && roles.length === 0) {
    return <SettingsSkeleton />;
  }

  const buildWelcomePayloadState = () => ({
    enabled: welcomerEnabled,
    autoRoleIds,
    cardEnabled: channelDelivery.cardEnabled,
    cardLayout,
    cardBg,
    cardCustomBg,
    cardDim,
    cardAccent,
    cardTitle,
    messageEnabled,
    channelId: welcomeChannelId || null,
    message: channelDelivery.embed.description || channelDelivery.content,
    onboardingEnabled,
    onboardingChannels,
    channelDelivery,
    dmEnabled,
    dmMessage: dmDelivery.embed.description || dmDelivery.content,
    dmDelivery,
  });

  const handleAddAutoRole = (roleId: string) => {
    if (!roleId || autoRoleIds.includes(roleId)) return;
    setAutoRoleIds((prev) => [...prev, roleId]);
  };

  const handleRemoveAutoRole = (roleId: string) => {
    setAutoRoleIds((prev) => prev.filter((id) => id !== roleId));
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
          welcome: buildWelcomePayloadState(),
          systemChannels: {
            welcomeId: welcomeChannelId || null,
            rulesId:
              onboardingChannels.find(
                (c) => c.action?.toLowerCase().includes('read') || c.action?.toLowerCase().includes('rule')
              )?.channelId || null,
            verifyId:
              onboardingChannels.find((c) => c.action?.toLowerCase().includes('verify'))?.channelId || null,
            rolesPickId:
              onboardingChannels.find((c) => c.action?.toLowerCase().includes('role'))?.channelId || null,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedSnapshot({
          welcomerEnabled,
          autoRoleIds,
          cardLayout,
          cardBg,
          cardCustomBg,
          cardDim,
          cardAccent,
          cardTitle,
          messageEnabled,
          welcomeChannelId,
          channelDelivery,
          dmEnabled,
          dmDelivery,
          onboardingEnabled,
          onboardingChannels,
        });
        toast.success('Welcome message configuration saved successfully.');
      } else {
        toast.error(data.error || 'Failed to save configuration.');
      }
    } catch (err: any) {
      toast.error(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!savedSnapshot) return;
    setWelcomerEnabled(savedSnapshot.welcomerEnabled);
    setAutoRoleIds(savedSnapshot.autoRoleIds);
    setCardLayout(savedSnapshot.cardLayout);
    setCardBg(savedSnapshot.cardBg);
    setCardCustomBg(savedSnapshot.cardCustomBg);
    setCardDim(savedSnapshot.cardDim);
    setCardAccent(savedSnapshot.cardAccent);
    setCardTitle(savedSnapshot.cardTitle);
    setMessageEnabled(savedSnapshot.messageEnabled);
    setWelcomeChannelId(savedSnapshot.welcomeChannelId);
    setChannelDelivery(savedSnapshot.channelDelivery);
    setDmEnabled(savedSnapshot.dmEnabled);
    setDmDelivery(savedSnapshot.dmDelivery);
    setOnboardingEnabled(savedSnapshot.onboardingEnabled);
    setOnboardingChannels(savedSnapshot.onboardingChannels);
  };

  const handleTestWelcome = async () => {
    if (!guildId) return;
    setTestingWelcome(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/welcome/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          channelId: welcomeChannelId,
          welcome: buildWelcomePayloadState(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to send test welcome.');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setTestingWelcome(false);
    }
  };

  const handleTestDm = async () => {
    if (!guildId) return;
    setTestingDm(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/welcome/test-dm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          welcome: buildWelcomePayloadState(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to send test DM.');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setTestingDm(false);
    }
  };

  const renderAvatar = (sizeClass: string, ringColor?: string) => (
    <div
      className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center bg-discord-surface shrink-0 shadow-md`}
      style={{
        border: `2px solid ${ringColor || cardAccent || '#5865F2'}`,
      }}
    >
      {previewAvatarUrl && !avatarBroken ? (
        <img
          src={previewAvatarUrl}
          alt={previewUser}
          onError={() => setAvatarBroken(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <DiscordMark className="w-1/2 h-1/2 text-white" />
      )}
    </div>
  );

  const activeBgStyle = getCardBackgroundStyle(cardBg, cardCustomBg);
  const showStars = cardBg === 'midnight' || cardBg === 'aurora' || cardBg === 'nebula';

  const renderLiveWelcomeBanner = (maxWidthClass = 'max-w-xl', compact = false) => (
    <div
      className={`w-full ${maxWidthClass} aspect-[8/3] overflow-hidden relative flex items-center justify-center select-none ${
        compact ? 'rounded-lg' : 'rounded-xl border border-discord-border shadow-md'
      }`}
      style={activeBgStyle}
    >
      {showStars && (
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(1.5px 1.5px at 18% 26%, rgba(255,255,255,0.85), transparent), radial-gradient(1px 1px at 42% 18%, rgba(255,255,255,0.7), transparent), radial-gradient(1.5px 1.5px at 76% 32%, rgba(255,255,255,0.8), transparent), radial-gradient(1px 1px at 84% 72%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 26% 78%, rgba(255,255,255,0.65), transparent)',
          }}
        />
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none transition-opacity"
        style={{ backgroundColor: `rgba(6, 8, 15, ${cardDim / 100})` }}
      />

      {cardLayout === 'sidebar' ? (
        <div className={`relative z-10 flex items-center w-full max-w-md ${compact ? 'gap-4 px-5' : 'gap-6 px-8'}`}>
          {renderAvatar(compact ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-16 h-16 sm:w-20 sm:h-20', cardAccent)}
          <div className="min-w-0 flex flex-col">
            <span className="text-[11px] font-normal uppercase tracking-widest text-white/80">
              {cardTitle || 'WELCOME'}
            </span>
            <span className={`${compact ? 'text-sm sm:text-base' : 'text-base sm:text-xl'} font-normal text-white truncate mt-0.5`}>
              {previewUser}
            </span>
            <span className="text-xs font-normal text-white/80 mt-0.5">
              Member #{memberCount}
            </span>
          </div>
        </div>
      ) : (
        <div className={`relative z-10 flex flex-col items-center justify-center text-center ${compact ? 'px-4' : 'px-6'}`}>
          {renderAvatar(compact ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-16 h-16 sm:w-20 sm:h-20', cardAccent)}
          {cardLayout === 'custom' && cardTitle && (
            <span
              className="text-[10px] font-normal uppercase tracking-widest mt-1.5"
              style={{ color: cardAccent }}
            >
              {cardTitle}
            </span>
          )}
          <span className={`${compact ? 'text-sm sm:text-base mt-1.5' : 'text-base sm:text-xl mt-2'} font-normal text-white truncate max-w-xs`}>
            {previewUser}
          </span>
          <span className="text-xs font-normal text-white/80 mt-0.5">
            Member #{memberCount}
          </span>
        </div>
      )}
    </div>
  );

  const renderOnboardingSection = () => (
    <div className="flex flex-col gap-3 pt-1">
      <SwitchRow
        label="Onboarding Channels"
        description="Add quick-start channel links to guide new members to rules, verification, and roles right after joining."
        checked={onboardingEnabled}
        onChange={setOnboardingEnabled}
      />

      {onboardingEnabled && (
        <div className="flex flex-col gap-2.5 pt-1">
          {onboardingChannels.map((item, idx) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-xl bg-discord-surface/30 border border-discord-border/50"
            >
              <div className="w-full sm:w-44 shrink-0">
                <MdTextField
                  label="Action"
                  value={item.action}
                  placeholder="e.g. read, verify in"
                  onChange={(val) =>
                    setOnboardingChannels((prev) =>
                      prev.map((c, i) => (i === idx ? { ...c, action: val } : c))
                    )
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <MdSelect
                  label="Channel"
                  value={item.channelId}
                  onChange={(val) =>
                    setOnboardingChannels((prev) =>
                      prev.map((c, i) => (i === idx ? { ...c, channelId: val } : c))
                    )
                  }
                  options={optionalChannelOptions}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-end sm:justify-center">
                <MdIconButton
                  icon="delete"
                  title="Remove channel"
                  onClick={() =>
                    setOnboardingChannels((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="text-discord-muted hover:text-discord-red"
                />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-1">
            <MdButton
              variant="tonal"
              size="sm"
              icon="add"
              onClick={() =>
                setOnboardingChannels((prev) => [
                  ...prev,
                  { id: `ob-${Date.now()}`, action: 'check out', channelId: '' },
                ])
              }
            >
              Add Onboarding Channel
            </MdButton>
            <span className="text-xs text-discord-muted font-normal">
              {onboardingChannels.filter((c) => c.channelId).length} of {onboardingChannels.length} configured
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      <PageHeader
        title="Welcome Message"
        description="Greet new members with a welcome card, a channel message, a DM, and automatic roles."
      />

      {/* 1. Welcomer System */}
      <SurfaceCard
        title="Welcomer System"
        subtitle="Enable the welcomer system, control how it behaves, and assign roles to new members."
        headerAction={
          <MdSwitch
            checked={welcomerEnabled}
            onChange={setWelcomerEnabled}
          />
        }
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2.5 pt-1">
          <MdSelect
            label="Roles to Assign"
            value=""
            onChange={handleAddAutoRole}
            options={availableAutoRoleOptions}
          />
          {autoRoleIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {autoRoleIds.map((rId) => {
                const roleObj = roles.find((r) => r.id === rId);
                return (
                  <MdChip
                    key={rId}
                    variant="assist"
                    icon="close"
                    label={roleObj ? roleObj.name : rId}
                    onClick={() => handleRemoveAutoRole(rId)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </SurfaceCard>

      {/* 2. Welcome Card */}
      <SurfaceCard
        title="Welcome Card"
        subtitle="Pick a card layout and background for the generated welcome image."
        className="flex flex-col gap-5"
      >
        {/* Card Layout Selector */}
        <div className="flex flex-col gap-2.5">
          <div>
            <div className="text-xs font-normal text-discord-white">Card Layout</div>
            <p className="text-xs font-normal text-discord-muted mt-0.5">
              Choose a ready-made layout or customize the headline and accent ring color.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Centered Layout Option */}
            <button
              type="button"
              onClick={() => setCardLayout('centered')}
              className={`text-left rounded-xl p-3 border transition-all cursor-pointer bg-discord-surface/40 hover:bg-discord-surface/80 flex flex-col gap-2.5 ${
                cardLayout === 'centered'
                  ? 'border-discord-blurple ring-1 ring-discord-blurple/40 bg-discord-active/50'
                  : 'border-discord-border hover:border-discord-border-hover'
              }`}
            >
              <div
                className="h-28 w-full rounded-lg overflow-hidden relative flex flex-col items-center justify-center gap-1 border border-discord-border/60"
                style={BG_PRESETS[1].style}
              >
                {renderAvatar('w-10 h-10', '#5865F2')}
                <span className="text-xs font-normal text-white leading-tight mt-0.5 truncate max-w-[140px]">
                  {previewUser}
                </span>
                <span className="text-[10px] font-normal text-white/75 leading-none">
                  Member #{memberCount}
                </span>
              </div>
              <div>
                <div className="text-xs font-normal text-discord-white">Centered</div>
                <div className="text-[11px] font-normal text-discord-muted mt-0.5">
                  Avatar on top with the name below.
                </div>
              </div>
            </button>

            {/* Sidebar Layout Option */}
            <button
              type="button"
              onClick={() => setCardLayout('sidebar')}
              className={`text-left rounded-xl p-3 border transition-all cursor-pointer bg-discord-surface/40 hover:bg-discord-surface/80 flex flex-col gap-2.5 ${
                cardLayout === 'sidebar'
                  ? 'border-discord-blurple ring-1 ring-discord-blurple/40 bg-discord-active/50'
                  : 'border-discord-border hover:border-discord-border-hover'
              }`}
            >
              <div
                className="h-28 w-full rounded-lg overflow-hidden relative flex items-center justify-center gap-3.5 px-4 border border-discord-border/60"
                style={BG_PRESETS[1].style}
              >
                {renderAvatar('w-11 h-11', '#5865F2')}
                <div className="min-w-0 flex flex-col">
                  <span className="text-[9px] font-normal uppercase tracking-wider text-white/75">
                    WELCOME
                  </span>
                  <span className="text-xs font-normal text-white truncate max-w-[110px]">
                    {previewUser}
                  </span>
                  <span className="text-[10px] font-normal text-white/75">
                    Member #{memberCount}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs font-normal text-discord-white">Sidebar</div>
                <div className="text-[11px] font-normal text-discord-muted mt-0.5">
                  Avatar on the left, text on the right.
                </div>
              </div>
            </button>

            {/* Custom Layout Option */}
            <button
              type="button"
              onClick={() => setCardLayout('custom')}
              className={`text-left rounded-xl p-3 border transition-all cursor-pointer bg-discord-surface/40 hover:bg-discord-surface/80 flex flex-col gap-2.5 ${
                cardLayout === 'custom'
                  ? 'border-discord-blurple ring-1 ring-discord-blurple/40 bg-discord-active/50'
                  : 'border-discord-border hover:border-discord-border-hover'
              }`}
            >
              <div className="h-28 w-full rounded-lg bg-discord-surface border border-discord-border/80 flex flex-col items-center justify-center gap-1.5 text-discord-muted">
                <MdIcon name="edit" className="text-xl text-discord-blurple" />
                <span className="text-xs font-normal text-discord-text">Design your own card</span>
              </div>
              <div>
                <div className="text-xs font-normal text-discord-white">Custom</div>
                <div className="text-[11px] font-normal text-discord-muted mt-0.5">
                  Customize card headline and accent ring color.
                </div>
              </div>
            </button>
          </div>

          {cardLayout === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <MdTextField
                label="Card Headline Text"
                value={cardTitle}
                onChange={(val) => setCardTitle(val.slice(0, 22))}
                placeholder="WELCOME"
              />
              <ColorPickerField
                label="Avatar Ring & Card Accent Hex"
                value={cardAccent}
                onChange={setCardAccent}
              />
            </div>
          )}
        </div>

        {/* Background Presets */}
        <div className="flex flex-col gap-2.5">
          <div>
            <div className="text-xs font-normal text-discord-white">Background</div>
            <p className="text-xs font-normal text-discord-muted mt-0.5">
              Choose one of the built-in backgrounds or pick a custom color theme. The background covers the whole card.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BG_PRESETS.map((preset) => {
              const selected = cardBg === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setCardBg(preset.id)}
                  className={`h-28 rounded-xl overflow-hidden relative border transition-all cursor-pointer text-left p-3 flex items-end ${
                    selected
                      ? 'border-discord-blurple ring-1 ring-discord-blurple/50'
                      : 'border-discord-border hover:border-discord-border-hover'
                  }`}
                  style={preset.style}
                >
                  <span className="px-2.5 py-1 rounded-md bg-black/55 text-xs font-normal text-white backdrop-blur-xs">
                    {preset.label}
                  </span>
                </button>
              );
            })}

            {/* 8th Slot: Custom Background Color */}
            <button
              type="button"
              onClick={() => setCardBg('custom')}
              className={`h-28 rounded-xl overflow-hidden relative border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                cardBg === 'custom'
                  ? 'border-discord-blurple ring-1 ring-discord-blurple/50 bg-discord-active/50'
                  : 'border-discord-border-hover bg-discord-surface/40 hover:bg-discord-surface/80'
              }`}
              style={cardBg === 'custom' ? getCardBackgroundStyle('custom', cardCustomBg) : undefined}
            >
              <MdIcon name="palette" className="text-xl text-discord-blurple" />
              <span className="text-xs font-normal text-discord-text">Custom color</span>
            </button>
          </div>

          {cardBg === 'custom' && (
            <div className="max-w-sm pt-2">
              <ColorPickerField
                label="Custom Card Background Hex"
                value={cardCustomBg}
                onChange={setCardCustomBg}
                placeholder="#1E2238"
              />
            </div>
          )}
        </div>

        {/* Background Dim Slider */}
        <div className="flex flex-col gap-1.5 max-w-md">
          <div className="flex items-center justify-between text-xs font-normal">
            <span className="text-discord-white">Background Dim</span>
            <span className="text-discord-muted">{cardDim}%</span>
          </div>
          <MdSlider
            min={0}
            max={80}
            step={5}
            labeled
            value={cardDim}
            onChange={setCardDim}
            ariaLabel="Background Dim"
          />
        </div>

        {/* Live Card Preview */}
        <div className="flex flex-col gap-2.5">
          <div>
            <div className="text-xs font-normal text-discord-white">Preview</div>
            <p className="text-xs font-normal text-discord-muted mt-0.5">
              Exactly how your card will look when a member joins.
            </p>
          </div>
          {renderLiveWelcomeBanner('max-w-xl')}
        </div>
      </SurfaceCard>

      {/* 3. Public Channel Welcome Message */}
      <SurfaceCard
        title="Welcome Message"
        subtitle="Post a welcome message in a channel when a member joins."
        headerAction={
          <MdSwitch
            checked={messageEnabled}
            onChange={setMessageEnabled}
          />
        }
      >
        {messageEnabled && (
          <DiscordMessageComposer
            value={channelDelivery}
            onChange={setChannelDelivery}
            botName={botName}
            botAvatar={botAvatar}
            previewUser={previewUser}
            previewAvatarUrl={previewAvatarUrl}
            serverName={serverName}
            serverIconUrl={serverIconUrl}
            memberCount={memberCount}
            extraPreviewFooterNote={onboardingPreviewNote}
            renderCardBanner={() => renderLiveWelcomeBanner('max-w-full', true)}
            leadingSlot={
              <MdSelect
                label="Welcome Channel"
                value={welcomeChannelId}
                onChange={setWelcomeChannelId}
                options={channelOptions}
              />
            }
            onboardingSlot={renderOnboardingSection()}
            testAction={{
              label: 'Send Test',
              loading: testingWelcome,
              disabled: !welcomeChannelId,
              icon: 'send',
              onClick: handleTestWelcome,
            }}
          />
        )}
      </SurfaceCard>

      {/* 4. Private Welcome DM */}
      <SurfaceCard
        title="Welcome DM"
        subtitle="Send a private direct message to new members when they join."
        headerAction={
          <MdSwitch
            checked={dmEnabled}
            onChange={setDmEnabled}
          />
        }
      >
        {dmEnabled && (
          <DiscordMessageComposer
            value={dmDelivery}
            onChange={setDmDelivery}
            botName={botName}
            botAvatar={botAvatar}
            previewUser={previewUser}
            previewAvatarUrl={previewAvatarUrl}
            serverName={serverName}
            serverIconUrl={serverIconUrl}
            memberCount={memberCount}
            renderCardBanner={() => renderLiveWelcomeBanner('max-w-full', true)}
            testAction={{
              label: 'Send Test DM',
              loading: testingDm,
              icon: 'mail',
              onClick: handleTestDm,
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
