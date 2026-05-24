import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, inject, signal, HostListener, ElementRef, ViewChild } from '@angular/core';
import type { OnInit } from '@angular/core';
import { InvoiceApiService, type CustomerRowDto, type CreateCustomerPayload } from '../invoices/invoice-api.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { LocaleService } from '../../shared/services/locale.service';
import { type BillflowSidebarItem } from '../../shared/components/billflow-sidebar.component';
import { buildBillflowSidebarItems } from '../../shared/billflow-navigation';
import { BillflowPageShellComponent } from '../../shared/components/billflow-page-shell.component';
import { DashboardParticlesBackgroundComponent } from '../dashboard/dashboard-particles-background.component';
import { BillflowMobileSidebarComponent } from '../../shared/components/billflow-mobile-sidebar.component';
import { BillflowNotificationButtonComponent } from '../../shared/components/billflow-notification-button.component';
import { BillflowUserMenuComponent } from '../../shared/components/billflow-user-menu.component';
import { BillflowModalShellComponent } from '../../shared/components/billflow-modal-shell.component';

type CustomersLocale = 'es' | 'en';

interface CustomersCopy {
  moduleLabel: string;
  title: string;
  description: string;
  resultsLabel: string;
  themeLabel: string;
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
  sidebarDashboard: string;
  sidebarInvoices: string;
  sidebarCustomers: string;
  sidebarProducts: string;
  sidebarEmployees: string;
  signOut: string;
  settings: string;
  notifications: string;
  languageToggle: string;
  sessionLabel: string;
  modalCreateTitle: string;
  modalCreateSubtitle: string;
  modalEditTitle: string;
  modalEditSubtitle: string;
  save: string;
  saveEdit: string;
  // Form field labels
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

const CUSTOMERS_TEXT: Record<CustomersLocale, CustomersCopy> = {
  es: {
    moduleLabel: 'Módulo de Clientes',
    title: 'Gestión de Clientes',
    description: 'Administrá, editá y controlá el estado de tus clientes.',
    resultsLabel: 'resultados',
    themeLabel: 'Tema',
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
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Facturas',
    sidebarCustomers: 'Clientes',
    sidebarProducts: 'Productos',
    sidebarEmployees: 'Empleados',
    signOut: 'Cerrar sesión',
    settings: 'Configuración',
    notifications: 'Notificaciones',
    languageToggle: 'English',
    sessionLabel: 'Sesión',
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
    cedulaPlaceholder: '10 dígitos',
    phonePlaceholder: 'Ej: +595 981 123456',
    emailPlaceholder: 'Ej: cliente@ejemplo.com',
    cancel: 'Cancelar',
  },
  en: {
    moduleLabel: 'Customers Module',
    title: 'Customer Management',
    description: 'Manage, edit, and control your customers.',
    resultsLabel: 'results',
    themeLabel: 'Theme',
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
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Invoices',
    sidebarCustomers: 'Customers',
    sidebarProducts: 'Products',
    sidebarEmployees: 'Employees',
    signOut: 'Sign out',
    settings: 'Settings',
    notifications: 'Notifications',
    languageToggle: 'Español',
    sessionLabel: 'Session',
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
    cedulaPlaceholder: '10 digits',
    phonePlaceholder: 'e.g. +1 555 123 4567',
    emailPlaceholder: 'e.g. john@example.com',
    cancel: 'Cancel',
  },
};

@Component({
  selector: 'billflow-customers-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BillflowPageShellComponent, DashboardParticlesBackgroundComponent, BillflowMobileSidebarComponent, BillflowNotificationButtonComponent, BillflowUserMenuComponent, BillflowModalShellComponent],
  template: `
    <billflow-page-shell [items]="sidebarItems()" [actionLabel]="copy().newCustomer" actionIcon="add" (actionClick)="openCreateModal()">
      <billflow-dashboard-particles-background class="app-invoice-bg"></billflow-dashboard-particles-background>

      <div class="flex-1 min-w-0 app-invoices-shell app-dashboard-main">
        <header class="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div class="py-3 px-5 md:px-6 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 shrink-0">
              <span class="hidden md:inline-flex lg:hidden">
                <billflow-mobile-sidebar [items]="sidebarItems()" [actionLabel]="copy().newCustomer" actionIcon="add" (actionClick)="openCreateModal()"></billflow-mobile-sidebar>
              </span>
              <span class="material-symbols-outlined text-outline">groups</span>
              <span class="font-h3 text-h3 text-on-background">{{ copy().moduleLabel }}</span>
            </div>

            <div class="flex items-center gap-2 ml-auto shrink-0 self-auto relative z-40" #userMenuPanel>
              <billflow-notification-button (clicked)="openNotifications()"></billflow-notification-button>
              <billflow-user-menu
                [displayName]="displayName"
                [initials]="userInitials"
                [open]="userMenuVisible()"
                [closing]="userMenuClosing()"
                [showLanguageToggle]="true"
                [languageLabel]="copy().languageToggle"
                [settingsLabel]="copy().settings"
                [logoutLabel]="copy().signOut"
                [sessionLabel]="copy().sessionLabel"
                (toggle)="toggleUserMenu($event)"
                (close)="closeUserMenu()"
                (languageToggle)="toggleLocale()"
                (settings)="openUserSettings()"
                (logout)="logout()"
              ></billflow-user-menu>
            </div>
          </div>
        </header>

        <main class="mx-auto w-full max-w-7xl px-5 pb-5 md:px-8">
          <section class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 class="font-h1 text-h1 tracking-tight text-on-background">{{ copy().title }}</h1>
              <p class="mt-2 text-body-md text-on-surface-variant">{{ copy().description }}</p>
            </div>
            <div class="flex items-center gap-2 text-sm text-on-surface-variant">
              <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ filteredCustomers().length }} {{ copy().resultsLabel }}</span>
              <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ copy().themeLabel }}: {{ currentThemeLabel() }}</span>
            </div>
          </section>

          <!-- KPIs Section -->
          <section class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <!-- Card 1: Total Clientes -->
            <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
              <div class="absolute -right-4 -bottom-4 text-primary/5 dark:text-primary/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                <span class="material-symbols-outlined text-[96px] font-light">groups</span>
              </div>
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 shadow-sm">
                  <span class="material-symbols-outlined text-[24px]">groups</span>
                </div>
                <div>
                  <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ locale() === 'es' ? 'Total de Clientes' : 'Total Customers' }}</p>
                  <h3 class="text-2xl font-bold text-on-background mt-1">{{ totalCustomersCount() }}</h3>
                </div>
              </div>
            </div>

            <!-- Card 2: Clientes Activos -->
            <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
              <div class="absolute -right-4 -bottom-4 text-[#10b981]/5 dark:text-[#10b981]/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                <span class="material-symbols-outlined text-[96px] font-light">check_circle</span>
              </div>
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center border border-[#10b981]/20 shrink-0 shadow-sm">
                  <span class="material-symbols-outlined text-[24px]">check_circle</span>
                </div>
                <div>
                  <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ locale() === 'es' ? 'Activos' : 'Active' }}</p>
                  <h3 class="text-2xl font-bold text-on-background mt-1">{{ activeCustomersCount() }}</h3>
                </div>
              </div>
            </div>

            <!-- Card 3: Clientes Inactivos -->
            <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
              <div class="absolute -right-4 -bottom-4 text-error/5 dark:text-error/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                <span class="material-symbols-outlined text-[96px] font-light">block</span>
              </div>
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-xl bg-error/10 text-error flex items-center justify-center border border-error/20 shrink-0 shadow-sm">
                  <span class="material-symbols-outlined text-[24px]">block</span>
                </div>
                <div>
                  <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ locale() === 'es' ? 'Inactivos' : 'Inactive' }}</p>
                  <h3 class="text-2xl font-bold text-on-background mt-1">{{ inactiveCustomersCount() }}</h3>
                </div>
              </div>
            </div>
          </section>

          <section class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden">
            <div class="dashboard-table-card__head p-6 md:p-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div class="flex flex-wrap items-center gap-3">
                <select class="bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-sm py-1.5 px-4 text-on-surface font-medium focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" [value]="statusFilter()" (change)="setStatusFilter(($any($event.target).value))">
                  <option value="all">{{ copy().allStatuses }}</option>
                  <option value="active">{{ copy().active }}</option>
                  <option value="inactive">{{ copy().inactive }}</option>
                </select>

                <button
                  type="button"
                  [title]="copy().searchPlaceholder"
                  class="inline-flex items-center justify-center bg-surface-container-lowest border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm hover:border-primary hover:text-primary"
                  (click)="void reloadCustomers()"
                >
                  <span
                    class="material-symbols-outlined text-[20px] transition-transform"
                    [style.animation]="loading() ? 'spin 0.7s linear infinite' : 'none'"
                  >refresh</span>
                </button>

                <button
                  type="button"
                  class="inline-flex items-center gap-2 bg-primary text-on-primary rounded-lg px-4 py-2 text-sm font-bold hover:opacity-90 transition-all shadow-sm"
                  (click)="openCreateModal()"
                >
                  <span class="material-symbols-outlined text-[18px]">add</span>
                  {{ copy().newCustomer }}
                </button>
              </div>

              <div class="flex items-center gap-2 w-full lg:w-auto">
                <select 
                  class="bg-surface-container-lowest border border-outline-variant/60 rounded-full text-sm py-2.5 px-4 text-on-surface font-medium focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm cursor-pointer"
                  [value]="searchField()"
                  (change)="setSearchField(($any($event.target).value))"
                >
                  <option value="all">{{ locale() === 'es' ? 'Cualquier campo' : 'Any field' }}</option>
                  <option value="name">{{ locale() === 'es' ? 'Nombre' : 'First Name' }}</option>
                  <option value="lastName">{{ locale() === 'es' ? 'Apellido' : 'Last Name' }}</option>
                  <option value="cedula">{{ locale() === 'es' ? 'Documento' : 'Document ID' }}</option>
                  <option value="email">{{ locale() === 'es' ? 'Email' : 'Email' }}</option>
                  <option value="phone">{{ locale() === 'es' ? 'Teléfono' : 'Phone' }}</option>
                </select>

                <div class="relative flex-1 lg:w-64">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
                  <input
                    class="w-full min-w-0 pl-12 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-full text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                    [placeholder]="copy().searchPlaceholder"
                    [value]="searchQuery()"
                    (input)="setSearchQuery(($any($event.target).value))"
                  />
                </div>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full border-collapse text-left">
                <thead>
                  <tr class="dashboard-table-card__head-row font-label-bold text-[11px] uppercase tracking-[0.1em]">
                    <th class="dashboard-table-card__th p-4 pl-7 font-semibold">{{ locale() === 'es' ? 'Cliente' : 'Customer' }}</th>
                    <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().document }}</th>
                    <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().email }}</th>
                    <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().phone }}</th>
                    <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().status }}</th>
                    <th class="dashboard-table-card__th p-4 pr-7 font-semibold text-right">{{ copy().actions }}</th>
                  </tr>
                </thead>

                <tbody class="font-body-sm text-body-sm">
                  <tr *ngFor="let customer of paginatedCustomers()" class="dashboard-table-card__row group border-b border-outline-variant/20 hover:bg-surface-container-low/40 transition-colors duration-200" [ngClass]="!customer.active ? 'opacity-70 bg-surface-container-lowest/20' : ''">
                    <td class="p-4 pl-7 font-semibold text-on-background">
                      <div class="flex items-center gap-3">
                        <div class="h-9 w-9 rounded-full bg-gradient-to-br flex items-center justify-center border text-xs font-bold shrink-0 shadow-sm" [ngClass]="getCustomerGradient(customer)">
                          {{ getCustomerInitials(customer) }}
                        </div>
                        <div>
                          <div class="font-semibold text-on-background">{{ customer.name }} {{ customer.lastName }}</div>
                          <div class="text-[10px] text-outline mt-0.5 md:hidden font-mono">CI: {{ customer.cedula }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="p-4">
                      <span class="font-mono text-sm text-on-surface">{{ customer.cedula ?? '—' }}</span>
                    </td>
                    <td class="p-4 text-on-surface font-medium">{{ customer.email || '—' }}</td>
                    <td class="p-4 text-on-surface font-medium">{{ customer.phone || '—' }}</td>
                    <td class="p-4">
                      <span
                        class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide"
                        [ngClass]="customer.active ? 'border-primary/20 bg-primary/10 text-primary shadow-sm shadow-primary/5' : 'border-outline-variant/40 bg-surface-container-high text-on-surface-variant'"
                      >
                        <span class="h-1.5 w-1.5 rounded-full" [ngClass]="customer.active ? 'bg-primary animate-pulse' : 'bg-outline'"></span>
                        {{ customer.active ? (locale() === 'es' ? 'ACTIVO' : 'ACTIVE') : (locale() === 'es' ? 'INACTIVO' : 'INACTIVE') }}
                      </span>
                    </td>
                    <td class="p-4 pr-7 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <!-- Info Button -->
                        <button
                          type="button"
                          [title]="locale() === 'es' ? 'Ver Detalles' : 'View Details'"
                          class="inline-flex h-8 w-8 items-center justify-center bg-primary text-on-primary rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer"
                          (click)="$event.stopPropagation(); showCustomerInfo(customer)"
                        >
                          <span class="material-symbols-outlined text-[18px]">info</span>
                        </button>

                        <!-- Edit Button -->
                        <button
                          type="button"
                          [title]="copy().edit"
                          class="inline-flex h-8 w-8 items-center justify-center bg-primary text-on-primary rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer"
                          (click)="$event.stopPropagation(); openEditModal(customer)"
                        >
                          <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>

                        <!-- Deactivate / Activate Button -->
                        <button
                          type="button"
                          [title]="customer.active ? copy().deactivate : copy().activate"
                          class="inline-flex h-8 w-8 items-center justify-center text-white rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer"
                          [ngClass]="customer.active ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:opacity-85'"
                          (click)="$event.stopPropagation(); void toggleActive(customer)"
                        >
                          <span class="material-symbols-outlined text-[18px]">{{ customer.active ? 'close' : 'check' }}</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr *ngIf="paginatedCustomers().length === 0">
                    <td colspan="6" class="p-8">
                      <div class="dashboard-table-card__empty dashboard-table-card__empty--stacked mt-2">
                        <span class="material-symbols-outlined dashboard-table-card__empty-icon">groups</span>
                        <p class="dashboard-table-card__empty-title">{{ copy().noCustomersTitle }}</p>
                        <p class="dashboard-table-card__empty-text">{{ copy().noCustomersText }}</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex flex-col gap-4 border-t border-outline-variant/40 bg-surface/60 p-5 md:flex-row md:items-center md:justify-between dark:bg-slate-900/60">
              <div class="flex items-center gap-3 text-sm text-on-surface-variant">
                <span>
                  {{ copy().showingText }} <span class="font-semibold text-on-surface">{{ visibleRangeStart() }}</span> {{ locale() === 'es' ? 'a' : 'to' }} <span class="font-semibold text-on-surface">{{ visibleRangeEnd() }}</span> {{ locale() === 'es' ? 'de' : 'of' }} <span class="font-semibold text-on-surface">{{ filteredCustomers().length }}</span> {{ copy().entriesText }}
                </span>
                <select
                  class="bg-surface border border-outline-variant rounded-lg px-2 py-1 text-xs font-medium text-on-surface cursor-pointer focus:outline-none focus:border-primary"
                  [value]="pageSize()"
                  (change)="onPageSizeChange($event)"
                >
                  <option [value]="5">5</option>
                  <option [value]="10">10</option>
                  <option [value]="15">15</option>
                  <option [value]="20">20</option>
                  <option [value]="30">30</option>
                </select>
              </div>

              <div class="flex items-center gap-2">
                <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30" [disabled]="page() === 1" (click)="previousPage()">
                  <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                <button *ngFor="let pageNumber of visiblePages()" type="button" class="h-9 w-9 rounded-lg text-sm font-semibold transition" [ngClass]="pageNumber === page() ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'" (click)="goToPage(pageNumber)">
                  {{ pageNumber }}
                </button>

                <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30" [disabled]="page() === totalPages()" (click)="nextPage()">
                  <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </section>
        </main>

        <!-- ══ Create/Edit Customer Modal ══ -->
        <billflow-modal-shell
          *ngIf="customerModalOpen()"
          title="{{ editingCustomer() ? copy().modalEditTitle : copy().modalCreateTitle }}"
          subtitle="{{ editingCustomer() ? copy().modalEditSubtitle : copy().modalCreateSubtitle }}"
          icon="person_add"
          maxWidth="xl"
          [hasFooter]="true"
          (close)="closeCustomerModal()"
        >
          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- First Name -->
            <div class="md:col-span-1">
              <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().firstNameLabel }} <span class="text-error">*</span></label>
              <div class="relative">
                <input
                  type="text"
                  class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                  [maxLength]="100"
                  placeholder="Ej: Carlos"
                  [ngModel]="formFirstName()"
                  (ngModelChange)="onNameInput($event, 'firstName')"
                />
                <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline">{{ formFirstName().length }}/100</span>
              </div>
              @if (nameFieldError() === 'firstName') {
                <p class="mt-1 text-xs text-error">{{ copy().nameError }}</p>
              }
            </div>

            <!-- Last Name -->
            <div class="md:col-span-1">
              <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().lastNameLabel }} <span class="text-error">*</span></label>
              <div class="relative">
                <input
                  type="text"
                  class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                  [maxLength]="100"
                  placeholder="Ej: Rodríguez"
                  [ngModel]="formLastName()"
                  (ngModelChange)="onNameInput($event, 'lastName')"
                />
                <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline">{{ formLastName().length }}/100</span>
              </div>
              @if (nameFieldError() === 'lastName') {
                <p class="mt-1 text-xs text-error">{{ copy().nameError }}</p>
              }
            </div>

            <!-- Document (Cédula) -->
            <div class="md:col-span-1">
              <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().docLabel }} <span class="text-error">*</span></label>
              <div class="relative">
                <input
                  type="text"
                  class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                  [maxLength]="10"
                  [placeholder]="copy().cedulaPlaceholder"
                  [ngModel]="formCedula()"
                  (ngModelChange)="onNumericInput($event, 'cedula')"
                />
                <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline">{{ formCedula().length }}/10</span>
              </div>
            </div>

            <!-- Phone -->
            <div class="md:col-span-1">
              <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().phoneLabel }}</label>
              <div class="relative">
                <input
                  type="tel"
                  class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                  [maxLength]="20"
                  [placeholder]="copy().phonePlaceholder"
                  [ngModel]="formPhone()"
                  (ngModelChange)="onNumericInput($event, 'phone')"
                />
              </div>
            </div>

            <!-- Email -->
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().emailLabel }}</label>
              <div class="relative">
                <input
                  type="email"
                  class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                  [maxLength]="255"
                  [placeholder]="copy().emailPlaceholder"
                  [ngModel]="formEmail()"
                  (ngModelChange)="formEmail.set($event)"
                />
                <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline">{{ formEmail().length }}/255</span>
              </div>
            </div>
          </div>

          <div footer class="flex w-full items-center justify-end gap-3">
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all border border-outline-variant/50"
              (click)="closeCustomerModal()"
            >
              {{ copy().cancel }}
            </button>
            <button
              type="button"
              class="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
              [disabled]="!formValid()"
              (click)="saveCustomer()"
            >
              {{ editingCustomer() ? copy().saveEdit : copy().save }}
            </button>
          </div>
        </billflow-modal-shell>
        <!-- ══ /Create/Edit Customer Modal ══ -->

        <nav class="md:hidden app-dashboard-mobile-nav">
          <a *ngFor="let item of mobileNavItems()" class="flex flex-col items-center justify-center w-full h-full pt-1 border-t-2 transition-colors app-dashboard-mobile-link" [href]="item.href" [ngClass]="item.active ? 'text-primary border-primary app-dashboard-mobile-link--active' : 'border-transparent'">
            <span class="material-symbols-outlined" [style.font-variation-settings]="iconVariationSettings(item.active)">{{ item.icon }}</span>
            <span class="text-[10px] font-medium mt-1">{{ item.label }}</span>
          </a>

          <div class="app-dashboard-mobile-fab-wrap">
            <button type="button" class="w-14 h-14 bg-[#6862f3] text-white rounded-full shadow-lg shadow-[#6862f3]/30 flex items-center justify-center hover:bg-[#514be6] active:scale-95 transition-all border-[3px] border-surface" (click)="openCreateModal()">
              <span class="material-symbols-outlined text-[24px]">add</span>
            </button>
          </div>
        </nav>
      </div>
    </billflow-page-shell>
  `,
})
export class CustomersPageComponent implements OnInit {
  private readonly api = inject(InvoiceApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);
  @ViewChild('userMenuPanel') private userMenuPanel?: ElementRef<HTMLElement>;

