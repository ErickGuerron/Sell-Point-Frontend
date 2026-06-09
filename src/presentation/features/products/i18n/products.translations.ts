// ─── Types ──────────────────────────────────────────────────────────────────

export type ProductsLocale = 'es' | 'en';

export interface ProductsCopy {
  moduleLabel: string;
  title: string;
  description: string;
  resultsLabel: string;
  themeLabel: string;
  searchPlaceholder: string;
  newProduct: string;
  code: string;
  name: string;
  descriptionLabel: string;
  salePrice: string;
  costPrice: string;
  stock: string;
  category: string;
  status: string;
  actions: string;
  edit: string;
  deactivate: string;
  activate: string;
  viewHistory: string;
  confirmDeactivateTitle: string;
  confirmDeactivateText: string;
  confirmActivateTitle: string;
  confirmActivateText: string;
  confirmBtn: string;
  cancelBtn: string;
  allStatuses: string;
  active: string;
  inactive: string;
  allCategories: string;
  noProductsTitle: string;
  noProductsText: string;
  showingText: string;
  entriesText: string;
  createdToast: string;
  updatedToast: string;
  toggledActive: string;
  toggledInactive: string;
  sidebarDashboard: string;
  sidebarInvoices: string;
  sidebarCustomers: string;
  sidebarProducts: string;
  sidebarEmployees: string;
  sidebarCategories: string;
  sidebarAudit: string;
  signOut: string;
  settings: string;
  notifications: string;
  languageToggle: string;
  sessionLabel: string;
  showFilters: string;
  hideFilters: string;
  searchStatusPlaceholder: string;
  searchCategoryPlaceholder: string;
  searchFieldPlaceholder: string;
  searchByCodePlaceholder: string;
  searchByNamePlaceholder: string;
  noResultsText: string;
  reloadLabel: string;
  categoriesLabel: string;
  rangeFrom: string;
  rangeOf: string;
  goToLabel: string;
  loadingText: string;
  allLabel: string;
  fromLabel: string;
  toLabel: string;
  modalCreateTitle: string;
  modalCreateSubtitle: string;
  modalEditTitle: string;
  modalEditSubtitle: string;
  modalMovementsTitle: string;
  modalMovementsSubtitle: string;
  save: string;
  saveEdit: string;
  cancel: string;
  // Form fields
  codeLabel: string;
  nameLabel: string;
  salePriceLabel: string;
  costPriceLabel: string;
  initialStockLabel: string;
  priceError: string;
  stockError: string;
  categorySelect: string;
  // Movement list columns
  mvtDate: string;
  mvtType: string;
  mvtQuantity: string;
  mvtReason: string;
  noMovementsTitle: string;
  noMovementsText: string;
  // Stock adjustment form
  stockAdjustTitle: string;
  stockAdjustType: string;
  stockAdjustQty: string;
  stockAdjustReason: string;
  stockAdjustBtn: string;
  stockAdjustSuccess: string;
  stockAdjustError: string;
  stockInsufficient: string;
  stockTypeIn: string;
  stockTypeOut: string;
  stockTypeAdjust: string;
}

// ─── Translations ───────────────────────────────────────────────────────────

