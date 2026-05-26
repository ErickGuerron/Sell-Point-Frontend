import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  computed,
  inject,
  signal,
  HostListener,
  ElementRef,
  ViewChild,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import {
  CategoryApiService,
  type CategoryDto,
  type CreateCategoryPayload,
} from './category-api.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { LocaleService } from '../../shared/services/locale.service';
import type { BillflowSidebarItem } from '../../shared/components/billflow-sidebar.component';
import { buildBillflowSidebarItems } from '../../shared/billflow-navigation';
import { BillflowPageShellComponent } from '../../shared/components/billflow-page-shell.component';
import { DashboardParticlesBackgroundComponent } from '../dashboard/dashboard-particles-background.component';
import { BillflowMobileSidebarComponent } from '../../shared/components/billflow-mobile-sidebar.component';
import { BillflowNotificationButtonComponent } from '../../shared/components/billflow-notification-button.component';
import { BillflowUserMenuComponent } from '../../shared/components/billflow-user-menu.component';
import { BillflowModalShellComponent } from '../../shared/components/billflow-modal-shell.component';
import { BillflowComboboxComponent, type ComboboxOption } from '../../shared/components/billflow-combobox.component';

type CategoriesLocale = 'es' | 'en';

interface CategoriesCopy {
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
  cancel: string;
  nameLabel: string;
  goBackToProducts: string;
}

const CATEGORIES_TEXT: Record<CategoriesLocale, CategoriesCopy> = {
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
    confirmDeactivateText:
      'La categoría dejará de estar disponible para nuevos productos.',
    confirmActivateTitle: '¿Activar categoría?',
    confirmActivateText:
      'La categoría volverá a estar disponible para usar.',
    confirmBtn: 'Sí',
    cancelBtn: 'Cancelar',
    noCategoriesTitle: 'No hay categorías',
    noCategoriesText: 'Probá con otro filtro o término de búsqueda.',
    showingText: 'Mostrando',
    entriesText: 'registros',
    createdToast: 'Categoría creada correctamente',
    updatedToast: 'Categoría actualizada correctamente',
    toggledActive: 'Categoría activada correctamente',
    toggledInactive: 'Categoría desactivada correctamente',
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
    modalCreateTitle: 'Nueva Categoría',
    modalCreateSubtitle: 'Completá los datos de la nueva categoría',
    modalEditTitle: 'Editar Categoría',
    modalEditSubtitle: 'Actualizá los datos de la categoría',
    save: 'Guardar Categoría',
    saveEdit: 'Actualizar Categoría',
    cancel: 'Cancelar',
    nameLabel: 'Nombre de la Categoría',
    goBackToProducts: 'Volver a Productos',
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
    confirmDeactivateText:
      'The category will no longer be available for new products.',
    confirmActivateTitle: 'Activate category?',
    confirmActivateText:
      'The category will be available again for products.',
    confirmBtn: 'Yes',
    cancelBtn: 'Cancel',
    noCategoriesTitle: 'No categories found',
    noCategoriesText: 'Try another filter or search term.',
    showingText: 'Showing',
    entriesText: 'entries',
    createdToast: 'Category created successfully',
    updatedToast: 'Category updated successfully',
    toggledActive: 'Category activated successfully',
    toggledInactive: 'Category deactivated successfully',
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
    modalCreateTitle: 'New Category',
    modalCreateSubtitle: 'Fill in the new category details',
    modalEditTitle: 'Edit Category',
    modalEditSubtitle: 'Update the category details',
    save: 'Save Category',
    saveEdit: 'Update Category',
    cancel: 'Cancel',
    nameLabel: 'Category Name',
    goBackToProducts: 'Back to Products',
  },
};