  locale = this.localeService.locale;
  copy = computed(() => CUSTOMERS_TEXT[this.locale()]);

  readonly sidebarItems = computed(() => buildBillflowSidebarItems({
    dashboard: this.copy().sidebarDashboard,
    invoices: this.copy().sidebarInvoices,
    products: this.copy().sidebarProducts,
    customers: this.copy().sidebarCustomers,
    employees: this.copy().sidebarEmployees,
  }, 'customers'));

  readonly mobileNavItems = computed<BillflowSidebarItem[]>(() => [
    { label: this.copy().sidebarDashboard, icon: 'dashboard', href: '/dashboard' },
    { label: this.copy().sidebarInvoices, icon: 'receipt_long', href: '/invoices' },
    { label: this.copy().sidebarCustomers, icon: 'groups', href: '/customers', active: true },
    { label: this.copy().sidebarProducts, icon: 'inventory_2', href: '/dashboard' },
  ]);

  theme = signal<'light' | 'dark'>('light');
  loading = signal(true);
  customers = signal<CustomerRowDto[]>([]);
  searchQuery = signal('');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  page = signal(1);
  pageSize = signal(5);
  displayName = 'Usuario';
  userInitials = 'US';
  userMenuVisible = signal(false);
  userMenuClosing = signal(false);
  userMenuOpen = signal(false);
  private userMenuCloseTimeout: number | undefined;

