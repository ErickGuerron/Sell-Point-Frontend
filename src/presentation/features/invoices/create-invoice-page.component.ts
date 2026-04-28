import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  InvoiceApiService,
  type CustomerRowDto,
  type ProductRowDto,
} from './invoice-api.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { LocaleService } from '../../shared/services/locale.service';
import { BillflowPageShellComponent } from '../../shared/components/billflow-page-shell.component';
import { BillflowMobileSidebarComponent } from '../../shared/components/billflow-mobile-sidebar.component';
import { BillflowNotificationButtonComponent } from '../../shared/components/billflow-notification-button.component';
import { BillflowUserMenuComponent } from '../../shared/components/billflow-user-menu.component';
import { buildBillflowSidebarItems } from '../../shared/billflow-navigation';
import { DashboardParticlesBackgroundComponent } from '../dashboard/dashboard-particles-background.component';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'billflow-create-invoice-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BillflowPageShellComponent,
    BillflowMobileSidebarComponent,
    BillflowNotificationButtonComponent,
    BillflowUserMenuComponent,
    DashboardParticlesBackgroundComponent,
  ],
  template: `
    <billflow-page-shell
      [items]="sidebarItems()"
      [actionLabel]="copy().newInvoiceBtn"
      actionIcon="add"
      (actionClick)="resetForm()"
    >
      <billflow-dashboard-particles-background class="app-invoice-bg"></billflow-dashboard-particles-background>

      <div class="flex-1 min-w-0 app-dashboard-main">

        <!-- Top bar -->
        <header class="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/80 backdrop-blur-xl">
          <div class="py-3 px-5 md:px-6 flex items-center gap-4">
            <div class="mx-auto w-full max-w-5xl flex items-center justify-between gap-4">
              <div class="flex items-center gap-3 shrink-0">
                <span class="inline-flex lg:hidden">
                  <billflow-mobile-sidebar
                    [items]="sidebarItems()"
                    [actionLabel]="copy().newInvoiceBtn"
                    actionIcon="add"
                    (actionClick)="resetForm()"
                  ></billflow-mobile-sidebar>
                </span>
                <div class="flex items-center gap-2.5">
                  <span class="material-symbols-outlined text-primary">receipt_long</span>
                  <span class="font-semibold text-sm text-on-background">{{ copy().moduleLabel }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0 relative z-40" #userMenuPanel>
                <billflow-notification-button (clicked)="void 0"></billflow-notification-button>
                <billflow-user-menu
                  [displayName]="displayName"
                  [initials]="userInitials"
                  [open]="userMenuVisible()"
                  [closing]="userMenuClosing()"
                  [showLanguageToggle]="true"
                  [languageLabel]="locale() === 'es' ? 'English' : 'Español'"
                  settingsLabel="Configuración"
                  logoutLabel="Cerrar sesión"
                  sessionLabel="Sesión"
                  (toggle)="toggleUserMenu($event)"
                  (close)="closeUserMenu()"
                  (languageToggle)="toggleLocale()"
                  (logout)="logout()"
                ></billflow-user-menu>
              </div>
            </div>
          </div>
        </header>

        <main class="mx-auto w-full max-w-5xl px-5 pb-5 md:px-8 pt-3 flex flex-col gap-6 relative z-10">

          <!-- Page heading -->
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">{{ copy().pageTitle }}</h1>
              <p class="text-xs sm:text-sm text-on-surface-variant mt-1">{{ copy().pageSubtitle }}</p>
            </div>
            <div class="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2 sm:flex-shrink-0">
              <a
                href="/invoices"
                class="text-center px-4 py-2.5 sm:py-2 rounded-lg border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors"
              >
                {{ copy().cancelBtn }}
              </a>
              <button
                id="btn-issue-invoice"
                type="button"
                class="px-5 py-2.5 sm:py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-40"
                [disabled]="submitting() || !canSubmit()"
                (click)="submitInvoice()"
              >
                <span class="material-symbols-outlined text-[18px]">send</span>
                {{ submitting() ? copy().submittingBtn : copy().submitBtn }}
              </button>
            </div>
          </div>

          <!-- ── Top row: Customer + Invoice Details ── -->
          <section class="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <!-- Customer card -->
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 flex flex-col gap-4 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 bg-secondary-fixed/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

              <!-- Card header -->
              <div class="flex items-center justify-between relative z-10">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">person</span>
                  <h2 class="text-base font-semibold text-on-surface">{{ copy().customerTitle }}</h2>
                </div>
                <!-- Change button (only when customer selected) -->
                <button
                  *ngIf="selectedCustomer()"
                  type="button"
                  class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-all"
                  (click)="openCustomerModal()"
                >
                  <span class="material-symbols-outlined text-[14px]">sync_alt</span>
                  {{ copy().changeBtn }}
                </button>
              </div>

              <!-- No customer: placeholder + Add button -->
              <div *ngIf="!selectedCustomer()" class="flex flex-col items-center justify-center py-5 gap-3 text-center relative z-10">
                <span class="material-symbols-outlined text-[40px] text-outline-variant">person_search</span>
                <div>
                  <p class="text-sm font-medium text-on-surface-variant">{{ copy().noCustomerTitle }}</p>
                  <p class="text-xs text-outline mt-0.5">{{ copy().noCustomerHint }}</p>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
                  (click)="openCustomerModal()"
                >
                  <span class="material-symbols-outlined text-[18px]">person_add</span>
                  {{ copy().addCustomerBtn }}
                </button>
              </div>

              <!-- Selected customer chip -->
              <div *ngIf="selectedCustomer() as customer" class="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3.5 relative z-10 border border-outline-variant/40">
                <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 text-base">
                  {{ initials(customer.name, customer.lastName) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-sm text-on-surface">{{ customer.name }} {{ customer.lastName }}</p>
                  <p class="text-xs text-on-surface-variant mt-0.5">{{ customer.cedula ?? customer.email ?? '' }}</p>
                </div>
                <button
                  type="button"
                  class="ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-outline hover:text-error hover:bg-error/10 transition-all"
                  (click)="clearCustomer()"
                  title="{{ copy().removeCustomerBtn }}"
                >
                  <span class="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            <!-- Invoice meta card -->
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 flex flex-col gap-4 relative overflow-hidden">
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-transparent pointer-events-none"></div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">receipt_long</span>
                  <h2 class="text-base font-semibold text-on-surface">{{ copy().invoiceDetailsTitle }}</h2>
                </div>
                <span class="text-sm font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                  {{ copy().autoGenerated }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">{{ copy().issueDateLabel }}</label>
                  <input
                    type="date"
                    class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    [value]="today"
                    disabled
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">{{ copy().ivaLabel }}</label>
                  <input
                    type="text"
                    class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface outline-none"
                    value="15%"
                    disabled
                  />
                </div>
              </div>
              <p class="text-xs text-on-surface-variant">{{ copy().invoiceNote }}</p>
            </div>
          </section>

          <!-- ── Line Items ── -->
          <section class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <!-- Header row: title + cart badge + open-modal button -->
            <div class="px-5 pt-5 pb-4 bg-surface/50 border-b border-outline-variant/50 flex items-center gap-3 flex-wrap">
              <span class="material-symbols-outlined text-primary">shopping_cart</span>
              <h2 class="text-base font-semibold text-on-surface flex-1">{{ copy().lineItemsTitle }}</h2>
              <span class="text-xs font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">{{ lineItems().length }}</span>
              <!-- Open product modal button -->
              <button
                type="button"
                id="open-product-modal-btn"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold shadow hover:bg-primary/90 active:scale-95 transition-all"
                (click)="openProductModal()"
              >
                <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                {{ copy().productModalOpenBtn }}
              </button>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto">
              <table class="w-full min-w-[480px] text-left border-collapse">
                <thead>
                  <tr class="bg-surface-container-low border-b border-outline-variant/50">
                    <th class="py-3 px-3 md:px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{{ copy().colProduct }}</th>
                    <th class="py-3 px-3 md:px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right">{{ copy().colQty }}</th>
                    <th class="py-3 px-3 md:px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right hidden sm:table-cell">{{ copy().colUnitPrice }}</th>
                    <th class="py-3 px-3 md:px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right">{{ copy().colTotal }}</th>
                    <th class="py-3 px-3 md:px-4 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    *ngFor="let item of lineItems(); let i = index"
                    class="border-b border-outline-variant/20 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td class="py-3 px-3 md:px-4 md:py-4">
                      <p class="font-medium text-sm text-on-surface leading-tight">{{ item.productName }}</p>
                      <p class="text-xs text-on-surface-variant mt-0.5">{{ item.productCode }}</p>
                    </td>
                    <td class="py-3 px-3 md:px-4 md:py-4 text-right">
                      <div class="inline-flex items-center border border-outline-variant rounded-lg overflow-hidden bg-surface-container-lowest">
                        <button type="button" class="px-1.5 md:px-2 py-1 hover:bg-surface-container text-outline transition-colors" (click)="decQty(i)">
                          <span class="material-symbols-outlined text-[16px]">remove</span>
                        </button>
                        <span class="px-2 md:px-3 text-sm font-semibold min-w-[1.5rem] text-center">{{ item.quantity }}</span>
                        <button type="button" class="px-1.5 md:px-2 py-1 hover:bg-surface-container text-outline transition-colors" (click)="incQty(i)">
                          <span class="material-symbols-outlined text-[16px]">add</span>
                        </button>
                      </div>
                    </td>
                    <td class="py-3 px-3 md:px-4 md:py-4 text-right text-sm text-on-surface hidden sm:table-cell">{{ formatMoney(item.unitPrice) }}</td>
                    <td class="py-3 px-3 md:px-4 md:py-4 text-right text-sm font-semibold text-on-surface">{{ formatMoney(item.unitPrice * item.quantity) }}</td>
                    <td class="py-3 px-3 md:px-4 md:py-4 text-center">
                      <button type="button" class="text-outline hover:text-error transition-colors" (click)="removeItem(i)">
                        <span class="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </td>
                  </tr>

                  <!-- Empty state -->
                  <tr *ngIf="lineItems().length === 0">
                    <td colspan="5" class="py-12 text-center">
                      <span class="material-symbols-outlined text-[40px] text-outline-variant block mb-2">add_shopping_cart</span>
                      <p class="text-sm text-on-surface-variant">{{ copy().emptyCartHint }}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totals -->
            <div class="px-4 py-5 md:px-6 bg-surface-container-lowest border-t border-outline-variant/50 flex justify-end">
              <div class="w-full sm:w-72 md:w-80 space-y-3">
                <div class="flex justify-between text-sm text-on-surface-variant">
                  <span>{{ copy().subtotalLabel }}</span>
                  <span class="font-medium">{{ formatMoney(subtotal()) }}</span>
                </div>
                <div class="flex justify-between text-sm text-on-surface-variant pb-3 border-b border-outline-variant/50">
                  <span>{{ copy().ivaLineLabel }}</span>
                  <span class="font-medium">{{ formatMoney(ivaAmount()) }}</span>
                </div>
                <div class="flex justify-between items-center pt-1">
                  <span class="text-lg md:text-xl font-bold text-on-surface">{{ copy().totalLabel }}</span>
                  <span class="text-lg md:text-xl font-bold text-primary">{{ formatMoney(total()) }}</span>
                </div>
              </div>
            </div>
          </section>

        </main>

        <!-- ── Customer Selection Modal ── -->
        <div
          *ngIf="customerModalOpen()"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          (click)="closeCustomerModal()"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-[#060d1f]/60 backdrop-blur-md"></div>

          <!-- Modal panel: wider, taller -->
          <div
            class="relative z-10 w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/50 flex flex-col overflow-hidden"
            style="max-height: min(90vh, 680px)"
            (click)="$event.stopPropagation()"
          >

            <!-- ── Modal header ── -->
            <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline-variant/40 bg-surface/60 flex-shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span class="material-symbols-outlined text-primary text-[20px]">manage_accounts</span>
                </div>
                <div>
                  <h3 class="text-base font-bold text-on-surface leading-tight">{{ copy().modalTitle }}</h3>
                  <p class="text-xs text-on-surface-variant mt-0.5">
                    {{ modalTotal() > 0 ? modalTotal() + ' ' + copy().customersFound : copy().searchHint }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-outline hover:bg-surface-container hover:text-on-surface transition-all"
                (click)="closeCustomerModal()"
              >
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <!-- ── Search bar ── -->
            <div class="px-6 py-3 border-b border-outline-variant/30 flex-shrink-0 bg-surface-container/30">
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input
                  id="modal-customer-search"
                  type="text"
                  class="w-full pl-10 pr-10 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                  [placeholder]="copy().customerSearchPlaceholder"
                  [ngModel]="customerQuery()"
                  (ngModelChange)="onModalCustomerSearch($event)"
                />
                <button
                  *ngIf="customerQuery()"
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  (click)="onModalCustomerSearch('')"
                >
                  <span class="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>

            <!-- ── Table area ── -->
            <div class="flex-1 overflow-auto">
              <table class="w-full border-collapse text-sm">

                <!-- Sticky column headers -->
                <thead class="sticky top-0 z-20">
                  <tr class="bg-surface-container border-b-2 border-primary/30">
                    <th class="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-primary w-20">#</th>
                    <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-primary">Nombre completo</th>
                    <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-primary hidden sm:table-cell">Email</th>
                    <th class="px-4 py-3 w-10"></th>
                  </tr>
                </thead>

                <tbody>
                  <!-- Loading skeleton rows -->
                  <ng-container *ngIf="customerLoading()">
                    <tr *ngFor="let s of skeletonRows">
                      <td class="px-5 py-3.5 border-b border-outline-variant/20">
                        <div class="h-3.5 w-8 rounded bg-outline-variant/30 animate-pulse"></div>
                      </td>
                      <td class="px-4 py-3.5 border-b border-outline-variant/20">
                        <div class="h-3.5 w-36 rounded bg-outline-variant/30 animate-pulse"></div>
                      </td>
                      <td class="px-4 py-3.5 border-b border-outline-variant/20 hidden sm:table-cell">
                        <div class="h-3.5 w-28 rounded bg-outline-variant/20 animate-pulse"></div>
                      </td>
                      <td class="px-4 py-3.5 border-b border-outline-variant/20"></td>
                    </tr>
                  </ng-container>

                  <!-- Data rows -->
                  <tr
                    *ngFor="let c of pagedModalCustomers(); let i = index; let even = even"
                    class="group cursor-pointer transition-colors border-b border-outline-variant/15 hover:bg-primary/5"
                    [class.bg-surface-container-lowest]="even"
                    [class.bg-surface-container]="!even"
                    (click)="selectCustomer(c); closeCustomerModal()"
                  >
                    <td class="px-5 py-3.5">
                      <span class="font-mono text-xs font-semibold text-on-surface-variant group-hover:text-primary transition-colors">
                        {{ c.cedula ?? '—' }}
                      </span>
                    </td>
                    <td class="px-4 py-3.5">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          {{ initials(c.name, c.lastName) }}
                        </div>
                        <span class="font-semibold text-on-surface group-hover:text-primary transition-colors">
                          {{ c.name }} {{ c.lastName }}
                        </span>
                      </div>
                    </td>
                    <td class="px-4 py-3.5 text-on-surface-variant text-xs hidden sm:table-cell">
                      {{ c.email ?? '—' }}
                    </td>
                    <td class="px-4 py-3.5 text-right">
                      <span class="material-symbols-outlined text-outline/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all text-[18px]">
                        arrow_forward
                      </span>
                    </td>
                  </tr>

                  <!-- Empty state inside table -->
                  <tr *ngIf="!customerLoading() && modalCustomers().length === 0">
                    <td colspan="4" class="px-5 py-14 text-center">
                      <span class="material-symbols-outlined text-[44px] text-outline-variant block mb-3">person_search</span>
                      <p class="text-sm font-medium text-on-surface-variant">{{ copy().noResultsLabel }}</p>
                      <p class="text-xs text-outline mt-1">{{ copy().noResultsHint }}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- ── Pagination footer (mismo estilo que tabla de facturas) ── -->
            <div class="flex flex-col gap-3 border-t border-outline-variant/40 bg-surface/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <!-- Count label -->
              <div class="text-sm text-on-surface-variant">
                <ng-container *ngIf="modalCustomers().length > 0">
                  Mostrando
                  <span class="font-semibold text-on-surface">{{ (modalPage() - 1) * modalPageSize + 1 }}</span>
                  a
                  <span class="font-semibold text-on-surface">{{ minOf(modalPage() * modalPageSize, modalTotal() || modalCustomers().length) }}</span>
                  de
                  <span class="font-semibold text-on-surface">{{ modalTotal() || modalCustomers().length }}</span>
                  clientes
                </ng-container>
                <ng-container *ngIf="modalCustomers().length === 0 && !customerLoading()">
                  Sin resultados
                </ng-container>
              </div>

              <!-- Page buttons -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30"
                  [disabled]="modalPage() <= 1"
                  (click)="prevModalPage()"
                >
                  <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                <button
                  *ngFor="let p of modalPageNumbers()"
                  type="button"
                  class="h-9 w-9 rounded-lg text-sm font-semibold transition"
                  [ngClass]="p === modalPage() ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'"
                  (click)="goToPage(p)"
                >
                  {{ p }}
                </button>

                <button
                  type="button"
                  class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30"
                  [disabled]="modalPage() >= totalModalPages()"
                  (click)="nextModalPage()"
                >
                  <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      <!-- ══ Product Modal ══ -->

      <div
        *ngIf="productModalOpen()"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        (click)="closeProductModal()"
      >
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div
          class="relative w-full max-w-3xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/60 flex flex-col max-h-[88vh] overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="flex items-center gap-3 px-6 py-4 border-b border-outline-variant/50 bg-surface/60 flex-shrink-0">
            <div class="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <span class="material-symbols-outlined text-primary text-[20px]">inventory_2</span>
            </div>
            <div>
              <h3 class="text-base font-bold text-on-surface leading-tight">{{ copy().productModalTitle }}</h3>
              <p class="text-xs text-on-surface-variant mt-0.5">
                {{ productModalTotal() > 0 ? productModalTotal() + (locale() === 'es' ? ' productos' : ' products') : copy().productModalSearchPlaceholder }}
              </p>
            </div>
            <button type="button" class="ml-auto text-outline hover:text-on-surface transition-colors" (click)="closeProductModal()">
              <span class="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          <!-- Search -->
          <div class="px-6 py-3 border-b border-outline-variant/30 bg-surface/40 flex-shrink-0 relative">
            <span class="material-symbols-outlined absolute left-9 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              id="product-modal-search"
              type="text"
              class="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              [placeholder]="copy().productModalSearchPlaceholder"
              [ngModel]="productQuery()"
              (ngModelChange)="onProductModalSearch($event)"
            />
          </div>

          <!-- Table -->
          <div class="overflow-y-auto flex-1">
            <table class="w-full text-left border-collapse">
              <thead class="sticky top-0 z-10">
                <tr class="bg-surface-container border-b-2 border-primary/20">
                  <th class="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant w-24">{{ copy().productModalColCode }}</th>
                  <th class="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{{ copy().productModalColName }}</th>
                  <th class="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right">{{ copy().productModalColPrice }}</th>
                  <th class="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right hidden sm:table-cell">{{ copy().productModalColStock }}</th>
                  <th class="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-center w-32">{{ copy().productModalColQty }}</th>
                  </tr>
                </thead>
              <tbody>
                <ng-container *ngIf="productModalLoading()">
                  <tr *ngFor="let s of skeletonRows" class="border-b border-outline-variant/20 animate-pulse">
                    <td class="py-3 px-4"><div class="h-3 bg-outline-variant/30 rounded w-8"></div></td>
                    <td class="py-3 px-4"><div class="h-3 bg-outline-variant/30 rounded w-40"></div></td>
                    <td class="py-3 px-4"><div class="h-3 bg-outline-variant/30 rounded w-16 ml-auto"></div></td>
                    <td class="py-3 px-4 hidden sm:table-cell"><div class="h-3 bg-outline-variant/30 rounded w-10 ml-auto"></div></td>
                    <td class="py-3 px-4"></td>
                  </tr>
                </ng-container>
                <tr
                  *ngFor="let p of visibleProductModalResults()"
                  class="border-b border-outline-variant/20 hover:bg-primary/5 transition-colors"
                >
                  <td class="py-3 px-4 text-xs text-outline font-mono">{{ p.code }}</td>
                  <td class="py-3 px-4">
                    <p class="text-sm font-semibold text-on-surface leading-tight">{{ p.name }}</p>
                    <p class="text-xs text-outline mt-0.5">{{ p.code }}</p>
                  </td>
                  <td class="py-3 px-4 text-right text-sm font-bold text-primary">{{ formatMoney(p.unitPrice) }}</td>
                  <td class="py-3 px-4 text-right hidden sm:table-cell">
                    <span [class]="p.availableQuantity > 0 ? 'text-xs font-semibold text-tertiary' : 'text-xs font-semibold text-error'">{{ p.availableQuantity }}</span>
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex items-center justify-center gap-1">
                      <button type="button" class="w-6 h-6 rounded-md bg-surface-container hover:bg-primary/10 flex items-center justify-center transition-colors" (click)="decModalQty(p.id)">
                        <span class="material-symbols-outlined text-[14px]">remove</span>
                      </button>
                      <span class="w-8 text-center text-sm font-bold text-on-surface">{{ getModalQty(p.id) }}</span>
                      <button type="button" class="w-6 h-6 rounded-md bg-surface-container hover:bg-primary/10 flex items-center justify-center transition-colors" (click)="incModalQty(p.id)">
                        <span class="material-symbols-outlined text-[14px]">add</span>
                      </button>
                    </div>
                  </td>
                    
                  </tr>
                  <tr *ngIf="!productModalLoading() && visibleProductModalResults().length === 0">
                    <td colspan="5" class="py-16 text-center">
                    <span class="material-symbols-outlined text-[44px] text-outline-variant block mb-3">inventory_2</span>
                    <p class="text-sm font-medium text-on-surface-variant">{{ copy().productModalNoResults }}</p>
                    <p class="text-xs text-outline mt-1">{{ copy().productModalNoResultsHint }}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex flex-col gap-3 border-t border-outline-variant/40 bg-surface/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
            <div class="text-sm text-on-surface-variant">
              <ng-container *ngIf="productModalTotal() > 0">
                {{ locale() === 'es' ? 'Página' : 'Page' }}
                <span class="font-semibold text-on-surface">{{ productModalPage() }}</span>
                {{ locale() === 'es' ? 'de' : 'of' }}
                <span class="font-semibold text-on-surface">{{ totalProductModalPages() }}</span>
              </ng-container>
              <ng-container *ngIf="visibleProductModalResults().length === 0 && !productModalLoading()">
                {{ copy().productModalNoResults }}
              </ng-container>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30"
                [disabled]="productModalPage() <= 1"
                (click)="prevProductModalPage()"
              >
                <span class="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              <button
                *ngFor="let p of productModalPageNumbers()"
                type="button"
                class="h-9 w-9 rounded-lg text-sm font-semibold transition"
                [ngClass]="p === productModalPage() ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'"
                (click)="goToProductModalPage(p)"
              >
                {{ p }}
              </button>

              <button
                type="button"
                class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30"
                [disabled]="productModalPage() >= totalProductModalPages()"
                (click)="nextProductModalPage()"
              >
                <span class="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-outline-variant/40 bg-surface/60 flex items-center justify-between flex-shrink-0">
            <span class="text-xs text-on-surface-variant">
              {{ productModalSelectedCount() }} {{ locale() === 'es' ? 'seleccionados' : 'selected' }}
            </span>
            <button
              type="button"
              id="product-modal-add-all-btn"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
              [disabled]="productModalSelectedCount() === 0"
              (click)="addAllFromModal()"
            >
              <span class="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
              {{ copy().productModalAddBtn }}
            </button>
          </div>
        </div>
      </div>
      <!-- ══ /Product Modal ══ -->

      </div><!-- /flex-1 wrapper -->
    </billflow-page-shell>
  `,
})
export class CreateInvoicePageComponent implements OnInit {
  private readonly api = inject(InvoiceApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);