@Component({
  selector: 'billflow-categories-page',
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
    BillflowComboboxComponent,
  ],
  template: `
    <billflow-page-shell
      [items]="sidebarItems()"
      [locale]="locale()"
      (settings)="openUserSettings()"
      (logout)="logout()"
    >
      <billflow-dashboard-particles-background
        class="app-invoice-bg"
      ></billflow-dashboard-particles-background>

      <div class="flex-1 min-w-0 app-invoices-shell app-dashboard-main">
        <header
          class="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-xl"
        >
          <div
            class="py-3 px-5 md:px-6 flex items-center justify-between gap-4"
          >
            <div class="flex items-center gap-3 shrink-0">
              <span class="hidden md:inline-flex lg:hidden">
                <billflow-mobile-sidebar
                  [items]="sidebarItems()"
                  [actionLabel]="copy().newCategory"
                  actionIcon="add"
                  (actionClick)="openCreateModal()"
                ></billflow-mobile-sidebar>
              </span>
              <span class="material-symbols-outlined text-outline"
                >category</span
              >
              <span class="font-h3 text-h3 text-on-background">{{
                copy().moduleLabel
              }}</span>
            </div>

            <div
              class="flex items-center gap-2 ml-auto shrink-0 self-auto relative z-40"
              #userMenuPanel
            >
              <billflow-notification-button
                (clicked)="openNotifications()"
              ></billflow-notification-button>
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
          <!-- Header section -->
          <section
            class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <h1 class="font-h1 text-h1 tracking-tight text-on-background">
                {{ copy().title }}
              </h1>
              <p class="mt-2 text-body-md text-on-surface-variant">
                {{ copy().description }}
              </p>
            </div>
            <div
              class="flex items-center gap-2 text-sm text-on-surface-variant"
            >
              <span
                class="rounded-full border border-outline-variant/60 px-3 py-1"
                >{{ totalCategories() }} {{ copy().resultsLabel }}</span
              >
              <span
                class="rounded-full border border-outline-variant/60 px-3 py-1"
                >{{ copy().themeLabel }}: {{ currentThemeLabel() }}</span
              >
            </div>
          </section>

          <!-- KPIs: total from server; active from /categories/aggregates (TODO(backend)) -->
          <section class="grid grid-cols-2 gap-4 mb-6">
            <!-- Total Categories -->
            <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
              <div class="absolute -right-4 -bottom-4 text-primary/5 dark:text-primary/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                <span class="material-symbols-outlined text-[96px] font-light">category</span>
              </div>
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 shadow-sm">
                  <span class="material-symbols-outlined text-[24px]">category</span>
                </div>
                <div>
                  <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ locale() === 'es' ? 'Total Categorías' : 'Total Categories' }}</p>
                  <h3 class="text-2xl font-bold text-on-background mt-1">{{ totalCategories() }}</h3>
                </div>
              </div>
            </div>

            <!-- Active Categories — backend-driven (pending /categories/aggregates) -->
            <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
              <div class="absolute -right-4 -bottom-4 text-[#10b981]/5 dark:text-[#10b981]/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                <span class="material-symbols-outlined text-[96px] font-light">check_circle</span>
              </div>
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center border border-[#10b981]/20 shrink-0 shadow-sm">
                  <span class="material-symbols-outlined text-[24px]">check_circle</span>
                </div>
                <div>
                  <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ locale() === 'es' ? 'Activas' : 'Active' }}</p>
                  <h3 class="text-2xl font-bold text-on-background mt-1">{{ activeCategoriesCount() }}</h3>
                </div>
              </div>
            </div>
          </section>

          <!-- Table Card -->
          <section
            class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden"
          >
            <!-- Toolbar -->
            <div
              class="p-4 md:p-5 flex flex-wrap items-center gap-3 border-b border-outline-variant/20"
            >
              <!-- Search -->
              <div class="relative flex-1 min-w-[220px] max-w-md">
                <span
                  class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline-variant pointer-events-none"
                  >search</span
                >
                <input
                  class="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                  [placeholder]="copy().searchPlaceholder"
                  [value]="searchQuery()"
                  (input)="setSearchQuery(($any($event.target).value))"
                />
              </div>

              <!-- Refresh button -->
              <button
                type="button"
                [title]="locale() === 'es' ? 'Recargar' : 'Reload'"
                class="inline-flex items-center justify-center bg-surface-container-lowest border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm hover:border-primary hover:text-primary"
                (click)="void reloadCategories()"
              >
                <span
                  class="material-symbols-outlined text-[20px]"
                  [style.animation]="
                    loading() ? 'spin 0.7s linear infinite' : 'none'
                  "
                  >refresh</span
                >
              </button>

              <!-- Back to Products button -->
              <a
                href="/products"
                class="inline-flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-4 py-2 text-sm font-semibold text-on-surface hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                <span class="material-symbols-outlined text-[18px]"
                  >arrow_back</span
                >
                {{ copy().goBackToProducts }}
              </a>

              <!-- New category button -->
              <button
                type="button"
                class="inline-flex items-center gap-2 bg-primary text-on-primary rounded-lg px-4 py-2 text-sm font-bold hover:opacity-90 transition-all shadow-sm"
                (click)="openCreateModal()"
              >
                <span class="material-symbols-outlined text-[18px]">add</span>
                {{ copy().newCategory }}
              </button>
            </div>

            <!-- Categories Table -->
            <div class="overflow-x-auto">
              <table class="min-w-max w-full border-collapse text-left">
                <thead>
                  <tr
                    class="dashboard-table-card__head-row font-label-bold text-[11px] uppercase tracking-[0.1em]"
                  >
                    <th
                      class="dashboard-table-card__th p-4 pl-7 font-semibold"
                    >
                      {{ copy().name }}
                    </th>
                    <th
                      class="dashboard-table-card__th p-4 font-semibold"
                    >
                      {{ copy().descriptionLabel }}
                    </th>
                    <th
                      class="dashboard-table-card__th p-4 font-semibold"
                    >
                      {{ copy().status }}
                    </th>
                    <th
                      class="dashboard-table-card__th p-4 pr-7 font-semibold text-right"
                    >
                      {{ copy().actions }}
                    </th>
                  </tr>
                </thead>

                <tbody class="font-body-sm text-body-sm">
                  <tr
                    *ngFor="let cat of categories()"
                    class="dashboard-table-card__row group border-b border-outline-variant/20 hover:bg-surface-container-low/40 transition-colors duration-200"
                    [ngClass]="
                      !cat.isActive
                        ? 'opacity-70 bg-surface-container-lowest/20'
                        : ''
                    "
                  >
                    <td class="p-4 pl-7 font-semibold text-on-background">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"
                        >
                          <span class="material-symbols-outlined text-[18px]"
                            >category</span
                          >
                        </div>
                        <span class="font-semibold">{{ cat.name }}</span>
                      </div>
                    </td>
                    <td class="p-4">
                      <span
                        class="text-sm text-on-surface-variant max-w-[300px] truncate block"
                        [title]="cat.description ?? ''"
                      >
                        {{ cat.description || '—' }}
                      </span>
                    </td>
                    <td class="p-4">
                      <span
                        class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide"
                        [ngClass]="
                          cat.isActive
                            ? 'border-primary/20 bg-primary/10 text-primary shadow-sm shadow-primary/5'
                            : 'border-outline-variant/40 bg-surface-container-high text-on-surface-variant'
                        "
                      >
                        <span
                          class="h-1.5 w-1.5 rounded-full"
                          [ngClass]="
                            cat.isActive
                              ? 'bg-primary animate-pulse'
                              : 'bg-outline'
                          "
                        ></span>
                        {{
                          cat.isActive
                            ? locale() === 'es'
                              ? 'ACTIVO'
                              : 'ACTIVE'
                            : locale() === 'es'
                              ? 'INACTIVO'
                              : 'INACTIVE'
                        }}
                      </span>
                    </td>
                    <td class="p-4 pr-7 text-right">
                      <div
                        class="flex items-center justify-end gap-1.5"
                      >
                        <!-- Edit Button -->
                        <button
                          type="button"
                          [title]="copy().edit"
                          class="inline-flex h-8 w-8 items-center justify-center bg-primary text-on-primary rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer"
                          (click)="openEditModal(cat)"
                        >
                          <span class="material-symbols-outlined text-[18px]"
                            >edit</span
                          >
                        </button>

                        <!-- Deactivate / Activate Button -->
                        <button
                          type="button"
                          [title]="cat.isActive ? copy().deactivate : copy().activate"
                          class="inline-flex h-8 w-8 items-center justify-center text-white rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer"
                          [ngClass]="
                            cat.isActive
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-primary hover:opacity-85'
                          "
                          (click)="toggleActive(cat)"
                        >
                          <span
                            class="material-symbols-outlined text-[18px]"
                            >{{ cat.isActive ? 'close' : 'check' }}</span
                          >
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr *ngIf="categories().length === 0 && !loading()">
                    <td colspan="4" class="p-8">
                      <div
                        class="dashboard-table-card__empty dashboard-table-card__empty--stacked mt-2"
                      >
                        <span
                          class="material-symbols-outlined dashboard-table-card__empty-icon"
                          >category</span
                        >
                        <p class="dashboard-table-card__empty-title">
                          {{ copy().noCategoriesTitle }}
                        </p>
                        <p class="dashboard-table-card__empty-text">
                          {{ copy().noCategoriesText }}
                        </p>
                      </div>
                    </td>
                  </tr>

                  <tr *ngIf="loading() && categories().length === 0">
                    <td colspan="4" class="p-12 text-center text-on-surface-variant">
                      <span
                        class="material-symbols-outlined text-[32px] animate-spin inline-block"
                        >refresh</span
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer (default 5 per page) -->
            <div
              class="flex flex-col gap-4 border-t border-outline-variant/40 bg-surface/60 p-5 md:flex-row md:items-center md:justify-between dark:bg-slate-900/60"
            >
              <div
                class="flex items-center gap-3 text-sm text-on-surface-variant"
              >
                <span>
                  {{ copy().showingText }}
                  <span class="font-semibold text-on-surface">{{
                    visibleRangeStart()
                  }}</span>
                  {{ locale() === 'es' ? 'a' : 'to' }}
                  <span class="font-semibold text-on-surface">{{
                    visibleRangeEnd()
                  }}</span>
                  {{ locale() === 'es' ? 'de' : 'of' }}
                  <span class="font-semibold text-on-surface">{{
                    totalCategoriesCount()
                  }}</span>
                  {{ copy().entriesText }}
                </span>
                <select
                  [value]="pageSize()"
                  (change)="onPageSizeCombo($any($event.target).value)"
                  class="bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary/50 py-[5px] px-2 rounded-lg cursor-pointer shadow-sm transition-all"
                >
                  @for (option of pageSizeOptions; track option.value) {
                    <option [value]="option.value">
                      {{ option.label }}
                    </option>
                  }
                </select>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30"
                  [disabled]="page() === 1"
                  (click)="previousPage()"
                >
                  <span class="material-symbols-outlined text-[18px]"
                    >chevron_left</span
                  >
                </button>

                <button
                  *ngFor="let pageNumber of visiblePages()"
                  type="button"
                  class="h-9 w-9 rounded-lg text-sm font-semibold transition"
                  [ngClass]="
                    pageNumber === page()
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  "
                  (click)="goToPage(pageNumber)"
                >
                  {{ pageNumber }}
                </button>

                <button
                  type="button"
                  class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30"
                  [disabled]="page() === totalPages()"
                  (click)="nextPage()"
                >
                  <span class="material-symbols-outlined text-[18px]"
                    >chevron_right</span
                  >
                </button>
              </div>
            </div>
          </section>
        </main>

        <!-- ══ Create/Edit Category Modal ══ -->
        <billflow-modal-shell
          *ngIf="categoryModalOpen()"
          title="{{ editingCategory() ? copy().modalEditTitle : copy().modalCreateTitle }}"
          subtitle="{{ editingCategory() ? copy().modalEditSubtitle : copy().modalCreateSubtitle }}"
          icon="category"
          maxWidth="md"
          [hasFooter]="true"
          (close)="closeCategoryModal()"
        >
          <div class="p-6 grid grid-cols-1 gap-5">
            <!-- Name -->
            <div>
              <label class="block text-sm font-semibold text-on-surface mb-1.5"
                >{{ copy().nameLabel }} <span class="text-error">*</span></label
              >
              <input
                type="text"
                class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                [maxLength]="100"
                placeholder="Ej: Bebidas"
                [ngModel]="formName()"
                (ngModelChange)="formName.set($event)"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-semibold text-on-surface mb-1.5">{{
                copy().descriptionLabel
              }}</label>
              <textarea
                class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant resize-none h-20"
                placeholder="Ej: Bebidas gaseosas, aguas y jugos."
                [ngModel]="formDescription()"
                (ngModelChange)="formDescription.set($event)"
              ></textarea>
            </div>
          </div>

          <div footer class="flex w-full items-center justify-end gap-3">
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all border border-outline-variant/50"
              (click)="closeCategoryModal()"
            >
              {{ copy().cancel }}
            </button>
            <button
              type="button"
              class="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
              [disabled]="!formValid()"
              (click)="saveCategory()"
            >
              {{ editingCategory() ? copy().saveEdit : copy().save }}
            </button>
          </div>
        </billflow-modal-shell>
        <!-- ══ /Create/Edit Category Modal ══ -->

        <!-- Mobile Nav -->
        <nav class="md:hidden app-dashboard-mobile-nav">
          <a
            *ngFor="let item of mobileNavItems()"
            class="flex flex-col items-center justify-center w-full h-full pt-1 border-t-2 transition-colors app-dashboard-mobile-link"
            [href]="item.href"
            [ngClass]="
              item.active
                ? 'text-primary border-primary app-dashboard-mobile-link--active'
                : 'border-transparent'
            "
          >
            <span
              class="material-symbols-outlined"
              [style.font-variation-settings]="iconVariationSettings(item.active)"
              >{{ item.icon }}</span
            >
            <span class="text-[10px] font-medium mt-1">{{ item.label }}</span>
          </a>

          <div class="app-dashboard-mobile-fab-wrap">
            <button
              type="button"
              class="w-14 h-14 bg-[#6862f3] text-white rounded-full shadow-lg shadow-[#6862f3]/30 flex items-center justify-center hover:bg-[#514be6] active:scale-95 transition-all border-[3px] border-surface"
              (click)="openCreateModal()"
            >
              <span class="material-symbols-outlined text-[24px]">add</span>
            </button>
          </div>
        </nav>
      </div>
    </billflow-page-shell>
  `,
})
export class CategoriesPageComponent implements OnInit {
  private readonly api = inject(CategoryApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);
  @ViewChild('userMenuPanel') private userMenuPanel?: ElementRef<HTMLElement>;

