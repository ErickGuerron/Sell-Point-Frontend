import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, inject, signal, HostListener, ElementRef, ViewChild } from '@angular/core';
import type { OnInit } from '@angular/core';
import { EmployeeApiService, type EmployeeRowDto, type UpdateUserPayload } from './employee-api.service';
import { RoleApiService, type RoleDto } from './role-api.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { LocaleService } from '../../shared/services/locale.service';
import { SessionService } from '../../shared/services/session.service';
import { type BillflowSidebarItem } from '../../shared/components/billflow-sidebar.component';
import { buildBillflowSidebarItems } from '../../shared/billflow-navigation';
import { BillflowPageShellComponent } from '../../shared/components/billflow-page-shell.component';
import { DashboardParticlesBackgroundComponent } from '../dashboard/dashboard-particles-background.component';
import { BillflowMobileSidebarComponent } from '../../shared/components/billflow-mobile-sidebar.component';
import { BillflowNotificationButtonComponent } from '../../shared/components/billflow-notification-button.component';
import { BillflowUserMenuComponent } from '../../shared/components/billflow-user-menu.component';
import { BillflowModalShellComponent } from '../../shared/components/billflow-modal-shell.component';
import { BillflowComboboxComponent, type ComboboxOption } from '../../shared/components/billflow-combobox.component';

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
  // Form
  firstNameLabel: string;
  lastNameLabel: string;
  docLabel: string;
  emailLabel: string;
  usernameLabel: string;
  passwordLabel: string;
  roleLabel: string;
  employeeIdLabel: string;
  // Validation messages
  firstNameOnlyLetters: string;
  lastNameOnlyLetters: string;
  lastNameNoSpaces: string;
  cedulaExact10: string;
  emailInvalidFormat: string;
  usernameNoSpaces: string;
  passwordNoSpaces: string;
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
    firstNameLabel: 'Nombre',
    lastNameLabel: 'Apellido',
    docLabel: 'Cédula',
    emailLabel: 'Email',
    usernameLabel: 'Usuario',
    passwordLabel: 'Contraseña',
    roleLabel: 'Rol',
    employeeIdLabel: 'Código de Empleado',
    // Validation messages
    firstNameOnlyLetters: 'Solo letras permitidas',
    lastNameOnlyLetters: 'Solo letras permitidas',
    lastNameNoSpaces: 'No se permiten espacios',
    cedulaExact10: 'Debe tener exactamente 10 dígitos',
    emailInvalidFormat: 'Formato de email inválido',
    usernameNoSpaces: 'No se permiten espacios',
    passwordNoSpaces: 'No se permiten espacios',
    charCountLabel: '',
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
    passwordLabel: 'Password',
    roleLabel: 'Role',
    employeeIdLabel: 'Employee Code',
    // Validation messages
    firstNameOnlyLetters: 'Only letters allowed',
    lastNameOnlyLetters: 'Only letters allowed',
    lastNameNoSpaces: 'No spaces allowed',
    cedulaExact10: 'Must be exactly 10 digits',
    emailInvalidFormat: 'Invalid email format',
    usernameNoSpaces: 'No spaces allowed',
    passwordNoSpaces: 'No spaces allowed',
    charCountLabel: '',
  },
};

// Roles are now loaded dynamically from RoleApiService (see roleOptions computed)

