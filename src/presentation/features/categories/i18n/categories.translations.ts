export type CategoriesLocale = 'es' | 'en';

export interface CategoriesCopy {
  moduleLabel: string;
  title: string;
  description: string;
  resultsLabel: string;
  themeLabel: string;
  searchPlaceholder: string;
  newCategory: string;
  name: string;
  descriptionLabel: string;
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
  noCategoriesTitle: string;
  noCategoriesText: string;
  showingText: string;
  entriesText: string;
  totalLabel: string;
  activeLabel: string;
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
  cancel: string;
  nameLabel: string;
  namePlaceholder: string;
  descriptionPlaceholder: string;
  goBackToProducts: string;
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

export const CATEGORIES_TEXT: Record<CategoriesLocale, CategoriesCopy> = {
  es: {
    moduleLabel: 'Módulo de Categorías',
    title: 'Gestión de Categorías',
    description: 'Administrá y editá las categorías de tus productos.',
    resultsLabel: 'resultados',
    themeLabel: 'Tema',
    searchPlaceholder: 'Buscar categorías...',
    newCategory: 'Nueva Categoría',
    name: 'Nombre',
    descriptionLabel: 'Descripción',
    status: 'Estado',
    actions: 'Acciones',
    edit: 'Editar',
    deactivate: 'Desactivar',
    activate: 'Activar',
    confirmDeactivateTitle: '¿Desactivar categoría?',
    confirmDeactivateText: 'La categoría dejará de estar disponible para nuevos productos.',
    confirmActivateTitle: '¿Activar categoría?',
    confirmActivateText: 'La categoría volverá a estar disponible para usar.',
    confirmBtn: 'Sí, confirmar',
    cancelBtn: 'Cancelar',
    noCategoriesTitle: 'No hay categorías',
    noCategoriesText: 'Probá con otro filtro o término de búsqueda.',
    showingText: 'Mostrando',
    entriesText: 'registros',
    totalLabel: 'Total Categorías',
    activeLabel: 'Activas',
    createdToast: 'Categoría creada correctamente',
    updatedToast: 'Categoría actualizada correctamente',
    toggledActive: 'Categoría activada correctamente',
    toggledInactive: 'Categoría desactivada correctamente',
    modalCreateTitle: 'Nueva Categoría',
    modalCreateSubtitle: 'Completá los datos de la nueva categoría',
    modalEditTitle: 'Editar Categoría',
    modalEditSubtitle: 'Actualizá los datos de la categoría',
    save: 'Guardar Categoría',
    saveEdit: 'Actualizar Categoría',
    cancel: 'Cancelar',
    nameLabel: 'Nombre de la Categoría',
    namePlaceholder: 'Ej: Bebidas',
    descriptionPlaceholder: 'Ej: Bebidas gaseosas, aguas y jugos.',
    goBackToProducts: 'Volver a Productos',
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
    moduleLabel: 'Categories Module',
    title: 'Category Management',
    description: 'Manage and edit your product categories.',
    resultsLabel: 'results',
    themeLabel: 'Theme',
    searchPlaceholder: 'Search categories...',
    newCategory: 'New Category',
    name: 'Name',
    descriptionLabel: 'Description',
    status: 'Status',
    actions: 'Actions',
    edit: 'Edit',
    deactivate: 'Deactivate',
    activate: 'Activate',
    confirmDeactivateTitle: 'Deactivate category?',
    confirmDeactivateText: 'The category will no longer be available for new products.',
    confirmActivateTitle: 'Activate category?',
    confirmActivateText: 'The category will be available again for products.',
    confirmBtn: 'Yes, confirm',
    cancelBtn: 'Cancel',
    noCategoriesTitle: 'No categories found',
    noCategoriesText: 'Try another filter or search term.',
    showingText: 'Showing',
    entriesText: 'entries',
    totalLabel: 'Total Categories',
    activeLabel: 'Active',
    createdToast: 'Category created successfully',
    updatedToast: 'Category updated successfully',
    toggledActive: 'Category activated successfully',
    toggledInactive: 'Category deactivated successfully',
    modalCreateTitle: 'New Category',
    modalCreateSubtitle: 'Fill in the new category details',
    modalEditTitle: 'Edit Category',
    modalEditSubtitle: 'Update the category details',
    save: 'Save Category',
    saveEdit: 'Update Category',
    cancel: 'Cancel',
    nameLabel: 'Category Name',
    namePlaceholder: 'E.g. Beverages',
    descriptionPlaceholder: 'E.g. Sodas, waters and juices.',
    goBackToProducts: 'Back to Products',
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
