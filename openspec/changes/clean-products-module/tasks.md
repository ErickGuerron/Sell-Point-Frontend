# Tasks: Clean Products Module

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~3,355 (1,650 new + 1,705 deleted) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 → PR 6 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain layer (entity, repository, 6 use-cases) | PR 1 | ✅ COMPLETED |
| 2 | Data layer (datasource, mapper, impl repository) | PR 2 | Depends on PR 1; migrates HTTP from ProductApiService |
| 3 | i18n extraction (products.translations.ts) | PR 3 | Independent from PR 2; can merge before or after |
| 4 | Components (KpiCards, Table, FormModal, MovementsModal) | PR 4 | Depends on PR 1 + PR 3; OnPush + trackBy |
| 5 | Page orchestrator rewrite (~180 lines) | PR 5 | Depends on PR 2 + PR 4; biggest behavioral bridge |
| 6 | Cleanup + go-to-page + page size 100 | PR 6 | Depends on PR 5; delete old files, add new UX |

## Phase 1: Domain Layer (PR 1 — ~200 lines) ✅ COMPLETED

- [x] 1.1 Create `products/domain/product.entity.ts` — `ProductEntity`, `CreateProductPayload`, `UpdateProductPayload`, `AdjustStockPayload`, `StockMovementEntity`, `PaginatedResult<T>` interfaces
- [x] 1.2 Create `products/domain/product.repository.ts` — abstract class with `getProducts`, `create`, `update`, `toggleActive`, `getMovements`, `adjustStock` methods
- [x] 1.3 Create `products/domain/use-cases/get-products.use-case.ts` — wraps `repository.getProducts` with pagination params
- [x] 1.4 Create `products/domain/use-cases/create-product.use-case.ts` — wraps `repository.create`
- [x] 1.5 Create `products/domain/use-cases/update-product.use-case.ts` — wraps `repository.update`
- [x] 1.6 Create `products/domain/use-cases/toggle-product-active.use-case.ts` — wraps `repository.toggleActive`
- [x] 1.7 Create `products/domain/use-cases/get-product-movements.use-case.ts` — wraps `repository.getMovements`
- [x] 1.8 Create `products/domain/use-cases/adjust-stock.use-case.ts` — wraps `repository.adjustStock`

## Phase 2: Data Layer (PR 2 — ~300 lines)

- [ ] 2.1 Create `products/data/product-remote-datasource.ts` — migrates HTTP calls from `ProductApiService` (fetchProductsPage, createProduct, updateProduct, toggleProductActive, getProductMovements, adjustStock, listCategories), preserves `AbortController` + auth refresh logic
- [ ] 2.2 Create `products/data/product.mapper.ts` — `dtoToProduct(dto)`, `movementDtoToEntity(m)`, `categoryDtoToSelectOption(c)`; preserves normalization (ADJUSTMENT → ADJUST, backend field aliases)
- [ ] 2.3 Create `products/data/product-impl.repository.ts` — `@Injectable()` class extending `ProductRepository`, delegates to datasource + mapper

## Phase 3: i18n Extraction (PR 3 — ~110 lines)

- [ ] 3.1 Create `products/i18n/products.translations.ts` — extract `PRODUCTS_TEXT` Record from page component into standalone file; export `ProductsCopy` interface and `type ProductsLocale`
- [ ] 3.2 Update `products-page.component.ts` — replace inline `PRODUCTS_TEXT` with import from `../i18n/products.translations`

## Phase 4: Components (PR 4 — ~600 lines)

- [ ] 4.1 Create `products/components/product-kpi-cards.component.ts` — standalone, OnPush, `@Input({required:true}) total/active/lowStock: number`, 3 glass-card KPIs; trackBy not needed (no ngFor)
- [ ] 4.2 Create `products/components/product-table.component.ts` — standalone, OnPush, `@Input` products/loading/categories/filters, `@Output` events; includes filter toolbar, table with `trackBy productId`, pagination footer, go-to-page input (wired but noop until PR 6), `*ngFor` + `trackBy`
- [ ] 4.3 Create `products/components/product-form-modal.component.ts` — standalone, OnPush, `@Input` editingProduct/categories, `@Output` save/cancel; form fields with validation, uses `BillflowModalShell`
- [ ] 4.4 Create `products/components/product-movements-modal.component.ts` — standalone, OnPush, `@Input` movements/loading, `@Output` adjustStock/close; movement table + adjust form, movements pagination
- [ ] 4.5 Verify: all 4 components use `ChangeDetectionStrategy.OnPush`; all `*ngFor` have `trackBy` referencing entity ID

## Phase 5: Page Orchestrator (PR 5 — ~430 lines)

- [ ] 5.1 Rewrite `products-page.component.ts` — replace monolithic class with orchestrator: inject use-cases, wire signals to component inputs/outputs, template imports updated to use new subcomponents
- [ ] 5.2 Template: replace inline table/modal HTML with `<product-kpi-cards>`, `<product-table>`, `<product-form-modal>`, `<product-movements-modal>` component selectors
- [ ] 5.3 Wire `ProductTable` outputs (`create`, `edit`, `toggleActive`, `viewMovements`, `search`, `filter`, `pageChange`) to orchestrator methods → use-cases → signal updates
- [ ] 5.4 Preserve: `AbortController` cancellation, debounced search (350ms), KPI updates post-mutation, toast/confirm/alert from `UiFeedbackService`

## Phase 6: Cleanup + Additions (PR 6 — ~100 lines)

- [ ] 6.1 Delete `products/product-api.service.ts` — fully replaced by data layer
- [ ] 6.2 Delete `products/.gitkeep` — replaced by real file structure
- [ ] 6.3 Add `<option value="100">100</option>` to page size selector in `ProductTableComponent`
- [ ] 6.4 Add go-to-page input + "Ir" button in pagination footer (wired in PR 4, now functional): numeric input bound to local signal + button calls `goToPage(Number(input))`
- [ ] 6.5 Run `ng build` — verify zero compilation errors
- [ ] 6.6 Manual verification: KPIs render, table paginates, search debounces, modals open/save, toggle works, movements load, adjust stock works, locale switches