  // ── Customer modal state ──────────────────────────────────────────────────
  customerModalOpen = signal(false);
  editingCustomer = signal<CustomerRowDto | null>(null);

  // Form signals
  formFirstName = signal('');
  formLastName = signal('');
  formCedula = signal('');
  formPhone = signal('');
  formEmail = signal('');
  nameFieldError = signal<'firstName' | 'lastName' | null>(null);

  readonly formValid = computed(() =>
    this.formFirstName().trim().length > 0
    && this.formLastName().trim().length > 0
    && this.formCedula().trim().length === 10
  );

  searchField = signal<'all' | 'name' | 'lastName' | 'cedula' | 'email' | 'phone'>('all');

  readonly totalCustomersCount = computed(() => this.customers().length);
  readonly activeCustomersCount = computed(() => this.customers().filter((c) => c.active).length);
  readonly inactiveCustomersCount = computed(() => this.customers().filter((c) => !c.active).length);

  // ── Filters & pagination ──────────────────────────────────────────────────
  readonly filteredCustomers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const field = this.searchField();

    return this.customers().filter((customer) => {
      let matchesQuery = true;
      if (query) {
        if (field === 'all') {
          matchesQuery = [customer.name, customer.lastName, customer.cedula ?? '', customer.email ?? '', customer.phone ?? '']
            .some((f) => f.toLowerCase().includes(query));
        } else if (field === 'name') {
          matchesQuery = customer.name.toLowerCase().includes(query);
        } else if (field === 'lastName') {
          matchesQuery = customer.lastName.toLowerCase().includes(query);
        } else if (field === 'cedula') {
          matchesQuery = (customer.cedula ?? '').toLowerCase().includes(query);
        } else if (field === 'email') {
          matchesQuery = (customer.email ?? '').toLowerCase().includes(query);
        } else if (field === 'phone') {
          matchesQuery = (customer.phone ?? '').toLowerCase().includes(query);
        }
      }

      const matchesStatus = status === 'all'
        || (status === 'active' && customer.active)
        || (status === 'inactive' && !customer.active);
      return matchesQuery && matchesStatus;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredCustomers().length / this.pageSize())));

