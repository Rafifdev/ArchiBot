import React, { useState, useEffect, useRef } from 'react';

// Official Material Web Components (@material/web)
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/elevated-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/iconbutton/filled-icon-button.js';
import '@material/web/iconbutton/outlined-icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';
import '@material/web/switch/switch.js';
import '@material/web/progress/circular-progress.js';
import '@material/web/divider/divider.js';
import '@material/web/chips/chip-set.js';
import '@material/web/chips/filter-chip.js';
import '@material/web/chips/assist-chip.js';
import '@material/web/fab/fab.js';
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

// ============================================================================
// ICONS & BRANDING
// ============================================================================

export const DiscordMark: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={`shrink-0 fill-current ${className}`} viewBox="0 0 127.14 96.36">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.86,53,48.81,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

export const MdIcon: React.FC<{ name: string; slot?: string; className?: string }> = ({
  name,
  slot,
  className = '',
}) => (
  <span
    slot={slot}
    className={`material-symbols-outlined inline-flex items-center justify-center leading-none select-none shrink-0 overflow-hidden ${className}`.trim()}
  >
    {name}
  </span>
);

export const MdDivider: React.FC<{ inset?: boolean; className?: string }> = ({ inset, className = '' }) => (
  <md-divider inset={inset || undefined} class={className} />
);

// ============================================================================
// BUTTONS
// ============================================================================

