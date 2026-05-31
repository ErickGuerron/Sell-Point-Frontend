---
name: BillFlow Frontend Design Guide
colors:
  light:
    primary: "#3525cd"
    secondary: "#006591"
    surface: "#faf8ff"
    surface-container-lowest: "#ffffff"
    surface-container-low: "#f2f3ff"
    surface-container: "#eaedff"
    surface-container-high: "#e2e7ff"
    surface-container-highest: "#dae2fd"
    background: "#faf8ff"
    on-surface: "#131b2e"
    on-surface-variant: "#464555"
    outline: "#777587"
    outline-variant: "#c7c4d8"
    error: "#ba1a1a"
    primary-container: "#4f46e5"
    secondary-container: "#39b8fd"
  dark:
    primary: "#c3c0ff"
    secondary: "#89ceff"
    surface: "#0f1628"
    surface-container-lowest: "#11182b"
    surface-container-low: "#141d32"
    surface-container: "#18213a"
    surface-container-high: "#1d2846"
    surface-container-highest: "#25345a"
    background: "#0b1020"
    on-surface: "#eef0ff"
    on-surface-variant: "#c7c4d8"
    outline: "#6f7592"
    outline-variant: "#394566"
    error: "#ff8f87"
    primary-container: "#3525cd"
    secondary-container: "#006591"
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    lineHeight: 1.1
    fontWeight: 800
  h1:
    fontFamily: Inter
    fontSize: 32px
    lineHeight: 1.2
    fontWeight: 700
  h2:
    fontFamily: Inter
    fontSize: 24px
    lineHeight: 1.3
    fontWeight: 700
  h3:
    fontFamily: Inter
    fontSize: 20px
    lineHeight: 1.4
    fontWeight: 600
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    lineHeight: 1.6
    fontWeight: 400
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    lineHeight: 1.5
    fontWeight: 400
  button:
    fontFamily: Inter
    fontSize: 15px
    lineHeight: 1
    fontWeight: 600
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    lineHeight: 1
    fontWeight: 700
    letterSpacing: 0.05em
rounded:
  sm: 8px
  md: 12px
  full: 9999px
---

# BillFlow Frontend Design Guide

This document defines the rules every new screen, redesign, and UI refinement must follow in BillFlow Frontend.
If a design decision conflicts with this guide, the guide wins unless an exception is explicitly approved.

Source of truth: `src/presentation/styles/global.css` for the active visual system, with `src/styles/global.css` kept as the base token layer.

## 1) Non-negotiables

1. Every new page must use `MainLayout.astro`.
2. All styling must come from the shared design tokens in `src/styles/global.css` or from existing semantic classes.
3. Every user-facing flow must meet **WCAG 2 AA**.
4. New UI must be mobile-first and responsive by default.
5. Reuse existing components before creating a new pattern.

## 2) Design goals

- Keep the interface clear, calm, and high-density without visual noise.
- Make the primary action obvious.
- Preserve consistency across screens, states, and interaction patterns.
- Prefer predictable layouts over decorative variation.

## 3) System foundations

| Area | Rule |
|------|------|
| Base stack | Astro for pages; Angular standalone components for feature UI. |
| Layout | `MainLayout.astro` owns the shell, document structure, and shared page chrome. |
| Typography | Inter is the default font family for all UI. |
| Color | Use semantic tokens only from the active theme layer in `src/presentation/styles/global.css`. |
| Icons | Use Material Symbols Outlined; use `FILL` only when state demands it. |
| Theme | Support light/dark mode through `billflow-theme` and `prefers-color-scheme`. |