  /** Alias directo al signal del servicio — sin copia local */
  readonly locale = this.localeService.locale;

  // ── Dictionary ────────────────────────────────────────────────────────────
  readonly copy = computed(() => {
    const es = {
      moduleLabel: 'Crear Factura',
      pageTitle: 'Crear Factura',
      pageSubtitle: 'Nueva transacción para cliente de paso o perfil seleccionado.',
      newInvoiceBtn: 'Nueva Factura',
      cancelBtn: 'Cancelar',
      submitBtn: 'Emitir Factura',
      submittingBtn: 'Emitiendo...',
      customerTitle: 'Perfil de Cliente',
      changeBtn: 'Cambiar',
      addCustomerBtn: 'Añadir cliente',
      removeCustomerBtn: 'Quitar cliente',
      customerSearchPlaceholder: 'Buscar por nombre o cédula...',
      noCustomerTitle: 'Sin cliente asignado',
      noCustomerHint: 'Buscá un cliente o emití como venta de mostrador.',
      searching: 'Buscando...',
      modalTitle: 'Seleccionar cliente',
      customersFound: 'clientes encontrados',
      searchHint: 'Buscá por nombre o cédula',
      noResultsLabel: 'No se encontraron clientes',
      noResultsHint: 'Intentá con otro nombre o cédula',
      pageLabel: 'Página',
      ofLabel: 'de',
      languageToggle: 'English',
      // Invoice details card
      invoiceDetailsTitle: 'Detalles de Factura',
      autoGenerated: '# Autogenerado',
      issueDateLabel: 'Fecha de Emisión',
      ivaLabel: 'IVA Aplicado',
      invoiceNote: 'El número de factura y la fecha de emisión definitiva son asignados por el sistema al emitir.',
      // Line items
      lineItemsTitle: 'Líneas de Producto',
      productSearchPlaceholder: 'Escanear código o buscar producto...',
      colProduct: 'Producto',
      colQty: 'Cant.',
      colUnitPrice: 'Precio Unit.',
      colTotal: 'Total',
      emptyCartHint: 'Buscá un producto para agregar.',
      // Totals
      subtotalLabel: 'Subtotal',
      ivaLineLabel: 'IVA (15%)',
      totalLabel: 'Total',
      // Product modal
      productModalTitle: 'Seleccionar Producto',
      productModalSearchPlaceholder: 'Buscar por nombre o código...',
       productModalColCode: 'COD_PRO',
       productModalColName: 'Nombre',
       productModalColPrice: 'Precio',
       productModalColStock: 'Stock',
       productModalColQty: 'Cantidad',
        productModalAddBtn: 'Agregar al carrito',
      productModalNoResults: 'No se encontraron productos',
       productModalNoResultsHint: 'Intentá con otro nombre o código, o revisá el stock',
      productModalOpenBtn: 'Buscar Producto',
    };
    const en = {
      moduleLabel: 'Create Invoice',
      pageTitle: 'Create Invoice',
      pageSubtitle: 'New transaction for a walk-in or selected customer profile.',
      newInvoiceBtn: 'New Invoice',
      cancelBtn: 'Cancel',
      submitBtn: 'Issue Invoice',
      submittingBtn: 'Issuing...',
      customerTitle: 'Customer Profile',
      changeBtn: 'Change',
      addCustomerBtn: 'Add customer',
      removeCustomerBtn: 'Remove customer',
      customerSearchPlaceholder: 'Search by name or ID...',
      noCustomerTitle: 'No customer assigned',
      noCustomerHint: 'Search for a customer or issue as a walk-in sale.',
      searching: 'Searching...',
      modalTitle: 'Select customer',
      customersFound: 'customers found',
      searchHint: 'Search by name or ID',
      noResultsLabel: 'No customers found',
      noResultsHint: 'Try another name or ID',
      pageLabel: 'Page',
      ofLabel: 'of',
      languageToggle: 'Español',
      // Invoice details card
      invoiceDetailsTitle: 'Invoice Details',
      autoGenerated: '# Auto-generated',
      issueDateLabel: 'Issue Date',
      ivaLabel: 'VAT Applied',
      invoiceNote: 'The invoice number and final issue date are assigned by the system upon issuance.',
      // Line items
      lineItemsTitle: 'Product Lines',
      productSearchPlaceholder: 'Scan barcode or search product...',
      colProduct: 'Product',
      colQty: 'Qty.',
      colUnitPrice: 'Unit Price',
      colTotal: 'Total',
      emptyCartHint: 'Search for a product to add.',
      // Totals
      subtotalLabel: 'Subtotal',
      ivaLineLabel: 'VAT (15%)',
      totalLabel: 'Total',
      // Product modal
      productModalTitle: 'Select Product',
      productModalSearchPlaceholder: 'Search by name or code...',
       productModalColCode: 'COD_PRO',
       productModalColName: 'Name',
       productModalColPrice: 'Price',
       productModalColStock: 'Stock',
       productModalColQty: 'Quantity',
        productModalAddBtn: 'Add to cart',
      productModalNoResults: 'No products found',
       productModalNoResultsHint: 'Try another name or code, or check stock',
      productModalOpenBtn: 'Browse Products',
    };
    return this.locale() === 'es' ? es : en;
  });

