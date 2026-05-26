import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import type { OnInit } from '@angular/core';
import { InvoiceApiService, type CustomerRowDto, type ProductRowDto } from './invoice-api.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { LocaleService } from '../../shared/services/locale.service';
import { BillflowPageShellComponent } from '../../shared/components/billflow-page-shell.component';
import { BillflowMobileSidebarComponent } from '../../shared/components/billflow-mobile-sidebar.component';
import { BillflowNotificationButtonComponent } from '../../shared/components/billflow-notification-button.component';
import { BillflowUserMenuComponent } from '../../shared/components/billflow-user-menu.component';
import { DashboardParticlesBackgroundComponent } from '../dashboard/dashboard-particles-background.component';
import { InvoiceLineItemsComponent, type LineItem } from './invoice-line-items.component';
import { CustomerSelectionModalComponent } from './customer-selection-modal.component';
import { NewCustomerModalComponent } from './new-customer-modal.component';
import { ProductSelectionModalComponent } from './product-selection-modal.component';
import { buildBillflowSidebarItems } from '../../shared/billflow-navigation';

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'billflow-create-invoice-page',
  standalone: true,
  imports: [
    CommonModule,
    BillflowPageShellComponent,
    BillflowMobileSidebarComponent,
    BillflowNotificationButtonComponent,
    BillflowUserMenuComponent,
    DashboardParticlesBackgroundComponent,
    InvoiceLineItemsComponent,
    CustomerSelectionModalComponent,
    NewCustomerModalComponent,
    ProductSelectionModalComponent,
  ],
  template: `
    <billflow-page-shell
      [items]="sidebarItems()"
      [actionLabel]="locale() === 'es' ? 'Nueva Factura' : 'New Invoice'"
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
                    [actionLabel]="locale() === 'es' ? 'Nueva Factura' : 'New Invoice'"
                    actionIcon="add"
                    (actionClick)="resetForm()"
                  ></billflow-mobile-sidebar>
                </span>
                <div class="flex items-center gap-2.5">
                  <span class="material-symbols-outlined text-primary">receipt_long</span>
                  <span class="font-semibold text-sm text-on-background">{{ locale() === 'es' ? 'Crear Factura' : 'Create Invoice' }}</span>
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
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">{{ locale() === 'es' ? 'Crear Factura' : 'Create Invoice' }}</h1>
              <p class="text-xs sm:text-sm text-on-surface-variant mt-1">{{ locale() === 'es' ? 'Nueva transacción para cliente de paso o perfil seleccionado.' : 'New transaction for a walk-in or selected customer profile.' }}</p>
            </div>
            <div class="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2 sm:flex-shrink-0">
              <a
                href="/invoices"
                class="text-center px-4 py-2.5 sm:py-2 rounded-lg border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors"
              >
                {{ locale() === 'es' ? 'Cancelar' : 'Cancel' }}
              </a>
              <button
                id="btn-issue-invoice"
                type="button"
                class="px-5 py-2.5 sm:py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-40"
                [disabled]="submitting() || !canSubmit()"
                (click)="submitInvoice()"
              >
                <span class="material-symbols-outlined text-[18px]">send</span>
                {{ submitting() ? (locale() === 'es' ? 'Emitiendo...' : 'Issuing...') : (locale() === 'es' ? 'Emitir Factura' : 'Issue Invoice') }}
              </button>
            </div>
          </div>

          <!-- ── Top row: Customer + Invoice Details ── -->
          <section class="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <!-- Customer card -->
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 flex flex-col gap-4 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 bg-secondary-fixed/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <div class="flex items-center justify-between relative z-10">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">person</span>
                  <h2 class="text-base font-semibold text-on-surface">{{ locale() === 'es' ? 'Perfil de Cliente' : 'Customer Profile' }}</h2>
                </div>
                <button
                  *ngIf="selectedCustomer()"
                  type="button"
                  class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-all"
                  (click)="showCustomerModal.set(true)"
                >
                  <span class="material-symbols-outlined text-[14px]">sync_alt</span>
                  {{ locale() === 'es' ? 'Cambiar' : 'Change' }}
                </button>
              </div>

              <div *ngIf="!selectedCustomer()" class="flex flex-col items-center justify-center py-5 gap-3 text-center relative z-10">
                <span class="material-symbols-outlined text-[40px] text-outline-variant">person_search</span>
                <div>
                  <p class="text-sm font-medium text-on-surface-variant">{{ locale() === 'es' ? 'Sin cliente asignado' : 'No customer assigned' }}</p>
                  <p class="text-xs text-outline mt-0.5">{{ locale() === 'es' ? 'Buscá un cliente o emití como venta de mostrador.' : 'Search for a customer or issue as a walk-in sale.' }}</p>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
                    (click)="showCustomerModal.set(true)"
                  >
                    <span class="material-symbols-outlined text-[18px]">person_search</span>
                    {{ locale() === 'es' ? 'Añadir cliente' : 'Add customer' }}
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container-low transition-all shadow-sm"
                    (click)="showNewCustomerModal.set(true)"
                  >
                    <span class="material-symbols-outlined text-[18px]">person_add</span>
                    {{ locale() === 'es' ? 'Nuevo Cliente' : 'New Customer' }}
                  </button>
                </div>
              </div>

              <div *ngIf="selectedCustomer() as customer" class="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3.5 relative z-10 border border-outline-variant/40">
                <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 text-base">
                  {{ initials(customer.name, customer.lastName) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-sm text-on-surface">{{ customerFullName(customer) }}</p>
                  <p class="text-xs text-on-surface-variant mt-0.5">{{ customer.cedula ?? customer.email ?? '' }}</p>
                </div>
                <button
                  type="button"
                  class="ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-outline hover:text-error hover:bg-error/10 transition-all"
                  (click)="clearCustomer()"
                  title="{{ locale() === 'es' ? 'Quitar cliente' : 'Remove customer' }}"
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
                  <h2 class="text-base font-semibold text-on-surface">{{ locale() === 'es' ? 'Detalles de Factura' : 'Invoice Details' }}</h2>
                </div>
                <span class="text-sm font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                  {{ locale() === 'es' ? '# Autogenerado' : '# Auto-generated' }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">{{ locale() === 'es' ? 'Fecha de Emisión' : 'Issue Date' }}</label>
                  <input
                    type="datetime-local"
                    class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    [value]="today"
                    disabled
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">{{ locale() === 'es' ? 'IVA Aplicado' : 'VAT Applied' }}</label>
                  <input
                    type="text"
                    class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface outline-none"
                    value="15%"
                    disabled
                  />
                </div>
              </div>
              <p class="text-xs text-on-surface-variant">{{ locale() === 'es' ? 'El número de factura y la fecha de emisión definitiva son asignados por el sistema al emitir.' : 'The invoice number and final issue date are assigned by the system upon issuance.' }}</p>
            </div>
          </section>

          <!-- ── Line Items (delegated) ── -->
          <billflow-invoice-line-items
            [locale]="locale()"
            [submitting]="submitting()"
            [resetKey]="resetCounter()"
            (addProduct)="showProductModal.set(true)"
            (itemsChange)="onItemsChange($event)"
          ></billflow-invoice-line-items>

        </main>

        <!-- ── Modals (delegated) ── -->
        <billflow-customer-selection-modal
          [open]="showCustomerModal()"
          [locale]="locale()"
          (selectedCustomer)="onCustomerSelected($event)"
          (close)="showCustomerModal.set(false)"
        ></billflow-customer-selection-modal>

        <billflow-new-customer-modal
          [open]="showNewCustomerModal()"
          [locale]="locale()"
          (customerCreated)="onCustomerCreated($event)"
          (close)="showNewCustomerModal.set(false)"
        ></billflow-new-customer-modal>

        <billflow-product-selection-modal
          [open]="showProductModal()"
          [locale]="locale()"
          (productSelected)="onProductSelected($event)"
          (close)="showProductModal.set(false)"
        ></billflow-product-selection-modal>

      </div><!-- /flex-1 wrapper -->
    </billflow-page-shell>
  `,
})
export class CreateInvoicePageComponent implements OnInit {
  private readonly api = inject(InvoiceApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);

