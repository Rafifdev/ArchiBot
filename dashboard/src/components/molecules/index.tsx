import React, { useEffect, useRef } from 'react';
import { MdButton, MdIcon, MdSwitch, MdTextField, StatusBadge } from '../atoms';

// Official Material Web Components (@material/web) - Molecules
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/tabs/secondary-tab.js';
import '@material/web/dialog/dialog.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/menu/menu.js';
import '@material/web/menu/menu-item.js';
import '@material/web/ripple/ripple.js';
import '@material/web/elevation/elevation.js';

export interface MdDialogProps {
  open: boolean;
  onClose: () => void;
  headline: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const MdDialog: React.FC<MdDialogProps> = ({ open, onClose, headline, children, actions }) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleClosed = () => onClose();
    el.addEventListener('closed', handleClosed);
    return () => el.removeEventListener('closed', handleClosed);
  }, [onClose]);

  useEffect(() => {
    if (ref.current) {
      ref.current.open = open;
    }
  }, [open]);

  // Lock scroll on background when modal is open
  useEffect(() => {
    if (open) {
      const prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBodyOverflow;
      };
    }
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-xs pointer-events-auto select-none"
          onClick={onClose}
          onWheel={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
        />
      )}
      <md-dialog ref={ref} open={open || undefined} style={{ margin: 'auto' }}>
        <div slot="headline" className="text-base font-normal text-discord-white">
          {headline}
        </div>
        <div
          slot="content"
          className="flex flex-col min-w-[320px] sm:min-w-[540px] md:min-w-[580px] text-discord-text text-xs font-normal"
        >
          {children}
        </div>
        {actions && (
          <div slot="actions" className="flex items-center justify-end gap-2">
            {actions}
          </div>
        )}
      </md-dialog>
    </>
  );
};

export interface MdTabsProps {
  tabs: { id: string; label: string; icon?: string }[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export const MdTabs: React.FC<MdTabsProps> = ({ tabs, activeIndex, onChange }) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) => {
      onChange((e.target as any).activeTabIndex);
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, [onChange]);

  return (
    <md-tabs ref={ref} activeTabIndex={activeIndex} class="rounded-t-xl border-b border-discord-border">
      {tabs.map((t, idx) => (
        <md-primary-tab key={t.id} active={idx === activeIndex || undefined} inlineIcon={Boolean(t.icon) || undefined}>
          {t.icon && <md-icon slot="icon">{t.icon}</md-icon>}
          {t.label}
        </md-primary-tab>
      ))}
    </md-tabs>
  );
};

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) => (
  <MdDialog
    open={open}
    onClose={onClose}
    headline={title}
    actions={
      <>
        <MdButton variant="text" onClick={onClose} disabled={loading}>
          Cancel
        </MdButton>
        <MdButton
          variant="filled"
          onClick={onConfirm}
          disabled={loading}
          className={danger ? '[--md-sys-color-primary:var(--color-discord-red)]' : ''}
        >
          {loading ? 'Processing...' : confirmLabel}
        </MdButton>
      </>
    }
  >
    <p className="text-xs text-discord-muted font-normal leading-relaxed">{message}</p>
  </MdDialog>
);

