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
      [actionLabel]="copy.newInvoiceBtn"
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
                    [actionLabel]="copy.newInvoiceBtn"
                    actionIcon="add"
                    (actionClick)="resetForm()"
                  ></billflow-mobile-sidebar>
                </span>
                <div class="flex items-center gap-2.5">
                  <span class="material-symbols-outlined text-primary">receipt_long</span>
                  <span class="font-semibold text-sm text-on-background">{{ copy.moduleLabel }}</span>
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
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">Crear Factura</h1>
              <p class="text-xs sm:text-sm text-on-surface-variant mt-1">Completá los datos y agregá productos para emitir la factura.</p>
            </div>
            <div class="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2 sm:flex-shrink-0">
              <a
                href="/invoices"
                class="text-center px-4 py-2.5 sm:py-2 rounded-lg border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors"
              >
                Cancelar
              </a>
              <button
                id="btn-issue-invoice"
                type="button"
                class="px-5 py-2.5 sm:py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-40"
                [disabled]="submitting() || !canSubmit()"
                (click)="submitInvoice()"
              >
                <span class="material-symbols-outlined text-[18px]">send</span>
                {{ submitting() ? 'Emitiendo...' : 'Emitir Factura' }}
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
                  <h2 class="text-base font-semibold text-on-surface">{{ copy.customerTitle }}</h2>
                </div>
                <!-- Change button (only when customer selected) -->
                <button
                  *ngIf="selectedCustomer()"
                  type="button"
                  class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-all"
                  (click)="openCustomerModal()"
                >
                  <span class="material-symbols-outlined text-[14px]">sync_alt</span>
                  {{ copy.changeBtn }}
                </button>
              </div>

              <!-- No customer: placeholder + Add button -->
              <div *ngIf="!selectedCustomer()" class="flex flex-col items-center justify-center py-5 gap-3 text-center relative z-10">
                <span class="material-symbols-outlined text-[40px] text-outline-variant">person_search</span>
                <div>
                  <p class="text-sm font-medium text-on-surface-variant">{{ copy.noCustomerTitle }}</p>
                  <p class="text-xs text-outline mt-0.5">{{ copy.noCustomerHint }}</p>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
                  (click)="openCustomerModal()"
                >
                  <span class="material-symbols-outlined text-[18px]">person_add</span>
                  {{ copy.addCustomerBtn }}
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
                  title="{{ copy.removeCustomerBtn }}"
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
                  <h2 class="text-base font-semibold text-on-surface">Detalles de Factura</h2>
                </div>
                <span class="text-sm font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                  # Autogenerado
                </span>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Fecha de Emisión</label>
                  <input
                    type="date"
                    class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    [value]="today"
                    disabled
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">IVA Aplicado</label>
                  <input
                    type="text"
                    class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface outline-none"
                    value="12%"
                    disabled
                  />
                </div>
              </div>
              <p class="text-xs text-on-surface-variant">El número de factura y la fecha de emisión definitiva son asignados por el sistema al emitir.</p>
            </div>
          </section>

          <!-- ── Line Items ── -->
          <section class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <!-- Header: title row -->
            <div class="px-5 pt-5 pb-3 bg-surface/50 flex items-center gap-2">
              <span class="material-symbols-outlined text-on-surface-variant">shopping_cart</span>
              <h2 class="text-base font-semibold text-on-surface">Líneas de Producto</h2>
              <span class="ml-1 text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{{ lineItems().length }}</span>
            </div>
            <!-- Search row (full width) -->
            <div class="px-5 pb-4 bg-surface/50 border-b border-outline-variant/50 relative">
              <span class="material-symbols-outlined absolute left-8 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input
                id="product-search"
                type="text"
                class="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                placeholder="Escanear código o buscar producto..."
                [ngModel]="productQuery()"
                (ngModelChange)="onProductSearch($event)"
              />
              <!-- Product dropdown -->
              <div
                *ngIf="productResults().length > 0"
                class="absolute z-30 left-5 right-5 top-full bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl overflow-hidden divide-y divide-outline-variant/30 max-h-56 overflow-y-auto"
              >
                <div
                  *ngFor="let p of productResults()"
                  class="px-4 py-3 cursor-pointer hover:bg-surface-container transition-colors flex items-center justify-between gap-3"
                  (click)="addProduct(p)"
                >
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-on-surface truncate">{{ p.name }}</p>
                    <p class="text-xs text-on-surface-variant">{{ p.code }} · Stock: {{ p.stock }}</p>
                  </div>
                  <span class="text-sm font-bold text-primary flex-shrink-0">{{ formatMoney(p.price) }}</span>
                </div>
              </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto -webkit-overflow-scrolling-touch">
              <table class="w-full min-w-[480px] text-left border-collapse">
                <thead>
                  <tr class="bg-surface-container-low border-b border-outline-variant/50">
                    <th class="py-3 px-3 md:px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Producto</th>
                    <th class="py-3 px-3 md:px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right">Cant.</th>
                    <th class="py-3 px-3 md:px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right hidden sm:table-cell">Precio Unit.</th>
                    <th class="py-3 px-3 md:px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right">Total</th>
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
                      <p class="text-sm text-on-surface-variant">Buscá un producto para agregar.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totals -->
            <div class="px-4 py-5 md:px-6 bg-surface-container-lowest border-t border-outline-variant/50 flex justify-end">
              <div class="w-full sm:w-72 md:w-80 space-y-3">
                <div class="flex justify-between text-sm text-on-surface-variant">
                  <span>Subtotal</span>
                  <span class="font-medium">{{ formatMoney(subtotal()) }}</span>
                </div>
                <div class="flex justify-between text-sm text-on-surface-variant pb-3 border-b border-outline-variant/50">
                  <span>IVA (12%)</span>
                  <span class="font-medium">{{ formatMoney(ivaAmount()) }}</span>
                </div>
                <div class="flex justify-between items-center pt-1">
                  <span class="text-lg md:text-xl font-bold text-on-surface">Total</span>
                  <span class="text-lg md:text-xl font-bold text-primary">{{ formatMoney(total()) }}</span>
                </div>
              </div>
            </div>
          </section>

        </main>

        <!-- ── Customer Modal ── -->
        <div
          *ngIf="customerModalOpen()"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          (click)="closeCustomerModal()"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-[#0b1020]/50 backdrop-blur-sm"></div>

          <!-- Modal panel -->
          <div
            class="relative z-10 w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/60 flex flex-col overflow-hidden"
            (click)="$event.stopPropagation()"
          >
            <!-- Modal header -->
            <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-outline-variant/40">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">manage_accounts</span>
                <h3 class="text-base font-bold text-on-surface">{{ copy.modalTitle }}</h3>
              </div>
              <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg text-outline hover:bg-surface-container transition-colors" (click)="closeCustomerModal()">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <!-- Search -->
            <div class="px-5 py-3 border-b border-outline-variant/30">
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input
                  id="modal-customer-search"
                  type="text"
                  class="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                  [placeholder]="copy.customerSearchPlaceholder"
                  [ngModel]="customerQuery()"
                  (ngModelChange)="onModalCustomerSearch($event)"
                />
              </div>
            </div>

            <!-- Results list -->
            <div class="flex-1 overflow-y-auto" style="max-height:320px">
              <!-- Loading -->
              <div *ngIf="customerLoading()" class="flex items-center justify-center py-10 gap-2 text-on-surface-variant">
                <span class="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                <span class="text-sm">{{ copy.searching }}</span>
              </div>

              <!-- Empty -->
              <div *ngIf="!customerLoading() && modalCustomers().length === 0" class="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <span class="material-symbols-outlined text-[36px] text-outline-variant">person_off</span>
                <p class="text-sm text-on-surface-variant">{{ copy.noResultsLabel }}</p>
              </div>

              <!-- List -->
              <ul *ngIf="!customerLoading() && modalCustomers().length > 0" class="divide-y divide-outline-variant/20">
                <li
                  *ngFor="let c of pagedModalCustomers()"
                  class="px-5 py-3.5 cursor-pointer hover:bg-surface-container transition-colors flex items-center gap-3"
                  (click)="selectCustomer(c); closeCustomerModal()"
                >
                  <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {{ initials(c.name, c.lastName) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-on-surface">{{ c.name }} {{ c.lastName }}</p>
                    <p class="text-xs text-on-surface-variant mt-0.5">{{ c.cedula ?? c.email ?? c.id }}</p>
                  </div>
                  <span class="material-symbols-outlined text-outline/60 text-[18px]">chevron_right</span>
                </li>
              </ul>
            </div>

            <!-- Pagination -->
            <div *ngIf="totalModalPages() > 1" class="flex items-center justify-between px-5 py-3 border-t border-outline-variant/30 bg-surface/60">
              <span class="text-xs text-on-surface-variant">
                {{ copy.pageLabel }} {{ modalPage() + 1 }} / {{ totalModalPages() }}
              </span>
              <div class="flex items-center gap-1">
                <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg text-outline hover:bg-surface-container disabled:opacity-30 transition-colors" [disabled]="modalPage() === 0" (click)="prevModalPage()">
                  <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg text-outline hover:bg-surface-container disabled:opacity-30 transition-colors" [disabled]="modalPage() >= totalModalPages() - 1" (click)="nextModalPage()">
                  <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </billflow-page-shell>
  `,
})
export class CreateInvoicePageComponent implements OnInit {
  private readonly api = inject(InvoiceApiService);
  private readonly feedback = inject(UiFeedbackService);

  // ── Dictionary ────────────────────────────────────────────────────────────
  readonly copy = {
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
    noResultsLabel: 'No se encontraron clientes',
    pageLabel: 'Página',
    languageToggle: 'English',
  };

  // ── Auth / user ──────────────────────────────────────────────────────────
  displayName = 'Usuario';
  userInitials = 'US';
  userMenuVisible = signal(false);
  userMenuClosing = signal(false);
  private userMenuCloseTimeout: number | undefined;

  // ── Sidebar ───────────────────────────────────────────────────────────────
  readonly sidebarItems = computed(() =>
    buildBillflowSidebarItems(
      { dashboard: 'Dashboard', invoices: 'Facturas', products: 'Productos', customers: 'Clientes', employees: 'Empleados' },
      'invoices',
    )
  );

  // ── Customer search & modal ───────────────────────────────────────────────
  customerQuery = signal('');
  customerResults = signal<CustomerRowDto[]>([]);
  customerLoading = signal(false);
  selectedCustomer = signal<CustomerRowDto | null>(null);
  changingCustomer = signal(false);
  customerModalOpen = signal(false);
  modalCustomers = signal<CustomerRowDto[]>([]);
  modalPage = signal(0);
  readonly modalPageSize = 8;
  readonly totalModalPages = computed(() => Math.max(1, Math.ceil(this.modalCustomers().length / this.modalPageSize)));
  readonly pagedModalCustomers = computed(() => {
    const start = this.modalPage() * this.modalPageSize;
    return this.modalCustomers().slice(start, start + this.modalPageSize);
  });
  locale = signal<'es' | 'en'>('es');
  private customerSearchTimeout: number | undefined;

  // ── Product search ────────────────────────────────────────────────────────
  productQuery = signal('');
  productResults = signal<ProductRowDto[]>([]);
  private productSearchTimeout: number | undefined;

  // ── Line items ────────────────────────────────────────────────────────────
  lineItems = signal<LineItem[]>([]);

  // ── Totals ────────────────────────────────────────────────────────────────
  readonly subtotal = computed(() =>
    this.lineItems().reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  );
  readonly ivaAmount = computed(() => this.subtotal() * 0.12);
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
  }

  // ── Customer ──────────────────────────────────────────────────────────────

  /** Opens the modal and pre-loads all customers so pagination works */
  openCustomerModal() {
    this.customerQuery.set('');
    this.modalCustomers.set([]);
    this.modalPage.set(0);
    this.customerModalOpen.set(true);
    void this.fetchAllCustomers();
  }

  closeCustomerModal() {
    this.customerModalOpen.set(false);
    this.customerQuery.set('');
    this.modalCustomers.set([]);
  }

  onModalCustomerSearch(value: string) {
    this.customerQuery.set(value);
    this.modalPage.set(0);
    if (typeof window !== 'undefined') window.clearTimeout(this.customerSearchTimeout);
    if (!value.trim()) { void this.fetchAllCustomers(); return; }
    this.customerSearchTimeout = typeof window !== 'undefined'
      ? window.setTimeout(() => { void this.fetchModalCustomers(value); }, 300)
      : undefined;
  }

  private async fetchAllCustomers() {
    this.customerLoading.set(true);
    try {
      const res = await this.api.searchCustomers('');
      this.modalCustomers.set(res.data);
    } catch {
      this.modalCustomers.set([]);
    } finally {
      this.customerLoading.set(false);
    }
  }

  private async fetchModalCustomers(q: string) {
    this.customerLoading.set(true);
    try {
      const res = await this.api.searchCustomers(q);
      this.modalCustomers.set(res.data);
    } catch {
      this.modalCustomers.set([]);
    } finally {
      this.customerLoading.set(false);
    }
  }

  prevModalPage() { this.modalPage.update(p => Math.max(0, p - 1)); }
  nextModalPage() { this.modalPage.update(p => Math.min(this.totalModalPages() - 1, p + 1)); }

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
        { productId: p.id, productName: p.name, productCode: p.code, quantity: 1, unitPrice: p.price },
      ]);
    }
    this.productQuery.set('');
    this.productResults.set([]);
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
    this.locale.update(l => l === 'es' ? 'en' : 'es');
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
