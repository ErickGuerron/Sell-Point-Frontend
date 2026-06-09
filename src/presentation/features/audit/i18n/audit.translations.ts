// ─── Types ──────────────────────────────────────────────────────────────────

export type AuditLocale = 'es' | 'en';

export interface AuditCopy {
  moduleLabel: string;
  title: string;
  description: string;
  resultsLabel: string;
  entriesText: string;
  tableName: string;
  recordId: string;
  action: string;
  user: string;
  role: string;
  changedColumns: string;
  date: string;
  actions: string;
  noEntriesTitle: string;
  noEntriesText: string;
  loadingText: string;
  showText: string;
  toText: string;
  ofText: string;
  pageText: string;
  actionsToday: string;
  activeUsers: string;
  topModifiedTable: string;
  detailTitle: string;
  detailSubtitle: string;
  metadataLabel: string;
  changesLabel: string;
  oldValue: string;
  newValue: string;
  noChanges: string;
  columnLabel: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  allTables: string;
  allActions: string;
  searchUserPlaceholder: string;
  filterTablePlaceholder: string;
  filterActionPlaceholder: string;
  fromLabel: string;
  toLabel: string;
  closeLabel: string;
  sidebarDashboard: string;
  sidebarInvoices: string;
  sidebarProducts: string;
  sidebarCustomers: string;
  sidebarEmployees: string;
  sidebarAudit: string;
  sidebarCategories: string;
  signOut: string;
  settings: string;
  notifications: string;
  languageToggle: string;
  sessionLabel: string;
  errorLoading: string;
  errorLoadingSummary: string;
  retryLabel: string;
}

// ─── Translations ───────────────────────────────────────────────────────────

export const AUDIT_TEXT: Record<AuditLocale, AuditCopy> = {
  es: {
    moduleLabel: 'Módulo de Auditoría',
    title: 'Registro de Auditoría',
    description: 'Visualizá y filtrá todas las operaciones realizadas en el sistema.',
    resultsLabel: 'resultados',
    entriesText: 'registros',
    tableName: 'Tabla',
    recordId: 'ID Registro',
    action: 'Acción',
    user: 'Usuario',
    role: 'Rol',
    changedColumns: 'Columnas modificadas',
    date: 'Fecha/Hora',
    actions: 'Acciones',
    noEntriesTitle: 'No hay entradas de auditoría',
    noEntriesText: 'Probá con otro filtro o rango de fechas.',
    loadingText: 'Cargando registro de auditoría...',
    showText: 'Mostrando',
    toText: 'a',
    ofText: 'de',
    pageText: 'pág.',
    actionsToday: 'Acciones Hoy',
    activeUsers: 'Usuarios Activos',
    topModifiedTable: 'Tabla Más Modificada',
    detailTitle: 'Detalle de Auditoría',
    detailSubtitle: 'Información completa de la entrada de auditoría',
    metadataLabel: 'Metadatos',
    changesLabel: 'Cambios',
    oldValue: 'Valor Anterior',
    newValue: 'Valor Nuevo',
    noChanges: 'Sin cambios de datos',
    columnLabel: 'Columna',
    ipAddress: 'Dirección IP',
    userAgent: 'User Agent',
    timestamp: 'Fecha/Hora',
    allTables: 'Todas las tablas',
    allActions: 'Todas las acciones',
    searchUserPlaceholder: 'Buscar usuario...',
    filterTablePlaceholder: 'Filtrar por tabla',
    filterActionPlaceholder: 'Filtrar por acción',
    fromLabel: 'Desde',
    toLabel: 'Hasta',
    closeLabel: 'Cerrar',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Facturas',
    sidebarProducts: 'Productos',
    sidebarCustomers: 'Clientes',
    sidebarEmployees: 'Empleados',
    sidebarAudit: 'Auditoría',
    sidebarCategories: 'Categorías',
    signOut: 'Cerrar sesión',
    settings: 'Configuración',
    notifications: 'Notificaciones',
    languageToggle: 'English',
    sessionLabel: 'Sesión',
    errorLoading: 'No se pudieron cargar los registros de auditoría',
    errorLoadingSummary: 'No se pudieron cargar las estadísticas de auditoría',
    retryLabel: 'Reintentar',
  },
  en: {
    moduleLabel: 'Audit Module',
    title: 'Audit Log',
    description: 'View and filter all system operations.',
    resultsLabel: 'results',
    entriesText: 'entries',
    tableName: 'Table',
    recordId: 'Record ID',
    action: 'Action',
    user: 'User',
    role: 'Role',
    changedColumns: 'Changed Columns',
    date: 'Date/Time',
    actions: 'Actions',
    noEntriesTitle: 'No audit entries found',
    noEntriesText: 'Try another filter or date range.',
    loadingText: 'Loading audit log...',
    showText: 'Showing',
    toText: 'to',
    ofText: 'of',
    pageText: 'page',
    actionsToday: 'Actions Today',
    activeUsers: 'Active Users',
    topModifiedTable: 'Most Modified Table',
    detailTitle: 'Audit Detail',
    detailSubtitle: 'Full audit entry information',
    metadataLabel: 'Metadata',
    changesLabel: 'Changes',
    oldValue: 'Old Value',
    newValue: 'New Value',
    noChanges: 'No data changes',
    columnLabel: 'Column',
    ipAddress: 'IP Address',
    userAgent: 'User Agent',
    timestamp: 'Timestamp',
    allTables: 'All Tables',
    allActions: 'All Actions',
    searchUserPlaceholder: 'Search user...',
    filterTablePlaceholder: 'Filter by table',
    filterActionPlaceholder: 'Filter by action',
    fromLabel: 'From',
    toLabel: 'To',
    closeLabel: 'Close',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Invoices',
    sidebarProducts: 'Products',
    sidebarCustomers: 'Customers',
    sidebarEmployees: 'Employees',
    sidebarAudit: 'Audit',
    sidebarCategories: 'Categories',
    signOut: 'Sign out',
    settings: 'Settings',
    notifications: 'Notifications',
    languageToggle: 'Español',
    sessionLabel: 'Session',
    errorLoading: 'Could not load audit entries',
    errorLoadingSummary: 'Could not load audit statistics',
    retryLabel: 'Retry',
  },
};