## 4) Color palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `primary` | `#3525cd` | `#c3c0ff` | CTAs, active states, brand emphasis. |
| `primary-container` | `#4f46e5` | `#3525cd` | Filled emphasis surfaces, badge backgrounds, selected states. |
| `secondary` | `#006591` | `#89ceff` | Supporting interactive elements and secondary accents. |
| `secondary-container` | `#39b8fd` | `#006591` | Hover accents, indicator fills, secondary emphasis. |
| `surface` | `#faf8ff` | `#0f1628` | Main page surface. |
| `surface-container-lowest` | `#ffffff` | `#11182b` | Inputs, cards, and elevated content shells. |
| `surface-container-low` | `#f2f3ff` | `#141d32` | Soft panels and form fields. |
| `surface-container` | `#eaedff` | `#18213a` | Mid-depth containers and grouped content. |
| `surface-container-high` | `#e2e7ff` | `#1d2846` | Stronger grouped surfaces. |
| `surface-container-highest` | `#dae2fd` | `#25345a` | Header bands, dense table areas, strong contrast blocks. |
| `background` | `#faf8ff` | `#0b1020` | Root page background. |
| `on-surface` | `#131b2e` | `#eef0ff` | Primary text. |
| `on-surface-variant` | `#464555` | `#c7c4d8` | Secondary text, helper text, icons. |
| `outline` | `#777587` | `#6f7592` | Borders and dividers when contrast must be stronger. |
| `outline-variant` | `#c7c4d8` | `#394566` | Default borders, inputs, card edges. |
| `error` | `#ba1a1a` | `#ff8f87` | Validation, destructive actions, error states. |

## 5) Screen implementation rules

- Start with the existing page shell, then add content.
- Prefer Tailwind utilities for layout, spacing, and responsive behavior.
- Use semantic component classes (`billflow-*`, `app-*`, `dashboard-*`) only when the pattern is reused or too complex for utilities alone.
- Do not duplicate `<html>`, `<head>`, font loading, or global shell concerns.
- Do not introduce arbitrary hex colors, spacing, shadows, or radii if a token or existing utility already covers it.
- Keep screens composed of clear sections: header, content, actions, and feedback states.
- Keep copy, labels, and empty states consistent with the existing locale strategy.

## 6) Visual language

| Element | Rule |
|---------|------|
| Cards | Use 12px radius, 1px subtle border, surface container backgrounds, and soft shadows. |
| Inputs | Use 8px radius, outline-variant border, low surface background, and a primary focus ring. |
| Buttons | Use 8px radius, primary fill for the main action, and subtle lift on hover. |
| Pills / toggles | Use full radius when the UI needs chip-like controls or theme toggles. |
| Overlays | Modals, drawers, and popovers should use blurred backdrops, controlled elevation, and the same border language as cards. |
| Density | Favor compact but readable layouts; avoid over-sizing controls without a reason. |
| Emphasis | Use primary color sparingly for the most important action or active state. |

## 7) Interaction rules

- Use `type="button"` for actions that do not submit forms.
- Provide explicit loading, empty, success, and error states.
- Disable controls clearly when an action is unavailable.
- Keep keyboard order logical and visible.
- Prefer declarative state (`signal`, `computed`, shared services) over scattered imperative state.
- Default focus treatment should be visible and match the active theme tokens, not a hard-coded one-off color.

## 8) WCAG 2 AA requirements

Every new screen or redesign must satisfy these minimum accessibility rules:

- Text contrast must meet WCAG 2 AA: **4.5:1** for normal text, **3:1** for large text and essential UI graphics.
- All interactive elements must be reachable and usable with keyboard only.
- Focus must always be visible and not removed without an equivalent replacement.
- All controls need accessible names (`aria-label`, visible label, or equivalent semantic text).
- Errors must be announced clearly and associated with the relevant field.
- Do not use color alone to communicate state, status, or meaning.
- Content must remain readable and usable at zoom and smaller viewport sizes.
- Motion and animation must be subtle and respect user preferences when reduced motion is enabled.
- Images, icons, and decorative elements must be marked correctly so they do not create noise for assistive technology.

If accessibility and visual preference conflict, accessibility wins.

## 9) Naming conventions

- `billflow-*`: shared components and global building blocks.
- `app-*`: feature-specific structures or UI pieces.
- `dashboard-*`: dashboard layouts, cards, and table patterns.
- `text-*`, `bg-*`, `border-*`: only when they map to the design system and not arbitrary values.

## 10) Checklist for any new screen or redesign

- [ ] Uses `MainLayout`.
- [ ] Uses shared tokens or existing semantic classes.
- [ ] Works well on mobile first, then scales up cleanly.
- [ ] Meets WCAG 2 AA contrast, keyboard, focus, and labeling requirements.
- [ ] Includes loading, empty, and error states.
- [ ] Uses consistent copy and locale handling.
- [ ] Reuses existing patterns before creating new ones.
- [ ] Does not introduce one-off styling that breaks the system.

## 11) When to update this guide

Update this file whenever a pattern is reused enough to become a standard.
If a new screen introduces a repeated visual or interaction pattern, document it here before it spreads.
