export type LotsLocale = 'es' | 'en';

export interface LotsCopy {
  moduleLabel: string;
  title: string;
  description: string;
  resultsLabel: string;
  themeLabel: string;
  backToProducts: string;
  reloadLabel: string;
  searchPlaceholder: string;
  searchByCodePlaceholder: string;
  loadingText: string;
  emptyTitle: string;
  emptyText: string;
  errorTitle: string;
  errorText: string;
  lotsCountLabel: string;
  availableUnitsLabel: string;
  receivedUnitsLabel: string;
  expiredLotsLabel: string;
  lotCode: string;
  receivedQty: string;
  availableQty: string;
  unitCost: string;
  profit: string;
  receivedAt: string;
  expiresAt: string;
  status: string;
  active: string;
  depleted: string;
  expired: string;
  sidebarDashboard: string;
  sidebarInvoices: string;
  sidebarCustomers: string;
  sidebarProducts: string;
  sidebarEmployees: string;
  sidebarCategories: string;
  signOut: string;
  settings: string;
  notifications: string;
  languageToggle: string;
  sessionLabel: string;
}

export const LOTS_TEXT: Record<LotsLocale, LotsCopy> = {
  es: {
    moduleLabel: 'Lotes de Producto',
    title: 'Gestión de Lotes',
    description: 'Consultá los lotes cargados para el producto seleccionado.',
    resultsLabel: 'lotes',
    themeLabel: 'Tema',
    backToProducts: 'Volver a Productos',
    reloadLabel: 'Recargar',
    searchPlaceholder: 'Buscar lotes...',
    searchByCodePlaceholder: 'Buscar por código de lote...',
    loadingText: 'Cargando lotes...',
    emptyTitle: 'No hay lotes',
    emptyText: 'Este producto todavía no tiene lotes cargados.',
    errorTitle: 'No se pudo cargar el producto',
    errorText: 'Revisá el identificador o volvé a la lista de productos.',
    lotsCountLabel: 'Lotes',
    availableUnitsLabel: 'Unidades disponibles',
    receivedUnitsLabel: 'Unidades recibidas',
    expiredLotsLabel: 'Lotes vencidos',
    lotCode: 'Lote',
    receivedQty: 'Recibidas',
    availableQty: 'Disponibles',
    unitCost: 'Costo',
    profit: 'Ganancia',
    receivedAt: 'Recepción',
    expiresAt: 'Vencimiento',
    status: 'Estado',
    active: 'Disponible',
    depleted: 'Agotado',
    expired: 'Vencido',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Facturas',
    sidebarCustomers: 'Clientes',
    sidebarProducts: 'Productos',
    sidebarEmployees: 'Empleados',
    sidebarCategories: 'Categorías',
    signOut: 'Cerrar sesión',
    settings: 'Configuración',
    notifications: 'Notificaciones',
    languageToggle: 'English',
    sessionLabel: 'Sesión',
  },
  en: {
    moduleLabel: 'Product Lots',
    title: 'Lots Management',
    description: 'Review the lots loaded for the selected product.',
    resultsLabel: 'lots',
    themeLabel: 'Theme',
    backToProducts: 'Back to Products',
    reloadLabel: 'Reload',
    searchPlaceholder: 'Search lots...',
    searchByCodePlaceholder: 'Search by lot code...',
    loadingText: 'Loading lots...',
    emptyTitle: 'No lots found',
    emptyText: 'This product does not have lots loaded yet.',
    errorTitle: 'Could not load product',
    errorText: 'Check the identifier or go back to the products list.',
    lotsCountLabel: 'Lots',
    availableUnitsLabel: 'Available units',
    receivedUnitsLabel: 'Received units',
    expiredLotsLabel: 'Expired lots',
    lotCode: 'Lot',
    receivedQty: 'Received',
    availableQty: 'Available',
    unitCost: 'Cost',
    profit: 'Profit',
    receivedAt: 'Received',
    expiresAt: 'Expires',
    status: 'Status',
    active: 'Available',
    depleted: 'Depleted',
    expired: 'Expired',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Invoices',
    sidebarCustomers: 'Customers',
    sidebarProducts: 'Products',
    sidebarEmployees: 'Employees',
    sidebarCategories: 'Categories',
    signOut: 'Sign out',
    settings: 'Settings',
    notifications: 'Notifications',
    languageToggle: 'Español',
    sessionLabel: 'Session',
  },
};
