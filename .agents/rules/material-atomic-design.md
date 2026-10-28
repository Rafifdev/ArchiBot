---
trigger: always_on
description: Always enforce Google Material Design 3 (@material/web), Atomic Design System hierarchy, and Reuse-First component policy across the dashboard.
---

# Material Design & Atomic Design System Rule

1. **Reuse-First Policy**: Always check and reuse existing components in `dashboard/src/components/atoms`, `molecules`, `organisms`, and `templates` (`MdButton`, `MdIconButton`, `MdTextField`, `MdSelect`, `MdSwitch`, `MdIcon`, `StatusBadge`, `PageHeader`, `SurfaceCard`, `NoticeBanner`, `SwitchRow`, `EmptyState`, `ColorPickerField`, `MdDialog`, `ConfirmDialog`, `MdTabs`, `QuickActionCard`, `ModuleCard`) before creating new components or writing inline HTML/Tailwind duplicates.
2. **Atomic Hierarchy**: Keep all UI components strictly organized under `atoms/`, `molecules/`, `organisms/`, and `templates/`, and import directly from those layers in `pages/`.
3. **Material Web (`@material/web`) Best Practices**:
   - Pass `debounceMs={250}` on all search/filter `<MdTextField />` inputs.
   - Use `class` (or `<MdIcon />`) instead of `className` on raw `<md-*>` custom elements.
   - Place single-line text inside `<md-list-item>` and `<md-select-option>` in the default slot (never `slot="headline"`) for true vertical centering.
   - Keep `font-normal` (`font-weight: 400`) everywhere and use semantic color tokens from `dashboard/src/theme/theme.css`.
