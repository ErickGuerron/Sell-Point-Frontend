import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, HostListener, ElementRef, ViewChild } from '@angular/core';
import type { OnInit } from '@angular/core';
import { InvoiceApiService, type InvoiceRowDto } from './invoice-api.service';
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

type InvoiceStatus = 'paid' | 'pending' | 'overdue';
type InvoiceRange = '30d' | '90d' | 'year' | 'all';
type InvoiceLocale = 'es' | 'en';

interface InvoiceViewModel extends InvoiceRowDto {
  status: InvoiceStatus;
  statusLabel: string;
  statusTone: string;
  daysOld: number;
}


interface InvoiceCopy {
  moduleLabel: string;
  historyTitle: string;
  historyDescription: string;
  resultsLabel: string;
  themeLabel: string;
  totalOutstandingLabel: string;
  overdueAmountsLabel: string;
  paid30Label: string;
  openInvoicesText: string;
  overdueText: string;
  paidText: string;
  allStatuses: string;
  paid: string;
  pending: string;
  overdue: string;
  last30Days: string;
  last90Days: string;
  thisYear: string;
  allTime: string;
  refresh: string;
  searchPlaceholder: string;
  invoiceNumber: string;
  customer: string;
  dateIssued: string;
  amount: string;
  status: string;
  actions: string;
  createInvoice: string;
  emitInvoice: string;
  filterAll: string;
  filterInvoiceNumber: string;
  filterCustomer: string;
  filterAmount: string;
  subtotal: string;
  iva: string;
  invoicePreview: string;
  downloadPdf: string;
  close: string;
  sidebarDashboard: string;
  sidebarInvoices: string;
  sidebarCustomers: string;
  sidebarProducts: string;
  sidebarEmployees: string;
  sidebarInventory: string;
  sidebarReports: string;
  noInvoicesTitle: string;
  noInvoicesText: string;
  showingText: string;
  entriesText: string;
  signOut: string;
  settings: string;
  notifications: string;
  languageToggle: string;
  sessionLabel: string;
  colProduct: string;
  colQty: string;
  colUnitPrice: string;
  colTotal: string;
}

