import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, inject, signal, HostListener, ElementRef, ViewChild } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ProductApiService, type ProductWithStockDto, type CategoryDto, type StockMovementDto, type CreateProductPayload } from './product-api.service';
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

type ProductsLocale = 'es' | 'en';

interface ProductsCopy {
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
  signOut: string;
  settings: string;
  notifications: string;
  languageToggle: string;
  sessionLabel: string;
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
}

const PRODUCTS_TEXT: Record<ProductsLocale, ProductsCopy> = {
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
    signOut: 'Cerrar sesión',
    settings: 'Configuración',
    notifications: 'Notificaciones',
    languageToggle: 'English',
    sessionLabel: 'Sesión',
    modalCreateTitle: 'Nuevo Producto',
    modalCreateSubtitle: 'Completá los datos del nuevo producto',
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
    signOut: 'Sign out',
    settings: 'Settings',
    notifications: 'Notifications',
    languageToggle: 'Español',
    sessionLabel: 'Session',
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
  },
};

@Component({
  selector: 'billflow-products-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BillflowPageShellComponent,
    DashboardParticlesBackgroundComponent,
    BillflowMobileSidebarComponent,
    BillflowNotificationButtonComponent,
    BillflowUserMenuComponent,
    BillflowModalShellComponent,
  ],
  template: `
    <billflow-page-shell [items]="sidebarItems()" [actionLabel]="copy().newProduct" actionIcon="add" (actionClick)="openCreateModal()">
      <billflow-dashboard-particles-background class="app-invoice-bg"></billflow-dashboard-particles-background>

      <div class="flex-1 min-w-0 app-invoices-shell app-dashboard-main">
        <header class="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div class="py-3 px-5 md:px-6 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 shrink-0">
              <span class="hidden md:inline-flex lg:hidden">
                <billflow-mobile-sidebar [items]="sidebarItems()" [actionLabel]="copy().newProduct" actionIcon="add" (actionClick)="openCreateModal()"></billflow-mobile-sidebar>
              </span>
              <span class="material-symbols-outlined text-outline">inventory_2</span>
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
              <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ totalProducts() }} {{ copy().resultsLabel }}</span>
              <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ copy().themeLabel }}: {{ currentThemeLabel() }}</span>
            </div>
          </section>

          <!-- KPIs Section -->
          <section class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <!-- Card 1: Total Products -->
            <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
              <div class="absolute -right-4 -bottom-4 text-primary/5 dark:text-primary/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                <span class="material-symbols-outlined text-[96px] font-light">inventory_2</span>
              </div>
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 shadow-sm">
                  <span class="material-symbols-outlined text-[24px]">inventory_2</span>
                </div>
                <div>
                  <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ locale() === 'es' ? 'Total Productos' : 'Total Products' }}</p>
                  <h3 class="text-2xl font-bold text-on-background mt-1">{{ totalProducts() }}</h3>
                </div>
              </div>
            </div>

            <!-- Card 2: Active Products -->
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
                  <h3 class="text-2xl font-bold text-on-background mt-1">{{ activeCount() }}</h3>
                </div>
              </div>
            </div>

            <!-- Card 3: Out of Stock / Low Stock Products -->
            <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300 col-span-2 lg:col-span-1">
              <div class="absolute -right-4 -bottom-4 text-error/5 dark:text-error/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                <span class="material-symbols-outlined text-[96px] font-light">warning</span>
              </div>
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-xl bg-error/10 text-error flex items-center justify-center border border-error/20 shrink-0 shadow-sm">
                  <span class="material-symbols-outlined text-[24px]">warning</span>
                </div>
                <div>
                  <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ locale() === 'es' ? 'Bajo / Sin Stock' : 'Low / Out of Stock' }}</p>
                  <h3 class="text-2xl font-bold text-on-background mt-1">{{ lowStockCount() }}</h3>
                </div>
              </div>
            </div>
          </section>

          <section class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden">
            <!-- Unified Filter Toolbar -->
            <div class="p-4 md:p-5 flex flex-wrap items-center gap-3 border-b border-outline-variant/20">

              <!-- Status combo -->
              <select
                class="bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-sm py-2 px-3 text-on-surface font-medium focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm cursor-pointer"
                [value]="statusFilter()"
                (change)="setStatusFilter(($any($event.target).value))"
              >
                <option value="all">{{ copy().allStatuses }}</option>
                <option value="active">{{ copy().active }}</option>
                <option value="inactive">{{ copy().inactive }}</option>
              </select>

              <!-- Category combo -->
              <select
                class="bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-sm py-2 px-3 text-on-surface font-medium focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm cursor-pointer"
                [value]="categoryFilter()"
                (change)="setCategoryFilter(($any($event.target).value))"
              >
                <option value="all">{{ copy().allCategories }}</option>
                <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</option>
              </select>

              <!-- Search field combo + text input fused -->
              <div class="flex flex-1 min-w-[220px] max-w-md">
                <select
                  class="shrink-0 bg-surface-container-lowest border border-outline-variant/60 border-r-0 rounded-l-lg text-sm py-2 px-3 text-on-surface font-medium focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm cursor-pointer"
                  [value]="searchField()"
                  (change)="searchField.set($any($event.target).value)"
                >
                  <option value="all">{{ locale() === 'es' ? 'Todos' : 'All' }}</option>
                  <option value="code">{{ copy().code }}</option>
                  <option value="name">{{ copy().name }}</option>
                </select>
                <div class="relative flex-1">
                  <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline-variant pointer-events-none">search</span>
                  <input
                    class="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/60 rounded-r-lg text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                    [placeholder]="searchField() === 'code' ? (locale() === 'es' ? 'Buscar por código...' : 'Search by code...') : searchField() === 'name' ? (locale() === 'es' ? 'Buscar por nombre...' : 'Search by name...') : copy().searchPlaceholder"
                    [value]="searchQuery()"
                    (input)="setSearchQuery(($any($event.target).value))"
                  />
                </div>
              </div>

              <!-- Spacer -->
              <div class="flex-1 hidden lg:block"></div>

              <!-- Refresh button -->
              <button
                type="button"
                [title]="locale() === 'es' ? 'Recargar' : 'Reload'"
                class="inline-flex items-center justify-center bg-surface-container-lowest border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm hover:border-primary hover:text-primary"
                (click)="void reloadProducts()"
              >
                <span
                  class="material-symbols-outlined text-[20px]"
                  [style.animation]="loading() ? 'spin 0.7s linear infinite' : 'none'"
                >refresh</span>
              </button>

              <!-- New product button -->
              <button
                type="button"
                class="inline-flex items-center gap-2 bg-primary text-on-primary rounded-lg px-4 py-2 text-sm font-bold hover:opacity-90 transition-all shadow-sm"
                (click)="openCreateModal()"
              >
                <span class="material-symbols-outlined text-[18px]">add</span>
                {{ copy().newProduct }}
              </button>

            </div>

            <!-- Products Table -->
            <div class="overflow-x-auto">
              <table class="min-w-max w-full border-collapse text-left">
                <thead>
                  <tr class="dashboard-table-card__head-row font-label-bold text-[11px] uppercase tracking-[0.1em]">
                    <th class="dashboard-table-card__th p-4 pl-7 font-semibold">{{ copy().code }}</th>
                    <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().name }}</th>
                    <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().category }}</th>
                    <th class="dashboard-table-card__th p-4 font-semibold text-right">{{ copy().salePrice }}</th>
                    <th class="dashboard-table-card__th p-4 font-semibold text-right">{{ copy().costPrice }}</th>
                    <th class="dashboard-table-card__th p-4 font-semibold text-right">{{ copy().stock }}</th>
                    <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().status }}</th>
                    <th class="dashboard-table-card__th p-4 pr-7 font-semibold text-right">{{ copy().actions }}</th>
                  </tr>
                </thead>

                <tbody class="font-body-sm text-body-sm">
                  <tr *ngFor="let product of products()" class="dashboard-table-card__row group border-b border-outline-variant/20 hover:bg-surface-container-low/40 transition-colors duration-200" [ngClass]="!product.isActive ? 'opacity-70 bg-surface-container-lowest/20' : ''">
                    <td class="p-4 pl-7 font-mono font-bold text-primary">
                      {{ product.code }}
                    </td>
                    <td class="p-4 font-semibold text-on-background">
                      <div>
                        <div class="font-semibold text-on-background">{{ product.name }}</div>
                        <div class="text-[11px] text-outline mt-0.5 font-normal max-w-[250px] truncate" [title]="product.description ?? ''">
                          {{ product.description || '—' }}
                        </div>
                      </div>
                    </td>
                    <td class="p-4">
                      <span class="rounded-full bg-surface-container-high px-2.5 py-1 text-xs text-on-surface font-medium border border-outline-variant/40">
                        {{ product.categoryName }}
                      </span>
                    </td>
                    <td class="p-4 text-right font-medium text-on-surface">
                      {{ formatMoney(product.salePrice) }}
                    </td>
                    <td class="p-4 text-right font-medium text-outline">
                      {{ formatMoney(product.costPrice) }}
                    </td>
                    <td class="p-4 text-right font-semibold">
                      <span [ngClass]="product.currentStock <= 0 ? 'text-error' : product.currentStock <= 5 ? 'text-amber-500' : 'text-tertiary'">
                        {{ product.currentStock }}
                      </span>
                    </td>
                    <td class="p-4">
                      <span
                        class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide"
                        [ngClass]="product.isActive ? 'border-primary/20 bg-primary/10 text-primary shadow-sm shadow-primary/5' : 'border-outline-variant/40 bg-surface-container-high text-on-surface-variant'"
                      >
                        <span class="h-1.5 w-1.5 rounded-full" [ngClass]="product.isActive ? 'bg-primary animate-pulse' : 'bg-outline'"></span>
                        {{ product.isActive ? (locale() === 'es' ? 'ACTIVO' : 'ACTIVE') : (locale() === 'es' ? 'INACTIVO' : 'INACTIVE') }}
                      </span>
                    </td>
                    <td class="p-4 pr-7 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <!-- History (Movements) Button -->
                        <button
                          type="button"
                          [title]="copy().viewHistory"
                          class="inline-flex h-8 w-8 items-center justify-center bg-[#10b981] text-white rounded-lg shadow-sm transition-all duration-200 hover:bg-[#059669] active:scale-90 cursor-pointer"
                          (click)="openMovementsModal(product)"
                        >
                          <span class="material-symbols-outlined text-[18px]">history</span>
                        </button>

                        <!-- Edit Button -->
                        <button
                          type="button"
                          [title]="copy().edit"
                          class="inline-flex h-8 w-8 items-center justify-center bg-primary text-on-primary rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer"
                          (click)="openEditModal(product)"
                        >
                          <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>

                        <!-- Deactivate / Activate Button -->
                        <button
                          type="button"
                          [title]="product.isActive ? copy().deactivate : copy().activate"
                          class="inline-flex h-8 w-8 items-center justify-center text-white rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer"
                          [ngClass]="product.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:opacity-85'"
                          (click)="toggleActive(product)"
                        >
                          <span class="material-symbols-outlined text-[18px]">{{ product.isActive ? 'close' : 'check' }}</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr *ngIf="products().length === 0">
                    <td colspan="8" class="p-8">
                      <div class="dashboard-table-card__empty dashboard-table-card__empty--stacked mt-2">
                        <span class="material-symbols-outlined dashboard-table-card__empty-icon">inventory_2</span>
                        <p class="dashboard-table-card__empty-title">{{ copy().noProductsTitle }}</p>
                        <p class="dashboard-table-card__empty-text">{{ copy().noProductsText }}</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer -->
            <div class="flex flex-col gap-4 border-t border-outline-variant/40 bg-surface/60 p-5 md:flex-row md:items-center md:justify-between dark:bg-slate-900/60">
              <div class="flex items-center gap-3 text-sm text-on-surface-variant">
                <span>
                  {{ copy().showingText }} <span class="font-semibold text-on-surface">{{ visibleRangeStart() }}</span> {{ locale() === 'es' ? 'a' : 'to' }} <span class="font-semibold text-on-surface">{{ visibleRangeEnd() }}</span> {{ locale() === 'es' ? 'de' : 'of' }} <span class="font-semibold text-on-surface">{{ totalProductsCount() }}</span> {{ copy().entriesText }}
                </span>
                <select
                  class="bg-surface border border-outline-variant rounded-lg px-2 py-1 text-xs font-medium text-on-surface cursor-pointer focus:outline-none focus:border-primary"
                  [value]="pageSize()"
                  (change)="onPageSizeChange($event)"
                >
                  <option [value]="5">5</option>
                  <option [value]="10">10</option>
                  <option [value]="20">20</option>
                  <option [value]="50">50</option>
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

        <!-- ══ Create/Edit Product Modal ══ -->
        <billflow-modal-shell
          *ngIf="productModalOpen()"
          title="{{ editingProduct() ? copy().modalEditTitle : copy().modalCreateTitle }}"
          subtitle="{{ editingProduct() ? copy().modalEditSubtitle : copy().modalCreateSubtitle }}"
          icon="inventory"
          maxWidth="xl"
          [hasFooter]="true"
          (close)="closeProductModal()"
        >
          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Code -->
            <div class="md:col-span-1">
              <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().codeLabel }} <span class="text-error">*</span></label>
              <input
                type="text"
                class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                [maxLength]="50"
                placeholder="Ej: BEB-001"
                [ngModel]="formCode()"
                [disabled]="editingProduct() !== null"
                (ngModelChange)="formCode.set($event.trim().toUpperCase())"
              />
            </div>

            <!-- Category -->
            <div class="md:col-span-1">
              <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().category }} <span class="text-error">*</span></label>
              <select
                class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                [ngModel]="formCategoryId()"
                (ngModelChange)="formCategoryId.set($event)"
              >
                <option value="">{{ copy().categorySelect }}</option>
                <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</option>
              </select>
            </div>

            <!-- Name -->
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().nameLabel }} <span class="text-error">*</span></label>
              <input
                type="text"
                class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                [maxLength]="255"
                placeholder="Ej: Coca Cola 1L"
                [ngModel]="formName()"
                (ngModelChange)="formName.set($event)"
              />
            </div>

            <!-- Description -->
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().descriptionLabel }}</label>
              <textarea
                class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant resize-none h-20"
                placeholder="Ej: Bebida gaseosa refrescante sabor cola."
                [ngModel]="formDescription()"
                (ngModelChange)="formDescription.set($event)"
              ></textarea>
            </div>

            <!-- Cost Price -->
            <div class="md:col-span-1">
              <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().costPriceLabel }} <span class="text-error">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                placeholder="0.00"
                [ngModel]="formCostPrice()"
                (ngModelChange)="formCostPrice.set($event)"
              />
            </div>

            <!-- Sale Price -->
            <div class="md:col-span-1">
              <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().salePriceLabel }} <span class="text-error">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                placeholder="0.00"
                [ngModel]="formSalePrice()"
                (ngModelChange)="formSalePrice.set($event)"
              />
            </div>

            <!-- Initial Stock (Only for Creation) -->
            <div class="md:col-span-2" *ngIf="editingProduct() === null">
              <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().initialStockLabel }}</label>
              <input
                type="number"
                min="0"
                class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                placeholder="0"
                [ngModel]="formInitialStock()"
                (ngModelChange)="formInitialStock.set($event)"
              />
            </div>
          </div>

          <div footer class="flex w-full items-center justify-end gap-3">
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all border border-outline-variant/50"
              (click)="closeProductModal()"
            >
              {{ copy().cancel }}
            </button>
            <button
              type="button"
              class="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
              [disabled]="!formValid()"
              (click)="saveProduct()"
            >
              {{ editingProduct() ? copy().saveEdit : copy().save }}
            </button>
          </div>
        </billflow-modal-shell>
        <!-- ══ /Create/Edit Product Modal ══ -->

        <!-- ══ Stock Movements History Modal ══ -->
        <billflow-modal-shell
          *ngIf="movementsModalOpen()"
          title="{{ copy().modalMovementsTitle }}"
          subtitle="{{ selectedProductForMovements()?.name }} ({{ selectedProductForMovements()?.code }})"
          icon="history"
          maxWidth="2xl"
          [hasFooter]="false"
          (close)="closeMovementsModal()"
        >
          <div class="p-6">
            <div class="overflow-x-auto rounded-xl border border-outline-variant/40 overflow-hidden mb-4">
              <table class="w-full border-collapse text-left">
                <thead>
                  <tr class="bg-surface-container-low font-label-bold text-[10px] uppercase tracking-[0.1em] border-b border-outline-variant/40">
                    <th class="p-3 pl-5 font-semibold text-outline">{{ copy().mvtDate }}</th>
                    <th class="p-3 font-semibold text-outline text-center">{{ copy().mvtType }}</th>
                    <th class="p-3 font-semibold text-outline text-right">{{ copy().mvtQuantity }}</th>
                    <th class="p-3 font-semibold text-outline text-right">{{ locale() === 'es' ? 'Stock Ant.' : 'Prev. Stock' }}</th>
                    <th class="p-3 font-semibold text-outline text-right">{{ locale() === 'es' ? 'Stock Nuevo' : 'New Stock' }}</th>
                    <th class="p-3 pr-5 font-semibold text-outline">{{ copy().mvtReason }}</th>
                  </tr>
                </thead>
                <tbody class="font-mono text-xs">
                  <tr *ngFor="let m of movements()" class="border-b border-outline-variant/20 hover:bg-surface-container-low/20 transition-colors">
                    <td class="p-3 pl-5 text-on-surface">
                      {{ formatDateTime(m.createdAt) }}
                    </td>
                    <td class="p-3 text-center">
                      <span
                        class="inline-flex rounded px-2 py-0.5 text-[10px] font-bold"
                        [ngClass]="m.type === 'IN' ? 'bg-[#10b981]/15 text-[#10b981]' : m.type === 'OUT' ? 'bg-red-600/15 text-red-500' : m.type === 'SALE' ? 'bg-orange-500/15 text-orange-500' : 'bg-amber-500/15 text-amber-500'"
                      >
                        {{ m.type }}
                      </span>
                    </td>
                    <td class="p-3 text-right font-bold" [ngClass]="m.type === 'IN' ? 'text-[#10b981]' : (m.type === 'OUT' || m.type === 'SALE') ? 'text-red-500' : 'text-on-surface'">
                      {{ m.type === 'IN' ? '+' : (m.type === 'OUT' || m.type === 'SALE') ? '-' : '' }}{{ m.quantity }}
                    </td>
                    <td class="p-3 text-right font-mono text-xs text-on-surface-variant">
                      {{ m.previousStock }}
                    </td>
                    <td class="p-3 text-right font-mono text-xs font-semibold text-on-surface">
                      {{ m.newStock }}
                    </td>
                    <td class="p-3 pr-5 text-on-surface-variant max-w-[200px] truncate" [title]="m.reason">
                      {{ m.reason || '—' }}
                    </td>
                  </tr>
                  <tr *ngIf="movements().length === 0 && !mvtLoading()">
                    <td colspan="6" class="p-8 text-center text-on-surface-variant">
                      <span class="material-symbols-outlined text-4xl text-outline-variant mb-2">history</span>
                      <p class="font-semibold">{{ copy().noMovementsTitle }}</p>
                      <p class="text-xs">{{ copy().noMovementsText }}</p>
                    </td>
                  </tr>
                  <tr *ngIf="mvtLoading()">
                    <td colspan="6" class="p-8 text-center text-on-surface-variant">
                      <span class="material-symbols-outlined text-[24px] animate-spin">refresh</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Movements Pager -->
            <div class="flex items-center justify-between text-xs text-on-surface-variant" *ngIf="mvtTotalPages() > 1">
              <span>
                {{ copy().showingText }} {{ (mvtPage() - 1) * mvtPageSize() + 1 }} - {{ Math.min(mvtTotalCount(), mvtPage() * mvtPageSize()) }} {{ locale() === 'es' ? 'de' : 'of' }} {{ mvtTotalCount() }}
              </span>
              <div class="flex items-center gap-1">
                <button type="button" class="p-1.5 border border-outline-variant/60 rounded hover:border-primary disabled:opacity-30 cursor-pointer" [disabled]="mvtPage() === 1" (click)="mvtPrevPage()">
                  <span class="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span class="px-2 font-semibold">{{ mvtPage() }} / {{ mvtTotalPages() }}</span>
                <button type="button" class="p-1.5 border border-outline-variant/60 rounded hover:border-primary disabled:opacity-30 cursor-pointer" [disabled]="mvtPage() === mvtTotalPages()" (click)="mvtNextPage()">
                  <span class="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </billflow-modal-shell>
        <!-- ══ /Stock Movements History Modal ══ -->

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
export class ProductsPageComponent implements OnInit {
  private readonly api = inject(ProductApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);
  @ViewChild('userMenuPanel') private userMenuPanel?: ElementRef<HTMLElement>;

  Math = Math;
  locale = this.localeService.locale;
  copy = computed(() => PRODUCTS_TEXT[this.locale()]);

  readonly sidebarItems = computed(() => buildBillflowSidebarItems({
    dashboard: this.copy().sidebarDashboard,
    invoices: this.copy().sidebarInvoices,
    products: this.copy().sidebarProducts,
    customers: this.copy().sidebarCustomers,
    employees: this.copy().sidebarEmployees,
  }, 'products'));

  readonly mobileNavItems = computed<BillflowSidebarItem[]>(() => [
    { label: this.copy().sidebarDashboard, icon: 'dashboard', href: '/dashboard' },
    { label: this.copy().sidebarInvoices, icon: 'receipt_long', href: '/invoices' },
    { label: this.copy().sidebarCustomers, icon: 'groups', href: '/customers' },
    { label: this.copy().sidebarProducts, icon: 'inventory_2', href: '/products', active: true },
  ]);

  theme = signal<'light' | 'dark'>('light');
  loading = signal(true);
  products = signal<ProductWithStockDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  
  // Filters
  searchQuery = signal('');
  searchField = signal<'all' | 'code' | 'name'>('all');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  categoryFilter = signal<string>('all');
  
  // Pagination
  page = signal(1);
  pageSize = signal(10);
  totalProductsCount = signal(0);
  
  // KPIs
  activeCount = signal(0);
  lowStockCount = signal(0);

  // User
  displayName = 'Usuario';
  userInitials = 'US';
  userMenuVisible = signal(false);
  userMenuClosing = signal(false);
  userMenuOpen = signal(false);
  private userMenuCloseTimeout: number | undefined;

  // Modals state
  productModalOpen = signal(false);
  editingProduct = signal<ProductWithStockDto | null>(null);

  // Form signals
  formCode = signal('');
  formName = signal('');
  formDescription = signal('');
  formSalePrice = signal<number | null>(null);
  formCostPrice = signal<number | null>(null);
  formInitialStock = signal<number | null>(null);
  formCategoryId = signal('');

  readonly formValid = computed(() =>
    this.formCode().trim().length > 0 &&
    this.formName().trim().length > 0 &&
    this.formCategoryId().trim().length > 0 &&
    this.formSalePrice() !== null && this.formSalePrice()! > 0 &&
    this.formCostPrice() !== null && this.formCostPrice()! > 0
  );

  // Movements modal state
  movementsModalOpen = signal(false);
  selectedProductForMovements = signal<ProductWithStockDto | null>(null);
  movements = signal<StockMovementDto[]>([]);
  mvtLoading = signal(false);
  mvtPage = signal(1);
  mvtPageSize = signal(5);
  mvtTotalCount = signal(0);
  mvtTotalPages = computed(() => Math.max(1, Math.ceil(this.mvtTotalCount() / this.mvtPageSize())));

  readonly totalProducts = computed(() => this.totalProductsCount());
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalProductsCount() / this.pageSize())));

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
    if (typeof window !== 'undefined') {
      document.documentElement.lang = this.locale();
      // Load categories first so dropdown works, then load products
      await this.loadCategories();
      await this.reloadProducts();
    }
  }

  async loadCategories() {
    try {
      const cats = await this.api.listCategories();
      this.categories.set(cats);
    } catch (err) {
      console.error('[load categories]', err);
    }
  }

  async reloadProducts() {
    this.loading.set(true);
    try {
      const res = await this.api.fetchProductsPage(
        this.searchQuery(),
        this.categoryFilter(),
        this.statusFilter(),
        this.page(),
        this.pageSize()
      );
      this.products.set(res.data);
      this.totalProductsCount.set(res.total);
      
      // Load quick aggregates / aggregates count (client-side of loaded page or query if backend handles it)
      // Since backend page list might be filtered, let's also fetch active vs low stock aggregates.
      // For simplicity, we calculate them from the response page or set defaults.
      this.activeCount.set(res.data.filter(p => p.isActive).length);
      this.lowStockCount.set(res.data.filter(p => p.currentStock <= 5).length);
      
    } catch (err) {
      console.error('[reload products]', err);
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'No se pudieron cargar los productos' : 'Could not load products',
        this.locale() === 'es' ? 'Revisá la conexión con el backend.' : 'Please check the backend connection.');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Search & Filters ──────────────────────────────────────────────────────
  setSearchQuery(value: string) {
    this.searchQuery.set(value);
    this.page.set(1);
    void this.reloadProducts();
  }

  setStatusFilter(value: string) {
    this.statusFilter.set(value as any);
    this.page.set(1);
    void this.reloadProducts();
  }

  setCategoryFilter(value: string) {
    this.categoryFilter.set(value);
    this.page.set(1);
    void this.reloadProducts();
  }

  onPageSizeChange(event: Event) {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    if (!Number.isFinite(value) || value < 5) return;
    this.pageSize.set(value);
    this.page.set(1);
    void this.reloadProducts();
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update((v) => v + 1);
      void this.reloadProducts();
    }
  }

  previousPage() {
    if (this.page() > 1) {
      this.page.update((v) => v - 1);
      void this.reloadProducts();
    }
  }

  goToPage(pageNumber: number) {
    this.page.set(pageNumber);
    void this.reloadProducts();
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

  // ── Product Modal ─────────────────────────────────────────────────────────
  openCreateModal() {
    this.editingProduct.set(null);
    this.resetForm();
    this.productModalOpen.set(true);
  }

  openEditModal(product: ProductWithStockDto) {
    this.editingProduct.set(product);
    this.formCode.set(product.code);
    this.formName.set(product.name);
    this.formDescription.set(product.description ?? '');
    this.formSalePrice.set(product.salePrice);
    this.formCostPrice.set(product.costPrice);
    this.formInitialStock.set(null);
    this.formCategoryId.set(product.categoryId);
    this.productModalOpen.set(true);
  }

  closeProductModal() {
    this.productModalOpen.set(false);
    this.editingProduct.set(null);
  }

  private resetForm() {
    this.formCode.set('');
    this.formName.set('');
    this.formDescription.set('');
    this.formSalePrice.set(null);
    this.formCostPrice.set(null);
    this.formInitialStock.set(null);
    this.formCategoryId.set('');
  }

  async saveProduct() {
    if (!this.formValid()) return;

    try {
      const editing = this.editingProduct();
      if (editing) {
        const payload = {
          categoryId: this.formCategoryId(),
          code: this.formCode(),
          name: this.formName(),
          description: this.formDescription().trim() || undefined,
          salePrice: Number(this.formSalePrice()),
          costPrice: Number(this.formCostPrice()),
        };
        await this.api.updateProduct(editing.id, payload);
        await this.feedback.toast('success', this.copy().updatedToast);
      } else {
        const payload: CreateProductPayload = {
          categoryId: this.formCategoryId(),
          code: this.formCode(),
          name: this.formName(),
          description: this.formDescription().trim() || undefined,
          salePrice: Number(this.formSalePrice()),
          costPrice: Number(this.formCostPrice()),
          initialStock: this.formInitialStock() !== null ? Number(this.formInitialStock()) : 0,
        };
        await this.api.createProduct(payload);
        await this.feedback.toast('success', this.copy().createdToast);
      }
      this.closeProductModal();
      await this.reloadProducts();
    } catch (err: any) {
      console.error('[save product]', err);
      const errMsg = err.message || (this.locale() === 'es' ? 'Error al guardar el producto' : 'Error saving product');
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'Error al guardar el producto' : 'Error saving product',
        errMsg);
    }
  }

  /** Logical activation/deactivation */
  async toggleActive(product: ProductWithStockDto) {
    const isActive = product.isActive;
    const confirmed = await this.feedback.confirm(
      isActive ? this.copy().confirmDeactivateTitle : this.copy().confirmActivateTitle,
      isActive ? this.copy().confirmDeactivateText : this.copy().confirmActivateText,
      this.copy().confirmBtn,
      this.copy().cancelBtn,
    );
    if (!confirmed) return;

    try {
      await this.api.toggleProductActive(product.id, isActive);
      const msg = isActive ? this.copy().toggledInactive : this.copy().toggledActive;
      await this.feedback.toast('success', msg);
      await this.reloadProducts();
    } catch (err) {
      console.error('[toggle active]', err);
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'Error al cambiar el estado' : 'Error changing status');
    }
  }

  // ── Stock Movements Modal ──────────────────────────────────────────────────
  openMovementsModal(product: ProductWithStockDto) {
    this.selectedProductForMovements.set(product);
    this.movements.set([]);
    this.mvtPage.set(1);
    this.mvtTotalCount.set(0);
    this.movementsModalOpen.set(true);
    void this.loadMovements();
  }

  closeMovementsModal() {
    this.movementsModalOpen.set(false);
    this.selectedProductForMovements.set(null);
  }

  async loadMovements() {
    const product = this.selectedProductForMovements();
    if (!product) return;

    this.mvtLoading.set(true);
    try {
      const res = await this.api.getProductMovements(product.id, this.mvtPage(), this.mvtPageSize());
      this.movements.set(res.data);
      this.mvtTotalCount.set(res.total);
    } catch (err) {
      console.error('[load movements]', err);
    } finally {
      this.mvtLoading.set(false);
    }
  }

  mvtNextPage() {
    if (this.mvtPage() < this.mvtTotalPages()) {
      this.mvtPage.update(v => v + 1);
      void this.loadMovements();
    }
  }

  mvtPrevPage() {
    if (this.mvtPage() > 1) {
      this.mvtPage.update(v => v - 1);
      void this.loadMovements();
    }
  }

  // ── Helper methods ─────────────────────────────────────────────────────────
  iconVariationSettings(active = false) {
    return active ? "'FILL' 1" : "'FILL' 0";
  }

  currentThemeLabel() {
    return this.locale() === 'es'
      ? (this.theme() === 'dark' ? 'Modo oscuro' : 'Modo claro')
      : (this.theme() === 'dark' ? 'Dark mode' : 'Light mode');
  }

  visibleRangeStart() {
    if (this.products().length === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  visibleRangeEnd() {
    return Math.min(this.totalProductsCount(), this.page() * this.pageSize());
  }

  formatMoney(value: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
  }

  formatDateTime(isoString: string): string {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleString(this.locale() === 'es' ? 'es-PY' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
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
