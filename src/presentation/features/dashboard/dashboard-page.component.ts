import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, Input } from '@angular/core';
import type { OnInit } from '@angular/core';
import { DashboardApiService, type CustomerRowDto, type DashboardStatsDto, type InvoiceRowDto, type ProductRowDto } from './dashboard-api.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { SessionService } from '../../shared/services/session.service';
import { ThemeService } from '../../shared/services/theme.service';
import { LocaleService } from '../../shared/services/locale.service';
import { BillflowSidebarComponent } from '../../shared/components/billflow-sidebar.component';
import { buildBillflowSidebarItems } from '../../shared/billflow-navigation';
import { BillflowNotificationButtonComponent } from '../../shared/components/billflow-notification-button.component';
import { BillflowUserMenuComponent } from '../../shared/components/billflow-user-menu.component';
import type { DashboardInitialData } from '../../shared/ssr-page-data';
import { DashboardRevenueChartComponent } from './dashboard-revenue-chart.component';

interface DashboardInvoice {
  id: string;
  number: string;
  customer: string;
  date: string;
  total: number;
}

interface DashboardProduct {
  rank: string;
  code: string;
  name: string;
  units: number;
  price: number;
}

interface DashboardCustomer {
  id: string;
  name: string;
  cedula: string;
  email?: string;
}

interface DashboardKpi {
  label: string;
  value: string;
  icon: string;
  tone: 'primary' | 'secondary' | 'tertiary' | 'neutral';
  trendIcon: string;
  trend: string;
  trendTone: 'success' | 'error' | 'neutral';
  note: string;
}

interface DashboardNavItem {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}

interface QuickAction {
  label: string;
  icon: string;
  tone: 'primary' | 'secondary' | 'tertiary';
}

type DashboardLocale = 'es' | 'en';

interface DashboardCopy {
  greeting: string;
  activitySummary: string;
  activeClients: string;
  searchPlaceholder: string;
  weekLabel: string;
  monthLabel: string;
  sidebarDashboard: string;
  sidebarInvoices: string;
  sidebarProducts: string;
  sidebarCustomers: string;
  sidebarEmployees: string;
  mobileHome: string;
  mobileMore: string;
  newSale: string;
  invoiceHeaderNumber: string;
  invoiceHeaderCustomer: string;
  invoiceHeaderDate: string;
  invoiceHeaderTotal: string;
  revenueTitle: string;
  invoicesTitle: string;
  invoicesViewAll: string;
  quickActionsTitle: string;
  quickActionNewInvoice: string;
  quickActionAddCustomer: string;
  quickActionAddProduct: string;
  quickActionEmployees: string;
  productsTitle: string;
  productsSubtitle: string;
  customersTitle: string;
  settingsLabel: string;
  noEmailText: string;
  notificationsTitle: string;
  notificationsText: string;
  settingsTitle: string;
  settingsText: string;
  logoutTitle: string;
  logoutText: string;
  logoutConfirm: string;
  logoutCancel: string;
  languageShort: string;
  languageToggleAria: string;
  kpiDailySalesLabel: string;
  kpiMonthlySalesLabel: string;
  kpiTotalInvoicesLabel: string;
  kpiLowStockLabel: string;
  kpiSyncedTrend: string;
  kpiOperationalTrend: string;
  kpiInventoryTrend: string;
  invoiceOverviewTitle: string;
  invoiceOverviewText: string;
  invoiceEmptyTitle: string;
  invoiceEmptyText: string;
  invoiceEmptySearchTitle: string;
  invoiceEmptySearchText: string;
  productsEmptyTitle: string;
  productsEmptyText: string;
  customersEmptyTitle: string;
  customersEmptyText: string;
}

