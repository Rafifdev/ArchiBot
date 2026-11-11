import React, { useState, useMemo } from 'react';
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
  ColorPickerField,
  DiscordMark,
  MdButton,
  MdChip,
  MdDivider,
  MdIcon,
  MdIconButton,
  MdSelect,
  MdTextField,
  SwitchRow,
} from '../ui';

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface EmbedData {
  title?: string;
  description?: string;
  url?: string;
  color?: string;
  authorName?: string;
  authorIcon?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  footerText?: string;
  footerIcon?: string;
  timestamp?: boolean;
  fields?: EmbedField[];
}

export interface DiscordEmbedPreviewProps {
  content?: string;
  embed?: EmbedData | null;
  botName?: string;
  botAvatar?: string | null;
  attachmentSlot?: React.ReactNode;
  embedBannerSlot?: React.ReactNode;
  componentsSlot?: React.ReactNode;
  className?: string;
}

export const DiscordEmbedPreview: React.FC<DiscordEmbedPreviewProps> = ({
  content,
  embed,
  botName = 'ArchiBot',
  botAvatar,
  attachmentSlot,
  embedBannerSlot,
  componentsSlot,
  className = 'bg-discord-sidebar rounded-xl p-4 font-sans text-discord-text border border-discord-border',
}) => {
  const hasEmbedContent = Boolean(
    embed &&
      (embed.authorName ||
        embed.title ||
        embed.description ||
        (embed.fields && embed.fields.length > 0) ||
        embed.thumbnailUrl ||
        embed.imageUrl ||
        embedBannerSlot ||
        embed.footerText ||
        embed.timestamp)
  );

  return (
    <div className={className}>
      {/* Simulated Bot Header */}
      <div className="flex items-center gap-3 mb-2">
        {botAvatar ? (
          <img src={botAvatar} alt={botName} className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center font-normal text-white text-xs shrink-0">
            <DiscordMark className="w-4 h-4" />
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-normal text-xs text-discord-white">{botName}</span>
          <Badge size="xs" tone="blurple" label="APP" />
          <span className="text-xs text-discord-muted ml-0.5 font-normal">Today at 12:00 PM</span>
        </div>
      </div>

      {/* Plain message content */}
      {content && (
        <div className="mb-2.5 pl-11 text-xs font-normal text-discord-text whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      )}

      {/* Standalone Attachment Slot (when Welcome Card Placement = Attachment) */}
      {attachmentSlot && <div className="mb-2.5 pl-11 max-w-lg">{attachmentSlot}</div>}

      {/* Authentic Discord Embed Strip (left colored accent bar, no 4-sided card border) */}
      {hasEmbedContent && embed && (
        <div
          className="ml-11 bg-discord-surface/45 rounded-r-md border-l-4 px-3.5 py-3 max-w-lg"
          style={{ borderLeftColor: embed.color || '#5865F2' }}
        >
          <div className="flex justify-between gap-4">
            <div className="flex-1 min-w-0">
              {embed.authorName && (
                <div className="flex items-center gap-2 mb-2">
                  {embed.authorIcon && (
                    <img src={embed.authorIcon} alt="" className="w-5 h-5 rounded-full object-cover" />
                  )}
                  <span className="text-xs font-normal text-discord-white">{embed.authorName}</span>
                </div>
              )}

              {embed.title && (
                <div className="text-xs font-normal text-discord-white mb-1.5 break-words">{embed.title}</div>
              )}

              {embed.description && (
                <div className="text-xs text-discord-text/90 whitespace-pre-wrap leading-relaxed mb-3 break-words font-normal">
                  {embed.description}
                </div>
              )}

              {embed.fields && embed.fields.length > 0 && (
                <div className="grid grid-cols-12 gap-3 mb-3">
                  {embed.fields.map((f, idx) => (
                    <div key={idx} className={f.inline ? 'col-span-6 sm:col-span-4' : 'col-span-12'}>
                      <div className="text-xs font-normal text-discord-white mb-0.5">{f.name || '\u200b'}</div>
                      <div className="text-xs text-discord-muted whitespace-pre-wrap font-normal">
                        {f.value || '\u200b'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {embed.thumbnailUrl && (
              <img
                src={embed.thumbnailUrl}
                alt="thumb"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0"
              />
            )}
          </div>

          {embedBannerSlot ? (
            <div className="mt-2 rounded-lg overflow-hidden">{embedBannerSlot}</div>
          ) : (
            embed.imageUrl && (
              <img src={embed.imageUrl} alt="banner" className="w-full max-h-64 object-cover rounded-lg mt-2" />
            )
          )}

          {(embed.footerText || embed.timestamp) && (
            <div className="flex items-center gap-1.5 mt-2.5 text-[11px] font-normal text-discord-muted">
              {embed.footerIcon && <img src={embed.footerIcon} alt="" className="w-4 h-4 rounded-full object-cover" />}
              <span>
                {embed.footerText}
                {embed.footerText && embed.timestamp ? ' • ' : ''}
                {embed.timestamp ? new Date().toLocaleDateString() : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {componentsSlot && <div className="mt-2.5 pl-11">{componentsSlot}</div>}
    </div>
  );
};

// ============================================================================
// REUSABLE DISCORD MESSAGE & EMBED COMPOSER (Flat Layout — Zero Nested Cards)
// ============================================================================

export type IconSourceMode = 'none' | 'member' | 'server' | 'custom';

export interface WelcomeEmbedConfig {
  enabled: boolean;
  color: string;
  authorName: string;
  authorIconMode: IconSourceMode;
  authorIconUrl: string;
  title: string;
  description: string;
  thumbnailMode: IconSourceMode;
  thumbnailUrl: string;
  imageUrl: string;
  footerText: string;
  footerIconMode: IconSourceMode;
  footerIconUrl: string;
  timestamp: boolean;
  fields: EmbedField[];
}

export interface GreetingDeliveryConfig {
  content: string;
  embed: WelcomeEmbedConfig;
  cardEnabled: boolean;
  cardPlacement: 'attachment' | 'embed';
}

export interface DiscordMessageComposerProps {
  value: GreetingDeliveryConfig;
  onChange: (next: GreetingDeliveryConfig) => void;
  botName?: string;
  botAvatar?: string | null;
  previewUser: string;
  previewAvatarUrl?: string | null;
  serverName: string;
  serverIconUrl?: string | null;
  memberCount: number;
  extraPreviewFooterNote?: string;
  renderCardBanner?: () => React.ReactNode;
  showCardSection?: boolean;
  contentPlaceholder?: string;
  leadingSlot?: React.ReactNode;
  onboardingSlot?: React.ReactNode;
  testAction?: {
    label: string;
    loading?: boolean;
    disabled?: boolean;
    icon?: string;
    onClick: () => void;
  };
}

type ActiveTargetField =
  | { kind: 'content' }
  | { kind: 'authorName' }
  | { kind: 'title' }
  | { kind: 'description' }
  | { kind: 'footerText' }
  | { kind: 'fieldName'; index: number }
  | { kind: 'fieldValue'; index: number };

export interface VariableDefinition {
  token: string;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  preview: (vars: { username: string; server: string; memberCount: number }) => string;
}

export const VARIABLE_DEFINITIONS: VariableDefinition[] = [
  {
    token: '{user}',
    label: 'Member Mention',
    shortLabel: 'Mention',
    icon: 'alternate_email',
    description: 'Mentions the joining member with a clickable @tag',
    preview: (vars) => `@${vars.username || 'Member'}`,
  },
  {
    token: '{username}',
    label: 'Username',
    shortLabel: 'Username',
    icon: 'badge',
    description: 'Displays member name as plain text without tagging',
    preview: (vars) => vars.username || 'Member',
  },
  {
    token: '{server}',
    label: 'Server Name',
    shortLabel: 'Server',
    icon: 'dns',
    description: 'Displays the current Discord server name',
    preview: (vars) => vars.server || 'Server',
  },
  {
    token: '{memberCount}',
    label: 'Member Count',
    shortLabel: 'Count',
    icon: 'tag',
    description: 'Displays the server member count after joining',
    preview: (vars) => `#${vars.memberCount || 1}`,
  },
];

export const VARIABLE_TOKENS = VARIABLE_DEFINITIONS;

const ICON_MODE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'member', label: 'Member Avatar' },
  { value: 'server', label: 'Server Icon' },
  { value: 'custom', label: 'Custom Image URL' },
];

function resolvePreviewIcon(
  mode: IconSourceMode,
  customUrl: string,
  memberAvatar?: string | null,
  serverIcon?: string | null
): string | undefined {
  if (mode === 'member') return memberAvatar || undefined;
  if (mode === 'server') return serverIcon || undefined;
  if (mode === 'custom' && customUrl.trim()) return customUrl.trim();
  return undefined;
}

function interpolatePreviewText(
  raw: string,
  vars: { user: string; username: string; server: string; memberCount: number }
): string {
  return String(raw || '')
    .replaceAll('{user}', `@${vars.username}`)
    .replaceAll('{member.mention}', `@${vars.username}`)
    .replaceAll('{username}', vars.username)
    .replaceAll('{member.displayName}', vars.username)
    .replaceAll('{member.username}', vars.username)
    .replaceAll('{server}', vars.server)
    .replaceAll('{guild.name}', vars.server)
    .replaceAll('{memberCount}', String(vars.memberCount))
    .replaceAll('{guild.memberCount}', String(vars.memberCount));
}

export const DiscordMessageComposer: React.FC<DiscordMessageComposerProps> = ({
  value,
  onChange,
  botName = 'ArchiBot',
  botAvatar,
  previewUser,
  previewAvatarUrl,
  serverName,
  serverIconUrl,
  memberCount,
  extraPreviewFooterNote,
  renderCardBanner,
  showCardSection = true,
  contentPlaceholder,
  leadingSlot,
  onboardingSlot,
  testAction,
}) => {
  const [activeField, setActiveField] = useState<ActiveTargetField>({ kind: 'content' });
  const [lastInsertedToken, setLastInsertedToken] = useState<string | null>(null);
  const [showAdvancedEmbed, setShowAdvancedEmbed] = useState(() =>
    Boolean(
      value.embed.authorName ||
        value.embed.imageUrl ||
        (value.embed.fields && value.embed.fields.length > 0)
    )
  );

  const activeFieldLabel = useMemo(() => {
    switch (activeField.kind) {
      case 'content':
        return 'Greeting Message';
      case 'authorName':
        return 'Author Name';
      case 'title':
        return 'Embed Title';
      case 'description':
        return 'Embed Description';
      case 'footerText':
        return 'Embed Footer';
      case 'fieldName':
        return `Field #${activeField.index + 1} Title`;
      case 'fieldValue':
        return `Field #${activeField.index + 1} Value`;
      default:
        return 'Greeting Message';
    }
  }, [activeField]);

  const updateEmbed = (patch: Partial<WelcomeEmbedConfig>) => {
    onChange({
      ...value,
      embed: { ...value.embed, ...patch },
    });
  };

  const handleInsertVariable = (token: string) => {
    setLastInsertedToken(token);
    setTimeout(() => {
      setLastInsertedToken((prev) => (prev === token ? null : prev));
    }, 1200);

    if (!value.embed.enabled && activeField.kind !== 'content') {
      onChange({ ...value, content: `${value.content}${value.content ? ' ' : ''}${token}` });
      return;
    }

    switch (activeField.kind) {
      case 'content':
        onChange({ ...value, content: `${value.content}${value.content ? ' ' : ''}${token}` });
        break;
      case 'authorName':
        updateEmbed({ authorName: `${value.embed.authorName}${value.embed.authorName ? ' ' : ''}${token}` });
        break;
      case 'title':
        updateEmbed({ title: `${value.embed.title}${value.embed.title ? ' ' : ''}${token}` });
        break;
      case 'description':
        updateEmbed({
          description: `${value.embed.description}${value.embed.description ? ' ' : ''}${token}`,
        });
        break;
      case 'footerText':
        updateEmbed({ footerText: `${value.embed.footerText}${value.embed.footerText ? ' ' : ''}${token}` });
        break;
      case 'fieldName': {
        const fields = [...(value.embed.fields || [])];
        if (fields[activeField.index]) {
          const cur = fields[activeField.index].name;
          fields[activeField.index] = { ...fields[activeField.index], name: `${cur}${cur ? ' ' : ''}${token}` };
          updateEmbed({ fields });
        }
        break;
      }
      case 'fieldValue': {
        const fields = [...(value.embed.fields || [])];
        if (fields[activeField.index]) {
          const cur = fields[activeField.index].value;
          fields[activeField.index] = { ...fields[activeField.index], value: `${cur}${cur ? ' ' : ''}${token}` };
          updateEmbed({ fields });
        }
        break;
      }
    }
  };

  const handleAddField = () => {
    const fields = value.embed.fields || [];
    if (fields.length >= 5) return;
    updateEmbed({
      fields: [...fields, { name: 'Getting Started', value: 'Say hello and introduce yourself!', inline: true }],
    });
  };

  const handleUpdateField = (idx: number, patch: Partial<EmbedField>) => {
    const fields = [...(value.embed.fields || [])];
    fields[idx] = { ...fields[idx], ...patch };
    updateEmbed({ fields });
  };

  const handleRemoveField = (idx: number) => {
    updateEmbed({
      fields: (value.embed.fields || []).filter((_, i) => i !== idx),
    });
  };

  const vars = {
    user: `@${previewUser}`,
    username: previewUser,
    server: serverName,
    memberCount,
  };

  const authorPreviewImg = resolvePreviewIcon(
    value.embed.authorIconMode,
    value.embed.authorIconUrl,
    previewAvatarUrl,
    serverIconUrl
  );
  const thumbPreviewImg = resolvePreviewIcon(
    value.embed.thumbnailMode,
    value.embed.thumbnailUrl,
    previewAvatarUrl,
    serverIconUrl
  );
  const footerPreviewImg = resolvePreviewIcon(
    value.embed.footerIconMode,
    value.embed.footerIconUrl,
    previewAvatarUrl,
    serverIconUrl
  );

  const resolvedDescBase = interpolatePreviewText(value.embed.description, vars);
  const resolvedDesc = extraPreviewFooterNote
    ? `${resolvedDescBase}${resolvedDescBase ? '\n\n' : ''}${extraPreviewFooterNote}`
    : resolvedDescBase;

  const resolvedContentBase = interpolatePreviewText(value.content, vars);
  const resolvedContent =
    !value.embed.enabled && extraPreviewFooterNote
      ? `${resolvedContentBase}${resolvedContentBase ? '\n\n' : ''}${extraPreviewFooterNote}`
      : resolvedContentBase;

  const hasAnyPreview = Boolean(
    resolvedContent ||
      (showCardSection && value.cardEnabled && renderCardBanner) ||
      value.embed.enabled
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      {/* LEFT COLUMN: Clean Step-by-Step Editor (Zero Nested Cards) */}
      <div className="flex flex-col gap-4">
        {leadingSlot}

        {/* Greeting Message Textarea + Clean Inline Variable Pills (Zero Outer Card) */}
        <div
          className="flex flex-col gap-2"
          onFocusCapture={() => setActiveField({ kind: 'content' })}
        >
          <MdTextField
            label="Greeting Message"
            value={value.content}
            onChange={(val) => onChange({ ...value, content: val })}
            type="textarea"
            rows={2}
            placeholder={
              contentPlaceholder ||
              'Welcome {user} to **{server}**! You are member #{memberCount}.'
            }
          />

          {/* Variables Section (Zero Outer Card Wrapper) */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[12px] text-discord-muted font-normal select-none">
              variables:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {VARIABLE_DEFINITIONS.map((v) => {
                const isInserted = lastInsertedToken === v.token;
                return (
                  <button
                    key={v.token}
                    type="button"
                    onClick={() => handleInsertVariable(v.token)}
                    title={`${v.label} (contoh: ${v.preview(vars)})`}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer select-none active:scale-[0.98] ${
                      isInserted
                        ? 'border-discord-green bg-discord-green/15 text-discord-white shadow-xs ring-1 ring-discord-green/40'
                        : 'border-discord-border bg-discord-surface/40 hover:bg-discord-surface/80 hover:border-discord-blurple/60 text-discord-text'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-xs font-normal text-discord-blurple group-hover:text-discord-white transition-colors">
                        {v.token}
                      </span>
                      <span className="text-[11px] text-discord-muted truncate font-normal">
                        {v.shortLabel}
                      </span>
                    </div>
                    <MdIcon
                      name={isInserted ? 'check' : v.icon}
                      className={`text-base shrink-0 ml-1.5 transition-transform ${
                        isInserted
                          ? 'text-discord-green scale-110'
                          : 'text-discord-muted group-hover:text-discord-white'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <MdDivider />

        {/* Attachment & Rich Embed Toggles */}
        <div className="flex flex-col gap-3.5">
          {showCardSection && (
            <div className="flex flex-col gap-3">
              <SwitchRow
                label="Attach Welcome Card"
                description="Include the welcome banner image designed in the section above."
                checked={value.cardEnabled}
                onChange={(checked) => onChange({ ...value, cardEnabled: checked })}
              />

              {value.cardEnabled && value.embed.enabled && (
                <MdSelect
                  label="Card Position"
                  value={value.cardPlacement}
                  onChange={(val) =>
                    onChange({
                      ...value,
                      cardPlacement: val as 'attachment' | 'embed',
                    })
                  }
                  options={[
                    { value: 'attachment', label: 'Above Embed (Standalone Image)' },
                    { value: 'embed', label: 'Inside Embed (Bottom Banner)' },
                  ]}
                />
              )}
            </div>
          )}

          <SwitchRow
            label="Rich Embed"
            description="Add a colored Discord embed panel with title, description, and thumbnail."
            checked={value.embed.enabled}
            onChange={(checked) =>
              onChange({
                ...value,
                cardPlacement: checked ? value.cardPlacement : 'attachment',
                embed: { ...value.embed, enabled: checked },
              })
            }
          />
        </div>

        {/* Flat Rich Embed Inputs (Only shown when Rich Embed is ON) */}
        {value.embed.enabled && (
          <>
            <MdDivider />
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div onFocusCapture={() => setActiveField({ kind: 'title' })}>
                  <MdTextField
                    label="Embed Title"
                    value={value.embed.title}
                    onChange={(val) => updateEmbed({ title: val })}
                    placeholder="e.g. Welcome to {server}!"
                  />
                </div>
                <ColorPickerField
                  label="Border Color"
                  value={value.embed.color || '#5865F2'}
                  onChange={(col) => updateEmbed({ color: col })}
                />
              </div>

              <div onFocusCapture={() => setActiveField({ kind: 'description' })}>
                <MdTextField
                  label="Embed Description"
                  value={value.embed.description}
                  onChange={(val) => updateEmbed({ description: val.slice(0, 4000) })}
                  type="textarea"
                  rows={3}
                  placeholder="Write your greeting details here..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MdSelect
                  label="Thumbnail Image"
                  value={value.embed.thumbnailMode}
                  onChange={(val) => updateEmbed({ thumbnailMode: val as IconSourceMode })}
                  options={ICON_MODE_OPTIONS}
                />
                <div onFocusCapture={() => setActiveField({ kind: 'footerText' })}>
                  <MdTextField
                    label="Footer Text"
                    value={value.embed.footerText}
                    onChange={(val) => updateEmbed({ footerText: val })}
                    placeholder="e.g. {server} • Member #{memberCount}"
                  />
                </div>
              </div>

              {value.embed.thumbnailMode === 'custom' && (
                <MdTextField
                  label="Thumbnail Image URL"
                  value={value.embed.thumbnailUrl}
                  onChange={(val) => updateEmbed({ thumbnailUrl: val })}
                  placeholder="https://..."
                />
              )}

              {/* Progressive Disclosure for Optional Embed Extras */}
              <div>
                <MdButton
                  variant="text"
                  size="xs"
                  icon={showAdvancedEmbed ? 'expand_less' : 'expand_more'}
                  onClick={() => setShowAdvancedEmbed((prev) => !prev)}
                  className="text-discord-muted hover:text-discord-white -ml-2.5"
                >
                  {showAdvancedEmbed
                    ? 'Hide extra embed options'
                    : 'More embed options (Author, Fields, Timestamp)'}
                </MdButton>
              </div>

              {showAdvancedEmbed && (
                <div className="flex flex-col gap-3.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div onFocusCapture={() => setActiveField({ kind: 'authorName' })}>
                      <MdTextField
                        label="Author Name"
                        value={value.embed.authorName}
                        onChange={(val) => updateEmbed({ authorName: val })}
                        placeholder="Optional top label..."
                      />
                    </div>
                    <MdSelect
                      label="Author Icon"
                      value={value.embed.authorIconMode}
                      onChange={(val) => updateEmbed({ authorIconMode: val as IconSourceMode })}
                      options={ICON_MODE_OPTIONS}
                    />
                  </div>

                  {value.embed.authorIconMode === 'custom' && (
                    <MdTextField
                      label="Author Icon URL"
                      value={value.embed.authorIconUrl}
                      onChange={(val) => updateEmbed({ authorIconUrl: val })}
                      placeholder="https://..."
                    />
                  )}

                  {(!showCardSection || !value.cardEnabled || value.cardPlacement !== 'embed') && (
                    <MdTextField
                      label="Custom Banner Image URL"
                      value={value.embed.imageUrl}
                      onChange={(val) => updateEmbed({ imageUrl: val })}
                      placeholder="https://... (optional bottom banner)"
                    />
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <MdSelect
                      label="Footer Icon"
                      value={value.embed.footerIconMode}
                      onChange={(val) => updateEmbed({ footerIconMode: val as IconSourceMode })}
                      options={ICON_MODE_OPTIONS}
                    />
                    <SwitchRow
                      label="Show Timestamp"
                      checked={value.embed.timestamp}
                      onChange={(checked) => updateEmbed({ timestamp: checked })}
                    />
                  </div>

                  {value.embed.footerIconMode === 'custom' && (
                    <MdTextField
                      label="Footer Icon URL"
                      value={value.embed.footerIconUrl}
                      onChange={(val) => updateEmbed({ footerIconUrl: val })}
                      placeholder="https://..."
                    />
                  )}

                  {/* Flat Embed Fields (Zero Nested Cards) */}
                  <MdDivider />
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-normal text-discord-white">
                        Custom Fields ({(value.embed.fields || []).length}/5)
                      </span>
                      {(value.embed.fields || []).length < 5 && (
                        <MdButton variant="text" size="xs" icon="add" onClick={handleAddField}>
                          Add Field
                        </MdButton>
                      )}
                    </div>

                    {(value.embed.fields || []).map((field, idx) => (
                      <div key={idx} className="flex flex-col gap-2.5 pt-2 border-t border-discord-border/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div onFocusCapture={() => setActiveField({ kind: 'fieldName', index: idx })}>
                            <MdTextField
                              label={`Field #${idx + 1} Title`}
                              value={field.name}
                              onChange={(val) => handleUpdateField(idx, { name: val })}
                            />
                          </div>
                          <div onFocusCapture={() => setActiveField({ kind: 'fieldValue', index: idx })}>
                            <MdTextField
                              label={`Field #${idx + 1} Value`}
                              value={field.value}
                              onChange={(val) => handleUpdateField(idx, { value: val })}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <MdChip
                            label="Inline"
                            selected={Boolean(field.inline)}
                            onClick={() => handleUpdateField(idx, { inline: !field.inline })}
                          />
                          <MdIconButton
                            icon="delete"
                            title="Remove field"
                            onClick={() => handleRemoveField(idx)}
                            className="text-discord-muted hover:text-discord-red"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Optional Onboarding Channels Slot (Positioned right below Rich Embed) */}
        {onboardingSlot && (
          <div className="flex flex-col gap-3.5 pt-1">
            <MdDivider />
            {onboardingSlot}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Live Real-Time Discord Preview & Test Action (Zero Outer Card) */}
      <div className="xl:sticky xl:top-6 border-t border-discord-border pt-5 xl:border-t-0 xl:pt-0 xl:border-l xl:pl-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-normal text-discord-muted">
            <MdIcon name="visibility" className="text-base text-discord-blurple" />
            <span>Live Discord Preview</span>
          </div>
          {testAction && (
            <MdButton
              variant="tonal"
              size="sm"
              loading={testAction.loading}
              disabled={testAction.disabled}
              icon={testAction.icon || 'send'}
              onClick={testAction.onClick}
            >
              {testAction.label}
            </MdButton>
          )}
        </div>

        {!hasAnyPreview ? (
          <p className="text-xs font-normal text-discord-muted py-6">
            Type a greeting message or enable an attachment on the left to preview how {botName} will greet members.
          </p>
        ) : (
          <DiscordEmbedPreview
            className="bg-transparent border-0 p-0 font-sans text-discord-text"
            botName={botName}
            botAvatar={botAvatar}
            content={resolvedContent}
            attachmentSlot={
              showCardSection &&
              renderCardBanner &&
              value.cardEnabled &&
              (!value.embed.enabled || value.cardPlacement === 'attachment')
                ? renderCardBanner()
                : undefined
            }
            embedBannerSlot={
              showCardSection &&
              renderCardBanner &&
              value.embed.enabled &&
              value.cardEnabled &&
              value.cardPlacement === 'embed'
                ? renderCardBanner()
                : undefined
            }
            embed={
              value.embed.enabled
                ? {
                    color: value.embed.color || '#5865F2',
                    authorName: interpolatePreviewText(value.embed.authorName, vars),
                    authorIcon: authorPreviewImg,
                    title: interpolatePreviewText(value.embed.title, vars),
                    description: resolvedDesc,
                    thumbnailUrl: thumbPreviewImg,
                    imageUrl: value.embed.imageUrl || undefined,
                    footerText: interpolatePreviewText(value.embed.footerText, vars),
                    footerIcon: footerPreviewImg,
                    timestamp: value.embed.timestamp,
                    fields: (value.embed.fields || []).map((f) => ({
                      name: interpolatePreviewText(f.name, vars),
                      value: interpolatePreviewText(f.value, vars),
                      inline: f.inline,
                    })),
                  }
                : null
            }
          />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// REUSABLE TEMPLATE CHANNEL TREE PREVIEW (Shared by Template Builder & Backups)
// ============================================================================

export interface ParsedChannelItem {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'jtc' | 'stage' | 'adminvoice';
  readOnly: boolean;
  edited?: boolean;
}

export interface ParsedCategoryGroup {
  id: string;
  category: string | null;
  channels: ParsedChannelItem[];
  edited?: boolean;
}

export function parseTemplatePreview(spec?: string, prefix = 'tpl'): ParsedCategoryGroup[] {
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

function getPreviewChannelIcon(ch: ParsedChannelItem): string {
  if (ch.type === 'jtc') return 'add_circle_outline';
  if (ch.type === 'stage') return 'podcasts';
  if (ch.type === 'voice' || ch.type === 'adminvoice') return 'volume_up';
  return ch.readOnly ? 'lock' : 'tag';
}

const PreviewChannelRowContent: React.FC<{
  ch: ParsedChannelItem;
  onEdit?: () => void;
}> = ({ ch, onEdit }) => (
  <>
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <MdIcon name={getPreviewChannelIcon(ch)} className="text-sm text-discord-muted shrink-0" />
      <span className="truncate">{ch.name}</span>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {ch.readOnly && <span className="text-[10px] text-discord-muted shrink-0">Read-only</span>}
      {onEdit && (
        <button
          type="button"
          title={`Edit ${ch.name}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-6 h-6 rounded flex items-center justify-center text-discord-muted hover:text-discord-white hover:bg-discord-card-hover transition-colors cursor-pointer bg-transparent border-0 p-0"
        >
          <MdIcon name="edit" className="!text-[16px] leading-none" />
        </button>
      )}
    </div>
  </>
);

const SortablePreviewChannelRow: React.FC<{
  ch: ParsedChannelItem;
  parentId: string;
  dropPosition?: 'top' | 'bottom' | null;
  onEdit?: () => void;
}> = ({ ch, parentId, dropPosition, onEdit }) => {
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
      className={`relative flex items-center justify-between gap-2 px-2 py-1 rounded-md text-xs font-normal text-discord-text hover:bg-discord-card-hover/60 transition-colors duration-150 cursor-move select-none ${
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
      <PreviewChannelRowContent ch={ch} onEdit={onEdit} />
    </div>
  );
};

const SortablePreviewCategoryBlock: React.FC<{
  group: ParsedCategoryGroup;
  isCollapsed: boolean;
  onToggleCollapse: (id: string) => void;
  onEditCategory?: () => void;
  dropPosition?: 'top' | 'bottom' | 'header' | null;
  children: React.ReactNode;
}> = ({ group, isCollapsed, onToggleCollapse, onEditCategory, dropPosition, children }) => {
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
          className="relative flex items-center justify-between gap-2 px-1.5 py-1 rounded-md text-[11px] font-normal text-discord-muted hover:text-discord-text hover:bg-discord-card-hover/50 transition-colors duration-150 uppercase tracking-wider cursor-pointer select-none"
        >
          <div className="flex items-center gap-1 min-w-0">
            <MdIcon
              name="expand_more"
              className={`text-sm leading-none transition-transform duration-150 ${
                isCollapsed ? '-rotate-90' : ''
              }`}
            />
            <span className="truncate">{group.category}</span>
          </div>
          {onEditCategory && (
            <button
              type="button"
              title={`Edit ${group.category}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEditCategory();
              }}
              className="w-6 h-6 rounded flex items-center justify-center text-discord-muted hover:text-discord-white hover:bg-discord-card-hover transition-colors cursor-pointer bg-transparent border-0 p-0 shrink-0"
            >
              <MdIcon name="edit" className="!text-[16px] leading-none" />
            </button>
          )}
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

export interface ChannelTreePreviewProps {
  spec?: string;
  groups?: ParsedCategoryGroup[];
  onGroupsChange?: (nextGroups: ParsedCategoryGroup[]) => void;
  onEditCategory?: (group: ParsedCategoryGroup) => void;
  onEditChannel?: (ch: ParsedChannelItem, parentGroup: ParsedCategoryGroup) => void;
  maxHeightClass?: string;
}

export const ChannelTreePreview: React.FC<ChannelTreePreviewProps> = ({
  spec,
  groups: controlledGroups,
  onGroupsChange,
  onEditCategory,
  onEditChannel,
  maxHeightClass = 'max-h-44',
}) => {
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
              onEditCategory={onEditCategory ? () => onEditCategory(group) : undefined}
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
                  onEdit={onEditChannel ? () => onEditChannel(ch, group) : undefined}
                  dropPosition={
                    dropIndicator?.type === 'channel' &&
                    dropIndicator.id === ch.id &&
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
