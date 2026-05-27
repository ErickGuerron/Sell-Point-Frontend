# Proposal: extract-shared-shell-services

## Intent

Eliminar ~465 líneas de código duplicado (user menu, theme, session, notifications) presentes en las 5 páginas principales (customers, products, invoices, dashboard, categories) extrayendo la lógica a 2 servicios compartidos y autoconteniendo el estado del user menu en su componente.

Cada página replica ~93 líneas de TS + template header idénticos. Esto es mantenimiento frágil: agregar un campo a la session o cambiar la animación del menú requiere tocar 5 archivos.

## Scope

### In Scope

- **SessionService** (`shared/services/session.service.ts`): signals `displayName`, `userInitials`, métodos `init()`, `logout()`, `openUserSettings()`, `openNotifications()`
- **ThemeService** (`shared/services/theme.service.ts`): signal `theme`, métodos `init()`, `toggle()`, `currentThemeLabel(locale)`, `iconVariationSettings(active)`
- **BillflowUserMenuComponent**: migrar estado open/closing/closingTimeout + `document:click` handler adentro del componente (hoy el padre maneja todo)
- Migrar las 5 páginas (customers, products, invoices, dashboard, categories) eliminando los bloques duplicados y usando los nuevos services
- Simplificar template del header en las 5 páginas: el user menu solo recibe displayName/initials y emite languageToggle/settings/logout

### Out of Scope

- Sidebar i18n (ya usa `buildBillflowSidebarItems`, no tiene duplicación)
- Angular Router
- Tests unitarios
- Auth flow (login/register en auth.astro)
- NotificationsButtonComponent (solo emite `clicked`, no tiene estado que extraer)

## Capabilities

### New Capabilities

- `session-service`: Manejo centralizado de sesión de usuario (displayName, initials, logout)
- `theme-service`: Manejo centralizado de tema claro/oscuro con persistencia a localStorage y `prefers-color-scheme`

### Modified Capabilities

- `customer-management`: Ningún cambio a nivel de spec — es refactor puro de infraestructura interna. Las capacidades del módulo customers no cambian.

## Approach

Estrategia en 3 fases, cada una autocontenida y reversible:

### Fase 1 — Crear servicios shared

1. `SessionService` (`providedIn: 'root'`)
   - `displayName = signal('Usuario')`, `userInitials = signal('US')`
   - `init()`: lee `billflow-session` de localStorage, parsea y setea signals
   - `logout()`: confirm dialog → limpia localStorage → redirect /auth
   - `openUserSettings()`: feedback.alert con mensaje estándar
   - `openNotifications()`: feedback.toast con mensaje estándar

2. `ThemeService` (`providedIn: 'root'`)
   - `theme = signal<'light'|'dark'>('light')`
   - `init()`: lee `billflow-theme` + `prefers-color-scheme`, aplica clase `dark` al `<html>`
   - `toggle()`: flip theme → persist → apply
   - `currentThemeLabel(locale)`: retorna string localizada
   - `iconVariationSettings(active)`: helper para font-variation-settings

### Fase 2 — Autocontener BillflowUserMenuComponent

- El componente pasa a manejar su propio estado `open`, `closing`, `closingTimeout`
- Eliminar inputs `[open]` y `[closing]` (ya no los recibe del padre)
- El `document:click` handler ya existe en el componente (línea 61-68), solo ajustar para que use estado interno
- Mantener `toggle`, `close` como eventos para compatibilidad (aunque close pasaría a ser manejado internamente)
- Outputs que se quedan: `languageToggle`, `settings`, `logout`

### Fase 3 — Migrar páginas (1 por 1, en cualquier orden)