const DASHBOARD_TEXT: Record<DashboardLocale, DashboardCopy> = {
  es: {
    greeting: 'Hola de nuevo',
    activitySummary: 'Resumen de actividad de hoy',
    activeClients: 'clientes activos',
    searchPlaceholder: 'Buscar facturas...',
    weekLabel: 'Esta Semana',
    monthLabel: 'Este Mes',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Facturas',
    sidebarProducts: 'Productos',
    sidebarCustomers: 'Clientes',
    sidebarEmployees: 'Empleados',
    mobileHome: 'Inicio',
    mobileMore: 'Más',
    newSale: 'Nueva Venta',
    invoiceHeaderNumber: 'Factura',
    invoiceHeaderCustomer: 'Cliente',
    invoiceHeaderDate: 'Fecha',
    invoiceHeaderTotal: 'Total',
    revenueTitle: 'Tendencia de Ingresos',
    invoicesTitle: 'Facturas Recientes',
    invoicesViewAll: 'Ver todas',
    quickActionsTitle: 'Acciones Rápidas',
    quickActionNewInvoice: 'Nueva Factura',
    quickActionAddCustomer: 'Añadir Cliente',
    quickActionAddProduct: 'Añadir Producto',
    quickActionEmployees: 'Gestionar Empleados',
    productsTitle: 'Productos',
    productsSubtitle: '(inventario actual)',
    customersTitle: 'Clientes recientes',
    settingsLabel: 'Configuración',
    noEmailText: 'Sin email',
    notificationsTitle: 'Notificaciones',
    notificationsText: 'Tienes 3 movimientos críticos pendientes de revisión.',
    settingsTitle: 'Configuración de usuario',
    settingsText: 'Aquí podrías ajustar tu perfil, contraseña y preferencias.',
    logoutTitle: 'Cerrar sesión',
    logoutText: '¿Seguro que quieres salir del dashboard?',
    logoutConfirm: 'Salir',
    logoutCancel: 'Cancelar',
    languageShort: 'ES',
    languageToggleAria: 'Cambiar idioma',
    kpiDailySalesLabel: 'Ventas del Día',
    kpiMonthlySalesLabel: 'Ventas del Mes',
    kpiTotalInvoicesLabel: 'Facturas Totales',
    kpiLowStockLabel: 'Stock Bajo',
    kpiSyncedTrend: 'Datos sincronizados',
    kpiOperationalTrend: 'Vista operativa',
    kpiInventoryTrend: 'Alertas de inventario',
    invoiceOverviewTitle: 'Facturas recientes',
    invoiceOverviewText: 'Mostrando el resumen operativo del día.',
    invoiceEmptyTitle: 'Sin facturas registradas',
    invoiceEmptyText: 'Aún no hay facturas para mostrar.',
    invoiceEmptySearchTitle: 'Sin resultados para esa búsqueda',
    invoiceEmptySearchText: 'Probá con otro número de factura, cliente o fecha.',
    productsEmptyTitle: 'Sin productos cargados',
    productsEmptyText: 'No hay productos disponibles para mostrar en este momento.',
    customersEmptyTitle: 'Sin clientes registrados',
    customersEmptyText: 'No hay clientes disponibles para mostrar en este momento.',
  },
  en: {
    greeting: 'Welcome back',
    activitySummary: 'Today activity summary',
    activeClients: 'active clients',
    searchPlaceholder: 'Search invoices...',
    weekLabel: 'This Week',
    monthLabel: 'This Month',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Invoices',
    sidebarProducts: 'Products',
    sidebarCustomers: 'Customers',
    sidebarEmployees: 'Employees',
    mobileHome: 'Home',
    mobileMore: 'More',
    newSale: 'New Sale',
    invoiceHeaderNumber: 'Invoice',
    invoiceHeaderCustomer: 'Customer',
    invoiceHeaderDate: 'Date',
    invoiceHeaderTotal: 'Total',
    revenueTitle: 'Revenue Trend',
    invoicesTitle: 'Recent Invoices',
    invoicesViewAll: 'View all',
    quickActionsTitle: 'Quick Actions',
    quickActionNewInvoice: 'New Invoice',
    quickActionAddCustomer: 'Add Customer',
    quickActionAddProduct: 'Add Product',
    quickActionEmployees: 'Manage Employees',
    productsTitle: 'Products',
    productsSubtitle: '(current inventory)',
    customersTitle: 'Recent Customers',
    settingsLabel: 'Settings',
    noEmailText: 'No email',
    notificationsTitle: 'Notifications',
    notificationsText: 'You have 3 critical movements waiting for review.',
    settingsTitle: 'User settings',
    settingsText: 'Here you could adjust your profile, password, and preferences.',
    logoutTitle: 'Sign out',
    logoutText: 'Are you sure you want to leave the dashboard?',
    logoutConfirm: 'Sign out',
    logoutCancel: 'Cancel',
    languageShort: 'EN',
    languageToggleAria: 'Change language',
    kpiDailySalesLabel: 'Daily Sales',
    kpiMonthlySalesLabel: 'Monthly Sales',
    kpiTotalInvoicesLabel: 'Total Invoices',
    kpiLowStockLabel: 'Low Stock',
    kpiSyncedTrend: 'Synced data',
    kpiOperationalTrend: 'Operational view',
    kpiInventoryTrend: 'Inventory alerts',
    invoiceOverviewTitle: 'Recent invoices',
    invoiceOverviewText: 'Showing today’s operational summary.',
    invoiceEmptyTitle: 'No invoices registered',
    invoiceEmptyText: 'There are no invoices to show yet.',
    invoiceEmptySearchTitle: 'No results for that search',
    invoiceEmptySearchText: 'Try another invoice number, customer, or date.',
    productsEmptyTitle: 'No products loaded',
    productsEmptyText: 'There are no products available to show right now.',
    customersEmptyTitle: 'No customers registered',
    customersEmptyText: 'There are no customers available to show right now.',
  },
};

