export interface UserProfile {
  id: string;
  username: string;
  global_name: string;
  avatar: string | null;
  discriminator: string;
  isOwner?: boolean;
  isDev?: boolean;
}

export interface AuthStatus {
  configured: boolean;
  clientId: string | null;
  redirectUri: string;
  botReady: boolean;
  botName: string;
  botTag: string | null;
  botAvatar: string | null;
  inviteUrl: string | null;
}

export interface GuildSummary {
  id: string;
  name: string;
  icon: string | null;
  botInGuild: boolean;
  isOwner: boolean;
  permissions: string;
  memberCount: number | null;
  channelsCount: number | null;
  rolesCount: number | null;
  inviteUrl: string | null;
}

export interface ChannelItem {
  id: string;
  name: string;
  type: number;
  typeName: 'text' | 'voice' | 'category' | 'announcement' | 'stage' | 'forum' | 'other';
  parentId: string | null;
  position: number;
  rawPosition: number;
  topic: string | null;
  rateLimitPerUser: number;
  nsfw: boolean;
  bitrate: number | null;
  userLimit: number;
  isAutoVoiceHub: boolean;
  isTempRoom: boolean;
  isLocked: boolean;
  overwritesCount: number;
}

export interface RoleItem {
  id: string;
  name: string;
  color: string;
  colorNumber: number;
  hoist: boolean;
  position: number;
  mentionable: boolean;
  managed: boolean;
  isEveryone: boolean;
  memberCount: number;
  editable: boolean;
  permissions: string[];
  bitfield: string;
}

export interface MemberItem {
  id: string;
  username: string;
  discriminator: string;
  globalName: string;
  displayName: string;
  avatar: string;
  bot: boolean;
  joinedAt: string;
  roles: { id: string; name: string; color: string }[];
  timedOut: boolean;
  timeoutUntil: string | null;
  manageable: boolean;
  moderatable: boolean;
  isOwner: boolean;
  warningsCount: number;
}

export interface BackupItem {
  slug: string;
  label: string;
  channelCount: number;
  rolesCount: number;
  updatedAt: string;
  specPreview: string;
  spec: string;
  roles: any[];
}

export interface TempVoiceRoom {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string | null;
  userLimit: number;
  bitrate: number;
  memberCount: number;
  members: { id: string; username: string; avatar: string }[];
  isLocked: boolean;
  waitingRoomId: string | null;
}
