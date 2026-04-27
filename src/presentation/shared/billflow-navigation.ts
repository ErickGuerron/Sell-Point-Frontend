import type { BillflowSidebarItem } from './components/billflow-sidebar.component';

export type BillflowNavigationSection = 'dashboard' | 'invoices' | 'products' | 'customers' | 'employees';

export interface BillflowNavigationLabels {
  dashboard: string;
  invoices: string;
  products: string;
  customers: string;
  employees: string;
}

export function buildBillflowSidebarItems(labels: BillflowNavigationLabels, active: BillflowNavigationSection): BillflowSidebarItem[] {
  return [
    { label: labels.dashboard, icon: 'dashboard', href: '/dashboard', active: active === 'dashboard' },
    { label: labels.invoices, icon: 'receipt_long', href: '/invoices', active: active === 'invoices' },
    { label: labels.products, icon: 'inventory_2', href: '/dashboard', active: active === 'products' },
    { label: labels.customers, icon: 'groups', href: '/dashboard', active: active === 'customers' },
    { label: labels.employees, icon: 'badge', href: '/dashboard', active: active === 'employees' },
  ];
}
