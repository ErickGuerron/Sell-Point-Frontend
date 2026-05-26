import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, inject, signal, HostListener, ElementRef, ViewChild } from '@angular/core';
import type { OnInit } from '@angular/core';
import { InvoiceApiService, type CustomerRowDto, type CreateCustomerPayload } from '../invoices/invoice-api.service';
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
import { BillflowComboboxComponent, type ComboboxOption } from '../../shared/components/billflow-combobox.component';

type CustomersLocale = 'es' | 'en';

interface CustomersCopy {
  moduleLabel: string;
  title: string;
  description: string;
  resultsLabel: string;
  themeLabel: string;
  searchPlaceholder: string;
  newCustomer: string;
  name: string;
  lastName: string;
  document: string;
  email: string;
  phone: string;
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
  allStatuses: string;
  active: string;
  inactive: string;
  noCustomersTitle: string;
  noCustomersText: string;
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
  // Form field labels
  firstNameLabel: string;
  lastNameLabel: string;
  docLabel: string;
  phoneLabel: string;
  emailLabel: string;
  nameError: string;
  cedulaPlaceholder: string;
  phonePlaceholder: string;
  emailPlaceholder: string;
  cancel: string;
}

const CUSTOMERS_TEXT: Record<CustomersLocale, CustomersCopy> = {
  es: {
    moduleLabel: 'Módulo de Clientes',
    title: 'Gestión de Clientes',
    description: 'Administrá, editá y controlá el estado de tus clientes.',
    resultsLabel: 'resultados',
    themeLabel: 'Tema',
    searchPlaceholder: 'Buscar clientes...',
    newCustomer: 'Nuevo Cliente',
    name: 'Nombre',
    lastName: 'Apellido',
    document: 'Documento',
    email: 'Email',
    phone: 'Teléfono',
    status: 'Estado',
    actions: 'Acciones',
    edit: 'Editar',
    deactivate: 'Desactivar',
    activate: 'Activar',
    confirmDeactivateTitle: '¿Desactivar cliente?',
    confirmDeactivateText: 'El cliente dejará de estar disponible para nuevas operaciones, pero el historial se conserva.',
    confirmActivateTitle: '¿Activar cliente?',
    confirmActivateText: 'El cliente volverá a estar disponible para nuevas operaciones.',
    confirmBtn: 'Sí',
    cancelBtn: 'Cancelar',
    allStatuses: 'Todos los estados',
    active: 'Activo',
    inactive: 'Inactivo',
    noCustomersTitle: 'No hay clientes',
    noCustomersText: 'Probá con otro filtro o término de búsqueda.',
    showingText: 'Mostrando',
    entriesText: 'registros',
    createdToast: 'Cliente creado correctamente',
    updatedToast: 'Cliente actualizado correctamente',
    toggledActive: 'Cliente activado correctamente',
    toggledInactive: 'Cliente desactivado correctamente',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Facturas',
    sidebarCustomers: 'Clientes',
    sidebarProducts: 'Productos',
    sidebarEmployees: 'Empleados',
    signOut: 'Cerrar sesión',
    settings: 'Configuración',
    notifications: 'Notificaciones',
    languageToggle: 'English',
    sessionLabel: 'Sesión',
    modalCreateTitle: 'Nuevo Cliente',
    modalCreateSubtitle: 'Completá los datos del nuevo cliente',
    modalEditTitle: 'Editar Cliente',
    modalEditSubtitle: 'Actualizá los datos del cliente',
    save: 'Guardar Cliente',
    saveEdit: 'Actualizar Cliente',
    firstNameLabel: 'Nombre',
    lastNameLabel: 'Apellido',
    docLabel: 'Cédula',
    phoneLabel: 'Teléfono',
    emailLabel: 'Email',
    nameError: 'Los nombres no deben contener números',
    cedulaPlaceholder: 'Ej: 1234567',
    phonePlaceholder: 'Ej: +595 981 123456',
    emailPlaceholder: 'Ej: cliente@ejemplo.com',
    cancel: 'Cancelar',
  },
  en: {
    moduleLabel: 'Customers Module',
    title: 'Customer Management',
    description: 'Manage, edit, and control your customers.',
    resultsLabel: 'results',
    themeLabel: 'Theme',
    searchPlaceholder: 'Search customers...',
    newCustomer: 'New Customer',
    name: 'Name',
    lastName: 'Last Name',
    document: 'Document ID',
    email: 'Email',
    phone: 'Phone',
    status: 'Status',
    actions: 'Actions',
    edit: 'Edit',
    deactivate: 'Deactivate',
    activate: 'Activate',
    confirmDeactivateTitle: 'Deactivate customer?',
    confirmDeactivateText: 'The customer will no longer be available for new operations, but history is preserved.',
    confirmActivateTitle: 'Activate customer?',
    confirmActivateText: 'The customer will be available again for new operations.',
    confirmBtn: 'Yes',
    cancelBtn: 'Cancel',
    allStatuses: 'All Statuses',
    active: 'Active',
    inactive: 'Inactive',
    noCustomersTitle: 'No customers found',
    noCustomersText: 'Try another filter or search term.',
    showingText: 'Showing',
    entriesText: 'entries',
    createdToast: 'Customer created successfully',
    updatedToast: 'Customer updated successfully',
    toggledActive: 'Customer activated successfully',
    toggledInactive: 'Customer deactivated successfully',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Invoices',
    sidebarCustomers: 'Customers',
    sidebarProducts: 'Products',
    sidebarEmployees: 'Employees',
    signOut: 'Sign out',
    settings: 'Settings',
    notifications: 'Notifications',
    languageToggle: 'Español',
    sessionLabel: 'Session',
    modalCreateTitle: 'New Customer',
    modalCreateSubtitle: 'Fill in the new customer details',
    modalEditTitle: 'Edit Customer',
    modalEditSubtitle: 'Update the customer details',
    save: 'Save Customer',
    saveEdit: 'Update Customer',
    firstNameLabel: 'First Name',
    lastNameLabel: 'Last Name',
    docLabel: 'ID Number',
    phoneLabel: 'Phone',
    emailLabel: 'Email',
    nameError: 'Names must not contain numbers',
    cedulaPlaceholder: 'e.g. 1234567',
    phonePlaceholder: 'e.g. +1 555 123 4567',
    emailPlaceholder: 'e.g. john@example.com',
    cancel: 'Cancel',
  },
};