export interface QuickActionCardProps {
  title: string;
  subtitle: string;
  icon: string;
  iconBg?: string;
  badge?: string;
  external?: boolean;
  onClick: () => void;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  subtitle,
  icon,
  iconBg = 'bg-discord-surface text-discord-blurple',
  badge,
  external,
  onClick,
}) => (
  <div
    onClick={onClick}
    className="relative overflow-hidden bg-discord-card hover:bg-discord-card-hover border border-discord-border hover:border-discord-border-hover rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-start min-h-28 group"
  >
    <md-ripple />
    <md-elevation />
    <div className="flex items-start justify-between relative z-10 w-full mb-1">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mb-1 ${iconBg}`}>
        <md-icon class="text-xl">{icon}</md-icon>
      </div>
      {external && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="text-discord-muted group-hover:text-discord-text transition-colors shrink-0"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M13 11l8.2-8.2M22 6.8V2h-4.8M11 2H9C4 2 2 4 2 9v6c0 5 2 7 7 7h6c5 0 7-2 7-7v-2"
          />
        </svg>
      )}
      {badge && <StatusBadge label={badge} tone="premium" />}
    </div>

    <div className="mt-2 relative z-10 w-full text-left">
      <div className="text-xs font-normal text-discord-white">{title}</div>
      <div className="text-xs text-discord-muted font-normal mt-0.5 truncate">{subtitle}</div>
    </div>
  </div>
);

export interface ModuleCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, icon, onClick }) => (
  <div
    onClick={onClick}
    className="relative overflow-hidden bg-discord-card hover:bg-discord-card-hover border border-discord-border hover:border-discord-border-hover rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-start min-h-32 group"
  >
    <md-ripple />
    <md-elevation />
    <div className="w-10 h-10 rounded-xl bg-discord-surface border border-discord-border flex items-center justify-center shrink-0 text-discord-muted group-hover:text-discord-white transition-colors relative z-10 mb-1">
      <md-icon class="text-xl">{icon}</md-icon>
    </div>

    <div className="mt-2 relative z-10 w-full text-left">
      <div className="text-xs font-normal text-discord-white">{title}</div>
      <div className="text-xs text-discord-muted font-normal mt-1 leading-relaxed">{description}</div>
    </div>
  </div>
);

export interface PageHeaderProps {
  category?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ category, title, description, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      {category && (
        <div className="text-xs font-normal text-discord-muted uppercase tracking-wider mb-1">{category}</div>
      )}
      <h1 className="text-xl font-normal text-discord-white tracking-tight">{title}</h1>
      {description && <p className="text-xs text-discord-muted font-normal mt-0.5">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
  </div>
);

export interface NoticeBannerProps {
  message: string;
  tone?: 'success' | 'danger' | 'info' | 'warning';
  icon?: string;
  className?: string;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({
  message,
  tone = 'success',
  icon,
  className = '',
}) => {
  const toneMap = {
    success: {
      styles: 'bg-discord-green/15 border-discord-green/30 text-discord-green',
      defaultIcon: 'check_circle',
    },
    danger: {
      styles: 'bg-discord-red/15 border-discord-red/30 text-discord-red',
      defaultIcon: 'error',
    },
    info: {
      styles: 'bg-discord-blurple/15 border-discord-blurple/30 text-discord-blurple',
      defaultIcon: 'info',
    },
    warning: {
      styles: 'bg-discord-yellow/15 border-discord-yellow/30 text-discord-yellow',
      defaultIcon: 'warning',
    },
  }[tone];

  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 text-xs font-normal ${toneMap.styles} ${className}`.trim()}
    >
      <MdIcon name={icon || toneMap.defaultIcon} className="text-xl shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export interface SurfaceCardProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  onClick?: () => void;
}

export const SurfaceCard: React.FC<SurfaceCardProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  className = '',
  noPadding = false,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`bg-discord-card border border-discord-border rounded-xl ${noPadding ? 'overflow-hidden' : 'p-5'} ${className}`.trim()}
  >
    {(title || subtitle || headerAction) && (
      <div className={`flex items-start justify-between gap-3 ${noPadding ? 'px-5 pt-5 pb-3' : 'mb-4'}`}>
        <div>
          {title && <h2 className="text-base font-normal text-discord-white">{title}</h2>}
          {subtitle && <p className="text-xs font-normal text-discord-muted mt-0.5">{subtitle}</p>}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>
    )}
    {children}
  </div>
);

export interface SwitchRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  boxed?: boolean;
  danger?: boolean;
  className?: string;
}

export const SwitchRow: React.FC<SwitchRowProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled,
  boxed = false,
  danger = false,
  className = '',
}) => (
  <div
    className={`flex items-center justify-between gap-4 ${
      boxed ? 'p-3.5 rounded-xl bg-discord-surface border border-discord-border' : 'py-1'
    } ${className}`.trim()}
  >
    <div>
      <div className={`text-xs font-normal ${danger ? 'text-discord-red' : 'text-discord-white'}`}>{label}</div>
      {description && <div className="text-xs text-discord-muted font-normal mt-0.5">{description}</div>}
    </div>
    <MdSwitch checked={checked} onChange={onChange} disabled={disabled} />
  </div>
);

export interface EmptyStateProps {
  icon: string;
  title?: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div className={`text-center py-10 text-discord-muted flex flex-col items-center justify-center ${className}`.trim()}>
    <MdIcon name={icon} className="text-4xl mb-2 opacity-80" />
    {title && <div className="text-sm font-normal text-discord-white mb-1">{title}</div>}
    <p className="text-xs font-normal max-w-md leading-relaxed">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const ColorPickerField: React.FC<ColorPickerFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = '#5865F2',
}) => (
  <div className="flex items-center gap-3">
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 w-14 rounded-lg border border-discord-border bg-discord-bg cursor-pointer p-1 shrink-0"
    />
    <MdTextField label={label} value={value} onChange={onChange} placeholder={placeholder} />
  </div>
);
