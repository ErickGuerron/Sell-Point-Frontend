import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, Input, ElementRef, ViewChild, HostListener } from '@angular/core';
import type { OnInit } from '@angular/core';
import { AuditApiService } from './audit-api.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { LocaleService, type AppLocale } from '../../shared/services/locale.service';
import { SessionService } from '../../shared/services/session.service';
import { PermissionsService } from '../../shared/services/permissions.service';
import { type BillflowSidebarItem } from '../../shared/components/billflow-sidebar.component';
import { buildBillflowSidebarItems } from '../../shared/billflow-navigation';
import { BillflowPageShellComponent } from '../../shared/components/billflow-page-shell.component';
import { DashboardParticlesBackgroundComponent } from '../dashboard/dashboard-particles-background.component';
import { BillflowMobileSidebarComponent } from '../../shared/components/billflow-mobile-sidebar.component';
import { BillflowNotificationButtonComponent } from '../../shared/components/billflow-notification-button.component';
import { BillflowUserMenuComponent } from '../../shared/components/billflow-user-menu.component';
import { BillflowComboboxComponent, type ComboboxOption } from '../../shared/components/billflow-combobox.component';
import { BillflowDateRangePickerComponent } from '../../shared/components/billflow-date-range-picker.component';
import type { AuditInitialData } from '../../shared/ssr-page-data';
import { AUDIT_TEXT, type AuditCopy } from './i18n/audit.translations';
import type { AuditLogEntry, AuditSummary } from './domain/audit.entity';
import { AuditSummaryCardsComponent } from './components/audit-summary-cards.component';
import { AuditFilterBarComponent } from './components/audit-filter-bar.component';
import { AuditTableComponent } from './components/audit-table.component';
import { AuditDetailModalComponent } from './components/audit-detail-modal.component';

