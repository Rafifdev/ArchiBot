import React, { useState, useEffect, useRef, useId, useMemo, useCallback } from 'react';

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
import '@material/web/slider/slider.js';
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
    className={`material-symbols-outlined inline-flex items-center justify-center leading-none select-none shrink-0 overflow-visible ${className}`.trim()}
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
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-2xl',
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
      onClick,
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
  compact?: boolean;
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
  compact = false,
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

  const resolvedClass = `${compact ? 'compact-search-field' : ''} ${className}`.trim();

  if (compact) {
    return (
      <div className={`relative flex items-center h-10 w-full ${className}`.trim()}>
        {icon && (
          <span className="absolute left-3 flex items-center pointer-events-none text-discord-muted">
            <MdIcon name={icon} className="text-lg leading-none" />
          </span>
        )}
        <input
          ref={ref}
          type={type}
          defaultValue={String(value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`h-10 w-full rounded-xl border border-discord-border bg-discord-surface text-discord-white text-xs font-normal placeholder:text-discord-muted hover:border-discord-border-hover focus:outline-none focus:border-discord-blurple focus:ring-1 focus:ring-discord-blurple transition-all ${
            icon ? 'pl-9 pr-8' : 'px-3.5'
          }`}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              if (ref.current) ref.current.value = '';
              onChange('');
            }}
            className="absolute right-2.5 flex items-center text-discord-muted hover:text-discord-white transition-colors cursor-pointer"
            title="Clear"
          >
            <MdIcon name="close" className="text-sm leading-none" />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <md-outlined-text-field
      ref={ref}
      label={label || undefined}
      value={String(value)}
      type={type}
      placeholder={placeholder}
      disabled={disabled || undefined}
      required={required || undefined}
      rows={rows}
      supportingText={supportingText}
      class={resolvedClass}
    >
      {icon && <md-icon slot="leading-icon">{icon}</md-icon>}
    </md-outlined-text-field>
  );
};

export interface MdSelectOptionItem {
  value: string;
  label: string;
  iconUrl?: string;
}

export interface MdSelectProps {
  label?: string;
  value: string;
  options: (string | MdSelectOptionItem)[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const MdSelect: React.FC<MdSelectProps> = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
  className = 'w-full',
  placeholder = 'Select an option...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openUpwards, setOpenUpwards] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const textFieldRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize options to { value, label } items
  const normalizedOptions = useMemo<MdSelectOptionItem[]>(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Search feature is automatically activated if dropdown contains 8 or more items
  const isSearchable = normalizedOptions.length >= 8;

  // Selected item
  const selectedItem = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value);
  }, [normalizedOptions, value]);

  const selectedLabel = selectedItem ? selectedItem.label : (value || '');

  // Filtered options based on search query typed directly into the field
  const filteredOptions = useMemo(() => {
    if (!isSearchable || !searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [normalizedOptions, isSearchable, searchQuery]);

  // Display value: when searching show query, otherwise show selected option label
  const displayValue = isOpen && isSearchable ? searchQuery : selectedLabel;

  // Synchronize value and readOnly state with the <md-outlined-text-field> web component
  useEffect(() => {
    const el = textFieldRef.current;
    if (el) {
      if (el.value !== displayValue) {
        el.value = displayValue;
      }
      el.readOnly = !isSearchable;
    }
  }, [displayValue, isSearchable]);

  // Listen for real-time input events directly from <md-outlined-text-field>
  useEffect(() => {
    const el = textFieldRef.current;
    if (!el) return;
    const handleInput = (e: Event) => {
      if (!isSearchable) return;
      const target = e.target as HTMLInputElement;
      setSearchQuery(target.value);
      setHighlightedIndex(0);
      if (!isOpen) setIsOpen(true);
    };
    el.addEventListener('input', handleInput);
    return () => {
      el.removeEventListener('input', handleInput);
    };
  }, [isSearchable, isOpen]);

  // Scroll highlighted item into view during keyboard navigation
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[role="option"]');
    const highlightedEl = items[highlightedIndex] as HTMLElement;
    if (highlightedEl) {
      highlightedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  // Check if dropdown should flip upwards when near bottom of viewport
  const checkPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 260 && spaceAbove > spaceBelow) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  };

  const handleOpen = () => {
    if (disabled) return;
    checkPosition();
    setHighlightedIndex(0);
    setSearchQuery('');
    setIsOpen(true);
    if (textFieldRef.current) {
      if (isSearchable) {
        textFieldRef.current.value = '';
      }
      setTimeout(() => {
        textFieldRef.current?.focus?.();
        if (isSearchable) {
          textFieldRef.current?.select?.();
        }
      }, 30);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
    if (textFieldRef.current) {
      textFieldRef.current.value = selectedLabel;
      textFieldRef.current?.blur?.();
    }
  };

  const handleFieldClick = () => {
    if (disabled) return;
    if (!isOpen) {
      handleOpen();
    } else if (!isSearchable) {
      handleClose();
    }
  };

  const handleTrailingIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectOption = (optValue: string) => {
    onChange(optValue);
    handleClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < filteredOptions.length ? prev + 1 : 0));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredOptions.length - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0 && highlightedIndex < filteredOptions.length) {
        handleSelectOption(filteredOptions[highlightedIndex].value);
      }
    }
  };

  // Label and placeholder for authentic Material 3 notched outline
  const effectiveLabel = label || placeholder || undefined;
  const effectivePlaceholder = isOpen && isSearchable
    ? (selectedLabel || placeholder || 'Type to search...')
    : (!selectedLabel ? placeholder : undefined);

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative select-none text-left ${className}`.trim()}
    >
      <div onClick={handleFieldClick} className="w-full">
        <md-outlined-text-field
          ref={textFieldRef}
          label={effectiveLabel}
          value={displayValue}
          placeholder={effectivePlaceholder}
          disabled={disabled || undefined}
          class={`w-full ${!isSearchable ? 'cursor-pointer' : ''}`.trim()}
        >
          {selectedItem?.iconUrl && (
            <span
              slot="leading-icon"
              className="inline-flex items-center justify-center w-6 h-6 pointer-events-none select-none"
            >
              <img
                src={selectedItem.iconUrl}
                alt=""
                className="w-5 h-3.5 object-cover rounded-[2px] border border-white/10 shadow-xs"
              />
            </span>
          )}
          <md-icon
            slot="trailing-icon"
            onClick={handleTrailingIconClick}
            class={`cursor-pointer transition-transform duration-200 select-none ${
              isOpen ? 'rotate-180 text-discord-blurple' : 'text-discord-muted hover:text-discord-white'
            }`}
          >
            expand_more
          </md-icon>
        </md-outlined-text-field>
      </div>

      {/* Dropdown Menu Popover: Options list directly, NO nested search bar */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 z-50 bg-[#16181f] border border-discord-border rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col transition-all duration-150 ${
            openUpwards
              ? 'bottom-[calc(100%+6px)] origin-bottom'
              : 'top-[calc(100%+6px)] origin-top'
          }`}
          style={{ minWidth: '220px' }}
        >
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto py-1 scrollbar-thin"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-4 text-xs font-normal text-discord-muted text-center flex flex-col items-center gap-1.5">
                <MdIcon name="search_off" className="text-xl opacity-60" />
                <span>No options matching &ldquo;{searchQuery}&rdquo;</span>
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3.5 py-2.5 text-xs font-normal flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-discord-blurple/20 text-discord-white'
                        : isHighlighted
                        ? 'bg-discord-surface text-discord-white'
                        : 'text-discord-text hover:text-discord-white hover:bg-discord-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 mr-2">
                      {opt.iconUrl && (
                        <img
                          src={opt.iconUrl}
                          alt=""
                          className="w-5 h-3.5 object-cover rounded-[2px] shrink-0 border border-white/10 shadow-xs"
                        />
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && (
                      <MdIcon
                        name="check"
                        className="text-discord-blurple text-base shrink-0"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const MdSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}> = ({ checked, onChange, disabled, className = '' }) => {
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
      ref.current.selected = Boolean(checked);
    }
  }, [checked]);

  return (
    <md-switch
      ref={ref}
      selected={checked ? true : undefined}
      disabled={disabled ? true : undefined}
      class={`shrink-0 cursor-pointer ${className}`.trim()}
    />
  );
};

