# Archive Report: clean-customers-module

**Archived**: 2026-05-26
**Branch**: `feature-refactorizacion-cliente`
**Project**: Sell-Point Frontend
**Archive**: `openspec/changes/archive/2026-05-26-clean-customers-module/`

---

## Summary

Refactorización completa del módulo de clientes a Clean Architecture. El monolito original de `CustomersPageComponent` (696 líneas TS + 430 HTML) se dividió en capas domain/data/presentation, preservando 100% del comportamiento funcional.

## Tasks Completed

| Task | File(s) | Status |
|------|---------|--------|
| T-001 | `domain/customer.entity.ts` | ✅ |
| T-002 | `domain/customer.repository.ts`, `domain/use-cases/*.ts` | ✅ |
| T-003 | `data/customer-remote.datasource.ts` | ✅ |
| T-004 | `data/customer.mapper.ts`, `data/customer-impl.repository.ts` | ✅ |
| T-005 | `i18n/customers.translations.ts` | ✅ |
| T-006 | `components/customer-kpi-cards.component.ts` | ✅ |
| T-007 | `components/customer-table.component.ts`, `.html` | ✅ |
| T-008 | `components/customer-form-modal.component.ts` | ✅ |
| T-009 | `customers-page.component.ts` (696→357), `.html` (430→107) | ✅ |
| T-010 | `invoice-api.service.ts` (-3 métodos customers) | ✅ |

**Total**: 10/10 (100%)

## Spec Requirements Coverage

| Requirement | Status |
|-------------|--------|
| R1: List customers with KPIs | ✅ |
| R2: Search and filter customers | ✅ |
| R3: Paginate results client-side | ✅ |
| R4: Create customer | ✅ |
| R5: Edit customer | ✅ |
| R6: Toggle active status | ✅ |
| R7: Show customer info | ✅ |
| R8: Theme and session persistence | ✅ |
| R9: User menu | ✅ |

**Coverage**: 9/9 (100%)

## Artifact Inventory

| Artifact | Path |
|----------|------|
| Proposal | `proposal.md` |
| Delta Spec | `specs/customer-management/spec.md` |
| Design | `design.md` |
| Tasks | `tasks.md` |
| Archive Report | `archive-report.md` (this file) |

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| customer-management | Created (no main spec existed) | Copied delta spec → `openspec/specs/customer-management/spec.md` |

## Known Conditions

| # | Condition | Resolution |
|---|-----------|------------|
| 1 | `.gitkeep` debe eliminarse | ✅ Eliminado en commit 1fb1d48 |
| 2 | `createCustomer` en InvoiceApiService debe preservarse por dependencia de `new-customer-modal` | ✅ Preservado, marcado para futura extracción |

## Pendientes para Futuros Cambios

- Extraer user menu + theme + session logic a shared (se repite en invoices, products, dashboard)
- Extraer sidebar i18n a shared/i18n/
- Migrar `createCustomer` de InvoiceApiService a usar el datasource de customers
- Migrar `searchCustomers`/`fetchCustomersPage` a usar CustomerRemoteDataSource
- Agregar tests unitarios para use-cases y mappers (arquitectura ya lo habilita)

## Commits

```
808adff docs(sdd): add clean-customers-module proposal, spec, design and tasks
20d2f75 feat(customers): add domain entity, repository, and use-cases
c81a5d8 feat(customers): add data layer with remote datasource, mapper, and impl repository
762e132 feat(customers): extract i18n translations to dedicated module
4291805 feat(customers): add CustomerKpiCardsComponent with total/active/inactive inputs
06ae54b feat(customers): add CustomerTableComponent with filters, table, and pagination
e2198e5 feat(customers): add CustomerFormModalComponent with form signals and validation
6a9f54d docs(sdd): mark T-006, T-007, T-008 as complete in tasks.md
ad184f1 feat(customers): reduce orchestrator to 357 lines and clean InvoiceApiService
1fb1d48 chore(customers): remove obsolete .gitkeep from customers feature
```

## Architecture Verdict

- **CustomerEntity**: 0 imports de Angular ✅ (dominio puro)
- **CustomerRepository**: abstract class sin dependencias de framework ✅
- **Build**: pasa sin errores ✅
- **InvoiceApiService**: ya no maneja CRUD de clientes (solo search/select necesario para invoices) ✅

---

## SDD Cycle Complete

The `clean-customers-module` change has been fully planned, implemented, verified, and archived.