@Component({
  selector: 'billflow-dashboard-page',
  standalone: true,
  imports: [CommonModule, BillflowSidebarComponent, BillflowNotificationButtonComponent, BillflowUserMenuComponent, DashboardRevenueChartComponent],
  host: { class: 'block w-full' },
  template: `
    <div class="app-dashboard-shell">
      <div *ngIf="tabletSidebarOpen()" class="app-dashboard-tablet-drawer lg:hidden">
        <button type="button" class="app-dashboard-tablet-drawer__backdrop" aria-label="Cerrar menú" (click)="closeTabletSidebar()"></button>
        <aside class="app-dashboard-tablet-drawer__panel app-dashboard-tablet-drawer__panel--open">
          <div class="app-dashboard-tablet-drawer__header">
            <div class="flex items-center gap-3 min-w-0">
              <span class="material-symbols-outlined text-primary text-[30px] filter drop-shadow-sm" style="font-variation-settings: 'FILL' 1;">point_of_sale</span>
              <div class="min-w-0">
                <h1 class="text-2xl font-black text-primary tracking-tight">BillFlow</h1>
                <p class="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-0.5">POS Terminal</p>
              </div>
            </div>
            <button type="button" class="app-dashboard-tablet-drawer__close" aria-label="Cerrar menú" (click)="closeTabletSidebar()">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="app-dashboard-tablet-drawer__nav space-y-1.5">
            <a *ngFor="let item of sidebarItems()" [href]="item.href" class="app-dashboard-tablet-drawer__link flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-95 app-dashboard-nav-link" [ngClass]="item.active ? 'bg-primary/10 text-primary font-bold app-dashboard-nav-link--active' : 'font-medium'" (click)="closeTabletSidebar()">
              <span class="material-symbols-outlined" [style.font-variation-settings]="themeService.iconVariationSettings(item.active)">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          </div>

          <div class="app-dashboard-tablet-drawer__actions">
            <button type="button" class="w-full py-3.5 px-4 bg-[#6862f3] text-white rounded-xl font-bold hover:bg-[#514be6] hover:shadow-lg hover:shadow-[#6862f3]/20 active:scale-95 transition-all flex items-center justify-center gap-2" (click)="startNewSale()">
              <span class="material-symbols-outlined text-[20px]">add</span>
              {{ copy().newSale }}
            </button>
          </div>
        </aside>
      </div>

      <billflow-sidebar [items]="sidebarItems()" [actionLabel]="copy().newSale" actionIcon="add" (actionClick)="startNewSale()"></billflow-sidebar>

      <main class="app-dashboard-main">
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-30 isolate overflow-visible min-w-0">
          <div class="flex items-start gap-3 min-w-0 flex-wrap">
            <button type="button" class="app-dashboard-tablet-menu hidden md:inline-flex lg:hidden shrink-0 mt-1" aria-label="Abrir menú" [attr.aria-expanded]="tabletSidebarOpen()" (click)="toggleTabletSidebar()">
              <span class="material-symbols-outlined">menu</span>
            </button>

            <div class="min-w-0">
              <h2 class="font-h2 text-h2 dashboard-gradient-text">{{ copy().greeting }}, {{ session.displayName() }}</h2>
              <p class="font-body-sm text-body-sm text-outline mt-1.5 font-medium">
                {{ copy().activitySummary }} · {{ stats()?.totalClientes ?? 0 }} {{ copy().activeClients }}
              </p>
            </div>
          </div>

          <div class="flex w-full md:w-auto items-center gap-2 md:gap-4 min-w-0">
            <div class="relative flex-1 min-w-0 md:w-72">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline/70">search</span>
              <input class="w-full min-w-0 pl-12 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-full text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" [placeholder]="copy().searchPlaceholder" type="text" [value]="searchQuery()" (input)="searchQuery.set(($any($event.target).value))" />
            </div>

              <div class="flex items-center justify-end gap-2 shrink-0 self-auto relative z-40">
                <billflow-notification-button (clicked)="session.openNotifications()"></billflow-notification-button>
                <billflow-user-menu
                  [displayName]="session.displayName()"
                  [initials]="session.userInitials()"
                  [showLanguageToggle]="true"
                  [languageLabel]="locale() === 'es' ? 'English' : 'Español'"
                  [settingsLabel]="copy().settingsLabel"
                  [logoutLabel]="copy().logoutConfirm"
                  [sessionLabel]="copy().settingsLabel"
                  (languageToggle)="toggleDashboardLocale()"
                  (settings)="session.openUserSettings()"
                  (logout)="session.logout()"
                ></billflow-user-menu>
              </div>
          </div>
        </header>

        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10">
          <div *ngFor="let kpi of kpis()" class="dashboard-kpi-card dashboard-glass-card rounded-2xl p-6 relative overflow-hidden group" [ngClass]="kpiCardTone(kpi.tone)">
            <div class="absolute top-0 right-0 w-40 h-40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:scale-125 transition-transform duration-700" [ngClass]="kpiBackground(kpi.tone)"></div>
            <div class="dashboard-kpi-header flex justify-between items-start mb-5 relative z-10 w-full gap-3">
              <div class="min-w-0 flex-1">
                <p class="font-label-bold text-label-bold text-outline uppercase tracking-[0.15em]">{{ kpi.label }}</p>
                <h3 class="font-h1 text-h1 text-on-background mt-2.5 tracking-tight">{{ kpi.value }}</h3>
              </div>
              <div class="dashboard-kpi-icon p-3 rounded-xl shadow-sm shrink-0 self-start" [ngClass]="kpiIconTone(kpi.tone)">
                <span class="material-symbols-outlined dashboard-kpi-icon__glyph" style="font-variation-settings: 'FILL' 1;">{{ kpi.icon }}</span>
              </div>
            </div>
            <div class="flex items-center text-sm font-medium relative z-10">
              <span class="material-symbols-outlined text-[18px] rounded-full p-0.5" [ngClass]="trendToneClass(kpi.trendTone)">{{ kpi.trendIcon }}</span>
              <span class="font-bold ml-2" [ngClass]="trendTextClass(kpi.trendTone)">{{ kpi.trend }}</span>
              <span class="text-outline/80 ml-2">{{ kpi.note }}</span>
            </div>
          </div>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          <div class="lg:col-span-2 space-y-8">
            @defer (on idle) {
              <billflow-dashboard-revenue-chart
                [invoices]="chartInvoices()"
                [locale]="locale()"
                [revenueTitle]="copy().revenueTitle"
                [weekLabel]="copy().weekLabel"
                [monthLabel]="copy().monthLabel"
              ></billflow-dashboard-revenue-chart>
            } @placeholder {
              <div class="dashboard-glass-card rounded-2xl p-7">
                <div class="flex justify-between items-center mb-8 gap-4">
                  <h3 class="font-h3 text-h3 text-on-background tracking-tight">{{ copy().revenueTitle }}</h3>
                  <div class="h-9 w-36 rounded-lg border border-outline-variant/60 bg-surface-container-lowest/80"></div>
                </div>
                <div class="app-dashboard-chart-wrap relative h-72 md:h-80 flex items-center justify-center rounded-2xl border border-outline-variant/30 bg-surface-container-low/30">
                  <div class="flex items-center gap-3 text-on-surface-variant">
                    <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    <span>{{ locale() === 'es' ? 'Cargando gráfico...' : 'Loading chart...' }}</span>
                  </div>
                </div>
              </div>
            }

            <div class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden">
              <div class="dashboard-table-card__head p-6 md:p-7 border-b border-outline-variant/30 flex justify-between items-center">
                <h3 class="font-h3 text-h3 text-on-background tracking-tight">{{ copy().invoicesTitle }}</h3>
                <button type="button" class="text-sm font-button text-primary hover:text-indigo-700 transition-colors flex items-center gap-1 group" (click)="showInvoiceOverview()">{{ copy().invoicesViewAll }} <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span></button>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="dashboard-table-card__head-row font-label-bold text-[11px] uppercase tracking-[0.1em]">
                      <th class="dashboard-table-card__th p-4 pl-7 font-semibold">{{ copy().invoiceHeaderNumber }}</th>
                      <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().invoiceHeaderCustomer }}</th>
                      <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().invoiceHeaderDate }}</th>
                      <th class="dashboard-table-card__th p-4 pr-7 font-semibold">{{ copy().invoiceHeaderTotal }}</th>
                    </tr>
                  </thead>
                  <tbody class="font-body-sm text-body-sm">
                    <tr *ngFor="let invoice of visibleInvoices()" class="dashboard-table-card__row group cursor-pointer" (click)="inspectInvoice(invoice)">
                      <td class="p-4 pl-7 font-semibold text-on-surface">{{ invoice.number }}</td>
                      <td class="p-4 text-on-surface-variant font-medium">{{ invoice.customer }}</td>
                      <td class="p-4 text-on-surface font-medium">{{ formatDate(invoice.date) }}</td>
                      <td class="p-4 pr-7 text-on-surface font-semibold">{{ formatMoney(invoice.total) }}</td>
                    </tr>
                    <tr *ngIf="filteredInvoices().length === 0">
                      <td colspan="4" class="p-8">
                        <div class="dashboard-table-card__empty">
                          <span class="material-symbols-outlined dashboard-table-card__empty-icon">{{ invoices().length === 0 ? 'database' : 'search_off' }}</span>
                          <p class="dashboard-table-card__empty-title">{{ invoices().length === 0 ? copy().invoiceEmptyTitle : copy().invoiceEmptySearchTitle }}</p>
                          <p class="dashboard-table-card__empty-text">{{ invoices().length === 0 ? copy().invoiceEmptyText : copy().invoiceEmptySearchText }}</p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="space-y-8">
            <div class="dashboard-glass-card rounded-2xl p-7">
              <h3 class="font-h3 text-h3 text-on-background mb-5 tracking-tight">{{ copy().quickActionsTitle }}</h3>
              <div class="flex flex-col gap-3.5">
                <button *ngFor="let action of quickActions()" type="button" class="app-dashboard-quick-action app-dashboard-quick-action--{{ action.tone }} w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-on-surface font-button text-button group" (click)="triggerQuickAction(action)">
                  <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined app-dashboard-quick-action__icon">{{ action.icon }}</span>
                    {{ action.label }}
                  </div>
                  <span class="material-symbols-outlined app-dashboard-quick-action__arrow">arrow_forward</span>
                </button>
              </div>
            </div>

            <div class="dashboard-glass-card rounded-2xl p-7">
              <h3 class="font-h3 text-h3 text-on-background mb-6 tracking-tight">{{ copy().productsTitle }} <span class="text-outline text-sm font-normal ml-1">{{ copy().productsSubtitle }}</span></h3>
              <ng-container *ngIf="topProducts().length > 0; else emptyProducts">
                <ul class="space-y-5">
                  <li *ngFor="let product of topProducts()" class="app-dashboard-list-item app-dashboard-list-item--product group cursor-pointer p-2 -mx-2 rounded-xl transition-all duration-200" (click)="inspectProduct(product)">
                    <div class="flex items-center gap-4">
                      <div class="w-11 h-11 rounded-xl bg-surface-container-high/60 flex items-center justify-center text-on-surface-variant font-bold text-sm shadow-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors">{{ product.rank }}</div>
                      <div>
                        <p class="font-body-sm text-body-sm text-on-surface font-semibold group-hover:text-primary transition-colors">{{ product.code }}</p>
                        <p class="font-label-bold text-[11px] text-outline mt-0.5 tracking-wide">{{ product.name }} · {{ product.units }} uds</p>
                      </div>
                    </div>
                    <span class="font-body-sm font-bold text-on-surface group-hover:text-primary transition-colors">{{ formatMoney(product.price) }}</span>
                  </li>
                </ul>
              </ng-container>
              <ng-template #emptyProducts>
                <div class="dashboard-table-card__empty dashboard-table-card__empty--stacked mt-2">
                  <span class="material-symbols-outlined dashboard-table-card__empty-icon">inventory_2</span>
                  <p class="dashboard-table-card__empty-title">{{ copy().productsEmptyTitle }}</p>
                  <p class="dashboard-table-card__empty-text">{{ copy().productsEmptyText }}</p>
                </div>
              </ng-template>
            </div>

            <div class="dashboard-glass-card rounded-2xl p-7">
              <h3 class="font-h3 text-h3 text-on-background mb-6 tracking-tight">{{ copy().customersTitle }}</h3>
              <ng-container *ngIf="recentCustomers().length > 0; else emptyCustomers">
                <ul class="space-y-4">
                  <li *ngFor="let customer of recentCustomers()" class="app-dashboard-list-item flex items-center justify-between gap-4 rounded-xl p-3 cursor-pointer transition-colors" (click)="inspectCustomer(customer)">
                    <div class="min-w-0">
                      <p class="font-semibold text-on-surface truncate">{{ customer.name }}</p>
                      <p class="text-xs text-outline mt-0.5">{{ customer.cedula }}</p>
                    </div>
                    <span class="text-xs font-medium text-on-surface-variant truncate max-w-28">{{ customer.email || copy().noEmailText }}</span>
                  </li>
                </ul>
              </ng-container>
              <ng-template #emptyCustomers>
                <div class="dashboard-table-card__empty dashboard-table-card__empty--stacked mt-2">
                  <span class="material-symbols-outlined dashboard-table-card__empty-icon">group_off</span>
                  <p class="dashboard-table-card__empty-title">{{ copy().customersEmptyTitle }}</p>
                  <p class="dashboard-table-card__empty-text">{{ copy().customersEmptyText }}</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </main>

      <nav class="md:hidden app-dashboard-mobile-nav">
        <a *ngFor="let item of mobileNavItems()" class="flex flex-col items-center justify-center w-full h-full pt-1 border-t-2 transition-colors app-dashboard-mobile-link" [href]="item.href" [ngClass]="item.active ? 'text-primary border-primary app-dashboard-mobile-link--active' : 'border-transparent'">
          <span class="material-symbols-outlined" [style.font-variation-settings]="themeService.iconVariationSettings(item.active)">{{ item.icon }}</span>
          <span class="text-[10px] font-medium mt-1">{{ item.label }}</span>
        </a>

        <div class="app-dashboard-mobile-fab-wrap">
          <button type="button" class="w-14 h-14 bg-[#6862f3] text-white rounded-full shadow-lg shadow-[#6862f3]/30 flex items-center justify-center hover:bg-[#514be6] active:scale-95 transition-all border-[3px] border-surface" (click)="startNewSale()">
            <span class="material-symbols-outlined text-[24px]">add</span>
          </button>
        </div>
      </nav>
    </div>
  `,
})
export class DashboardPageComponent implements OnInit {
  private readonly api = inject(DashboardApiService);
  private readonly feedback = inject(UiFeedbackService);
  protected readonly session = inject(SessionService);
  protected readonly themeService = inject(ThemeService);
  private readonly localeService = inject(LocaleService);

