---
name: material-atomic-design
description: Enforces Google Material Design 3 (@material/web), strict Atomic Design System hierarchy (Atoms, Molecules, Organisms, Templates, Pages), and a Reuse-First component policy. Use on ANY frontend, UI, React, CSS, or dashboard task to prevent duplicate boilerplate, enforce existing component reuse, and maintain pixel-perfect Material Design consistency.
---

# Material Design & Atomic Design System Skill (Reuse-First Policy)

Whenever building, refactoring, styling, or modifying UI components and pages, you **MUST** strictly follow these three pillars:
1. **Reuse-First Policy (Utamakan Komponen yang Sudah Ada)**
2. **Atomic Design System Hierarchy**
3. **Google Material Design 3 (`@material/web`) & Single-Source-of-Truth Tokens**

---

## 1. Reuse-First Policy (Prioritas Utama: Gunakan Komponen yang Sudah Ada)

Before writing any JSX/HTML or creating a new component, **always inspect the existing Atomic catalog first**. Never duplicate raw `<div className="bg-discord-card ...">` blocks, manual headers, inline status badges, or custom inputs when an Atomic component already exists.

### Existing Component Catalog (`dashboard/src/components/`)

#### Atoms (`dashboard/src/components/atoms/index.tsx`)
Primitive building blocks wrapping `@material/web` or single-purpose UI elements:
- `MdButton`: Material 3 buttons (`variant="filled" | "tonal" | "outlined" | "text" | "elevated" | "danger"`, `icon`, `disabled`, `onClick`).
- `MdIconButton`: Material 3 icon buttons (`variant="standard" | "filled" | "tonal" | "outlined"`, `icon`, `title`).
- `MdFab`: Material 3 Floating Action Button (`icon`, `label`, `variant`, `size`).
- `MdTextField`: Material 3 Outlined Text Field (`label`, `value`, `onChange`, `debounceMs`, `icon`, `type="text" | "textarea" | "number" | "password"`).
  - **Rule**: Always pass `debounceMs={250}` on search/filter inputs so typing does not re-render the page on every keystroke.
- `MdSelect`: Material 3 Outlined Select (`label`, `value`, `onChange`, `options`).
- `MdSwitch`: Material 3 Switch (`checked`, `onChange`, `disabled`).
- `MdChip`: Material 3 Filter / Assist Chip (`label`, `selected`, `variant`, `icon`).
- `MdIcon`: Material Symbol icon wrapper (`name`, `slot`, `className`).
- `MdDivider`: Material 3 divider (`inset`, `className`).
- `MdLoading`: Centered Material 3 circular progress indicator.
- `SectionHeader`: Section title with blurple underline accent (`title`, `className`).
- `StatusBadge`: Semantic status pill (`label`, `tone="blurple" | "green" | "yellow" | "red" | "premium" | "neutral"`).
- `DiscordMark`: Official Discord SVG mark (`className`).

#### Molecules (`dashboard/src/components/molecules/index.tsx`)
Composite UI patterns combining two or more Atoms:
- `PageHeader`: Standardized page header (`category`, `title`, `description`, `actions`). **Never** hand-roll `<h1>` + subtitle headers on pages.
- `SurfaceCard`: Standardized card container (`title`, `subtitle`, `headerAction`, `noPadding`, `onClick`, `children`). **Never** hand-roll `<div className="bg-discord-card border border-discord-border rounded-xl p-5">`.
- `NoticeBanner`: Standardized feedback/alert banner (`message`, `tone="success" | "danger" | "info" | "warning"`, `icon`).
- `SwitchRow`: Standardized label + description + `MdSwitch` row (`label`, `description`, `checked`, `onChange`, `boxed`, `danger`).
- `EmptyState`: Standardized empty state placeholder (`icon`, `title`, `description`, `action`).
- `ColorPickerField`: Standardized hex color input + `MdTextField` (`label`, `value`, `onChange`).
- `MdDialog`: Material 3 modal dialog with backdrop scroll lock (`open`, `onClose`, `headline`, `actions`, `children`).
- `ConfirmDialog`: Destructive/confirmation modal (`open`, `title`, `message`, `confirmLabel`, `danger`, `onConfirm`, `onClose`).
- `MdTabs`: Material 3 primary tab bar (`tabs`, `activeIndex`, `onChange`).
- `QuickActionCard` & `ModuleCard`: Interactive cards with `<md-ripple>` and `<md-elevation>`.

