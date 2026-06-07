import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, inject, signal, HostListener, ElementRef, ViewChild, Input, viewChild } from '@angular/core';
import type { OnInit, OnDestroy } from '@angular/core';
import { EmployeeApiService, ApiRequestError, type EmployeeRowDto, type UpdateUserPayload } from './employee-api.service';
import { RoleApiService, type RoleDto } from './role-api.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { LocaleService, type AppLocale } from '../../shared/services/locale.service';
import { SessionService } from '../../shared/services/session.service';
import { PermissionsService, PERMISSIONS } from '../../shared/services/permissions.service';
import { KeyboardShortcutService } from '../../shared/services/keyboard-shortcut.service';
import { type BillflowSidebarItem } from '../../shared/components/billflow-sidebar.component';
import { buildBillflowSidebarItems } from '../../shared/billflow-navigation';
import { BillflowPageShellComponent } from '../../shared/components/billflow-page-shell.component';
import { DashboardParticlesBackgroundComponent } from '../dashboard/dashboard-particles-background.component';
import { BillflowMobileSidebarComponent } from '../../shared/components/billflow-mobile-sidebar.component';
import { BillflowNotificationButtonComponent } from '../../shared/components/billflow-notification-button.component';
import { BillflowUserMenuComponent } from '../../shared/components/billflow-user-menu.component';
import { BillflowModalShellComponent } from '../../shared/components/billflow-modal-shell.component';
import { BillflowComboboxComponent, type ComboboxOption } from '../../shared/components/billflow-combobox.component';
import { BillflowDateRangePickerComponent } from '../../shared/components/billflow-date-range-picker.component';
import type { EmployeesInitialData } from '../../shared/ssr-page-data';
import { EmployeesKpiCardsComponent } from './components/employees-kpi-cards.component';
import { EmployeesTableComponent } from './components/employees-table.component';
import { EmployeesFormModalComponent } from './components/employees-form-modal.component';
import { HasPermissionDirective, IsAdminDirective } from '../../shared/directives/has-permission.directive';

type EmployeesLocale = 'es' | 'en';

interface EmployeesCopy {
  moduleLabel: string;
  title: string;
  description: string;
  resultsLabel: string;
  themeLabel: string;
  searchPlaceholder: string;
  newEmployee: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  attempts: string;
  actions: string;
  edit: string;
  unlock: string;
  deactivate: string;
  activate: string;
  reactivateUsers: string;
  confirmDeactivateTitle: string;
  confirmDeactivateText: string;
  confirmActivateTitle: string;
  confirmActivateText: string;
  confirmUnlockTitle: string;
  confirmUnlockText: string;
  confirmBtn: string;
  cancelBtn: string;
  allStatuses: string;
  allRoles: string;
  active: string;
  inactive: string;
  blocked: string;
  noEmployeesTitle: string;
  noEmployeesText: string;
  showingText: string;
  entriesText: string;
  unlockedToast: string;
  toggledActive: string;
  toggledInactive: string;
  sidebarDashboard: string;
  sidebarInvoices: string;
  sidebarCustomers: string;
  sidebarProducts: string;
  sidebarEmployees: string;
  sidebarCategories: string;
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
  cancel: string;
  searchStatusPlaceholder: string;
  searchRolePlaceholder: string;
  searchFieldPlaceholder: string;
  loadingText: string;
  blockedUsersSubtitle: string;
  blockedUsersEmptyTitle: string;
  blockedUsersEmptyText: string;
  selectUsersToUnlock: string;
  closeLabel: string;
  allFields: string;
  // Form
  firstNameLabel: string;
  lastNameLabel: string;
  docLabel: string;
  emailLabel: string;
  usernameLabel: string;
  roleLabel: string;
  employeeIdLabel: string;
  fromLabel: string;
  toLabel: string;
  // Validation messages
  firstNameOnlyLetters: string;
  lastNameOnlyLetters: string;
  lastNameNoSpaces: string;
  cedulaExact10: string;
  emailInvalidFormat: string;
  usernameNoSpaces: string;
  duplicateCedula: string;
  duplicateEmail: string;
  duplicateUsername: string;
  charCountLabel: string;
}