@Component({
  selector: 'billflow-audit-page',
  standalone: true,
  imports: [
    CommonModule,
    BillflowComboboxComponent,
    BillflowDateRangePickerComponent,
    BillflowPageShellComponent,
    DashboardParticlesBackgroundComponent,
    BillflowMobileSidebarComponent,
    BillflowNotificationButtonComponent,
    BillflowUserMenuComponent,
    AuditSummaryCardsComponent,
    AuditFilterBarComponent,
    AuditTableComponent,
    AuditDetailModalComponent,
  ],
  template: `
    <billflow-page-shell
      [items]="sidebarItems()"
      [locale]="locale()"
      (settings)="session.openUserSettings()"
      (logout)="session.logout()"
    >
      <billflow-dashboard-particles-background class="app-invoice-bg"></billflow-dashboard-particles-background>

      <div class="flex-1 min-w-0 app-invoices-shell app-dashboard-main">
        <header class="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div class="py-3 px-5 md:px-6 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 shrink-0">
              <span class="hidden md:inline-flex lg:hidden">
                <billflow-mobile-sidebar [items]="sidebarItems()" actionIcon="search" (actionClick)="void reloadAudit()"></billflow-mobile-sidebar>
              </span>
              <span class="material-symbols-outlined text-outline">assignment</span>
              <span class="font-h3 text-h3 text-on-background">{{ copy().moduleLabel }}</span>
            </div>
            <div class="flex items-center gap-2 ml-auto shrink-0 self-auto relative z-40" #userMenuPanel>
              <billflow-notification-button (clicked)="session.openNotifications()"></billflow-notification-button>
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
                (settings)="session.openUserSettings()"
                (logout)="session.logout()"
              ></billflow-user-menu>
            </div>
          </div>
        </header>

        <main class="mx-auto w-full max-w-7xl px-5 pb-5 md:px-8">
          <!-- Header -->
          <section class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 class="font-h1 text-h1 tracking-tight text-on-background">{{ copy().title }}</h1>
              <p class="mt-2 text-body-md text-on-surface-variant">{{ copy().description }}</p>
            </div>
            <div class="flex items-center gap-2 text-sm text-on-surface-variant">
              <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ totalCount() }} {{ copy().resultsLabel }}</span>
            </div>
          </section>

          <!-- KPI Cards -->
          @defer (on timer(200ms)) {
            <billflow-audit-summary-cards
              [actionsToday]="summary().actionsToday"
              [activeUsers]="summary().activeUsers"
              [topModifiedTable]="summary().topModifiedEntity"
              [actionsTodayLabel]="copy().actionsToday"
              [activeUsersLabel]="copy().activeUsers"
              [topModifiedTableLabel]="copy().topModifiedTable"
            ></billflow-audit-summary-cards>
          } @placeholder {
            <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

          <!-- Table Card with Filters in toolbar -->
          @defer (on idle) {
            <billflow-audit-table
              [entries]="entries"
              [loading]="loading"
              [locale]="locale"
              [page]="page"
              [total]="totalCount"
              [pageSize]="pageSize"
              (onRowClick)="openDetail($event)"
              (onPrevPage)="previousPage()"
              (onNextPage)="nextPage()"
              (onPageClick)="goToPage($event)"
              (onPageSizeChange)="onPageSizeCombo($event)"
            >
              <ng-container toolbar-left>
                <billflow-audit-filter-bar
                  [tableOptions]="tableOptions"
                  [actionOptions]="auditActionOptions"
                  [allTablesLabel]="copy().allTables"
                  [allActionsLabel]="copy().allActions"
                  [filterTablePlaceholder]="copy().filterTablePlaceholder"
                  [filterActionPlaceholder]="copy().filterActionPlaceholder"
                  [fromLabel]="copy().fromLabel"
                  [toLabel]="copy().toLabel"
                  (filtersChange)="onFiltersChange($event)"
                  (onRefresh)="void reloadAudit()"
                ></billflow-audit-filter-bar>
              </ng-container>
            </billflow-audit-table>
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

        <!-- Detail Modal -->
        @defer (on interaction) {
          @if (selectedEntry()) {
            <billflow-audit-detail-modal
              [entry]="selectedEntry()"
              [locale]="locale()"
              (onClose)="selectedEntry.set(null)"
            ></billflow-audit-detail-modal>
          }
        } @placeholder {
          <!-- Detail modal deferred until row click -->
        }

        <!-- Mobile Nav -->
        <nav class="md:hidden app-dashboard-mobile-nav">
          @for (item of mobileNavItems(); track item.label) {
            <a class="flex flex-col items-center justify-center w-full h-full pt-1 border-t-2 transition-colors app-dashboard-mobile-link"
              [href]="item.href"
              [class.text-primary]="item.active"
              [class.border-primary]="item.active"
              [class.app-dashboard-mobile-link--active]="item.active"
              [class.border-transparent]="!item.active"
            >
              <span class="material-symbols-outlined" [style.font-variation-settings]="'FILL' + (item.active ? ' 1' : ' 0')">{{ item.icon }}</span>
              <span class="text-[10px] font-medium mt-1">{{ item.label }}</span>
            </a>
          }
        </nav>
      </div>
    </billflow-page-shell>
  `,
})
export class AuditPageComponent implements OnInit {
  private readonly api = inject(AuditApiService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);
  protected readonly session = inject(SessionService);
  private readonly permissions = inject(PermissionsService);
  @ViewChild('userMenuPanel') private userMenuPanel?: ElementRef<HTMLElement>;

  locale = this.localeService.locale;
  copy = computed(() => AUDIT_TEXT[this.locale()]);

  @Input() set initialLocale(value: AppLocale | null | undefined) {
    if (!value) return;
    this.localeService.seedLocale(value);
  }

  readonly sidebarItems = computed(() => buildBillflowSidebarItems({
    dashboard: this.copy().sidebarDashboard,
    invoices: this.copy().sidebarInvoices,
    products: this.copy().sidebarProducts,
    customers: this.copy().sidebarCustomers,
    employees: this.copy().sidebarEmployees,
    audit: this.copy().sidebarAudit,
  }, 'audit', this.permissions));

  readonly mobileNavItems = computed<BillflowSidebarItem[]>(() => {
    const items: BillflowSidebarItem[] = [
      { label: this.copy().sidebarDashboard, icon: 'dashboard', href: '/dashboard' },
      { label: this.copy().sidebarInvoices, icon: 'receipt_long', href: '/invoices' },
      { label: this.copy().sidebarAudit, icon: 'assignment', href: '/audit', active: true },
      { label: this.copy().sidebarProducts, icon: 'inventory_2', href: '/products' },
    ];
    if (this.permissions.isAdmin()) {
      items.push({ label: this.copy().sidebarEmployees, icon: 'badge', href: '/employees' });
    }
    return items;
  });

  // ── Data ──
  loading = signal(true);
  entries = signal<AuditLogEntry[]>([]);
  totalCount = signal(0);
  totalPagesFromResponse = signal(0);
  summary = signal<AuditSummary>({ actionsToday: 0, activeUsers: 0, topModifiedEntity: '—' });

