import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, inject, signal, HostListener, ElementRef, ViewChild } from '@angular/core';
import type { OnInit } from '@angular/core';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { LocaleService } from '../../shared/services/locale.service';
import { type BillflowSidebarItem } from '../../shared/components/billflow-sidebar.component';
import { buildBillflowSidebarItems } from '../../shared/billflow-navigation';
import type { ComboboxOption } from '../../shared/components/billflow-combobox.component';
import { BillflowPageShellComponent } from '../../shared/components/billflow-page-shell.component';
import { DashboardParticlesBackgroundComponent } from '../dashboard/dashboard-particles-background.component';
import { BillflowMobileSidebarComponent } from '../../shared/components/billflow-mobile-sidebar.component';
import { BillflowNotificationButtonComponent } from '../../shared/components/billflow-notification-button.component';
import { BillflowUserMenuComponent } from '../../shared/components/billflow-user-menu.component';
import type { CustomerEntity, CreateCustomerPayload } from './domain/customer.entity';
import { CustomerRepository } from './domain/customer.repository';
import { CustomerImplRepository } from './data/customer-impl.repository';
import { ListCustomersUseCase } from './domain/use-cases/list-customers.use-case';
import { CreateCustomerUseCase } from './domain/use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from './domain/use-cases/update-customer.use-case';
import { ToggleCustomerActiveUseCase } from './domain/use-cases/toggle-customer-active.use-case';
import { customersCopy } from './i18n/customers.translations';
import { CustomerKpiCardsComponent } from './components/customer-kpi-cards.component';
import { CustomerTableComponent } from './components/customer-table.component';
import { CustomerFormModalComponent } from './components/customer-form-modal.component';

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
  @ViewChild('userMenuPanel') private userMenuPanel?: ElementRef<HTMLElement>;

  locale = this.localeService.locale;
  copy = customersCopy(this.locale);

  loading = signal(true);
  customers = signal<CustomerEntity[]>([]);
  searchQuery = signal('');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  searchField = signal<'all' | 'name' | 'lastName' | 'cedula' | 'email' | 'phone'>('all');
  page = signal(1);
  pageSize = signal(5);
  theme = signal<'light' | 'dark'>('light');

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

  userMenuVisible = signal(false);
  userMenuClosing = signal(false);
  userMenuOpen = signal(false);
  displayName = 'Usuario';
  userInitials = 'US';
  private userMenuCloseTimeout: number | undefined;

  readonly totalCustomersCount = computed(() => this.customers().length);
  readonly activeCustomersCount = computed(() => this.customers().filter((c) => c.isActive).length);
  readonly inactiveCustomersCount = computed(() => this.customers().filter((c) => !c.isActive).length);

  readonly filteredCustomers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const field = this.searchField();
    return this.customers().filter((customer) => {
      let matchesQuery = true;
      if (query) {
        if (field === 'all') {
          matchesQuery = [customer.firstName, customer.lastName, customer.cedula, customer.email ?? '', customer.phone ?? '']
            .some((f) => f.toLowerCase().includes(query));
        } else if (field === 'name') {
          matchesQuery = customer.firstName.toLowerCase().includes(query);
        } else if (field === 'lastName') {
          matchesQuery = customer.lastName.toLowerCase().includes(query);
        } else if (field === 'cedula') {
          matchesQuery = customer.cedula.toLowerCase().includes(query);
        } else if (field === 'email') {
          matchesQuery = (customer.email ?? '').toLowerCase().includes(query);
        } else if (field === 'phone') {
          matchesQuery = (customer.phone ?? '').toLowerCase().includes(query);
        }
      }
      const matchesStatus = status === 'all'
        || (status === 'active' && customer.isActive)
        || (status === 'inactive' && !customer.isActive);
      return matchesQuery && matchesStatus;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredCustomers().length / this.pageSize())));

  readonly paginatedCustomers = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredCustomers().slice(start, start + this.pageSize());
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

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  async ngOnInit() {
    this.applyStoredTheme();
    this.applyStoredUser();
    await this.reloadCustomers();
  }

  async reloadCustomers() {
    this.loading.set(true);
    try {
      this.customers.set(await this.listCustomers.execute());
      this.page.set(1);
    } catch {
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'No se pudieron cargar los clientes' : 'Could not load customers',
        this.locale() === 'es' ? 'Revisá la conexión con el backend.' : 'Please check the backend connection.');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Theme ─────────────────────────────────────────────────────────────────
  toggleTheme() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.persistTheme(next);
  }

  toggleLocale() { this.localeService.toggle(); }

  iconVariationSettings(active = false) { return active ? "'FILL' 1" : "'FILL' 0"; }

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

  // ── Search & filter ───────────────────────────────────────────────────────
  setSearchQuery(value: string) { this.searchQuery.set(value); this.page.set(1); }

  setSearchField(value: string) { this.searchField.set(value as any); this.page.set(1); }

  setStatusFilter(value: string) {
    this.statusFilter.set(value === 'active' || value === 'inactive' ? value : 'all');
    this.page.set(1);
  }

  onPageSizeCombo(value: string) {
    const num = parseInt(value, 10);
    if (!Number.isFinite(num) || num < 5) return;
    this.pageSize.set(num);
    this.page.set(1);
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

  // ── User menu ─────────────────────────────────────────────────────────────
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

  async logout() {
    this.closeUserMenu();
    const confirmed = await this.feedback.confirm(this.copy().signOut,
      this.locale() === 'es' ? '¿Seguro que querés salir del panel?' : 'Are you sure you want to leave the dashboard?',
      this.copy().signOut, this.copy().cancelBtn);
    if (!confirmed || typeof window === 'undefined') return;
    window.localStorage.removeItem('billflow-session');
    window.location.replace('/auth');
  }

  openNotifications() {
    void this.feedback.toast('info', this.copy().notifications,
      this.locale() === 'es' ? 'Tenés 3 movimientos críticos esperando revisión.' : 'You have 3 critical movements waiting for review.');
  }

  async openUserSettings() {
    this.closeUserMenu();
    await this.feedback.alert('info', this.copy().settings,
      this.locale() === 'es' ? 'Acá podés actualizar tu perfil y preferencias.' : 'You can update your profile and preferences here.');
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
