import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import type { OnInit } from '@angular/core';
import { DashboardApiService, type CustomerRowDto, type DashboardStatsDto, type InvoiceRowDto, type ProductRowDto } from './dashboard-api.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';

type Period = 'week' | 'month';

interface DashboardInvoice {
  id: string;
  number: string;
  customer: string;
  date: string;
  total: number;
}

interface DashboardProduct {
  rank: string;
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
  activeClients: string;
  searchPlaceholder: string;
  revenueTitle: string;
  invoicesTitle: string;
  invoicesViewAll: string;
  quickActionsTitle: string;
  productsTitle: string;
  productsSubtitle: string;
  customersTitle: string;
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
    activeClients: 'clientes activos',
    searchPlaceholder: 'Buscar facturas...',
    revenueTitle: 'Tendencia de Ingresos',
    invoicesTitle: 'Facturas Recientes',
    invoicesViewAll: 'Ver todas',
    quickActionsTitle: 'Acciones Rápidas',
    productsTitle: 'Productos',
    productsSubtitle: '(inventario actual)',
    customersTitle: 'Clientes recientes',
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
    activeClients: 'active clients',
    searchPlaceholder: 'Search invoices...',
    revenueTitle: 'Revenue Trend',
    invoicesTitle: 'Recent Invoices',
    invoicesViewAll: 'View all',
    quickActionsTitle: 'Quick Actions',
    productsTitle: 'Products',
    productsSubtitle: '(current inventory)',
    customersTitle: 'Recent Customers',
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

function detectDashboardLocale(): DashboardLocale {
  if (typeof window === 'undefined') return 'es';
  const stored = window.localStorage.getItem('billflow-lang');
  if (stored === 'es' || stored === 'en') return stored;
  const browser = (window.navigator.language || window.navigator.languages?.[0] || 'es').toLowerCase();
  return browser.startsWith('en') ? 'en' : 'es';
}

@Component({
  selector: 'billflow-dashboard-page',
  standalone: true,
  imports: [CommonModule],
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
            <a *ngFor="let item of sidebarItems" [href]="item.href" class="app-dashboard-tablet-drawer__link flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-95 app-dashboard-nav-link" [ngClass]="item.active ? 'bg-primary/10 text-primary font-bold app-dashboard-nav-link--active' : 'font-medium'" (click)="closeTabletSidebar()">
              <span class="material-symbols-outlined" [style.font-variation-settings]="iconVariationSettings(item.active)">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          </div>

          <div class="app-dashboard-tablet-drawer__actions">
            <button type="button" class="w-full py-3.5 px-4 bg-[#6862f3] text-white rounded-xl font-bold hover:bg-[#514be6] hover:shadow-lg hover:shadow-[#6862f3]/20 active:scale-95 transition-all flex items-center justify-center gap-2" (click)="startNewSale()">
              <span class="material-symbols-outlined text-[20px]">add</span>
              Nueva Venta
            </button>
          </div>
        </aside>
      </div>

      <nav class="hidden lg:flex app-dashboard-sidebar">
        <div class="mb-10 flex items-center gap-3 px-2">
          <span class="material-symbols-outlined text-primary text-[32px] filter drop-shadow-sm" style="font-variation-settings: 'FILL' 1;">point_of_sale</span>
          <div>
            <h1 class="text-2xl font-black text-primary tracking-tight">BillFlow</h1>
            <p class="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-0.5">POS Terminal</p>
          </div>
        </div>

        <div class="flex-1 space-y-1.5">
          <a *ngFor="let item of sidebarItems" [href]="item.href" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-95 app-dashboard-nav-link" [ngClass]="item.active ? 'bg-primary/10 text-primary font-bold app-dashboard-nav-link--active' : 'font-medium'">
            <span class="material-symbols-outlined" [style.font-variation-settings]="iconVariationSettings(item.active)">{{ item.icon }}</span>
            {{ item.label }}
          </a>
        </div>

        <div class="mt-auto pt-6">
          <button type="button" class="w-full py-3.5 px-4 bg-[#6862f3] text-white rounded-xl font-bold hover:bg-[#514be6] hover:shadow-lg hover:shadow-[#6862f3]/20 active:scale-95 transition-all flex items-center justify-center gap-2" (click)="startNewSale()">
            <span class="material-symbols-outlined text-[20px]">add</span>
            Nueva Venta
          </button>
        </div>
      </nav>

      <main class="app-dashboard-main">
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-30 isolate overflow-visible min-w-0">
          <div class="flex items-start gap-3 min-w-0 flex-wrap">
            <button type="button" class="app-dashboard-tablet-menu hidden md:inline-flex lg:hidden shrink-0 mt-1" aria-label="Abrir menú" [attr.aria-expanded]="tabletSidebarOpen()" (click)="toggleTabletSidebar()">
              <span class="material-symbols-outlined">menu</span>
            </button>

            <div class="min-w-0">
              <h2 class="font-h2 text-h2 dashboard-gradient-text">{{ locale() === 'es' ? 'Hola de nuevo' : 'Welcome back' }}, {{ displayName }}</h2>
              <p class="font-body-sm text-body-sm text-outline mt-1.5 font-medium">
                {{ locale() === 'es' ? 'Resumen de actividad de hoy' : 'Today activity summary' }} · {{ stats()?.totalClientes ?? 0 }} {{ copy().activeClients }}
              </p>
            </div>
          </div>

          <div class="flex w-full md:w-auto items-center gap-2 md:gap-4 min-w-0">
            <div class="relative flex-1 min-w-0 md:w-72">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline/70">search</span>
              <input class="w-full min-w-0 pl-12 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-full text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" [placeholder]="copy().searchPlaceholder" type="text" [value]="searchQuery()" (input)="searchQuery.set(($any($event.target).value))" />
            </div>

            <div class="flex items-center justify-end gap-2 shrink-0 self-auto relative z-40">
              <button type="button" class="app-dashboard-notification-button relative bg-surface-container-lowest border border-outline-variant/60 hover:bg-surface-container-low transition-colors text-on-surface shadow-sm hover:shadow" (click)="showNotifications()">
                <span class="material-symbols-outlined text-[22px]">notifications</span>
                <span class="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-white"></span>
              </button>

              <button type="button" class="app-dashboard-user-badge bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shadow-sm hover:bg-primary/20 transition-colors cursor-pointer" (click)="toggleUserMenu($event)" [attr.aria-expanded]="userMenuOpen()" aria-haspopup="menu">
                {{ userInitials }}
              </button>

              <div *ngIf="userMenuVisible()" #userMenuPanel class="app-dashboard-user-menu" [class.app-dashboard-user-menu--exit]="userMenuClosing()" role="menu">
                <button type="button" class="app-dashboard-user-menu__backdrop" aria-label="Cerrar menú" (click)="closeUserMenu()"></button>
                <div class="app-dashboard-user-menu__panel">
                  <div class="app-dashboard-user-menu__header">
                    <div class="app-dashboard-user-menu__avatar">{{ userInitials }}</div>
                    <div class="min-w-0">
                      <p class="app-dashboard-user-menu__title">{{ displayName }}</p>
                      <p class="app-dashboard-user-menu__subtitle">{{ locale() === 'es' ? 'Opciones de cuenta' : 'Account options' }}</p>
                    </div>
                  </div>

                  <button type="button" class="app-dashboard-user-menu__item" role="menuitem" (click)="toggleDashboardLocale()">
                    <span class="material-symbols-outlined">language</span>
                    <span>{{ locale() === 'es' ? 'English' : 'Español' }}</span>
                  </button>

                  <button type="button" class="app-dashboard-user-menu__item" role="menuitem" (click)="openUserSettings()">
                    <span class="material-symbols-outlined">settings</span>
                    <span>{{ locale() === 'es' ? 'Configuración' : 'Settings' }}</span>
                  </button>
                  <button type="button" class="app-dashboard-user-menu__item app-dashboard-user-menu__item--danger" role="menuitem" (click)="logout()">
                    <span class="material-symbols-outlined">logout</span>
                    <span>{{ locale() === 'es' ? 'Cerrar sesión' : 'Sign out' }}</span>
                  </button>
                </div>
              </div>
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
            <div class="dashboard-glass-card rounded-2xl p-7">
              <div class="flex justify-between items-center mb-8 gap-4">
                <h3 class="font-h3 text-h3 text-on-background tracking-tight">{{ copy().revenueTitle }}</h3>
                <select class="bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-sm py-1.5 px-4 text-on-surface font-medium focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" [value]="period()" (change)="setPeriod(($any($event.target).value))">
                  <option value="week">{{ locale() === 'es' ? 'Esta Semana' : 'This Week' }}</option>
                  <option value="month">{{ locale() === 'es' ? 'Este Mes' : 'This Month' }}</option>
                </select>
              </div>

              <div class="h-64 flex items-end justify-between gap-3 pb-6 relative">
                <div class="absolute inset-0 flex flex-col justify-between z-0 pb-6 pointer-events-none">
                  <div class="w-full border-b border-outline-variant/10 h-0 border-dashed"></div>
                  <div class="w-full border-b border-outline-variant/10 h-0 border-dashed"></div>
                  <div class="w-full border-b border-outline-variant/10 h-0 border-dashed"></div>
                  <div class="w-full border-b border-outline-variant/10 h-0 border-dashed"></div>
                  <div class="w-full border-b border-outline-variant/30 h-0"></div>
                </div>

                <div *ngFor="let bar of chartBars()" class="dashboard-chart-bar rounded-t-lg relative z-10 group cursor-pointer min-h-[4px] flex-1" [style.height.%]="bar.height" [attr.aria-label]="bar.label" (click)="showPeriodDetail(bar.label, bar.value)">
                  <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{{ bar.value }}</div>
                </div>
              </div>

              <div class="flex justify-between text-[13px] font-medium text-outline mt-1 px-3">
                <span *ngFor="let bar of chartBars()">{{ bar.label }}</span>
              </div>
            </div>

            <div class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden">
              <div class="dashboard-table-card__head p-6 md:p-7 border-b border-outline-variant/30 flex justify-between items-center">
                <h3 class="font-h3 text-h3 text-on-background tracking-tight">{{ copy().invoicesTitle }}</h3>
                <button type="button" class="text-sm font-button text-primary hover:text-indigo-700 transition-colors flex items-center gap-1 group" (click)="showInvoiceOverview()">{{ copy().invoicesViewAll }} <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span></button>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="dashboard-table-card__head-row font-label-bold text-[11px] uppercase tracking-[0.1em]">
                      <th class="dashboard-table-card__th p-4 pl-7 font-semibold">{{ locale() === 'es' ? 'Factura' : 'Invoice' }}</th>
                      <th class="dashboard-table-card__th p-4 font-semibold">{{ locale() === 'es' ? 'Cliente' : 'Customer' }}</th>
                      <th class="dashboard-table-card__th p-4 font-semibold">{{ locale() === 'es' ? 'Fecha' : 'Date' }}</th>
                      <th class="dashboard-table-card__th p-4 pr-7 font-semibold">{{ locale() === 'es' ? 'Total' : 'Total' }}</th>
                    </tr>
                  </thead>
                  <tbody class="font-body-sm text-body-sm">
                    <tr *ngFor="let invoice of filteredInvoices()" class="dashboard-table-card__row group cursor-pointer" (click)="inspectInvoice(invoice)">
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
                <button *ngFor="let action of quickActions" type="button" class="app-dashboard-quick-action app-dashboard-quick-action--{{ action.tone }} w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-on-surface font-button text-button group" (click)="triggerQuickAction(action)">
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
                  <li *ngFor="let product of topProducts()" class="app-dashboard-list-item group cursor-pointer p-2 -mx-2 rounded-xl transition-colors" (click)="inspectProduct(product)">
                    <div class="flex items-center gap-4">
                      <div class="w-11 h-11 rounded-xl bg-surface-container-high/60 flex items-center justify-center text-on-surface-variant font-bold text-sm shadow-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors">{{ product.rank }}</div>
                      <div>
                        <p class="font-body-sm text-body-sm text-on-surface font-semibold group-hover:text-primary transition-colors">{{ product.name }}</p>
                        <p class="font-label-bold text-[11px] text-outline mt-0.5 tracking-wide">{{ product.units }} uds</p>
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
                    <span class="text-xs font-medium text-on-surface-variant truncate max-w-28">{{ customer.email || 'Sin email' }}</span>
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
        <a *ngFor="let item of mobileNavItems" class="flex flex-col items-center justify-center w-full h-full pt-1 border-t-2 transition-colors app-dashboard-mobile-link" [href]="item.href" [ngClass]="item.active ? 'text-primary border-primary app-dashboard-mobile-link--active' : 'border-transparent'">
          <span class="material-symbols-outlined" [style.font-variation-settings]="iconVariationSettings(item.active)">{{ item.icon }}</span>
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
  @ViewChild('userMenuPanel') private userMenuPanel?: ElementRef<HTMLElement>;
  private userMenuCloseTimeout?: number;

  locale = signal<DashboardLocale>(detectDashboardLocale());
  copy = computed(() => DASHBOARD_TEXT[this.locale()]);
  displayName = 'Usuario';
  userInitials = 'CA';
  tabletSidebarOpen = signal(false);
  userMenuOpen = signal(false);
  userMenuVisible = signal(false);
  userMenuClosing = signal(false);
  loading = signal(true);
  stats = signal<DashboardStatsDto | null>(null);
  invoices = signal<DashboardInvoice[]>([]);
  products = signal<DashboardProduct[]>([]);
  customers = signal<DashboardCustomer[]>([]);
  period = signal<Period>('week');
  searchQuery = signal('');

  readonly sidebarItems: DashboardNavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', href: '#', active: true },
    { label: 'Facturas', icon: 'receipt_long', href: '#' },
    { label: 'Productos', icon: 'inventory_2', href: '#' },
    { label: 'Clientes', icon: 'groups', href: '#' },
    { label: 'Empleados', icon: 'badge', href: '#' },
  ];

  readonly mobileNavItems: DashboardNavItem[] = [
    { label: 'Inicio', icon: 'dashboard', href: '#', active: true },
    { label: 'Facturas', icon: 'receipt_long', href: '#' },
    { label: 'Clientes', icon: 'groups', href: '#' },
    { label: 'Más', icon: 'menu', href: '#' },
  ];

  readonly kpis = computed<DashboardKpi[]>(() => {
    const stats = this.stats();
    return [
      { label: 'Ventas del Día', value: this.formatMoney(stats?.ventasDelDia ?? 0), icon: 'payments', tone: 'primary', trendIcon: 'trending_up', trend: 'Datos sincronizados', trendTone: 'success', note: '' },
      { label: 'Ventas del Mes', value: this.formatMoney(stats?.ventasDelMes ?? 0), icon: 'receipt_long', tone: 'secondary', trendIcon: 'trending_up', trend: 'Datos sincronizados', trendTone: 'success', note: '' },
      { label: 'Facturas Totales', value: String(stats?.totalFacturas ?? 0), icon: 'receipt_long', tone: 'tertiary', trendIcon: 'dataset', trend: 'Vista operativa', trendTone: 'neutral', note: '' },
      { label: 'Stock Bajo', value: String(stats?.productosConStockBajo ?? 0), icon: 'inventory_2', tone: 'neutral', trendIcon: 'warning', trend: 'Alertas de inventario', trendTone: 'error', note: '' },
    ];
  });

  readonly quickActions: QuickAction[] = [
    { label: 'Nueva Factura', icon: 'post_add', tone: 'primary' },
    { label: 'Añadir Cliente', icon: 'person_add', tone: 'secondary' },
    { label: 'Añadir Producto', icon: 'add_box', tone: 'tertiary' },
  ];

  readonly chartBars = computed(() => this.buildChartBars());

  readonly filteredInvoices = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const invoices = this.invoices();
    if (!query) return invoices;
    return invoices.filter((invoice) => [invoice.number, invoice.customer, invoice.date, String(invoice.total)].some((field) => field.toLowerCase().includes(query)));
  });

  readonly topProducts = computed(() => this.products().slice(0, 3).map((product, index) => ({
    rank: String(index + 1).padStart(2, '0'),
    name: product.name,
    units: product.availableQuantity,
    price: product.unitPrice,
  })));

  readonly recentCustomers = computed(() => this.customers().slice(0, 4));

  ngOnInit() {
    if (typeof window === 'undefined') return;

    document.documentElement.lang = this.locale();
    window.localStorage.setItem('billflow-lang', this.locale());

    try {
      const raw = window.localStorage.getItem('billflow-session');
      if (!raw) {
        window.location.assign('/auth');
        return;
      }

      const session = JSON.parse(raw) as { id?: string; employeeId?: string; email?: string; role?: string; user?: { name?: string; firstName?: string; fullName?: string } };
      const candidate = session.employeeId || session.id || session.email?.split('@')[0] || 'Usuario';
      this.displayName = candidate === 'Usuario' ? candidate : candidate.toUpperCase();
      if (candidate !== 'Usuario') {
        this.userInitials = candidate
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? '')
          .join('');
      }

      void this.loadDashboardData();
    } catch {
      window.location.assign('/auth');
    }
  }

  private async loadDashboardData() {
    try {
      const [statsResult, invoicesResult, productsResult, customersResult] = await Promise.allSettled([
        this.api.getStats(),
        this.api.listInvoices(8),
        this.api.listProducts(8),
        this.api.listCustomers(8),
      ]);

      if (statsResult.status === 'fulfilled') {
        this.stats.set(statsResult.value);
      }

      if (invoicesResult.status === 'fulfilled') {
        this.invoices.set(invoicesResult.value.data.map((invoice) => this.mapInvoice(invoice)));
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

  async startNewSale() {
    await this.feedback.toast('success', 'Nueva venta', 'La terminal POS está lista para operar.');
  }

  toggleDashboardLocale() {
    const next: DashboardLocale = this.locale() === 'es' ? 'en' : 'es';
    this.locale.set(next);
    this.closeUserMenu();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('billflow-lang', next);
      document.documentElement.lang = next;
    }
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
    await this.feedback.alert('info', this.copy().settingsTitle, this.copy().settingsText);
  }

  async logout() {
    this.closeUserMenu();
    const confirmed = await this.feedback.confirm(this.copy().logoutTitle, this.copy().logoutText, this.copy().logoutConfirm, this.copy().logoutCancel);
    if (!confirmed || typeof window === 'undefined') return;

    window.localStorage.removeItem('billflow-session');
    window.location.replace('/auth');
  }

  toggleTabletSidebar() {
    this.tabletSidebarOpen.update((current) => !current);
  }

  closeTabletSidebar() {
    this.tabletSidebarOpen.set(false);
  }

  async showNotifications() {
    await this.feedback.alert('info', this.copy().notificationsTitle, this.copy().notificationsText);
  }

  async showInvoiceOverview() {
    await this.feedback.toast('info', 'Facturas recientes', 'Mostrando el resumen operativo del día.');
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
    await this.feedback.toast('success', action.label, 'Acción registrada en la interfaz del dashboard.');
  }

  async showPeriodDetail(label: string, value: string) {
    await this.feedback.toast('info', `Ventas ${label}`, `Valor aproximado: ${value}`);
  }

  async setPeriod(value: string) {
    this.period.set(value === 'month' ? 'month' : 'week');
    await this.feedback.toast('info', this.period() === 'month' ? 'Vista mensual' : 'Vista semanal', 'Se actualizó el análisis visual.');
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

  iconVariationSettings(active = false) {
    return active ? "'FILL' 1" : "'FILL' 0";
  }

  formatMoney(value: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(date);
  }

  private buildChartBars() {
    const invoices = this.invoices();
    const days = this.period() === 'month'
      ? this.monthLabels()
      : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const values = days.map((label, index) => {
      const bucket = invoices.filter((invoice) => this.matchesBucket(invoice.date, label, index));
      const total = bucket.reduce((sum, invoice) => sum + invoice.total, 0);
      return { label, value: this.formatCompactMoney(total), height: this.scaleChartValue(total) };
    });

    return values;
  }

  private monthLabels() {
    return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  }

  private matchesBucket(dateValue: string, _label: string, index: number) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return false;

    if (this.period() === 'month') {
      return date.getMonth() === index;
    }

    const weekday = date.getDay();
    const normalized = [1, 2, 3, 4, 5, 6, 0];
    return normalized[index] === weekday;
  }

  private scaleChartValue(value: number) {
    const max = Math.max(...this.invoices().map((invoice) => invoice.total), 1);
    return Math.max(18, Math.round((value / max) * 95));
  }

  private formatCompactMoney(value: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value);
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
    return {
      rank: '00',
      name: `${product.code} · ${product.name}`,
      units: product.availableQuantity,
      price: product.unitPrice,
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
