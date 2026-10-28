import React from 'react';

type CustomElement<T = Record<string, any>> = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement> & T & { class?: string; slot?: string },
  HTMLElement
>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-filled-button': CustomElement<{ disabled?: boolean; type?: string; href?: string; target?: string }>;
      'md-outlined-button': CustomElement<{ disabled?: boolean; type?: string; href?: string; target?: string }>;
      'md-filled-tonal-button': CustomElement<{ disabled?: boolean; type?: string; href?: string; target?: string }>;
      'md-text-button': CustomElement<{ disabled?: boolean; type?: string; href?: string; target?: string }>;
      'md-elevated-button': CustomElement<{ disabled?: boolean; type?: string; href?: string; target?: string }>;
      'md-icon-button': CustomElement<{ disabled?: boolean; toggle?: boolean; selected?: boolean }>;
      'md-filled-icon-button': CustomElement<{ disabled?: boolean; toggle?: boolean; selected?: boolean }>;
      'md-filled-tonal-icon-button': CustomElement<{ disabled?: boolean; toggle?: boolean; selected?: boolean }>;
      'md-outlined-icon-button': CustomElement<{ disabled?: boolean; toggle?: boolean; selected?: boolean }>;
      'md-fab': CustomElement<{ variant?: 'surface' | 'primary' | 'secondary' | 'tertiary'; size?: 'small' | 'medium' | 'large'; label?: string; lowered?: boolean }>;
      'md-icon': CustomElement;
      'md-outlined-text-field': CustomElement<{
        label?: string;
        value?: string;
        type?: string;
        placeholder?: string;
        disabled?: boolean;
        required?: boolean;
        rows?: number;
        maxLength?: number;
        min?: string | number;
        max?: string | number;
        supportingText?: string;
      }>;
      'md-filled-text-field': CustomElement<{
        label?: string;
        value?: string;
        type?: string;
        placeholder?: string;
        disabled?: boolean;
        required?: boolean;
        rows?: number;
      }>;
      'md-outlined-select': CustomElement<{
        label?: string;
        value?: string;
        disabled?: boolean;
        required?: boolean;
      }>;
      'md-filled-select': CustomElement<{
        label?: string;
        value?: string;
        disabled?: boolean;
        required?: boolean;
      }>;
      'md-select-option': CustomElement<{
        value?: string;
        selected?: boolean;
      }>;
      'md-switch': CustomElement<{
        selected?: boolean;
        disabled?: boolean;
        icons?: boolean;
      }>;
      'md-checkbox': CustomElement<{
        checked?: boolean;
        disabled?: boolean;
        indeterminate?: boolean;
      }>;
      'md-chip-set': CustomElement;
      'md-filter-chip': CustomElement<{
        label?: string;
        selected?: boolean;
        disabled?: boolean;
        elevated?: boolean;
      }>;
      'md-assist-chip': CustomElement<{
        label?: string;
        disabled?: boolean;
        elevated?: boolean;
      }>;
      'md-tabs': CustomElement<{
        activeTabIndex?: number;
      }>;
      'md-primary-tab': CustomElement<{
        active?: boolean;
        inlineIcon?: boolean;
      }>;
      'md-secondary-tab': CustomElement<{
        active?: boolean;
      }>;
      'md-dialog': CustomElement<{
        open?: boolean;
        type?: string;
      }>;
      'md-circular-progress': CustomElement<{
        indeterminate?: boolean;
        value?: number;
      }>;
      'md-linear-progress': CustomElement<{
        indeterminate?: boolean;
        value?: number;
      }>;
      'md-divider': CustomElement<{
        inset?: boolean;
      }>;
      'md-list': CustomElement;
      'md-list-item': CustomElement<{
        type?: 'text' | 'button' | 'link';
        href?: string;
        disabled?: boolean;
      }>;
      'md-menu': CustomElement<{
        open?: boolean;
        anchor?: string;
        positioning?: 'absolute' | 'fixed' | 'document' | 'popover';
      }>;
      'md-menu-item': CustomElement<{
        disabled?: boolean;
        keepOpen?: boolean;
      }>;
      'md-ripple': CustomElement<{
        disabled?: boolean;
      }>;
      'md-elevation': CustomElement;
    }
  }
}