@Component({
  selector: 'billflow-employees-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule, BillflowComboboxComponent,

    BillflowPageShellComponent, DashboardParticlesBackgroundComponent,
    BillflowMobileSidebarComponent, BillflowNotificationButtonComponent,
    BillflowUserMenuComponent, BillflowModalShellComponent,
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
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
          <div class="absolute -right-4 -bottom-4 text-primary/5 dark:text-primary/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
            <span class="material-symbols-outlined text-[96px] font-light">badge</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-[24px]">badge</span>
            </div>
            <div>
              <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ locale() === 'es' ? 'Total de Empleados' : 'Total Employees' }}</p>
              <h3 class="text-2xl font-bold text-on-background mt-1">{{ totalEmployeesCount() }}</h3>
            </div>
          </div>
        </div>
        <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
          <div class="absolute -right-4 -bottom-4 text-[#10b981]/5 dark:text-[#10b981]/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
            <span class="material-symbols-outlined text-[96px] font-light">check_circle</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center border border-[#10b981]/20 shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-[24px]">check_circle</span>
            </div>
            <div>
              <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ locale() === 'es' ? 'Activos' : 'Active' }}</p>
              <h3 class="text-2xl font-bold text-on-background mt-1">{{ activeEmployeesCount() }}</h3>
            </div>
          </div>
        </div>
        <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
          <div class="absolute -right-4 -bottom-4 text-[#f59e0b]/5 dark:text-[#f59e0b]/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
            <span class="material-symbols-outlined text-[96px] font-light">pause_circle</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 rounded-xl bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center border border-[#f59e0b]/20 shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-[24px]">pause_circle</span>
            </div>
            <div>
              <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ locale() === 'es' ? 'Inactivos' : 'Inactive' }}</p>
              <h3 class="text-2xl font-bold text-on-background mt-1">{{ inactiveEmployeesCount() }}</h3>
            </div>
          </div>
        </div>
        <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
          <div class="absolute -right-4 -bottom-4 text-error/5 dark:text-error/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
            <span class="material-symbols-outlined text-[96px] font-light">lock</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 rounded-xl bg-error/10 text-error flex items-center justify-center border border-error/20 shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-[24px]">lock</span>
            </div>
            <div>
              <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ locale() === 'es' ? 'Bloqueados' : 'Blocked' }}</p>
              <h3 class="text-2xl font-bold text-on-background mt-1">{{ blockedEmployeesCount() }}</h3>
            </div>
          </div>
        </div>
      </section>
      <section class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden">
        <div class="dashboard-table-card__head p-6 md:p-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-wrap items-center gap-3">
            <billflow-combobox
              [options]="statusFilterOptions()"
              [value]="statusFilter()"
              [placeholder]="copy().allStatuses"
              searchPlaceholder="{{ locale() === 'es' ? 'Buscar estado...' : 'Search status...' }}"
              [compact]="true"
              (valueChange)="setStatusFilter($event)"
            ></billflow-combobox>
            <billflow-combobox
              [options]="roleFilterOptions()"
              [value]="roleFilter()"
              [placeholder]="copy().allRoles"
              searchPlaceholder="{{ locale() === 'es' ? 'Buscar rol...' : 'Search role...' }}"
              [compact]="true"
              (valueChange)="setRoleFilter($event)"
            ></billflow-combobox>
            <button type="button" title="Refresh" class="inline-flex items-center justify-center bg-surface-container-lowest border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm hover:border-primary hover:text-primary" (click)="void reloadEmployees()">
              <span class="material-symbols-outlined text-[20px] transition-transform" [style.animation]="loading() ? 'spin 0.7s linear infinite' : 'none'">refresh</span>
            </button>
            <button type="button" class="inline-flex items-center gap-2 bg-primary text-on-primary rounded-lg px-4 py-2 text-sm font-bold hover:opacity-90 transition-all shadow-sm" (click)="openCreateModal()">
              <span class="material-symbols-outlined text-[18px]">add</span>{{ copy().newEmployee }}
            </button>
            <button type="button" class="inline-flex items-center gap-2 bg-[#f59e0b] text-white rounded-lg px-4 py-2 text-sm font-bold hover:opacity-90 transition-all shadow-sm" (click)="openReactivateModal()">
              <span class="material-symbols-outlined text-[18px]">lock_open</span>{{ copy().reactivateUsers }}
            </button>
          </div>
          <div class="flex items-center gap-2 w-full lg:w-auto">
            <billflow-combobox
              [options]="searchFieldOptionsList()"
              [value]="searchFieldValue()"
              [placeholder]="locale() === 'es' ? 'Buscar por...' : 'Search by...'"
              searchPlaceholder="{{ locale() === 'es' ? 'Buscar campo...' : 'Search field...' }}"
              [compact]="true"
              (valueChange)="onSearchFieldSelected($event)"
            ></billflow-combobox>
            <div class="relative flex-1 lg:w-64">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
              <input class="w-full min-w-0 pl-12 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-full text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" [placeholder]="copy().searchPlaceholder" [value]="searchQuery()" (input)="setSearchQuery(($any($event.target).value))" (keydown)="onSearchKeydown($event)" />
            </div>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="dashboard-table-card__head-row font-label-bold text-[11px] uppercase tracking-[0.1em]">
                <th class="dashboard-table-card__th p-4 pl-7 font-semibold">{{ locale() === 'es' ? 'Empleado' : 'Employee' }}</th>
                <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().email }}</th>
                <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().role }}</th>
                <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().status }}</th>
                <th class="dashboard-table-card__th p-4 font-semibold text-center">{{ locale() === 'es' ? 'Intentos' : 'Attempts' }}</th>
                <th class="dashboard-table-card__th p-4 pr-7 font-semibold text-right">{{ copy().actions }}</th>
              </tr>
            </thead>
            <tbody class="font-body-sm text-body-sm">
              @for (employee of employees(); track employee.id) {
                <tr class="dashboard-table-card__row group border-b border-outline-variant/20 hover:bg-surface-container-low/40 transition-colors duration-200 cursor-pointer" [ngClass]="!employee.isActive ? 'opacity-70 bg-surface-container-lowest/20' : ''" (click)="showEmployeeInfo(employee)">
                  <td class="p-4 pl-7 font-semibold text-on-background">
                    <div class="flex items-center gap-3">
                      <div class="h-9 w-9 rounded-full bg-gradient-to-br flex items-center justify-center border text-xs font-bold shrink-0 shadow-sm" [ngClass]="getEmployeeGradient(employee)">{{ getEmployeeInitials(employee) }}</div>
                      <div>
                        <div class="font-semibold text-on-background">{{ employeeFullName(employee) }}</div>
                        <div class="text-[10px] text-outline mt-0.5 md:hidden font-mono">{{ copy().employeeId }}: {{ employee.employeeId }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="p-4 text-on-surface font-medium max-w-[160px] truncate">{{ employee.email || '—' }}</td>
                  <td class="p-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/40">{{ employee.role }}</span>
                  </td>
                  <td class="p-4">
                    <span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide" [ngClass]="getStatusClass(employee)">
                      <span class="h-1.5 w-1.5 rounded-full" [ngClass]="getStatusDot(employee)"></span>{{ getStatusLabel(employee) | uppercase }}
                    </span>
                  </td>
                  <td class="p-4 text-center">
                    <span class="inline-flex items-center justify-center h-7 min-w-[2rem] px-2 rounded-md text-xs font-bold" [ngClass]="employee.failedLoginAttempts >= 3 ? 'bg-error/10 text-error border border-error/20' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/40'">{{ employee.failedLoginAttempts }}</span>
                  </td>
                  <td class="p-4 pr-7 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button type="button" [title]="locale() === 'es' ? 'Ver Detalles' : 'View Details'" class="inline-flex h-8 w-8 items-center justify-center bg-primary text-on-primary rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer" (click)="$event.stopPropagation(); showEmployeeInfo(employee)">
                        <span class="material-symbols-outlined text-[18px]">info</span>
                      </button>
                      <button type="button" [title]="copy().edit" class="inline-flex h-8 w-8 items-center justify-center bg-primary text-on-primary rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer" (click)="$event.stopPropagation(); openEditModal(employee)">
                        <span class="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      @if (employee.failedLoginAttempts >= 3) {
                        <button type="button" [title]="copy().unlock" class="inline-flex h-8 w-8 items-center justify-center bg-[#f59e0b] text-white rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer" (click)="$event.stopPropagation(); void unlockEmployee(employee)">
                          <span class="material-symbols-outlined text-[18px]">lock_open</span>
                        </button>
                      }
                      <button type="button" [title]="employee.isActive ? copy().deactivate : copy().activate" class="inline-flex h-8 w-8 items-center justify-center text-white rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer" [ngClass]="employee.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:opacity-85'" (click)="$event.stopPropagation(); void toggleActive(employee)">
                        <span class="material-symbols-outlined text-[18px]">{{ employee.isActive ? 'close' : 'check' }}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              }
              @if (employees().length === 0 && !loading()) {
                <tr>
                  <td colspan="6" class="p-8">
                    <div class="dashboard-table-card__empty dashboard-table-card__empty--stacked mt-2">
                      <span class="material-symbols-outlined dashboard-table-card__empty-icon">badge</span>
                      <p class="dashboard-table-card__empty-title">{{ copy().noEmployeesTitle }}</p>
                      <p class="dashboard-table-card__empty-text">{{ copy().noEmployeesText }}</p>
                    </div>
                  </td>
                </tr>
              }
              @if (loading()) {
                <tr>
                  <td colspan="6" class="p-8">
                    <div class="dashboard-table-card__empty dashboard-table-card__empty--stacked mt-2">
                      <div class="flex items-center gap-3 text-on-surface-variant">
                        <svg class="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        <span>{{ locale() === 'es' ? 'Cargando empleados...' : 'Loading employees...' }}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="flex flex-col gap-4 border-t border-outline-variant/40 bg-surface/60 p-5 md:flex-row md:items-center md:justify-between dark:bg-slate-900/60">
          <div class="flex items-center gap-3 text-sm text-on-surface-variant">
            <span>{{ copy().showingText }} <span class="font-semibold text-on-surface">{{ visibleRangeStart() }}</span> {{ locale() === 'es' ? 'a' : 'to' }} <span class="font-semibold text-on-surface">{{ visibleRangeEnd() }}</span> {{ locale() === 'es' ? 'de' : 'of' }} <span class="font-semibold text-on-surface">{{ totalCount() }}</span> {{ copy().entriesText }}</span>
            <select class="bg-surface border border-outline-variant rounded-lg px-2 py-1 text-xs font-medium text-on-surface cursor-pointer focus:outline-none focus:border-primary" [value]="pageSize()" (change)="onPageSizeChange($event)">
              <option [value]="5">5</option>
              <option [value]="10">10</option>
              <option [value]="15">15</option>
              <option [value]="20">20</option>
              <option [value]="30">30</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30" [disabled]="page() === 1" (click)="previousPage()">
              <span class="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            @for (pageNumber of visiblePages(); track pageNumber) {
              <button type="button" class="h-9 w-9 rounded-lg text-sm font-semibold transition" [ngClass]="pageNumber === page() ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'" (click)="goToPage(pageNumber)">{{ pageNumber }}</button>
            }
            <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30" [disabled]="page() === totalPages()" (click)="nextPage()">
              <span class="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </main>
    <billflow-modal-shell *ngIf="employeeModalOpen()" title="{{ editingEmployee() ? copy().modalEditTitle : copy().modalCreateTitle }}" subtitle="{{ editingEmployee() ? copy().modalEditSubtitle : copy().modalCreateSubtitle }}" icon="badge" maxWidth="xl" [hasFooter]="true" (close)="closeEmployeeModal()">
      <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().firstNameLabel }} <span class="text-error">*</span></label>
          <input #firstNameInput type="text" class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant" [ngClass]="formFirstNameError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'" [maxLength]="100" placeholder="Ej: Carlos" [ngModel]="formFirstName()" (ngModelChange)="onFirstNameInput($event)" />
          @if (formFirstNameError()) {
            <span class="text-xs text-error mt-1 block">{{ formFirstNameError() }}</span>
          }
          <span class="text-xs text-outline ml-auto mt-1 block text-right">{{ firstNameCount() }}/100</span>
        </div>
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().lastNameLabel }} <span class="text-error">*</span></label>
          <input #lastNameInput type="text" class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant" [ngClass]="formLastNameError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'" [maxLength]="100" placeholder="Ej: González" [ngModel]="formLastName()" (ngModelChange)="onLastNameInput($event)" />
          @if (formLastNameError()) {
            <span class="text-xs text-error mt-1 block">{{ formLastNameError() }}</span>
          }
          <span class="text-xs text-outline ml-auto mt-1 block text-right">{{ lastNameCount() }}/100</span>
        </div>
        
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().docLabel }} <span class="text-error">*</span></label>
          <input #cedulaInput type="text" class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant" [ngClass]="formCedulaError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'" [maxLength]="10" placeholder="Ej: 1234567890" [ngModel]="formCedula()" (ngModelChange)="onCedulaInput($event)" />
          @if (formCedulaError()) {
            <span class="text-xs text-error mt-1 block">{{ formCedulaError() }}</span>
          }
          <span class="text-xs text-outline ml-auto mt-1 block text-right">{{ cedulaCount() }}/10</span>
        </div>
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().emailLabel }} <span class="text-error">*</span></label>
          <input type="email" class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant" [ngClass]="formEmailError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'" [maxLength]="255" placeholder="Ej: empleado@ejemplo.com" [ngModel]="formEmail()" (ngModelChange)="onEmailInput($event)" />
          @if (formEmailError()) {
            <span class="text-xs text-error mt-1 block">{{ formEmailError() }}</span>
          }
          <span class="text-xs text-outline ml-auto mt-1 block text-right">{{ emailCount() }}/255</span>
        </div>
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().usernameLabel }} <span class="text-error">*</span></label>
          <input type="text" class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant" [ngClass]="formUsernameError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'" [maxLength]="50" placeholder="Ej: carlos.gonzalez" [ngModel]="formUsername()" (ngModelChange)="onUsernameInput($event)" />
          @if (formUsernameError()) {
            <span class="text-xs text-error mt-1 block">{{ formUsernameError() }}</span>
          }
          <span class="text-xs text-outline ml-auto mt-1 block text-right">{{ usernameCount() }}/50</span>
        </div>
        @if (!editingEmployee()) {
          <div class="md:col-span-1">
            <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().passwordLabel }} <span class="text-error">*</span></label>
            <input type="password" class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant" [ngClass]="formPasswordError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'" [maxLength]="100" placeholder="••••••••" [ngModel]="formPassword()" (ngModelChange)="onPasswordInput($event)" />
            @if (formPasswordError()) {
              <span class="text-xs text-error mt-1 block">{{ formPasswordError() }}</span>
            }
          </div>
        }
        <div [ngClass]="editingEmployee() ? 'md:col-span-1' : 'md:col-span-1'">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().roleLabel }} <span class="text-error">*</span></label>
          <select class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer" [ngModel]="formRole()" (ngModelChange)="formRole.set($event)">
            <option value="">-- {{ locale() === 'es' ? 'Seleccionar' : 'Select' }} --</option>
            @for (opt of roleOptions(); track opt.value) {
              <option [value]="opt.value">{{ opt.label }}</option>
            }
          </select>
        </div>
      </div>
      <div footer class="flex w-full items-center justify-end gap-3">
        <button type="button" class="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all border border-outline-variant/50" (click)="closeEmployeeModal()">{{ copy().cancel }}</button>
        <button type="button" class="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all shadow-sm disabled:opacity-50" [disabled]="!formValid() || formSubmitting()" (click)="void saveEmployee()">
          @if (formSubmitting()) {
            <span class="inline-flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              {{ locale() === 'es' ? 'Guardando...' : 'Saving...' }}
            </span>
          } @else {
            {{ editingEmployee() ? copy().saveEdit : copy().save }}
          }
        </button>
      </div>
    </billflow-modal-shell>
    <billflow-modal-shell *ngIf="reactivateModalOpen()" title="{{ copy().reactivateUsers }}" subtitle="{{ locale() === 'es' ? 'Usuarios bloqueados del sistema' : 'Blocked system users' }}" icon="lock_open" maxWidth="lg" [hasFooter]="true" (close)="closeReactivateModal()">
      <div class="p-6">
        @let blockedEmployees = employees().filter(e => e.failedLoginAttempts >= 3);
        @if (blockedEmployees.length === 0) {
          <div class="dashboard-table-card__empty dashboard-table-card__empty--stacked mt-2">
            <span class="material-symbols-outlined dashboard-table-card__empty-icon">lock_open</span>
            <p class="dashboard-table-card__empty-title">{{ locale() === 'es' ? 'No hay usuarios bloqueados' : 'No blocked users' }}</p>
            <p class="dashboard-table-card__empty-text">{{ locale() === 'es' ? 'Todos los usuarios pueden acceder al sistema.' : 'All users can access the system.' }}</p>
          </div>
        } @else {
          <p class="text-sm text-on-surface-variant mb-4">{{ locale() === 'es' ? 'Seleccioná los usuarios que querés desbloquear:' : 'Select the users to unlock:' }}</p>
          <div class="space-y-2 max-h-80 overflow-y-auto">
            @for (employee of blockedEmployees; track employee.id) {
              <div class="flex items-center justify-between p-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/30 hover:bg-surface-container-low transition-colors">
                <div class="flex items-center gap-3">
                  <div class="h-9 w-9 rounded-full bg-gradient-to-br flex items-center justify-center border text-xs font-bold shrink-0 shadow-sm" [ngClass]="getEmployeeGradient(employee)">{{ getEmployeeInitials(employee) }}</div>
                  <div>
                    <div class="font-semibold text-sm text-on-background">{{ employeeFullName(employee) }}</div>
                    <div class="text-[11px] text-outline">{{ employee.email }} · {{ copy().employeeId }}: {{ employee.employeeId }}</div>
                  </div>
                </div>
                <button type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#f59e0b] text-white hover:opacity-90 transition-all shadow-sm" (click)="$event.stopPropagation(); void unlockEmployee(employee)">
                  <span class="material-symbols-outlined text-[16px]">lock_open</span>{{ copy().unlock }}
                </button>
              </div>
            }
          </div>
        }
      </div>
      <div footer class="flex w-full items-center justify-end gap-3">
        <button type="button" class="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all border border-outline-variant/50" (click)="closeReactivateModal()">{{ locale() === 'es' ? 'Cerrar' : 'Close' }}</button>
      </div>
    </billflow-modal-shell>
    <nav class="md:hidden app-dashboard-mobile-nav">
      <a *ngFor="let item of mobileNavItems()" class="flex flex-col items-center justify-center w-full h-full pt-1 border-t-2 transition-colors app-dashboard-mobile-link" [href]="item.href" [ngClass]="item.active ? 'text-primary border-primary app-dashboard-mobile-link--active' : 'border-transparent'">
        <span class="material-symbols-outlined" [style.font-variation-settings]="iconVariationSettings(item.active)">{{ item.icon }}</span>
        <span class="text-[10px] font-medium mt-1">{{ item.label }}</span>
      </a>
      <div class="app-dashboard-mobile-fab-wrap">
        <button type="button" class="w-14 h-14 bg-[#6862f3] text-white rounded-full shadow-lg shadow-[#6862f3]/30 flex items-center justify-center hover:bg-[#514be6] active:scale-95 transition-all border-[3px] border-surface" (click)="openCreateModal()">
          <span class="material-symbols-outlined text-[24px]">add</span>
        </button>
      </div>
    </nav>
  </div>
