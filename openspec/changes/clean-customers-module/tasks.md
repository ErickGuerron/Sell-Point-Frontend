# Tasks: Clean Architecture — Customers Module

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2,400 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation) → PR 2 (Subcomponents) → PR 3 (Orchestrator + Cleanup) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain + Data + i18n (all new files, zero existing changes) | PR 1 | Base = feature/tracker branch |
| 2 | 3 subcomponents (CustomerKpiCards, CustomerTable, CustomerFormModal) | PR 2 | Base = tracker; pure additions, no existing code touched |
| 3 | Orchestrator reduction + InvoiceApiService cleanup + delete .gitkeep | PR 3 | Base = PR 2 branch; modifies 4 existing files |

---

## Phase 1: Domain Layer (zero external dependencies)

- [x] **T-001** (`src/presentation/features/customers/domain/customer.entity.ts`): Crear `CustomerEntity` + `CreateCustomerPayload` interfaces. Sin imports de Angular. (~12 lines)
- [x] **T-002** (`src/presentation/features/customers/domain/`): Crear `CustomerRepository` abstract class + 4 use-cases: `ListCustomersUseCase` (sort active-first), `CreateCustomerUseCase`, `UpdateCustomerUseCase`, `ToggleCustomerActiveUseCase`. Todos con `@Injectable()` y `inject(CustomerRepository)`. (~68 lines)
  - Dependencias: T-001

## Phase 2: Data Layer (depende de domain)

- [x] **T-003** (`src/presentation/features/customers/data/customer-remote.datasource.ts`): Crear `CustomerRemoteDataSource` con `fetchWithAuth` (replica de InvoiceApiService sin redirect, lanza `AuthError`), mocks migrados, y 4 métodos HTTP. (~145 lines)
  - Dependencias: T-001
- [x] **T-004** (`src/presentation/features/customers/data/customer.mapper.ts`, `src/presentation/features/customers/data/customer-impl.repository.ts`): Crear `mapBackendToEntity()` y `CustomerImplRepository extends CustomerRepository`. (~43 lines)
  - Dependencias: T-001, T-003

## Phase 3: i18n Extraction

- [x] **T-005** (`src/presentation/features/customers/i18n/customers.translations.ts`): Extraer ~80 strings × 2 idiomas del monolito. Estructura `CustomersCopy` + `CUSTOMERS_TEXT` + helper `customersCopy()`. (~210 lines)
  - Dependencias: ninguno (extracción pura)

## Phase 4: Presentation Subcomponents

- [ ] **T-006** (`src/presentation/features/customers/components/customer-kpi-cards.component.ts`): Extraer 3 glass cards en componente standalone con `@Input()` total/active/inactive. (~50 lines)
  - Dependencias: T-005
- [ ] **T-007** (`src/presentation/features/customers/components/customer-table.component.ts`, `.html`): Extraer tabla + paginación + helpers (fullName, initials, gradient, showInfo). `@Input`/`@Output` bound. (~300 lines)
  - Dependencias: T-001, T-005
- [ ] **T-008** (`src/presentation/features/customers/components/customer-form-modal.component.ts`): Extraer modal formulario con signals, sanitización, validación. Emite `save`/`close`. (~200 lines)
  - Dependencias: T-001, T-005

## Phase 5: Orchestrator Reduction

- [ ] **T-009** (`customers-page.component.ts`, `.html`): Reducir orchestrator a ~170 líneas TS + ~80 HTML. Inyecta 4 use-cases, mantiene signals de filtro/paginación/theme/user-menu. Template delega en subcomponentes. Agregar `providers: [CustomerRepository → CustomerImplRepository, 4 use-cases]`. (~250 lines net change)
  - Dependencias: T-001—T-008

## Phase 6: Cleanup

- [ ] **T-010** (`invoice-api.service.ts`, `new-customer-modal.component.ts`, `.gitkeep`): Eliminar 4 métodos de customers + `BackendCustomer` + mocks + `CreateCustomerPayload` de `InvoiceApiService`. Refactor `NewCustomerModalComponent` a versión slim (~20 lines) que usa `CreateCustomerUseCase`. Borrar `.gitkeep` de customers. (~275 lines net change)
  - Dependencias: T-009
