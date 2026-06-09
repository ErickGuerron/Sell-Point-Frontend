import type { BillflowSidebarItem } from './components/billflow-sidebar.component';
import { PermissionsService, PERMISSIONS } from './services/permissions.service';

export type BillflowNavigationSection = 'dashboard' | 'invoices' | 'products' | 'customers' | 'employees' | 'categories' | 'audit';

export interface BillflowNavigationLabels {
  dashboard: string;
  invoices: string;
  products: string;
  customers: string;
  employees: string;
  categories?: string;
  audit?: string;
}

/**
 * Builds sidebar navigation items filtered by the current user's role.
 * ADMIN sees all items including "Empleados". Other roles don't see "Empleados".
 *
 * @param labels - Localized label strings for each nav item
 * @param active - Which section should be marked as active
 * @param permissions - Optional PermissionsService instance. If not provided,
 *                      all items are shown (legacy behavior for backward compatibility).
 */
export function buildBillflowSidebarItems(
  labels: BillflowNavigationLabels,
  active: BillflowNavigationSection,
  permissions?: PermissionsService,
): BillflowSidebarItem[] {
  const items: BillflowSidebarItem[] = [
    { label: labels.dashboard, icon: 'dashboard', href: '/dashboard', active: active === 'dashboard' },
    { label: labels.invoices, icon: 'receipt_long', href: '/invoices', active: active === 'invoices' },
    { label: labels.products, icon: 'inventory_2', href: '/products', active: active === 'products' },
    { label: labels.customers, icon: 'groups', href: '/customers', active: active === 'customers' },
  ];

  // Only ADMIN can see the Employees section
  if (!permissions || permissions.hasPermission(PERMISSIONS.EMPLOYEES_READ)) {
    items.push({ label: labels.employees, icon: 'badge', href: '/employees', active: active === 'employees' });
  }

  // Categories is visible to all roles that can read categories
  // If no permissions service provided, show categories (legacy behavior)
  if (labels.categories && (!permissions || permissions.hasPermission(PERMISSIONS.CATEGORIES_READ))) {
    const insertIndex = items.findIndex((i) => i.href === '/products') + 1;
    items.splice(insertIndex, 0, { label: labels.categories, icon: 'category', href: '/categories', active: active === 'categories' });
  }

  // Audit is ADMIN-only — visible on every page if the user has AUDIT_LOGS_READ
  if (!permissions || permissions.hasPermission(PERMISSIONS.AUDIT_LOGS_READ)) {
    items.push({ label: labels.audit ?? 'Auditoría', icon: 'assignment', href: '/audit', active: active === 'audit' });
  }

  return items;
}