const EMPLOYEES_TEXT: Record<EmployeesLocale, EmployeesCopy> = {
  es: {
    moduleLabel: 'Módulo de Empleados',
    title: 'Gestión de Empleados',
    description: 'Administrá, editá y controlá los empleados del sistema.',
    resultsLabel: 'resultados',
    themeLabel: 'Tema',
    searchPlaceholder: 'Buscar empleados...',
    newEmployee: 'Nuevo Empleado',
    employeeId: 'Código',
    name: 'Nombre',
    email: 'Email',
    role: 'Rol',
    status: 'Estado',
    attempts: 'Intentos',
    actions: 'Acciones',
    edit: 'Editar',
    unlock: 'Desbloquear',
    deactivate: 'Desactivar',
    activate: 'Activar',
    reactivateUsers: 'Reactivar Usuarios',
    confirmDeactivateTitle: '¿Desactivar empleado?',
    confirmDeactivateText: 'El empleado dejará de tener acceso al sistema.',
    confirmActivateTitle: '¿Activar empleado?',
    confirmActivateText: 'El empleado volverá a tener acceso al sistema.',
    confirmUnlockTitle: '¿Desbloquear usuario?',
    confirmUnlockText: 'El usuario podrá volver a iniciar sesión.',
    confirmBtn: 'Sí',
    cancelBtn: 'Cancelar',
    allStatuses: 'Todos los estados',
    allRoles: 'Todos los roles',
    active: 'Activo',
    inactive: 'Inactivo',
    blocked: 'Bloqueado',
    noEmployeesTitle: 'No hay empleados',
    noEmployeesText: 'Probá con otro filtro o término de búsqueda.',
    showingText: 'Mostrando',
    entriesText: 'registros',
    unlockedToast: 'Usuario desbloqueado correctamente',
    toggledActive: 'Empleado activado correctamente',
    toggledInactive: 'Empleado desactivado correctamente',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Facturas',
    sidebarCustomers: 'Clientes',
    sidebarProducts: 'Productos',
    sidebarEmployees: 'Empleados',
    sidebarCategories: 'Categorías',
    signOut: 'Cerrar sesión',
    settings: 'Configuración',
    notifications: 'Notificaciones',
    languageToggle: 'English',
    sessionLabel: 'Sesión',
    modalCreateTitle: 'Nuevo Empleado',
    modalCreateSubtitle: 'Completá los datos del nuevo empleado',
    modalEditTitle: 'Editar Empleado',
    modalEditSubtitle: 'Actualizá los datos del empleado',
    save: 'Guardar Empleado',
    saveEdit: 'Actualizar Empleado',
    cancel: 'Cancelar',
    searchStatusPlaceholder: 'Buscar estado...',
    searchRolePlaceholder: 'Buscar rol...',
    searchFieldPlaceholder: 'Buscar campo...',
    loadingText: 'Cargando empleados...',
    blockedUsersSubtitle: 'Usuarios bloqueados del sistema',
    blockedUsersEmptyTitle: 'No hay usuarios bloqueados',
    blockedUsersEmptyText: 'Todos los usuarios pueden acceder al sistema.',
    selectUsersToUnlock: 'Selecciona los usuarios que quieres desbloquear:',
    closeLabel: 'Cerrar',
    allFields: 'Cualquier campo',
    firstNameLabel: 'Nombre',
    lastNameLabel: 'Apellido',
    docLabel: 'Cédula',
    emailLabel: 'Email',
    usernameLabel: 'Usuario',
    roleLabel: 'Rol',
    employeeIdLabel: 'Código de Empleado',
    // Validation messages
    firstNameOnlyLetters: 'Solo letras permitidas',
    lastNameOnlyLetters: 'Solo letras permitidas',
    lastNameNoSpaces: 'No se permiten espacios',
    cedulaExact10: 'Debe tener exactamente 10 dígitos',
    emailInvalidFormat: 'Formato de email inválido',
    usernameNoSpaces: 'No se permiten espacios',
    duplicateCedula: 'La cédula ya está registrada',
    duplicateEmail: 'El correo ya está registrado',
    duplicateUsername: 'El usuario ya está registrado',
    charCountLabel: '',
    fromLabel: 'Desde',
    toLabel: 'Hasta',
  },
  en: {
    moduleLabel: 'Employees Module',
    title: 'Employee Management',
    description: 'Manage, edit, and control system employees.',
    resultsLabel: 'results',
    themeLabel: 'Theme',
    searchPlaceholder: 'Search employees...',
    newEmployee: 'New Employee',
    employeeId: 'Code',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    status: 'Status',
    attempts: 'Attempts',
    actions: 'Actions',
    edit: 'Edit',
    unlock: 'Unlock',
    deactivate: 'Deactivate',
    activate: 'Activate',
    reactivateUsers: 'Reactivate Users',
    confirmDeactivateTitle: 'Deactivate employee?',
    confirmDeactivateText: 'The employee will lose system access.',
    confirmActivateTitle: 'Activate employee?',
    confirmActivateText: 'The employee will regain system access.',
    confirmUnlockTitle: 'Unlock user?',
    confirmUnlockText: 'The user will be able to log in again.',
    confirmBtn: 'Yes',
    cancelBtn: 'Cancel',
    allStatuses: 'All Statuses',
    allRoles: 'All Roles',
    active: 'Active',
    inactive: 'Inactive',
    blocked: 'Blocked',
    noEmployeesTitle: 'No employees found',
    noEmployeesText: 'Try another filter or search term.',
    showingText: 'Showing',
    entriesText: 'entries',
    unlockedToast: 'User unlocked successfully',
    toggledActive: 'Employee activated successfully',
    toggledInactive: 'Employee deactivated successfully',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Invoices',
    sidebarCustomers: 'Customers',
    sidebarProducts: 'Products',
    sidebarEmployees: 'Employees',
    sidebarCategories: 'Categories',
    signOut: 'Sign out',
    settings: 'Settings',
    notifications: 'Notifications',
    languageToggle: 'Español',
    sessionLabel: 'Session',
    searchStatusPlaceholder: 'Search status...',
    searchRolePlaceholder: 'Search role...',
    searchFieldPlaceholder: 'Search field...',
    loadingText: 'Loading employees...',
    blockedUsersSubtitle: 'Blocked system users',
    blockedUsersEmptyTitle: 'No blocked users',
    blockedUsersEmptyText: 'All users can access the system.',
    selectUsersToUnlock: 'Select the users to unlock:',
    closeLabel: 'Close',
    allFields: 'Any field',
    modalCreateTitle: 'New Employee',
    modalCreateSubtitle: 'Fill in the new employee details',
    modalEditTitle: 'Edit Employee',
    modalEditSubtitle: 'Update the employee details',
    save: 'Save Employee',
    saveEdit: 'Update Employee',
    cancel: 'Cancel',
    firstNameLabel: 'First Name',
    lastNameLabel: 'Last Name',
    docLabel: 'ID Number',
    emailLabel: 'Email',
    usernameLabel: 'Username',
    roleLabel: 'Role',
    employeeIdLabel: 'Employee Code',
    // Validation messages
    firstNameOnlyLetters: 'Only letters allowed',
    lastNameOnlyLetters: 'Only letters allowed',
    lastNameNoSpaces: 'No spaces allowed',
    cedulaExact10: 'Must be exactly 10 digits',
    emailInvalidFormat: 'Invalid email format',
    usernameNoSpaces: 'No spaces allowed',
    duplicateCedula: 'The ID number is already registered',
    duplicateEmail: 'The email is already registered',
    duplicateUsername: 'The username is already registered',
    charCountLabel: '',
    fromLabel: 'From',
    toLabel: 'To',
  },
};

// Roles are now loaded dynamically from RoleApiService (see roleOptions computed)