#### Organisms (`dashboard/src/components/organisms/index.tsx`)
Complex, self-contained domain sections:
- `TopHeaderBar`: Sticky top app bar with Guild switcher, `Ctrl+K` trigger, and User menu.
- `NavigationSidebar`: Categorized left navigation drawer with active indicator bar.
- `CommandSearchModal`: Algolia-style `Ctrl+K` command palette with `250ms` debounced search, categorized headers, and 5-item viewport (`316px`).
- `DiscordEmbedPreview`: Live Discord message and rich embed simulator.

#### Templates (`dashboard/src/components/templates/index.tsx`)
Page-level structural shells:
- `Layout`: Combines `TopHeaderBar`, `NavigationSidebar`, `CommandSearchModal`, and `<Outlet />`.

### When Is a New Component Allowed?
Only create a new component if:
1. No existing Atom, Molecule, or Organism can fulfill the requirement via props, AND
2. The pattern is used in **2 or more places** (or is a distinct domain Organism).
3. Place it in the exact Atomic layer (`atoms/`, `molecules/`, `organisms/`, `templates/`) and export it from that layer's `index.tsx`.

---

## 2. Atomic Design System Rules

```
src/components/
├── atoms/index.tsx       # Basic Material Web wrappers & single-element primitives
├── molecules/index.tsx   # Reusable UI combinations (PageHeader, SurfaceCard, SwitchRow, MdDialog, etc.)
├── organisms/index.tsx   # Complex sections (TopHeaderBar, NavigationSidebar, CommandSearchModal, DiscordEmbedPreview)
└── templates/index.tsx   # Page shells (Layout)
src/pages/                # Route views composed strictly from Templates, Organisms, Molecules, and Atoms
```

- **Direct Layer Imports**: Pages must import directly from `../components/atoms`, `../components/molecules`, `../components/organisms`, and `../components/templates` (never from legacy shims).
- **One-Way Dependency Flow**:
  - `Atoms` cannot import from Molecules, Organisms, Templates, or Pages.
  - `Molecules` can only import from `Atoms`.
  - `Organisms` can only import from `Molecules` and `Atoms`.
  - `Templates` can only import from `Organisms`, `Molecules`, and `Atoms`.
  - `Pages` assemble `Templates`, `Organisms`, `Molecules`, and `Atoms` with data/state.

---

## 3. Google Material Design 3 (`@material/web`) & Styling Rules

1. **Custom Elements in React 18**:
   - On raw `<md-*>` custom elements (`<md-list>`, `<md-list-item>`, `<md-icon>`), React 18 passes `class` (not `className`) to the DOM. Prefer using the `<MdIcon />` atom, or use `class="..."` when writing `<md-list>` / `<md-list-item>`.
2. **`<md-list-item>` & `<md-select-option>` Alignment (No `slot="headline"` for single-line items)**:
   - In `@material/web`, `<slot class="default-slot">` inside `.text` occupies Line 1. Using `slot="headline"` pushes text to Line 2 and creates unwanted vertical offset.
   - Always place single-line label text in the **default slot** (e.g. `<span className="text-xs font-normal">Label</span>`) so items stay vertically centered and pixel-aligned.
3. **Typography & Weight Consistency**:
   - Maintain `font-normal` (`font-weight: 400`) across all UI elements. Never use `font-bold`, `font-semibold`, or `font-medium`.
4. **Single Source of Truth (`dashboard/src/theme/theme.css`)**:
   - All colors and `--md-sys-color-*` tokens live in `dashboard/src/theme/theme.css`. Never hardcode random hex colors in JSX when a semantic token (`text-discord-white`, `text-discord-muted`, `bg-discord-card`, `bg-discord-surface`, `border-discord-border`, `text-discord-blurple`) exists.
5. **Debounced Search**:
   - Every search or filter text field must include `debounceMs={250}` on `<MdTextField />` to prevent unnecessary re-renders while typing.