  Math = Math;
  String = String;
  locale = this.localeService.locale;
  copy = computed(() => CATEGORIES_TEXT[this.locale()]);

  readonly sidebarItems = computed(() =>
    buildBillflowSidebarItems(
      {
        dashboard: this.copy().sidebarDashboard,
        invoices: this.copy().sidebarInvoices,
        products: this.copy().sidebarProducts,
        customers: this.copy().sidebarCustomers,
        employees: this.copy().sidebarEmployees,
        categories: this.copy().sidebarCategories,
      },
      'categories'
    )
  );

  readonly mobileNavItems = computed<BillflowSidebarItem[]>(() => [
    { label: this.copy().sidebarDashboard, icon: 'dashboard', href: '/dashboard' },
    { label: this.copy().sidebarInvoices, icon: 'receipt_long', href: '/invoices' },
    { label: this.copy().sidebarProducts, icon: 'inventory_2', href: '/products' },
    { label: this.copy().sidebarCategories, icon: 'category', href: '/categories', active: true },
  ]);

  theme = signal<'light' | 'dark'>('light');
  loading = signal(true);
  categories = signal<CategoryDto[]>([]);

  // Filters
  searchQuery = signal('');

  // Pagination
  page = signal(1);
  pageSize = signal(5); // default 5 as requested
  totalCategoriesCount = signal(0);
  // TODO(backend): fetch from /categories/aggregates endpoint
  activeCategoriesCount = signal(0);