const INVOICE_TEXT: Record<InvoiceLocale, InvoiceCopy> = {
  es: {
    moduleLabel: 'Módulo de Facturación',
    historyTitle: 'Historial de Facturas',
    historyDescription: 'Gestioná, seguí y revisá el ciclo de facturación.',
    resultsLabel: 'resultados',
    themeLabel: 'Tema',
    totalOutstandingLabel: 'Total Pendiente',
    overdueAmountsLabel: 'Montos Vencidos',
    paid30Label: 'Pagado (Últimos 30 días)',
    openInvoicesText: 'facturas abiertas',
    overdueText: 'facturas requieren atención',
    paidText: 'facturas registradas',
    allStatuses: 'Todos los estados',
    paid: 'Pagado',
    pending: 'Pendiente',
    overdue: 'Vencido',
    last30Days: 'Últimos 30 días',
    last90Days: 'Últimos 90 días',
    thisYear: 'Este año',
    allTime: 'Todo el historial',
    refresh: 'Refrescar',
    searchPlaceholder: 'Buscar facturas...',
    invoiceNumber: 'Factura #',
    customer: 'Cliente',
    dateIssued: 'Fecha',
    amount: 'Monto',
    status: 'Estado',
    actions: 'Acciones',
    createInvoice: 'Nueva Factura',
    emitInvoice: 'Emitir Factura',
    filterAll: 'Todos',
    filterInvoiceNumber: 'Factura #',
    filterCustomer: 'Cliente',
    filterAmount: 'Monto',
    subtotal: 'Subtotal',
    iva: 'IVA (15%)',
    invoicePreview: 'Vista previa de factura',
    downloadPdf: 'Imprimir / Descargar PDF',
    close: 'Cerrar',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Facturas',
    sidebarCustomers: 'Clientes',
    sidebarProducts: 'Productos',
    sidebarEmployees: 'Empleados',
    sidebarInventory: 'Inventario',
    sidebarReports: 'Reportes',
    noInvoicesTitle: 'No hay facturas',
    noInvoicesText: 'Probá con otro filtro o término de búsqueda.',
    showingText: 'Mostrando',
    entriesText: 'registros',
    signOut: 'Cerrar sesión',
    settings: 'Configuración',
    notifications: 'Notificaciones',
    languageToggle: 'English',
    sessionLabel: 'Sesión',
    colProduct: 'Producto',
    colQty: 'Cant.',
    colUnitPrice: 'Precio Unitario',
    colTotal: 'Total',
  },
  en: {
    moduleLabel: 'Billing Module',
    historyTitle: 'Invoice History',
    historyDescription: 'Manage, track, and review your billing lifecycle.',
    resultsLabel: 'results',
    themeLabel: 'Theme',
    totalOutstandingLabel: 'Total Outstanding',
    overdueAmountsLabel: 'Overdue Amounts',
    paid30Label: 'Paid (Last 30 Days)',
    openInvoicesText: 'open invoices',
    overdueText: 'invoices need attention',
    paidText: 'invoices registered',
    allStatuses: 'All Statuses',
    paid: 'Paid',
    pending: 'Pending',
    overdue: 'Overdue',
    last30Days: 'Last 30 Days',
    last90Days: 'Last 90 Days',
    thisYear: 'This Year',
    allTime: 'All Time',
    refresh: 'Refresh',
    searchPlaceholder: 'Search invoices...',
    invoiceNumber: 'Invoice #',
    customer: 'Customer',
    dateIssued: 'Date',
    amount: 'Amount',
    status: 'Status',
    actions: 'Actions',
    createInvoice: 'New Invoice',
    emitInvoice: 'Issue Invoice',
    filterAll: 'All',
    filterInvoiceNumber: 'Invoice #',
    filterCustomer: 'Customer',
    filterAmount: 'Amount',
    subtotal: 'Subtotal',
    iva: 'VAT (15%)',
    invoicePreview: 'Invoice Preview',
    downloadPdf: 'Print / Download PDF',
    close: 'Close',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Invoices',
    sidebarCustomers: 'Customers',
    sidebarProducts: 'Products',
    sidebarEmployees: 'Employees',
    sidebarInventory: 'Inventory',
    sidebarReports: 'Reports',
    noInvoicesTitle: 'No invoices found',
    noInvoicesText: 'Try another filter or search term.',
    showingText: 'Showing',
    entriesText: 'entries',
    signOut: 'Sign out',
    settings: 'Settings',
    notifications: 'Notifications',
    languageToggle: 'Español',
    sessionLabel: 'Session',
    colProduct: 'Product',
    colQty: 'Qty.',
    colUnitPrice: 'Unit Price',
    colTotal: 'Total',
  },
};


