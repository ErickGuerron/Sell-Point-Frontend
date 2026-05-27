# Proposal: Clean Architecture — Customers Module

## Intent

Monolito de 696 líneas mezcla i18n, API calls, filtrado, formulario, theme, user menu y session logic. Impide testear y escalar. Se aplica Clean Architecture preservando funcionalidad.

## Scope

### In Scope
- Capa **domain**: `CustomerEntity`, `CustomerRepository` (interfaz), 4 use-cases (list, create, update, toggle-active)
- Capa **data**: `CustomerImplRepository`, `CustomerRemoteDataSource`, `CustomerMapper` — extraídos de `InvoiceApiService`
- Capa **presentation**: 3 subcomponentes (`CustomerTable`, `CustomerFormModal`, `CustomerKpiCards`) + `CustomersPageComponent` como orchestrator reducido
- `i18n/customers.translations.ts`: extraer las 82 strings × 2 idiomas del monolito
- Eliminar los 4 métodos de customers de `InvoiceApiService`
- Mover mocks de customers del `InvoiceApiService` al datasource

### Out of Scope
- Tests (pero la arquitectura debe habilitarlos)
- Angular Router (sigue usando `window.location`)
- Refactor de shared i18n o user-menu/theme logic compartido
- Otros módulos (invoices, products, dashboard)
- Paginación server-side (sigue client-side)

## Capabilities

### New Capabilities
- `customer-management`: operaciones CRUD + toggleActive sobre clientes, con entidad de dominio propia y datasource desacoplado

### Modified Capabilities
None — pure refactor, no spec-level behavior changes.

## Approach

**Strangler Fig**: construir nueva arquitectura en paralelo, migrar de a piezas.

1. `domain/`: entidad + repositorio (interfaz) + 4 use-cases — cero dependencias externas
2. `data/`: datasource remoto + mapper + impl repositorio (traduce BackendCustomer → CustomerEntity)
3. `i18n/customers.translations.ts`: extraer las 82 strings × 2 idiomas
4. Extraer 3 subcomponentes: `CustomerKpiCards`, `CustomerTable`, `CustomerFormModal`
5. Reducir `CustomersPageComponent` a orchestrator (~120 líneas) con use-cases y subcomponentes
6. Eliminar los 4 métodos de customers de `InvoiceApiService`
7. Verificar: mismo comportamiento visual y funcional

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `domain/` | New (6 files) | Entity, repository interface, 4 use-cases |
| `data/` | New (3 files) | Datasource, mapper, impl repository |
| `presentation/components/` | New (3 dirs) | CustomerTable, CustomerFormModal, CustomerKpiCards |
| `i18n/` | New (1 file) | customers.translations.ts |
| `customers-page.component.ts` | Modified | 696→~120 líneas |
| `customers-page.component.html` | Modified | 430→~80 líneas (template delegado) |
| `invoice-api.service.ts` | Modified | -4 métodos customers |
| `.gitkeep` | Removed | Reemplazado por estructura de carpetas |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Romper binding de signals en el template extraído | Medium | Migración subcomponente por subcomponente, verificar después de cada uno |
| Olvidar un caso de uso del i18n al extraerlo | Low | Extraer primero el archivo de traducciones y comparar coverage antes de modificar el componente |
| Dependencia circular en use-cases | Low | Use-case inyecta interfaz, no impl concreta. Inversión de dependencias vía providers del componente |

## Rollback Plan

1. Revertir `invoice-api.service.ts` a su estado original
2. Revertir `customers-page.component.ts` y `.html` a su estado original
3. Eliminar los nuevos archivos de `domain/`, `data/`, `presentation/components/`, `i18n/`

## Dependencies

- `UiFeedbackService` y `LocaleService` ya existen — se inyectan igual que ahora
- `BillflowModalShell`, `BillflowCombobox` ya existen — se reutilizan en subcomponentes

## Success Criteria

- [ ] `CustomersPageComponent` pasa de 696 a ≤150 líneas
- [ ] InvoiceApiService pierde los 4 métodos de customers
- [ ] La app compila sin errores (`ng build`)
- [ ] Las 3 KPI cards, la tabla, el modal y los filtros funcionan idéntico
- [ ] La entidad `CustomerEntity` no importa nada de Angular ni de infraestructura
