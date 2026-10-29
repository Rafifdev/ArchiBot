import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  MdButton,
  MdTextField,
  MdSelect,
  MdIconButton,
  EmbedsSkeleton,
  MdIcon,
  PageHeader,
  NoticeBanner,
  SurfaceCard,
  SwitchRow,
  ColorPickerField,
} from '../components/ui';
import { DiscordEmbedPreview, EmbedData } from '../components/features';
import { ChannelItem } from '../types/api';
import { useServerSwitch } from '../components/layout';

export const EmbedsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { registerServerFetch } = useServerSwitch();
  const [sending, setSending] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  // Form State
  const [channelId, setChannelId] = useState('');
  const [content, setContent] = useState('');
  const [embed, setEmbed] = useState<EmbedData>({
    title: 'Server Announcement',
    description: 'Welcome to our community! Make sure to read the rules and verify your account to unlock all channels.',
    url: '',
    color: '#5865F2',
    authorName: 'ArchiBot Staff',
    authorIcon: '',
    thumbnailUrl: '',
    imageUrl: '',
    footerText: 'Sent via ArchiBot Web Dashboard',
    footerIcon: '',
    timestamp: true,
    fields: [
      { name: 'Feature 1', value: 'Dynamic Voice Rooms with full button controls', inline: true },
      { name: 'Feature 2', value: 'Anti-Raid Image CAPTCHA Verification', inline: true },
    ],
  });

  useEffect(() => {
    setLoading(true);
    const p = fetch(`/api/guilds/${guildId}/channels`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.channels) {
          const textChannels = data.channels.filter((c: any) => c.typeName === 'text' || c.typeName === 'announcement');
          setChannels(textChannels);
          if (textChannels.length > 0) setChannelId(textChannels[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    registerServerFetch(p);
  }, [guildId]);

  const handleAddField = () => {
    if (embed.fields && embed.fields.length >= 25) return;
    setEmbed((prev) => ({
      ...prev,
      fields: [...(prev.fields || []), { name: 'Field Name', value: 'Field Value', inline: true }],
    }));
  };

  const handleUpdateField = (index: number, key: string, val: any) => {
    setEmbed((prev) => {
      const fields = [...(prev.fields || [])];
      fields[index] = { ...fields[index], [key]: val };
      return { ...prev, fields };
    });
  };

  const handleRemoveField = (index: number) => {
    setEmbed((prev) => ({
      ...prev,
      fields: (prev.fields || []).filter((_, i) => i !== index),
    }));
  };

  const applyPreset = (type: 'rules' | 'event' | 'maintenance' | 'clear') => {
    if (type === 'rules') {
      setEmbed({
        title: 'Server Rules & Guidelines',
        description:
          '1. **Be Respectful** — Treat everyone with dignity. Harassment, racism, and hate speech are strictly prohibited.\n2. **No Spamming** — Avoid repetitive messages, link spam, or mass tagging.\n3. **Follow Discord TOS** — Adhere to Discord Community Guidelines.\n4. **Staff Discretion** — Staff members reserve the right to moderate according to community safety.',
        color: '#5865F2',
        authorName: 'Server Administration',
        footerText: 'Server Rules • ArchiBot',
        timestamp: true,
        fields: [],
      });
    } else if (type === 'event') {
      setEmbed({
        title: 'Community Tournament Night!',
        description: 'Get ready for our weekend tournament! Join voice channels to participate and win special custom roles.',
        color: '#FEE75C',
        authorName: 'Community Events',
        footerText: 'Starts Saturday 8:00 PM',
        timestamp: true,
        fields: [
          { name: 'Prize', value: '1st Place: VIP Role + Discord Nitro', inline: true },
          { name: 'Location', value: 'Stage Channel / Tournament Room', inline: true },
        ],
      });
    } else if (type === 'maintenance') {
      setEmbed({
        title: 'Scheduled Server Maintenance',
        description: 'We will be re-architecting several categories and permissions today. Certain channels may be locked temporarily.',
        color: '#EB459E',
        authorName: 'System Updates',
        footerText: 'Estimated downtime: 15 minutes',
        timestamp: true,
        fields: [],
      });
    } else if (type === 'clear') {
      setEmbed({
        title: '',
        description: '',
        color: '#5865F2',
        fields: [],
      });
    }
  };

  const handleSend = async () => {
    if (!channelId) {
      alert('Please select a target channel.');
      return;
    }
    setSending(true);
    setSuccessNotice('');
    try {
      const res = await fetch(`/api/guilds/${guildId}/embeds/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          channelId,
          content,
          embed,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessNotice('Announcement sent successfully to Discord!');
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  if (loading && channels.length === 0) return <EmbedsSkeleton />;

  const channelOptions = channels.map((c) => ({ value: c.id, label: `#${c.name}` }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        category="VOICE & PANELS"
        title="Visual Embed & Announcement Builder"
        description="Craft rich embeds with markdown, custom Discord color themes, and send them directly to any channel."
      />

      {successNotice && <NoticeBanner message={successNotice} tone="success" />}

      {/* Preset Quick Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-normal text-discord-muted">Quick Presets:</span>
        <MdButton variant="tonal" onClick={() => applyPreset('rules')}>
          Rules Preset
        </MdButton>
        <MdButton variant="tonal" onClick={() => applyPreset('event')}>
          Event Preset
        </MdButton>
        <MdButton variant="tonal" onClick={() => applyPreset('maintenance')}>
          Maintenance Preset
        </MdButton>
        <MdButton variant="text" onClick={() => applyPreset('clear')}>
          Clear Embed
        </MdButton>
      </div>

      {/* Two-Column Editor & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Input Form */}
        <SurfaceCard className="flex flex-col gap-4">
          <h3 className="text-xs font-normal text-discord-white">Announcement Settings</h3>

          <MdSelect
            label="Destination Text Channel"
            value={channelId}
            onChange={setChannelId}
            options={channelOptions}
          />

          <MdTextField
            label="Message Content (Mentions like @everyone)"
            value={content}
            onChange={setContent}
            placeholder="e.g. Hey @everyone, check out this update!"
          />

          <h3 className="text-xs font-normal text-discord-white mt-2 pt-3.5 border-t border-discord-border">
            Embed Content
          </h3>

          <ColorPickerField
            label="Accent Color"
            value={embed.color || '#5865F2'}
            onChange={(val) => setEmbed((p) => ({ ...p, color: val }))}
          />

          <MdTextField
            label="Embed Title"
            value={embed.title || ''}
            onChange={(val) => setEmbed((p) => ({ ...p, title: val }))}
          />

          <MdTextField
            label="Title URL (Optional link)"
            value={embed.url || ''}
            onChange={(val) => setEmbed((p) => ({ ...p, url: val }))}
          />

          <MdTextField
            label="Description (Markdown supported)"
            value={embed.description || ''}
            onChange={(val) => setEmbed((p) => ({ ...p, description: val }))}
            type="textarea"
            rows={4}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MdTextField
              label="Author Name"
              value={embed.authorName || ''}
              onChange={(val) => setEmbed((p) => ({ ...p, authorName: val }))}
            />
            <MdTextField
              label="Author Icon URL"
              value={embed.authorIcon || ''}
              onChange={(val) => setEmbed((p) => ({ ...p, authorIcon: val }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MdTextField
              label="Thumbnail URL"
              value={embed.thumbnailUrl || ''}
              onChange={(val) => setEmbed((p) => ({ ...p, thumbnailUrl: val }))}
            />
            <MdTextField
              label="Banner Image URL"
              value={embed.imageUrl || ''}
              onChange={(val) => setEmbed((p) => ({ ...p, imageUrl: val }))}
            />
          </div>

          {/* Fields */}
          <div className="flex items-center justify-between mt-1">
            <h4 className="text-xs font-normal text-discord-text">Custom Fields ({embed.fields?.length || 0}/25)</h4>
            <MdButton variant="tonal" icon="add" onClick={handleAddField}>
              Add Field
            </MdButton>
          </div>

          {embed.fields?.map((f, i) => (
            <div
              key={i}
              className="flex flex-col gap-2.5 p-3 rounded-lg bg-discord-surface border border-discord-border"
            >
              <div className="flex items-center gap-2">
                <MdTextField
                  label="Field Name"
                  value={f.name}
                  onChange={(val) => handleUpdateField(i, 'name', val)}
                />
                <MdIconButton icon="delete" onClick={() => handleRemoveField(i)} title="Remove field" />
              </div>
              <MdTextField
                label="Field Value"
                value={f.value}
                onChange={(val) => handleUpdateField(i, 'value', val)}
              />
              <SwitchRow
                label="Inline Field"
                checked={Boolean(f.inline)}
                onChange={(checked) => handleUpdateField(i, 'inline', checked)}
              />
            </div>
          ))}

          {/* Footer & Timestamp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 items-center">
            <MdTextField
              label="Footer Text"
              value={embed.footerText || ''}
              onChange={(val) => setEmbed((p) => ({ ...p, footerText: val }))}
            />
            <SwitchRow
              label="Show Timestamp"
              checked={Boolean(embed.timestamp)}
              onChange={(checked) => setEmbed((p) => ({ ...p, timestamp: checked }))}
              className="px-1"
            />
          </div>

          <MdButton variant="filled" icon="send" onClick={handleSend} disabled={sending}>
            {sending ? 'Sending to Discord...' : 'Send Announcement'}
          </MdButton>
        </SurfaceCard>

        {/* Right: Real-time Discord Preview */}
        <div className="sticky top-20 flex flex-col gap-3">
          <div className="flex items-center gap-2.5 text-xs font-normal text-discord-text">
            <MdIcon name="preview" className="text-discord-blurple text-base" />
            <span>Live Discord Simulator</span>
          </div>
          <DiscordEmbedPreview content={content} embed={embed} />
        </div>
      </div>
    </div>
  );
};
