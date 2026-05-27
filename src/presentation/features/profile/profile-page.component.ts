import { CommonModule } from '@angular/common';
import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import type { OnInit } from '@angular/core';
import { LocaleService } from '../../shared/services/locale.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { SessionService } from '../../shared/services/session.service';
import { ThemeService } from '../../shared/services/theme.service';
import { BillflowPageShellComponent } from '../../shared/components/billflow-page-shell.component';
import { BillflowMobileSidebarComponent } from '../../shared/components/billflow-mobile-sidebar.component';
import { BillflowNotificationButtonComponent } from '../../shared/components/billflow-notification-button.component';
import { BillflowUserMenuComponent } from '../../shared/components/billflow-user-menu.component';
import { buildBillflowSidebarItems } from '../../shared/billflow-navigation';
import type { BillflowSidebarItem } from '../../shared/components/billflow-sidebar.component';
import { ProfileStore } from './profile-store';
import { ProfileRemoteDataSource } from './data/profile-remote.datasource';
import { ProfileImplRepository } from './data/profile.impl.repository';
import { ProfileRepository } from './domain/profile.repository';

interface ProfileCopy {
  moduleLabel: string;
  title: string;
  description: string;
  userInfo: string;
  sessionInfo: string;
  name: string;
  email: string;
  role: string;
  status: string;
  active: string;
  blocked: string;
  failedAttempts: string;
  failedAttemptsDesc: string;
  accountCreated: string;
  lastLogin: string;
  loading: string;
  errorTitle: string;
  errorText: string;
  retry: string;
  sidebarDashboard: string;
  sidebarInvoices: string;
  sidebarProducts: string;
  sidebarCustomers: string;
  sidebarEmployees: string;
  signOut: string;
  settings: string;
  notifications: string;
  languageToggle: string;
  sessionLabel: string;
}

const PROFILE_TEXT: Record<'es' | 'en', ProfileCopy> = {
  es: {
    moduleLabel: 'Mi Cuenta',
    title: 'Perfil de Usuario',
    description: 'Información personal y estado de tu cuenta en el sistema.',
    userInfo: 'Datos Personales',
    sessionInfo: 'Información de la Sesión',
    name: 'Nombre Completo',
    email: 'Correo Electrónico',
    role: 'Rol en el Sistema',
    status: 'Estado de la Cuenta',
    active: 'Activa',
    blocked: 'Bloqueada',
    failedAttempts: 'Intentos Fallidos de Inicio de Sesión',
    failedAttemptsDesc: 'intento(s) fallido(s) desde el último inicio de sesión exitoso',
    accountCreated: 'Cuenta Creada',
    lastLogin: 'Último Acceso',
    loading: 'Cargando perfil…',
    errorTitle: 'Error al cargar el perfil',
    errorText: 'No se pudo obtener la información del usuario. Verificá la conexión con el backend e intentá de nuevo.',
    retry: 'Reintentar',
    sidebarDashboard: 'Panel',
    sidebarInvoices: 'Facturas',
    sidebarProducts: 'Productos',
    sidebarCustomers: 'Clientes',
    sidebarEmployees: 'Empleados',
    signOut: 'Cerrar sesión',
    settings: 'Configuración',
    notifications: 'Notificaciones',
    languageToggle: 'English',
    sessionLabel: 'Sesión',
  },
  en: {
    moduleLabel: 'My Account',
    title: 'User Profile',
    description: 'Personal information and account status in the system.',
    userInfo: 'Personal Details',
    sessionInfo: 'Session Information',
    name: 'Full Name',
    email: 'Email Address',
    role: 'System Role',
    status: 'Account Status',
    active: 'Active',
    blocked: 'Blocked',
    failedAttempts: 'Failed Login Attempts',
    failedAttemptsDesc: 'failed attempt(s) since last successful login',
    accountCreated: 'Account Created',
    lastLogin: 'Last Access',
    loading: 'Loading profile…',
    errorTitle: 'Could not load profile',
    errorText: 'Failed to fetch user information. Please check the backend connection and try again.',
    retry: 'Retry',
    sidebarDashboard: 'Dashboard',
    sidebarInvoices: 'Invoices',
    sidebarProducts: 'Products',
    sidebarCustomers: 'Customers',
    sidebarEmployees: 'Employees',
    signOut: 'Sign out',
    settings: 'Settings',
    notifications: 'Notifications',
    languageToggle: 'Español',
    sessionLabel: 'Session',
  },
};