@Component({
  selector: 'billflow-employees-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule, BillflowComboboxComponent,
    BillflowDateRangePickerComponent,
    BillflowPageShellComponent, DashboardParticlesBackgroundComponent,
    BillflowMobileSidebarComponent, BillflowNotificationButtonComponent,
    BillflowUserMenuComponent, BillflowModalShellComponent,
    EmployeesKpiCardsComponent, EmployeesTableComponent, EmployeesFormModalComponent,
    HasPermissionDirective, IsAdminDirective,
  ],
  template: `<billflow-page-shell [items]="sidebarItems()" [locale]="locale()" (settings)="openUserSettings()" (logout)="logout()">
  <billflow-dashboard-particles-background class="app-invoice-bg"></billflow-dashboard-particles-background>

  <div class="flex-1 min-w-0 app-invoices-shell app-dashboard-main">
    <header class="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-xl">
      <div class="py-3 px-5 md:px-6 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 shrink-0">
          <span class="hidden md:inline-flex lg:hidden">
            <billflow-mobile-sidebar [items]="sidebarItems()" [actionLabel]="copy().newEmployee" actionIcon="add" (actionClick)="openCreateModal()"></billflow-mobile-sidebar>
          </span>
          <span class="material-symbols-outlined text-outline">badge</span>
          <span class="font-h3 text-h3 text-on-background">{{ copy().moduleLabel }}</span>
        </div>
        <div class="flex items-center gap-2 ml-auto shrink-0 self-auto relative z-40" #userMenuPanel>
          <billflow-notification-button (clicked)="openNotifications()"></billflow-notification-button>
          <billflow-user-menu
            [displayName]="session.displayName()"
            [initials]="session.userInitials()"
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
          <h1 class="font-h1 text-h1 tracking-tight text-on-background">{{ copy().title }}</h1>
          <p class="mt-2 text-body-md text-on-surface-variant">{{ copy().description }}</p>
        </div>
        <div class="flex items-center gap-2 text-sm text-on-surface-variant">
          <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ employees().length }} {{ copy().resultsLabel }}</span>
          <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ copy().themeLabel }}: {{ currentThemeLabel() }}</span>
        </div>
      </section>
      @defer (on timer(200ms)) {
        <billflow-employees-kpi-cards
          [locale]="locale()"
          [total]="totalEmployeesCount()"
          [active]="activeEmployeesCount()"
          [inactive]="inactiveEmployeesCount()"
          [blocked]="blockedEmployeesCount()"
        ></billflow-employees-kpi-cards>
      } @placeholder {
        <section class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          @for (i of [1,2,3,4]; track i) {
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
      @defer (on idle) {
        <billflow-employees-table
          [employees]="employees"
          [loading]="loading"
          [locale]="locale"
          [page]="page"
          [total]="totalCount"
          [pageSize]="pageSize"
          (onRowClick)="showEmployeeInfo($event)"
          (onEditClick)="openEditModal($event)"
          (onToggleClick)="toggleActive($event)"
          (onUnlockClick)="unlockEmployee($event)"
          (onInfoClick)="showEmployeeInfo($event)"
          (onPrevPage)="previousPage()"
          (onNextPage)="nextPage()"
          (onPageClick)="goToPage($event)"
          (onPageSizeChange)="onPageSizeCombo($event)"
        >
          <ng-container toolbar-left>
            <div class="flex flex-wrap items-center gap-3">
              <billflow-combobox
                [options]="statusFilterOptions()"
                [value]="statusFilter()"
                [placeholder]="copy().allStatuses"
                searchPlaceholder="{{ copy().searchStatusPlaceholder }}"
                [compact]="true"
                (valueChange)="setStatusFilter($event)"
              ></billflow-combobox>
              <billflow-combobox
                [options]="roleFilterOptions()"
                [value]="roleFilter()"
                [placeholder]="copy().allRoles"
                searchPlaceholder="{{ copy().searchRolePlaceholder }}"
                [compact]="true"
                (valueChange)="setRoleFilter($event)"
              ></billflow-combobox>
              <billflow-date-range-picker
                [fromDate]="createdFrom()"
                [toDate]="createdTo()"
                [fromLabel]="copy().fromLabel"
                [toLabel]="copy().toLabel"
                (fromDateChange)="createdFrom.set($event); page.set(1); void reloadEmployees()"
                (toDateChange)="createdTo.set($event); page.set(1); void reloadEmployees()"
              ></billflow-date-range-picker>
              <button type="button" title="Refresh" class="inline-flex items-center justify-center bg-surface-container-lowest border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm hover:border-primary hover:text-primary" (click)="void reloadEmployees()">
                <span class="material-symbols-outlined text-[20px] transition-transform" [style.animation]="loading() ? 'spin 0.7s linear infinite' : 'none'">refresh</span>
              </button>
            </div>
            <div class="flex items-center justify-between gap-3 mt-3 w-full">
              <div class="flex items-stretch w-full max-w-[32rem]">
                <billflow-combobox
                  [options]="searchFieldOptionsList()"
                  [value]="searchFieldValue()"
                  placeholder="{{ copy().allFields }}"
                  searchPlaceholder="{{ copy().searchFieldPlaceholder }}"
                  [compact]="true"
                  (valueChange)="onSearchFieldSelected($event)"
                  class="rounded-r-none mr-4"
                ></billflow-combobox>
                <div class="relative flex-1">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none text-[18px]">search</span>
                  <input #employeeSearchInput class="w-full min-w-0 pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/60 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm h-full rounded-none rounded-r-lg"
                    [placeholder]="copy().searchPlaceholder"
                    [value]="searchQuery()" (input)="setSearchQuery(($any($event.target).value))" (keydown)="onSearchKeydown($event)" />
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <ng-container *appIsAdmin>
                  <button type="button" class="inline-flex items-center gap-2 bg-primary text-on-primary rounded-lg px-4 py-2 text-sm font-bold hover:opacity-90 transition-all shadow-sm" (click)="openCreateModal()">
                    <span class="material-symbols-outlined text-[18px]">add</span>{{ copy().newEmployee }}
                  </button>
                  <button type="button" class="inline-flex items-center gap-2 bg-[#f59e0b] text-white rounded-lg px-4 py-2 text-sm font-bold hover:opacity-90 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed" [disabled]="blockedEmployeesCount() === 0" (click)="openReactivateModal()">
                    <span class="material-symbols-outlined text-[18px]">lock_open</span>{{ copy().reactivateUsers }}
                  </button>
                </ng-container>
              </div>
            </div>
          </ng-container>
        </billflow-employees-table>
      } @placeholder {
        <div class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden animate-pulse">
          <div class="p-6 md:p-7 border-b border-outline-variant/30">
            <div class="flex items-center gap-3">
              <div class="h-9 w-32 rounded-lg bg-surface-container-high"></div>
              <div class="h-9 w-32 rounded-lg bg-surface-container-high"></div>
            </div>
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
    @defer (on interaction) {
        <billflow-modal-shell *ngIf="employeeModalOpen()" title="{{ editingEmployee() ? copy().modalEditTitle : copy().modalCreateTitle }}" subtitle="{{ editingEmployee() ? copy().modalEditSubtitle : copy().modalCreateSubtitle }}" icon="badge" maxWidth="xl" [hasFooter]="true" [formHasChanges]="employeeFormModal()?.formHasChanges ?? null" (close)="closeEmployeeModal()">
        <billflow-employees-form-modal
            [locale]="locale"
            [employee]="editingEmployee() ?? undefined"
            [roleOptions]="roleOptions"
            [submitting]="formSubmitting"
            [defaultBranchId]="currentBranchId"
            [serverCedulaError]="serverCedulaError"
            [serverEmailError]="serverEmailError"
            [serverUsernameError]="serverUsernameError"
            [clearServerCedulaError]="clearServerCedulaError"
            [clearServerEmailError]="clearServerEmailError"
            [clearServerUsernameError]="clearServerUsernameError"
            (onCancel)="requestEmployeeModalClose()"
            (onSave)="saveEmployeeFromModal($event)"
          ></billflow-employees-form-modal>
        </billflow-modal-shell>
        <billflow-modal-shell *ngIf="reactivateModalOpen()" title="{{ copy().reactivateUsers }}" subtitle="{{ copy().blockedUsersSubtitle }}" icon="lock_open" maxWidth="lg" [hasFooter]="true" (close)="closeReactivateModal()">
          <div class="p-6 md:p-7 space-y-5">
            @let blockedEmployees = employees().filter(e => isBlockedEmployee(e));

            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
              <p class="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">{{ copy().selectUsersToUnlock }}</p>
              <p class="mt-1 flex items-center gap-2 text-sm font-semibold text-red-600">
                <span class="h-2 w-2 rounded-full bg-red-600"></span>
                {{ blockedEmployees.length }} {{ copy().blockedUsersSubtitle }}
              </p>
            </div>

            @if (blockedEmployees.length === 0) {
              <div class="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <span class="material-symbols-outlined">lock_open</span>
                </div>
                <p class="text-base font-semibold text-slate-900 dark:text-slate-100">{{ copy().blockedUsersEmptyTitle }}</p>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ copy().blockedUsersEmptyText }}</p>
              </div>
            } @else {
              <div class="space-y-4 max-h-80 overflow-y-auto pr-1">
                @for (employee of blockedEmployees; track employee.id) {
                  <div class="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all hover:border-amber-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-amber-500/30">
                    <div class="flex min-w-0 items-center gap-4">
                      <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-500 font-bold shadow-inner ring-4 ring-rose-50 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-transparent">
                        {{ getEmployeeInitials(employee) }}
                      </div>
                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <div class="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{{ employeeFullName(employee) }}</div>
                          <span class="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">{{ copy().blocked }}</span>
                        </div>
                        <div class="mt-1 space-y-0.5 text-sm text-slate-500 dark:text-slate-400">
                          <p class="truncate">{{ employee.email }}</p>
                          <p class="truncate">{{ copy().employeeId }}: {{ employee.employeeId }}</p>
                        </div>
                      </div>
                    </div>
                    <button type="button" class="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm transition-all hover:bg-amber-500 active:scale-[0.98]" (click)="$event.stopPropagation(); void unlockEmployee(employee)">
                      <span class="material-symbols-outlined text-[18px]">lock</span>{{ copy().unlock }}
                    </button>
                  </div>
                }
              </div>
            }

            <div class="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
              <div class="flex items-start gap-3">
                <span class="material-symbols-outlined mt-0.5 text-slate-400">info</span>
                  <p class="leading-6">
                  Al desbloquear a un usuario, recupera inmediatamente el acceso a sus funciones asignadas y puede volver a iniciar sesión en la consola administrativa.
                </p>
              </div>
            </div>
          </div>
          <div footer class="flex w-full items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50 md:px-7">
            <button type="button" class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800" (click)="closeReactivateModal()">{{ copy().closeLabel }}</button>
          </div>
        </billflow-modal-shell>
      } @placeholder {
        <!-- Modals deferred until user interaction -->
      }
    <nav class="md:hidden app-dashboard-mobile-nav">
      <a *ngFor="let item of mobileNavItems()" class="flex flex-col items-center justify-center w-full h-full pt-1 border-t-2 transition-colors app-dashboard-mobile-link" [href]="item.href" [ngClass]="item.active ? 'text-primary border-primary app-dashboard-mobile-link--active' : 'border-transparent'">
        <span class="material-symbols-outlined" [style.font-variation-settings]="iconVariationSettings(item.active)">{{ item.icon }}</span>
        <span class="text-[10px] font-medium mt-1">{{ item.label }}</span>
      </a>
      <ng-container *appIsAdmin>
        <div class="app-dashboard-mobile-fab-wrap">
          <button type="button" class="w-14 h-14 bg-[#6862f3] text-white rounded-full shadow-lg shadow-[#6862f3]/30 flex items-center justify-center hover:bg-[#514be6] active:scale-95 transition-all border-[3px] border-surface" (click)="openCreateModal()">
            <span class="material-symbols-outlined text-[24px]">add</span>
          </button>
        </div>
      </ng-container>
    </nav>
  </div>
</billflow-page-shell>`,
})
export class EmployeesPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(EmployeeApiService);
  private readonly roleApi = inject(RoleApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);
  protected readonly session = inject(SessionService);
  private readonly permissions = inject(PermissionsService);
  private readonly keyboardShortcuts = inject(KeyboardShortcutService);
  @ViewChild('userMenuPanel') private userMenuPanel?: ElementRef<HTMLElement>;
  private gradientCache = new Map<string, string>();
  @ViewChild('firstNameInput') firstNameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('lastNameInput') lastNameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('employeeSearchInput') private searchInputRef?: ElementRef<HTMLInputElement>;

  // Spec 3 R6: viewChild to the employee-form-modal so the parent can
  // thread its `formHasChanges` signal into the surrounding shell. The
  // shell is the dialog owner (X, backdrop, Escape) and reads the
  // signal to decide whether to show the unsaved-changes SweetAlert.
  private readonly employeeFormModal = viewChild(EmployeesFormModalComponent);
  // Spec 3 R6: viewChild to the shell so the modal's Cancel button can
  // route through `requestClose()` (which honors the guard).
  private readonly employeeShell = viewChild(BillflowModalShellComponent);

  locale = this.localeService.locale;
  copy = computed(() => EMPLOYEES_TEXT[this.locale()]);

  @Input() set initialLocale(value: AppLocale | null | undefined) {
    if (!value) return;
    this.localeService.seedLocale(value);
  }

  Math = Math;
  String = String;

  readonly sidebarItems = computed(() => buildBillflowSidebarItems({
    dashboard: this.copy().sidebarDashboard,
    invoices: this.copy().sidebarInvoices,
    products: this.copy().sidebarProducts,
    customers: this.copy().sidebarCustomers,
    employees: this.copy().sidebarEmployees,
  }, 'employees', this.permissions));

  readonly mobileNavItems = computed<BillflowSidebarItem[]>(() => {
    const items: BillflowSidebarItem[] = [
      { label: this.copy().sidebarDashboard, icon: 'dashboard', href: '/dashboard' },
      { label: this.copy().sidebarInvoices, icon: 'receipt_long', href: '/invoices' },
      { label: this.copy().sidebarEmployees, icon: 'badge', href: '/employees', active: true },
      { label: this.copy().sidebarProducts, icon: 'inventory_2', href: '/products' },
    ];

    // Filter by permissions — only ADMIN sees employees in mobile nav
    if (!this.permissions.isAdmin()) {
      return items.filter((i) => i.href !== '/employees');
    }
    return items;
  });

  // ── Data ──
  loading = signal(true);
  employees = signal<EmployeeRowDto[]>([]);
  totalCount = signal(0);
  totalEmployeesKpi = signal(0);
  activeEmployeesKpi = signal(0);
  inactiveEmployeesKpi = signal(0);
  blockedEmployeesKpi = signal(0);

  // ── Filters ──
  searchQuery = signal('');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  roleFilter = signal('all');
  createdFrom = signal<string | null>(null);
  createdTo = signal<string | null>(null);
  page = signal(1);
  pageSize = signal(5);

  // ── Combobox options ──
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

  // ── Roles (loaded dynamically from API) ──
  roles = signal<RoleDto[]>([]);

  private readonly allowedRoleNames = new Set(['ADMIN', 'VENDEDOR']);

  readonly roleOptions = computed<ComboboxOption[]>(() =>
    this.roles()
      .filter((r) => this.allowedRoleNames.has(String(r.name).trim().toUpperCase()))
      .map((r) => ({ value: r.name, label: r.name }))
  );

  readonly roleFilterOptions = computed<ComboboxOption[]>(() => [
    { value: 'all', label: this.copy().allRoles },
    ...this.roleOptions(),
  ]);

  // ── Filter values ──
  readonly searchFieldOptionsList = computed(() => [
    { value: 'all', label: this.copy().allFields },
    { value: 'employeeId', label: this.copy().employeeId },
    { value: 'username', label: this.copy().usernameLabel },
    { value: 'email', label: this.copy().emailLabel },
    { value: 'firstName', label: this.copy().firstNameLabel },
    { value: 'lastName', label: this.copy().lastNameLabel },
    { value: 'role', label: this.copy().role },
    { value: 'status', label: this.copy().status },
  ]);
  searchFieldValue = signal('all');

  // ── User menu ──
  theme = signal<'light' | 'dark'>('light');
  userMenuVisible = signal(false);
  userMenuClosing = signal(false);
  userMenuOpen = signal(false);
  private userMenuCloseTimeout: number | undefined;

  // ── Modal state ──
  employeeModalOpen = signal(false);
  editingEmployee = signal<EmployeeRowDto | null>(null);
  reactivateModalOpen = signal(false);
  currentBranchId = signal('');
  private hasInitialData = false;

  private initBranchId(): void {
    // Hardcoded default branch — replace with real value from auth/me when available
    this.currentBranchId.set('3fa85f64-5717-4562-b3fc-2c963f66afa6');
  }

  @Input() set initialData(value: EmployeesInitialData | null | undefined) {
    if (!value) return;
    this.hasInitialData = true;
    this.employees.set(value.employees);
    this.roles.set(value.roles);
    this.totalCount.set(value.totalCount);
    this.totalEmployeesKpi.set(value.totalEmployeesKpi);
    this.activeEmployeesKpi.set(value.activeEmployeesKpi);
    this.inactiveEmployeesKpi.set(value.inactiveEmployeesKpi);
    this.blockedEmployeesKpi.set(value.blockedEmployeesKpi);
    this.page.set(value.page);
    this.pageSize.set(value.pageSize);
    this.loading.set(false);
  }

  // ── Form signals ──
  formFirstName = signal('');
  formLastName = signal('');
  formEmployeeId = signal('');
  formCedula = signal('');
  formEmail = signal('');
  formUsername = signal('');
  formRole = signal('');
  formSubmitting = signal(false);

  readonly formValid = computed(() =>
    this.formFirstNameValid()
    && this.formLastNameValid()
    && this.formCedulaValid()
    && this.formEmailValid()
    && this.formUsernameValid()
    && this.formRole().trim().length > 0
  );

  // ── Validation signals ──
  formFirstNameError = signal('');
  formLastNameError = signal('');
  formCedulaError = signal('');
  formEmailError = signal('');
  formUsernameError = signal('');
  serverCedulaError = signal('');
  serverEmailError = signal('');
  serverUsernameError = signal('');
  readonly formFirstNameValid = computed(() => this.formFirstNameError() === '');
  readonly formLastNameValid = computed(() => this.formLastNameError() === '');
  readonly formCedulaValid = computed(() => this.formCedulaError() === '');
  readonly formEmailValid = computed(() => this.formEmailError() === '');
  readonly formUsernameValid = computed(() => this.formUsernameError() === '');

  readonly firstNameCount = computed(() => this.formFirstName().length);
  readonly lastNameCount = computed(() => this.formLastName().length);
  readonly cedulaCount = computed(() => this.formCedula().length);
  readonly emailCount = computed(() => this.formEmail().length);
  readonly usernameCount = computed(() => this.formUsername().length);

  // ── Lifecycle ──
  async ngOnInit() {
    if (typeof window === 'undefined') return;

    this.session.init();
    this.keyboardShortcuts.register(
      { keys: 'n', descriptionEn: 'New Employee', descriptionEs: 'Nuevo Empleado', category: 'actions', permission: PERMISSIONS.EMPLOYEES_CREATE, action: () => { void this.openCreateModal(); } },
      { keys: 'r', descriptionEn: 'Refresh list', descriptionEs: 'Actualizar lista', category: 'actions', action: () => { void this.reloadEmployees(); } },
      { keys: '/', descriptionEn: 'Focus search', descriptionEs: 'Buscar', category: 'actions', action: () => this.focusSearch() },
    );

    // Admin-only page: redirect to 403 if not admin
    // Note: role is read from localStorage (set by /auth/me response)
    // The backend will reject any unauthorized API call anyway — this is UX only
    if (!this.permissions.isAdmin()) {
      window.location.replace('/403');
      return;
    }

    this.initBranchId();
    this.applyStoredTheme();
    if (typeof window !== 'undefined') document.documentElement.lang = this.locale();

    if (this.hasInitialData) return;

    await Promise.all([
      this.loadRoles(),
      this.reloadEmployees(),
      this.reloadKpis(),
    ]);
  }

  ngOnDestroy(): void {
    this.keyboardShortcuts.unregister('n', 'r', '/');
  }

  private focusSearch(): void {
    this.searchInputRef?.nativeElement.focus();
    this.searchInputRef?.nativeElement.select();
  }

  async loadRoles() {
    try {
      const list = await this.roleApi.listRoles();
      this.roles.set(list);
    } catch (err) {
      console.error('[load roles]', err);
    }
  }

  onSearchFieldSelected(value: string) {
    this.searchFieldValue.set(value);
    this.page.set(1);
  }

  // ── Data loading ──
  async reloadEmployees() {
    this.loading.set(true);
    this.gradientCache.clear();
    try {
      const result = await this.api.listUsers({
        page: this.page(),
        limit: this.pageSize(),
        q: this.searchQuery().trim() || undefined,
        role: this.roleFilter() !== 'all' ? this.roleFilter() : undefined,
        status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
        createdFrom: this.createdFrom() ?? undefined,
        createdTo: this.createdTo() ?? undefined,
      });
      this.employees.set(result.data || []);
      this.totalCount.set(result.total || 0);
    } catch (err) {
      console.error('[employees] load error:', err);
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'No se pudieron cargar los empleados' : 'Could not load employees',
        this.locale() === 'es' ? 'Revise la conexión con el backend.' : 'Please check the backend connection.');
    } finally {
      this.loading.set(false);
    }
  }

  async reloadKpis() {
    try {
      const kpis = await this.api.getKpis();
      this.totalEmployeesKpi.set(kpis.totalEmployees);
      this.activeEmployeesKpi.set(kpis.activeEmployees);
      this.inactiveEmployeesKpi.set(kpis.inactiveEmployees);
      this.blockedEmployeesKpi.set(kpis.blockedEmployees);
    } catch (err) {
      console.error('[employees] kpis load error:', err);
    }
  }

  // ── Filters ──
  setSearchQuery(value: string) {
    this.searchQuery.set(value);
    this.page.set(1);
    void this.reloadEmployees();
  }

  setStatusFilter(value: string) {
    this.statusFilter.set(value === 'active' || value === 'inactive' ? value : 'all');
    this.page.set(1);
    void this.reloadEmployees();
  }

  setRoleFilter(value: string) {
    this.roleFilter.set(value);
    this.page.set(1);
    void this.reloadEmployees();
  }

  onPageSizeChange(event: Event) {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    if (!Number.isFinite(value) || value < 5) return;
    this.pageSize.set(value);
    this.page.set(1);
    void this.reloadEmployees();
  }

  onPageSizeCombo(value: string) {
    const num = parseInt(value, 10);
    if (!Number.isFinite(num) || num < 5) return;
    this.pageSize.set(num);
    this.page.set(1);
    void this.reloadEmployees();
  }

  onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.page.set(1);
      void this.reloadEmployees();
    }
  }

  // ── Pagination ──
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  });

  nextPage() {
    if (this.page() < this.totalPages()) { this.page.update((v) => v + 1); void this.reloadEmployees(); }
  }
  previousPage() {
    if (this.page() > 1) { this.page.update((v) => v - 1); void this.reloadEmployees(); }
  }
  goToPage(pageNumber: number) {
    this.page.set(pageNumber);
    void this.reloadEmployees();
  }

  // ── User menu ──
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

  openUserSettings() {
    this.closeUserMenu();
    if (typeof window !== 'undefined') {
      window.location.href = '/profile';
    }
  }

  async logout() {
    this.closeUserMenu();
    void this.session.logout();
  }

  // ── KPIs ──
  readonly totalEmployeesCount = computed(() => this.totalEmployeesKpi());
  readonly activeEmployeesCount = computed(() => this.activeEmployeesKpi());
  readonly inactiveEmployeesCount = computed(() => this.inactiveEmployeesKpi());
  readonly blockedEmployeesCount = computed(() => this.blockedEmployeesKpi());

  // ── Employee modals ──
  openCreateModal() {
    this.clearServerErrors();
    this.resetForm();
    this.editingEmployee.set(null);
    this.employeeModalOpen.set(true);
  }

  openEditModal(employee: EmployeeRowDto) {
    this.clearServerErrors();
    this.formFirstName.set(employee.firstName);
    this.formLastName.set(employee.lastName);
    this.formEmployeeId.set(employee.employeeId);
    this.formCedula.set('');
    this.formEmail.set(employee.email);
    this.formUsername.set(employee.username);
    this.formRole.set(employee.role);
    this.formSubmitting.set(false);
    this.formFirstNameError.set('');
    this.formLastNameError.set('');
    this.formCedulaError.set('');
    this.formEmailError.set('');
    this.formUsernameError.set('');
    this.editingEmployee.set(employee);
    this.employeeModalOpen.set(true);
  }

  closeEmployeeModal() {
    this.employeeModalOpen.set(false);
    this.editingEmployee.set(null);
    this.resetForm();
    this.clearServerErrors();
  }

  /**
   * Spec 3 R6: route the form modal's Cancel button through the shell's
   * `requestClose()` so the unsaved-changes guard runs. The shell emits
   * `close` only after the user confirms, which then triggers
   * `closeEmployeeModal()`.
   */
  async requestEmployeeModalClose(): Promise<void> {
    await this.employeeShell()?.requestClose();
  }

  private resetForm() {
    this.formFirstName.set('');
    this.formLastName.set('');
    this.formEmployeeId.set('');
    this.formCedula.set('');
    this.formEmail.set('');
    this.formUsername.set('');
    this.formRole.set('');
    this.formSubmitting.set(false);
    this.formFirstNameError.set('');
    this.formLastNameError.set('');
    this.formCedulaError.set('');
    this.formEmailError.set('');
    this.formUsernameError.set('');
  }

  private clearServerErrors() {
    this.serverCedulaError.set('');
    this.serverEmailError.set('');
    this.serverUsernameError.set('');
  }

  clearServerCedulaError = () => this.serverCedulaError.set('');
  clearServerEmailError = () => this.serverEmailError.set('');
  clearServerUsernameError = () => this.serverUsernameError.set('');

  // ── Input handlers ──
  onFirstNameInput(value: string) {
    const cleaned = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
    this.formFirstName.set(cleaned);
    this.validateFirstName(cleaned);
    if (value.endsWith(' ')) {
      this.lastNameInput?.nativeElement.focus();
    }
  }

  onLastNameInput(value: string) {
    const hadSpace = value.includes(' ');
    const cleaned = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
    this.formLastName.set(cleaned);
    if (hadSpace && cleaned === this.formLastName()) {
      this.formLastNameError.set(this.locale() === 'es' ? 'No se permiten espacios' : 'No spaces allowed');
    } else {
      this.validateLastName(cleaned);
    }
  }

  onCedulaInput(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    this.formCedula.set(cleaned);
    this.validateCedula(cleaned);
  }

  onEmailInput(value: string) {
    const cleaned = value.replace(/\s/g, '');
    this.formEmail.set(cleaned);
    this.validateEmail(cleaned);
  }

  onUsernameInput(value: string) {
    const cleaned = value.replace(/\s/g, '');
    this.formUsername.set(cleaned);
    this.validateUsername(cleaned);
  }

  // ── Validation methods ──
  private validateFirstName(value: string) {
    if (value.length > 0 && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/.test(value) && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value.replace(/\s/g, ''))) {
      this.formFirstNameError.set(this.copy().firstNameOnlyLetters);
    } else {
      this.formFirstNameError.set('');
    }
  }

  private validateLastName(value: string) {
    if (value.includes(' ')) {
      this.formLastNameError.set(this.copy().lastNameNoSpaces);
    } else if (value.length > 0 && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/.test(value)) {
      this.formLastNameError.set(this.copy().lastNameOnlyLetters);
    } else {
      this.formLastNameError.set('');
    }
  }

  private validateCedula(value: string) {
    if (value.length > 0 && value.length !== 10) {
      this.formCedulaError.set(this.copy().cedulaExact10);
    } else {
      this.formCedulaError.set('');
    }
  }

  private validateEmail(value: string) {
    if (value.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      this.formEmailError.set(this.copy().emailInvalidFormat);
    } else {
      this.formEmailError.set('');
    }
  }

  private validateUsername(value: string) {
    if (value.includes(' ')) {
      this.formUsernameError.set(this.copy().usernameNoSpaces);
    } else {
      this.formUsernameError.set('');
    }
  }

  async saveEmployeeFromModal(payload: {
    firstName: string; lastName: string; cedula: string; email: string;
    username: string; role: string; defaultBranchId: string;
  }) {
    this.formSubmitting.set(true);
    this.clearServerErrors();
    try {
      if (this.editingEmployee()) {
        const updated = await this.api.updateUser(this.editingEmployee()!.id, {
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          email: payload.email.trim(),
          role: payload.role,
        });
        this.employees.update(emps =>
          emps.map(e => e.id === updated.id ? updated : e)
        );
        await this.feedback.toast('success',
          this.locale() === 'es' ? 'Empleado actualizado correctamente' : 'Employee updated successfully');
      } else {
        await this.api.registerUser({
          email: payload.email.trim(),
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          cedula: payload.cedula.trim(),
          role: payload.role,
          username: payload.username.trim(),
          defaultBranchId: payload.defaultBranchId,
        });
        await this.reloadEmployees();
        void this.reloadKpis();
        await this.feedback.toast('success',
          this.locale() === 'es' ? 'Empleado creado y credenciales enviadas' : 'Employee created and credentials sent');
      }
      this.closeEmployeeModal();
    } catch (err) {
      console.error('[save employee]', err);
      if (this.applyDuplicateFieldError(err)) {
        return;
      }
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'Error al guardar empleado' : 'Error saving employee');
    } finally {
      this.formSubmitting.set(false);
    }
  }

  private applyDuplicateFieldError(err: unknown): boolean {
    const text = this.extractErrorText(err).toLowerCase();
    const status = err instanceof ApiRequestError ? err.status : undefined;
    const body = err instanceof ApiRequestError ? err.body : undefined;
    const bodyText = this.extractErrorText(body).toLowerCase();
    const combined = `${text} ${bodyText}`;

    const structuredErrors = this.extractStructuredDuplicateErrors(body);
    let matched = this.applyStructuredDuplicateErrors(structuredErrors);
    if (matched) return true;

    const looksDuplicate = status === 409
      || /already|exist|unique|duplic|registrad/.test(combined);
    if (!looksDuplicate) return false;

    const isEmail = /email|correo|mail/.test(combined);
    const isCedula = /cedula|c[eé]dula|document|dni|id number/.test(combined);
    const isUsername = /username|usuario|usr/.test(combined);

    if (isEmail && !isCedula) {
      this.serverEmailError.set(this.copy().duplicateEmail);
      return true;
    }

    if (isCedula && !isEmail) {
      this.serverCedulaError.set(this.copy().duplicateCedula);
      return true;
    }

    if (isUsername) {
      this.serverUsernameError.set(this.copy().duplicateUsername);
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

  private extractStructuredDuplicateErrors(body: unknown): Record<string, string> {
    if (!body || typeof body !== 'object') return {};
    const value = body as Record<string, unknown>;
    const errors = value.errors;
    if (!errors || typeof errors !== 'object') return {};
    return errors as Record<string, string>;
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

    if (errors.username) {
      this.serverUsernameError.set(this.copy().duplicateUsername);
      matched = true;
    }

    return matched;
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

  openReactivateModal() {
    this.reactivateModalOpen.set(true);
  }

  closeReactivateModal() {
    this.reactivateModalOpen.set(false);
  }

  getStatusLabel(employee: EmployeeRowDto): string {
    if (this.isBlockedEmployee(employee)) return this.copy().blocked;
    if (!employee.isActive) return this.copy().inactive;
    return this.copy().active;
  }

  getStatusClass(employee: EmployeeRowDto): string {
    if (this.isBlockedEmployee(employee)) return 'border-error/30 bg-error/10 text-error shadow-sm shadow-error/5';
    if (!employee.isActive) return 'border-outline-variant/40 bg-surface-container-high text-on-surface-variant';
    return 'border-primary/20 bg-primary/10 text-primary shadow-sm shadow-primary/5';
  }

  getStatusDot(employee: EmployeeRowDto): string {
    if (this.isBlockedEmployee(employee)) return 'bg-error';
    if (!employee.isActive) return 'bg-outline';
    return 'bg-primary animate-pulse';
  }

  isBlockedEmployee(employee: EmployeeRowDto): boolean {
    return (employee.status || '').toUpperCase() === 'BLOCKED';
  }

  async unlockEmployee(employee: EmployeeRowDto) {
    const confirmed = await this.feedback.confirm(
      this.copy().confirmUnlockTitle,
      this.copy().confirmUnlockText,
      this.copy().confirmBtn,
      this.copy().cancelBtn,
    );
    if (!confirmed) return;

    try {
      await this.api.unlockUser(employee.id);
      await this.feedback.toast('success', this.copy().unlockedToast);
      await this.reloadEmployees();
      void this.reloadKpis();
    } catch (err) {
      console.error('[unlock]', err);
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'Error al desbloquear' : 'Error unlocking user');
    }
  }

  // ── Activate / Deactivate user ──
  async toggleActive(employee: EmployeeRowDto) {
    if (this.isBlockedEmployee(employee)) {
      await this.unlockEmployee(employee);
      return;
    }
    const isActive = employee.isActive;
    const confirmed = await this.feedback.confirm(
      isActive ? this.copy().confirmDeactivateTitle : this.copy().confirmActivateTitle,
      isActive ? this.copy().confirmDeactivateText : this.copy().confirmActivateText,
      this.copy().confirmBtn,
      this.copy().cancelBtn,
    );
    if (!confirmed) return;

    try {
      const result = isActive
        ? await this.api.deactivateUser(employee.id)
        : await this.api.activateUser(employee.id);
      this.employees.update(emps =>
        emps.map(e => e.id === result.id ? result : e)
      );
      void this.reloadKpis();
      await this.feedback.toast('success',
        isActive ? this.copy().toggledInactive : this.copy().toggledActive);
    } catch (err) {
      console.error('[toggle active]', err);
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'Error al cambiar el estado' : 'Error changing status');
    }
  }

  // ── Helpers ──
  visibleRangeStart() {
    if (this.totalCount() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  visibleRangeEnd() {
    return Math.min(this.totalCount(), this.page() * this.pageSize());
  }

  employeeFullName(e: EmployeeRowDto): string {
    return `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.username || e.employeeId;
  }

  getEmployeeInitials(e: EmployeeRowDto): string {
    const first = e.firstName ? e.firstName.charAt(0) : '';
    const last = e.lastName ? e.lastName.charAt(0) : '';
    return (first + last).toUpperCase() || e.username?.charAt(0)?.toUpperCase() || '?';
  }

  getEmployeeGradient(e: EmployeeRowDto): string {
    if (this.gradientCache.has(e.id)) {
      return this.gradientCache.get(e.id)!;
    }
    const gradients = [
      'from-[#4f46e5]/20 to-[#06b6d4]/20 text-[#4f46e5] dark:text-[#c3c0ff] border-[#4f46e5]/20',
      'from-[#ec4899]/20 to-[#f43f5e]/20 text-[#ec4899] dark:text-[#ffb2b7] border-[#ec4899]/20',
      'from-[#10b981]/20 to-[#3b82f6]/20 text-[#10b981] dark:text-[#89ceff] border-[#10b981]/20',
      'from-[#f59e0b]/20 to-[#ef4444]/20 text-[#f59e0b] dark:text-[#ffb2b7] border-[#f59e0b]/20',
      'from-[#8b5cf6]/20 to-[#d946ef]/20 text-[#8b5cf6] dark:text-[#c3c0ff] border-[#8b5cf6]/20',
    ];
    const gradient = gradients[Math.floor(Math.random() * gradients.length)];
    this.gradientCache.set(e.id, gradient);
    return gradient;
  }

  showEmployeeInfo(employee: EmployeeRowDto) {
    const statusText = this.getStatusLabel(employee);
    const fullName = this.employeeFullName(employee);
    const html = `
<div style="font-family: monospace; font-size: 14px; line-height: 1.8; text-align: left;">
  <div style="font-weight: bold; padding-bottom: 6px; border-bottom: 1px solid #ccc; margin-bottom: 10px;">
    ${this.locale() === 'es' ? 'DATOS DEL EMPLEADO' : 'EMPLOYEE INFO'}
  </div>
  <div><strong>${this.copy().employeeId}:</strong> ${employee.employeeId}</div>
  <div><strong>${this.locale() === 'es' ? 'Nombre' : 'Name'}:</strong> ${fullName}</div>
  <div><strong>Username:</strong> ${employee.username}</div>
  <div><strong>Email:</strong> ${employee.email || '—'}</div>
  <div><strong>${this.copy().docLabel}:</strong> ${employee.cedula || '—'}</div>
  <div><strong>${this.copy().role}:</strong> ${employee.role}</div>
  <div><strong>${this.copy().status}:</strong> ${statusText}</div>
  <div><strong>${this.locale() === 'es' ? 'Intentos fallidos' : 'Failed attempts'}:</strong> ${employee.failedLoginAttempts}</div>
</div>`;
    void this.feedback.alertHtml('info',
      this.locale() === 'es' ? 'Detalles del Empleado' : 'Employee Details', html);
  }

  iconVariationSettings(active = false) {
    return active ? "'FILL' 1" : "'FILL' 0";
  }

  currentThemeLabel() {
    return this.locale() === 'es'
      ? (this.theme() === 'dark' ? 'Modo oscuro' : 'Modo claro')
      : (this.theme() === 'dark' ? 'Dark mode' : 'Light mode');
  }

  toggleTheme() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.persistTheme(next);
  }

  toggleLocale() {
    this.localeService.toggle();
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
