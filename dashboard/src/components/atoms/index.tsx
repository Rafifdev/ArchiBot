import React, { useEffect, useRef } from 'react';

// Official Material Web Components (@material/web) - Atoms
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/text-button.js';
import '@material/web/button/elevated-button.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/iconbutton/filled-icon-button.js';
import '@material/web/iconbutton/filled-tonal-icon-button.js';
import '@material/web/iconbutton/outlined-icon-button.js';
import '@material/web/fab/fab.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/select/outlined-select.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';
import '@material/web/switch/switch.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/chips/chip-set.js';
import '@material/web/chips/filter-chip.js';
import '@material/web/chips/assist-chip.js';
import '@material/web/progress/circular-progress.js';
import '@material/web/progress/linear-progress.js';
import '@material/web/divider/divider.js';
import '@material/web/ripple/ripple.js';
import '@material/web/elevation/elevation.js';

export const DiscordMark: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

export const MdIcon: React.FC<{ name: string; slot?: string; className?: string }> = ({
  name,
  slot,
  className = '',
}) => (
  <md-icon slot={slot} class={className}>
    {name}
  </md-icon>
);

export const MdDivider: React.FC<{ inset?: boolean; className?: string }> = ({ inset, className = '' }) => (
  <md-divider inset={inset || undefined} class={className} />
);

export interface MdButtonProps {
  variant?: 'filled' | 'outlined' | 'tonal' | 'text' | 'elevated' | 'danger';
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  icon?: string;
  children: React.ReactNode;
  className?: string;
  type?: string;
}

export const MdButton: React.FC<MdButtonProps> = ({
  variant = 'filled',
  disabled,
  onClick,
  icon,
  children,
  className = '',
  type = 'button',
}) => {
  const content = (
    <>
      {icon && <md-icon slot="icon">{icon}</md-icon>}
      {children}
    </>
  );

  if (variant === 'danger') {
    return (
      <md-filled-button
        disabled={disabled || undefined}
        onClick={onClick}
        class={`[--md-sys-color-primary:var(--color-discord-red)] [--md-sys-color-on-primary:var(--color-discord-white)] ${className}`.trim()}
        type={type}
      >
        {content}
      </md-filled-button>
    );
  }
  if (variant === 'outlined') {
    return (
      <md-outlined-button disabled={disabled || undefined} onClick={onClick} class={className} type={type}>
        {content}
      </md-outlined-button>
    );
  }
  if (variant === 'tonal') {
    return (
      <md-filled-tonal-button disabled={disabled || undefined} onClick={onClick} class={className} type={type}>
        {content}
      </md-filled-tonal-button>
    );
  }
  if (variant === 'elevated') {
    return (
      <md-elevated-button disabled={disabled || undefined} onClick={onClick} class={className} type={type}>
        {content}
      </md-elevated-button>
    );
  }
  if (variant === 'text') {
    return (
      <md-text-button disabled={disabled || undefined} onClick={onClick} class={className} type={type}>
        {content}
      </md-text-button>
    );
  }
  return (
    <md-filled-button disabled={disabled || undefined} onClick={onClick} class={className} type={type}>
      {content}
    </md-filled-button>
  );
};

export interface MdIconButtonProps {
  icon: string;
  variant?: 'standard' | 'filled' | 'tonal' | 'outlined';
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  title?: string;
  className?: string;
  id?: string;
}