</billflow-page-shell>`,
})
export class EmployeesPageComponent implements OnInit {
  private readonly api = inject(EmployeeApiService);
  private readonly roleApi = inject(RoleApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);
  protected readonly session = inject(SessionService);
  @ViewChild('userMenuPanel') private userMenuPanel?: ElementRef<HTMLElement>;
  private gradientCache = new Map<string, string>();
  @ViewChild('firstNameInput') firstNameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('lastNameInput') lastNameInput?: ElementRef<HTMLInputElement>;

  locale = this.localeService.locale;
  copy = computed(() => EMPLOYEES_TEXT[this.locale()]);

  Math = Math;
  String = String;

  readonly sidebarItems = computed(() => buildBillflowSidebarItems({
    dashboard: this.copy().sidebarDashboard,
    invoices: this.copy().sidebarInvoices,
    products: this.copy().sidebarProducts,
    customers: this.copy().sidebarCustomers,
    employees: this.copy().sidebarEmployees,
  }, 'employees'));

  readonly mobileNavItems = computed<BillflowSidebarItem[]>(() => [
    { label: this.copy().sidebarDashboard, icon: 'dashboard', href: '/dashboard' },
    { label: this.copy().sidebarInvoices, icon: 'receipt_long', href: '/invoices' },
    { label: this.copy().sidebarEmployees, icon: 'badge', href: '/employees', active: true },
    { label: this.copy().sidebarProducts, icon: 'inventory_2', href: '/products' },
  ]);

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

  readonly roleOptions = computed<ComboboxOption[]>(() =>
    this.roles().map((r) => ({ value: r.name, label: r.name }))
  );

  readonly roleFilterOptions = computed<ComboboxOption[]>(() => [
    { value: 'all', label: this.copy().allRoles },
    ...this.roleOptions(),
  ]);

  // ── Filter values ──
  readonly searchFieldOptionsList = computed(() => [
    { value: 'all', label: this.locale() === 'es' ? 'Cualquier campo' : 'Any field' },
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

  // ── Form signals ──
  formFirstName = signal('');
  formLastName = signal('');
  formEmployeeId = signal('');
  formCedula = signal('');
  formEmail = signal('');
  formUsername = signal('');
  formPassword = signal('');
  formRole = signal('');
  formSubmitting = signal(false);

  readonly formValid = computed(() =>
    this.formFirstNameValid()
    && this.formLastNameValid()
    && this.formCedulaValid()
    && this.formEmailValid()
    && this.formUsernameValid()
    && this.formRole().trim().length > 0
    && (!this.editingEmployee() || this.formPassword().trim().length >= 6)
  );

  // ── Validation signals ──
  formFirstNameError = signal('');
  formLastNameError = signal('');
  formCedulaError = signal('');
  formEmailError = signal('');
  formUsernameError = signal('');
  formPasswordError = signal('');

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
    this.applyStoredTheme();
    if (typeof window !== 'undefined') document.documentElement.lang = this.locale();

    // Load roles and employees in parallel
    await Promise.all([
      this.loadRoles(),
      this.reloadEmployees(),
      this.reloadKpis(),
    ]);
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
      });
      this.employees.set(result.data || []);
      this.totalCount.set(result.total || 0);
    } catch (err) {
      console.error('[employees] load error:', err);
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'No se pudieron cargar los empleados' : 'Could not load employees',
        this.locale() === 'es' ? 'Revisá la conexión con el backend.' : 'Please check the backend connection.');
    } finally {
      this.loading.set(false);
    }
  }

  async reloadKpis() {
    try {
      const [totalResult, activeResult, inactiveResult, blockedResult] = await Promise.all([
        this.api.listUsers({ limit: 1 }),
        this.api.listUsers({ limit: 1, status: 'ACTIVE' }),
        this.api.listUsers({ limit: 1, status: 'INACTIVE' }),
        this.api.listUsers({ limit: 1, status: 'BLOCKED' }),
      ]);

      this.totalEmployeesKpi.set(totalResult.total || 0);
      this.activeEmployeesKpi.set(activeResult.total || 0);
      this.inactiveEmployeesKpi.set(inactiveResult.total || 0);
      this.blockedEmployeesKpi.set(blockedResult.total || 0);
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
    this.resetForm();
    this.editingEmployee.set(null);
    this.employeeModalOpen.set(true);
  }

  openEditModal(employee: EmployeeRowDto) {
    this.formFirstName.set(employee.firstName);
    this.formLastName.set(employee.lastName);
    this.formEmployeeId.set(employee.employeeId);
    this.formCedula.set(employee.cedula);
    this.formEmail.set(employee.email);
    this.formUsername.set(employee.username);
    this.formRole.set(employee.role);
    this.formPassword.set('');
    this.formSubmitting.set(false);
    this.formFirstNameError.set('');
    this.formLastNameError.set('');
    this.formCedulaError.set('');
    this.formEmailError.set('');
    this.formUsernameError.set('');
    this.formPasswordError.set('');
    this.editingEmployee.set(employee);
    this.employeeModalOpen.set(true);
  }

  closeEmployeeModal() {
    this.employeeModalOpen.set(false);
    this.editingEmployee.set(null);
    this.resetForm();
  }

  private resetForm() {
    this.formFirstName.set('');
    this.formLastName.set('');
    this.formEmployeeId.set('');
    this.formCedula.set('');
    this.formEmail.set('');
    this.formUsername.set('');
    this.formPassword.set('');
    this.formRole.set('');
    this.formSubmitting.set(false);
    this.formFirstNameError.set('');
    this.formLastNameError.set('');
    this.formCedulaError.set('');
    this.formEmailError.set('');
    this.formUsernameError.set('');
    this.formPasswordError.set('');
  }

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

  onPasswordInput(value: string) {
    const cleaned = value.replace(/\s/g, '');
    this.formPassword.set(cleaned);
    this.validatePassword(cleaned);
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

  private validatePassword(value: string) {
    if (value.includes(' ')) {
      this.formPasswordError.set(this.copy().passwordNoSpaces);
    } else {
      this.formPasswordError.set('');
    }
  }

  async saveEmployee() {
    if (!this.formValid() || this.formSubmitting()) return;
    this.formSubmitting.set(true);
    try {
      if (this.editingEmployee()) {
        const updated = await this.api.updateUser(this.editingEmployee()!.id, {
          firstName: this.formFirstName().trim(),
          lastName: this.formLastName().trim(),
          email: this.formEmail().trim(),
          role: this.formRole(),
          cedula: this.formCedula().trim(),
        });
        this.employees.update(emps =>
          emps.map(e => e.id === updated.id ? updated : e)
        );
        await this.feedback.toast('success',
          this.locale() === 'es' ? 'Empleado actualizado correctamente' : 'Employee updated successfully');
      } else {
        const created = await this.api.registerUser({
          email: this.formEmail().trim(),
          firstName: this.formFirstName().trim(),
          lastName: this.formLastName().trim(),
          cedula: this.formCedula().trim(),
          role: this.formRole(),
          username: this.formUsername().trim(),
          defaultBranchId: '',
        });
        this.employees.update(emps => [created, ...emps]);
        this.totalCount.update(c => c + 1);
        void this.reloadKpis();
        await this.feedback.toast('success',
          this.locale() === 'es' ? 'Empleado creado correctamente' : 'Employee created successfully');
      }
      this.closeEmployeeModal();
    } catch (err) {
      console.error('[save employee]', err);
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'Error al guardar empleado' : 'Error saving employee');
    } finally {
      this.formSubmitting.set(false);
    }
  }

  openReactivateModal() {
    this.reactivateModalOpen.set(true);
  }

  closeReactivateModal() {
    this.reactivateModalOpen.set(false);
  }

  getStatusLabel(employee: EmployeeRowDto): string {
    if (!employee.isActive) return this.copy().inactive;
    if (employee.failedLoginAttempts >= 3) return this.copy().blocked;
    return this.copy().active;
  }

  getStatusClass(employee: EmployeeRowDto): string {
    if (!employee.isActive) return 'border-outline-variant/40 bg-surface-container-high text-on-surface-variant';
    if (employee.failedLoginAttempts >= 3) return 'border-error/30 bg-error/10 text-error shadow-sm shadow-error/5';
    return 'border-primary/20 bg-primary/10 text-primary shadow-sm shadow-primary/5';
  }

  getStatusDot(employee: EmployeeRowDto): string {
    if (!employee.isActive) return 'bg-outline';
    if (employee.failedLoginAttempts >= 3) return 'bg-error';
    return 'bg-primary animate-pulse';
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
