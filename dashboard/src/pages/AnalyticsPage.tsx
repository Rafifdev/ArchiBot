import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AnalyticsSkeleton,
  StatusBadge,
  BadgeTone,
  EmptyState,
  MdButton,
  MdDivider,
  MdIcon,
  MdTabs,
  PageHeader,
  SurfaceCard,
  toast,
} from '../components/ui';
import { useServerSwitch } from '../components/layout';

type PeriodOption = 7 | 14 | 30;
type AnalyticsModuleId =
  | 'verification'
  | 'welcomer'
  | 'voice'
  | 'channels'
  | 'roles'
  | 'milestones';

interface DailyBucket {
  date: string;
  label: string;
  joins: number;
  verifiedJoins: number;
  channelsCreated: number;
  rolesCreated: number;
}

interface AnalyticsData {
  periodDays: number;
  dailyBuckets: DailyBucket[];
  summary: {
    memberCount: number;
    humanCount: number;
    botCount: number;
    onlineCount: number;
    boostCount: number;
    boostTier: number;
  };
  verification: {
    configured: boolean;
    verifiedRoleId: string | null;
    verifiedRoleName: string | null;
    rulesChannelId: string | null;
    rulesChannelName: string | null;
    verifiedMembers: number;
    unverifiedMembers: number;
    verificationRate: number | null;
    verifiedInPeriod: number;
    antiInvite: boolean;
    antiSpam: boolean;
  };
  welcomer: {
    welcomeEnabled: boolean;
    welcomeChannelName: string | null;
    cardEnabled: boolean;
    dmEnabled: boolean;
    autoRolesCount: number;
    goodbyeEnabled: boolean;
    goodbyeChannelName: string | null;
    joinsInPeriod: number;
  };
  voice: {
    hubsCount: number;
    tempRoomsCount: number;
    totalVoiceChannels: number;
    stageChannels: number;
    totalVoiceConnected: number;
    hubs: { id: string; name: string; categoryName: string; connectedCount: number }[];
    tempRooms: {
      id: string;
      name: string;
      ownerId: string;
      connectedCount: number;
      hasWaitingRoom: boolean;
    }[];
  };
  structure: {
    totalChannels: number;
    textChannels: number;
    voiceChannels: number;
    categories: number;
    stageChannels: number;
    announcementChannels: number;
    forumChannels: number;
    totalRoles: number;
    hoistedRoles: number;
    managedRoles: number;
    customRoles: number;
    coloredRoles: number;
    channelsCreatedInPeriod: number;
    rolesCreatedInPeriod: number;
  };
  backupsAndMilestones: {
    backupsCount: number;
    backups: {
      slug: string;
      label: string;
      createdAt: string | null;
      categoriesCount: number;
      channelsCount: number;
      rolesCount: number;
    }[];
    milestoneTargets: number[];
    reachedCount: number;
    nextMilestone: number | null;
    lastMilestoneReached: number;
    milestoneChannelName: string | null;
  };
}

interface TopKpiItem {
  icon: string;
  label: string;
  value: string | number;
  subtext: string;
  tone?: BadgeTone;
}

interface SnapshotCardItem {
  label: string;
  value: string | number;
  subtext: string;
  dotColor: string;
}

interface ChartLegendItem {
  label: string;
  tone: BadgeTone;
  dashed?: boolean;
}

interface ChartSeriesPoint {
  label: string;
  primary: number;
  secondary?: number;
}

interface ChartCardConfig {
  title: string;
  subtitle: string;
  legends: ChartLegendItem[];
  emptyIcon: string;
  emptyText: string;
  points: ChartSeriesPoint[];
  primaryColorClass: string;
  secondaryColorClass?: string;
}

interface BreakdownRowItem {
  label: string;
  subtext?: string;
  value: string | number;
  tone?: BadgeTone;
}

const MODULE_TABS: { id: AnalyticsModuleId; label: string; icon: string }[] = [
  { id: 'verification', label: 'Verification & Auto-Mod', icon: 'verified_user' },
  { id: 'welcomer', label: 'Welcomer & Leave', icon: 'waving_hand' },
  { id: 'voice', label: 'Dynamic Voice Hubs', icon: 'spatial_audio_off' },
  { id: 'channels', label: 'Channels & Categories', icon: 'deployed_code' },
  { id: 'roles', label: 'Roles & Hierarchy', icon: 'badge' },
  { id: 'milestones', label: 'Milestones & Backups', icon: 'emoji_events' },
];

function snowflakeToTimestamp(id?: string | null): number {
  if (!id || !/^\d+$/.test(id)) return 0;
  try {
    return Number((BigInt(id) >> 22n) + 1420070400000n);
  } catch {
    return 0;
  }
}

