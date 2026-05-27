# Design: Clean Products Module

## Technical Approach

**Strangler Fig** sobre los 2 archivos monolíticos (1392 + 313 líneas). Se replica la Clean Architecture del módulo customers ya aprobada: `domain/` puro TypeScript, `data/` con datasource+mapper+impl repository, 4 subcomponentes presentacionales OnPush, i18n extraído, y page component reducido a orchestrator (~180 líneas). Todo el comportamiento se preserva; se agregan go-to-page y page size 100.

## Architecture Decisions

### Decision: Abstract class para repository

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| `abstract class` | Exige `extends`, pero permite `@Injectable()` directo en impl | ✅ Usar — es el patrón de customers, el DI de Angular resuelve con `provide` explícito |
| `interface` | Alias type, no genera runtime token para DI — requiere InjectionToken extra | ❌ Más boilerplate, rompe consistencia con customers |
| Clase concreta directamente | Sin abstracción — no se puede mockear en tests | ❌ Viola Clean Architecture |

### Decision: Signals vs RxJS para estado

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| `signal()`/`computed()` | Reactivo pero sin Observable overhead; ya se usa en toda la app | ✅ Usar — consistente con customers, dashboard, invoices |
| `BehaviorSubject` + `async` pipe | Potente para streams, pero agrega subscriptions/ngOnDestroy | ❌ Overkill para CRUD síncrono con fetch/await |

### Decision: Standalone components

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Standalone | Sin NgModule, imports directos, tree-shakeable | ✅ Usar — ya es el estándar del proyecto |
| NgModule | Agrupa imports, pero agrega archivos + boilerplate | ❌ Rompe consistencia |

### Decision: OnPush + trackBy

Obligatorio por spec: los 4 subcomponentes usan `ChangeDetectionStrategy.OnPush` y `*ngFor` con `trackBy` referenciando `product.id`. Sin esto, 100k+ filas degradan rendimiento.

### Decision: AbortController existente se mantiene

El current `product-api.service.ts` ya usa `AbortController` en `fetchProductsPage`. La migración lo preserva en `ProductRemoteDataSource.fetchProductsPage(signal?)`.

## Data Flow

```
Backend API
    ↓ (HTTP + auth refresh)
ProductRemoteDataSource  ←── DTOs planos (BackendProduct, etc.)
    ↓
ProductMapper            ←── DTO → ProductEntity
    ↓
ProductImplRepository    ←── implementa abstract class, mapea y delega
    ↓
Use Cases                ←── cada uno: get, create, update, toggle, movements, adjust
    ↓
ProductsPageComponent (orchestrator)
    ↓  inputs ↓            ↓ outputs (EventEmitter)
ProductKpiCards  ProductTable  ProductFormModal  ProductMovementsModal
```

El flujo de signals:
1. Page component recibe input de usuario (click, input, combobox)
2. Llama al use case correspondiente (async/await)
3. Use case llama al repository (abstracto)
4. Repository delega en datasource → HTTP
5. Respuesta viaja: DTO → Mapper → Entity → signal.set() → template reactivo

## File Changes

| File | Acción | Description |
|------|--------|-------------|
| `products/.gitkeep` | Delete | Reemplazado por estructura real |
| `products/product-api.service.ts` | Delete | Reemplazado por data layer |
| `products/products-page.component.ts` | Modificar | 1392 → ~180 líneas (orchestrator) |
| `products/domain/product.entity.ts` | Create | Entity + payload types |
| `products/domain/product.repository.ts` | Create | Abstract class repository |
| `products/domain/use-cases/get-products.use-case.ts` | Create | List products with pagination |
| `products/domain/use-cases/create-product.use-case.ts` | Create | Create product |
| `products/domain/use-cases/update-product.use-case.ts` | Create | Update product |
| `products/domain/use-cases/toggle-product-active.use-case.ts` | Create | Toggle active/inactive |
| `products/domain/use-cases/get-product-movements.use-case.ts` | Create | List movements |
| `products/domain/use-cases/adjust-stock.use-case.ts` | Create | Adjust stock |
| `products/data/product-remote-datasource.ts` | Create | HTTP + auth refresh + mock data |
| `products/data/product.mapper.ts` | Create | DTO → Entity mapping |
| `products/data/product-impl.repository.ts` | Create | Implements abstract repository |
| `products/components/product-kpi-cards.component.ts` | Create | 3 KPI cards (total, active, low-stock) |
| `products/components/product-table.component.ts` | Create | Table + pagination + filters |
| `products/components/product-form-modal.component.ts` | Create | Create/edit product modal |
| `products/components/product-movements-modal.component.ts` | Create | Movements history + adjust form |
| `products/i18n/products.translations.ts` | Create | ~85 strings × 2 idiomas (es/en) |

