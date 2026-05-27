# Design: Clean Architecture — Customers Module

## Technical Approach

**Strangler Fig**: construir la nueva arquitectura en paralelo sin tocar el monolito hasta que cada pieza esté lista. Las capas `domain/` y `data/` se crean desde cero. El `CustomersPageComponent` se reduce a orchestrator delegando en subcomponentes y use-cases. Los 4 métodos de customers se eliminan de `InvoiceApiService`. El modal `new-customer-modal` del módulo invoices se actualiza para usar el nuevo use-case.

Las 82 strings i18n se extraen a su propio archivo antes de tocar el componente, para poder verificar coverage sin riesgo.

---

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `CustomerRepository` como abstract class vs `InjectionToken` | Abstract class es puro TS (sin import de Angular) y funciona con `inject()` nativo; InjectionToken obliga a importar `@angular/core` en el contrato del dominio | **Abstract class** — el dominio queda 100% libre de framework |
| Use-cases como clases individuales vs funciones sueltas | Clases permiten DI vía constructor + testabilidad con mocks; funciones requerirían factories | **Clases inyectables** — cada una con un método `execute()`, `@Injectable()` solo a nivel de providers del componente, no `providedIn: 'root'` |
| Paginación en el table component vs orchestrator | Paginación client-side atada a filtros (resetea page a 1 al cambiar filtros) | **Orchestrator** mantiene `page`, `pageSize`, `filteredCustomers`, `paginatedCustomers` — el table component es puramente presentacional |
| Datasource replica fetchWithRefresh vs extraer ApiClient compartido | Replicar es ~20 líneas de duplicación; extraer ApiClient es mejor pero expande scope | **Replicar lógica en datasource** pero sin redirect — lanza `AuthError` y deja que el orchestrator maneje el redirect. Scope mínimo. |

---

## Data Flow

```
CustomersPageComponent (orchestrator)
  │
  ├── ngOnInit() → ListCustomersUseCase.execute()
  │     └── CustomerImplRepository.list()
  │           └── CustomerRemoteDataSource.list()
  │                 └── HTTP GET /customers?limit=200 (con fetchWithAuth)
  │                 └── CustomerMapper.toEntity(BackendCustomer[])
  │
  ├── saveCustomer() → CreateCustomerUseCase.execute() / UpdateCustomerUseCase.execute()
  │     └── CustomerImplRepository.create() / update()
  │           └── CustomerRemoteDataSource.create() / update()
  │                 └── HTTP POST/PUT /customers (con fetchWithAuth)
  │                 └── CustomerMapper.toEntity(BackendCustomer)
  │
  ├── toggleActive() → ToggleCustomerActiveUseCase.execute()
  │     └── CustomerImplRepository.toggleActive()
  │           └── CustomerRemoteDataSource.toggleActive()
  │                 └── HTTP PATCH /customers/:id/activate|deactivate
  │                 └── CustomerMapper.toEntity(BackendCustomer)
  │
  └── Template delegates to:
        ├── CustomerKpiCardsComponent   [@Input() total, active, inactive]
        ├── CustomerTableComponent      [@Input() customers, loading, page, totalPages
        │                                @Output() edit, toggle, showInfo, pageChange]
        └── CustomerFormModalComponent   [@Input() open, editing, locale
                                          @Output() save, close]
```

Auth flow (en datasource):

```
fetchWithAuth(url)
  → GET session de localStorage (accessToken + refreshToken)
  → fetch() con header Authorization
  → si 401 → refreshAccessToken() → si ok, retry fetch()
  → si refresh falla → throw AuthError (NO redirect desde datasource)
```

El orchestrator captura `AuthError` y hace `window.location.replace('/auth')`.

---

## Interfaces / Contracts

### 1. Domain Layer (`customer.entity.ts`)

```typescript
// Entidad de dominio pura — sin imports de Angular ni infraestructura
export interface CustomerEntity {
  id: string;
  firstName: string;
  lastName: string;
  cedula: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
}

export interface CreateCustomerPayload {
  firstName: string;
  lastName: string;
  cedula: string;
  email?: string;
  phone?: string;
  address?: string;
}
```