export const PRODUCTS_TEXT: Record<ProductsLocale, ProductsCopy> = {
  es: {
    moduleLabel: 'Módulo de Productos',
    title: 'Gestión de Productos',
    description: 'Administrá, editá y controlá el stock e historial de tus productos.',
    resultsLabel: 'resultados',
    themeLabel: 'Tema',
    searchPlaceholder: 'Buscar productos...',
    newProduct: 'Nuevo Producto',
    code: 'Código',
    name: 'Nombre',
    descriptionLabel: 'Descripción',
    salePrice: 'Precio Venta',
    costPrice: 'Precio Costo',
    stock: 'Stock',
    category: 'Categoría',
    status: 'Estado',
    actions: 'Acciones',
    edit: 'Editar',
    deactivate: 'Desactivar',
    activate: 'Activar',
    viewHistory: 'Ver Historial de Stock',
    confirmDeactivateTitle: '¿Desactivar producto?',
    confirmDeactivateText: 'El producto dejará de estar disponible para nuevas ventas.',
    confirmActivateTitle: '¿Activar producto?',
    confirmActivateText: 'El producto volverá a estar disponible para vender.',
    confirmBtn: 'Sí',
    cancelBtn: 'Cancelar',
    allStatuses: 'Todos los estados',
    active: 'Activo',
    inactive: 'Inactivo',
    allCategories: 'Todas las categorías',
    noProductsTitle: 'No hay productos',
    noProductsText: 'Probá con otro filtro o término de búsqueda.',
    showingText: 'Mostrando',
    entriesText: 'registros',
    createdToast: 'Producto creado correctamente',
    updatedToast: 'Producto actualizado correctamente',
    toggledActive: 'Producto activado correctamente',
    toggledInactive: 'Producto desactivado correctamente',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Facturas',
    sidebarCustomers: 'Clientes',
    sidebarProducts: 'Productos',
    sidebarEmployees: 'Empleados',
    sidebarCategories: 'Categorías',
    sidebarAudit: 'Auditoría',
    signOut: 'Cerrar sesión',
    settings: 'Configuración',
    notifications: 'Notificaciones',
    languageToggle: 'English',
    sessionLabel: 'Sesión',
    showFilters: 'Mostrar filtros',
    hideFilters: 'Ocultar filtros',
    searchStatusPlaceholder: 'Buscar estado...',
    searchCategoryPlaceholder: 'Buscar categoría...',
    searchFieldPlaceholder: 'Buscar campo...',
    searchByCodePlaceholder: 'Buscar por código...',
    searchByNamePlaceholder: 'Buscar por nombre...',
    noResultsText: 'Sin resultados',
    reloadLabel: 'Recargar',
    categoriesLabel: 'Categorías',
    rangeFrom: 'a',
    rangeOf: 'de',
    goToLabel: 'Ir a:',
    loadingText: 'Cargando productos...',
    allLabel: 'Todos',
    fromLabel: 'Desde',
    toLabel: 'Hasta',
    modalCreateTitle: 'Nuevo Producto',
    modalCreateSubtitle: 'Completa los datos del nuevo producto',
    modalEditTitle: 'Editar Producto',
    modalEditSubtitle: 'Actualizá los datos del producto',
    modalMovementsTitle: 'Movimientos de Stock',
    modalMovementsSubtitle: 'Historial de variaciones de inventario',
    save: 'Guardar Producto',
    saveEdit: 'Actualizar Producto',
    cancel: 'Cancelar',
    codeLabel: 'Código de Producto',
    nameLabel: 'Nombre del Producto',
    salePriceLabel: 'Precio de Venta',
    costPriceLabel: 'Precio de Costo',
    initialStockLabel: 'Stock Inicial',
    priceError: 'El precio debe ser un número positivo',
    stockError: 'El stock no puede ser negativo',
    categorySelect: 'Seleccionar categoría',
    mvtDate: 'Fecha y Hora',
    mvtType: 'Tipo',
    mvtQuantity: 'Cantidad',
    mvtReason: 'Motivo',
    noMovementsTitle: 'Sin movimientos',
    noMovementsText: 'Este producto no registra ningún movimiento de stock aún.',
    stockAdjustTitle: 'Ajustar Stock',
    stockAdjustType: 'Tipo',
    stockAdjustQty: 'Cantidad',
    stockAdjustReason: 'Motivo',
    stockAdjustBtn: 'Realizar Movimiento',
    stockAdjustSuccess: 'Movimiento registrado correctamente',
    stockAdjustError: 'Error al registrar el movimiento',
    stockInsufficient: 'Stock insuficiente para realizar la salida',
    stockTypeIn: 'Ingreso',
    stockTypeOut: 'Salida',
    stockTypeAdjust: 'Ajuste',
  },
  en: {
    moduleLabel: 'Products Module',
    title: 'Product Management',
    description: 'Manage, edit, and audit the stock and history of your products.',
    resultsLabel: 'results',
    themeLabel: 'Theme',
    searchPlaceholder: 'Search products...',
    newProduct: 'New Product',
    code: 'Code',
    name: 'Name',
    descriptionLabel: 'Description',
    salePrice: 'Sale Price',
    costPrice: 'Cost Price',
    stock: 'Stock',
    category: 'Category',
    status: 'Status',
    actions: 'Actions',
    edit: 'Edit',
    deactivate: 'Deactivate',
    activate: 'Activate',
    viewHistory: 'View Stock History',
    confirmDeactivateTitle: 'Deactivate product?',
    confirmDeactivateText: 'The product will no longer be available for new sales.',
    confirmActivateTitle: 'Activate product?',
    confirmActivateText: 'The product will be available again for sales.',
    confirmBtn: 'Yes',
    cancelBtn: 'Cancel',
    allStatuses: 'All Statuses',
    active: 'Active',
    inactive: 'Inactive',
    allCategories: 'All Categories',
    noProductsTitle: 'No products found',
    noProductsText: 'Try another filter or search term.',
    showingText: 'Showing',
    entriesText: 'entries',
    createdToast: 'Product created successfully',
    updatedToast: 'Product updated successfully',
    toggledActive: 'Product activated successfully',
    toggledInactive: 'Product deactivated successfully',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Invoices',
    sidebarCustomers: 'Customers',
    sidebarProducts: 'Products',
    sidebarEmployees: 'Employees',
    sidebarCategories: 'Categories',
    sidebarAudit: 'Audit',
    signOut: 'Sign out',
    settings: 'Settings',
    notifications: 'Notifications',
    languageToggle: 'Español',
    sessionLabel: 'Session',
    showFilters: 'Show filters',
    hideFilters: 'Hide filters',
    searchStatusPlaceholder: 'Search status...',
    searchCategoryPlaceholder: 'Search category...',
    searchFieldPlaceholder: 'Search field...',
    searchByCodePlaceholder: 'Search by code...',
    searchByNamePlaceholder: 'Search by name...',
    noResultsText: 'No results',
    reloadLabel: 'Reload',
    categoriesLabel: 'Categories',
    rangeFrom: 'to',
    rangeOf: 'of',
    goToLabel: 'Go to:',
    loadingText: 'Loading products...',
    allLabel: 'All',
    fromLabel: 'From',
    toLabel: 'To',
    modalCreateTitle: 'New Product',
    modalCreateSubtitle: 'Fill in the new product details',
    modalEditTitle: 'Edit Product',
    modalEditSubtitle: 'Update the product details',
    modalMovementsTitle: 'Stock Movements',
    modalMovementsSubtitle: 'History of inventory changes',
    save: 'Save Product',
    saveEdit: 'Update Product',
    cancel: 'Cancel',
    codeLabel: 'Product Code',
    nameLabel: 'Product Name',
    salePriceLabel: 'Sale Price',
    costPriceLabel: 'Cost Price',
    initialStockLabel: 'Initial Stock',
    priceError: 'Price must be a positive number',
    stockError: 'Stock cannot be negative',
    categorySelect: 'Select category',
    mvtDate: 'Date & Time',
    mvtType: 'Type',
    mvtQuantity: 'Qty',
    mvtReason: 'Reason',
    noMovementsTitle: 'No movements',
    noMovementsText: 'This product does not have any stock movements yet.',
    stockAdjustTitle: 'Adjust Stock',
    stockAdjustType: 'Type',
    stockAdjustQty: 'Quantity',
    stockAdjustReason: 'Reason',
    stockAdjustBtn: 'Make Movement',
    stockAdjustSuccess: 'Movement recorded successfully',
    stockAdjustError: 'Error recording movement',
    stockInsufficient: 'Insufficient stock for this operation',
    stockTypeIn: 'Inbound',
    stockTypeOut: 'Outbound',
    stockTypeAdjust: 'Adjustment',
  },
};