  locale = this.localeService.locale;
  copy = computed(() => DASHBOARD_TEXT[this.locale()]);
  tabletSidebarOpen = signal(false);
  loading = signal(false);
  stats = signal<DashboardStatsDto | null>(null);
  invoices = signal<DashboardInvoice[]>([]);
  chartInvoices = signal<DashboardInvoice[]>([]);
  products = signal<DashboardProduct[]>([]);
  customers = signal<DashboardCustomer[]>([]);
  searchQuery = signal('');
  private hasInitialData = false;

  @Input() set initialData(value: DashboardInitialData | null | undefined) {
    if (!value) return;
    this.hasInitialData = true;
    this.stats.set(value.stats);
    this.invoices.set(value.invoices);
    this.chartInvoices.set(value.invoices);
    this.products.set(value.products);
    this.customers.set(value.customers);
    this.loading.set(false);
  }

  readonly sidebarItems = computed(() => buildBillflowSidebarItems({
    dashboard: this.copy().sidebarDashboard,
    invoices: this.copy().sidebarInvoices,
    products: this.copy().sidebarProducts,
    customers: this.copy().sidebarCustomers,
    employees: this.copy().sidebarEmployees,
  }, 'dashboard'));

  readonly mobileNavItems = computed<DashboardNavItem[]>(() => {
    const copy = this.copy();
    return [
      { label: copy.mobileHome, icon: 'dashboard', href: '#', active: true },
      { label: copy.sidebarInvoices, icon: 'receipt_long', href: '/invoices' },
      { label: copy.sidebarCustomers, icon: 'groups', href: '#' },
      { label: copy.mobileMore, icon: 'menu', href: '#' },
    ];
  });