Por cada página:
- Eliminar imports de `HostListener`, `ElementRef`, `ViewChild` (si ya no se usan)
- Eliminar: `userMenuVisible/closing/open`, `userMenuCloseTimeout`, `@ViewChild('userMenuPanel')`, `displayName`, `userInitials`
- Eliminar: `toggleUserMenu()`, `closeUserMenu()`, `handleDocumentClick()`
- Eliminar: `theme`, `toggleTheme()`, `applyStoredTheme()`, `persistTheme()`
- Eliminar: `applyStoredUser()`, `logout()`, `openNotifications()`, `openUserSettings()`
- Eliminar: `iconVariationSettings()`, `currentThemeLabel()`
- Inyectar `readonly session = inject(SessionService)` y `readonly theme = inject(ThemeService)`
- `ngOnInit`: llamar `this.session.init()` y `this.theme.init()`
- Template: `<billflow-user-menu>` simplificado sin `[open]`, `[closing]`, `(toggle)`, `(close)`
- Template: `{{ displayName }}` → `{{ session.displayName() }}`

Dashboard NO tiene theme toggle (no tiene `toggleTheme`), pero SÍ tiene `iconVariationSettings` en la mobile nav. Eso se resuelve igual con `theme.iconVariationSettings()`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/presentation/shared/services/session.service.ts` | **New** | Servicio de sesión shared |
| `src/presentation/shared/services/theme.service.ts` | **New** | Servicio de tema shared |
| `src/presentation/shared/components/billflow-user-menu.component.ts` | **Modified** | Estado open/closing interno |
| `src/presentation/features/customers/customers-page.component.ts` | **Modified** | ~65 líneas eliminadas |
| `src/presentation/features/customers/customers-page.component.html` | **Modified** | Template header simplificado |
| `src/presentation/features/products/products-page.component.ts` | **Modified** | ~65 líneas eliminadas |
| `src/presentation/features/invoices/invoice-page.component.ts` | **Modified** | ~65 líneas eliminadas |
| `src/presentation/features/dashboard/dashboard-page.component.ts` | **Modified** | ~60 líneas eliminadas (sin theme) |
| `src/presentation/features/dashboard/dashboard-page.component.html` | **Modified** | Template header simplificado |
| `src/presentation/features/categories/categories-page.component.ts` | **Modified** | ~65 líneas eliminadas |
| `src/presentation/features/categories/categories-page.component.html` | **Modified** | Template header simplificado |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|-------------|
| **Rotura de binding**: páginas existentes referencian `displayName` o `theme()` que ya no existen | Medium | Migrar 1 página a la vez, verificar compilación `ng build` después de cada una. Dashboard no usa theme→no rompe |
| **document:click duplicado**: tanto el component como el padre tienen @HostListener | Low | El padre ELIMINA su handler; el componente YA lo tiene interno. Conflict solo si se olvida borrar |
| **Dashboard no tiene theme**: su template usa `iconVariationSettings` pero no `toggleTheme` | Low | Dashboard inyecta ThemeService solo para iconVariationSettings. No init theme porque no tiene toggle |
| **Logout con i18n**: cada página usa su propia copy para strings de confirmación | Medium | SessionService necesita acceso a locale para strings. Inyectar LocaleService y usar textos hardcodeados en ambos idiomas, o recibir strings por parámetro |

## Rollback Plan

Por cada página migrada:

```
git checkout -- src/presentation/features/{feature}/*.component.ts
git checkout -- src/presentation/features/{feature}/*.component.html
```

Si algo rompe compilación o runtime, se revierte esa página individual sin afectar las demás. Los services nuevos no rompen nada por sí solos. Para rollback total: eliminar `session.service.ts`, `theme.service.ts` y revertir cambios al user menu component.

## Dependencies

Ninguna. Los services usan `providedIn: 'root'` y solo dependen de `UiFeedbackService`, `LocaleService` — ambos ya existen en `shared/services/`.

## Success Criteria

- [ ] `SessionService.init()` setea displayName e initials correctamente desde localStorage
- [ ] `ThemeService.init()` aplica el tema persistido (o `prefers-color-scheme`) al `<html>`
- [ ] BillflowUserMenuComponent abre/cierra sin inputs externos de open/closing
- [ ] `ng build` sin errores después de migrar cada página
- [ ] Las 5 páginas compilan y el header funciona (toggle menu, logout, theme toggle donde corresponde)
- [ ] Dashboard no pierde `iconVariationSettings` en mobile nav
- [ ] 0 regresiones funcionales en user menu, theme toggle, logout, notifications, settings
