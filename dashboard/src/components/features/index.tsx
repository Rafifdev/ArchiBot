import React from 'react';

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
  embed: EmbedData;
}

export const DiscordEmbedPreview: React.FC<DiscordEmbedPreviewProps> = ({ content, embed }) => {
  return (
    <div className="bg-discord-sidebar rounded-xl p-4 font-sans text-discord-text border border-discord-border">
      {/* Simulated Bot Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center font-normal text-discord-white text-xs">
          A
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-normal text-xs text-discord-white">ArchiBot</span>
            <span className="bg-discord-blurple text-discord-white text-xs font-normal px-1.5 py-0.5 rounded">
              APP
            </span>
            <span className="text-xs text-discord-muted ml-1 font-normal">Today at 12:00 PM</span>
          </div>
        </div>
      </div>

      {/* Plain message content */}
      {content && <div className="mb-2 pl-10 text-xs font-normal text-discord-text whitespace-pre-wrap">{content}</div>}

      {/* Embed Box */}
      <div
        className="ml-10 bg-discord-card rounded border-l-4 p-3.5 max-w-lg"
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
                  <div key={idx} className={f.inline ? 'col-span-4' : 'col-span-12'}>
                    <div className="text-xs font-normal text-discord-white mb-1">{f.name || '\u200b'}</div>
                    <div className="text-xs text-discord-muted whitespace-pre-wrap font-normal">{f.value || '\u200b'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {embed.thumbnailUrl && (
            <img src={embed.thumbnailUrl} alt="thumb" className="w-20 h-20 rounded-md object-cover shrink-0" />
          )}
        </div>

        {embed.imageUrl && (
          <img src={embed.imageUrl} alt="banner" className="w-full max-h-64 object-cover rounded-md mt-2" />
        )}

        {(embed.footerText || embed.timestamp) && (
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-discord-muted">
            {embed.footerIcon && <img src={embed.footerIcon} alt="" className="w-4 h-4 rounded-full" />}
            <span>
              {embed.footerText}
              {embed.footerText && embed.timestamp ? ' • ' : ''}
              {embed.timestamp ? new Date().toLocaleDateString() : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