export interface MdSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  labeled?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onChange: (value: number) => void;
  className?: string;
}

export const MdSlider: React.FC<MdSliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  labeled = false,
  disabled = false,
  ariaLabel,
  onChange,
  className = '',
}) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) => {
      onChange(Number((e.target as any).value));
    };
    el.addEventListener('input', handler);
    return () => el.removeEventListener('input', handler);
  }, [onChange]);

  useEffect(() => {
    if (ref.current && Number(ref.current.value) !== value) {
      ref.current.value = value;
    }
  }, [value]);

  return (
    <md-slider
      ref={ref}
      min={min}
      max={max}
      step={step}
      value={value}
      labeled={labeled || undefined}
      disabled={disabled || undefined}
      aria-label={ariaLabel}
      class={`w-full ${className}`.trim()}
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
  <div className="flex flex-col gap-4 animate-pulse select-none py-4">
    <div className="h-6 w-48 bg-discord-surface/90 rounded-lg" />
    <div className="h-4 w-80 bg-discord-surface/60 rounded" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-discord-card border border-discord-border p-4 flex flex-col gap-2.5">
          <div className="h-4 w-28 bg-discord-surface/90 rounded" />
          <div className="h-3 w-full bg-discord-surface/60 rounded" />
        </div>
      ))}
    </div>
  </div>
);


export const PageHeaderSkeleton: React.FC = () => (
  <div className="flex flex-col gap-2 mb-6 animate-pulse select-none">
    <div className="h-3 w-28 bg-discord-surface/60 rounded" />
    <div className="h-7 w-56 bg-discord-surface/90 rounded-lg" />
    <div className="h-3.5 w-80 max-w-full bg-discord-surface/70 rounded" />
  </div>
);

