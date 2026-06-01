# `GET /products` — Endpoint shape (Network-tab capture)

> **Status**: ⚠️ **TODO — placeholder for human capture**
>
> This file was generated as part of PR1 of the `M6-M8` change. Because the
> `/products` endpoint's canonical price field name is the load-bearing
> assumption behind the R2a fix (commit `fix(dashboard): read real product
> price (R2a targeted fix)`), a real capture from the dev environment is
> required BEFORE this PR is approved. The placeholder below uses
> `salePrice` as the **assumed** canonical field name per the conversation
> history with the user.
>
> **Action required from the human reviewer**:
> 1. Open the dev environment (e.g. `npm run dev`).
> 2. Open `/dashboard` in the browser.
> 3. Open DevTools → Network tab → filter by `products`.
> 4. Click on the `GET /products?page=1&limit=N` request.
> 5. In the **Response** tab, copy the first row of the `data` array.
> 6. Replace the "Expected JSON shape" block below with the captured object.
> 7. If the canonical field name is anything OTHER than `salePrice`,
>    update BOTH surgical fixes that depend on it:
>    - `src/presentation/features/dashboard/dashboard-api.service.ts:87`
>    - `src/presentation/shared/ssr-page-data.ts:188`
>    See design §1.2 for the exact line-level change.
> 8. Commit the updated file on top of this branch with a message like
>    `docs(m6-m8): confirm products endpoint field name`.
>
> **Why a placeholder, not a real capture?** The sdd-apply sub-agent that
> authored this commit does not have a browser; the executor cannot capture
> live network traffic. The capture step is a reviewer responsibility, by
> design — the R2a decision is the kind of thing that must be confirmed
> against a real backend response, not a hand-written guess.

## Canonical field name (assumed, requires verification)

| Field | Assumed canonical | Confidence | Notes |
|-------|-------------------|------------|-------|
| Price | `salePrice` | medium | Per the user conversation history. The current CSR path reads `unitPrice: Number(p.salePrice)` at `dashboard-api.service.ts:87`, so if the backend emits `salePrice`, the CSR side works. The SSR side at `ssr-page-data.ts:188` reads `unitPrice ?? price ?? 0` on the **raw** response, so it always returns `0` until the field is `salePrice` (or whichever canonical name is used). |

## Expected JSON shape (sample, per user)

```json
{
  "id": "p-001",
  "code": "PROD-001",
  "name": "Cuaderno A4",
  "salePrice": 1.5,
  "costPrice": 1,
  "currentStock": 10,
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

> **Verify**: open the Network tab and confirm:
> - The `salePrice` field is at the top level of each product object (not nested under `price` or `pricing`).
> - The value is numeric (not a string like `"1.50"`).
> - The field name matches exactly the case shown above.

## TODO checklist for the human reviewer

- [ ] Open the dev environment and load `/dashboard`.
- [ ] Capture the `GET /products?page=1&limit=N` response in the Network tab.
- [ ] Replace the "Expected JSON shape" block above with the real first row.
- [ ] If the field name is `salePrice` (matches the assumption): no code change is needed; just commit the updated markdown.
- [ ] If the field name is `price`, `unitPrice`, `costPrice`, or `sellingPrice`:
  - Update `src/presentation/features/dashboard/dashboard-api.service.ts:87` — change `Number(p.salePrice)` to `Number(p.<actualField>)`.
  - Update `src/presentation/shared/ssr-page-data.ts:188` — change `product.salePrice` to `product.<actualField>`.
  - The tripwire at the top of `mapProduct` in `dashboard-page.component.ts:789` should be updated to log the new field name.
- [ ] Run `npm run build` and confirm it passes.
- [ ] Load `/dashboard` in the browser and confirm the "Productos" card shows a real price (NOT `$0.00`).
- [ ] `curl http://localhost:4321/dashboard` and confirm the initial HTML contains the real price.
- [ ] Commit the updated file on top of this branch.

## Related

- Design: `openspec/changes/M6-M8/design.md` §1.2 (R2a — the two surgical hops).
- Spec: `openspec/changes/M6-M8/specs/dashboard-data-mapping.md` R2.
- Task: `openspec/changes/M6-M8/tasks.md` T1.2.1.
- Tripwire: `src/presentation/features/dashboard/dashboard-page.component.ts:789-798` — dev-only `console.warn` fires if the rendered price is `0` or `NaN` and the source row had a non-zero canonical field. Enable in DevTools: `window.__BILLFLOW_DASHBOARD_DEBUG__ = true`.