**Diferencias con `CustomerRowDto` actual:**
| Campo | CustomerRowDto (old) | CustomerEntity (new) | Razón |
|-------|---------------------|---------------------|-------|
| `name` | `string` (flattened) | → `firstName` | Coincide con schema del backend |
| `active` | `boolean` | → `isActive` | Coincide con `BackendCustomer.isActive` |
| `cedula` | `string?` | `string` (required) | El backend siempre la devuelve |
| `email/phone/address` | `string?` | `string \| null` | Backend usa `null`, no `undefined` |

### 2. Domain Repository (`customer.repository.ts`)

```typescript
export abstract class CustomerRepository {
  abstract list(): Promise<CustomerEntity[]>;
  abstract create(payload: CreateCustomerPayload): Promise<CustomerEntity>;
  abstract update(id: string, payload: CreateCustomerPayload): Promise<CustomerEntity>;
  abstract toggleActive(id: string, currentActive: boolean): Promise<CustomerEntity>;
}
```

### 3. Domain Use-Cases

**`list-customers.use-case.ts`**
```typescript
@Injectable()
export class ListCustomersUseCase {
  constructor(private readonly repo: CustomerRepository) {}

  async execute(): Promise<CustomerEntity[]> {
    const customers = await this.repo.list();
    // Sort: active first, then by firstName localeCompare
    return customers.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return a.firstName.localeCompare(b.firstName);
    });
  }
}
```

**`create-customer.use-case.ts`**
```typescript
@Injectable()
export class CreateCustomerUseCase {
  constructor(private readonly repo: CustomerRepository) {}

  async execute(payload: CreateCustomerPayload): Promise<CustomerEntity> {
    return this.repo.create(payload);
  }
}
```

**`update-customer.use-case.ts`**
```typescript
@Injectable()
export class UpdateCustomerUseCase {
  constructor(private readonly repo: CustomerRepository) {}

  async execute(id: string, payload: CreateCustomerPayload): Promise<CustomerEntity> {
    return this.repo.update(id, payload);
  }
}
```

**`toggle-customer-active.use-case.ts`**
```typescript
@Injectable()
export class ToggleCustomerActiveUseCase {
  constructor(private readonly repo: CustomerRepository) {}

  async execute(id: string, currentActive: boolean): Promise<CustomerEntity> {
    return this.repo.toggleActive(id, currentActive);
  }
}
```

### 4. Data Layer