export const OverviewSkeleton: React.FC = () => (
  <div className="flex flex-col gap-8 animate-pulse select-none">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-xl bg-discord-surface/90 shrink-0" />
      <div className="flex flex-col gap-2">
        <div className="h-3 w-24 bg-discord-surface/60 rounded" />
        <div className="h-6 w-48 bg-discord-surface/90 rounded-lg" />
      </div>
    </div>
    <div>
      <div className="h-5 w-32 bg-discord-surface/90 rounded mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-discord-card border border-discord-border flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-discord-surface/90 shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 w-28 bg-discord-surface/90 rounded" />
              <div className="h-3 w-36 bg-discord-surface/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div>
      <div className="h-5 w-24 bg-discord-surface/90 rounded mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-discord-card border border-discord-border flex flex-col gap-3 min-h-[110px]">
            <div className="w-9 h-9 rounded-lg bg-discord-surface/90" />
            <div className="h-4 w-32 bg-discord-surface/90 rounded" />
            <div className="h-3 w-full bg-discord-surface/60 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const ChannelsSkeleton: React.FC = () => (
  <div className="flex flex-col gap-6 animate-pulse select-none">
    <PageHeaderSkeleton />
    <div className="h-10 w-full max-w-md bg-discord-card border border-discord-border rounded-xl" />
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-discord-card border border-discord-border p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-discord-border/50">
            <div className="h-4 w-36 bg-discord-surface/90 rounded" />
            <div className="h-4 w-12 bg-discord-surface/60 rounded" />
          </div>
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="h-10 rounded-lg bg-discord-surface/70 flex items-center px-3.5 gap-3">
              <div className="w-4 h-4 rounded bg-discord-surface/90" />
              <div className="h-3.5 w-40 bg-discord-surface/90 rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const RolesSkeleton: React.FC = () => (
  <div className="flex flex-col gap-6 animate-pulse select-none">
    <PageHeaderSkeleton />
    <div className="p-4 rounded-xl bg-discord-card border border-discord-border flex flex-col gap-3">
      <div className="h-4 w-44 bg-discord-surface/90 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-12 bg-discord-surface/80 rounded-lg" />
        <div className="h-12 bg-discord-surface/80 rounded-lg" />
      </div>
    </div>
    <div className="rounded-xl bg-discord-card border border-discord-border p-4 flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-11 rounded-lg bg-discord-surface/70 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-discord-surface/90" />
            <div className="h-3.5 w-32 bg-discord-surface/90 rounded" />
          </div>
          <div className="h-7 w-20 bg-discord-surface/80 rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

export const MembersSkeleton: React.FC = () => (
  <div className="flex flex-col gap-6 animate-pulse select-none">
    <PageHeaderSkeleton />
    <div className="flex gap-4 border-b border-discord-border pb-2">
      <div className="h-8 w-32 bg-discord-surface/90 rounded-lg" />
      <div className="h-8 w-32 bg-discord-surface/60 rounded-lg" />
    </div>
    <div className="h-10 w-full max-w-sm bg-discord-card border border-discord-border rounded-xl" />
    <div className="rounded-xl bg-discord-card border border-discord-border p-2 flex flex-col gap-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-discord-surface/60 flex items-center justify-between px-4">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-full bg-discord-surface/90" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3.5 w-28 bg-discord-surface/90 rounded" />
              <div className="h-2.5 w-20 bg-discord-surface/60 rounded" />
            </div>
          </div>
          <div className="h-7 w-20 bg-discord-surface/80 rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

export const VoiceSkeleton: React.FC = () => (
  <div className="flex flex-col gap-6 animate-pulse select-none">
    <PageHeaderSkeleton />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-5 rounded-xl bg-discord-card border border-discord-border flex flex-col gap-3 min-h-[140px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-discord-surface/90" />
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-32 bg-discord-surface/90 rounded" />
              <div className="h-3 w-24 bg-discord-surface/60 rounded" />
            </div>
          </div>
          <div className="h-3 w-full bg-discord-surface/60 rounded mt-2" />
        </div>
      ))}
    </div>
  </div>
);

export const ArchitectSkeleton: React.FC = () => (
  <div className="flex flex-col gap-6 animate-pulse select-none">
    <PageHeaderSkeleton />
    <div className="flex gap-3 border-b border-discord-border pb-2">
      <div className="h-9 w-36 bg-discord-surface/90 rounded-lg" />
      <div className="h-9 w-36 bg-discord-surface/60 rounded-lg" />
      <div className="h-9 w-36 bg-discord-surface/60 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-5 rounded-xl bg-discord-card border border-discord-border flex flex-col gap-3">
          <div className="w-10 h-10 rounded-lg bg-discord-surface/90" />
          <div className="h-4 w-36 bg-discord-surface/90 rounded" />
          <div className="h-3 w-full bg-discord-surface/60 rounded" />
          <div className="h-9 w-full bg-discord-surface/80 rounded-lg mt-3" />
        </div>
      ))}
    </div>
  </div>
);

export const EmbedsSkeleton: React.FC = () => (
  <div className="flex flex-col gap-6 animate-pulse select-none">
    <PageHeaderSkeleton />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-5 rounded-xl bg-discord-card border border-discord-border flex flex-col gap-4">
        <div className="h-4 w-40 bg-discord-surface/90 rounded" />
        <div className="h-10 bg-discord-surface/70 rounded-lg" />
        <div className="h-24 bg-discord-surface/70 rounded-lg" />
        <div className="h-10 bg-discord-surface/70 rounded-lg" />
      </div>
      <div className="p-5 rounded-xl bg-discord-card border border-discord-border flex flex-col gap-3">
        <div className="h-4 w-32 bg-discord-surface/90 rounded" />
        <div className="h-48 bg-discord-surface/60 rounded-lg border-l-4 border-discord-surface/90" />
      </div>
    </div>
  </div>
);

