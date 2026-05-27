# Design: extract-shared-shell-services

## Technical Approach

Extraer ~465 líneas duplicadas de session, theme, y user menu state en 5 páginas hacia 2 servicios `providedIn: 'root'` + autocontener el menú. Estrategia en 3 fases: crear servicios → modificar BillflowUserMenuComponent → migrar páginas 1×1 verificando `ng build` en cada paso.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Alcance del i18n en SessionService | Textos hardcodeados es/en | Inyectar strings desde cada página | Evita acoplar SessionService a 5 interfaces de traducción distintas; ~20 líneas vs 0 ganancia |
| Dashboard: locale propio | No se migra a LocaleService | Dashboard usa su propio signal `locale` | Out of scope; el design nota el mismatch pero no lo resuelve |
| `theme.init()` en dashboard | Se llama igual | No llamarlo | Es idempotente; simplifica el patrón (todas las páginas igual) |

## Data Flow

```
                 ┌──────────────────┐
                 │  localStorage    │
                 │  billflow-session│
                 │  billflow-theme  │
                 │  billflow-lang   │
                 └───┬──┬───────────┘
                     │  │
        ┌────────────┘  └────────────┐
        ▼                            ▼
┌─────────────────┐    ┌────────────────────┐
│ SessionService   │    │ ThemeService        │
│ displayName()    │    │ theme()             │
│ userInitials()   │    │ currentThemeLabel() │
│ init()           │    │ init()              │
│ logout()         │    │ toggle()            │
│ openNotifications│    │ iconVariation()     │
│ openUserSettings │    └────────┬───────────┘
└────────┬─────────┘             │
         │                       │
         ▼                       ▼
┌─────────────────────────────────────┐
│ BillflowUserMenuComponent           │
│  (state internalizado: visible,     │
│   closing, open, closeTimeout)      │
│  @HostListener('document:click')    │
│  toggleMenu() / closeMenu()        │
└────────────┬────────────────────────┘
             │
    ┌────────┴────────────┬────────────────┐
    ▼                     ▼                ▼
CustomersPage   ProductsPage   InvoicesPage  ...
(session+theme injectados, template simplificado)
```

## File Changes

| File | Action | Lines Δ |
|------|--------|---------|
| `src/presentation/shared/services/session.service.ts` | Create | +75 |
| `src/presentation/shared/services/theme.service.ts` | Create | +50 |
| `src/presentation/shared/components/billflow-user-menu.component.ts` | Modify | ~±20 |
| `src/presentation/features/customers/customers-page.component.ts` | Modify | -65 |
| `src/presentation/features/customers/customers-page.component.html` | Modify | -8 |
| `src/presentation/features/products/products-page.component.ts` | Modify | -65 |
| `src/presentation/features/invoices/invoice-page.component.ts` | Modify | -65 |
| `src/presentation/features/categories/categories-page.component.ts` | Modify | -65 |
| `src/presentation/features/dashboard/dashboard-page.component.ts` | Modify | -55 |

## Interfaces / Contracts

```typescript
// ── SessionService ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly displayName: WritableSignal<string> = signal('Usuario');
  readonly userInitials: WritableSignal<string> = signal('US');
  private feedback = inject(UiFeedbackService);
  private localeService = inject(LocaleService);

  init(): void {
    // lee billflow-session, parsea, setea displayName e initials
    // igual lógica que applyStoredUser() actual
  }

  async logout(): Promise<void> {
    // feedback.confirm → localStorage.removeItem('billflow-session') → location.replace('/auth')
  }

  openNotifications(): void {
    // feedback.toast('info', …) — hardcoded es/en
  }

  async openUserSettings(): Promise<void> {
    // feedback.alert('info', …) — hardcoded es/en
  }
}

// ── ThemeService ─────────────────────────────────────────────
export type AppTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme: WritableSignal<AppTheme> = signal('light');

  init(): void {
    // lee billflow-theme + prefers-color-scheme, setea signal y <html>.classList
  }

  toggle(): void {
    // flip signal, persist (localStorage + <html>.classList)
  }

  currentThemeLabel(locale: string): string {
    // retorna "Modo oscuro"/"Dark mode" etc según locale y theme()
  }

  iconVariationSettings(active: boolean): string {
    // retorna "'FILL' 1" | "'FILL' 0"
  }
}

// ── BillflowUserMenuComponent (post-refactor) ────────────────
// ELIMINAR: @Input() open, @Input() closing, @Output() toggle, @Output() close
// AGREGAR: signals internos visible, closing, open + closeTimeout
//          toggleMenu(event), closeMenu(), handleDocumentClick (ya existe)
// CONSERVAR: displayName, initials, showLanguageToggle, languageLabel,
//            settingsLabel, logoutLabel, sessionLabel (inputs)
//            languageToggle, settings, logout (outputs)
```