  readonly kpis = computed<DashboardKpi[]>(() => {
    const stats = this.stats();
    const copy = this.copy();
    return [
      { label: copy.kpiDailySalesLabel, value: this.formatMoney(stats?.ventasDelDia ?? 0), icon: 'payments', tone: 'primary', trendIcon: 'trending_up', trend: copy.kpiSyncedTrend, trendTone: 'success', note: '' },
      { label: copy.kpiMonthlySalesLabel, value: this.formatMoney(stats?.ventasDelMes ?? 0), icon: 'receipt_long', tone: 'secondary', trendIcon: 'trending_up', trend: copy.kpiSyncedTrend, trendTone: 'success', note: '' },
      { label: copy.kpiTotalInvoicesLabel, value: String(stats?.totalFacturas ?? 0), icon: 'receipt_long', tone: 'tertiary', trendIcon: 'dataset', trend: copy.kpiOperationalTrend, trendTone: 'neutral', note: '' },
      { label: copy.kpiLowStockLabel, value: String(stats?.productosConStockBajo ?? 0), icon: 'inventory_2', tone: 'neutral', trendIcon: 'warning', trend: copy.kpiInventoryTrend, trendTone: 'error', note: '' },
    ];
  });

  readonly quickActions = computed<QuickAction[]>(() => {
    const copy = this.copy();
    return [
      { label: copy.quickActionNewInvoice, icon: 'post_add', tone: 'primary' },
      { label: copy.quickActionAddCustomer, icon: 'person_add', tone: 'secondary' },
      { label: copy.quickActionAddProduct, icon: 'add_box', tone: 'tertiary' },
      { label: copy.quickActionEmployees, icon: 'badge', tone: 'secondary' },
    ];
  });

