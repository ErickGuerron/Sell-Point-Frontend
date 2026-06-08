import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, inject, signal, Input } from '@angular/core';
import type { OnInit, OnDestroy } from '@angular/core';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { LocaleService, type AppLocale } from '../../shared/services/locale.service';
import { SessionService } from '../../shared/services/session.service';
import { ThemeService } from '../../shared/services/theme.service';
import { PermissionsService, PERMISSIONS } from '../../shared/services/permissions.service';
import { KeyboardShortcutService } from '../../shared/services/keyboard-shortcut.service';
import { type BillflowSidebarItem } from '../../shared/components/billflow-sidebar.component';
import { buildBillflowSidebarItems } from '../../shared/billflow-navigation';
import { BillflowPageShellComponent } from '../../shared/components/billflow-page-shell.component';
import { BillflowDateRangePickerComponent } from '../../shared/components/billflow-date-range-picker.component';
import { DashboardParticlesBackgroundComponent } from '../dashboard/dashboard-particles-background.component';
import { BillflowMobileSidebarComponent } from '../../shared/components/billflow-mobile-sidebar.component';
import { BillflowNotificationButtonComponent } from '../../shared/components/billflow-notification-button.component';
import { BillflowUserMenuComponent } from '../../shared/components/billflow-user-menu.component';
import type { CustomerEntity, CreateCustomerPayload } from './domain/customer.entity';
import { CustomerRemoteDataSource } from './data/customer-remote.datasource';
import { ApiRequestError } from '../employees/employee-api.service';
import { CustomerRepository, type CustomerListParams } from './domain/customer.repository';
import { CustomerImplRepository } from './data/customer-impl.repository';
import { ListCustomersUseCase } from './domain/use-cases/list-customers.use-case';
import { CreateCustomerUseCase } from './domain/use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from './domain/use-cases/update-customer.use-case';
import { ToggleCustomerActiveUseCase } from './domain/use-cases/toggle-customer-active.use-case';
import { customersCopy } from './i18n/customers.translations';
import { CustomerKpiCardsComponent } from './components/customer-kpi-cards.component';
import { CustomerTableComponent } from './components/customer-table.component';
import { CustomerFormModalComponent } from './components/customer-form-modal.component';
import type { CustomersInitialData } from '../../shared/ssr-page-data';

