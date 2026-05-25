import type { BillflowSidebarItem } from './components/billflow-sidebar.component';

export type BillflowNavigationSection = 'dashboard' | 'invoices' | 'products' | 'customers' | 'employees' | 'categories';

export interface BillflowNavigationLabels {
  dashboard: string;
  invoices: string;
  products: string;
  customers: string;
  employees: string;
  categories?: string;
}

export function buildBillflowSidebarItems(labels: BillflowNavigationLabels, active: BillflowNavigationSection): BillflowSidebarItem[] {
  const items: BillflowSidebarItem[] = [
    { label: labels.dashboard, icon: 'dashboard', href: '/dashboard', active: active === 'dashboard' },
    { label: labels.invoices, icon: 'receipt_long', href: '/invoices', active: active === 'invoices' },
    { label: labels.products, icon: 'inventory_2', href: '/products', active: active === 'products' },
    { label: labels.customers, icon: 'groups', href: '/customers', active: active === 'customers' },
    { label: labels.employees, icon: 'badge', href: '/dashboard', active: active === 'employees' },
  ];

  // Insert categories after products when label is provided
  if (labels.categories) {
    items.splice(3, 0, { label: labels.categories, icon: 'category', href: '/categories', active: active === 'categories' });
  }

  return items;
}
