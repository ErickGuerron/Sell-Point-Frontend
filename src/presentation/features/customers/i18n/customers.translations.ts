import { type Signal, computed } from '@angular/core';

// ─── Types ──────────────────────────────────────────────────────────────────

export type CustomersLocale = 'es' | 'en';

export interface CustomersCopy {
  moduleLabel: string;
  title: string;
  description: string;
  resultsLabel: string;
  searchPlaceholder: string;
  newCustomer: string;
  name: string;
  lastName: string;
  document: string;
  email: string;
  phone: string;
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
  allStatuses: string;
  active: string;
  inactive: string;
  noCustomersTitle: string;
  noCustomersText: string;
  showingText: string;
  entriesText: string;
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
  firstNameLabel: string;
  lastNameLabel: string;
  docLabel: string;
  phoneLabel: string;
  emailLabel: string;
  nameError: string;
  cedulaPlaceholder: string;
  phonePlaceholder: string;
  emailPlaceholder: string;
  cancel: string;
}

// ─── Translations ───────────────────────────────────────────────────────────

export const CUSTOMERS_TEXT: Record<CustomersLocale, CustomersCopy> = {
  es: {
    moduleLabel: 'Módulo de Clientes',
    title: 'Gestión de Clientes',
    description: 'Administrá, editá y controlá el estado de tus clientes.',
    resultsLabel: 'resultados',
    searchPlaceholder: 'Buscar clientes...',
    newCustomer: 'Nuevo Cliente',
    name: 'Nombre',
    lastName: 'Apellido',
    document: 'Documento',
    email: 'Email',
    phone: 'Teléfono',
    status: 'Estado',
    actions: 'Acciones',
    edit: 'Editar',
    deactivate: 'Desactivar',
    activate: 'Activar',
    confirmDeactivateTitle: '¿Desactivar cliente?',
    confirmDeactivateText: 'El cliente dejará de estar disponible para nuevas operaciones, pero el historial se conserva.',
    confirmActivateTitle: '¿Activar cliente?',
    confirmActivateText: 'El cliente volverá a estar disponible para nuevas operaciones.',
    confirmBtn: 'Sí',
    cancelBtn: 'Cancelar',
    allStatuses: 'Todos los estados',
    active: 'Activo',
    inactive: 'Inactivo',
    noCustomersTitle: 'No hay clientes',
    noCustomersText: 'Probá con otro filtro o término de búsqueda.',
    showingText: 'Mostrando',
    entriesText: 'registros',
    createdToast: 'Cliente creado correctamente',
    updatedToast: 'Cliente actualizado correctamente',
    toggledActive: 'Cliente activado correctamente',
    toggledInactive: 'Cliente desactivado correctamente',
    modalCreateTitle: 'Nuevo Cliente',
    modalCreateSubtitle: 'Completá los datos del nuevo cliente',
    modalEditTitle: 'Editar Cliente',
    modalEditSubtitle: 'Actualizá los datos del cliente',
    save: 'Guardar Cliente',
    saveEdit: 'Actualizar Cliente',
    firstNameLabel: 'Nombre',
    lastNameLabel: 'Apellido',
    docLabel: 'Cédula',
    phoneLabel: 'Teléfono',
    emailLabel: 'Email',
    nameError: 'Los nombres no deben contener números',
    cedulaPlaceholder: 'Ej: 1234567',
    phonePlaceholder: 'Ej: +595 981 123456',
    emailPlaceholder: 'Ej: cliente@ejemplo.com',
    cancel: 'Cancelar',
  },
  en: {
    moduleLabel: 'Customers Module',
    title: 'Customer Management',
    description: 'Manage, edit, and control your customers.',
    resultsLabel: 'results',
    searchPlaceholder: 'Search customers...',
    newCustomer: 'New Customer',
    name: 'Name',
    lastName: 'Last Name',
    document: 'Document ID',
    email: 'Email',
    phone: 'Phone',
    status: 'Status',
    actions: 'Actions',
    edit: 'Edit',
    deactivate: 'Deactivate',
    activate: 'Activate',
    confirmDeactivateTitle: 'Deactivate customer?',
    confirmDeactivateText: 'The customer will no longer be available for new operations, but history is preserved.',
    confirmActivateTitle: 'Activate customer?',
    confirmActivateText: 'The customer will be available again for new operations.',
    confirmBtn: 'Yes',
    cancelBtn: 'Cancel',
    allStatuses: 'All Statuses',
    active: 'Active',
    inactive: 'Inactive',
    noCustomersTitle: 'No customers found',
    noCustomersText: 'Try another filter or search term.',
    showingText: 'Showing',
    entriesText: 'entries',
    createdToast: 'Customer created successfully',
    updatedToast: 'Customer updated successfully',
    toggledActive: 'Customer activated successfully',
    toggledInactive: 'Customer deactivated successfully',
    modalCreateTitle: 'New Customer',
    modalCreateSubtitle: 'Fill in the new customer details',
    modalEditTitle: 'Edit Customer',
    modalEditSubtitle: 'Update the customer details',
    save: 'Save Customer',
    saveEdit: 'Update Customer',
    firstNameLabel: 'First Name',
    lastNameLabel: 'Last Name',
    docLabel: 'ID Number',
    phoneLabel: 'Phone',
    emailLabel: 'Email',
    nameError: 'Names must not contain numbers',
    cedulaPlaceholder: 'e.g. 1234567',
    phonePlaceholder: 'e.g. +1 555 123 4567',
    emailPlaceholder: 'e.g. john@example.com',
    cancel: 'Cancel',
  },
};

// ─── Helper ─────────────────────────────────────────────────────────────────

export function customersCopy(locale: Signal<CustomersLocale>): Signal<CustomersCopy> {
  return computed(() => CUSTOMERS_TEXT[locale()]);
}