@Component({
  selector: 'billflow-invoice-page',
  standalone: true,
  imports: [CommonModule, BillflowPageShellComponent, DashboardParticlesBackgroundComponent, BillflowMobileSidebarComponent, BillflowNotificationButtonComponent, BillflowUserMenuComponent, BillflowModalShellComponent],
  template: `
    <billflow-page-shell [items]="sidebarItems()" [actionLabel]="copy().createInvoice" actionIcon="add" (actionClick)="startNewInvoice()">
      <billflow-dashboard-particles-background class="app-invoice-bg"></billflow-dashboard-particles-background>

      <div class="flex-1 min-w-0 app-invoices-shell app-dashboard-main">
          <header class="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <div class="py-3 px-5 md:px-6 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3 shrink-0">
                <span class="hidden md:inline-flex lg:hidden">
                  <billflow-mobile-sidebar [items]="sidebarItems()" [actionLabel]="copy().createInvoice" actionIcon="add" (actionClick)="startNewInvoice()"></billflow-mobile-sidebar>
                </span>
                <span class="material-symbols-outlined text-outline">receipt_long</span>
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
                <h1 class="font-h1 text-h1 tracking-tight text-on-background">{{ copy().historyTitle }}</h1>
                <p class="mt-2 text-body-md text-on-surface-variant">{{ copy().historyDescription }}</p>
              </div>
              <div class="flex items-center gap-2 text-sm text-on-surface-variant">
                <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ filteredInvoices().length }} {{ copy().resultsLabel }}</span>
                <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ copy().themeLabel }}: {{ currentThemeLabel() }}</span>
              </div>
            </section>

            <section class="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
              <article class="dashboard-glass-card group rounded-2xl p-7 relative overflow-hidden">
                <div class="mb-4 flex items-start justify-between">
                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">{{ copy().totalOutstandingLabel }}</p>
                    <h2 class="mt-2 text-4xl font-extrabold text-on-background">{{ formatMoney(outstandingTotal()) }}</h2>
                  </div>
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span class="material-symbols-outlined">account_balance_wallet</span>
                  </div>
                </div>
                <p class="text-sm text-on-surface-variant">{{ outstandingCount() }} {{ copy().openInvoicesText }}</p>
              </article>

              <article class="dashboard-glass-card group rounded-2xl p-7 relative overflow-hidden">
                <div class="mb-4 flex items-start justify-between">
                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">{{ copy().overdueAmountsLabel }}</p>
                    <h2 class="mt-2 text-4xl font-extrabold text-error">{{ formatMoney(overdueTotal()) }}</h2>
                  </div>
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-error/10 text-error">
                    <span class="material-symbols-outlined">warning</span>
                  </div>
                </div>
                <p class="text-sm font-medium text-error">{{ overdueCount() }} {{ copy().overdueText }}</p>
              </article>

              <article class="dashboard-glass-card group rounded-2xl p-7 relative overflow-hidden">
                <div class="mb-4 flex items-start justify-between">
                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">{{ copy().paid30Label }}</p>
                    <h2 class="mt-2 text-4xl font-extrabold text-on-background">{{ formatMoney(paidLast30Days()) }}</h2>
                  </div>
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <span class="material-symbols-outlined">task_alt</span>
                  </div>
                </div>
                <p class="text-sm text-secondary">{{ paidCount30Days() }} {{ copy().paidText }}</p>
              </article>
            </section>

            <section class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden">
              <div class="dashboard-table-card__head p-6 md:p-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex flex-wrap items-center gap-3">
                  <select class="bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-sm py-1.5 px-4 text-on-surface font-medium focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" [value]="statusFilter()" (change)="setStatusFilter(($any($event.target).value))">
                    <option value="all">{{ copy().allStatuses }}</option>
                    <option value="paid">{{ copy().paid }}</option>
                    <option value="pending">{{ copy().pending }}</option>
                    <option value="overdue">{{ copy().overdue }}</option>
                  </select>

                  <select class="bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-sm py-1.5 px-4 text-on-surface font-medium focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" [value]="rangeFilter()" (change)="setRangeFilter(($any($event.target).value))">
                    <option value="30d">{{ copy().last30Days }}</option>
                    <option value="90d">{{ copy().last90Days }}</option>
                    <option value="year">{{ copy().thisYear }}</option>
                    <option value="all">{{ copy().allTime }}</option>
                  </select>

                  <button
                    type="button"
                    [title]="copy().refresh"
                    class="inline-flex items-center justify-center bg-surface-container-lowest border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm hover:border-primary hover:text-primary"
                    (click)="void reloadInvoices()"
                  >
                    <span
                      class="material-symbols-outlined text-[20px] transition-transform"
                      [style.animation]="loading() ? 'spin 0.7s linear infinite' : 'none'"
                    >refresh</span>
                  </button>

                  <button
                    type="button"
                    class="inline-flex items-center gap-2 bg-primary text-on-primary rounded-lg px-4 py-2 text-sm font-bold hover:opacity-90 transition-all shadow-sm"
                    (click)="startNewInvoice()"
                  >
                    <span class="material-symbols-outlined text-[18px]">add</span>
                    {{ copy().emitInvoice }}
                  </button>
                </div>

                <div class="flex items-center gap-3 w-full lg:w-auto">
                  <!-- Filter combobox -->
                  <select
                    class="bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-sm py-1.5 px-4 text-on-surface font-medium focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm shrink-0"
                    [value]="invoiceFilterField()"
                    (change)="setInvoiceFilterField(($any($event.target).value))"
                  >
                    <option value="all">{{ copy().filterAll }}</option>
                    <option value="invoiceNumber">{{ copy().filterInvoiceNumber }}</option>
                    <option value="customerName">{{ copy().filterCustomer }}</option>
                    <option value="total">{{ copy().filterAmount }}</option>
                  </select>

                  <div class="relative flex-1 lg:w-72">
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
                      <th class="dashboard-table-card__th p-4 pl-7 font-semibold">{{ copy().invoiceNumber }}</th>
                      <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().customer }}</th>
                      <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().dateIssued }}</th>
                      <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().amount }}</th>
                      <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().status }}</th>
                      <th class="dashboard-table-card__th p-4 pr-7 font-semibold text-right">{{ copy().actions }}</th>
                    </tr>
                  </thead>

                  <tbody class="font-body-sm text-body-sm">
                    <tr *ngFor="let invoice of paginatedInvoices()" class="dashboard-table-card__row group cursor-pointer" (click)="inspectInvoice(invoice)">
                      <td class="p-4 pl-7 font-semibold text-primary">{{ invoice.invoiceNumber }}</td>
                      <td class="p-4 text-on-surface-variant font-medium">
                        <div class="font-semibold text-on-background">{{ invoice.customerName || (locale() === 'es' ? 'Cliente sin nombre' : 'Unknown customer') }}</div>
                        <div class="mt-0.5 text-[13px] text-on-surface-variant">{{ invoice.id }}</div>
                      </td>
                      <td class="p-4 text-on-surface font-medium">{{ formatDate(invoice.invoiceDate) }}</td>
                      <td class="p-4 font-semibold text-on-surface">{{ formatMoney(invoice.total) }}</td>
                      <td class="p-4">
                        <span [ngClass]="statusClass(invoice.status)" class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold tracking-wide">
                          <span class="h-1.5 w-1.5 rounded-full" [ngClass]="statusDotClass(invoice.status)"></span>
                           {{ locale() === 'es' ? (invoice.status === 'paid' ? 'PAGADO' : invoice.status === 'pending' ? 'PENDIENTE' : 'VENCIDO') : invoice.statusLabel }}
                        </span>
                      </td>
                      <td class="p-4 pr-7 text-right">
                        <button
                          type="button"
                          class="inline-flex items-center gap-1 rounded-lg border border-outline-variant/60 px-3 py-2 text-xs font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary"
                          (click)="$event.stopPropagation(); openInvoicePreview(invoice)"
                        >
                          <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                          PDF
                        </button>
                      </td>
                    </tr>

                    <tr *ngIf="paginatedInvoices().length === 0">
                      <td colspan="6" class="p-8">
                        <div class="dashboard-table-card__empty dashboard-table-card__empty--stacked mt-2">
                          <span class="material-symbols-outlined dashboard-table-card__empty-icon">receipt_long</span>
                          <p class="dashboard-table-card__empty-title">{{ copy().noInvoicesTitle }}</p>
                          <p class="dashboard-table-card__empty-text">{{ copy().noInvoicesText }}</p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="flex flex-col gap-4 border-t border-outline-variant/40 bg-surface/60 p-5 md:flex-row md:items-center md:justify-between dark:bg-slate-900/60">
                <div class="flex items-center gap-3 text-sm text-on-surface-variant">
                  <span>
                    {{ copy().showingText }} <span class="font-semibold text-on-surface">{{ visibleRangeStart() }}</span> {{ locale() === 'es' ? 'a' : 'to' }} <span class="font-semibold text-on-surface">{{ visibleRangeEnd() }}</span> {{ locale() === 'es' ? 'de' : 'of' }} <span class="font-semibold text-on-surface">{{ filteredInvoices().length }}</span> {{ copy().entriesText }}
                  </span>
                  <!-- Page size selector -->
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

          <!-- ── Invoice Preview Modal ── -->
          <billflow-modal-shell
            *ngIf="invoicePreview()"
            title="{{ invoicePreview()?.invoiceNumber ?? '' }}"
            [subtitle]="copy().invoicePreview"
            icon="receipt_long"
            maxWidth="lg"
            [hasFooter]="true"
            (close)="closeInvoicePreview()"
          >
            <div class="p-6 space-y-6">
              <!-- Invoice Header Banner -->
              <div class="flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-4 border border-primary/10">
                <div class="flex items-center gap-2.5">
                  <span class="material-symbols-outlined text-primary text-[28px]">receipt_long</span>
                  <div>
                    <h4 class="font-bold text-lg text-on-surface leading-tight">BillFlow Inc.</h4>
                    <p class="text-xs text-on-surface-variant">{{ locale() === 'es' ? 'Comprobante Electrónico' : 'Electronic Invoice' }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <span
                    [ngClass]="statusClass(invoicePreview()?.status ?? 'paid')"
                    class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold tracking-wide"
                  >
                    <span class="h-1.5 w-1.5 rounded-full" [ngClass]="statusDotClass(invoicePreview()?.status ?? 'paid')"></span>
                    {{ invoicePreview()?.statusLabel ?? '' }}
                  </span>
                </div>
              </div>

              <!-- Customer & date row -->
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-surface-container/30 rounded-xl p-3 border border-outline-variant/20">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">{{ copy().customer }}</p>
                  <p class="text-sm font-bold text-on-surface leading-tight">{{ invoicePreview()?.customerName ?? '—' }}</p>
                  <p class="text-xs text-on-surface-variant mt-1 font-mono">{{ locale() === 'es' ? 'Cédula:' : 'ID:' }} {{ invoicePreview()?.customerCedula ?? '—' }}</p>
                </div>
                <div class="bg-surface-container/30 rounded-xl p-3 border border-outline-variant/20 flex flex-col justify-between">
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">{{ copy().dateIssued }}</p>
                    <p class="text-sm font-bold text-on-surface">{{ formatDate(invoicePreview()?.invoiceDate ?? '') }}</p>
                  </div>
                  <p class="text-xs text-on-surface-variant font-mono mt-1">Ref: {{ invoicePreview()?.id }}</p>
                </div>
              </div>

              <!-- Product lines Table -->
              <div class="space-y-2">
                <p class="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {{ locale() === 'es' ? 'Productos Comprados' : 'Purchased Products' }}
                </p>
                <div class="overflow-x-auto rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr class="bg-surface-container-low border-b border-outline-variant/40 font-bold text-[10px] uppercase tracking-wider text-on-surface-variant">
                        <th class="py-2.5 px-4">{{ copy().colProduct }}</th>
                        <th class="py-2.5 px-3 text-right">{{ copy().colQty }}</th>
                        <th class="py-2.5 px-3 text-right">{{ copy().colUnitPrice }}</th>
                        <th class="py-2.5 px-4 text-right">{{ copy().colTotal }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of invoicePreview()?.items" class="border-b border-outline-variant/20 last:border-0 hover:bg-primary/5 transition-colors">
                        <td class="py-2.5 px-4">
                          <p class="font-bold text-on-background leading-tight">{{ item.productName || (locale() === 'es' ? 'Producto sin nombre' : 'Unknown Product') }}</p>
                          <p class="text-[10px] text-on-surface-variant mt-0.5 font-mono">{{ item.productCode || item.productId }}</p>
                        </td>
                        <td class="py-2.5 px-3 text-right font-semibold text-on-surface-variant">{{ item.quantity }}</td>
                        <td class="py-2.5 px-3 text-right text-on-surface-variant">{{ formatMoney(item.unitPrice) }}</td>
                        <td class="py-2.5 px-4 text-right font-bold text-on-surface">{{ formatMoney(item.unitPrice * item.quantity) }}</td>
                      </tr>
                      <tr *ngIf="!invoicePreview()?.items || invoicePreview()?.items?.length === 0">
                        <td colspan="4" class="py-6 text-center text-on-surface-variant font-medium">
                          {{ locale() === 'es' ? 'No hay productos registrados en esta factura.' : 'No products registered in this invoice.' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Amount breakdown -->
              <div class="bg-surface-container-low/40 rounded-2xl p-4 border border-outline-variant/30 space-y-3">
                <div class="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>{{ copy().subtotal }}</span>
                  <span class="font-semibold text-on-surface">{{ formatMoney(invoicePreview()?.subtotal ?? 0) }}</span>
                </div>
                <div class="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>{{ copy().iva }}</span>
                  <span class="font-semibold text-on-surface">{{ formatMoney(invoicePreview()?.iva ?? 0) }}</span>
                </div>
                <hr class="border-outline-variant/30" />
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold text-on-surface">{{ copy().amount }}</span>
                  <span class="text-lg font-black text-primary">{{ formatMoney(invoicePreview()?.total ?? 0) }}</span>
                </div>
              </div>
            </div>

            <div footer class="flex w-full items-center justify-end gap-3">
              <button
                type="button"
                class="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all border border-outline-variant/50"
                (click)="closeInvoicePreview()"
              >
                {{ copy().close }}
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-primary text-on-primary hover:opacity-90 transition-all shadow-sm"
                (click)="downloadInvoicePdf(invoicePreview()?.id ?? '')"
              >
                <span class="material-symbols-outlined text-[18px]">print</span>
                {{ copy().downloadPdf }}
              </button>
            </div>
          </billflow-modal-shell>
          <!-- ── /Invoice Preview Modal ── -->

          <nav class="md:hidden app-dashboard-mobile-nav">
            <a *ngFor="let item of mobileNavItems()" class="flex flex-col items-center justify-center w-full h-full pt-1 border-t-2 transition-colors app-dashboard-mobile-link" [href]="item.href" [ngClass]="item.active ? 'text-primary border-primary app-dashboard-mobile-link--active' : 'border-transparent'">
              <span class="material-symbols-outlined" [style.font-variation-settings]="iconVariationSettings(item.active)">{{ item.icon }}</span>
              <span class="text-[10px] font-medium mt-1">{{ item.label }}</span>
            </a>

            <div class="app-dashboard-mobile-fab-wrap">
              <button type="button" class="w-14 h-14 bg-[#6862f3] text-white rounded-full shadow-lg shadow-[#6862f3]/30 flex items-center justify-center hover:bg-[#514be6] active:scale-95 transition-all border-[3px] border-surface" (click)="startNewInvoice()">
                <span class="material-symbols-outlined text-[24px]">add</span>
              </button>
            </div>
          </nav>
      </div>
    </billflow-page-shell>
  `,
})
export class InvoicePageComponent implements OnInit {
  private readonly api = inject(InvoiceApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);
  @ViewChild('userMenuPanel') private userMenuPanel?: ElementRef<HTMLElement>;