  @ViewChild(InvoiceLineItemsComponent) lineItemsComp!: InvoiceLineItemsComponent;

  /** Alias directo al signal del servicio — sin copia local */
  readonly locale = this.localeService.locale;

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

  // ── Customer ──────────────────────────────────────────────────────────────
  selectedCustomer = signal<CustomerRowDto | null>(null);

  // ── Modal visibility (delegated) ──────────────────────────────────────────
  showCustomerModal = signal(false);
  showNewCustomerModal = signal(false);
  showProductModal = signal(false);

  // ── Line items (copy from child for submit) ───────────────────────────────
  lineItemsForSubmit = signal<LineItem[]>([]);

  /** Increment to trigger line-items child reset */
  resetCounter = signal(0);

  // ── Submit state ─────────────────────────────────────────────────────────
  submitting = signal(false);
  readonly canSubmit = computed(
    () => !!this.selectedCustomer() && this.lineItemsForSubmit().length > 0 && !this.submitting()
  );

  readonly today = (() => {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcDate = now.getUTCDate();
    const utcMonth = now.getUTCMonth();
    const utcYear = now.getUTCFullYear();
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');

    let h = utcHours - 5;
    let d = utcDate;
    let m = utcMonth;
    let y = utcYear;

    if (h < 0) {
      h += 24;
      d--;
      if (d < 1) {
        m--;
        if (m < 0) { m = 11; y--; }
        d = new Date(y, m + 1, 0).getDate();
      }
    }

    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${minutes}`;
  })();

  // ─────────────────────────────────────────────────────────────────────────

  ngOnInit() {
    this.applyStoredUser();
    this.applyStoredTheme();
    if (typeof window !== 'undefined') {
      document.documentElement.lang = this.locale();
    }
  }

  // ── Customer handlers ─────────────────────────────────────────────────────

  onCustomerSelected(c: CustomerRowDto) {
    this.selectedCustomer.set(c);
    this.showCustomerModal.set(false);
  }

  onCustomerCreated(customer: CustomerRowDto) {
    this.selectedCustomer.set(customer);
    this.showNewCustomerModal.set(false);
    this.feedback.toast('success', this.locale() === 'es' ? 'Cliente creado correctamente' : 'Customer created successfully');
  }

  clearCustomer() {
    this.selectedCustomer.set(null);
  }

  // ── Product handler ───────────────────────────────────────────────────────

  onProductSelected(product: ProductRowDto) {
    this.lineItemsComp?.addProductItem(product);
  }

  // ── Line items handler ────────────────────────────────────────────────────

  onItemsChange(items: LineItem[]) {
    this.lineItemsForSubmit.set(items);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async submitInvoice() {
    const customer = this.selectedCustomer();
    const items = this.lineItemsForSubmit();
    if (!customer || items.length === 0) return;

    this.submitting.set(true);
    try {
      const created = await this.api.createInvoice({
        customerId: customer.id,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
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
    this.resetCounter.update(c => c + 1);
    this.lineItemsForSubmit.set([]);
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

  initials(name: string | null | undefined, _lastName?: string): string {
    if (!name || typeof name !== 'string' || name.trim().length === 0) return '?';
    return name.trim()[0].toUpperCase();
  }

  customerFullName(c: { name: string; lastName?: string }): string {
    return c.lastName?.trim() ? `${c.name} ${c.lastName}` : c.name;
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