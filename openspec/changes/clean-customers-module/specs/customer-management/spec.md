# Customer Management Specification

## Purpose

Define behavior to preserve during the Clean Architecture refactor. Pure refactor — no capability changes.

## Requirements

### R1: List customers with KPIs

The system MUST load all customers on init and display 3 KPI cards (total, active, inactive). Sort: active first, then by name ascending.

- **Happy path**: GIVEN the page loads WHEN `ngOnInit` completes THEN all customers render sorted active-first AND KPIs match counts
- **API failure**: GIVEN the backend is unreachable WHEN the page loads THEN an error toast appears AND loading clears

### R2: Search and filter customers

The system MUST support text search across all fields (name, lastName, cedula, email, phone) or a specific field. Status filter: all, active, inactive. Filters MUST reset pagination to page 1.

- **Search all fields**: GIVEN 10 customers WHEN typing "juan" THEN only matches in any field appear
- **Field-specific**: GIVEN search field set to "cedula" WHEN typing "171234" THEN only cedula matches appear
- **Status filter**: GIVEN mixed-status customers WHEN selecting "inactive" THEN only inactive rows show

### R3: Paginate results client-side

The system MUST paginate filtered results client-side. Page sizes: 5/10/15/20/30. Visible pages: current ±2.

- **Change page size**: GIVEN 12 filtered customers WHEN selecting 10/page THEN page 1 shows 10, page 2 shows 2
- **Empty results**: GIVEN no matches WHEN filtered list is empty THEN "No customers found" empty state renders

### R4: Create customer

Modal with name*, lastName*, cedula*, phone, address, email. Name strips digits. Cedula: only digits, min 6. Form valid when name + lastName + cedula (≥6 digits) filled.

- **Happy path**: GIVEN valid input WHEN saving THEN POST creates customer, success toast, list reloads
- **Validation**: GIVEN name="" or cedula="123" WHEN clicking save THEN button is disabled

### R5: Edit customer

Same modal with existing data. Cedula is disabled (read-only). PUT on save.

- **Happy path**: GIVEN edit modal with existing data WHEN updating name and saving THEN PUT succeeds, toast shown, list reloads

### R6: Toggle active status

Confirmation dialog before toggling. On confirm, calls toggle endpoint.

- **Deactivate**: GIVEN an active customer WHEN clicking deactivate and confirming THEN deactivate endpoint called, toast shown, list reloads
- **Cancel toggle**: GIVEN confirmation dialog WHEN canceling THEN no API call, dialog closes

### R7: Show customer info

HTML modal with personal details (name, cedula, email, phone, address) and status.

- **View details**: GIVEN a customer in the table WHEN clicking info THEN an HTML modal with full details renders

### R8: Theme and session persistence

Apply stored theme on init (`billflow-theme` localStorage, `prefers-color-scheme` fallback). Persist changes to localStorage + document `dark` class.

### R9: User menu

Toggle on click. Close with 180ms delay on outside clicks via `document:click`. Sign-out with confirmation clears localStorage and redirects to `/auth`.
