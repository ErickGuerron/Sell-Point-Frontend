import { CommonModule } from '@angular/common';
import { Component, inject, computed, signal, ChangeDetectionStrategy, Input } from '@angular/core';
import type { OnInit } from '@angular/core';
import { LocaleService } from '../../shared/services/locale.service';
import { SessionService } from '../../shared/services/session.service';
import { ThemeService } from '../../shared/services/theme.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
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
import type { ProfileCopy } from './i18n/profile.translations';
import { PROFILE_TEXT } from './i18n/profile.translations';
import type { ProfileInitialData } from '../../shared/ssr-page-data';

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
                    [actionLabel]="copy().sessionInfo"
                    actionIcon="info"
                    (actionClick)="goToProfile()"
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
            <p class="text-body-sm text-outline max-w-sm text-center">{{ store.errorMessage() || copy().errorText }}</p>
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

            <!-- Google Account Linking card -->
            <div class="dashboard-table-card rounded-2xl border border-outline-variant/40 overflow-hidden">
              <div class="p-6 md:p-7 border-b border-outline-variant/20 bg-surface/60">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-outline text-[20px]">link</span>
                  <h3 class="font-label-bold text-label-bold text-outline uppercase tracking-wider">
                    {{ copy().googleLinkTitle }}
                  </h3>
                </div>
              </div>

              <div class="p-6 md:p-7">
                <!-- Unlinked state -->
                <div *ngIf="!store.googleLinked()" class="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-[#4285F4]/10 text-[#4285F4] flex items-center justify-center shrink-0">
                      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="font-body-md text-body-md text-on-surface font-medium">{{ copy().googleLinkTitle }}</p>
                      <p class="font-body-sm text-body-sm text-outline mt-0.5">{{ copy().googleLinkDesc }}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="px-4 py-2 rounded-xl bg-[#4285F4] text-white font-bold text-sm hover:bg-[#4285F4]/90 active:scale-95 transition-all shrink-0 flex items-center gap-2 disabled:opacity-50"
                    [disabled]="store.googleLoading()"
                    (click)="handleLinkGoogle()"
                  >
                    <span *ngIf="store.googleLoading()" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span *ngIf="!store.googleLoading()" class="material-symbols-outlined text-[18px]">link</span>
                    {{ store.googleLoading() ? copy().googleLoading : copy().googleLinkButton }}
                  </button>
                </div>

                <!-- Linked state -->
                <div *ngIf="store.googleLinked()" class="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-[#34A853]/10 text-[#34A853] flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined text-[20px]">check_circle</span>
                    </div>
                    <div class="min-w-0">
                      <p class="font-body-md text-body-md text-on-surface font-medium flex items-center gap-1.5">
                        {{ copy().googleLinkedLabel }}
                        <span class="text-xs font-normal text-outline">— {{ store.googleEmail() }}</span>
                      </p>
                      <p class="font-body-sm text-body-sm text-success mt-0.5 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px] text-success">check</span>
                        {{ copy().googleLinkedStatus }}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="px-4 py-2 rounded-xl border border-outline-variant text-on-surface font-bold text-sm hover:bg-error/5 active:scale-95 transition-all shrink-0 flex items-center gap-2 disabled:opacity-50"
                    [disabled]="store.googleLoading()"
                    (click)="handleUnlinkGoogle()"
                  >
                    <span *ngIf="store.googleLoading()" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span *ngIf="!store.googleLoading()" class="material-symbols-outlined text-[18px]">link_off</span>
                    {{ store.googleLoading() ? copy().googleLoading : copy().googleUnlinkButton }}
                  </button>
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
  readonly localeService = inject(LocaleService);
  protected readonly session = inject(SessionService);
  protected readonly themeService = inject(ThemeService);
  protected readonly store = inject(ProfileStore);
  private readonly feedback = inject(UiFeedbackService);

  readonly copy = computed(() => PROFILE_TEXT[this.localeService.locale()]);
  private hasInitialData = false;

  @Input() set initialData(value: ProfileInitialData | null | undefined) {
    if (!value) return;
    this.store.setInitialProfile(value.profile);
    this.hasInitialData = Boolean(value.profile);
  }

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

  async ngOnInit() {
    this.themeService.init();
    this.session.init();
    if (this.hasInitialData) return;
    await this.store.loadProfile();
  }

  toggleLocale() {
    this.localeService.toggle();
  }

  goToProfile() {
    // Already on profile page
  }

  async handleLinkGoogle() {
    try {
      await this.store.linkGoogle();
      await this.feedback.toast('success', this.copy().googleLinkedLabel);
    } catch (err) {
      const message = err instanceof Error ? err.message : this.copy().googleNetworkError;
      // eslint-disable-next-line no-console
      console.error('[ProfilePage.handleLinkGoogle]', err);
      await this.feedback.toast('error', message);
    }
  }

  async handleUnlinkGoogle() {
    const confirmed = await this.feedback.confirm(
      this.copy().googleUnlinkConfirmTitle,
      this.copy().googleUnlinkConfirmMessage,
      this.copy().googleUnlinkConfirmAction,
      this.copy().googleUnlinkConfirmCancel,
    );
    if (!confirmed) return;

    try {
      await this.store.unlinkGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : this.copy().googleNetworkError;
      // eslint-disable-next-line no-console
      console.error('[ProfilePage.handleUnlinkGoogle]', err);
      await this.feedback.toast('error', message);
    }
  }
}
