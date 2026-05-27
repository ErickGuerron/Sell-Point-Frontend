# Proposal: Clean Products Module

## Intent

1705 líneas (1392 page + 313 API service) acoplan template, i18n, auth-refresh, stock movements y CRUD en un monolito. Impide testear, escalar y mantener. Se replica la Clean Architecture de customers agregando performance para 100k+ registros.

## Scope

### In Scope
- Capa `domain/`: entity, repository interfaz, 5-7 use-cases (list, create, update, toggle-active, list-categories, movements, adjust-stock)
- Capa `data/`: datasource remoto, mapper, impl repository — extraídos de ProductApiService
- 4 subcomponentes: ProductKpiCards, ProductTable, ProductFormModal, StockMovementsModal
- `i18n/products.translations.ts`: ~75 strings × 2 idiomas
- ProductsPageComponent: 1392 → ~180 líneas (orchestrator)
- OnPush CD + trackBy + go-to-page input + confirmar todo filtro es server-side

### Out of Scope
- Tests unitarios (arquitectura los habilita, se postergan)
- Virtual scrolling (postergado hasta medir con datos reales)
- Angular Router (sigue `window.location`)
- Categories module (es separado)
- Shared shell services (ya migrados)

## Capabilities

### New Capabilities
- `product-management`: CRUD de productos + movimientos de stock + categorías, con server-side pagination, filtros combinados y ajuste de inventario

### Modified Capabilities
None — refactor puro, sin cambios de comportamiento spec-level.

## Approach

**Strangler Fig** replicando estructura de customers:

1. `domain/`: entidad + interfaz repositorio + use-cases — cero imports de Angular
2. `data/`: ProductRemoteDataSource (HTTP + auth-refresh), ProductMapper, ProductImplRepository
3. Extraer i18n a `products.translations.ts`
4. Extraer 4 subcomponentes (OnPush + trackBy)
5. Reducir page component a orchestrator con use-cases
6. Eliminar `product-api.service.ts` (reemplazado por data layer)
7. Go-to-page: input numérico + botón "Ir" en paginación
8. Verificar comportamiento idéntico visual y funcionalmente

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `products/domain/` | New (4-5 files) | Entity, repository, 5-7 use-cases |
| `products/data/` | New (3 files) | Datasource, mapper, impl repository |
| `products/components/` | New (4 dirs) | KpiCards, Table, FormModal, MovementsModal |
| `products/i18n/` | New (1 file) | products.translations.ts |
| `products-page.component.ts` | Modified | 1392 → ~180 líneas |
| `product-api.service.ts` | Removed | Reemplazado por data layer |
| `.gitkeep` | Removed | Reemplazado por estructura |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Romper template/signals al extraer | Medium | Migrar 1 subcomponente por vez, verificar después de cada uno |
| Olvidar string i18n | Low | Extraer traducciones primero y comparar coverage |
| 100k+ rows lentos sin virtual scroll | Medium | OnPush + trackBy + server-side cubren; monitorear |

## Rollback Plan

1. Revertir `products-page.component.ts` al original
2. Eliminar `domain/`, `data/`, `components/`, `i18n/`
3. Restaurar `product-api.service.ts`

## Dependencies

- `UiFeedbackService`, `LocaleService`, `SessionService`, `ThemeService` — ya existen y se usan
- `BillflowModalShell`, `BillflowCombobox`, `BillflowPageShell` — ya existentes

## Success Criteria

- [ ] ProductsPageComponent: 1392 → ≤200 líneas
- [ ] ProductApiService eliminado (sin regresión)
- [ ] `ng build` compila sin errores
- [ ] KPIs, tabla, filtros, modales y paginación funcionan idéntico
- [ ] Todos los subcomponentes usan OnPush + trackBy
- [ ] Go-to-page input operativo en UI de paginación