@Component({
  selector: 'billflow-customers-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BillflowPageShellComponent, DashboardParticlesBackgroundComponent, BillflowMobileSidebarComponent, BillflowNotificationButtonComponent, BillflowUserMenuComponent, BillflowModalShellComponent, BillflowComboboxComponent],
  templateUrl: './customers-page.component.html',
})
export class CustomersPageComponent implements OnInit {
  private readonly api = inject(InvoiceApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);
  @ViewChild('userMenuPanel') private userMenuPanel?: ElementRef<HTMLElement>;

  locale = this.localeService.locale;
  copy = computed(() => CUSTOMERS_TEXT[this.locale()]);

  Math = Math;
  String = String;

  readonly sidebarItems = computed(() => buildBillflowSidebarItems({
    dashboard: this.copy().sidebarDashboard,
    invoices: this.copy().sidebarInvoices,
    products: this.copy().sidebarProducts,
    customers: this.copy().sidebarCustomers,
    employees: this.copy().sidebarEmployees,
  }, 'customers'));

  readonly mobileNavItems = computed<BillflowSidebarItem[]>(() => [
    { label: this.copy().sidebarDashboard, icon: 'dashboard', href: '/dashboard' },
    { label: this.copy().sidebarInvoices, icon: 'receipt_long', href: '/invoices' },
    { label: this.copy().sidebarCustomers, icon: 'groups', href: '/customers', active: true },
    { label: this.copy().sidebarProducts, icon: 'inventory_2', href: '/dashboard' },
  ]);

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

  readonly totalCustomersCount = computed(() => this.customers().length);
  readonly activeCustomersCount = computed(() => this.customers().filter((c) => c.active).length);
  readonly inactiveCustomersCount = computed(() => this.customers().filter((c) => !c.active).length);

  // ── Filters & pagination ──────────────────────────────────────────────────
  readonly filteredCustomers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const field = this.searchField();

