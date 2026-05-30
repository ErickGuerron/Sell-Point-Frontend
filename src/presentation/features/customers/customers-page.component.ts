import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, inject, signal, Input } from '@angular/core';
import type { OnInit } from '@angular/core';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { LocaleService } from '../../shared/services/locale.service';
import { SessionService } from '../../shared/services/session.service';
import { ThemeService } from '../../shared/services/theme.service';
import { type BillflowSidebarItem } from '../../shared/components/billflow-sidebar.component';
import { buildBillflowSidebarItems } from '../../shared/billflow-navigation';
import type { ComboboxOption } from '../../shared/components/billflow-combobox.component';
import { BillflowPageShellComponent } from '../../shared/components/billflow-page-shell.component';
import { DashboardParticlesBackgroundComponent } from '../dashboard/dashboard-particles-background.component';
import { BillflowMobileSidebarComponent } from '../../shared/components/billflow-mobile-sidebar.component';
import { BillflowNotificationButtonComponent } from '../../shared/components/billflow-notification-button.component';
import { BillflowUserMenuComponent } from '../../shared/components/billflow-user-menu.component';
import type { CustomerEntity, CreateCustomerPayload } from './domain/customer.entity';
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
    BillflowUserMenuComponent,
    CustomerKpiCardsComponent, CustomerTableComponent, CustomerFormModalComponent,
  ],
  providers: [
    { provide: CustomerRepository, useClass: CustomerImplRepository },
    ListCustomersUseCase, CreateCustomerUseCase,
    UpdateCustomerUseCase, ToggleCustomerActiveUseCase,
  ],
  templateUrl: './customers-page.component.html',
})
export class CustomersPageComponent implements OnInit {
  private readonly listCustomers = inject(ListCustomersUseCase);
  private readonly createCustomer = inject(CreateCustomerUseCase);
  private readonly updateCustomer = inject(UpdateCustomerUseCase);
  private readonly toggleActive = inject(ToggleCustomerActiveUseCase);
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);
  protected readonly session = inject(SessionService);
  protected readonly themeService = inject(ThemeService);

  locale = this.localeService.locale;
  copy = customersCopy(this.locale);

  loading = signal(false);
  customers = signal<CustomerEntity[]>([]);
  totalCustomers = signal(0);
  totalPages = signal(1);
  searchQuery = signal('');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  searchField = signal<'all' | 'name' | 'lastName' | 'cedula' | 'email' | 'phone'>('all');
  page = signal(1);
  pageSize = signal(5);
  private reloadTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Computeds ──────────────────────────────────────────────────────────────
  readonly sidebarItems = computed(() => buildBillflowSidebarItems({
    dashboard: 'Dashboard',
    invoices: this.locale() === 'es' ? 'Facturas' : 'Invoices',
    customers: this.locale() === 'es' ? 'Clientes' : 'Customers',
    products: this.locale() === 'es' ? 'Productos' : 'Products',
    employees: this.locale() === 'es' ? 'Empleados' : 'Employees',
  }, 'customers'));

  readonly mobileNavItems = computed<BillflowSidebarItem[]>(() => [
    { label: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
    { label: this.locale() === 'es' ? 'Facturas' : 'Invoices', icon: 'receipt_long', href: '/invoices' },
    { label: this.locale() === 'es' ? 'Clientes' : 'Customers', icon: 'groups', href: '/customers', active: true },
    { label: this.locale() === 'es' ? 'Productos' : 'Products', icon: 'inventory_2', href: '/dashboard' },
  ]);

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
    { value: 'all', label: this.locale() === 'es' ? 'Cualquier campo' : 'Any field' },
    { value: 'name', label: this.copy().name },
    { value: 'lastName', label: this.copy().lastName },
    { value: 'cedula', label: this.copy().document },
    { value: 'email', label: this.copy().email },
    { value: 'phone', label: this.copy().phone },
  ]);

  readonly totalCustomersCount = computed(() => this.totalCustomers());
  readonly activeCustomersCount = computed(() => this.customers().filter((c) => c.isActive).length);
  readonly inactiveCustomersCount = computed(() => this.customers().filter((c) => !c.isActive).length);

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
    if (!value) return;
    this.hasInitialData = true;
    this.customers.set(value.customers);
    this.totalCustomers.set(value.totalCustomers);
    this.totalPages.set(value.totalPages);
    this.page.set(value.page);
    this.pageSize.set(value.pageSize);
    this.loading.set(false);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  async ngOnInit() {
    this.themeService.init();
    this.session.init();
    if (this.hasInitialData) return;
    await this.reloadCustomers();
  }

  private buildListParams(): CustomerListParams {
    const query = this.searchQuery().trim();
    const field = this.searchField();
    const params: CustomerListParams = {
      page: this.page(),
      limit: this.pageSize(),
    };

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
      this.totalCustomers.set(result.pagination.total);
      this.totalPages.set(Math.max(1, result.pagination.totalPages));
      this.page.set(result.pagination.page);
      this.pageSize.set(result.pagination.limit);
    } catch {
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'No se pudieron cargar los clientes' : 'Could not load customers',
        this.locale() === 'es' ? 'Revisá la conexión con el backend.' : 'Please check the backend connection.');
    } finally {
      this.loading.set(false);
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

  // ── Modal handlers ────────────────────────────────────────────────────────
  openCreateModal() { this.editingCustomer.set(null); this.customerModalOpen.set(true); }

  openEditModal(customer: CustomerEntity) { this.editingCustomer.set(customer); this.customerModalOpen.set(true); }

  closeCustomerModal() { this.customerModalOpen.set(false); this.editingCustomer.set(null); }

  async handleSave(payload: CreateCustomerPayload) {
    try {
      const editing = this.editingCustomer();
      if (editing) {
        await this.updateCustomer.execute(editing.id, payload);
        await this.feedback.toast('success', this.copy().updatedToast);
      } else {
        await this.createCustomer.execute(payload);
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

  async handleToggleActive(customer: CustomerEntity) {
    const isActive = customer.isActive;
    const confirmed = await this.feedback.confirm(
      isActive ? this.copy().confirmDeactivateTitle : this.copy().confirmActivateTitle,
      isActive ? this.copy().confirmDeactivateText : this.copy().confirmActivateText,
      this.copy().confirmBtn, this.copy().cancelBtn,
    );
    if (!confirmed) return;
    try {
      await this.toggleActive.execute(customer.id, isActive);
      await this.feedback.toast('success', isActive ? this.copy().toggledInactive : this.copy().toggledActive);
      await this.reloadCustomers();
    } catch (err) {
      console.error('[toggle active]', err);
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'Error al cambiar el estado' : 'Error changing status');
    }
  }

}