  locale = this.localeService.locale;
  copy = computed(() => INVOICE_TEXT[this.locale()]);

  readonly sidebarItems = computed(() => buildBillflowSidebarItems({
    dashboard: this.copy().sidebarDashboard,
    invoices: this.copy().sidebarInvoices,
    products: this.copy().sidebarProducts,
    customers: this.copy().sidebarCustomers,
    employees: this.copy().sidebarEmployees,
  }, 'invoices'));

  readonly mobileNavItems = computed<BillflowSidebarItem[]>(() => [
    { label: this.copy().sidebarDashboard, icon: 'dashboard', href: '/dashboard' },
    { label: this.copy().sidebarInvoices, icon: 'receipt_long', href: '/invoices', active: true },
    { label: this.copy().sidebarCustomers, icon: 'group', href: '/dashboard' },
    { label: this.copy().sidebarReports, icon: 'analytics', href: '/dashboard' },
  ]);

  theme = signal<'light' | 'dark'>('light');
  loading = signal(true);
  invoices = signal<InvoiceViewModel[]>([]);
  searchQuery = signal('');
  invoiceFilterField = signal<'all' | 'invoiceNumber' | 'customerName' | 'total'>('all');
  statusFilter = signal<'all' | InvoiceStatus>('all');
  rangeFilter = signal<InvoiceRange>('30d');
  page = signal(1);
  pageSize = signal(10);
  invoicePreview = signal<InvoiceViewModel | null>(null);
  displayName = 'Usuario';
  userInitials = 'US';
  userMenuVisible = signal(false);
  userMenuClosing = signal(false);
  userMenuOpen = signal(false);
  private userMenuCloseTimeout: number | undefined;

