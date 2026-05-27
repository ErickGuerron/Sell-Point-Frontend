# Product Management Specification

## Purpose

Define behavior to preserve during the Clean Architecture refactor of the products module. Refactor from a monolithic page component (1392 lines) into domain/data/components layers replicating the clean-customers pattern. Pure refactor with two additions: go-to-page navigation and 100-items/page option.

## Requirements

### R1: List products with server-side pagination

The system MUST display a product table fetched server-side with page sizes 5, 10, 20, 50, 100. Page size 100 is new. A go-to-page numeric input + "Ir" button is new. Existing data: 5/10/20/50.

- **Happy path**: GIVEN products exist WHEN the page loads THEN page 1 renders with default page size and pagination controls
- **Change page size**: GIVEN 120 products WHEN selecting 100/page THEN page 1 shows 100, page 2 shows 20
- **Go to page**: GIVEN 10 pages WHEN typing "5" and clicking "Ir" THEN page 5 loads with current page size
- **Empty results**: GIVEN no products match filters WHEN query returns empty THEN empty state renders with "No products found"

### R2: Display KPI cards

The system MUST show three KPI cards: total products, active count, low stock count. Values come from the same server response as the product list.

- **Happy path**: GIVEN 50 products (40 active, 5 low stock) WHEN the page loads THEN KPIs show 50 / 40 / 5
- **Update on filter**: GIVEN KPIs showing total count WHEN applying a category filter THEN KPIs update to match filtered subset

### R3: Server-side filtering

The system MUST filter products by search query (code/name, debounced 350ms), status (all/active/inactive), and category. Filters reset pagination to page 1. All filtering is server-side. AbortController cancels in-flight requests on filter change.

- **Debounced search**: GIVEN 100 products WHEN typing "PRO-001" in search THEN after 350ms of inactivity the server request fires with the query
- **Combined filters**: GIVEN 80 products WHEN searching "laptop" + status "active" + category "ELECTRONICS" THEN only matching results return
- **Cancel on filter change**: GIVEN a slow search is in-flight WHEN the user changes a filter before it resolves THEN the previous request is aborted and a new one starts
- **Reset pagination**: GIVEN the user is on page 5 WHEN applying a new filter THEN results reset to page 1

### R4: Create product via modal

Modal form with fields: code*, name*, description, salePrice*, costPrice, initialStock*, categoryId. Asterisk = required. POST on submit. Success toast + list refresh.

- **Happy path**: GIVEN valid input WHEN saving THEN product is created, toast shown, table refreshes with new product
- **Duplicate code**: GIVEN an existing product code WHEN submitting THEN inline validation error shows, form stays open
- **Validation**: GIVEN code="" or salePrice="" WHEN clicking save THEN button is disabled with field-level errors

### R5: Edit product via modal

Same modal with existing data pre-filled. All fields editable except code. PUT on save. Toast + list refresh.

- **Happy path**: GIVEN edit modal with product data WHEN updating name and price and saving THEN PUT succeeds, toast shown, table refreshes
- **Cancel edit**: GIVEN dirty form WHEN clicking cancel THEN modal closes without saving

### R6: Toggle active/inactive

Toggle switch per product row. Calls toggle endpoint on change. Toast + row update on success.

- **Activate**: GIVEN an inactive product WHEN toggling ON THEN activate endpoint called, row updates to active state
- **Deactivate**: GIVEN an active product WHEN toggling OFF THEN deactivate endpoint called, row updates to inactive state

### R7: View stock movements modal

Modal showing movement history table: date, type (IN/OUT/ADJUST), quantity, reason, user. Read-only view.

- **Happy path**: GIVEN a product with 10 movements WHEN clicking "Stock" THEN modal opens with full movement history
- **No movements**: GIVEN a newly created product with no movements WHEN clicking "Stock" THEN modal shows empty state "No movements recorded"

### R8: Adjust stock via modal

Within the movements modal, an "Adjust Stock" form with type selector (IN/OUT/ADJUST), quantity input, and reason field. POST on submit. Movement appends to history, KPI updates.

- **Add stock (IN)**: GIVEN stock movements modal open WHEN entering qty 50, type IN, reason "Restock" and submitting THEN stock increases, movement appears in history
- **Remove stock (OUT)**: GIVEN current stock = 30 WHEN entering qty 5, type OUT, reason "Sale" THEN stock decreases to 25
- **Exceeds available (OUT)**: GIVEN current stock = 10 WHEN entering qty 20, type OUT THEN error "Insufficient stock" shown, no adjustment applied
- **Manual adjust**: GIVEN stock is 10 WHEN entering qty 15, type ADJUST THEN stock corrected to 15 regardless of delta

### R9: Internationalization

The system MUST display all product UI strings in English or Spanish based on active locale, sourced from `i18n/products.translations.ts`.

- **Switch locale**: GIVEN viewing products in English WHEN switching to Spanish THEN all product labels, placeholders, toasts, and modal titles update without page reload
- **Missing translation key**: GIVEN a translation key is missing for the active locale WHEN the UI renders THEN the English fallback is displayed

## Non-Functional Requirements

### NF1: Performance (100k+ records)

- All components MUST use OnPush change detection
- All `*ngFor` MUST include a `trackBy` function referencing product ID
- Pagination, search, and filtering MUST be server-side
- Search MUST be debounced at 350ms
- In-flight requests MUST be cancellable via AbortController
- The page size of 100 MUST be supported alongside existing sizes

### NF2: Clean Architecture layering

- `domain/` layer (entities, repository interface, use-cases) MUST NOT import Angular framework code
- `data/` layer (datasource, mapper) MUST handle all HTTP and DTO mapping
- Components MUST be presentational: receive data via inputs, emit events via outputs
- `ProductsPageComponent` MUST be an orchestrator that wires use-cases to components, targeting ≤200 lines

### NF3: Refactor integrity

- Visual and functional behavior MUST be identical to the current implementation (exception: go-to-page and 100/page are additions)
- `product-api.service.ts` MUST be removed after the refactor with no regression
- The build (`ng build`) MUST compile without errors