  // ── Filters ──
  filters = signal<{ tableName?: string; action?: string; dateFrom?: string; dateTo?: string }>({});
  page = signal(1);
  pageSize = signal(5);

  // ── Detail modal ──
  selectedEntry = signal<AuditLogEntry | null>(null);

  // ── Combobox options ──
  readonly tableOptions: ComboboxOption[] = [
    { value: '', label: 'Todas las tablas' },
  ];

  readonly auditActionOptions: ComboboxOption[] = [
    { value: '', label: 'Todas las acciones' },
    { value: 'INSERT', label: 'INSERT' },
    { value: 'UPDATE', label: 'UPDATE' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'CANCEL', label: 'CANCEL' },
    { value: 'SOFT_DELETE', label: 'SOFT_DELETE' },
    { value: 'RESTORE', label: 'RESTORE' },
    { value: 'LOGIN', label: 'LOGIN' },
    { value: 'LOGOUT', label: 'LOGOUT' },
    { value: 'LOGIN_FAILED', label: 'LOGIN_FAILED' },
  ];

  // ── User menu ──
  userMenuVisible = signal(false);
  userMenuClosing = signal(false);
  userMenuOpen = signal(false);
  private userMenuCloseTimeout: number | undefined;

  // ── SSR initial data ──
  private hasInitialData = false;

  @Input() set initialData(value: AuditInitialData | null | undefined) {
    if (!value) return;
    this.hasInitialData = true;
    this.entries.set(value.entries);
    this.summary.set(value.summary);
    this.totalCount.set(value.total);
    this.page.set(value.page);
    this.pageSize.set(value.pageSize);
    this.totalPagesFromResponse.set(value.totalPages);
    this.loading.set(false);
  }

  // ── Computed pagination ──
  readonly totalPages = computed(() => {
    const fromApi = this.totalPagesFromResponse();
    if (fromApi > 0) return fromApi;
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize()));
  });

  // ── Lifecycle ──
  async ngOnInit() {
    if (typeof window === 'undefined') return;

    this.session.init();

    // Admin-only page
    if (!this.permissions.isAdmin()) {
      window.location.replace('/403');
      return;
    }

    if (typeof window !== 'undefined') document.documentElement.lang = this.locale();

    if (this.hasInitialData) return;

    await Promise.all([
      this.reloadAudit(),
      this.reloadSummary(),
    ]);
  }

  // ── Data loading ──
  async reloadAudit() {
    this.loading.set(true);
    try {
      const f = this.filters();
      const result = await this.api.list({
        page: this.page(),
        limit: this.pageSize(),
        tableName: f.tableName,
        action: f.action,
        dateFrom: f.dateFrom,
        dateTo: f.dateTo,
      });
      this.entries.set(result.data || []);
      this.totalCount.set(result.total || 0);
      this.totalPagesFromResponse.set(result.totalPages);
    } catch (err) {
      console.error('[audit] load error:', err);
      await this.feedback.alert('error',
        this.copy().errorLoading,
        this.locale() === 'es' ? 'Revise la conexión con el backend.' : 'Please check the backend connection.');
    } finally {
      this.loading.set(false);
    }
  }

  async reloadSummary() {
    try {
      const s = await this.api.getSummary();
      this.summary.set(s);
    } catch (err) {
      console.error('[audit] summary load error:', err);
    }
  }

  // ── Filters ──
  onFiltersChange(f: { tableName?: string; action?: string; dateFrom?: string; dateTo?: string }) {
    this.filters.set(f);
    this.page.set(1);
    void this.reloadAudit();
  }

  // ── Pagination ──
  nextPage() {
    if (this.page() < this.totalPages()) { this.page.update((v) => v + 1); void this.reloadAudit(); }
  }
  previousPage() {
    if (this.page() > 1) { this.page.update((v) => v - 1); void this.reloadAudit(); }
  }
  goToPage(pageNumber: number) {
    this.page.set(pageNumber);
    void this.reloadAudit();
  }
  onPageSizeCombo(value: number) {
    if (!Number.isFinite(value) || value < 5) return;
    this.pageSize.set(value);
    this.page.set(1);
    void this.reloadAudit();
  }

  // ── Detail modal ──
  openDetail(entry: AuditLogEntry) {
    this.selectedEntry.set(entry);
  }

  // ── User menu ──
  toggleLocale() {
    this.localeService.toggle();
  }

  openNotifications() {
    void this.feedback.toast('info', this.copy().notifications,
      this.locale() === 'es' ? 'Tenés movimientos nuevos en el registro de auditoría.' : 'You have new audit log entries.');
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
}