  readonly pageSizeOptions: ComboboxOption[] = [
    { value: '5', label: '5' },
    { value: '10', label: '10' },
    { value: '20', label: '20' },
    { value: '50', label: '50' },
  ];

  // User
  displayName = 'Usuario';
  userInitials = 'US';
  userMenuVisible = signal(false);
  userMenuClosing = signal(false);
  userMenuOpen = signal(false);
  private userMenuCloseTimeout: number | undefined;

  // Modal state
  categoryModalOpen = signal(false);
  editingCategory = signal<CategoryDto | null>(null);

  // Form signals
  formName = signal('');
  formDescription = signal('');

  readonly formValid = computed(
    () => this.formName().trim().length > 0
  );

  // ── Computed pagination ────────────────────────────────────────────────────

  readonly totalCategories = computed(() => this.totalCategoriesCount());
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalCategoriesCount() / this.pageSize()))
  );

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async ngOnInit() {
    this.applyStoredTheme();
    this.applyStoredUser();
    if (typeof window !== 'undefined') {
      document.documentElement.lang = this.locale();
      await this.reloadCategories();
    }
  }

  async reloadCategories() {
    this.loading.set(true);
    try {
      const res = await this.api.fetchCategoriesPage(
        this.searchQuery(),
        this.page(),
        this.pageSize()
      );
      this.categories.set(res.data);
      this.totalCategoriesCount.set(res.total);

      // TODO(backend): once /categories/aggregates endpoint exists, call it here and set:
      //   this.activeCategoriesCount.set(agg.active);
    } catch (err) {
      console.error('[reload categories]', err);
      await this.feedback.alert(
        'error',
        this.locale() === 'es'
          ? 'No se pudieron cargar las categorías'
          : 'Could not load categories',
        this.locale() === 'es'
          ? 'Revisá la conexión con el backend.'
          : 'Please check the backend connection.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  // ── Search & Filters ───────────────────────────────────────────────────────

  setSearchQuery(value: string) {
    this.searchQuery.set(value);
    this.page.set(1);
    void this.reloadCategories();
  }

  onPageSizeChange(event: Event) {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    if (!Number.isFinite(value) || value < 5) return;
    this.pageSize.set(value);
    this.page.set(1);
    void this.reloadCategories();
  }

  onPageSizeCombo(value: string) {
    const num = parseInt(value, 10);
    if (!Number.isFinite(num) || num < 5) return;
    this.pageSize.set(num);
    this.page.set(1);
    void this.reloadCategories();
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update((v) => v + 1);
      void this.reloadCategories();
    }
  }

  previousPage() {
    if (this.page() > 1) {
      this.page.update((v) => v - 1);
      void this.reloadCategories();
    }
  }

  goToPage(pageNumber: number) {
    this.page.set(pageNumber);
    void this.reloadCategories();
  }

  // ── Theme & locale ─────────────────────────────────────────────────────────

  toggleTheme() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.persistTheme(next);
  }

  toggleLocale() {
    this.localeService.toggle();
  }

  // ── User menu ──────────────────────────────────────────────────────────────

  openNotifications() {
    void this.feedback.toast(
      'info',
      this.copy().notifications,
      this.locale() === 'es'
        ? 'Tenés 3 movimientos críticos esperando revisión.'
        : 'You have 3 critical movements waiting for review.'
    );
  }

  toggleUserMenu(event?: MouseEvent) {
    event?.stopPropagation();
    if (this.userMenuVisible()) {
      this.closeUserMenu();
      return;
    }
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

  openUserSettings() {
    this.closeUserMenu();
    if (typeof window !== 'undefined') {
      window.location.href = '/profile';
    }
  }

  async logout() {
    this.closeUserMenu();
    const confirmed = await this.feedback.confirm(
      this.copy().signOut,
      this.locale() === 'es'
        ? '¿Seguro que querés salir del panel?'
        : 'Are you sure you want to leave the dashboard?',
      this.copy().signOut,
      this.copy().cancelBtn
    );
    if (!confirmed || typeof window === 'undefined') return;
    window.localStorage.removeItem('billflow-session');
    window.location.replace('/auth');
  }

  // ── Category Modal ─────────────────────────────────────────────────────────

  openCreateModal() {
    this.editingCategory.set(null);
    this.resetForm();
    this.categoryModalOpen.set(true);
  }

  openEditModal(cat: CategoryDto) {
    this.editingCategory.set(cat);
    this.formName.set(cat.name);
    this.formDescription.set(cat.description ?? '');
    this.categoryModalOpen.set(true);
  }

  closeCategoryModal() {
    this.categoryModalOpen.set(false);
    this.editingCategory.set(null);
  }

  private resetForm() {
    this.formName.set('');
    this.formDescription.set('');
  }

  async saveCategory() {
    if (!this.formValid()) return;

    try {
      const editing = this.editingCategory();
      if (editing) {
        await this.api.updateCategory(editing.id, {
          name: this.formName().trim(),
          description: this.formDescription().trim() || undefined,
        });
        await this.feedback.toast('success', this.copy().updatedToast);
      } else {
        const payload: CreateCategoryPayload = {
          name: this.formName().trim(),
          description: this.formDescription().trim() || undefined,
        };
        await this.api.createCategory(payload);
        await this.feedback.toast('success', this.copy().createdToast);
      }
      this.closeCategoryModal();
      await this.reloadCategories();
    } catch (err: any) {
      console.error('[save category]', err);
      const errMsg =
        err.message ||
        (this.locale() === 'es'
          ? 'Error al guardar la categoría'
          : 'Error saving category');
      await this.feedback.alert(
        'error',
        this.locale() === 'es'
          ? 'Error al guardar la categoría'
          : 'Error saving category',
        errMsg
      );
    }
  }

  // ── Toggle Active ──────────────────────────────────────────────────────────

  async toggleActive(cat: CategoryDto) {
    const isActive = cat.isActive;
    const confirmed = await this.feedback.confirm(
      isActive
        ? this.copy().confirmDeactivateTitle
        : this.copy().confirmActivateTitle,
      isActive
        ? this.copy().confirmDeactivateText
        : this.copy().confirmActivateText,
      this.copy().confirmBtn,
      this.copy().cancelBtn
    );
    if (!confirmed) return;

    try {
      await this.api.toggleCategoryActive(cat.id, isActive);
      const msg = isActive
        ? this.copy().toggledInactive
        : this.copy().toggledActive;
      await this.feedback.toast('success', msg);
      await this.reloadCategories();
    } catch (err) {
      console.error('[toggle active]', err);
      await this.feedback.alert(
        'error',
        this.locale() === 'es'
          ? 'Error al cambiar el estado'
          : 'Error changing status'
      );
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  iconVariationSettings(active = false) {
    return active ? "'FILL' 1" : "'FILL' 0";
  }

  currentThemeLabel() {
    return this.locale() === 'es'
      ? this.theme() === 'dark'
        ? 'Modo oscuro'
        : 'Modo claro'
      : this.theme() === 'dark'
        ? 'Dark mode'
        : 'Light mode';
  }

  visibleRangeStart() {
    if (this.categories().length === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  visibleRangeEnd() {
    return Math.min(
      this.totalCategoriesCount(),
      this.page() * this.pageSize()
    );
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private applyStoredUser() {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('billflow-session');
      if (!raw) return;
      const session = JSON.parse(raw) as {
        id?: string;
        employeeId?: string;
        email?: string;
        role?: string;
        user?: {
          name?: string;
          firstName?: string;
          fullName?: string;
        };
      };
      const candidate =
        session.employeeId ||
        session.id ||
        session.email?.split('@')[0] ||
        session.user?.fullName ||
        session.user?.name ||
        session.user?.firstName ||
        'Usuario';
      this.displayName =
        candidate === 'Usuario' ? candidate : candidate.toUpperCase();
      if (candidate !== 'Usuario') {
        this.userInitials = candidate
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? '')
          .join('');
      } else {
        this.userInitials = 'US';
      }
    } catch {
      this.displayName = 'Usuario';
      this.userInitials = 'US';
    }
  }

  private applyStoredTheme() {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('billflow-theme');
    const prefersDark =
      window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const next =
      stored === 'dark' || stored === 'light'
        ? stored
        : prefersDark
          ? 'dark'
          : 'light';
    this.theme.set(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  private persistTheme(next: 'light' | 'dark') {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('billflow-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }
}
