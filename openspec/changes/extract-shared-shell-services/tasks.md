# Tasks: extract-shared-shell-services

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~550 (additions ~185, deletions ~365) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Services + Component + 1 page; PR 2: remaining 4 pages |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Base | Est. Δ |
|------|------|-----------|------|--------|
| 1 | Services + Component + Customers migration | PR 1 | main | ~230 |
| 2 | Products, Invoices, Dashboard, Categories | PR 2 | main | ~320 |

## Phase 1: Foundation — Services

- [x] 1.1 Create `src/presentation/shared/services/session.service.ts` — `displayName`, `userInitials`, `init()`, `logout()`, `openNotifications()`, `openUserSettings()`
- [x] 1.2 Create `src/presentation/shared/services/theme.service.ts` — `AppTheme` type, `theme()`, `init()`, `toggle()`, `currentThemeLabel()`, `iconVariationSettings()`

## Phase 2: Component Refactor

- [x] 2.1 Modify `src/presentation/shared/components/billflow-user-menu.component.ts` — remove `@Input() open/closing`, `@Output() toggle/close`, add internal `visible/closing/open` signals + `closeTimeout`

## Phase 3: Page Migration — Wave 1

- [ ] 3.1 Modify `src/presentation/features/customers/customers-page.component.ts` — remove ~65 dupes, inject `SessionService` + `ThemeService`, call `init()` in ngOnInit
- [ ] 3.2 Modify `src/presentation/features/customers/customers-page.component.html` — simplify `<billflow-user-menu>`, use `session.displayName()`

## Phase 4: Page Migration — Wave 2

- [ ] 4.1 Modify `src/presentation/features/products/products-page.component.ts` + `.html` — same pattern, remove dupes
- [ ] 4.2 Modify `src/presentation/features/invoices/invoice-page.component.ts` + `.html` — same pattern
- [ ] 4.3 Modify `src/presentation/features/dashboard/dashboard-page.component.ts` + `.html` — remove dupes (no theme toggle, keep locale signal)
- [ ] 4.4 Modify `src/presentation/features/categories/categories-page.component.ts` + `.html` — same pattern

## Phase 5: Verification

- [ ] 5.1 Run `ng build` — verify zero compilation errors after each page migration
- [ ] 5.2 Manual: user menu open/close, theme toggle + persist, logout confirm + redirect, notifications/settings toast/alert