  readonly filteredInvoices = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filterField = this.invoiceFilterField();
    const status = this.statusFilter();
    const range = this.rangeFilter();
    const now = new Date();

    return this.invoices().filter((invoice) => {
      let matchesQuery = true;
      if (query) {
        switch (filterField) {
          case 'invoiceNumber':
            matchesQuery = invoice.invoiceNumber.toLowerCase().includes(query);
            break;
          case 'customerName':
            matchesQuery = (invoice.customerName ?? '').toLowerCase().includes(query);
            break;
          case 'total':
            matchesQuery = String(invoice.total).includes(query);
            break;
          default: // 'all'
            matchesQuery = [invoice.invoiceNumber, invoice.customerName ?? '', invoice.id, String(invoice.total), this.formatDate(invoice.invoiceDate)]
              .some((field) => field.toLowerCase().includes(query));
        }
      }
      const matchesStatus = status === 'all' || invoice.status === status;
      const matchesRange = this.matchesRange(invoice.invoiceDate, range, now);
      return matchesQuery && matchesStatus && matchesRange;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredInvoices().length / this.pageSize())));

  readonly paginatedInvoices = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredInvoices().slice(start, start + this.pageSize());
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

  readonly outstandingTotal = computed(() => this.invoices().filter((invoice) => invoice.status !== 'paid').reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0));
  readonly outstandingCount = computed(() => this.invoices().filter((invoice) => invoice.status !== 'paid').length);
  readonly overdueTotal = computed(() => this.invoices().filter((invoice) => invoice.status === 'overdue').reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0));
  readonly overdueCount = computed(() => this.invoices().filter((invoice) => invoice.status === 'overdue').length);
  readonly paidLast30Days = computed(() => this.invoices().filter((invoice) => invoice.status === 'paid' && this.isWithinDays(invoice.invoiceDate, 30)).reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0));
  readonly paidCount30Days = computed(() => this.invoices().filter((invoice) => invoice.status === 'paid' && this.isWithinDays(invoice.invoiceDate, 30)).length);

  async ngOnInit() {
    this.applyStoredTheme();
    this.applyStoredUser();
    if (typeof window !== 'undefined') document.documentElement.lang = this.locale();
    await this.reloadInvoices();
  }

  async reloadInvoices() {
    this.loading.set(true);
    try {
      const response = await this.api.listInvoices(150);
      const mapped = response.data
        .slice()
        .sort((left, right) => new Date(right.invoiceDate).getTime() - new Date(left.invoiceDate).getTime())
        .map((invoice) => this.mapInvoice(invoice));

      this.invoices.set(mapped);
      this.page.set(1);
    } catch {
      await this.feedback.alert('error', this.locale() === 'es' ? 'No se pudieron cargar las facturas' : 'Could not load invoices', this.locale() === 'es' ? 'Revisá la conexión con el backend.' : 'Please check the backend connection.');
    } finally {
      this.loading.set(false);
    }
  }

  toggleTheme() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.persistTheme(next);
  }

  toggleLocale() {
    this.localeService.toggle();
  }

  setSearchQuery(value: string) {
    this.searchQuery.set(value);
    this.page.set(1);
  }

  setInvoiceFilterField(value: string) {
    this.invoiceFilterField.set(value === 'invoiceNumber' || value === 'customerName' || value === 'total' ? value : 'all');
    this.page.set(1);
  }

  onPageSizeChange(event: Event) {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    if (!Number.isFinite(value) || value < 5) return;
    this.pageSize.set(value);
    this.page.set(1);
  }

  setStatusFilter(value: string) {
    this.statusFilter.set(value === 'paid' || value === 'pending' || value === 'overdue' ? value : 'all');
    this.page.set(1);
  }

  setRangeFilter(value: string) {
    this.rangeFilter.set(value === '30d' || value === '90d' || value === 'year' || value === 'all' ? value : '30d');
    this.page.set(1);
  }

  startNewInvoice() {
    if (typeof window !== 'undefined') {
      window.location.assign('/create-invoice');
    }
  }

  iconVariationSettings(active = false) {
    return active ? "'FILL' 1" : "'FILL' 0";
  }

  openNotifications() {
    void this.feedback.toast('info', this.copy().notifications, this.locale() === 'es' ? 'Tenés 3 movimientos críticos esperando revisión.' : 'You have 3 critical movements waiting for review.');
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

  async openUserSettings() {
    this.closeUserMenu();
    await this.feedback.alert('info', this.copy().settings, this.locale() === 'es' ? 'Acá podés actualizar tu perfil y preferencias.' : 'You can update your profile and preferences here.');
  }

  async logout() {
    this.closeUserMenu();
    const confirmed = await this.feedback.confirm(this.copy().signOut, this.locale() === 'es' ? '¿Seguro que querés salir del panel?' : 'Are you sure you want to leave the dashboard?', this.copy().signOut, this.locale() === 'es' ? 'Cancelar' : 'Cancel');
    if (!confirmed || typeof window === 'undefined') return;

    window.localStorage.removeItem('billflow-session');
    window.location.replace('/auth');
  }

  nextPage() {
    if (this.page() < this.totalPages()) this.page.update((value) => value + 1);
  }

  previousPage() {
    if (this.page() > 1) this.page.update((value) => value - 1);
  }

  goToPage(pageNumber: number) {
    this.page.set(pageNumber);
  }

  inspectInvoice(invoice: InvoiceViewModel) {
    void this.feedback.toast('info', invoice.invoiceNumber, `${invoice.customerName ?? (this.locale() === 'es' ? 'Cliente sin nombre' : 'Unknown customer')} · ${this.formatMoney(invoice.total)}`);
  }

  invoicePdfUrl(id: string) {
    return this.api.invoicePdfUrl(id);
  }

  openInvoicePreview(invoice: InvoiceViewModel) {
    this.invoicePreview.set(invoice);
  }

  closeInvoicePreview() {
    this.invoicePreview.set(null);
  }

  downloadInvoicePdf(id: string) {
    if (typeof window !== 'undefined') {
      window.open(this.invoicePdfUrl(id), '_blank', 'noopener');
    }
  }

  formatMoney(value: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
  }

  formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(this.locale() === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'medium' }).format(date);
  }

  statusClass(status: InvoiceStatus) {
    switch (status) {
      case 'overdue': return 'border-error/10 bg-error-container text-on-error-container';
      case 'pending': return 'border-secondary/10 bg-secondary-container/25 text-on-secondary-container';
      default: return 'border-outline-variant/40 bg-surface-container-high text-on-surface-variant';
    }
  }

  statusDotClass(status: InvoiceStatus) {
    switch (status) {
      case 'overdue': return 'bg-error';
      case 'pending': return 'bg-secondary';
      default: return 'bg-primary';
    }
  }

  currentThemeLabel() {
    return this.locale() === 'es'
      ? (this.theme() === 'dark' ? 'Modo oscuro' : 'Modo claro')
      : (this.theme() === 'dark' ? 'Dark mode' : 'Light mode');
  }

  visibleRangeStart() {
    if (this.filteredInvoices().length === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  visibleRangeEnd() {
    return Math.min(this.filteredInvoices().length, this.page() * this.pageSize());
  }

  private mapInvoice(invoice: InvoiceRowDto): InvoiceViewModel {
    const daysOld = this.daysBetween(new Date(invoice.invoiceDate), new Date());
    const status = this.resolveStatus(daysOld);
    return {
      ...invoice,
      status,
      daysOld,
      statusLabel: this.locale() === 'es' ? (status === 'paid' ? 'PAGADO' : status === 'pending' ? 'PENDIENTE' : 'VENCIDO') : (status === 'paid' ? 'PAID' : status === 'pending' ? 'PENDING' : 'OVERDUE'),
      statusTone: status,
    };
  }

  private resolveStatus(daysOld: number): InvoiceStatus {
    if (daysOld <= 2) return 'paid';
    if (daysOld <= 12) return 'pending';
    return 'overdue';
  }

  private matchesRange(value: string, range: InvoiceRange, now: Date) {
    if (range === 'all') return true;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;

    if (range === 'year') return date.getFullYear() === now.getFullYear();

    const days = this.daysBetween(date, now);
    return range === '30d' ? days <= 30 : days <= 90;
  }

  private isWithinDays(value: string, days: number) {
    return this.daysBetween(new Date(value), new Date()) <= days;
  }


  private applyStoredUser() {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem('billflow-session');
      if (!raw) return;

      const session = JSON.parse(raw) as { id?: string; employeeId?: string; email?: string; role?: string; user?: { name?: string; firstName?: string; fullName?: string } };
      const candidate = session.employeeId || session.id || session.email?.split('@')[0] || session.user?.fullName || session.user?.name || session.user?.firstName || 'Usuario';
      this.displayName = candidate === 'Usuario' ? candidate : candidate.toUpperCase();
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

  private daysBetween(start: Date, end: Date) {
    const a = new Date(start);
    const b = new Date(end);
    a.setHours(0, 0, 0, 0);
    b.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86400000));
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