  // ── Auth / user ──────────────────────────────────────────────────────────
  displayName = 'Usuario';
  userInitials = 'US';
  userMenuVisible = signal(false);
  userMenuClosing = signal(false);
  private userMenuCloseTimeout: number | undefined;

  // ── Sidebar ───────────────────────────────────────────────────────────────
  readonly sidebarItems = computed(() => {
    const isEs = this.locale() === 'es';
    return buildBillflowSidebarItems(
      {
        dashboard:  isEs ? 'Dashboard'  : 'Dashboard',
        invoices:   isEs ? 'Facturas'   : 'Invoices',
        products:   isEs ? 'Productos'  : 'Products',
        customers:  isEs ? 'Clientes'   : 'Customers',
        employees:  isEs ? 'Empleados'  : 'Employees',
      },
      'invoices',
    );
  });

  // ── Customer search & modal ───────────────────────────────────────────────
  customerQuery = signal('');
  customerResults = signal<CustomerRowDto[]>([]);
  customerLoading = signal(false);
  selectedCustomer = signal<CustomerRowDto | null>(null);
  changingCustomer = signal(false);
  customerModalOpen = signal(false);
  modalCustomers = signal<CustomerRowDto[]>([]);
  modalPage = signal(1);               // 1-based, matches backend
  modalTotal = signal(0);
  readonly modalPageSize = 10;
  readonly totalModalPages = computed(() => {
    const total = this.modalTotal() || this.modalCustomers().length;
    return Math.max(1, Math.ceil(total / this.modalPageSize));
  });
  // pagedModalCustomers ya viene paginado del backend — es directamente modalCustomers()
  readonly pagedModalCustomers = computed(() => this.modalCustomers());
  readonly modalPageNumbers = computed(() => {
    const total = this.totalModalPages();
    const cur = this.modalPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [];
    const start = Math.max(1, Math.min(cur - 2, total - 4));
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });
  readonly skeletonRows = [1, 2, 3, 4, 5];
  minOf(a: number, b: number) { return Math.min(a, b); }
  private customerSearchTimeout: number | undefined;