    return this.customers().filter((customer) => {
      let matchesQuery = true;
      if (query) {
        if (field === 'all') {
          matchesQuery = [customer.name, customer.lastName ?? '', customer.cedula ?? '', customer.email ?? '', customer.phone ?? '']
            .some((f) => f.toLowerCase().includes(query));
        } else if (field === 'name') {
          matchesQuery = customer.name.toLowerCase().includes(query);
        } else if (field === 'lastName') {
          matchesQuery = (customer.lastName ?? '').toLowerCase().includes(query);
        } else if (field === 'cedula') {
          matchesQuery = (customer.cedula ?? '').toLowerCase().includes(query);
        } else if (field === 'email') {
          matchesQuery = (customer.email ?? '').toLowerCase().includes(query);
        } else if (field === 'phone') {
          matchesQuery = (customer.phone ?? '').toLowerCase().includes(query);
        }
      }

      const matchesStatus = status === 'all'
        || (status === 'active' && customer.active)
        || (status === 'inactive' && !customer.active);
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

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  async ngOnInit() {
    this.applyStoredTheme();
    this.applyStoredUser();
    if (typeof window !== 'undefined') document.documentElement.lang = this.locale();
    await this.reloadCustomers();
  }

  async reloadCustomers() {
    this.loading.set(true);
    try {
      const customers = await this.api.listCustomers();
      const sorted = customers.sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      this.customers.set(sorted);
      this.page.set(1);
    } catch {
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'No se pudieron cargar los clientes' : 'Could not load customers',
        this.locale() === 'es' ? 'Revisá la conexión con el backend.' : 'Please check the backend connection.');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Theme & locale ────────────────────────────────────────────────────────
  toggleTheme() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.persistTheme(next);
  }

  toggleLocale() {
    this.localeService.toggle();
  }

  // ── Search & filter ───────────────────────────────────────────────────────
  setSearchQuery(value: string) {
    this.searchQuery.set(value);
    this.page.set(1);
  }

  setSearchField(value: string) {
    this.searchField.set(value as any);
    this.page.set(1);
  }

  setStatusFilter(value: string) {
    this.statusFilter.set(value === 'active' || value === 'inactive' ? value : 'all');
    this.page.set(1);
  }

  onPageSizeChange(event: Event) {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    if (!Number.isFinite(value) || value < 5) return;
    this.pageSize.set(value);
    this.page.set(1);
  }

  onPageSizeCombo(value: string) {
    const num = parseInt(value, 10);
    if (!Number.isFinite(num) || num < 5) return;
    this.pageSize.set(num);
    this.page.set(1);
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  nextPage() {
    if (this.page() < this.totalPages()) this.page.update((v) => v + 1);
  }

  previousPage() {
    if (this.page() > 1) this.page.update((v) => v - 1);
  }

  goToPage(pageNumber: number) {
    this.page.set(pageNumber);
  }

  // ── User menu ─────────────────────────────────────────────────────────────
  openNotifications() {
    void this.feedback.toast('info', this.copy().notifications,
      this.locale() === 'es' ? 'Tenés 3 movimientos críticos esperando revisión.' : 'You have 3 critical movements waiting for review.');
  }

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

  async openUserSettings() {
    this.closeUserMenu();
    await this.feedback.alert('info', this.copy().settings,
      this.locale() === 'es' ? 'Acá podés actualizar tu perfil y preferencias.' : 'You can update your profile and preferences here.');
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

  // ── Customer modal ────────────────────────────────────────────────────────
  openCreateModal() {
    this.editingCustomer.set(null);
    this.resetForm();
    this.customerModalOpen.set(true);
  }

  openEditModal(customer: CustomerRowDto) {
    this.editingCustomer.set(customer);
    this.formFirstName.set(customer.name);
    this.formLastName.set(customer.lastName ?? '');
    this.formCedula.set(customer.cedula ?? '');
    this.formPhone.set(customer.phone ?? '');
    this.formEmail.set(customer.email ?? '');
    this.formAddress.set(customer.address ?? '');
    this.customerModalOpen.set(true);
  }

  closeCustomerModal() {
    this.customerModalOpen.set(false);
    this.editingCustomer.set(null);
  }

  private resetForm() {
    this.formFirstName.set('');
    this.formLastName.set('');
    this.formCedula.set('');
    this.formPhone.set('');
    this.formEmail.set('');
    this.formAddress.set('');
    this.nameFieldError.set(null);
  }

  async saveCustomer() {
    const payload: CreateCustomerPayload = {
      firstName: this.formFirstName().trim(),
      lastName: this.formLastName().trim(),
      cedula: this.formCedula().trim(),
      email: this.formEmail().trim() || undefined,
      phone: this.formPhone().trim() || undefined,
      address: this.formAddress().trim() || undefined,
    };

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
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'Error al guardar el cliente' : 'Error saving customer');
    }
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
