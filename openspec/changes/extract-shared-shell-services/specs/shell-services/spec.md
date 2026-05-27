# Shell Services Specification

## Purpose

Shared `SessionService`, `ThemeService` and self-contained `BillflowUserMenuComponent` for session, theme, and shell navigation — replacing ~465 lines of duplicate code across 5 pages.

## Requirements

### Session — init

MUST read `billflow-session` from localStorage, parse JSON, set `displayName` (uppercased) and `userInitials` (first 2 chars).

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Valid | `billflow-session` = `{"firstName":"Carlos"}` | `init()` | `displayName` = "CARLOS", `userInitials` = "CA" |
| Missing | No key in localStorage | `init()` | defaults "Usuario" / "US" |

### Session — logout

MUST confirm dialog, then clear localStorage and redirect to `/auth`.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Accept | Logout clicked | User confirms | localStorage cleared, redirect `/auth` |
| Cancel | Logout clicked | User cancels | No action |

### Session — openNotifications

MUST show a toast with the standard message.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Default | Active session | `openNotifications()` | Toast: "Tenés 3 movimientos críticos esperando revisión." |

### Session — openUserSettings

MUST show an alert with the standard message.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Default | Active session | `openUserSettings()` | Alert: "Acá podés actualizar tu perfil y preferencias." |

### Theme — init

MUST read `billflow-theme` (localStorage), fallback `prefers-color-scheme`. Apply `dark` class to `<html>` when dark.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Stored dark | `billflow-theme` = `"dark"` | `init()` | `<html>` has class `dark` |
| System dark | No stored theme, OS dark | `init()` | `<html>` has class `dark` |
| System light | No stored theme, OS light | `init()` | `<html>` no `dark` class |

### Theme — toggle

MUST flip theme, persist to localStorage, apply/remove `dark` class.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| To dark | Theme = `"light"` | `toggle()` | dark, localStorage = `"dark"`, class added |
| To light | Theme = `"dark"` | `toggle()` | light, localStorage = `"light"`, class removed |

### Theme — currentThemeLabel

MUST return localized label. `"es"` → Spanish, else English.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Dark, es | dark, locale `"es"` | `currentThemeLabel("es")` | `"Modo oscuro"` |
| Light, en | light, locale `"en"` | `currentThemeLabel("en")` | `"Light mode"` |

### Theme — iconVariationSettings

MUST return font-variation-settings per active state.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Active | `active = true` | `iconVariationSettings(true)` | `"'FILL' 1"` |
| Inactive | `active = false` | `iconVariationSettings(false)` | `"'FILL' 0"` |

### User Menu — state & document:click

Component MUST manage `open`/`closing` internally (no external inputs). `document:click` outside panel closes with 180ms delay. Rapid retoggle clears previous timeout.

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Open | Component rendered | Click toggle | `open` = true, panel renders |
| Close | Open | Click toggle | `closing` = true, 180ms → `open` = false |
| Outside click | Open | Click outside | `closing` = true, 180ms → `open` = false |
| Inside click | Open | Click inside | Menu stays open |
| Rapid retoggle | Closing in progress | Toggle again | Previous timeout cleared, new 180ms starts |