  readonly paginatedCustomers = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredCustomers().slice(start, start + this.pageSize());
  });

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  async ngOnInit() {
    this.applyStoredTheme();
    this.applyStoredUser();
    if (typeof window !== 'undefined') document.documentElement.lang = this.locale();
    await this.reloadCustomers();
  }

  async reloadCustomers() {
    this.loading.set(true);
    try {
      const customers = await this.api.listCustomers();
      const sorted = customers.sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      this.customers.set(sorted);
      this.page.set(1);
    } catch {
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'No se pudieron cargar los clientes' : 'Could not load customers',
        this.locale() === 'es' ? 'Revisá la conexión con el backend.' : 'Please check the backend connection.');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Theme & locale ────────────────────────────────────────────────────────
  toggleTheme() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.persistTheme(next);
  }

  toggleLocale() {
    this.localeService.toggle();
  }

  // ── Search & filter ───────────────────────────────────────────────────────
  setSearchQuery(value: string) {
    this.searchQuery.set(value);
    this.page.set(1);
  }

  setSearchField(value: string) {
    this.searchField.set(value as any);
    this.page.set(1);
  }

  setStatusFilter(value: string) {
    this.statusFilter.set(value === 'active' || value === 'inactive' ? value : 'all');
    this.page.set(1);
  }

  onPageSizeChange(event: Event) {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    if (!Number.isFinite(value) || value < 5) return;
    this.pageSize.set(value);
    this.page.set(1);
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  nextPage() {
    if (this.page() < this.totalPages()) this.page.update((v) => v + 1);
  }

  previousPage() {
    if (this.page() > 1) this.page.update((v) => v - 1);
  }

  goToPage(pageNumber: number) {
    this.page.set(pageNumber);
  }

  // ── User menu ─────────────────────────────────────────────────────────────
  openNotifications() {
    void this.feedback.toast('info', this.copy().notifications,
      this.locale() === 'es' ? 'Tenés 3 movimientos críticos esperando revisión.' : 'You have 3 critical movements waiting for review.');
  }

  toggleUserMenu(event?: MouseEvent) {
    event?.stopPropagation();
    if (this.userMenuVisible()) { this.closeUserMenu(); return; }
    if (this.userMenuCloseTimeout !== undefined && typeof window !== 'undefined') {
      window.clearTimeout(this.userMenuCloseTimeout);
      this.userMenuCloseTimeout = undefined;
    }
    this.userMenuClosing.set(false);
    this.userMenuVisible.set(true);
    this.userMenuOpen.set(true);
  }

  closeUserMenu() {
    if (!this.userMenuVisible() || this.userMenuClosing()) return;
    this.userMenuClosing.set(true);
    if (typeof window === 'undefined') return;
    this.userMenuCloseTimeout = window.setTimeout(() => {
      this.userMenuVisible.set(false);
      this.userMenuOpen.set(false);
      this.userMenuClosing.set(false);
      this.userMenuCloseTimeout = undefined;
    }, 180);
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    if (!this.userMenuOpen()) return;
    const target = event.target as Node | null;
    if (!target || this.userMenuPanel?.nativeElement.contains(target)) return;
    this.closeUserMenu();
  }

  async openUserSettings() {
    this.closeUserMenu();
    await this.feedback.alert('info', this.copy().settings,
      this.locale() === 'es' ? 'Acá podés actualizar tu perfil y preferencias.' : 'You can update your profile and preferences here.');
  }

  async logout() {
    this.closeUserMenu();
    const confirmed = await this.feedback.confirm(this.copy().signOut,
      this.locale() === 'es' ? '¿Seguro que querés salir del panel?' : 'Are you sure you want to leave the dashboard?',
      this.copy().signOut, this.copy().cancelBtn);
    if (!confirmed || typeof window === 'undefined') return;
    window.localStorage.removeItem('billflow-session');
    window.location.replace('/auth');
  }

  // ── Customer modal ────────────────────────────────────────────────────────
  openCreateModal() {
    this.editingCustomer.set(null);
    this.resetForm();
    this.customerModalOpen.set(true);
  }

  openEditModal(customer: CustomerRowDto) {
    this.editingCustomer.set(customer);
    this.formFirstName.set(customer.name);
    this.formLastName.set(customer.lastName);
    this.formCedula.set(customer.cedula ?? '');
    this.formPhone.set(customer.phone ?? '');
    this.formEmail.set(customer.email ?? '');
    this.customerModalOpen.set(true);
  }

  closeCustomerModal() {
    this.customerModalOpen.set(false);
    this.editingCustomer.set(null);
  }

  private resetForm() {
    this.formFirstName.set('');
    this.formLastName.set('');
    this.formCedula.set('');
    this.formPhone.set('');
    this.formEmail.set('');
    this.nameFieldError.set(null);
  }

  async saveCustomer() {
    const payload: CreateCustomerPayload = {
      firstName: this.formFirstName().trim(),
      lastName: this.formLastName().trim(),
      cedula: this.formCedula().trim(),
      email: this.formEmail().trim() || undefined,
      phone: this.formPhone().trim() || undefined,
    };

    try {
      const editing = this.editingCustomer();
      if (editing) {
        await this.api.updateCustomer(editing.id, payload);
        await this.feedback.toast('success', this.copy().updatedToast);
      } else {
        await this.api.createCustomer(payload);
        await this.feedback.toast('success', this.copy().createdToast);
      }
      this.closeCustomerModal();
      await this.reloadCustomers();
    } catch (err) {
      console.error('[save customer]', err);
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'Error al guardar el cliente' : 'Error saving customer');
    }
  }

  /** Logical deactivation/activation */
  async toggleActive(customer: CustomerRowDto) {
    const isActive = customer.active;
    const confirmed = await this.feedback.confirm(
      isActive ? this.copy().confirmDeactivateTitle : this.copy().confirmActivateTitle,
      isActive ? this.copy().confirmDeactivateText : this.copy().confirmActivateText,
      this.copy().confirmBtn,
      this.copy().cancelBtn,
    );
    if (!confirmed) return;

    try {
      await this.api.toggleCustomerActive(customer.id, isActive);
      const msg = isActive ? this.copy().toggledInactive : this.copy().toggledActive;
      await this.feedback.toast('success', msg);
      await this.reloadCustomers();
    } catch (err) {
      console.error('[toggle active]', err);
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'Error al cambiar el estado' : 'Error changing status');
    }
  }

  // ── Form sanitization (reuse same logic as create-invoice) ────────────────
  onNameInput(value: string, target: 'firstName' | 'lastName') {
    const cleaned = value.replace(/[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]/g, '');
    if (target === 'firstName') this.formFirstName.set(cleaned);
    else this.formLastName.set(cleaned);
    if (value !== cleaned) this.nameFieldError.set(target);
    else if (this.nameFieldError() === target) this.nameFieldError.set(null);
  }

  onNumericInput(value: string, target: 'cedula' | 'phone') {
    if (target === 'cedula') {
      this.formCedula.set(value.replace(/\D/g, '').slice(0, 10));
    } else {
      this.formPhone.set(value.replace(/\D/g, ''));
    }
  }

  iconVariationSettings(active = false) {
    return active ? "'FILL' 1" : "'FILL' 0";
  }

  currentThemeLabel() {
    return this.locale() === 'es'
      ? (this.theme() === 'dark' ? 'Modo oscuro' : 'Modo claro')
      : (this.theme() === 'dark' ? 'Dark mode' : 'Light mode');
  }

  visibleRangeStart() {
    if (this.filteredCustomers().length === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  visibleRangeEnd() {
    return Math.min(this.filteredCustomers().length, this.page() * this.pageSize());
  }

  formatMoney(value: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
  }

  getCustomerInitials(customer: CustomerRowDto): string {
    const first = customer.name ? customer.name.charAt(0) : '';
    const last = customer.lastName ? customer.lastName.charAt(0) : '';
    return (first + last).toUpperCase();
  }

  getCustomerGradient(customer: CustomerRowDto): string {
    const hash = customer.name.charCodeAt(0) + (customer.lastName?.charCodeAt(0) || 0);
    const gradients = [
      'from-[#4f46e5]/20 to-[#06b6d4]/20 text-[#4f46e5] dark:text-[#c3c0ff] border-[#4f46e5]/20',
      'from-[#ec4899]/20 to-[#f43f5e]/20 text-[#ec4899] dark:text-[#ffb2b7] border-[#ec4899]/20',
      'from-[#10b981]/20 to-[#3b82f6]/20 text-[#10b981] dark:text-[#89ceff] border-[#10b981]/20',
      'from-[#f59e0b]/20 to-[#ef4444]/20 text-[#f59e0b] dark:text-[#ffb2b7] border-[#f59e0b]/20',
      'from-[#8b5cf6]/20 to-[#d946ef]/20 text-[#8b5cf6] dark:text-[#c3c0ff] border-[#8b5cf6]/20',
    ];
    return gradients[hash % gradients.length];
  }

  showCustomerInfo(customer: CustomerRowDto) {
    const statusText = customer.active
      ? (this.locale() === 'es' ? 'Activo' : 'Active')
      : (this.locale() === 'es' ? 'Inactivo' : 'Inactive');

    const fields = [
      `${this.locale() === 'es' ? 'Nombre completo' : 'Full name'}: ${customer.name} ${customer.lastName}`,
      `${this.locale() === 'es' ? 'Cédula' : 'ID'}: ${customer.cedula ?? '—'}`,
      `Email: ${customer.email || '—'}`,
      `${this.locale() === 'es' ? 'Teléfono' : 'Phone'}: ${customer.phone || '—'}`,
      `${this.locale() === 'es' ? 'Estado' : 'Status'}: ${statusText}`
    ];
    
    void this.feedback.alert(
      'info',
      this.locale() === 'es' ? 'Detalles del Cliente' : 'Customer Details',
      fields.join('\n')
    );
  }

  // ── Private ───────────────────────────────────────────────────────────────
  private applyStoredUser() {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('billflow-session');
      if (!raw) return;
      const session = JSON.parse(raw) as { id?: string; employeeId?: string; email?: string; role?: string; user?: { name?: string; firstName?: string; fullName?: string } };
      const candidate = session.employeeId || session.id || session.email?.split('@')[0] || session.user?.fullName || session.user?.name || session.user?.firstName || 'Usuario';
      this.displayName = candidate === 'Usuario' ? candidate : candidate.toUpperCase();
      if (candidate !== 'Usuario') {
        this.userInitials = candidate.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
      } else { this.userInitials = 'US'; }
    } catch { this.displayName = 'Usuario'; this.userInitials = 'US'; }
  }

  private applyStoredTheme() {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('billflow-theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const next = stored === 'dark' || stored === 'light' ? stored : prefersDark ? 'dark' : 'light';
    this.theme.set(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  private persistTheme(next: 'light' | 'dark') {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('billflow-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }
}