@Component({
  selector: 'billflow-customers-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    BillflowPageShellComponent, DashboardParticlesBackgroundComponent,
    BillflowMobileSidebarComponent, BillflowNotificationButtonComponent,
    BillflowUserMenuComponent, BillflowDateRangePickerComponent,
    CustomerKpiCardsComponent, CustomerTableComponent, CustomerFormModalComponent,
  ],
  providers: [
    { provide: CustomerRepository, useClass: CustomerImplRepository },
    ListCustomersUseCase, CreateCustomerUseCase,
    UpdateCustomerUseCase, ToggleCustomerActiveUseCase,
  ],
  template: `
<billflow-page-shell
  [items]="sidebarItems()"
  [locale]="locale()"
  (settings)="session.openUserSettings()"
  (logout)="session.logout()">
  <billflow-dashboard-particles-background class="app-invoice-bg"></billflow-dashboard-particles-background>

  <div class="flex-1 min-w-0 app-invoices-shell app-dashboard-main">
    <header class="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-xl">
      <div class="py-3 px-5 md:px-6 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 shrink-0">
          <span class="hidden md:inline-flex lg:hidden" *ngIf="permissions.isAdmin()">
            <billflow-mobile-sidebar [items]="sidebarItems()" [actionLabel]="copy().newCustomer" actionIcon="add" (actionClick)="openCreateModal()"></billflow-mobile-sidebar>
          </span>
          <span class="material-symbols-outlined text-outline">groups</span>
          <span class="font-h3 text-h3 text-on-background">{{ copy().moduleLabel }}</span>
        </div>

        <div class="flex items-center gap-2 ml-auto shrink-0 self-auto relative z-40">
          <billflow-notification-button (clicked)="session.openNotifications()"></billflow-notification-button>
          <billflow-user-menu
            [displayName]="session.displayName()"
            [initials]="session.userInitials()"
            [showLanguageToggle]="true"
            [languageLabel]="copy().languageToggle"
            [settingsLabel]="copy().settings"
            [logoutLabel]="copy().signOut"
            [sessionLabel]="copy().sessionLabel"
            (languageToggle)="toggleLocale()"
            (settings)="session.openUserSettings()"
            (logout)="session.logout()"
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
          <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ totalCustomersCount() }} {{ copy().resultsLabel }}</span>
        </div>
      </section>

      <!-- KPI Cards -->
      @defer (on timer(200ms)) {
        <billflow-customer-kpi-cards
          [total]="totalCustomersCount()"
          [active]="activeCustomersCount()"
          [inactive]="inactiveCustomersCount()">
        </billflow-customer-kpi-cards>
      } @placeholder {
        <section class="grid grid-cols-3 gap-4 mb-6">
          @for (i of [1,2,3]; track i) {
            <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl animate-pulse">
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-xl bg-surface-container-high shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3 w-20 rounded bg-surface-container-high"></div>
                  <div class="h-6 w-10 rounded bg-surface-container-high"></div>
                </div>
              </div>
            </div>
          }
        </section>
      }

      <!-- Customer Table -->
      @defer (on idle) {
        <billflow-customer-table
          [customers]="filteredCustomers()"
          [loading]="loading()"
          [page]="page()"
          [totalPages]="totalPages()"
          [pageSize]="pageSize()"
          [visiblePages]="visiblePages()"
          [filteredCount]="totalCustomersCount()"
          [rangeStart]="visibleRangeStart()"
          [rangeEnd]="visibleRangeEnd()"
          [searchQuery]="searchQuery()"
          [searchField]="searchField()"
          [statusFilter]="statusFilter()"
          [statusFilterOptions]="statusFilterOptions()"
          [searchFieldOptions]="searchFieldOptions()"
          [pageSizeOptions]="pageSizeOptions"
          [isAdmin]="permissions.isAdmin()"
          (edit)="openEditModal($event)"
          (toggleActive)="handleToggleActive($event)"
          (pageChange)="goToPage($event)"
          (pageSizeChange)="onPageSizeCombo($event)"
          (searchQueryChange)="setSearchQuery($event)"
          (searchFieldChange)="setSearchField($event)"
          (statusFilterChange)="setStatusFilter($event)"
          (refresh)="reloadCustomers()"
          (openCreate)="openCreateModal()"
          [createdFrom]="createdFrom()"
          [createdTo]="createdTo()"
          (createdFromChange)="createdFrom.set($event); scheduleReload({ resetPage: true })"
          (createdToChange)="createdTo.set($event); scheduleReload({ resetPage: true })"
        ></billflow-customer-table>
      } @placeholder {
        <div class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden animate-pulse">
          <div class="p-4 md:p-5 border-b border-outline-variant/30 flex items-center gap-3">
            <div class="h-9 w-48 rounded-lg bg-surface-container-high"></div>
            <div class="h-9 w-32 rounded-lg bg-surface-container-high"></div>
          </div>
          <div class="p-8 flex items-center justify-center">
            <div class="flex items-center gap-3 text-on-surface-variant">
              <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <span>{{ copy().loadingText }}</span>
            </div>
          </div>
        </div>
      }
    </main>

    <!-- Customer Form Modal -->
    @defer (on interaction) {
      <billflow-customer-form-modal
        [open]="customerModalOpen()"
        [editing]="editingCustomer()"
        [copy]="copy()"
        [serverCedulaError]="serverCedulaError()"
        [serverEmailError]="serverEmailError()"
        (save)="handleSave($event)"
        (close)="closeCustomerModal()">
      </billflow-customer-form-modal>
    } @placeholder {
      <!-- Modal deferred until user interaction -->
    }

    <!-- Mobile nav -->
    <nav class="md:hidden app-dashboard-mobile-nav">
      <a *ngFor="let item of mobileNavItems()" class="flex flex-col items-center justify-center w-full h-full pt-1 border-t-2 transition-colors app-dashboard-mobile-link" [href]="item.href" [ngClass]="item.active ? 'text-primary border-primary app-dashboard-mobile-link--active' : 'border-transparent'">
        <span class="material-symbols-outlined" [style.font-variation-settings]="themeService.iconVariationSettings(item.active)">{{ item.icon }}</span>
        <span class="text-[10px] font-medium mt-1">{{ item.label }}</span>
      </a>

      <div class="app-dashboard-mobile-fab-wrap">
        <button type="button" *ngIf="permissions.isAdmin()" class="w-14 h-14 bg-[#6862f3] text-white rounded-full shadow-lg shadow-[#6862f3]/30 flex items-center justify-center hover:bg-[#514be6] active:scale-95 transition-all border-[3px] border-surface" (click)="openCreateModal()">
          <span class="material-symbols-outlined text-[24px]">add</span>
        </button>
      </div>
    </nav>
  </div>
</billflow-page-shell>
  `,
})
export class CustomersPageComponent implements OnInit, OnDestroy {
  private readonly listCustomers = inject(ListCustomersUseCase);
  private readonly createCustomer = inject(CreateCustomerUseCase);
  private readonly updateCustomer = inject(UpdateCustomerUseCase);
  private readonly toggleActive = inject(ToggleCustomerActiveUseCase);
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);
  private readonly customerDs = inject(CustomerRemoteDataSource);
  protected readonly session = inject(SessionService);
  protected readonly themeService = inject(ThemeService);
  private readonly permissions = inject(PermissionsService);
  private readonly keyboardShortcuts = inject(KeyboardShortcutService);

  locale = this.localeService.locale;
  copy = computed(() => CUSTOMERS_TEXT[this.locale()]);

  @Input() set initialLocale(value: AppLocale | null | undefined) {
    if (!value) return;
    this.localeService.seedLocale(value);
  }

  loading = signal(false);
  customers = signal<CustomerEntity[]>([]);
  totalCustomers = signal(0);
  totalPages = signal(1);
  searchQuery = signal('');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  searchField = signal<'all' | 'name' | 'lastName' | 'cedula' | 'email' | 'phone'>('all');
  page = signal(1);
  pageSize = signal(5);
  totalKpi = signal(0);
  activeKpi = signal(0);
  inactiveKpi = signal(0);
  createdFrom = signal<string | null>(null);
  createdTo = signal<string | null>(null);
  serverCedulaError = signal<string | null>(null);
  serverEmailError = signal<string | null>(null);
  private reloadTimer: ReturnType<typeof setTimeout> | null = null;

  readonly sidebarItems = computed(() => buildBillflowSidebarItems({
    dashboard: this.copy().sidebarDashboard,
    invoices: this.copy().sidebarInvoices,
    customers: this.copy().sidebarCustomers,
    products: this.copy().sidebarProducts,
    employees: this.copy().sidebarEmployees,
  }, 'customers', this.permissions));

  readonly mobileNavItems = computed<BillflowSidebarItem[]>(() => {
    const items: BillflowSidebarItem[] = [
      { label: this.copy().sidebarDashboard, icon: 'dashboard', href: '/dashboard' },
      { label: this.copy().sidebarInvoices, icon: 'receipt_long', href: '/invoices' },
      { label: this.copy().sidebarCustomers, icon: 'groups', href: '/customers', active: true },
      { label: this.copy().sidebarProducts, icon: 'inventory_2', href: '/products' },
    ];

    // Only ADMIN sees employees in mobile nav
    if (this.permissions.isAdmin()) {
      items.push({ label: this.copy().sidebarEmployees, icon: 'badge', href: '/employees' });
    }
    return items;
  });

  theme = signal<'light' | 'dark'>('light');
  loading = signal(true);
  customers = signal<CustomerRowDto[]>([]);
  searchQuery = signal('');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  page = signal(1);
  pageSize = signal(5);
  displayName = 'Usuario';
  userInitials = 'US';

  readonly pageSizeOptions: ComboboxOption[] = [
    { value: '5', label: '5' },
    { value: '10', label: '10' },
    { value: '15', label: '15' },
    { value: '20', label: '20' },
    { value: '30', label: '30' },
  ];

  readonly statusFilterOptions = computed<ComboboxOption[]>(() => [
    { value: 'all', label: this.copy().allStatuses },
    { value: 'active', label: this.copy().active },
    { value: 'inactive', label: this.copy().inactive },
  ]);

  readonly searchFieldOptions = computed<ComboboxOption[]>(() => [
    { value: 'all', label: this.copy().allFields },
    { value: 'name', label: this.copy().name },
    { value: 'lastName', label: this.copy().lastName },
    { value: 'cedula', label: this.copy().document },
    { value: 'email', label: this.copy().email },
    { value: 'phone', label: this.copy().phone },
  ]);
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
  formAddress = signal('');
  nameFieldError = signal<'firstName' | 'lastName' | null>(null);

  readonly formValid = computed(() =>
    this.formFirstName().trim().length > 0
    && this.formLastName().trim().length > 0
    && this.formCedula().trim().length >= 6
  );

  searchField = signal<'all' | 'name' | 'lastName' | 'cedula' | 'email' | 'phone'>('all');

  readonly totalCustomersCount = computed(() => this.totalCustomers());
  readonly activeCustomersCount = computed(() => this.activeKpi());
  readonly inactiveCustomersCount = computed(() => this.inactiveKpi());

  // ── Filters & pagination ──────────────────────────────────────────────────
  readonly filteredCustomers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const field = this.searchField();

    return this.customers().filter((customer) => {
      const matchesStatus = status === 'all'
        || (status === 'active' && customer.isActive)
        || (status === 'inactive' && !customer.isActive);

      if (!matchesStatus) return false;
      if (!query) return true;

      if (field === 'name') return customer.firstName.toLowerCase().includes(query);
      if (field === 'lastName') return customer.lastName.toLowerCase().includes(query);
      if (field === 'cedula') return customer.cedula.toLowerCase().includes(query);
      if (field === 'email') return (customer.email ?? '').toLowerCase().includes(query);
      if (field === 'phone') return (customer.phone ?? '').toLowerCase().includes(query);

      return [customer.firstName, customer.lastName, customer.cedula, customer.email ?? '', customer.phone ?? '']
        .some((value) => value.toLowerCase().includes(query));
    });
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

  // ── Modal state ──────────────────────────────────────────────────────────
  customerModalOpen = signal(false);
  editingCustomer = signal<CustomerEntity | null>(null);
  private hasInitialData = false;

  @Input() set initialData(value: CustomersInitialData | null | undefined) {
    if (!value || value.isAuthenticated === false) return;
    this.hasInitialData = true;
    this.customers.set(value.customers);
    this.totalCustomers.set(value.totalCustomers);
    this.totalPages.set(value.totalPages);
    this.page.set(value.page);
    this.pageSize.set(value.pageSize);
    this.totalKpi.set(value.totalKpi);
    this.activeKpi.set(value.activeKpi);
    this.inactiveKpi.set(value.inactiveKpi);
    this.loading.set(false);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  async ngOnInit() {
    if (typeof window === 'undefined') return;
    this.themeService.init();
    this.session.init();

    const restored = await this.session.restoreSession();
    if (!restored) return;

    this.keyboardShortcuts.register(
      { keys: 'n', descriptionEn: 'New Customer', descriptionEs: 'Nuevo Cliente', category: 'actions', permission: PERMISSIONS.CUSTOMERS_CREATE, action: () => { void this.openCreateModal(); } },
      { keys: 'r', descriptionEn: 'Refresh list', descriptionEs: 'Actualizar lista', category: 'actions', action: () => { void this.reloadCustomers(); } },
      { keys: '/', descriptionEn: 'Focus search', descriptionEs: 'Buscar', category: 'actions', action: () => this.focusSearch() },
    );
    if (this.hasInitialData) return;
    await Promise.all([
      this.reloadCustomers(),
      this.reloadKpis(),
    ]);
  }

  ngOnDestroy(): void {
    this.keyboardShortcuts.unregister('n', 'r', '/');
  }

  private focusSearch(): void {
    const input = document.querySelector<HTMLInputElement>(
      'billflow-customer-table input[placeholder*="Buscar"], ' +
      'billflow-customer-table input[placeholder*="Search"]'
    );
    input?.focus();
    input?.select();
  }

  private buildListParams(): CustomerListParams {
    const query = this.searchQuery().trim();
    const field = this.searchField();
    const params: CustomerListParams = {
      page: this.page(),
      limit: this.pageSize(),
    };

    const from = this.createdFrom();
    const to = this.createdTo();
    if (from) params.createdFrom = from;
    if (to) params.createdTo = to;

    if (!query) return params;
    if (field === 'cedula') {
      params.cedula = query;
      return params;
    }

    if (field === 'all' || field === 'name' || field === 'lastName') {
      params.q = query;
    }

    return params;
  }

  async reloadCustomers(options: { resetPage?: boolean } = {}) {
    if (options.resetPage) this.page.set(1);
    this.loading.set(true);
    try {
      const result = await this.listCustomers.execute(this.buildListParams());
      this.customers.set(result.data);
      this.totalCustomers.set(result.total);
      this.totalPages.set(result.totalPages);
      this.page.set(result.page);
      this.pageSize.set(result.limit);
    } catch {
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'No se pudieron cargar los clientes' : 'Could not load customers',
        this.locale() === 'es' ? 'Revise la conexión con el backend.' : 'Please check the backend connection.');
    } finally {
      this.loading.set(false);
    }
  }

  async reloadKpis() {
    try {
      const kpis = await this.customerDs.getKpis();
      this.totalKpi.set(kpis.totalCustomers);
      this.activeKpi.set(kpis.activeCustomers);
      this.inactiveKpi.set(kpis.inactiveCustomers);
    } catch (err) {
      console.error('[customers] kpis load error:', err);
    }
  }

  private scheduleReload(options: { resetPage?: boolean } = {}): void {
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
    }

    this.reloadTimer = setTimeout(() => {
      void this.reloadCustomers(options);
    }, 250);
  }

  toggleLocale() { this.localeService.toggle(); }

  visibleRangeStart() {
    if (this.filteredCustomers().length === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  visibleRangeEnd() {
    return Math.min(this.totalCustomers(), (this.page() - 1) * this.pageSize() + this.filteredCustomers().length);
  }

  // ── Search & filter ───────────────────────────────────────────────────────
  setSearchQuery(value: string) {
    this.searchQuery.set(value);
    this.scheduleReload({ resetPage: true });
  }

  setSearchField(value: string) {
    this.searchField.set(value as any);
    this.scheduleReload({ resetPage: true });
  }

  setStatusFilter(value: string) {
    this.statusFilter.set(value === 'active' || value === 'inactive' ? value : 'all');
  }

  goToPage(pageNumber: number) {
    const nextPage = Math.max(1, Math.min(pageNumber, this.totalPages()));
    if (nextPage === this.page()) return;
    this.page.set(nextPage);
    void this.reloadCustomers();
  }

  onPageSizeCombo(value: number) {
    if (!Number.isFinite(value) || value < 5) return;
    const nextSize = Math.min(value, 30);
    if (nextSize === this.pageSize()) return;
    this.pageSize.set(nextSize);
    this.page.set(1);
    void this.reloadCustomers();
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  nextPage() {
    if (this.page() < this.totalPages()) this.page.update((v) => v + 1);
  }

  previousPage() {
    if (this.page() > 1) this.page.update((v) => v - 1);
  }

  private clearServerErrors(): void {
    this.serverCedulaError.set(null);
    this.serverEmailError.set(null);
  }

  closeCustomerModal() { this.clearServerErrors(); this.customerModalOpen.set(false); this.editingCustomer.set(null); }

  private applyDuplicateFieldError(err: unknown): boolean {
    const text = this.extractErrorText(err).toLowerCase();
    const status = err instanceof ApiRequestError ? err.status : undefined;
    const body = err instanceof ApiRequestError ? err.body : undefined;
    const bodyText = this.extractErrorText(body).toLowerCase();
    const combined = `${text} ${bodyText}`;

    const structuredErrors = this.extractStructuredDuplicateErrors(body);
    const structuredMatched = this.applyStructuredDuplicateErrors(structuredErrors);
    if (structuredMatched) return true;

    const looksDuplicate = status === 409 || /already|exist|unique|duplic|registrad/.test(combined);
    if (!looksDuplicate) return false;

    const isEmail = /email|correo|mail/.test(combined);
    const isCedula = /cedula|c[eé]dula|document|dni|id number/.test(combined);

    if (isEmail && !isCedula) {
      this.serverEmailError.set(this.copy().duplicateEmail);
      return true;
    }

    if (isCedula && !isEmail) {
      this.serverCedulaError.set(this.copy().duplicateCedula);
      return true;
    }

    if (isEmail) {
      this.serverEmailError.set(this.copy().duplicateEmail);
      return true;
    }

    if (isCedula) {
      this.serverCedulaError.set(this.copy().duplicateCedula);
      return true;
    }

    return false;
  }

  private applyStructuredDuplicateErrors(errors: Record<string, string>): boolean {
    let matched = false;

    if (errors.email) {
      this.serverEmailError.set(this.copy().duplicateEmail);
      matched = true;
    }

    if (errors.cedula) {
      this.serverCedulaError.set(this.copy().duplicateCedula);
      matched = true;
    }

    return matched;
  }

  private extractStructuredDuplicateErrors(body: unknown): Record<string, string> {
    if (!body || typeof body !== 'object') return {};
    const value = body as Record<string, unknown>;
    const errors = value.errors;
    if (!errors || typeof errors !== 'object') return {};
    return errors as Record<string, string>;
  }

  private extractErrorText(err: unknown): string {
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message || '';
    if (!err || typeof err !== 'object') return '';
    const value = err as Record<string, unknown>;
    if (typeof value.message === 'string') return value.message;
    if (typeof value.error === 'string') return value.error;
    if (typeof value.body === 'string') return value.body;
    return '';
  }

  async handleSave(payload: CreateCustomerPayload) {
    this.clearServerErrors();
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
      if (!this.applyDuplicateFieldError(err)) {
        await this.feedback.alert('error',
          this.locale() === 'es' ? 'Error al guardar el cliente' : 'Error saving customer');
      }
    }
    void this.reloadKpis();
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
      void this.reloadKpis();
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

  customerFullName(customer: { name: string; lastName?: string }): string {
    return customer.lastName?.trim()
      ? `${customer.name} ${customer.lastName}`
      : customer.name;
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
    const fullName = this.customerFullName(customer);

    const html = `
<div style="font-family: monospace; font-size: 14px; line-height: 1.8; text-align: left;">
  <div style="font-weight: bold; padding-bottom: 6px; border-bottom: 1px solid #ccc; margin-bottom: 10px;">
    ${this.locale() === 'es' ? 'DATOS PERSONALES' : 'PERSONAL INFO'}
  </div>
  <div><strong>${this.locale() === 'es' ? 'Nombre' : 'Name'}:</strong> ${fullName}</div>
  <div><strong>${this.locale() === 'es' ? 'Cédula' : 'ID'}:</strong> ${customer.cedula ?? '—'}</div>
  <div><strong>Email:</strong> ${customer.email || '—'}</div>
  <div><strong>${this.locale() === 'es' ? 'Teléfono' : 'Phone'}:</strong> ${customer.phone || '—'}</div>
  <div><strong>${this.locale() === 'es' ? 'Dirección' : 'Address'}:</strong> ${customer.address || '—'}</div>
  <div style="font-weight: bold; padding-top: 10px; margin-top: 10px; border-top: 1px solid #ccc;">
    ${this.locale() === 'es' ? 'ESTADO' : 'STATUS'}
  </div>
  <div><strong>${this.locale() === 'es' ? 'Estado' : 'Status'}:</strong> ${statusText}</div>
</div>`;

    void this.feedback.alertHtml(
      'info',
      this.locale() === 'es' ? 'Detalles del Cliente' : 'Customer Details',
      html,
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