@Component({
  selector: 'billflow-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    BillflowPageShellComponent,
    BillflowMobileSidebarComponent,
    BillflowNotificationButtonComponent,
    BillflowUserMenuComponent,
  ],
  providers: [
    ProfileRemoteDataSource,
    ProfileImplRepository,
    { provide: ProfileRepository, useClass: ProfileImplRepository },
    ProfileStore,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <billflow-page-shell
      [items]="sidebarItems()"
      [locale]="localeService.locale()"
      (settings)="goToProfile()"
      (logout)="session.logout()"
    >
      <div class="flex-1 min-w-0 app-dashboard-main">
        <!-- ══ Top bar ══ -->
        <header
          class="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-xl"
        >
          <div class="py-3 px-5 md:px-6 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 shrink-0">
              <span class="hidden md:inline-flex lg:hidden">
                <billflow-mobile-sidebar
                  [items]="sidebarItems()"
                ></billflow-mobile-sidebar>
              </span>
              <span class="material-symbols-outlined text-outline">person</span>
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
                (settings)="goToProfile()"
                (logout)="session.logout()"
              ></billflow-user-menu>
            </div>
          </div>
        </header>

        <!-- ══ Main content ══ -->
        <main class="mx-auto w-full max-w-4xl px-5 pb-8 md:px-8 pt-8">
          <!-- Title row -->
          <section class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 class="font-h1 text-h1 tracking-tight text-on-background">{{ copy().title }}</h1>
              <p class="mt-2 text-body-md text-on-surface-variant">{{ copy().description }}</p>
            </div>
            <div class="flex items-center gap-2 text-sm text-on-surface-variant">
              <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ copy().sessionInfo }}</span>
            </div>
          </section>

          <!-- Loading state -->
          <div
            *ngIf="store.loading()"
            class="flex flex-col items-center justify-center py-24 gap-4"
          >
            <span class="material-symbols-outlined text-[48px] text-outline animate-spin">progress_activity</span>
            <p class="text-body-md text-outline font-medium">{{ copy().loading }}</p>
          </div>

          <!-- Error state -->
          <div
            *ngIf="store.error() && !store.loading()"
            class="flex flex-col items-center justify-center py-24 gap-4"
          >
            <span class="material-symbols-outlined text-[48px] text-error">error_outline</span>
            <p class="text-body-md text-on-surface font-semibold">{{ copy().errorTitle }}</p>
            <p class="text-body-sm text-outline max-w-sm text-center">{{ copy().errorText }}</p>
            <button
              type="button"
              class="mt-2 px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 active:scale-95 transition-all"
              (click)="store.loadProfile()"
            >
              {{ copy().retry }}
            </button>
          </div>

          <!-- ══ Profile content ══ -->
          <div *ngIf="store.profile() && !store.loading() && !store.error()" class="space-y-6">
            <!-- Avatar + name header card -->
            <div class="dashboard-glass-card rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl p-6 md:p-8 relative overflow-hidden">
              <div class="absolute -right-8 -bottom-8 text-primary/5 dark:text-primary/10 pointer-events-none">
                <span class="material-symbols-outlined text-[160px] font-light">person</span>
              </div>
              <div class="flex items-center gap-5 md:gap-7 relative z-10">
                <div
                  class="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/15 text-primary flex items-center justify-center text-3xl md:text-4xl font-black shrink-0 shadow-sm border-2 border-primary/20"
                >
                  {{ store.initials() }}
                </div>
                <div class="min-w-0">
                  <h2 class="font-h2 text-h2 text-on-surface truncate">{{ store.profile()?.name || '—' }}</h2>
                  <p class="font-body-md text-body-md text-outline mt-1">{{ store.profile()?.email || '—' }}</p>
                  <div class="flex items-center gap-3 mt-3">
                    <span
                      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                      [class.bg-primary/10]="store.isActive()"
                      [class.text-primary]="store.isActive()"
                      [class.bg-error/10]="!store.isActive()"
                      [class.text-error]="!store.isActive()"
                    >
                      <span class="material-symbols-outlined text-[14px]">
                        {{ store.isActive() ? 'check_circle' : 'block' }}
                      </span>
                      {{ store.isActive() ? copy().active : copy().blocked }}
                    </span>
                    <span
                      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary"
                    >
                      <span class="material-symbols-outlined text-[14px]">badge</span>
                      {{ store.profile()?.role || '—' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Personal Details card -->
            <div class="dashboard-table-card rounded-2xl border border-outline-variant/40 overflow-hidden">
              <div class="p-6 md:p-7 border-b border-outline-variant/20 bg-surface/60">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-outline text-[20px]">badge</span>
                  <h3 class="font-label-bold text-label-bold text-outline uppercase tracking-wider">
                    {{ copy().userInfo }}
                  </h3>
                </div>
              </div>

              <div class="p-6 md:p-7">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <p class="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">{{ copy().name }}</p>
                    <p class="font-body-md text-body-md text-on-surface font-medium flex items-center gap-2">
                      <span class="material-symbols-outlined text-outline text-[18px]">person</span>
                      {{ store.profile()?.name || '—' }}
                    </p>
                  </div>

                  <div>
                    <p class="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">{{ copy().email }}</p>
                    <p class="font-body-md text-body-md text-on-surface font-medium break-all flex items-center gap-2">
                      <span class="material-symbols-outlined text-outline text-[18px]">mail</span>
                      {{ store.profile()?.email || '—' }}
                    </p>
                  </div>

                  <div>
                    <p class="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">{{ copy().role }}</p>
                    <p class="font-body-md text-body-md text-on-surface font-medium flex items-center gap-2">
                      <span class="material-symbols-outlined text-outline text-[18px]">manage_accounts</span>
                      {{ store.profile()?.role || '—' }}
                    </p>
                  </div>

                  <div>
                    <p class="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">{{ copy().status }}</p>
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                        [class.bg-success/10]="store.isActive()"
                        [class.text-success]="store.isActive()"
                        [class.bg-error/10]="!store.isActive()"
                        [class.text-error]="!store.isActive()"
                      >
                        <span class="material-symbols-outlined text-[14px]">
                          {{ store.isActive() ? 'check_circle' : 'block' }}
                        </span>
                        {{ store.isActive() ? copy().active : copy().blocked }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Failed login attempts warning -->
            <div
              *ngIf="(store.failedAttempts() ?? 0) > 0"
              class="rounded-2xl border border-warning/30 bg-warning/5 p-5 md:p-6 relative overflow-hidden"
            >
              <div class="absolute -right-6 -bottom-6 text-warning/10 pointer-events-none">
                <span class="material-symbols-outlined text-[96px] font-light">warning</span>
              </div>
              <div class="flex items-start gap-4 relative z-10">
                <div class="h-10 w-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[22px]">warning</span>
                </div>
                <div class="min-w-0">
                  <p class="font-label-bold text-label-bold text-on-surface">{{ copy().failedAttempts }}</p>
                  <p class="font-body-sm text-body-sm text-outline mt-0.5">
                    <span class="font-bold text-warning">{{ store.failedAttempts() }}</span>
                    {{ copy().failedAttemptsDesc }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </billflow-page-shell>
  `,
})
export class ProfilePageComponent implements OnInit {
  private readonly feedback = inject(UiFeedbackService);
  readonly localeService = inject(LocaleService);
  protected readonly session = inject(SessionService);
  protected readonly themeService = inject(ThemeService);
  protected readonly store = inject(ProfileStore);

  readonly copy = computed(() => PROFILE_TEXT[this.localeService.locale()]);

  readonly sidebarItems = computed<BillflowSidebarItem[]>(() =>
    buildBillflowSidebarItems(
      {
        dashboard: this.copy().sidebarDashboard,
        invoices: this.copy().sidebarInvoices,
        products: this.copy().sidebarProducts,
        customers: this.copy().sidebarCustomers,
        employees: this.copy().sidebarEmployees,
      },
      'dashboard',
    ),
  );

  ngOnInit() {
    this.themeService.init();
    this.session.init();
    this.store.loadProfile();
  }

  toggleLocale() {
    this.localeService.toggle();
  }

  goToProfile() {
    // Already on profile page
  }
}