  // ── Product modal ─────────────────────────────────────────────────────────
  productModalOpen    = signal(false);
  productModalLoading = signal(false);
  productModalResults = signal<ProductRowDto[]>([]);
  productModalTotal   = signal(0);
  productQuery        = signal('');
  productModalPage    = signal(1);
  readonly productModalPageSize = 10;
  /** Map of productId → desired quantity in the modal */
  private productModalQtyMap = signal<Record<string, number>>({});
  private productModalCatalog = signal<Record<string, ProductRowDto>>({});
  private productModalSearchTimeout: number | undefined;

  readonly visibleProductModalResults = computed(() =>
    this.productModalResults().filter((product) => product.availableQuantity > 0)
  );

  readonly productModalSelectedCount = computed(() =>
    Object.values(this.productModalQtyMap()).reduce((s, q) => s + (q > 0 ? 1 : 0), 0)
  );

  readonly totalProductModalPages = computed(() => {
    const total = this.productModalTotal() || this.visibleProductModalResults().length;
    return Math.max(1, Math.ceil(total / this.productModalPageSize));
  });

  readonly productModalPageNumbers = computed(() => {
    const total = this.totalProductModalPages();
    const cur = this.productModalPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [];
    const start = Math.max(1, Math.min(cur - 2, total - 4));
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  // legacy kept for backward compat (not used in UI anymore)
  productResults = signal<ProductRowDto[]>([]);
  private productSearchTimeout: number | undefined;

  // ── Line items ────────────────────────────────────────────────────────────
  lineItems = signal<LineItem[]>([]);

  // ── Totals ────────────────────────────────────────────────────────────────
  readonly subtotal = computed(() =>
    this.lineItems().reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  );
  readonly ivaAmount = computed(() => this.subtotal() * 0.15);
  readonly total = computed(() => this.subtotal() + this.ivaAmount());

  // ── Submit state ─────────────────────────────────────────────────────────
  submitting = signal(false);
  readonly canSubmit = computed(
    () => !!this.selectedCustomer() && this.lineItems().length > 0 && !this.submitting()
  );

  readonly today = new Date().toISOString().split('T')[0];

  // ─────────────────────────────────────────────────────────────────────────

  ngOnInit() {
    this.applyStoredUser();
    this.applyStoredTheme();
    if (typeof window !== 'undefined') {
      document.documentElement.lang = this.locale();
    }
  }

  // ── Customer ──────────────────────────────────────────────────────────────

  /** Opens the modal: resetea a pág 1 y carga del backend */
  openCustomerModal() {
    this.customerQuery.set('');
    this.modalCustomers.set([]);
    this.modalTotal.set(0);
    this.modalPage.set(1);
    this.customerModalOpen.set(true);
    void this.loadModalPage(1);
  }

  closeCustomerModal() {
    this.customerModalOpen.set(false);
    this.customerQuery.set('');
    this.modalCustomers.set([]);
  }

  onModalCustomerSearch(value: string) {
    this.customerQuery.set(value);
    this.modalPage.set(1);
    if (typeof window !== 'undefined') window.clearTimeout(this.customerSearchTimeout);
    this.customerSearchTimeout = typeof window !== 'undefined'
      ? window.setTimeout(() => { void this.loadModalPage(1); }, 300)
      : undefined;
  }

  private async loadModalPage(page: number) {
    this.customerLoading.set(true);
    try {
      const res = await this.api.fetchCustomersPage(this.customerQuery(), page, this.modalPageSize);
      this.modalCustomers.set(res.data);
      this.modalTotal.set(res.pagination?.total ?? res.data.length);
      this.modalPage.set(page);
    } catch (err) {
      console.error('[modal] fetch error:', err);
      this.modalCustomers.set([]);
      this.modalTotal.set(0);
    } finally {
      this.customerLoading.set(false);
    }
  }

  prevModalPage() {
    const p = this.modalPage() - 1;
    if (p < 1) return;
    void this.loadModalPage(p);
  }

  nextModalPage() {
    const p = this.modalPage() + 1;
    if (p > this.totalModalPages()) return;
    void this.loadModalPage(p);
  }

  goToPage(p: number) { void this.loadModalPage(p); }

  onCustomerSearch(value: string) {
    this.customerQuery.set(value);
    if (typeof window !== 'undefined') window.clearTimeout(this.customerSearchTimeout);
    if (!value.trim()) { this.customerResults.set([]); return; }
    this.customerSearchTimeout = typeof window !== 'undefined'
      ? window.setTimeout(() => { void this.fetchCustomers(value); }, 350)
      : undefined;
  }

  private async fetchCustomers(q: string) {
    this.customerLoading.set(true);
    try {
      const res = await this.api.searchCustomers(q);
      this.customerResults.set(res.data);
    } catch {
      this.customerResults.set([]);
    } finally {
      this.customerLoading.set(false);
    }
  }

  selectCustomer(c: CustomerRowDto) {
    this.selectedCustomer.set(c);
    this.customerResults.set([]);
    this.customerQuery.set(`${c.name} ${c.lastName}`);
    this.changingCustomer.set(false);
  }

  clearCustomer() {
    this.selectedCustomer.set(null);
    this.customerQuery.set('');
    this.customerResults.set([]);
    this.changingCustomer.set(false);
  }

  // ── Products ──────────────────────────────────────────────────────────────

  onProductSearch(value: string) {
    this.productQuery.set(value);
    if (typeof window !== 'undefined') window.clearTimeout(this.productSearchTimeout);
    if (!value.trim()) { this.productResults.set([]); return; }

    this.productSearchTimeout = typeof window !== 'undefined'
      ? window.setTimeout(() => { void this.fetchProducts(value); }, 350)
      : undefined;
  }

  private async fetchProducts(q: string) {
    try {
      const res = await this.api.searchProducts(q);
      this.productResults.set(res.data);
    } catch {
      this.productResults.set([]);
    }
  }

  addProduct(p: ProductRowDto) {
    const existing = this.lineItems().findIndex((i) => i.productId === p.id);
    if (existing >= 0) {
      this.lineItems.update((items) =>
        items.map((item, idx) =>
          idx === existing ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      this.lineItems.update((items) => [
        ...items,
        { productId: p.id, productName: p.name, productCode: p.code, quantity: 1, unitPrice: p.unitPrice },
      ]);
    }
    this.productQuery.set('');
    this.productResults.set([]);
  }

  // ── Product modal methods ──────────────────────────────────────────────────

  openProductModal() {
    this.productQuery.set('');
    this.productModalResults.set([]);
    this.productModalTotal.set(0);
    this.productModalPage.set(1);
    this.productModalQtyMap.set({});
    this.productModalCatalog.set({});
    this.productModalOpen.set(true);
    void this.loadProductModalPage(1);
  }

  closeProductModal() {
    this.productModalOpen.set(false);
    this.productQuery.set('');
    this.productModalResults.set([]);
    this.productModalQtyMap.set({});
    this.productModalCatalog.set({});
    this.productModalPage.set(1);
  }

  onProductModalSearch(value: string) {
    this.productQuery.set(value);
    if (typeof window !== 'undefined') window.clearTimeout(this.productModalSearchTimeout);
    this.productModalPage.set(1);
    this.productModalSearchTimeout = typeof window !== 'undefined'
      ? window.setTimeout(() => { void this.loadProductModalPage(1); }, 300)
      : undefined;
  }

  private async loadProductModalPage(page: number) {
    this.productModalLoading.set(true);
    try {
      const res = await this.api.fetchProductsPage(this.productQuery(), page, this.productModalPageSize);
      this.productModalResults.set(res.data);
      this.productModalTotal.set(res.pagination?.total ?? res.data.length);
      this.productModalPage.set(page);
      this.productModalCatalog.update((current) => {
        const next = { ...current };
        for (const product of res.data) next[product.id] = product;
        return next;
      });
    } catch {
      this.productModalResults.set([]);
      this.productModalTotal.set(0);
    } finally {
      this.productModalLoading.set(false);
    }
  }

  prevProductModalPage() {
    const p = this.productModalPage() - 1;
    if (p < 1) return;
    void this.loadProductModalPage(p);
  }

  nextProductModalPage() {
    const p = this.productModalPage() + 1;
    if (p > this.totalProductModalPages()) return;
    void this.loadProductModalPage(p);
  }

  goToProductModalPage(p: number) {
    void this.loadProductModalPage(p);
  }

  getModalQty(productId: string): number {
    return this.productModalQtyMap()[productId] ?? 0;
  }

  incModalQty(productId: string) {
    const product = this.productModalCatalog()[productId];
    const current = this.productModalQtyMap()[productId] ?? 0;
    const max = product?.availableQuantity ?? Number.MAX_SAFE_INTEGER;
    if (current >= max) return;
    this.productModalQtyMap.update((m) => ({ ...m, [productId]: current + 1 }));
  }

  decModalQty(productId: string) {
    const cur = this.productModalQtyMap()[productId] ?? 0;
    if (cur <= 0) return;
    this.productModalQtyMap.update((m) => ({ ...m, [productId]: cur - 1 }));
  }

  /** Add all products that have qty > 0 in the map */
  addAllFromModal() {
    const map = this.productModalQtyMap();
    const catalog = this.productModalCatalog();
    for (const [productId, qty] of Object.entries(map)) {
      if (qty <= 0) continue;
      const product = catalog[productId];
      if (!product || product.availableQuantity <= 0) continue;
      this.mergeIntoCart(product, Math.min(qty, product.availableQuantity));
    }
    this.closeProductModal();
  }

  private mergeIntoCart(p: ProductRowDto, qty: number) {
    const existing = this.lineItems().findIndex(i => i.productId === p.id);
    if (existing >= 0) {
      this.lineItems.update(items =>
        items.map((item, idx) =>
          idx === existing ? { ...item, quantity: item.quantity + qty } : item
        )
      );
    } else {
      this.lineItems.update(items => [
        ...items,
        { productId: p.id, productName: p.name, productCode: p.code, quantity: qty, unitPrice: p.unitPrice },
      ]);
    }
  }

  incQty(index: number) {
    this.lineItems.update((items) =>
      items.map((item, i) => (i === index ? { ...item, quantity: item.quantity + 1 } : item))
    );
  }

  decQty(index: number) {
    const item = this.lineItems()[index];
    if (item.quantity <= 1) { this.removeItem(index); return; }
    this.lineItems.update((items) =>
      items.map((it, i) => (i === index ? { ...it, quantity: it.quantity - 1 } : it))
    );
  }

  removeItem(index: number) {
    this.lineItems.update((items) => items.filter((_, i) => i !== index));
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async submitInvoice() {
    const customer = this.selectedCustomer();
    if (!customer || this.lineItems().length === 0) return;

    this.submitting.set(true);
    try {
      const created = await this.api.createInvoice({
        customerId: customer.id,
        items: this.lineItems().map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });

      await this.feedback.alert(
        'success',
        '¡Factura emitida!',
        `Factura ${created.invoiceNumber} creada por ${this.formatMoney(created.total)}.`
      );

      if (typeof window !== 'undefined') window.location.replace('/invoices');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      await this.feedback.alert('error', 'No se pudo emitir la factura', msg);
    } finally {
      this.submitting.set(false);
    }
  }

  resetForm() {
    this.clearCustomer();
    this.lineItems.set([]);
    this.productQuery.set('');
    this.productResults.set([]);
  }

  // ── User menu ─────────────────────────────────────────────────────────────

  toggleLocale() {
    this.localeService.toggle();
  }

  toggleUserMenu(event?: MouseEvent) {
    event?.stopPropagation();
    if (this.userMenuVisible()) { this.closeUserMenu(); return; }
    if (typeof window !== 'undefined') window.clearTimeout(this.userMenuCloseTimeout);
    this.userMenuClosing.set(false);
    this.userMenuVisible.set(true);
  }

  closeUserMenu() {
    if (!this.userMenuVisible() || this.userMenuClosing()) return;
    this.userMenuClosing.set(true);
    if (typeof window !== 'undefined') {
      this.userMenuCloseTimeout = window.setTimeout(() => {
        this.userMenuVisible.set(false);
        this.userMenuClosing.set(false);
      }, 180);
    }
  }

  async logout() {
    this.closeUserMenu();
    const ok = await this.feedback.confirm('Cerrar sesión', '¿Seguro que querés salir?', 'Cerrar sesión', 'Cancelar');
    if (!ok || typeof window === 'undefined') return;
    window.localStorage.removeItem('billflow-session');
    window.location.replace('/auth');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatMoney(value: number) {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(
      Number.isFinite(Number(value)) ? Number(value) : 0
    );
  }

  initials(name: string, lastName: string) {
    return `${name[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  }

  private applyStoredUser() {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('billflow-session');
      if (!raw) return;
      const session = JSON.parse(raw) as { id?: string; employeeId?: string; email?: string; user?: { name?: string } };
      const candidate = session.employeeId || session.id || session.email?.split('@')[0] || session.user?.name || 'Usuario';
      this.displayName = candidate;
      this.userInitials = candidate.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'US';
    } catch {
      this.displayName = 'Usuario';
      this.userInitials = 'US';
    }
  }

  private applyStoredTheme() {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('billflow-theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const dark = stored === 'dark' || (!stored && prefersDark);
    document.documentElement.classList.toggle('dark', dark);
  }
}