## Key Implementation Details

### SessionService.init() — orden de resolución del candidate
```
employeeId → id → email prefix → user.fullName → user.name → user.firstName → 'Usuario'
displayName = candidate === 'Usuario' ? candidate : candidate.toUpperCase()
initials = primeras 2 letras de cada palabra del candidate
```

### BillflowUserMenuComponent — estado interno
```typescript
private visible = signal(false);
private closing = signal(false);
private open = signal(false);
private closeTimeout: number | undefined;

toggleMenu(event: MouseEvent) {
  event.stopPropagation();
  if (this.visible()) { this.closeMenu(); return; }
  this.closing.set(false);
  this.visible.set(true);
  this.open.set(true);
}

private closeMenu() {
  if (!this.visible() || this.closing()) return;
  this.closing.set(true);
  this.closeTimeout = window.setTimeout(() => {
    this.visible.set(false); this.open.set(false); this.closing.set(false);
  }, 180);
}
```
El `@HostListener('document:click')` existente funciona igual, usando `this.open` interno.

### Dashboard — casos especiales
- Usa `iconVariationSettings` en mobile nav → `theme.iconVariationSettings()`
- Template greeting: `{{ session.displayName() }}`
- NO tiene `toggleTheme` en template (no migrar botón que no existe)
- Mantiene su propio `locale` signal y `toggleDashboardLocale()` — no usa LocaleService
- `showNotifications()`, `openUserSettings()`, `logout()` se migran a `session.*`

### Template post-refactor (todas las páginas)
```html
<billflow-user-menu
  [displayName]="session.displayName()"
  [initials]="session.userInitials()"
  [showLanguageToggle]="true"
  [languageLabel]="copy().languageToggle"
  [settingsLabel]="copy().settings"
  [logoutLabel]="copy().signOut"
  [sessionLabel]="copy().sessionLabel"
  (languageToggle)="toggleLocale()"
  (settings)="session.openUserSettings()"
  (logout)="session.logout()">
</billflow-user-menu>
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Build | Compilación post-cada página | `npm run build` o `ng build` |
| Manual | User menu: abrir/cerrar, click fuera | Verificar animación 180ms |
| Manual | Theme toggle: persistencia y dark mode | Refrescar página, verificar clase `dark` |
| Manual | Logout: confirmación → redirect | Verificar redirección a `/auth` |
| Manual | Dashboard: iconVariationSettings en mobile nav | Verificar que el glyph FILL cambia |

No se agregan tests unitarios (out of scope por proposal).

## Migration / Rollout

Por página migrada:
```bash
git checkout -- src/presentation/features/{feature}/*.component.ts
git checkout -- src/presentation/features/{feature}/*.component.html
```
Los services nuevos (`session.service.ts`, `theme.service.ts`) son additive — no rompen nada por sí solos. Rollback total: eliminar esos 2 archivos + revertir cambios al user menu component + checkout de las 5 páginas.

## Open Questions

- [ ] **Dashboard locale mismatch**: Dashboard usa su propio `locale` signal que no está sincronizado con `LocaleService`. SessionService usará `LocaleService.locale()` para strings de logout/notificaciones. Si el usuario cambia idioma solo desde el dashboard, SessionService mostrará strings en el locale anterior. Este bug pre-existe y queda fuera de scope.
- [ ] **Dashboard `#userMenuPanel`**: El dashboard declara `@ViewChild('userMenuPanel')` pero NO tiene `#userMenuPanel` en su template. Esto es un bug pre-existente que se resuelve automáticamente al migrar el `document:click` handler al componente.