export interface MdButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'tonal' | 'text' | 'elevated' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  icon?: string;
  iconTrailing?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const MdButton: React.FC<MdButtonProps> = ({
  variant = 'filled',
  size = 'md',
  disabled = false,
  onClick,
  icon,
  iconTrailing = false,
  loading = false,
  children,
  className = '',
  type = 'button',
  ...rest
}) => {
  const sizeStyles: Record<string, string> = {
    xs: 'h-7 min-h-[28px] px-2.5 text-[11px] gap-1.5 rounded-lg font-medium',
    sm: 'h-9 min-h-[36px] px-3.5 text-xs gap-1.5 rounded-lg font-medium',
    md: 'h-10 min-h-[40px] px-4 text-xs sm:text-sm gap-2 rounded-xl font-medium',
    lg: 'h-11 min-h-[44px] px-5 text-sm gap-2.5 rounded-xl font-medium',
    xl: 'h-12 min-h-[48px] px-6 text-base gap-3 rounded-2xl font-medium',
    '2xl': 'h-14 min-h-[56px] px-8 text-lg gap-3.5 rounded-2xl font-semibold',
  };

  const iconSizes: Record<string, string> = {
    xs: 'text-sm w-3.5 h-3.5',
    sm: 'text-base w-4 h-4',
    md: 'text-lg w-4.5 h-4.5',
    lg: 'text-xl w-5 h-5',
    xl: 'text-2xl w-6 h-6',
    '2xl': 'text-2xl w-7 h-7',
  };

  const variantStyles: Record<string, string> = {
    filled: 'bg-discord-blurple text-discord-white hover:bg-discord-blurple-hover shadow-sm hover:shadow-md',
    tonal: 'bg-discord-surface text-discord-white border border-discord-border hover:bg-discord-card-hover hover:border-discord-border-hover',
    outlined: 'bg-transparent border border-discord-border text-discord-white hover:bg-discord-surface hover:border-discord-blurple',
    text: 'bg-transparent text-discord-white hover:bg-discord-surface/60',
    elevated: 'bg-discord-card text-discord-white border border-discord-border shadow-md hover:shadow-lg hover:bg-discord-card-hover',
    danger: 'bg-discord-red text-discord-white hover:bg-[#c93b3e] shadow-sm',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-sans tracking-wide transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.filled} ${className}`.trim()}
      {...rest}
    >
      {loading ? (
        <span className="inline-block animate-spin rounded-full border-2 border-white/20 border-t-white w-4 h-4 mr-1 shrink-0" />
      ) : icon && !iconTrailing ? (
        <MdIcon name={icon} className={`shrink-0 leading-none ${iconSizes[size] || 'text-base'}`} />
      ) : null}
      {children && <span className="whitespace-nowrap leading-normal flex items-center">{children}</span>}
      {!loading && icon && iconTrailing && (
        <MdIcon name={icon} className={`shrink-0 leading-none ${iconSizes[size] || 'text-base'}`} />
      )}
    </button>
  );
};

export const Button = MdButton;

export interface MdIconButtonProps {
  icon: string;
  variant?: 'standard' | 'filled' | 'outlined';
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<any>) => void;
  title?: string;
  className?: string;
}

export const MdIconButton: React.FC<MdIconButtonProps> = ({
  icon,
  variant = 'standard',
  disabled,
  onClick,
  title,
  className = '',
}) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onClick) return;
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [onClick]);

  const Tag =
    variant === 'filled'
      ? 'md-filled-icon-button'
      : variant === 'outlined'
      ? 'md-outlined-icon-button'
      : 'md-icon-button';

  return React.createElement(
    Tag,
    {
      ref,
      disabled: disabled || undefined,
      title,
      class: className,
    },
    <md-icon>{icon}</md-icon>
  );
};

export interface MdFabProps {
  icon: string;
  label?: string;
  variant?: 'surface' | 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  className?: string;
}

export const MdFab: React.FC<MdFabProps> = ({
  icon,
  label,
  variant = 'primary',
  size = 'medium',
  onClick,
  className = '',
}) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onClick) return;
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [onClick]);

  return (
    <md-fab
      ref={ref}
      variant={variant}
      size={size}
      label={label || undefined}
      class={className}
    >
      <md-icon slot="icon">{icon}</md-icon>
    </md-fab>
  );
};

// ============================================================================
// FORM INPUTS
// ============================================================================

export interface MdTextFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  debounceMs?: number;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  supportingText?: string;
  icon?: string;
  className?: string;
}

export const MdTextField: React.FC<MdTextFieldProps> = ({
  label,
  value,
  onChange,
  debounceMs = 0,
  type = 'text',
  placeholder,
  disabled,
  required,
  rows,
  supportingText,
  icon,
  className = 'w-full',
}) => {
  const ref = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) => {
      const nextVal = (e.target as HTMLInputElement).value;
      if (debounceMs > 0) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          onChange(nextVal);
        }, debounceMs);
      } else {
        onChange(nextVal);
      }
    };
    el.addEventListener('input', handler);
    return () => {
      el.removeEventListener('input', handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onChange, debounceMs]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (ref.current && ref.current.value !== String(value)) {
      ref.current.value = String(value);
    }
  }, [value]);

  return (
    <md-outlined-text-field
      ref={ref}
      label={label}
      value={String(value)}
      type={type}
      placeholder={placeholder}
      disabled={disabled || undefined}
      required={required || undefined}
      rows={rows}
      supportingText={supportingText}
      class={className}
    >
      {icon && <md-icon slot="leading-icon">{icon}</md-icon>}
    </md-outlined-text-field>
  );
};

export interface MdSelectOptionItem {
  value: string;
  label: string;
}

export interface MdSelectProps {
  label?: string;
  value: string;
  options: (string | MdSelectOptionItem)[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const MdSelect: React.FC<MdSelectProps> = ({
  label,
  value,
  options,
  onChange,
  disabled,
  className = 'w-full',
}) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) => {
      onChange((e.target as any).value);
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, [onChange]);

  useEffect(() => {
    if (ref.current && ref.current.value !== value) {
      ref.current.value = value;
    }
  }, [value]);

  return (
    <md-outlined-select
      ref={ref}
      label={label || undefined}
      value={value}
      disabled={disabled || undefined}
      class={className}
    >
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const lbl = typeof opt === 'string' ? opt : opt.label;
        return (
          <md-select-option key={val} value={val} selected={val === value || undefined}>
            <div slot="headline">{lbl}</div>
          </md-select-option>
        );
      })}
    </md-outlined-select>
  );
};

export const MdSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) => {
      onChange((e.target as any).selected);
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, [onChange]);

  useEffect(() => {
    if (ref.current) {
      ref.current.selected = checked;
    }
  }, [checked]);

  return (
    <md-switch
      ref={ref}
      selected={checked || undefined}
      disabled={disabled || undefined}
      icons
    />
  );
};

export const MdChip: React.FC<{
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: string;
  variant?: 'filter' | 'assist';
}> = ({ label, selected, onClick, icon, variant = 'filter' }) => {
  const ref = useRef<any>(null);

  if (variant === 'assist') {
    return (
      <md-assist-chip ref={ref} label={label} onClick={onClick}>
        {icon && <md-icon slot="icon">{icon}</md-icon>}
      </md-assist-chip>
    );
  }

  return <md-filter-chip ref={ref} label={label} selected={selected || undefined} onClick={onClick} />;
};

// ============================================================================
// FEEDBACK & STATUS (BADGE, SKELETON, LOADING)
// ============================================================================

export interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'rounded' | 'text';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rounded',
  width,
  height,
}) => {
  const variantStyles = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
    text: 'rounded-md h-4',
  }[variant];

  return (
    <div
      className={`animate-pulse bg-discord-surface/80 border border-discord-border/20 ${variantStyles} ${className}`.trim()}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
};

export const MdLoading: React.FC = () => (
  <div className="flex items-center justify-center p-10">
    <md-circular-progress indeterminate />
  </div>
);

export const SectionHeader: React.FC<{ title: string; className?: string }> = ({ title, className = 'mb-4' }) => (
  <div className={className}>
    <h2 className="text-lg font-normal text-discord-white pb-1.5">{title}</h2>
    <div className="w-10 h-0.5 bg-discord-blurple rounded-full" />
  </div>
);

export type BadgeTone =
  | 'blurple'
  | 'green'
  | 'yellow'
  | 'red'
  | 'premium'
  | 'fuchsia'
  | 'neutral'
  | 'surface'
  | 'dark'
  | 'white';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';
export type BadgeVariant = 'solid' | 'soft';

export interface BadgeProps {
  label?: React.ReactNode;
  children?: React.ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  variant?: BadgeVariant;
  icon?: string;
  dot?: boolean;
  pill?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  children,
  tone = 'blurple',
  size = 'sm',
  variant = 'solid',
  icon,
  dot,
  pill = false,
  className = '',
}) => {
  const content = children ?? label;

  // Solid tones (vibrant background, high contrast text, NO BORDER)
  const solidTones: Record<BadgeTone, string> = {
    blurple: 'bg-discord-blurple text-discord-white font-medium',
    green: 'bg-discord-green text-[#0e1015] font-semibold',
    yellow: 'bg-discord-yellow text-[#0e1015] font-semibold',
    red: 'bg-discord-red text-discord-white font-medium',
    premium: 'bg-discord-fuchsia text-discord-white font-medium',
    fuchsia: 'bg-discord-fuchsia text-discord-white font-medium',
    neutral: 'bg-[#2B2D31] text-discord-text font-normal',
    surface: 'bg-discord-surface text-discord-text font-normal',
    dark: 'bg-[#111214] text-discord-white font-medium',
    white: 'bg-white text-[#111214] font-semibold',
  };

  // Soft tones (subtle translucent background, colored text, NO BORDER)
  const softTones: Record<BadgeTone, string> = {
    blurple: 'bg-discord-blurple/20 text-discord-blurple font-medium',
    green: 'bg-discord-green/20 text-discord-green font-medium',
    yellow: 'bg-discord-yellow/20 text-discord-yellow font-medium',
    red: 'bg-discord-red/20 text-discord-red font-medium',
    premium: 'bg-discord-fuchsia/20 text-discord-fuchsia font-medium',
    fuchsia: 'bg-discord-fuchsia/20 text-discord-fuchsia font-medium',
    neutral: 'bg-discord-surface text-discord-muted font-normal',
    surface: 'bg-discord-surface text-discord-text font-normal',
    dark: 'bg-black/35 text-discord-muted font-normal',
    white: 'bg-white/15 text-white font-medium',
  };

  const toneClassMap = (variant === 'soft' ? softTones : solidTones) || solidTones;

  const sizeClasses: Record<BadgeSize, string> = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1 leading-none',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 leading-tight',
    md: 'text-xs px-2.5 py-1 gap-1.5 leading-tight',
    lg: 'text-sm px-3 py-1.5 gap-2 leading-normal',
  };

  const dotSizes: Record<BadgeSize, string> = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const iconSizes: Record<BadgeSize, string> = {
    xs: 'text-[12px] w-3 h-3',
    sm: 'text-[14px] w-3.5 h-3.5',
    md: 'text-base w-4 h-4',
    lg: 'text-lg w-5 h-5',
  };

  const radiusClass = pill ? 'rounded-full' : size === 'lg' ? 'rounded-xl' : size === 'md' ? 'rounded-lg' : 'rounded';

  return (
    <span
      className={`inline-flex items-center justify-center select-none shrink-0 border-0 ${radiusClass} ${sizeClasses[size]} ${toneClassMap[tone]} ${className}`.trim()}
    >
      {dot && (
        <span
          className={`rounded-full shrink-0 ${dotSizes[size]} ${
            variant === 'solid'
              ? tone === 'green' || tone === 'yellow'
                ? 'bg-[#0e1015]'
                : 'bg-white'
              : tone === 'green'
              ? 'bg-discord-green'
              : tone === 'yellow'
              ? 'bg-discord-yellow'
              : tone === 'red'
              ? 'bg-discord-red'
              : tone === 'blurple'
              ? 'bg-discord-blurple'
              : 'bg-discord-muted'
          }`}
        />
      )}
      {icon && (
        <MdIcon
          name={icon}
          className={`shrink-0 leading-none ${iconSizes[size]}`}
        />
      )}
      {content}
    </span>
  );
};

export const StatusBadge = Badge;

// ============================================================================
// DIALOGS & MODALS
// ============================================================================

export interface MdDialogProps {
  open: boolean;
  onClose: () => void;
  headline?: React.ReactNode;
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

// ============================================================================
// TABS & NAVIGATION
// ============================================================================

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

// ============================================================================
// CARDS & SURFACES
// ============================================================================

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
      {badge && <Badge label={badge} tone="premium" />}
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