async function buildAnalyticsFromExistingRoutes(
  guildId: string,
  periodDays: PeriodOption
): Promise<AnalyticsData> {
  const [
    overviewRes,
    channelsRes,
    rolesRes,
    membersRes,
    voiceRes,
    backupsRes,
    settingsRes,
  ] = await Promise.all([
    fetch(`/api/guilds/${guildId}/overview`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(`/api/guilds/${guildId}/channels`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(`/api/guilds/${guildId}/roles`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(`/api/guilds/${guildId}/members?limit=200`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(`/api/guilds/${guildId}/voice`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(`/api/guilds/${guildId}/backups`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(`/api/guilds/${guildId}/settings`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  if (!overviewRes?.guild) {
    throw new Error('Failed to load server overview data');
  }

  const guild = overviewRes.guild;
  const guildConfig = guild.config || {};
  const settingsData = settingsRes?.settings || {};
  const channelsList: any[] = channelsRes?.channels || [];
  const rolesList: any[] = rolesRes?.roles || [];
  const membersList: any[] = membersRes?.members || [];
  const voiceHubsRaw: any[] = voiceRes?.hubs || [];
  const tempRoomsRaw: any[] = voiceRes?.tempRooms || [];
  const backupsRaw: any[] = backupsRes?.backups || [];

  const channelById = new Map<string, any>();
  channelsList.forEach((c) => channelById.set(c.id, c));

  const roleById = new Map<string, any>();
  rolesList.forEach((r) => roleById.set(r.id, r));

  const textChannels = channelsList.filter((c) => c.typeName === 'text').length;
  const voiceChannels = channelsList.filter((c) => c.typeName === 'voice').length;
  const categories = channelsList.filter((c) => c.typeName === 'category').length;
  const stageChannels = channelsList.filter((c) => c.typeName === 'stage').length;
  const announcementChannels = channelsList.filter((c) => c.typeName === 'announcement').length;
  const forumChannels = channelsList.filter((c) => c.typeName === 'forum').length;

  const verifiedRoleId: string | null =
    guildConfig.verifiedRoleId || settingsData.verifiedRoleId || null;

  let verifiedMembers = 0;
  for (const m of membersList) {
    if (!m.bot && verifiedRoleId && Array.isArray(m.roles)) {
      if (m.roles.some((r: any) => r.id === verifiedRoleId || r === verifiedRoleId)) {
        verifiedMembers++;
      }
    }
  }

  // Build daily timeline buckets
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const periodStartMs = startOfToday - (periodDays - 1) * dayMs;

  const dailyBuckets: DailyBucket[] = [];
  for (let i = 0; i < periodDays; i++) {
    const bucketStart = periodStartMs + i * dayMs;
    const bucketEnd = bucketStart + dayMs;
    const d = new Date(bucketStart);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    let joins = 0;
    let verifiedJoins = 0;
    for (const m of membersList) {
      if (!m.bot && m.joinedAt) {
        const joinedMs = new Date(m.joinedAt).getTime();
        if (joinedMs >= bucketStart && joinedMs < bucketEnd) {
          joins++;
          if (
            verifiedRoleId &&
            Array.isArray(m.roles) &&
            m.roles.some((r: any) => r.id === verifiedRoleId || r === verifiedRoleId)
          ) {
            verifiedJoins++;
          }
        }
      }
    }

    let channelsCreated = 0;
    for (const ch of channelsList) {
      const ts = snowflakeToTimestamp(ch.id);
      if (ts >= bucketStart && ts < bucketEnd) {
        channelsCreated++;
      }
    }

    let rolesCreated = 0;
    for (const r of rolesList) {
      if (r.id === guildId) continue;
      const ts = snowflakeToTimestamp(r.id);
      if (ts >= bucketStart && ts < bucketEnd) {
        rolesCreated++;
      }
    }

    dailyBuckets.push({
      date: d.toISOString().slice(0, 10),
      label,
      joins,
      verifiedJoins,
      channelsCreated,
      rolesCreated,
    });
  }

  const joinsInPeriod = dailyBuckets.reduce((acc, b) => acc + b.joins, 0);
  const verifiedInPeriod = dailyBuckets.reduce((acc, b) => acc + b.verifiedJoins, 0);
  const channelsCreatedInPeriod = dailyBuckets.reduce((acc, b) => acc + b.channelsCreated, 0);
  const rolesCreatedInPeriod = dailyBuckets.reduce((acc, b) => acc + b.rolesCreated, 0);

  // Verification
  const humanCount = Number(guild.humanCount ?? guild.memberCount ?? 0);
  const botCount = Number(guild.botCount ?? 0);
  const onlineCount = Number(guild.onlineCount ?? 0);
  const verifiedRoleObj = verifiedRoleId ? roleById.get(verifiedRoleId) : null;
  const rulesChannelId = guildConfig.rulesId || null;
  const rulesChannelObj = rulesChannelId ? channelById.get(rulesChannelId) : null;
  const unverifiedMembers = verifiedRoleId
    ? Math.max(0, humanCount - verifiedMembers)
    : humanCount;
  const verificationRate =
    verifiedRoleId && humanCount > 0
      ? Math.round((verifiedMembers / humanCount) * 100)
      : null;

  // Welcomer
  const welcomeCfg = settingsData.welcome || guildConfig.welcomeConfig || guildConfig.welcome || {};
  const goodbyeCfg = settingsData.goodbye || guildConfig.goodbyeConfig || guildConfig.goodbye || {};
  const welcomeChannelId = welcomeCfg.channelId || guildConfig.welcomeId || null;
  const goodbyeChannelId = goodbyeCfg.channelId || guildConfig.goodbyeId || null;
  const welcomeChannelObj = welcomeChannelId ? channelById.get(welcomeChannelId) : null;
  const goodbyeChannelObj = goodbyeChannelId ? channelById.get(goodbyeChannelId) : null;
  const welcomeEnabled = Boolean(welcomeCfg.enabled ?? welcomeChannelId);
  const goodbyeEnabled = Boolean(goodbyeCfg.enabled ?? goodbyeChannelId);
  const autoRolesList = Array.isArray(welcomeCfg.autoRoleIds)
    ? welcomeCfg.autoRoleIds
    : Array.isArray(welcomeCfg.roleIds)
    ? welcomeCfg.roleIds
    : guildConfig.memberRoleId
    ? [guildConfig.memberRoleId]
    : [];

  // Voice
  const hubsFormatted = voiceHubsRaw
    .filter((h) => h.exists !== false)
    .map((h) => {
      const parent = h.parentId ? channelById.get(h.parentId) : null;
      return {
        id: h.id,
        name: h.name,
        categoryName: parent ? parent.name : 'Uncategorized',
        connectedCount: 0,
      };
    });

  const tempRoomsFormatted = tempRoomsRaw.map((t) => ({
    id: t.id,
    name: t.name || 'Temp Voice',
    ownerId: t.ownerId || '',
    connectedCount: Number(t.memberCount || 0),
    hasWaitingRoom: Boolean(t.waitingRoomId),
  }));

  const totalVoiceConnected = tempRoomsFormatted.reduce(
    (acc, r) => acc + r.connectedCount,
    0
  );

  // Roles & Structure
  const nonEveryoneRoles = rolesList.filter((r) => r.id !== guildId && r.name !== '@everyone');
  const hoistedRoles = nonEveryoneRoles.filter((r) => r.hoist).length;
  const managedRoles = nonEveryoneRoles.filter((r) => r.managed).length;
  const customRoles = nonEveryoneRoles.filter((r) => !r.managed).length;
  const coloredRoles = nonEveryoneRoles.filter(
    (r) => r.color && r.color !== '#000000' && r.color !== 0
  ).length;

  // Backups & Milestones
  const backupsFormatted = backupsRaw.map((b) => {
    const specLines = String(b.spec || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const categoriesCount =
      specLines.filter((l) => l.startsWith('===') || l.endsWith(':')).length || 1;
    return {
      slug: b.slug,
      label: b.label || b.slug,
      createdAt: b.updatedAt || null,
      categoriesCount,
      channelsCount: Number(b.channelCount || 0),
      rolesCount: Number(b.rolesCount || 0),
    };
  });

  const rawGoals: number[] = Array.isArray(guildConfig.milestone?.goals)
    ? guildConfig.milestone.goals
    : Array.isArray(guildConfig.milestoneTargets)
    ? guildConfig.milestoneTargets
    : [10, 25, 50, 100, 250, 500];
  const milestoneTargets: number[] = [...new Set([...rawGoals, 50, 100, 250, 500])].sort(
    (a, b) => a - b
  );
  const memberCount = Number(guild.memberCount || 0);
  const nextMilestone = milestoneTargets.find((t) => t > memberCount) || null;
  const reachedMilestones = milestoneTargets.filter((t) => t <= memberCount);
  const msChannelId =
    guildConfig.milestone?.channelId ||
    guildConfig.milestoneChannelId ||
    guildConfig.welcomeId ||
    null;
  const milestoneChannelObj = msChannelId ? channelById.get(msChannelId) : null;
  const lastMilestoneReached = Number(
    guildConfig.milestone?.highestReached ||
      guildConfig.lastMilestoneReached ||
      (reachedMilestones.length > 0 ? reachedMilestones[reachedMilestones.length - 1] : 0)
  );

  return {
    periodDays,
    dailyBuckets,
    summary: {
      memberCount,
      humanCount,
      botCount,
      onlineCount,
      boostCount: Number(guild.premiumSubscriptionCount || 0),
      boostTier: Number(guild.premiumTier || 0),
    },
    verification: {
      configured: Boolean(verifiedRoleId),
      verifiedRoleId,
      verifiedRoleName: verifiedRoleObj?.name || null,
      rulesChannelId,
      rulesChannelName: rulesChannelObj?.name || null,
      verifiedMembers,
      unverifiedMembers,
      verificationRate,
      verifiedInPeriod,
      antiInvite: Boolean(
        settingsData.moderation?.antiInvite ??
          guildConfig.automod?.antiInvite ??
          guildConfig.antiInvite
      ),
      antiSpam: Boolean(
        settingsData.moderation?.antiSpam ??
          guildConfig.automod?.antiSpam ??
          guildConfig.antiSpam
      ),
    },
    welcomer: {
      welcomeEnabled,
      welcomeChannelName: welcomeChannelObj?.name || null,
      cardEnabled: Boolean(welcomeCfg.cardEnabled ?? true),
      dmEnabled: Boolean(welcomeCfg.dmEnabled),
      autoRolesCount: autoRolesList.length,
      goodbyeEnabled,
      goodbyeChannelName: goodbyeChannelObj?.name || null,
      joinsInPeriod,
    },
    voice: {
      hubsCount: hubsFormatted.length,
      tempRoomsCount: tempRoomsFormatted.length,
      totalVoiceChannels: voiceChannels,
      stageChannels,
      totalVoiceConnected,
      hubs: hubsFormatted,
      tempRooms: tempRoomsFormatted,
    },
    structure: {
      totalChannels: channelsList.length,
      textChannels,
      voiceChannels,
      categories,
      stageChannels,
      announcementChannels,
      forumChannels,
      totalRoles: nonEveryoneRoles.length,
      hoistedRoles,
      managedRoles,
      customRoles,
      coloredRoles,
      channelsCreatedInPeriod,
      rolesCreatedInPeriod,
    },
    backupsAndMilestones: {
      backupsCount: backupsFormatted.length,
      backups: backupsFormatted,
      milestoneTargets,
      reachedCount: reachedMilestones.length,
      nextMilestone,
      lastMilestoneReached,
      milestoneChannelName: milestoneChannelObj?.name || null,
    },
  };
}

export const AnalyticsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { registerServerFetch } = useServerSwitch();

  const initialTab = (searchParams.get('tab') as AnalyticsModuleId) || 'verification';
  const validInitialIndex = Math.max(
    0,
    MODULE_TABS.findIndex((t) => t.id === initialTab)
  );

  const [activeTabIndex, setActiveTabIndex] = useState<number>(validInitialIndex);
  const [period, setPeriod] = useState<PeriodOption>(7);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [chartLoading, setChartLoading] = useState<boolean>(false);

  const activeModule = MODULE_TABS[activeTabIndex]?.id || 'verification';

  const fetchAnalytics = useCallback(
    (selectedPeriod: PeriodOption, isManualRefresh = false) => {
      if (!guildId) return;
      if (isManualRefresh) {
        setRefreshing(true);
        setChartLoading(true);
      } else if (!data) {
        setLoading(true);
      } else {
        setChartLoading(true);
      }

      const minDelay = data ? new Promise((res) => setTimeout(res, 260)) : Promise.resolve();
      const apiFetch = fetch(`/api/guilds/${guildId}/analytics?period=${selectedPeriod}`, {
        credentials: 'include',
      })
        .then(async (r) => {
          if (r.ok) {
            return r.json();
          }
          // Fallback to aggregating live data from existing mounted routes
          return buildAnalyticsFromExistingRoutes(guildId, selectedPeriod);
        });

      const promise = Promise.all([apiFetch, minDelay])
        .then(([resData]) => {
          setData(resData as AnalyticsData);
          if (isManualRefresh) {
            toast.success('Analytics data refreshed.');
          }
        })
        .catch((err) => {
          toast.error(err.message || 'Could not load server analytics.');
        })
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
          setChartLoading(false);
        });

      if (!data && !isManualRefresh) {
        registerServerFetch(promise);
      }
    },
    [guildId, data, registerServerFetch]
  );

  useEffect(() => {
    fetchAnalytics(period, false);
  }, [guildId, period]);

  const handleTabChange = (idx: number) => {
    setActiveTabIndex(idx);
    const tabId = MODULE_TABS[idx]?.id;
    if (tabId) {
      setSearchParams({ tab: tabId }, { replace: true });
    }
  };

  // Build module-specific view configuration from live server analytics
  const moduleView = useMemo(() => {
    if (!data) return null;

    const buckets = data.dailyBuckets || [];
    const {
      verification,
      welcomer,
      voice,
      structure,
      backupsAndMilestones,
      summary,
    } = data;

    if (activeModule === 'verification') {
      const topKpis: TopKpiItem[] = [
        {
          icon: 'verified_user',
          label: 'All-time Verified',
          value: verification.verifiedMembers,
          subtext: verification.verifiedRoleName
            ? `holding @${verification.verifiedRoleName}`
            : 'human members verified',
        },
        {
          icon: 'person_search',
          label: 'Pending Verification',
          value: verification.unverifiedMembers,
          subtext: 'members without verified role',
        },
        {
          icon: 'shield',
          label: 'Auto-Mod Shields',
          value:
            (verification.antiInvite ? 1 : 0) + (verification.antiSpam ? 1 : 0) + ' / 2',
          subtext: 'Anti-Invite & Anti-Spam filters',
        },
        {
          icon: 'percent',
          label: 'Verification Rate',
          value:
            verification.verificationRate !== null
              ? `${verification.verificationRate}%`
              : 'No data',
          subtext: `${verification.unverifiedMembers} still awaiting verification`,
        },
      ];

      const snapshots: SnapshotCardItem[] = [
        {
          label: 'Period Joins',
          value: welcomer.joinsInPeriod,
          subtext: `Across selected ${period} days`,
          dotColor: 'bg-discord-blurple',
        },
        {
          label: 'Verified in Period',
          value: verification.verifiedInPeriod,
          subtext:
            verification.verifiedInPeriod > 0
              ? 'Passed verification gate'
              : 'None verified in period',
          dotColor: 'bg-discord-green',
        },
        {
          label: 'Period Pass Rate',
          value:
            welcomer.joinsInPeriod > 0
              ? `${Math.round((verification.verifiedInPeriod / welcomer.joinsInPeriod) * 100)}%`
              : 'No data',
          subtext: 'Join-to-verified ratio',
          dotColor: 'bg-discord-green',
        },
        {
          label: 'Gate Role',
          value: verification.verifiedRoleName ? `@${verification.verifiedRoleName}` : 'Unset',
          subtext: 'Granted after solving CAPTCHA',
          dotColor: verification.verifiedRoleName ? 'bg-discord-blurple' : 'bg-discord-yellow',
        },
        {
          label: 'Rules Channel',
          value: verification.rulesChannelName ? `#${verification.rulesChannelName}` : 'Unlinked',
          subtext: 'Rules guidance channel',
          dotColor: verification.rulesChannelName ? 'bg-discord-blurple' : 'bg-discord-muted',
        },
        {
          label: 'Daily Avg Verified',
          value: (verification.verifiedInPeriod / period).toFixed(1),
          subtext: `Per day over ${period} days`,
          dotColor: 'bg-discord-green',
        },
      ];

      const charts: ChartCardConfig[] = [
        {
          title: 'Verification Funnel Flow',
          subtitle: 'New member joins against members who completed verification',
          legends: [
            { label: 'Joined', tone: 'blurple' },
            { label: 'Verified', tone: 'green' },
          ],
          emptyIcon: 'verified_user',
          emptyText: 'No member joins in this period yet',
          points:
            welcomer.joinsInPeriod > 0
              ? buckets.map((b) => ({
                  label: b.label,
                  primary: b.joins,
                  secondary: b.verifiedJoins,
                }))
              : [],
          primaryColorClass: 'bg-discord-blurple',
          secondaryColorClass: 'bg-discord-green',
        },
        {
          title: 'Member Trust Distribution',
          subtitle: 'Verified human members compared to unverified accounts',
          legends: [
            { label: 'Verified', tone: 'green' },
            { label: 'Unverified', tone: 'red' },
          ],
          emptyIcon: 'gpp_maybe',
          emptyText: 'No verification role configured yet',
          points: verification.configured
            ? buckets.map((b, idx) => ({
                label: b.label,
                primary: idx === buckets.length - 1 ? verification.verifiedMembers : b.verifiedJoins,
                secondary:
                  idx === buckets.length - 1
                    ? verification.unverifiedMembers
                    : Math.max(0, b.joins - b.verifiedJoins),
              }))
            : [],
          primaryColorClass: 'bg-discord-green',
          secondaryColorClass: 'bg-discord-red',
        },
      ];

      const panelSection = {
        title: 'Verification Gate & Security Configuration',
        subtitle: 'Active verification role, rules channel, and protection shields',
        emptyTitle: 'Verification gate is not configured yet',
        emptySubtitle:
          'Deploy a CAPTCHA verification panel from the Server Architect to protect your server.',
        actionLabel: 'Configure Verification',
        actionTo: `/guilds/${guildId}/architect?tab=deployer`,
        rows: verification.configured
          ? [
              {
                id: 'verified-role',
                name: `@${verification.verifiedRoleName || 'Verified'}`,
                category: 'Verified Member Role',
                statusLabel: 'Active Gate',
                statusTone: 'green' as BadgeTone,
                metric: `${verification.verifiedMembers} members verified`,
              },
              ...(verification.rulesChannelName
                ? [
                    {
                      id: 'rules-channel',
                      name: `#${verification.rulesChannelName}`,
                      category: 'Rules & Onboarding Channel',
                      statusLabel: 'Linked',
                      statusTone: 'blurple' as BadgeTone,
                      metric: 'Referenced after verification',
                    },
                  ]
                : []),
            ]
          : [],
      };

      const leftBreakdown = {
        title: 'Security Layers',
        subtitle: 'Active verification and auto-moderation modules on this server',
        rows: [
          {
            label: 'Image CAPTCHA Challenge',
            subtext: verification.verifiedRoleName
              ? `Grants @${verification.verifiedRoleName}`
              : 'Not linked to a role yet',
            value: verification.configured ? 'Enabled' : 'Unset',
          },
          {
            label: 'Anti-Invite Link Protection',
            subtext: 'Deletes external Discord server invites from non-staff',
            value: verification.antiInvite ? 'Active' : 'Disabled',
          },
          {
            label: 'Anti-Spam Flood Protection',
            subtext: 'Automatically timeouts members spamming > 6 msgs / 4s',
            value: verification.antiSpam ? 'Active' : 'Disabled',
          },
        ],
      };

      const rightFunnel = {
        title: 'Verification Coverage',
        subtitle: 'How much of the server population holds the verified status',
        rows: [
          {
            label: 'Human members verified',
            subtext: `${verification.verifiedMembers} of ${summary.humanCount} human members`,
            value:
              verification.verificationRate !== null
                ? `${verification.verificationRate}%`
                : 'No data',
          },
          {
            label: 'Period join verification',
            subtext: `${verification.verifiedInPeriod} verified out of ${welcomer.joinsInPeriod} recent joins`,
            value:
              welcomer.joinsInPeriod > 0
                ? `${Math.round((verification.verifiedInPeriod / welcomer.joinsInPeriod) * 100)}%`
                : 'No data',
          },
        ],
        footer: `${(verification.verifiedInPeriod / period).toFixed(
          1
        )} verifications a day over the last ${period} days`,
      };

      return { topKpis, snapshots, charts, panelSection, leftBreakdown, rightFunnel };
    }

    if (activeModule === 'welcomer') {
      const topKpis: TopKpiItem[] = [
        {
          icon: 'group_add',
          label: 'Total Server Members',
          value: summary.memberCount,
          subtext: `${summary.humanCount} humans · ${summary.botCount} bots`,
        },
        {
          icon: 'waving_hand',
          label: 'Welcome Module',
          value: welcomer.welcomeEnabled ? 'Active' : 'Disabled',
          subtext: welcomer.welcomeChannelName
            ? `Posting in #${welcomer.welcomeChannelName}`
            : 'No welcome channel selected',
        },
        {
          icon: 'logout',
          label: 'Goodbye Module',
          value: welcomer.goodbyeEnabled ? 'Active' : 'Disabled',
          subtext: welcomer.goodbyeChannelName
            ? `Posting in #${welcomer.goodbyeChannelName}`
            : 'No goodbye channel selected',
        },
        {
          icon: 'badge',
          label: 'Auto-Assigned Roles',
          value: welcomer.autoRolesCount,
          subtext: 'granted automatically on join',
        },
      ];

      const snapshots: SnapshotCardItem[] = [
        {
          label: 'Period Joins',
          value: welcomer.joinsInPeriod,
          subtext: `New members in ${period} days`,
          dotColor: 'bg-discord-green',
        },
        {
          label: 'Daily Avg Joins',
          value: (welcomer.joinsInPeriod / period).toFixed(1),
          subtext: `Per day over ${period} days`,
          dotColor: 'bg-discord-blurple',
        },
        {
          label: 'Online Now',
          value: summary.onlineCount,
          subtext: 'Active presence in server',
          dotColor: 'bg-discord-green',
        },
        {
          label: 'Presence Ratio',
          value:
            summary.memberCount > 0
              ? `${Math.round((summary.onlineCount / summary.memberCount) * 100)}%`
              : 'No data',
          subtext: 'Online out of total members',
          dotColor: 'bg-discord-green',
        },
        {
          label: 'Welcome Channel',
          value: welcomer.welcomeChannelName ? `#${welcomer.welcomeChannelName}` : 'Unset',
          subtext: welcomer.cardEnabled ? 'Card greeting enabled' : 'Text greeting',
          dotColor: welcomer.welcomeChannelName ? 'bg-discord-blurple' : 'bg-discord-muted',
        },
        {
          label: 'Goodbye Channel',
          value: welcomer.goodbyeChannelName ? `#${welcomer.goodbyeChannelName}` : 'Unset',
          subtext: welcomer.goodbyeEnabled ? 'Departure announcements on' : 'Disabled',
          dotColor: welcomer.goodbyeChannelName ? 'bg-discord-blurple' : 'bg-discord-muted',
        },
      ];

      const charts: ChartCardConfig[] = [
        {
          title: 'Member Join Velocity',
          subtitle: 'New human members joining the server each day in this period',
          legends: [
            { label: 'Member Joins', tone: 'green' },
            { label: 'Verified Joins', tone: 'blurple' },
          ],
          emptyIcon: 'person_add',
          emptyText: 'No new members joined in this period yet',
          points:
            welcomer.joinsInPeriod > 0
              ? buckets.map((b) => ({
                  label: b.label,
                  primary: b.joins,
                  secondary: b.verifiedJoins,
                }))
              : [],
          primaryColorClass: 'bg-discord-green',
          secondaryColorClass: 'bg-discord-blurple',
        },
        {
          title: 'Retention & Population Mix',
          subtitle: 'Human members compared to automated bot integrations',
          legends: [
            { label: 'Humans', tone: 'blurple' },
            { label: 'Bots', tone: 'yellow' },
          ],
          emptyIcon: 'groups',
          emptyText: 'No member data available',
          points: buckets.map((b, idx) => ({
            label: b.label,
            primary: idx === buckets.length - 1 ? summary.humanCount : b.joins,
            secondary: idx === buckets.length - 1 ? summary.botCount : 0,
          })),
          primaryColorClass: 'bg-discord-blurple',
          secondaryColorClass: 'bg-discord-yellow',
        },
      ];

      const panelSection = {
        title: 'Welcomer & Goodbye Pipelines',
        subtitle: 'Active greeting and farewell endpoints configured on this server',
        emptyTitle: 'Neither Welcomer nor Goodbye is enabled yet',
        emptySubtitle:
          'Configure Welcome or Goodbye messages to greet new arrivals and log departures.',
        actionLabel: 'Configure Welcomer',
        actionTo: `/guilds/${guildId}/welcome`,
        rows: [
          ...(welcomer.welcomeEnabled
            ? [
                {
                  id: 'welcome-pipe',
                  name: welcomer.welcomeChannelName
                    ? `#${welcomer.welcomeChannelName}`
                    : 'Unassigned Channel',
                  category: 'Welcome Message & Canvas Card',
                  statusLabel: 'Active',
                  statusTone: 'green' as BadgeTone,
                  metric: `${welcomer.autoRolesCount} auto-roles · DM ${
                    welcomer.dmEnabled ? 'On' : 'Off'
                  }`,
                },
              ]
            : []),
          ...(welcomer.goodbyeEnabled
            ? [
                {
                  id: 'goodbye-pipe',
                  name: welcomer.goodbyeChannelName
                    ? `#${welcomer.goodbyeChannelName}`
                    : 'Unassigned Channel',
                  category: 'Goodbye Farewell Message',
                  statusLabel: 'Active',
                  statusTone: 'blurple' as BadgeTone,
                  metric: 'Triggers on member leave',
                },
              ]
            : []),
        ],
      };

      const leftBreakdown = {
        title: 'Onboarding Features',
        subtitle: 'Status of each greeting component for incoming members',
        rows: [
          {
            label: 'Channel Welcome Message',
            subtext: welcomer.welcomeChannelName
              ? `Target: #${welcomer.welcomeChannelName}`
              : 'No target channel',
            value: welcomer.welcomeEnabled ? 'Active' : 'Disabled',
          },
          {
            label: 'Custom Welcome Card Image',
            subtext: 'Renders avatar, username, and member count banner',
            value: welcomer.cardEnabled ? 'Enabled' : 'Disabled',
          },
          {
            label: 'Direct Message Greeting',
            subtext: 'Sends private onboarding message to new members',
            value: welcomer.dmEnabled ? 'Enabled' : 'Disabled',
          },
        ],
      };

      const rightFunnel = {
        title: 'Community Growth Summary',
        subtitle: 'Member acquisition and active presence metrics',
        rows: [
          {
            label: 'Online presence ratio',
            subtext: `${summary.onlineCount} online out of ${summary.memberCount} total members`,
            value:
              summary.memberCount > 0
                ? `${Math.round((summary.onlineCount / summary.memberCount) * 100)}%`
                : 'No data',
          },
          {
            label: 'New joins in period',
            subtext: `Joined within the last ${period} days`,
            value: `${welcomer.joinsInPeriod} members`,
          },
        ],
        footer: `${(welcomer.joinsInPeriod / period).toFixed(
          1
        )} new members a day over the last ${period} days`,
      };

      return { topKpis, snapshots, charts, panelSection, leftBreakdown, rightFunnel };
    }

    if (activeModule === 'voice') {
      const topKpis: TopKpiItem[] = [
        {
          icon: 'spatial_audio_off',
          label: 'Join-to-Create Hubs',
          value: voice.hubsCount,
          subtext: 'active voice generator channels',
        },
        {
          icon: 'graphic_eq',
          label: 'Active Temp Rooms',
          value: voice.tempRoomsCount,
          subtext: 'live dynamic voice rooms right now',
        },
        {
          icon: 'headset_mic',
          label: 'Connected in Voice',
          value: voice.totalVoiceConnected,
          subtext: 'members currently in voice channels',
        },
        {
          icon: 'podcasts',
          label: 'Total Voice & Stage',
          value: voice.totalVoiceChannels + voice.stageChannels,
          subtext: `${voice.totalVoiceChannels} voice · ${voice.stageChannels} stage`,
        },
      ];

      const snapshots: SnapshotCardItem[] = [
        {
          label: 'Waiting Rooms',
          value: voice.tempRooms.filter((r) => r.hasWaitingRoom).length,
          subtext: 'Knock-to-join lobbies',
          dotColor: 'bg-discord-yellow',
        },
        {
          label: 'Static Voice Rooms',
          value: Math.max(0, voice.totalVoiceChannels - voice.tempRoomsCount),
          subtext: 'Permanent server rooms',
          dotColor: 'bg-discord-blurple',
        },
        {
          label: 'Stage Channels',
          value: voice.stageChannels,
          subtext: 'Broadcasting & events',
          dotColor: 'bg-discord-fuchsia',
        },
        {
          label: 'Avg Users / Room',
          value:
            voice.tempRoomsCount > 0
              ? (voice.totalVoiceConnected / voice.tempRoomsCount).toFixed(1)
              : '0.0',
          subtext: 'Dynamic room user density',
          dotColor: 'bg-discord-green',
        },
        {
          label: 'Cleanup Policy',
          value: 'Instant',
          subtext: 'Auto-deletes when 0 users',
          dotColor: 'bg-discord-green',
        },
        {
          label: 'Hubs Category',
          value: voice.hubs[0]?.categoryName || 'Voice',
          subtext: 'Location of generator triggers',
          dotColor: 'bg-discord-blurple',
        },
      ];

      const charts: ChartCardConfig[] = [
        {
          title: 'Voice Infrastructure Breakdown',
          subtitle: 'Join-to-Create hubs and active temporary rooms',
          legends: [
            { label: 'Voice Hubs', tone: 'blurple' },
            { label: 'Temp Rooms', tone: 'green' },
          ],
          emptyIcon: 'spatial_audio_off',
          emptyText: 'No dynamic voice hubs or temp rooms active yet',
          points:
            voice.hubsCount > 0 || voice.tempRoomsCount > 0
              ? buckets.map((b, idx) => ({
                  label: b.label,
                  primary: idx === buckets.length - 1 ? voice.hubsCount : voice.hubsCount,
                  secondary: idx === buckets.length - 1 ? voice.tempRoomsCount : 0,
                }))
              : [],
          primaryColorClass: 'bg-discord-blurple',
          secondaryColorClass: 'bg-discord-green',
        },
        {
          title: 'Live Voice Occupancy',
          subtitle: 'Members connected across permanent and dynamic voice channels',
          legends: [
            { label: 'Connected Users', tone: 'green' },
            { label: 'Voice Channels', tone: 'blurple' },
          ],
          emptyIcon: 'mic_off',
          emptyText: 'No members connected to voice channels right now',
          points:
            voice.totalVoiceConnected > 0
              ? buckets.map((b, idx) => ({
                  label: b.label,
                  primary: idx === buckets.length - 1 ? voice.totalVoiceConnected : 0,
                  secondary: idx === buckets.length - 1 ? voice.totalVoiceChannels : 0,
                }))
              : [],
          primaryColorClass: 'bg-discord-green',
          secondaryColorClass: 'bg-discord-blurple',
        },
      ];

      const panelSection = {
        title: 'Dynamic Voice Hubs & Active Rooms',
        subtitle: 'Status of each Join-to-Create generator and spawned temporary voice room',
        emptyTitle: 'No Join-to-Create voice hubs registered yet',
        emptySubtitle:
          'Create a Join-to-Create hub in Dynamic Voice Hubs so members can spawn their own custom rooms.',
        actionLabel: 'Manage Voice Hubs',
        actionTo: `/guilds/${guildId}/voice`,
        rows: [
          ...voice.hubs.map((h) => ({
            id: h.id,
            name: `🔊 ${h.name}`,
            category: h.categoryName,
            statusLabel: 'Voice Hub',
            statusTone: 'blurple' as BadgeTone,
            metric: `${h.connectedCount} connected`,
          })),
          ...voice.tempRooms.map((r) => ({
            id: r.id,
            name: `⚡ ${r.name}`,
            category: r.hasWaitingRoom ? 'Temp Room + Waiting Lobby' : 'Temporary Voice Room',
            statusLabel: 'Live Room',
            statusTone: 'green' as BadgeTone,
            metric: `${r.connectedCount} connected`,
          })),
        ],
      };

      const leftBreakdown = {
        title: 'Voice Channel Distribution',
        subtitle: 'Breakdown of voice-capable channels across your server',
        rows: [
          {
            label: 'Join-to-Create Hub Generators',
            value: voice.hubsCount,
          },
          {
            label: 'Active Temporary Voice Rooms',
            value: voice.tempRoomsCount,
          },
          {
            label: 'Permanent Voice & Stage Channels',
            subtext: `${voice.stageChannels} stage channels included`,
            value: Math.max(0, voice.totalVoiceChannels - voice.tempRoomsCount) + voice.stageChannels,
          },
        ],
      };

      const rightFunnel = {
        title: 'Voice Capacity & Health',
        subtitle: 'Utilization of dynamic voice generators',
        rows: [
          {
            label: 'Active rooms per hub',
            subtext: `${voice.tempRoomsCount} active rooms across ${voice.hubsCount} hubs`,
            value:
              voice.hubsCount > 0
                ? (voice.tempRoomsCount / voice.hubsCount).toFixed(1)
                : 'No data',
          },
          {
            label: 'Currently connected in voice',
            subtext: 'Real-time voice state count',
            value: `${voice.totalVoiceConnected} users`,
          },
        ],
        footer: `${voice.hubsCount} Join-to-Create hubs active on this server`,
      };

      return { topKpis, snapshots, charts, panelSection, leftBreakdown, rightFunnel };
    }

    if (activeModule === 'channels') {
      const topKpis: TopKpiItem[] = [
        {
          icon: 'tag',
          label: 'Total Channels',
          value: structure.totalChannels,
          subtext: `across ${structure.categories} categories`,
        },
        {
          icon: 'chat',
          label: 'Text & Announcements',
          value: structure.textChannels + structure.announcementChannels,
          subtext: `${structure.textChannels} text · ${structure.announcementChannels} news channels`,
        },
        {
          icon: 'spatial_audio_off',
          label: 'Voice & Stage',
          value: structure.voiceChannels + structure.stageChannels,
          subtext: `${structure.voiceChannels} voice · ${structure.stageChannels} stage channels`,
        },
        {
          icon: 'folder',
          label: 'Category Containers',
          value: structure.categories,
          subtext: 'organizing channel sections',
        },
      ];

      const snapshots: SnapshotCardItem[] = [
        {
          label: 'New Channels',
          value: structure.channelsCreatedInPeriod,
          subtext: `Created in last ${period} days`,
          dotColor: 'bg-discord-blurple',
        },
        {
          label: 'Categories',
          value: structure.categories,
          subtext: 'Channel containers',
          dotColor: 'bg-discord-blurple',
        },
        {
          label: 'Text Channels',
          value: structure.textChannels,
          subtext: 'Chat & discussion',
          dotColor: 'bg-discord-green',
        },
        {
          label: 'Voice Channels',
          value: structure.voiceChannels,
          subtext: 'Audio & meeting',
          dotColor: 'bg-discord-yellow',
        },
        {
          label: 'Stage Channels',
          value: structure.stageChannels,
          subtext: 'Events & broadcasts',
          dotColor: 'bg-discord-fuchsia',
        },
        {
          label: 'News / Forums',
          value: structure.announcementChannels + structure.forumChannels,
          subtext: 'Community channels',
          dotColor: 'bg-discord-blurple',
        },
      ];

      const charts: ChartCardConfig[] = [
        {
          title: 'Channel Creation Velocity',
          subtitle: 'New channels created per day during the selected period',
          legends: [{ label: 'Channels Created', tone: 'blurple' }],
          emptyIcon: 'architecture',
          emptyText: 'No new channels created in this period',
          points:
            structure.channelsCreatedInPeriod > 0
              ? buckets.map((b) => ({
                  label: b.label,
                  primary: b.channelsCreated,
                }))
              : [],
          primaryColorClass: 'bg-discord-blurple',
        },
        {
          title: 'Channel Type Composition',
          subtitle: 'Distribution of text, voice, category, and special channels',
          legends: [
            { label: 'Count', tone: 'blurple' },
          ],
          emptyIcon: 'deployed_code',
          emptyText: 'No channels found in server',
          points: [
            { label: 'Categories', primary: structure.categories },
            { label: 'Text', primary: structure.textChannels },
            { label: 'Voice', primary: structure.voiceChannels },
            { label: 'Stage', primary: structure.stageChannels },
            { label: 'News', primary: structure.announcementChannels },
            { label: 'Forum', primary: structure.forumChannels },
          ],
          primaryColorClass: 'bg-discord-blurple',
        },
      ];

      const panelSection = {
        title: 'Channel & Category Architecture',
        subtitle: 'Live summary of channel distribution across categories',
        emptyTitle: 'No channels found',
        emptySubtitle: 'Use Channels & Categories to create text and voice rooms.',
        actionLabel: 'Manage Channels',
        actionTo: `/guilds/${guildId}/channels`,
        rows: [
          {
            id: 'channel-summary',
            name: 'Channels & Categories Manager',
            category: `${structure.categories} Categories · ${structure.textChannels} Text · ${structure.voiceChannels} Voice`,
            statusLabel: 'Synchronized',
            statusTone: 'green' as BadgeTone,
            metric: `${structure.totalChannels} total channels`,
          },
          {
            id: 'channel-special',
            name: 'Specialized Channels',
            category: `${structure.stageChannels} Stage · ${structure.announcementChannels} News · ${structure.forumChannels} Forums`,
            statusLabel: 'Configured',
            statusTone: 'blurple' as BadgeTone,
            metric: `${
              structure.stageChannels +
              structure.announcementChannels +
              structure.forumChannels
            } special rooms`,
          },
        ],
      };

      const leftBreakdown = {
        title: 'Channel Format Breakdown',
        subtitle: 'Count of every channel type configured on this server',
        rows: [
          {
            label: 'Text & Announcement Channels',
            value: structure.textChannels + structure.announcementChannels,
          },
          {
            label: 'Voice & Stage Channels',
            value: structure.voiceChannels + structure.stageChannels,
          },
          {
            label: 'Category Containers',
            subtext: `${structure.forumChannels} forum channels included`,
            value: structure.categories,
          },
        ],
      };

      const rightFunnel = {
        title: 'Category Organization Health',
        subtitle: 'How effectively channels are grouped into categories',
        rows: [
          {
            label: 'Average channels per category',
            subtext: `${structure.totalChannels - structure.categories} channels inside ${
              structure.categories
            } categories`,
            value:
              structure.categories > 0
                ? `${(
                    (structure.totalChannels - structure.categories) /
                    structure.categories
                  ).toFixed(1)} ch/cat`
                : 'No data',
          },
          {
            label: 'New channels in period',
            subtext: `Added within the last ${period} days`,
            value: `${structure.channelsCreatedInPeriod} channels`,
          },
        ],
        footer: `${structure.channelsCreatedInPeriod} channels created in the last ${period} days`,
      };

      return { topKpis, snapshots, charts, panelSection, leftBreakdown, rightFunnel };
    }

    if (activeModule === 'roles') {
      const topKpis: TopKpiItem[] = [
        {
          icon: 'badge',
          label: 'Total Server Roles',
          value: structure.totalRoles,
          subtext: `configured in role hierarchy`,
        },
        {
          icon: 'person',
          label: 'Custom Member Roles',
          value: structure.customRoles,
          subtext: 'created for members and staff',
        },
        {
          icon: 'view_headline',
          label: 'Hoisted in Sidebar',
          value: structure.hoistedRoles,
          subtext: 'displayed separately in member list',
        },
        {
          icon: 'palette',
          label: 'Color-Coded Roles',
          value: structure.coloredRoles,
          subtext: 'assigned custom hex color',
        },
      ];

      const snapshots: SnapshotCardItem[] = [
        {
          label: 'New Roles',
          value: structure.rolesCreatedInPeriod,
          subtext: `Created in last ${period} days`,
          dotColor: 'bg-discord-green',
        },
        {
          label: 'Custom Roles',
          value: structure.customRoles,
          subtext: 'Manual roles',
          dotColor: 'bg-discord-blurple',
        },
        {
          label: 'Hoisted Roles',
          value: structure.hoistedRoles,
          subtext: 'Sidebar groups',
          dotColor: 'bg-discord-fuchsia',
        },
        {
          label: 'Colored Roles',
          value: structure.coloredRoles,
          subtext: 'Custom badge color',
          dotColor: 'bg-discord-yellow',
        },
        {
          label: 'Managed Roles',
          value: structure.managedRoles,
          subtext: 'Bot & integration roles',
          dotColor: 'bg-discord-muted',
        },
        {
          label: 'Total Roles',
          value: structure.totalRoles,
          subtext: 'In server hierarchy',
          dotColor: 'bg-discord-blurple',
        },
      ];

      const charts: ChartCardConfig[] = [
        {
          title: 'Role Creation Velocity',
          subtitle: 'New roles created per day during the selected period',
          legends: [{ label: 'Roles Created', tone: 'green' }],
          emptyIcon: 'badge',
          emptyText: 'No new roles created in this period',
          points:
            structure.rolesCreatedInPeriod > 0
              ? buckets.map((b) => ({
                  label: b.label,
                  primary: b.rolesCreated,
                }))
              : [],
          primaryColorClass: 'bg-discord-green',
        },
        {
          title: 'Role Hierarchy Composition',
          subtitle: 'Breakdown of custom roles, hoisted roles, and bot roles',
          legends: [{ label: 'Count', tone: 'blurple' }],
          emptyIcon: 'layers',
          emptyText: 'No roles found in server',
          points: [
            { label: 'Total', primary: structure.totalRoles },
            { label: 'Custom', primary: structure.customRoles },
            { label: 'Hoisted', primary: structure.hoistedRoles },
            { label: 'Colored', primary: structure.coloredRoles },
            { label: 'Managed', primary: structure.managedRoles },
          ],
          primaryColorClass: 'bg-discord-blurple',
        },
      ];

      const panelSection = {
        title: 'Role Hierarchy & Permissions',
        subtitle: 'Live status of role hierarchy, styling, and management',
        emptyTitle: 'No roles found',
        emptySubtitle: 'Use Roles & Permissions to manage permissions and colors.',
        actionLabel: 'Manage Roles',
        actionTo: `/guilds/${guildId}/roles`,
        rows: [
          {
            id: 'roles-custom',
            name: 'Custom Server Roles',
            category: `${structure.customRoles} Custom Member Roles · ${structure.coloredRoles} Color-Coded`,
            statusLabel: 'Configured',
            statusTone: 'green' as BadgeTone,
            metric: `${structure.customRoles} roles`,
          },
          {
            id: 'roles-managed',
            name: 'Managed & Bot Integration Roles',
            category: `${structure.managedRoles} Managed Roles · ${structure.hoistedRoles} Hoisted Roles`,
            statusLabel: 'Active',
            statusTone: 'blurple' as BadgeTone,
            metric: `${structure.managedRoles} integrations`,
          },
        ],
      };

      const leftBreakdown = {
        title: 'Role Styling Breakdown',
        subtitle: 'Visual attributes and categorization of server roles',
        rows: [
          {
            label: 'Custom Member Roles',
            subtext: 'Created by administrators for members',
            value: structure.customRoles,
          },
          {
            label: 'Hoisted Display Roles',
            subtext: 'Pinned into separate category sections in member list',
            value: structure.hoistedRoles,
          },
          {
            label: 'Custom Color-Coded Roles',
            subtext: 'Assigned unique hex color badges',
            value: structure.coloredRoles,
          },
          {
            label: 'Managed Integration Roles',
            subtext: 'Automatically created by Discord bot integrations',
            value: structure.managedRoles,
          },
        ],
      };

      const rightFunnel = {
        title: 'Role Organization Density',
        subtitle: 'How roles are styled and separated in the member list',
        rows: [
          {
            label: 'Hoisted display ratio',
            subtext: `${structure.hoistedRoles} of ${structure.totalRoles} roles pinned in sidebar`,
            value:
              structure.totalRoles > 0
                ? `${Math.round((structure.hoistedRoles / structure.totalRoles) * 100)}%`
                : 'No data',
          },
          {
            label: 'Color-coded roles',
            subtext: `${structure.coloredRoles} roles have a custom hex color`,
            value:
              structure.totalRoles > 0
                ? `${Math.round((structure.coloredRoles / structure.totalRoles) * 100)}%`
                : 'No data',
          },
        ],
        footer: `${structure.rolesCreatedInPeriod} roles created in the last ${period} days`,
      };

      return { topKpis, snapshots, charts, panelSection, leftBreakdown, rightFunnel };
    }

    // Default / 'milestones' tab: Milestones & Backups
    const nextGoal = backupsAndMilestones.nextMilestone;
    const progressPct = nextGoal
      ? Math.min(100, Math.round((summary.memberCount / nextGoal) * 100))
      : 100;

    const topKpis: TopKpiItem[] = [
      {
        icon: 'emoji_events',
        label: 'Milestones Reached',
        value: backupsAndMilestones.reachedCount,
        subtext: `of ${backupsAndMilestones.milestoneTargets.length} configured targets`,
      },
      {
        icon: 'flag',
        label: 'Next Milestone Goal',
        value: nextGoal ? `${nextGoal.toLocaleString()} members` : 'All reached!',
        subtext: nextGoal
          ? `${Math.max(0, nextGoal - summary.memberCount)} members to go (${progressPct}%)`
          : 'Maximum target achieved',
      },
      {
        icon: 'inventory_2',
        label: 'Saved Layout Backups',
        value: backupsAndMilestones.backupsCount,
        subtext: 'snapshots ready to restore or export',
      },
      {
        icon: 'workspace_premium',
        label: 'Server Boost Status',
        value: `Level ${summary.boostTier}`,
        subtext: `${summary.boostCount} active Nitro boosts`,
      },
    ];

    const snapshots: SnapshotCardItem[] = [
      {
        label: 'Current Members',
        value: summary.memberCount,
        subtext: `${summary.humanCount} humans · ${summary.botCount} bots`,
        dotColor: 'bg-discord-blurple',
      },
      {
        label: 'Members to Goal',
        value: nextGoal ? `${Math.max(0, nextGoal - summary.memberCount)}` : 'Done',
        subtext: nextGoal ? `To reach ${nextGoal.toLocaleString()} milestone` : 'All goals reached',
        dotColor: 'bg-discord-yellow',
      },
      {
        label: 'Progress Ratio',
        value: `${progressPct}%`,
        subtext: 'To next member threshold',
        dotColor: 'bg-discord-green',
      },
      {
        label: 'Active Nitro Boosts',
        value: summary.boostCount,
        subtext: `Tier ${summary.boostTier} server perks`,
        dotColor: 'bg-discord-fuchsia',
      },
      {
        label: 'Server Boost Tier',
        value: `Level ${summary.boostTier}`,
        subtext: `${summary.boostCount} active boosts`,
        dotColor: 'bg-discord-fuchsia',
      },
      {
        label: 'Alert Channel',
        value: backupsAndMilestones.milestoneChannelName
          ? `#${backupsAndMilestones.milestoneChannelName}`
          : 'Unset',
        subtext: 'Milestone celebration posts',
        dotColor: backupsAndMilestones.milestoneChannelName
          ? 'bg-discord-green'
          : 'bg-discord-muted',
      },
    ];

    const charts: ChartCardConfig[] = [
      {
        title: 'Milestone Target Progression',
        subtitle: 'Current server member count compared against each milestone goal',
        legends: [
          { label: 'Target Goal', tone: 'blurple' },
          { label: 'Current Members', tone: 'green' },
        ],
        emptyIcon: 'emoji_events',
        emptyText: 'No milestone targets configured yet',
        points: backupsAndMilestones.milestoneTargets.map((target) => ({
          label: `${target}`,
          primary: target,
          secondary: Math.min(summary.memberCount, target),
        })),
        primaryColorClass: 'bg-discord-blurple',
        secondaryColorClass: 'bg-discord-green',
      },
      {
        title: 'Daily Member Growth Toward Goal',
        subtitle: 'Daily member joins contributing to the next milestone celebration',
        legends: [{ label: 'Daily Joins', tone: 'green' }],
        emptyIcon: 'trending_up',
        emptyText: 'No new joins in this period yet',
        points:
          welcomer.joinsInPeriod > 0
            ? buckets.map((b) => ({
                label: b.label,
                primary: b.joins,
              }))
            : [],
        primaryColorClass: 'bg-discord-green',
      },
    ];

    const panelSection = {
      title: 'Saved Layout Backups',
      subtitle: 'Snapshots of categories, channels, and roles stored for instant restore',
      emptyTitle: 'No layout backups saved yet',
      emptySubtitle:
        'Create a snapshot in Layout Backups to safeguard your channel and role architecture.',
      actionLabel: 'Manage Backups',
      actionTo: `/guilds/${guildId}/backups`,
      rows: backupsAndMilestones.backups.map((b) => ({
        id: b.slug,
        name: b.label,
        category: `${b.categoriesCount} categories · ${b.channelsCount} channels · ${b.rolesCount} roles`,
        statusLabel: 'Snapshot Ready',
        statusTone: 'green' as BadgeTone,
        metric: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Saved backup',
      })),
    };

    const leftBreakdown = {
      title: 'Milestone Targets Overview',
      subtitle: 'Status of configured member count celebration thresholds',
      rows: backupsAndMilestones.milestoneTargets.slice(0, 4).map((target) => {
        const reached = summary.memberCount >= target;
        return {
          label: `${target.toLocaleString()} Members Milestone`,
          subtext: reached
            ? 'Goal achieved by community'
            : `${target - summary.memberCount} members remaining`,
          value: reached ? 'Reached' : `${Math.round((summary.memberCount / target) * 100)}%`,
        };
      }),
    };

    const rightFunnel = {
      title: 'Backup & Readiness Health',
      subtitle: 'Disaster recovery and milestone notification readiness',
      rows: [
        {
          label: 'Progress to next milestone',
          subtext: nextGoal
            ? `${summary.memberCount} / ${nextGoal} members`
            : 'All configured milestones reached',
          value: `${progressPct}%`,
        },
        {
          label: 'Available layout snapshots',
          subtext: 'Stored in ArchiBot state & exportable as JSON',
          value: `${backupsAndMilestones.backupsCount} backups`,
        },
      ],
      footer: `${backupsAndMilestones.reachedCount} milestones achieved · ${backupsAndMilestones.backupsCount} layout snapshots stored`,
    };

    return { topKpis, snapshots, charts, panelSection, leftBreakdown, rightFunnel };
  }, [data, activeModule, period, guildId]);

  if (loading && !data) {
    return <AnalyticsSkeleton />;
  }

  if (!data || !moduleView) {
    return (
      <div className="flex flex-col gap-6 w-full pb-16">
        <PageHeader
          title="Analytics"
          description="Track how every module on your server is performing."
        />
        <SurfaceCard>
          <EmptyState
            icon="analytics"
            title="Could not load analytics data"
            description="Please check your server connection and try refreshing."
            action={
              <MdButton
                variant="tonal"
                size="sm"
                icon="refresh"
                onClick={() => fetchAnalytics(period, true)}
              >
                Retry
              </MdButton>
            }
          />
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* 1. Standardized PageHeader Molecule */}
      <PageHeader
        title="Analytics"
        description="Track how every module on your server is performing."
        actions={
          <MdButton
            variant="tonal"
            size="sm"
            icon="refresh"
            loading={refreshing}
            onClick={() => fetchAnalytics(period, true)}
          >
            Refresh
          </MdButton>
        }
      />

      {/* 2. Standardized Material 3 Module Tabs Molecule */}
      <div className="overflow-x-auto">
        <MdTabs
          tabs={MODULE_TABS}
          activeIndex={activeTabIndex}
          onChange={handleTabChange}
        />
      </div>

      {/* 3. Top All-Time KPI Cards (4-Column Grid using SurfaceCard Molecule) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {moduleView.topKpis.map((kpi) => (
          <SurfaceCard key={kpi.label} className="flex flex-col justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-discord-surface border border-discord-border flex items-center justify-center text-discord-muted shrink-0">
                <MdIcon name={kpi.icon} className="text-lg text-discord-muted" />
              </div>
              <span className="text-xs font-normal text-discord-muted truncate">
                {kpi.label}
              </span>
            </div>

            <div className="text-xl font-normal text-discord-white mt-3.5 tracking-tight">
              {kpi.value}
            </div>

            <div className="text-xs font-normal text-discord-muted mt-1 truncate">
              {kpi.subtext}
            </div>
          </SurfaceCard>
        ))}
      </div>

      {/* 4. Period Header & 6-Column Period Snapshot Cards */}
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-normal text-discord-white">Period</h2>
            <p className="text-xs font-normal text-discord-muted mt-0.5">
              Updates the snapshot and charts below
            </p>
          </div>

          {/* Segmented Period Selector (7d / 14d / 30d) */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-discord-card border border-discord-border self-start sm:self-auto">
            {([7, 14, 30] as PeriodOption[]).map((p) => {
              const active = period === p;
              return (
                <MdButton
                  key={p}
                  size="xs"
                  variant={active ? 'filled' : 'text'}
                  onClick={() => setPeriod(p)}
                  className="font-normal"
                >
                  {p}d
                </MdButton>
              );
            })}
          </div>
        </div>

        {/* Relative wrapper for Period Snapshots & Charts with single central loading & thicker blur */}
        <div className="relative">
          {/* Single Loading Effect in the Center of Period Section (No box wrapper) */}
          {chartLoading && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-discord-sidebar/30 backdrop-blur-sm rounded-2xl transition-all duration-300 pointer-events-none select-none">
              <md-circular-progress
                indeterminate
                class="scale-100"
                style={{ '--md-circular-progress-active-indicator-color': '#5865F2' } as any}
              />
              <span className="text-xs font-normal text-discord-white tracking-wide drop-shadow-sm">
                Memuat data terbaru...
              </span>
            </div>
          )}

          <div
            className={`flex flex-col gap-4 transition-all duration-300 ease-out ${
              chartLoading ? 'filter blur-[4px] opacity-40 select-none pointer-events-none' : 'filter-none opacity-100'
            }`}
          >
            {/* Snapshots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {moduleView.snapshots.map((snap) => (
                <SurfaceCard key={snap.label} className="!p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-xs shrink-0 ${snap.dotColor}`} />
                    <span className="text-xs font-normal text-discord-muted truncate">
                      {snap.label}
                    </span>
                  </div>

                  <div className="text-lg font-normal text-discord-white mt-2 tracking-tight truncate">
                    {snap.value}
                  </div>

                  <div className="text-[11px] font-normal text-discord-muted mt-1 truncate">
                    {snap.subtext}
                  </div>
                </SurfaceCard>
              ))}
            </div>

            {/* 5. 2x2 Charts Grid (Using SurfaceCard, Badge, and EmptyState Molecules) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {moduleView.charts.map((chart) => {
                const totalActivity = chart.points.reduce(
                  (acc, pt) => acc + pt.primary + (pt.secondary || 0),
                  0
                );
                const maxVal = Math.max(
                  1,
                  ...chart.points.map((pt) => Math.max(pt.primary, pt.secondary || 0))
                );

                return (
                  <SurfaceCard
                    key={chart.title}
                    title={chart.title}
                    subtitle={chart.subtitle}
                    divider={false}
                    headerAction={
                      <div className="flex flex-wrap items-center gap-3.5">
                        {chart.legends.map((leg) => {
                          const toneColors: Record<string, string> = {
                            blurple: 'bg-discord-blurple',
                            green: 'bg-discord-green',
                            yellow: 'bg-discord-yellow',
                            red: 'bg-discord-red',
                            fuchsia: 'bg-discord-fuchsia',
                            premium: 'bg-discord-fuchsia',
                            neutral: 'bg-discord-muted',
                          };

                          return (
                            <div
                              key={leg.label}
                              className="inline-flex items-center gap-1.5 select-none"
                            >
                              {leg.dashed ? (
                                <span className="w-2.5 h-0.5 border-t border-dashed border-discord-muted shrink-0" />
                              ) : (
                                <span
                                  className={`w-2.5 h-2.5 rounded-[2px] shrink-0 ${
                                    toneColors[leg.tone] || 'bg-discord-blurple'
                                  }`}
                                />
                              )}
                              <span className="text-xs font-normal text-discord-text">
                                {leg.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    }
                    className="flex flex-col justify-between min-h-[290px]"
                  >
                    {totalActivity === 0 || chart.points.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center py-6">
                        <EmptyState
                          icon={chart.emptyIcon}
                          description={chart.emptyText}
                          className="py-8"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col justify-end flex-1 pt-6 pb-1">
                        {/* Interactive Bar Chart Visualization */}
                        <div className="h-44 flex items-end gap-1.5 sm:gap-2 px-1 border-b border-discord-border pb-2">
                          {chart.points.map((pt, idx) => {
                            const primaryPct = Math.max(
                              pt.primary > 0 ? 8 : 2,
                              Math.round((pt.primary / maxVal) * 100)
                            );
                            const secondaryPct =
                              pt.secondary !== undefined
                                ? Math.max(
                                    pt.secondary > 0 ? 8 : 0,
                                    Math.round((pt.secondary / maxVal) * 100)
                                  )
                                : 0;

                            return (
                              <div
                                key={`${pt.label}-${idx}`}
                                className="flex-1 flex flex-col items-center justify-end h-full group relative min-w-0"
                              >
                                {/* Hover Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 z-20 px-2 py-1 rounded-md bg-discord-sidebar border border-discord-border text-[10px] font-normal text-discord-white whitespace-nowrap shadow-lg">
                                  {pt.label}: {pt.primary}
                                  {pt.secondary !== undefined ? ` / ${pt.secondary}` : ''}
                                </div>

                                <div className="w-full flex items-end justify-center gap-1 h-full">
                                  <div
                                    style={{ height: `${primaryPct}%` }}
                                    className={`w-full max-w-[18px] rounded-t-sm transition-all duration-300 ${
                                      pt.primary > 0
                                        ? chart.primaryColorClass
                                        : 'bg-discord-surface/60'
                                    }`}
                                  />
                                  {pt.secondary !== undefined && chart.secondaryColorClass && (
                                    <div
                                      style={{ height: `${secondaryPct}%` }}
                                      className={`w-full max-w-[18px] rounded-t-sm transition-all duration-300 ${
                                        pt.secondary > 0
                                          ? chart.secondaryColorClass
                                          : 'bg-discord-surface/40'
                                      }`}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* X-Axis Labels */}
                        <div className="flex items-center justify-between pt-2 px-1 text-[10px] font-normal text-discord-muted">
                          <span>{chart.points[0]?.label}</span>
                          {chart.points.length > 2 && (
                            <span>
                              {chart.points[Math.floor(chart.points.length / 2)]?.label}
                            </span>
                          )}
                          <span>{chart.points[chart.points.length - 1]?.label}</span>
                        </div>
                      </div>
                    )}
                  </SurfaceCard>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Active Module Panels / Resources Card (SurfaceCard + EmptyState) */}
      <SurfaceCard
        title={moduleView.panelSection.title}
        subtitle={moduleView.panelSection.subtitle}
        headerAction={
          <MdButton
            variant="tonal"
            size="xs"
            icon="open_in_new"
            onClick={() => navigate(moduleView.panelSection.actionTo)}
            className="font-normal"
          >
            {moduleView.panelSection.actionLabel}
          </MdButton>
        }
      >
        {moduleView.panelSection.rows.length === 0 ? (
          <EmptyState
            icon="view_quilt"
            title={moduleView.panelSection.emptyTitle}
            description={moduleView.panelSection.emptySubtitle}
            className="py-6"
          />
        ) : (
          <div className="flex flex-col">
            {moduleView.panelSection.rows.map((row, idx) => (
              <React.Fragment key={row.id}>
                {idx > 0 && <MdDivider />}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <div className="text-xs font-normal text-discord-white truncate">
                      {row.name}
                    </div>
                    <div className="text-xs font-normal text-discord-muted mt-0.5 truncate">
                      {row.category}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-normal text-discord-muted">
                      {row.metric}
                    </span>
                    <StatusBadge
                      size="xs"
                      tone={row.statusTone}
                      label={row.statusLabel}
                    />
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </SurfaceCard>

      {/* 7. Bottom 2-Column Breakdown & Funnel (SurfaceCard + MdDivider) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Where Activity Comes From / Breakdown */}
        <SurfaceCard
          title={moduleView.leftBreakdown.title}
          subtitle={moduleView.leftBreakdown.subtitle}
        >
          <div className="flex flex-col">
            {moduleView.leftBreakdown.rows.map((row, idx) => (
              <React.Fragment key={row.label}>
                {idx > 0 && <MdDivider />}
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="text-xs font-normal text-discord-text truncate">
                      {row.label}
                    </div>
                    {row.subtext && (
                      <div className="text-[11px] font-normal text-discord-muted mt-0.5 truncate">
                        {row.subtext}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-normal text-discord-white shrink-0">
                    {row.value}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </SurfaceCard>

        {/* Right: Completion & Health Funnel */}
        <SurfaceCard
          title={moduleView.rightFunnel.title}
          subtitle={moduleView.rightFunnel.subtitle}
          className="flex flex-col justify-between"
        >
          <div className="flex flex-col">
            {moduleView.rightFunnel.rows.map((row, idx) => (
              <React.Fragment key={row.label}>
                {idx > 0 && <MdDivider />}
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="text-xs font-normal text-discord-text truncate">
                      {row.label}
                    </div>
                    {row.subtext && (
                      <div className="text-[11px] font-normal text-discord-muted mt-0.5 truncate">
                        {row.subtext}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-normal text-discord-white shrink-0">
                    {row.value}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="pt-3 mt-2 border-t border-discord-border text-xs font-normal text-discord-muted">
            {moduleView.rightFunnel.footer}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
};