**`customer-remote.datasource.ts`**
```typescript
@Injectable({ providedIn: 'root' })
export class CustomerRemoteDataSource {
  private readonly API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

  async list(): Promise<BackendCustomer[]> {
    const res = await this.fetchWithAuth(`${this.API_BASE}/customers?limit=200`);
    const body = await res.json() as PaginatedResponse<BackendCustomer>;
    return body.data;
  }

  async create(payload: CreateCustomerPayload): Promise<BackendCustomer> {
    const res = await this.fetchWithAuth(`${this.API_BASE}/customers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.json() as Promise<BackendCustomer>;
  }

  async update(id: string, payload: CreateCustomerPayload): Promise<BackendCustomer> {
    const res = await this.fetchWithAuth(`${this.API_BASE}/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.json() as Promise<BackendCustomer>;
  }

  async toggleActive(id: string, currentActive: boolean): Promise<BackendCustomer> {
    const endpoint = currentActive ? 'deactivate' : 'activate';
    const res = await this.fetchWithAuth(`${this.API_BASE}/customers/${id}/${endpoint}`, {
      method: 'PATCH',
    });
    return res.json() as Promise<BackendCustomer>;
  }

  // Mock support (migrated from InvoiceApiService)
  private async fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
    // — replicar fetchWithRefresh de InvoiceApiService —
    // session desde localStorage, Bearer token, refresh en 401, throw AuthError si falla
    // NO hace redirect — lanza error para que la capa superior decida
  }
}

export class AuthError extends Error {
  name = 'AuthError' as const;
}
```

**Backend DTO (internal, en datasource):**
```typescript
interface BackendCustomer {
  id: string;
  firstName: string;
  lastName?: string;
  cedula: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: number | boolean;
  createdAt: string;
  updatedAt: string;
}
```

**`customer.mapper.ts`**
```typescript
export function mapBackendToEntity(b: BackendCustomer): CustomerEntity {
  return {
    id: b.id,
    firstName: b.firstName,
    lastName: b.lastName ?? '',
    cedula: b.cedula,
    email: b.email ?? null,
    phone: b.phone ?? null,
    address: b.address ?? null,
    isActive: b.isActive === true || b.isActive === 1,
  };
}
```

**`customer-impl.repository.ts`**
```typescript
@Injectable()
export class CustomerImplRepository extends CustomerRepository {
  constructor(
    private readonly ds: CustomerRemoteDataSource,
    private readonly mapper: typeof mapBackendToEntity,
  ) {}

  async list(): Promise<CustomerEntity[]> {
    const backends = await this.ds.list();
    return backends.map(mapBackendToEntity);
  }

  async create(payload: CreateCustomerPayload): Promise<CustomerEntity> {
    const backend = await this.ds.create(payload);
    return mapBackendToEntity(backend);
  }

  async update(id: string, payload: CreateCustomerPayload): Promise<CustomerEntity> {
    const backend = await this.ds.update(id, payload);
    return mapBackendToEntity(backend);
  }

  async toggleActive(id: string, currentActive: boolean): Promise<CustomerEntity> {
    const backend = await this.ds.toggleActive(id, currentActive);
    return mapBackendToEntity(backend);
  }
}
```

Nota: el mapper se importa como función directa (no inyectada). Si se necesita testear el repositorio con mapper mockeable, se puede usar un `InjectionToken<typeof mapBackendToEntity>`. Para este diseño, la función directa es suficiente.

### 5. Presentation Layer

**`customers-page.component.ts`** (reducido, ~170 líneas estimadas)

Signals que conserva:
- `loading`, `customers`, `searchQuery`, `statusFilter`, `searchField`, `page`, `pageSize`, `theme`, `userMenuVisible/closing/open`, `displayName`, `userInitials`

Computed que conserva:
- `filteredCustomers`, `totalPages`, `paginatedCustomers`, `visiblePages`, `totalCustomersCount`, `activeCustomersCount`, `inactiveCustomersCount`

Métodos que elimina (delegados):
- `openCreateModal/EditModal` → Componente modal (vía `@Input() open`)
- `saveCustomer` → `CreateCustomerUseCase` / `UpdateCustomerUseCase`
- `toggleActive` → `ToggleCustomerActiveUseCase`
- `resetForm`, `onNameInput`, `onNumericInput` → Componente modal
- `getCustomerInitials`, `getCustomerGradient`, `customerFullName`, `showCustomerInfo` → Componente tabla

Dependencias nuevas:
```typescript
private readonly listCustomers = inject(ListCustomersUseCase);
private readonly createCustomer = inject(CreateCustomerUseCase);
private readonly updateCustomer = inject(UpdateCustomerUseCase);
private readonly toggleActive = inject(ToggleCustomerActiveUseCase);
```

**`customer-kpi-cards.component.ts`**
```typescript
@Component({
  selector: 'billflow-customer-kpi-cards',
  standalone: true,
  template: `...`, // 3 glass cards con inputs
})
export class CustomerKpiCardsComponent {
  @Input({ required: true }) total = 0;
  @Input({ required: true }) active = 0;
  @Input({ required: true }) inactive = 0;
  // locale es opcional si se pasa como input o se usa LocaleService
}
```

**`customer-table.component.ts`**
```typescript
@Component({
  selector: 'billflow-customer-table',
  standalone: true,
  imports: [...],
  templateUrl: './customer-table.component.html',
})
export class CustomerTableComponent {
  @Input({ required: true }) customers: CustomerEntity[] = [];
  @Input({ required: true }) loading = false;
  @Input({ required: true }) page = 1;
  @Input({ required: true }) totalPages = 1;
  @Input({ required: true }) pageSize = 5;
  // locale inputs o inject LocaleService

  @Output() edit = new EventEmitter<CustomerEntity>();
  @Output() toggleActive = new EventEmitter<CustomerEntity>();
  @Output() showInfo = new EventEmitter<CustomerEntity>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  // Helpers (migrados del padre):
  customerFullName(c: CustomerEntity): string;
  getInitials(c: CustomerEntity): string;
  getGradient(c: CustomerEntity): string;
  showInfo(c: CustomerEntity): void; // feedback.alertHtml
}
```

**`customer-form-modal.component.ts`**
```typescript
@Component({
  selector: 'billflow-customer-form-modal',
  standalone: true,
  template: `...`, // inline, similar a new-customer-modal
})
export class CustomerFormModalComponent {
  @Input({ required: true }) open = false;
  @Input() editing: CustomerEntity | null = null;
  @Input() locale: AppLocale = 'es';

  @Output() save = new EventEmitter<CreateCustomerPayload>();
  @Output() close = new EventEmitter<void>();

  // Form signals, sanitization, validation (migrados del padre)
}
```

El formulario NO inyecta use-cases — emite eventos con el payload y el padre decide qué use-case ejecutar.

---

## Dependency Injection Wiring

En el decorador `@Component` del `CustomersPageComponent`:

```typescript
@Component({
  providers: [
    { provide: CustomerRepository, useClass: CustomerImplRepository },
    ListCustomersUseCase,
    CreateCustomerUseCase,
    UpdateCustomerUseCase,
    ToggleCustomerActiveUseCase,
  ],
})
```

```
CustomerRemoteDataSource (@Injectable providedIn: 'root')
     │
     ▼
CustomerImplRepository (providers del componente)
     │
     ▼ (vía abstract class CustomerRepository)
  ├── ListCustomersUseCase
  ├── CreateCustomerUseCase
  ├── UpdateCustomerUseCase
  └── ToggleCustomerActiveUseCase
           │
           ▼
     CustomersPageComponent (inyecta los 4 use-cases)
```

Los subcomponentes (`CustomerKpiCards`, `CustomerTable`, `CustomerFormModal`) son **stateless presentational** — solo reciben `@Input()` y emiten `@Output()`. No inyectan use-cases ni repositorios.

---

## File Changes

| File | Acción | Líneas Est. | Descripción |
|------|--------|-------------|-------------|
| `domain/customer.entity.ts` | Create | 16 | Interfaz `CustomerEntity` + `CreateCustomerPayload` |
| `domain/customer.repository.ts` | Create | 10 | Abstract class `CustomerRepository` |
| `domain/use-cases/list-customers.use-case.ts` | Create | 20 | `ListCustomersUseCase` con sort |
| `domain/use-cases/create-customer.use-case.ts` | Create | 14 | `CreateCustomerUseCase` |
| `domain/use-cases/update-customer.use-case.ts` | Create | 14 | `UpdateCustomerUseCase` |
| `domain/use-cases/toggle-customer-active.use-case.ts` | Create | 14 | `ToggleCustomerActiveUseCase` |
| `data/customer-remote.datasource.ts` | Create | 120 | HTTP + fetchWithAuth + AuthError + mocks |
| `data/customer.mapper.ts` | Create | 18 | `mapBackendToEntity(BackendCustomer): CustomerEntity` |
| `data/customer-impl.repository.ts` | Create | 35 | `CustomerImplRepository extends CustomerRepository` |
| `i18n/customers.translations.ts` | Create | 210 | 82 strings × 2 idiomas (extraídas del monolito) |
| `presentation/components/customer-kpi-cards.component.ts` | Create | 50 | 3 KPI cards como subcomponente |
| `presentation/components/customer-table.component.ts` | Create | 120 | Tabla + paginación + helpers |
| `presentation/components/customer-table.component.html` | Create | 180 | Template de la tabla (extraído del HTML actual) |
| `presentation/components/customer-form-modal.component.ts` | Create | 200 | Modal formulario inline (similar a new-customer-modal) |
| `customers-page.component.ts` | **Modify** | 696→170 | Reducir a orchestrator |
| `customers-page.component.html` | **Modify** | 430→80 | Template con subcomponentes |
| `invoices/invoice-api.service.ts` | **Modify** | 584→500 | Eliminar 4 métodos + mocks de customers |
| `invoices/new-customer-modal.component.ts` | **Modify** | 211→~20 sustituto | Reemplazar con `CreateCustomerUseCase` |
| `.gitkeep` | Delete | — | Reemplazado por estructura real |

**Total**: 13 new, 5 modified, 1 deleted.

---

## Archivo de Traducciones (`i18n/customers.translations.ts`)

```typescript
import { type Signal } from '@angular/core';

export type CustomersLocale = 'es' | 'en';

export interface CustomersCopy {
  moduleLabel: string;
  title: string;
  description: string;
  resultsLabel: string;
  searchPlaceholder: string;
  newCustomer: string;
  name: string;
  lastName: string;
  document: string;
  email: string;
  phone: string;
  status: string;
  actions: string;
  edit: string;
  deactivate: string;
  activate: string;
  confirmDeactivateTitle: string;
  confirmDeactivateText: string;
  confirmActivateTitle: string;
  confirmActivateText: string;
  confirmBtn: string;
  cancelBtn: string;
  allStatuses: string;
  active: string;
  inactive: string;
  noCustomersTitle: string;
  noCustomersText: string;
  showingText: string;
  entriesText: string;
  createdToast: string;
  updatedToast: string;
  toggledActive: string;
  toggledInactive: string;
  modalCreateTitle: string;
  modalCreateSubtitle: string;
  modalEditTitle: string;
  modalEditSubtitle: string;
  save: string;
  saveEdit: string;
  firstNameLabel: string;
  lastNameLabel: string;
  docLabel: string;
  phoneLabel: string;
  emailLabel: string;
  nameError: string;
  cedulaPlaceholder: string;
  phonePlaceholder: string;
  emailPlaceholder: string;
  cancel: string;
}

export const CUSTOMERS_TEXT: Record<CustomersLocale, CustomersCopy> = {
  es: { /* ... mismas 82 strings del monolito actual ... */ },
  en: { /* ... mismas 82 strings del monolito actual ... */ },
};

// Helper function para obtener el objeto de traducciones desde una signal locale
export function customersCopy(locale: Signal<CustomersLocale>): Signal<CustomersCopy> {
  return computed(() => CUSTOMERS_TEXT[locale()]);
}
```

Los subcomponentes reciben el `CustomersCopy` como `@Input()` o llaman a `customersCopy(locale)` según su alcance.

---

## Testing Strategy

| Layer | Qué testear | Cómo |
|-------|-------------|------|
| **Domain** | `CustomerEntity` (es pura data) | Test de tipado mínimo |
| **Use Cases** | Cada use-case ejecuta el método correcto del repo | Mock `CustomerRepository`, verify llamada + return value |
| **Data** | `CustomerMapper` transforma bien Backend→Entity | Test unitario con datos de borde (nulls, isActive como boolean/number) |
| **Data** | Datasource replica fetchWithAuth correctamente | Test de integración con fetch mock |
| **Presentation** | `CustomerTableComponent` renderiza filas/vacío/loading | Angular TestBed, inputs y queries en template |
| **Presentation** | `CustomerFormModalComponent` validación y sanitización | TestBed + signal inputs |
| **Presentation** | `CustomersPageComponent` orquesta correctamente | TestBed con providers mock de use-cases |

No se agregan tests en este cambio (out of scope) pero la arquitectura los habilita.

---

## Migración / Rollout

No se requiere migración de datos ni feature flags.

**Orden de implementación:**
1. `domain/` (entity + repository + use-cases) — cero dependencias del proyecto
2. `data/` (datasource + mapper + impl repository) — depende solo de domain
3. `i18n/customers.translations.ts` — extraer strings, verificar cobertura
4. `CustomerKpiCardsComponent` — extraer del monolito
5. `CustomerTableComponent` — extraer tabla + paginación
6. `CustomerFormModalComponent` — extraer modal
7. Reducir `CustomersPageComponent` (TS + HTML) a orchestrator
8. Eliminar métodos de `InvoiceApiService` + actualizar `new-customer-modal`
9. Borrar `.gitkeep`

**Rollback plan**: revertir `invoice-api.service.ts` y `customers-page.component.*`, eliminar archivos nuevos.

---

## Open Questions

- [ ] **AuthError en datasource**: el redirect a `/auth` va en el orchestrator (`catch(AuthError) → window.location.replace`)? O se deja un handler global?
- [ ] **Convención de carpetas**: `presentation/components/` vs `presentation/components/customers/`? La propuesta usa `components/` dentro de `customers/` pero el `customers-page.component.*` YA está en `customers/`. Confirmar ruta final para no mezclar.
- [ ] **`CustomerKpiCardsComponent`** vale la pena como componente separado (~20 líneas de template) o es mejor dejarlo inline en el HTML del orchestrator?