  readonly filteredInvoices = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const invoices = this.invoices();
    if (!query) return invoices;
    return invoices.filter((invoice) => [invoice.number, invoice.customer, invoice.date, String(invoice.total)].some((field) => field.toLowerCase().includes(query)));
  });

  readonly visibleInvoices = computed(() => this.filteredInvoices()
    .slice()
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 5));

  readonly topProducts = computed(() => this.products().slice(0, 3).map((product, index) => ({
    rank: String(index + 1).padStart(2, '0'),
    code: product.code,
    name: product.name,
    units: product.availableQuantity,
    price: product.price,
  })));

  readonly recentCustomers = computed(() => this.customers().slice(0, 4));

  async ngOnInit() {
    if (typeof window === 'undefined') {
      return;
    }

    this.themeService.init();
    this.session.init();
    document.documentElement.lang = this.locale();
    window.localStorage.setItem('billflow-lang', this.locale());

    if (this.hasInitialData) return;

    try {
      if (!this.session.hasStoredSession()) {
        window.location.assign('/auth');
        return;
      }

      await this.loadDashboardData();
    } catch {
      window.location.assign('/auth');
    }
  }

  private async loadDashboardData() {
    this.loading.set(true);
    try {
      const [statsResult, invoicesResult, productsResult, customersResult] = await Promise.allSettled([
        this.api.getStats(),
        this.api.listInvoices(150),
        this.api.listProducts(8),
        this.api.listCustomers(8),
      ]);

      if (statsResult.status === 'fulfilled') {
        this.stats.set(statsResult.value);
      }

      if (invoicesResult.status === 'fulfilled') {
        this.invoices.set(invoicesResult.value.data.map((invoice) => this.mapInvoice(invoice)));
        this.chartInvoices.set(invoicesResult.value.data.map((invoice) => this.mapInvoice(invoice)));
      }

      if (productsResult.status === 'fulfilled') {
        this.products.set(productsResult.value.data.map((product) => this.mapProduct(product)));
      }

      if (customersResult.status === 'fulfilled') {
        this.customers.set(customersResult.value.data.map((customer) => this.mapCustomer(customer)));
      }

      if ([statsResult, invoicesResult, productsResult, customersResult].some((result) => result.status === 'rejected')) {
        await this.feedback.toast('warning', 'Datos parciales', 'Algunos módulos no pudieron cargarse.');
      }
    } catch {
      await this.feedback.alert('error', 'No se pudo cargar el dashboard', 'Revisá la conexión del sistema.');
    } finally {
      this.loading.set(false);
    }
  }

  startNewSale() {
    if (typeof window !== 'undefined') {
      window.location.assign('/create-invoice');
    }
  }

  toggleDashboardLocale() {
    this.localeService.toggle();
  }

  toggleTabletSidebar() {
    this.tabletSidebarOpen.update((current) => !current);
  }

  closeTabletSidebar() {
    this.tabletSidebarOpen.set(false);
  }

  async showInvoiceOverview() {
    await this.feedback.toast('info', this.copy().invoiceOverviewTitle, this.copy().invoiceOverviewText);
  }

  async inspectInvoice(invoice: DashboardInvoice) {
    await this.feedback.alert('info', invoice.number, `${invoice.customer} · ${this.formatDate(invoice.date)} · ${this.formatMoney(invoice.total)}`);
  }

  async inspectProduct(product: DashboardProduct) {
    await this.feedback.toast('info', product.name, `${product.units} uds · ${this.formatMoney(product.price)}`);
  }

  async inspectCustomer(customer: DashboardCustomer) {
    await this.feedback.alert('info', customer.name, `${customer.cedula}${customer.email ? ` · ${customer.email}` : ''}`);
  }

  async triggerQuickAction(action: QuickAction) {
    if (typeof window === 'undefined') return;

    switch (action.icon) {
      case 'post_add':
        window.location.assign('/create-invoice');
        break;
      case 'person_add':
        window.location.assign('/customers');
        break;
      case 'add_box':
        window.location.assign('/products');
        break;
      case 'badge':
        window.location.assign('/employees');
        break;
    }
  }

  kpiBackground(tone: DashboardKpi['tone']) {
    return {
      'bg-primary/5': tone === 'primary',
      'bg-secondary/5': tone === 'secondary',
      'bg-tertiary/5': tone === 'tertiary',
      'bg-surface-tint/5': tone === 'neutral',
    };
  }

  kpiIconTone(tone: DashboardKpi['tone']) {
    return {
      'bg-primary-fixed/60 text-primary': tone === 'primary',
      'bg-secondary-fixed/60 text-secondary': tone === 'secondary',
      'bg-tertiary-fixed/60 text-tertiary': tone === 'tertiary',
      'bg-primary/10 text-primary': tone === 'neutral',
    };
  }

  kpiCardTone(tone: DashboardKpi['tone']) {
    return {
      'dashboard-kpi-card--primary': tone === 'primary',
      'dashboard-kpi-card--secondary': tone === 'secondary',
      'dashboard-kpi-card--tertiary': tone === 'tertiary',
      'dashboard-kpi-card--neutral': tone === 'neutral',
    };
  }

  trendToneClass(tone: DashboardKpi['trendTone']) {
    return {
      'text-[#10b981] bg-[#10b981]/10': tone === 'success',
      'text-error bg-error/10': tone === 'error',
      'text-outline bg-outline/10': tone === 'neutral',
    };
  }

  trendTextClass(tone: DashboardKpi['trendTone']) {
    return {
      'text-[#10b981]': tone === 'success',
      'text-error': tone === 'error',
      'text-outline': tone === 'neutral',
    };
  }

  statusToneClass(tone: 'success' | 'warning' | 'error') {
    return {
      'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20': tone === 'success',
      'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20': tone === 'warning',
      'bg-error/10 text-error border border-error/20': tone === 'error',
    };
  }

  formatMoney(value: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
  }

  formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(date);
  }

  private mapInvoice(invoice: InvoiceRowDto): DashboardInvoice {
    return {
      id: invoice.id,
      number: invoice.invoiceNumber,
      customer: invoice.customerName || 'Cliente sin nombre',
      date: invoice.invoiceDate,
      total: invoice.total,
    };
  }

  private mapProduct(product: ProductRowDto): DashboardProduct {
    const rawPrice = product.unitPrice ?? product.price ?? 0;
    return {
      rank: '00',
      code: product.code,
      name: product.name,
      units: Number(product.availableQuantity ?? 0),
      price: Number(rawPrice),
    };
  }

  private mapCustomer(customer: CustomerRowDto): DashboardCustomer {
    return {
      id: customer.id,
      name: `${customer.name} ${customer.lastName}`.trim(),
      cedula: customer.cedula,
      email: customer.email,
    };
  }
}