export const BackupsSkeleton: React.FC = () => (
  <div className="flex flex-col gap-6 animate-pulse select-none">
    <PageHeaderSkeleton />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-5 rounded-xl bg-discord-card border border-discord-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 bg-discord-surface/90 rounded" />
            <div className="h-4 w-20 bg-discord-surface/60 rounded" />
          </div>
          <div className="h-3 w-48 bg-discord-surface/60 rounded" />
          <div className="flex gap-2 mt-2">
            <div className="h-8 w-24 bg-discord-surface/80 rounded-md" />
            <div className="h-8 w-24 bg-discord-surface/80 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SettingsSkeleton: React.FC = () => (
  <div className="flex flex-col gap-6 animate-pulse select-none">
    <PageHeaderSkeleton />
    <div className="flex gap-3 border-b border-discord-border pb-2">
      <div className="h-9 w-28 bg-discord-surface/90 rounded-lg" />
      <div className="h-9 w-28 bg-discord-surface/60 rounded-lg" />
      <div className="h-9 w-28 bg-discord-surface/60 rounded-lg" />
    </div>
    <div className="p-6 rounded-xl bg-discord-card border border-discord-border flex flex-col gap-5 max-w-2xl">
      <div className="h-4 w-44 bg-discord-surface/90 rounded" />
      <div className="h-12 bg-discord-surface/70 rounded-lg" />
      <div className="h-12 bg-discord-surface/70 rounded-lg" />
      <div className="h-9 w-32 bg-discord-surface/80 rounded-lg" />
    </div>
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
          className="flex flex-col gap-4.5 min-w-[300px] sm:min-w-[480px] md:min-w-[540px] text-discord-text text-xs font-normal pt-2 pb-1"
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

export type ToastVariant =
  | 'success'
  | 'danger'
  | 'error'
  | 'info'
  | 'warning'
  | 'loading'
  | 'neutral'
  | 'premium';

export type ToastPosition =
  | 'top-center'
  | 'top-right'
  | 'top-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'center'
  | 'center-left'
  | 'center-right';

export interface ToastOptions {
  title?: string;
  variant?: ToastVariant;
  position?: ToastPosition;
  icon?: string;
  durationMs?: number;
  closable?: boolean;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export interface ToastRecord extends ToastOptions {
  id: string;
  message: string;
  createdAt: number;
  exiting?: boolean;
}

// Global Toast State Store (Supports stack & multi-toast emission)
type ToastListener = () => void;
let globalToastQueue: ToastRecord[] = [];
const toastListeners = new Set<ToastListener>();

function notifyToastListeners() {
  toastListeners.forEach((listener) => listener());
}

export const toast = (message: string, options?: ToastOptions) => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record: ToastRecord = {
    id,
    message,
    title: options?.title,
    variant: options?.variant || 'neutral',
    position: options?.position,
    icon: options?.icon,
    durationMs: options?.durationMs ?? 4000,
    closable: options?.closable ?? true,
    action: options?.action,
    className: options?.className,
    onClose: options?.onClose,
    createdAt: Date.now(),
    exiting: false,
  };

  // Prepend newest toast to top of stack
  globalToastQueue = [record, ...globalToastQueue];
  notifyToastListeners();
  return id;
};

toast.success = (message: string, options?: Omit<ToastOptions, 'variant'>) =>
  toast(message, { ...options, variant: 'success' });
toast.error = (message: string, options?: Omit<ToastOptions, 'variant'>) =>
  toast(message, { ...options, variant: 'danger' });
toast.danger = (message: string, options?: Omit<ToastOptions, 'variant'>) =>
  toast(message, { ...options, variant: 'danger' });
toast.info = (message: string, options?: Omit<ToastOptions, 'variant'>) =>
  toast(message, { ...options, variant: 'info' });
toast.warning = (message: string, options?: Omit<ToastOptions, 'variant'>) =>
  toast(message, { ...options, variant: 'warning' });
toast.loading = (message: string, options?: Omit<ToastOptions, 'variant'>) =>
  toast(message, { ...options, variant: 'loading', durationMs: 0 });
toast.neutral = (message: string, options?: Omit<ToastOptions, 'variant'>) =>
  toast(message, { ...options, variant: 'neutral' });
toast.premium = (message: string, options?: Omit<ToastOptions, 'variant'>) =>
  toast(message, { ...options, variant: 'premium' });

toast.dismiss = (id?: string) => {
  if (id) {
    globalToastQueue = globalToastQueue.map((t) => (t.id === id ? { ...t, exiting: true } : t));
    notifyToastListeners();
    setTimeout(() => {
      const match = globalToastQueue.find((t) => t.id === id);
      match?.onClose?.();
      globalToastQueue = globalToastQueue.filter((t) => t.id !== id);
      notifyToastListeners();
    }, 380);
  } else {
    globalToastQueue = globalToastQueue.map((t) => ({ ...t, exiting: true }));
    notifyToastListeners();
    setTimeout(() => {
      globalToastQueue.forEach((t) => t.onClose?.());
      globalToastQueue = [];
      notifyToastListeners();
    }, 380);
  }
};

export interface ToasterProps {
  maxVisible?: number; // Configurable maximum stacked toasts (Default: 5)
  position?: ToastPosition; // Default: 'top-right'
  durationMs?: number;
  className?: string;

  // Optional direct props for backward compatibility
  message?: string | null;
  title?: string;
  variant?: ToastVariant;
  tone?: ToastVariant;
  icon?: string;
  closable?: boolean;
  toastKey?: string | number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const variantConfig: Record<
  ToastVariant,
  {
    containerBg: string;
    iconColor: string;
    textColor: string;
    actionColor: string;
    closeColor: string;
    defaultIcon: string;
  }
> = {
  // Discord UI Kit Figma: CTA Colors/Green (#3BA55C, Hover #2D7D46) & Gray/White (#FFFFFF)
  success: {
    containerBg: 'bg-[#3BA55C]',
    iconColor: 'text-[#FFFFFF]',
    textColor: 'text-[#FFFFFF]',
    actionColor: 'text-[#FFFFFF] hover:bg-[#2D7D46]',
    closeColor: 'text-[#FFFFFF]/85 hover:text-[#FFFFFF] hover:bg-[#2D7D46]',
    defaultIcon: 'check_circle',
  },
  // Discord UI Kit Figma: CTA Colors/Red (#ED4245, Hover #C03537) & Gray/White (#FFFFFF)
  danger: {
    containerBg: 'bg-[#ED4245]',
    iconColor: 'text-[#FFFFFF]',
    textColor: 'text-[#FFFFFF]',
    actionColor: 'text-[#FFFFFF] hover:bg-[#C03537]',
    closeColor: 'text-[#FFFFFF]/85 hover:text-[#FFFFFF] hover:bg-[#C03537]',
    defaultIcon: 'error',
  },
  error: {
    containerBg: 'bg-[#ED4245]',
    iconColor: 'text-[#FFFFFF]',
    textColor: 'text-[#FFFFFF]',
    actionColor: 'text-[#FFFFFF] hover:bg-[#C03537]',
    closeColor: 'text-[#FFFFFF]/85 hover:text-[#FFFFFF] hover:bg-[#C03537]',
    defaultIcon: 'error',
  },
  // Discord UI Kit Figma: CTA Colors/Blurple/Main (#5865F2, Hover #4752C4) & Gray/White (#FFFFFF)
  info: {
    containerBg: 'bg-[#5865F2]',
    iconColor: 'text-[#FFFFFF]',
    textColor: 'text-[#FFFFFF]',
    actionColor: 'text-[#FFFFFF] hover:bg-[#4752C4]',
    closeColor: 'text-[#FFFFFF]/85 hover:text-[#FFFFFF] hover:bg-[#4752C4]',
    defaultIcon: 'info',
  },
  // Discord UI Kit Figma: Status Idle/Warning (#FAA61A) & Gray/Dark Mode/Tooltips (#18191C)
  warning: {
    containerBg: 'bg-[#FAA61A]',
    iconColor: 'text-[#18191C]',
    textColor: 'text-[#18191C]',
    actionColor: 'text-[#18191C] hover:bg-black/15',
    closeColor: 'text-[#18191C]/80 hover:text-[#18191C] hover:bg-black/15',
    defaultIcon: 'warning',
  },
  // Discord UI Kit Figma: Gray/Dark Mode/Tooltips (#18191C), Text (#DCDDDE) & Blurple (#5865F2)
  loading: {
    containerBg: 'bg-[#18191C]',
    iconColor: 'text-[#5865F2]',
    textColor: 'text-[#DCDDDE]',
    actionColor: 'text-[#5865F2] hover:bg-[#4F545C]/40',
    closeColor: 'text-[#DCDDDE]/75 hover:text-[#FFFFFF] hover:bg-[#4F545C]/40',
    defaultIcon: 'progress_activity',
  },
  // Discord UI Kit Figma: CTA Colors/Secondary (#4F545C, Hover #5D6269) & Gray/White (#FFFFFF)
  neutral: {
    containerBg: 'bg-[#4F545C]',
    iconColor: 'text-[#FFFFFF]',
    textColor: 'text-[#FFFFFF]',
    actionColor: 'text-[#FFFFFF] hover:bg-[#5D6269]',
    closeColor: 'text-[#DCDDDE] hover:text-[#FFFFFF] hover:bg-[#5D6269]',
    defaultIcon: 'notifications',
  },
  // Discord UI Kit Figma: Nitro Boost Fuchsia (#EB459E) & Gray/White (#FFFFFF)
  premium: {
    containerBg: 'bg-[#EB459E]',
    iconColor: 'text-[#FFFFFF]',
    textColor: 'text-[#FFFFFF]',
    actionColor: 'text-[#FFFFFF] hover:bg-black/15',
    closeColor: 'text-[#FFFFFF]/85 hover:text-[#FFFFFF] hover:bg-black/15',
    defaultIcon: 'auto_awesome',
  },
};

const positionLayouts: Record<
  ToastPosition,
  {
    container: string;
    isBottom: boolean;
    isCenter: boolean;
    align: 'left' | 'right' | 'center';
  }
> = {
  'top-right': {
    container: 'fixed top-5 right-5 z-50 pointer-events-none',
    isBottom: false,
    isCenter: false,
    align: 'right',
  },
  'top-center': {
    container: 'fixed top-5 left-1/2 z-50 pointer-events-none',
    isBottom: false,
    isCenter: true,
    align: 'center',
  },
  'top-left': {
    container: 'fixed top-5 left-5 z-50 pointer-events-none',
    isBottom: false,
    isCenter: false,
    align: 'left',
  },
  'bottom-right': {
    container: 'fixed bottom-5 right-5 z-50 pointer-events-none',
    isBottom: true,
    isCenter: false,
    align: 'right',
  },
  'bottom-center': {
    container: 'fixed bottom-5 left-1/2 z-50 pointer-events-none',
    isBottom: true,
    isCenter: true,
    align: 'center',
  },
  'bottom-left': {
    container: 'fixed bottom-5 left-5 z-50 pointer-events-none',
    isBottom: true,
    isCenter: false,
    align: 'left',
  },
  center: {
    container: 'fixed top-1/2 left-1/2 z-50 pointer-events-none',
    isBottom: false,
    isCenter: true,
    align: 'center',
  },
  'center-left': {
    container: 'fixed top-1/2 left-5 z-50 pointer-events-none',
    isBottom: false,
    isCenter: false,
    align: 'left',
  },
  'center-right': {
    container: 'fixed top-1/2 right-5 z-50 pointer-events-none',
    isBottom: false,
    isCenter: false,
    align: 'right',
  },
};

// Individual Toast Item Card with Isolated Timer & Hover-to-Pause
const ToastItemCard: React.FC<{
  item: ToastRecord;
  isBottom: boolean;
  isCenter: boolean;
  align?: 'left' | 'right' | 'center';
  onDismiss: (id: string) => void;
}> = ({ item, isBottom, isCenter, align = 'right', onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const activeVariant = item.variant || 'neutral';
  const cfg = variantConfig[activeVariant] || variantConfig.neutral;

  // Stable dismiss callback ref so timer doesn't reset on parent re-renders
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Track remaining duration individually for this toast
  const remainingTimeRef = useRef<number>(item.durationMs ?? 4000);
  const lastStartRef = useRef<number>(Date.now());

  useEffect(() => {
    // If exiting, duration is 0, or loading variant, no auto-dismiss timer
    if (item.exiting || item.durationMs === 0 || activeVariant === 'loading') {
      return;
    }

    if (isPaused) {
      // Deduct elapsed time before pause
      const elapsed = Date.now() - lastStartRef.current;
      remainingTimeRef.current = Math.max(300, remainingTimeRef.current - elapsed);
      return;
    }

    // Start or resume countdown timer
    lastStartRef.current = Date.now();
    const timer = setTimeout(() => {
      onDismissRef.current(item.id);
    }, remainingTimeRef.current);

    return () => {
      clearTimeout(timer);
    };
  }, [item.id, item.exiting, isPaused, item.durationMs, activeVariant]);

  // Direction-aware exit animation based on screen position
  const exitAnimClass =
    align === 'right'
      ? 'rht-exit-right'
      : align === 'left'
      ? 'rht-exit-left'
      : isBottom
      ? 'rht-exit-bottom'
      : isCenter
      ? 'rht-exit-center'
      : 'rht-exit-top';

  const enterAnimClass = isBottom
    ? 'rht-enter-bottom'
    : isCenter
    ? 'rht-enter-center'
    : 'rht-enter-top';

  const animClass = item.exiting ? exitAnimClass : enterAnimClass;

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto min-h-[48px] flex items-center gap-3 rounded-lg border-0 pl-4 pr-2.5 py-2.5 text-xs font-normal shadow-[0_8px_24px_rgba(0,0,0,0.42),0_2px_8px_rgba(0,0,0,0.28)] min-w-[260px] max-w-md w-max max-w-[calc(100vw-2.5rem)] ${animClass} ${cfg.containerBg} ${cfg.textColor} ${item.className || ''}`.trim()}
    >
      <md-elevation />

      <span className={`inline-flex items-center justify-center shrink-0 rht-icon-pop ${cfg.iconColor}`}>
        {activeVariant === 'loading' ? (
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <MdIcon name={item.icon || cfg.defaultIcon} className="text-xl leading-none" />
        )}
      </span>

      <div className="flex flex-col min-w-0 flex-1 pr-1">
        {item.title && (
          <span className={`text-xs font-normal truncate ${cfg.textColor}`}>
            {item.title}
          </span>
        )}
        <span className={`text-xs font-normal leading-5 ${item.title ? 'opacity-90' : ''}`}>
          {item.message}
        </span>
      </div>

      {item.action && (
        <button
          type="button"
          onClick={item.action.onClick}
          className={`px-2.5 py-1.5 rounded-md border-0 bg-transparent text-xs font-normal cursor-pointer transition-colors shrink-0 ${cfg.actionColor}`}
        >
          {item.action.label}
        </button>
      )}

      {item.closable && (
        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          className={`w-8 h-8 rounded-full border-0 bg-transparent flex items-center justify-center cursor-pointer transition-colors shrink-0 ${cfg.closeColor}`}
          title="Dismiss"
        >
          <MdIcon name="close" className="text-lg leading-none" />
        </button>
      )}
    </div>
  );
};

export const globalToastConfig = {
  maxVisible: 5,
};

export const Toaster: React.FC<ToasterProps> = ({
  maxVisible = 5,
  position = 'top-right',
  durationMs = 4000,
  className = '',
  message,
  title,
  variant,
  tone,
  icon,
  closable = true,
  toastKey,
  onClose,
  action,
}) => {
  const [, setRenderTrigger] = useState(0);
  const registeredToastIdRef = useRef<string | null>(null);
  const [heights, setHeights] = useState<Record<string, number>>({});

  // Sync maxVisible to globalToastConfig if specified
  useEffect(() => {
    if (typeof maxVisible === 'number' && maxVisible > 0) {
      globalToastConfig.maxVisible = maxVisible;
    }
  }, [maxVisible]);

  // Subscribe to global toast queue
  useEffect(() => {
    const handler = () => setRenderTrigger((n) => n + 1);
    toastListeners.add(handler);
    return () => {
      toastListeners.delete(handler);
    };
  }, []);

  // Backward compatibility: Handle single toast declared via props
  useEffect(() => {
    if (message) {
      if (registeredToastIdRef.current) {
        toast.dismiss(registeredToastIdRef.current);
      }
      const newId = toast(message, {
        title,
        variant: variant || tone || 'success',
        position,
        icon,
        durationMs,
        closable,
        action,
        onClose,
      });
      registeredToastIdRef.current = newId;
    } else if (registeredToastIdRef.current) {
      toast.dismiss(registeredToastIdRef.current);
      registeredToastIdRef.current = null;
    }
  }, [message, title, variant, tone, position, icon, durationMs, closable, toastKey]);

  // Stable dismiss handler
  const handleDismiss = useCallback((id: string) => {
    toast.dismiss(id);
  }, []);

  // Measure toast element height
  const updateHeight = useCallback((id: string, h: number) => {
    setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
  }, []);

  // Clean up unused heights
  useEffect(() => {
    setHeights((prev) => {
      const activeIds = new Set(globalToastQueue.map((t) => t.id));
      let changed = false;
      const next: Record<string, number> = {};
      for (const id in prev) {
        if (activeIds.has(id)) {
          next[id] = prev[id];
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [globalToastQueue]);

  // Group active toasts by position
  const activeByPosition = useMemo(() => {
    const map: Record<ToastPosition, ToastRecord[]> = {
      'top-center': [],
      'top-right': [],
      'top-left': [],
      'bottom-center': [],
      'bottom-right': [],
      'bottom-left': [],
      'center': [],
      'center-left': [],
      'center-right': [],
    };
    for (const t of globalToastQueue) {
      const pos = t.position || position || 'top-right';
      if (map[pos]) {
        map[pos].push(t);
      } else {
        map['top-right'].push(t);
      }
    }
    return map;
  }, [position, globalToastQueue]);

  const effectiveMaxVisible = maxVisible ?? globalToastConfig.maxVisible ?? 5;

  // Handle maxVisible limit per position: if stack exceeds limit, trim older excess toasts
  useEffect(() => {
    Object.values(activeByPosition).forEach((group) => {
      const unexited = group.filter((t) => !t.exiting);
      if (unexited.length > effectiveMaxVisible) {
        const excess = unexited.slice(effectiveMaxVisible);
        excess.forEach((t) => toast.dismiss(t.id));
      }
    });
  }, [activeByPosition, effectiveMaxVisible]);

  const activePositions = (Object.keys(activeByPosition) as ToastPosition[]).filter(
    (pos) => activeByPosition[pos].length > 0
  );

  if (activePositions.length === 0) return null;

  return (
    <>
      {activePositions.map((pos) => {
        const layout = positionLayouts[pos] || positionLayouts['top-right'];
        const groupToasts = activeByPosition[pos];
        const displayToasts = groupToasts.slice(0, effectiveMaxVisible + 2);

        const isBottom = layout.isBottom;
        const isCenter = layout.align === 'center';
        const isRight = layout.align === 'right';
        const gutter = 12;

        let currentOffset = 0;

        return (
          <div
            key={pos}
            className={`${layout.container} ${className}`.trim()}
          >
            {displayToasts.map((item) => {
              const itemHeight = heights[item.id] || 52;
              const offset = currentOffset;
              currentOffset += itemHeight + gutter;

              let transform = '';
              if (pos === 'center') {
                transform = `translate3d(-50%, calc(-50% + ${offset}px), 0)`;
              } else if (pos === 'center-left' || pos === 'center-right') {
                transform = `translate3d(0, calc(-50% + ${offset}px), 0)`;
              } else if (isCenter) {
                transform = `translate3d(-50%, ${isBottom ? -offset : offset}px, 0)`;
              } else {
                transform = `translate3d(0, ${isBottom ? -offset : offset}px, 0)`;
              }

              const wrapperStyle: React.CSSProperties = {
                position: 'absolute',
                [isBottom ? 'bottom' : 'top']: 0,
                [isRight ? 'right' : 'left']: 0,
                transform,
                transition: 'transform 320ms cubic-bezier(0.21, 1.02, 0.73, 1)',
              };

              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    if (el) {
                      const h = el.offsetHeight;
                      if (h > 0 && heights[item.id] !== h) {
                        updateHeight(item.id, h);
                      }
                    }
                  }}
                  style={wrapperStyle}
                  className="pointer-events-auto"
                >
                  <ToastItemCard
                    item={item}
                    isBottom={isBottom}
                    isCenter={isCenter}
                    align={layout.align}
                    onDismiss={handleDismiss}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
};

// ============================================================================
// CARDS & SURFACES
// ============================================================================

export interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  divider?: boolean;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  onClick?: () => void;
}

export const SurfaceCard = React.forwardRef<HTMLDivElement, SurfaceCardProps>(({
  title,
  subtitle,
  headerAction,
  collapsible = false,
  defaultOpen = true,
  divider,
  children,
  className = '',
  noPadding = false,
  onClick,
  ...rest
}, ref) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();
  const hasChildren = React.Children.toArray(children).some(Boolean);
  const showBody = (!collapsible || isOpen) && hasChildren;
  const hasDivider = divider ?? (Boolean(title || subtitle || headerAction || collapsible) && showBody);

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`bg-discord-card border border-discord-border rounded-xl ${noPadding ? 'overflow-hidden' : 'p-5'} ${className}`.trim()}
      {...rest}
    >
      {(title || subtitle || headerAction || collapsible) && (
        <div
          className={`flex items-center justify-between gap-4 ${
            noPadding
              ? `px-5 pt-5 ${hasDivider ? 'pb-4 border-b border-discord-border' : 'pb-3'}`
              : hasDivider
              ? 'pb-4 mb-4 border-b border-discord-border'
              : showBody
              ? 'mb-4'
              : ''
          }`}
        >
          {/* Left Title & Subtitle */}
          <div
            role={collapsible ? 'button' : undefined}
            tabIndex={collapsible ? 0 : undefined}
            aria-expanded={collapsible ? isOpen : undefined}
            aria-controls={collapsible ? contentId : undefined}
            onClick={
              collapsible
                ? (e) => {
                    e.stopPropagation();
                    setIsOpen((prev) => !prev);
                  }
                : undefined
            }
            onKeyDown={
              collapsible
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsOpen((prev) => !prev);
                    }
                  }
                : undefined
            }
            className={`flex-1 min-w-0 text-left ${
              collapsible ? 'cursor-pointer group select-none focus-visible:outline-none' : ''
            }`}
          >
            {title && (
              <h2
                className={`text-base font-normal text-discord-white ${
                  collapsible ? 'group-hover:text-discord-text transition-colors' : ''
                }`}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs font-normal text-discord-muted mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right Controls: headerAction (toggle) on the left, Expand Icon on the right, aligned center */}
          {(collapsible || headerAction) && (
            <div className="flex items-center gap-3 shrink-0">
              {headerAction && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center shrink-0"
                >
                  {headerAction}
                </div>
              )}
              {collapsible && (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen((prev) => !prev);
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-discord-muted hover:text-discord-white hover:bg-discord-surface/70 transition-colors cursor-pointer bg-transparent border-0 p-0 focus-visible:outline-none shrink-0"
                  title={isOpen ? 'Collapse' : 'Expand'}
                >
                  <MdIcon name={isOpen ? 'expand_less' : 'expand_more'} className="text-xl leading-none" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {showBody && (
        <div id={collapsible ? contentId : undefined} className="contents">
          {children}
        </div>
      )}
    </div>
  );
});
SurfaceCard.displayName = 'SurfaceCard';

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
      boxed ? 'p-3.5 rounded-xl bg-discord-surface' : 'py-1'
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
  <div className="flex items-center gap-3 w-full">
    <div className="relative shrink-0">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[56px] w-[56px] rounded-lg border border-discord-border bg-discord-surface cursor-pointer p-1.5 shrink-0 shadow-sm transition-colors hover:border-discord-border-hover focus:outline-none focus:border-discord-blurple"
        title="Choose color"
      />
    </div>
    <div className="flex-1 min-w-0">
      <MdTextField label={label} value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  </div>
);

// ============================================================================
// UNSAVED CHANGES FLOATING BAR (MODAL)
// ============================================================================

export interface UnsavedChangesBarProps {
  show: boolean;
  message?: string;
  onReset: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
  resetLabel?: string;
  className?: string;
}

export const UnsavedChangesBar: React.FC<UnsavedChangesBarProps> = ({
  show,
  message = 'You have unsaved changes',
  onReset,
  onSave,
  saving = false,
  saveLabel = 'Save Changes',
  resetLabel = 'Reset',
  className = '',
}) => {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Unsaved changes warning"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-6 sm:gap-10 px-5 py-3 rounded-xl bg-[#111319] border border-discord-border shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-md transition-all duration-300 ease-out transform w-[calc(100%-2rem)] max-w-lg sm:w-auto ${
        show
          ? 'translate-y-0 opacity-100 pointer-events-auto scale-100'
          : 'translate-y-10 opacity-0 pointer-events-none scale-95'
      } ${className}`.trim()}
    >
      <span className="text-sm font-normal text-discord-white select-none whitespace-nowrap">
        {message}
      </span>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className="text-sm font-normal text-discord-muted hover:text-discord-white transition-colors cursor-pointer bg-transparent border-0 px-2 py-1.5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resetLabel}
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="bg-discord-blurple hover:bg-discord-blurple/90 active:scale-[0.98] text-white text-sm font-normal px-5 py-2 rounded-lg transition-all duration-150 cursor-pointer border-0 shadow-sm flex items-center justify-center gap-2 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
          )}
          <span>{saving ? 'Saving...' : saveLabel}</span>
        </button>
      </div>
    </div>
  );
};