export const MdIconButton: React.FC<MdIconButtonProps> = ({
  icon,
  variant = 'standard',
  onClick,
  disabled,
  title,
  className = '',
  id,
}) => {
  if (variant === 'filled') {
    return (
      <md-filled-icon-button id={id} disabled={disabled || undefined} onClick={onClick} title={title} class={className}>
        <md-icon>{icon}</md-icon>
      </md-filled-icon-button>
    );
  }
  if (variant === 'tonal') {
    return (
      <md-filled-tonal-icon-button id={id} disabled={disabled || undefined} onClick={onClick} title={title} class={className}>
        <md-icon>{icon}</md-icon>
      </md-filled-tonal-icon-button>
    );
  }
  if (variant === 'outlined') {
    return (
      <md-outlined-icon-button id={id} disabled={disabled || undefined} onClick={onClick} title={title} class={className}>
        <md-icon>{icon}</md-icon>
      </md-outlined-icon-button>
    );
  }
  return (
    <md-icon-button id={id} disabled={disabled || undefined} onClick={onClick} title={title} class={className}>
      <md-icon>{icon}</md-icon>
    </md-icon-button>
  );
};

export interface MdFabProps {
  icon: string;
  label?: string;
  variant?: 'surface' | 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  className?: string;
  title?: string;
}

export const MdFab: React.FC<MdFabProps> = ({
  icon,
  label,
  variant = 'primary',
  size = 'medium',
  onClick,
  className = '',
  title,
}) => (
  <md-fab variant={variant} size={size} label={label} onClick={onClick} title={title} class={className}>
    <md-icon slot="icon">{icon}</md-icon>
  </md-fab>
);

export interface MdTextFieldProps {
  label?: string;
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
  onChange: (value: string) => void;
  options: MdSelectOptionItem[];
  disabled?: boolean;
  className?: string;
}

export const MdSelect: React.FC<MdSelectProps> = ({
  label,
  value,
  onChange,
  options,
  disabled,
  className = 'w-full',
}) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) => {
      onChange((e.target as HTMLSelectElement).value);
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, [onChange]);

  return (
    <md-outlined-select
      ref={ref}
      label={label}
      value={value}
      disabled={disabled || undefined}
      class={className}
    >
      {options.map((opt) => (
        <md-select-option key={opt.value} value={opt.value} selected={opt.value === value || undefined}>
          <span className="text-xs font-normal">{opt.label}</span>
        </md-select-option>
      ))}
    </md-outlined-select>
  );
};

export interface MdSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const MdSwitch: React.FC<MdSwitchProps> = ({ checked, onChange, disabled }) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) => {
      onChange(Boolean((e.target as any).selected));
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, [onChange]);

  useEffect(() => {
    if (ref.current) {
      ref.current.selected = checked;
    }
  }, [checked]);

  return <md-switch ref={ref} selected={checked || undefined} disabled={disabled || undefined} icons />;
};

export interface MdChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  variant?: 'filter' | 'assist';
  icon?: string;
}

export const MdChip: React.FC<MdChipProps> = ({
  label,
  selected = false,
  onClick,
  variant = 'filter',
  icon,
}) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (ref.current && variant === 'filter') {
      ref.current.selected = selected;
    }
  }, [selected, variant]);

  if (variant === 'assist') {
    return (
      <md-assist-chip label={label} onClick={onClick}>
        {icon && <md-icon slot="icon">{icon}</md-icon>}
      </md-assist-chip>
    );
  }

  return <md-filter-chip ref={ref} label={label} selected={selected || undefined} onClick={onClick} />;
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

export const StatusBadge: React.FC<{
  label: string;
  tone?: 'blurple' | 'green' | 'yellow' | 'red' | 'premium' | 'neutral';
  className?: string;
}> = ({ label, tone = 'blurple', className = '' }) => {
  const toneClasses: Record<string, string> = {
    blurple: 'bg-discord-blurple/15 text-discord-blurple border-discord-blurple/30',
    green: 'bg-discord-green/15 text-discord-green border-discord-green/30',
    yellow: 'bg-discord-yellow/15 text-discord-yellow border-discord-yellow/30',
    red: 'bg-discord-red/15 text-discord-red border-discord-red/30',
    premium: 'bg-discord-premium-bg text-discord-premium-text border-discord-premium-text/20',
    neutral: 'bg-discord-surface text-discord-muted border-discord-border',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-normal tracking-wide border ${toneClasses[tone]} ${className}`.trim()}>
      {label}
    </span>
  );
};