## Interfaces / Contracts

```typescript
// ── domain/product.entity.ts ──
export interface ProductEntity {
  id: string;
  code: string;
  name: string;
  description: string | null;
  salePrice: number;
  costPrice: number;
  currentStock: number;
  categoryId: string;
  categoryName: string;
  isActive: boolean;
}

export interface CreateProductPayload {
  categoryId: string;
  code: string;
  name: string;
  description?: string;
  salePrice: number;
  costPrice: number;
  initialStock?: number;
}

export interface AdjustStockPayload {
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  description: string;
}

export interface StockMovementEntity {
  id: number | string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUST' | 'SALE';
  quantity: number;
  reason: string;
  previousStock: number;
  newStock: number;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ── domain/product.repository.ts ──
export abstract class ProductRepository {
  abstract getProducts(
    q: string, categoryId: string, isActive: string,
    page: number, limit: number, signal?: AbortSignal
  ): Promise<PaginatedResult<ProductEntity>>;

  abstract create(payload: CreateProductPayload): Promise<ProductEntity>;
  abstract update(id: string, payload: UpdateProductPayload): Promise<ProductEntity>;
  abstract toggleActive(id: string, currentActive: boolean): Promise<ProductEntity>;
  abstract getMovements(productId: string, page: number, limit: number): Promise<PaginatedResult<StockMovementEntity>>;
  abstract adjustStock(productId: string, payload: AdjustStockPayload): Promise<StockMovementEntity>;
}
```

## Testing Strategy

| Capa | Qué testear | Approach |
|------|-------------|----------|
| Unit (domain) | Use cases — lógica de negocio pura | Mock repository, test cada caso (postergado) |
| Unit (data) | Mapper — DTO → Entity | Test con fixtures variados (postergado) |
| Unit (data) | Datasource — HTTP y auth refresh | Mock fetch (postergado) |
| Integration | Page component → use cases → repository | Test real con impl (postergado) |
| Visual/E2E | Componentes presentacionales | Verificación manual post-migración (ahora) |

## Migration / Rollout

**Strangler Fig** — 6 fases secuenciales, cada una produce un commit verificable:

| Fase | Qué se hace | Verificación |
|------|-------------|-------------|
| **1 — domain** | Crear `product.entity.ts`, `product.repository.ts`, 6 use-cases | `ng build` compila |
| **2 — data** | Crear datasource (migrar HTTP de `ProductApiService`), mapper, impl repository | `ng build` compila |
| **3 — i18n** | Extraer traducciones de `products-page.component.ts` a `products.translations.ts` | Coverage match de strings |
| **4 — components** | Extraer KPI cards, table, form modal, movements modal como standalone OnPush | `ng build` + ver visual |
| **5 — page** | Reducir `products-page.component.ts` a orchestrator (≈180 líneas), template externalizado | Comportamiento idéntico |
| **6 — cleanup** | Eliminar `product-api.service.ts`, `.gitkeep`. Agregar go-to-page input + page size 100 | `ng build`, verificar paginación nueva |

Cada fase preserva `AbortController`, debounce 350ms, y `OnPush`. Rollback: revertir commit de la fase. `DeliveryStrategy`: chained PR recomendado si el diff total > 400 líneas.

## Open Questions

- [ ] ¿El backend de products ya soporta page size 100? Verificar endpoint.
- [ ] ¿`/products/aggregates` endpoint existe para KPIs activos/low-stock? Si no, calcular client-side del listado paginado (limitación conocida).
- [ ] ¿Go-to-page input va dentro del componente `ProductTableComponent` o en el page shell? Propuesta: dentro del table, junto a la paginación existente.
