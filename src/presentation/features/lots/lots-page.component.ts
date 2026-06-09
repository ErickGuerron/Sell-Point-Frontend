import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, type OnInit } from '@angular/core';
import { LocaleService, type AppLocale } from '../../shared/services/locale.service';
import { SessionService } from '../../shared/services/session.service';
import { ThemeService } from '../../shared/services/theme.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import type { BillflowSidebarItem } from '../../shared/components/billflow-sidebar.component';
import { buildBillflowSidebarItems } from '../../shared/billflow-navigation';
import { BillflowPageShellComponent } from '../../shared/components/billflow-page-shell.component';
import { DashboardParticlesBackgroundComponent } from '../dashboard/dashboard-particles-background.component';
import { BillflowMobileSidebarComponent } from '../../shared/components/billflow-mobile-sidebar.component';
import { BillflowNotificationButtonComponent } from '../../shared/components/billflow-notification-button.component';
import { BillflowUserMenuComponent } from '../../shared/components/billflow-user-menu.component';
import { ProductRemoteDataSource, type ProductRawDto } from '../products/data/product-remote-datasource';
import { LotsRemoteDataSource, type LotRawDto } from './data/lots-remote-datasource';
import { LOTS_TEXT } from './i18n/lots.translations';
import type { LotsCopy } from './i18n/lots.translations';

interface LotViewModel extends LotRawDto {
  status: 'active' | 'depleted' | 'expired';
}

@Component({
  selector: 'billflow-lots-page',
  standalone: true,
  imports: [
    CommonModule,
    BillflowPageShellComponent,
    DashboardParticlesBackgroundComponent,
    BillflowMobileSidebarComponent,
    BillflowNotificationButtonComponent,
    BillflowUserMenuComponent,
  ],
  providers: [ProductRemoteDataSource, LotsRemoteDataSource],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <billflow-page-shell [items]="sidebarItems()" [locale]="locale()" (settings)="session.openUserSettings()" (logout)="session.logout()">
      <billflow-dashboard-particles-background class="app-invoice-bg"></billflow-dashboard-particles-background>

      <div class="flex-1 min-w-0 app-invoices-shell app-dashboard-main">
        <header class="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div class="py-3 px-5 md:px-6 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 shrink-0">
              <span class="hidden md:inline-flex lg:hidden">
                <billflow-mobile-sidebar
                  [items]="sidebarItems()"
                  [actionLabel]="copy().backToProducts"
                  actionIcon="arrow_back"
                  (actionClick)="backToProducts()"
                ></billflow-mobile-sidebar>
              </span>
              <span class="material-symbols-outlined text-outline">inventory_2</span>
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
              <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ filteredLots().length }} {{ copy().resultsLabel }}</span>
              <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ copy().themeLabel }}: {{ themeService.currentThemeLabel(locale()) }}</span>
            </div>
          </section>

          @if (errorMessage()) {
            <section class="rounded-2xl border border-outline-variant/40 bg-surface/80 p-6 text-center shadow-sm">
              <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-error/10 text-error">
                <span class="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <h2 class="text-lg font-semibold text-on-background">{{ copy().errorTitle }}</h2>
              <p class="mt-1 text-sm text-on-surface-variant">{{ errorMessage() }}</p>
              <div class="mt-5 flex justify-center gap-3">
                <a href="/products" class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90">{{ copy().backToProducts }}</a>
              </div>
            </section>
          } @else {
            @defer (on timer(200ms)) {
              <section class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl">
                  <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ copy().lotsCountLabel }}</p>
                  <h3 class="text-2xl font-bold text-on-background mt-1">{{ lots().length }}</h3>
                </div>
                <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl">
                  <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ copy().availableUnitsLabel }}</p>
                  <h3 class="text-2xl font-bold text-on-background mt-1">{{ totalAvailableUnits() }}</h3>
                </div>
                <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl">
                  <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ copy().receivedUnitsLabel }}</p>
                  <h3 class="text-2xl font-bold text-on-background mt-1">{{ totalReceivedUnits() }}</h3>
                </div>
                <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl">
                  <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ copy().expiredLotsLabel }}</p>
                  <h3 class="text-2xl font-bold text-on-background mt-1">{{ expiredLotsCount() }}</h3>
                </div>
              </section>
            } @placeholder {
              <section class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                @for (i of [1,2,3,4]; track i) {
                  <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl animate-pulse">
                    <div class="h-3 w-20 rounded bg-surface-container-high mb-2"></div>
                    <div class="h-8 w-12 rounded bg-surface-container-high"></div>
                  </div>
                }
              </section>
            }

            @if (product()) {
              <section class="mb-4 rounded-2xl border border-outline-variant/40 bg-surface/80 p-5 shadow-sm">
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.16em] text-outline">{{ locale() === 'es' ? 'Producto seleccionado' : 'Selected product' }}</p>
                    <h2 class="mt-1 text-xl font-bold text-on-background">{{ product()?.name }}</h2>
                    <p class="mt-1 text-sm text-on-surface-variant">{{ product()?.code }} · {{ product()?.categoryName }}</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 text-sm">
                    <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ locale() === 'es' ? 'Stock total' : 'Total stock' }}: {{ product()?.currentStock }}</span>
                    <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ locale() === 'es' ? 'Precio venta' : 'Sale price' }}: {{ formatMoney(product()?.salePrice ?? 0) }}</span>
                    <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ locale() === 'es' ? 'Precio costo' : 'Cost price' }}: {{ formatMoney(product()?.costPrice ?? 0) }}</span>
                  </div>
                </div>
              </section>
            }

            @defer (on idle) {
              <section class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden">
                <div class="dashboard-table-card__head p-6 md:p-7 border-b border-outline-variant/20">
                  <div class="flex flex-wrap items-center gap-3">
                    <button type="button" [title]="copy().reloadLabel" class="inline-flex items-center justify-center h-10 w-10 bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-on-surface hover:border-primary hover:text-primary transition-all shadow-sm" (click)="void reloadLots()">
                      <span class="material-symbols-outlined text-[20px] transition-transform" [style.animation]="loading() ? 'spin 0.7s linear infinite' : 'none'">refresh</span>
                    </button>

                    <a href="/products" class="inline-flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-4 py-2 text-sm font-semibold text-on-surface hover:border-primary hover:text-primary transition-all shadow-sm whitespace-nowrap">
                      <span class="material-symbols-outlined text-[18px]">arrow_back</span>
                      {{ copy().backToProducts }}
                    </a>

                    <div class="flex items-center gap-2 ml-auto w-full md:w-auto md:ml-auto md:flex-1 md:justify-end">
                      <div class="relative w-full md:w-80">
                        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline-variant pointer-events-none">search</span>
                        <input class="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/60 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm rounded-lg" [placeholder]="copy().searchByCodePlaceholder" [value]="searchQuery()" (input)="setSearchQuery(($any($event.target).value))" />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="px-0">
                  <div class="overflow-x-auto">
                    <table class="min-w-max w-full border-collapse text-left">
                      <thead>
                        <tr class="dashboard-table-card__head-row font-label-bold text-[11px] uppercase tracking-[0.1em]">
                          <th class="dashboard-table-card__th p-4 pl-7 font-semibold">{{ copy().lotCode }}</th>
                          <th class="dashboard-table-card__th p-4 font-semibold text-right">{{ copy().receivedQty }}</th>
                          <th class="dashboard-table-card__th p-4 font-semibold text-right">{{ copy().availableQty }}</th>
                          <th class="dashboard-table-card__th p-4 font-semibold text-right">{{ copy().unitCost }}</th>
                          <th class="dashboard-table-card__th p-4 font-semibold text-right">{{ copy().profit }}</th>
                          <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().receivedAt }}</th>
                          <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().expiresAt }}</th>
                          <th class="dashboard-table-card__th p-4 pr-7 font-semibold">{{ copy().status }}</th>
                        </tr>
                      </thead>
                      <tbody class="font-body-sm text-body-sm">
                        @if (loading()) {
                          <tr>
                            <td colspan="8" class="p-8 text-center text-on-surface-variant">
                              <span class="material-symbols-outlined text-[24px] animate-spin">refresh</span>
                            </td>
                          </tr>
                        } @else {
                          @for (lot of visibleLots(); track lot.id) {
                            <tr class="dashboard-table-card__row group border-b border-outline-variant/20 hover:bg-surface-container-low/40 transition-colors duration-200">
                              <td class="p-4 pl-7 font-mono font-bold text-primary">
                                <div class="flex items-center gap-2">
                                  <span class="material-symbols-outlined text-[16px] text-outline-variant">inventory_2</span>
                                  {{ lot.lotCode }}
                                </div>
                              </td>
                              <td class="p-4 text-right font-medium text-on-surface">{{ lot.quantityReceived }}</td>
                              <td class="p-4 text-right font-semibold" [ngClass]="lot.quantityAvailable <= 0 ? 'text-error' : 'text-tertiary'">{{ lot.quantityAvailable }}</td>
                              <td class="p-4 text-right font-medium text-on-surface">{{ formatMoney(lot.unitCost) }}</td>
                              <td class="p-4 text-right font-medium text-on-surface">{{ formatMoney(lot.estimatedUnitProfit) }}</td>
                              <td class="p-4 text-on-surface-variant">{{ formatDate(lot.receivedAt) }}</td>
                              <td class="p-4 text-on-surface-variant">{{ lot.expiresAt ? formatDate(lot.expiresAt) : '—' }}</td>
                              <td class="p-4 pr-7">
                                <span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide" [ngClass]="statusClass(lot)">
                                  <span class="h-1.5 w-1.5 rounded-full" [ngClass]="statusDotClass(lot)"></span>
                                  {{ statusLabel(lot) | uppercase }}
                                </span>
                              </td>
                            </tr>
                          } @empty {
                            <tr>
                              <td colspan="8" class="p-10">
                                <div class="dashboard-table-card__empty dashboard-table-card__empty--stacked mt-2">
                                  <span class="material-symbols-outlined dashboard-table-card__empty-icon">inventory_2</span>
                                  <p class="dashboard-table-card__empty-title">{{ copy().emptyTitle }}</p>
                                  <p class="dashboard-table-card__empty-text">{{ copy().emptyText }}</p>
                                </div>
                              </td>
                            </tr>
                          }
                        }
                      </tbody>
                    </table>
                  </div>
                </div>

                <div class="flex flex-col gap-4 border-t border-outline-variant/40 bg-surface/60 p-5 md:flex-row md:items-center md:justify-between dark:bg-slate-900/60">
                  <div class="flex items-center gap-3 text-sm text-on-surface-variant">
                    <span>{{ copy().lotsCountLabel }} <span class="font-semibold text-on-surface">{{ visibleStart() }}</span> {{ locale() === 'es' ? 'a' : 'to' }} <span class="font-semibold text-on-surface">{{ visibleEnd() }}</span> {{ locale() === 'es' ? 'de' : 'of' }} <span class="font-semibold text-on-surface">{{ filteredLots().length }}</span> {{ copy().resultsLabel }}</span>
                    <select class="bg-surface border border-outline-variant rounded-lg px-2 py-1 text-xs font-medium text-on-surface cursor-pointer focus:outline-none focus:border-primary" [value]="pageSize()" (change)="setPageSize(($any($event.target).value))">
                      <option [value]="5">5</option>
                      <option [value]="10">10</option>
                      <option [value]="20">20</option>
                      <option [value]="50">50</option>
                    </select>
                  </div>

                  <div class="flex items-center gap-2">
                    <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30" [disabled]="page() === 1" (click)="previousPage()">
                      <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>

                    @for (pageNumber of visiblePages(); track pageNumber) {
                      <button type="button" class="h-9 w-9 rounded-lg text-sm font-semibold transition" [class.bg-primary]="pageNumber === page()" [class.text-on-primary]="pageNumber === page()" [class.shadow-sm]="pageNumber === page()" [class.text-on-surface-variant]="pageNumber !== page()" [class.hover:bg-surface-container-low]="pageNumber !== page()" [class.hover:text-on-surface]="pageNumber !== page()" (click)="goToPage(pageNumber)">{{ pageNumber }}</button>
                    }

                    <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30" [disabled]="page() === totalPages()" (click)="nextPage()">
                      <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </section>
            } @placeholder {
              <div class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden animate-pulse">
                <div class="p-6 md:p-7 border-b border-outline-variant/30">
                  <div class="flex items-center gap-3">
                    <div class="h-9 w-28 rounded-lg bg-surface-container-high"></div>
                    <div class="h-9 w-28 rounded-lg bg-surface-container-high"></div>
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
          }
        </main>

        <nav class="md:hidden app-dashboard-mobile-nav">
          <a *ngFor="let item of mobileNavItems(); trackBy: trackByHref" class="flex flex-col items-center justify-center w-full h-full pt-1 border-t-2 transition-colors app-dashboard-mobile-link" [href]="item.href" [ngClass]="item.active ? 'text-primary border-primary app-dashboard-mobile-link--active' : 'border-transparent'">
            <span class="material-symbols-outlined" [style.font-variation-settings]="themeService.iconVariationSettings(item.active)">{{ item.icon }}</span>
            <span class="text-[10px] font-medium mt-1">{{ item.label }}</span>
          </a>
        </nav>
      </div>
    </billflow-page-shell>
  `,
})
export class LotsPageComponent implements OnInit {
  private readonly localeService = inject(LocaleService);
  protected readonly session = inject(SessionService);
  protected readonly themeService = inject(ThemeService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly productDs = inject(ProductRemoteDataSource);
  private readonly lotsDs = inject(LotsRemoteDataSource);

  locale = this.localeService.locale;
  copy = computed(() => LOTS_TEXT[this.locale() === 'en' ? 'en' : 'es']);

  productId = signal('');
  product = signal<ProductRawDto | null>(null);
  lots = signal<LotViewModel[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  searchQuery = signal('');
  page = signal(1);
  pageSize = signal(10);

  readonly sidebarItems = computed(() => buildBillflowSidebarItems({
    dashboard: this.copy().sidebarDashboard,
    invoices: this.copy().sidebarInvoices,
    products: this.copy().sidebarProducts,
    customers: this.copy().sidebarCustomers,
    employees: this.copy().sidebarEmployees,
    categories: this.copy().sidebarCategories,
  }, 'products'));

  readonly filteredLots = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const items = this.lots();
    if (!query) return items;
    return items.filter((lot) =>
      lot.lotCode.toLowerCase().includes(query)
      || formatDateForSearch(lot.receivedAt).includes(query)
      || (lot.expiresAt ? formatDateForSearch(lot.expiresAt).includes(query) : false)
    );
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredLots().length / this.pageSize())));
  readonly visibleLots = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredLots().slice(start, start + this.pageSize());
  });
  readonly visibleStart = computed(() => (this.filteredLots().length === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  readonly visibleEnd = computed(() => (this.filteredLots().length === 0 ? 0 : Math.min(this.page() * this.pageSize(), this.filteredLots().length)));
  readonly totalAvailableUnits = computed(() => this.lots().reduce((sum, lot) => sum + Number(lot.quantityAvailable ?? 0), 0));
  readonly totalReceivedUnits = computed(() => this.lots().reduce((sum, lot) => sum + Number(lot.quantityReceived ?? 0), 0));
  readonly expiredLotsCount = computed(() => this.lots().filter((lot) => lot.status === 'expired').length);

  async ngOnInit() {
    if (typeof window === 'undefined') return;

    this.session.init();
    this.themeService.init();
    document.documentElement.lang = this.locale();

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('productId')?.trim() ?? '';
    if (!productId) {
      this.errorMessage.set(this.locale() === 'es' ? 'Selecciona un producto para ver sus lotes.' : 'Select a product to view its lots.');
      return;
    }

    this.productId.set(productId);
    await this.reloadLots();
  }

  toggleLocale() {
    this.localeService.toggle();
  }

  trackByHref(_index: number, item: BillflowSidebarItem): string {
    return item.href;
  }

  mobileNavItems() {
    return [
      { href: '/products', label: this.copy().backToProducts, icon: 'arrow_back', active: false },
    ];
  }

  backToProducts() {
    if (typeof window !== 'undefined') window.location.href = '/products';
  }

  async reloadLots() {
    const productId = this.productId();
    if (!productId) return;

    this.errorMessage.set('');
    this.loading.set(true);
    try {
      const [product, lots] = await Promise.all([
        this.productDs.fetchProductById(productId),
        this.lotsDs.fetchLotsByProduct(productId),
      ]);

      this.product.set(product);
      this.lots.set(lots.map((lot) => ({
        ...lot,
        status: deriveLotStatus(lot),
      })));
      this.page.set(1);
    } catch (err) {
      console.error('[lots] load error', err);
      this.errorMessage.set(this.locale() === 'es' ? 'No se pudieron cargar los lotes del producto.' : 'Could not load the product lots.');
      await this.feedback.alert('error', this.copy().errorTitle, this.copy().errorText);
    } finally {
      this.loading.set(false);
    }
  }

  setSearchQuery(value: string) {
    this.searchQuery.set(value);
    this.page.set(1);
  }

  setPageSize(value: string) {
    const next = parseInt(value, 10);
    if (!Number.isFinite(next) || next < 5) return;
    this.pageSize.set(next);
    this.page.set(1);
  }

  nextPage() {
    if (this.page() < this.totalPages()) this.page.update((v) => v + 1);
  }

  previousPage() {
    if (this.page() > 1) this.page.update((v) => v - 1);
  }

  goToPage(pageNumber: number) {
    this.page.set(pageNumber);
  }

  statusLabel(lot: LotViewModel): string {
    if (lot.status === 'expired') return this.copy().expired;
    if (lot.status === 'depleted') return this.copy().depleted;
    return this.copy().active;
  }

  statusClass(lot: LotViewModel): string {
    if (lot.status === 'expired') return 'border-error/30 bg-error/10 text-error';
    if (lot.status === 'depleted') return 'border-outline-variant/40 bg-surface-container-high text-on-surface-variant';
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500';
  }

  statusDotClass(lot: LotViewModel): string {
    if (lot.status === 'expired') return 'bg-error';
    if (lot.status === 'depleted') return 'bg-outline';
    return 'bg-emerald-500 animate-pulse';
  }

  formatMoney(value: number | string): string {
    return new Intl.NumberFormat(this.locale() === 'es' ? 'es-ES' : 'en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
  }

  formatDate(value: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(this.locale() === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }
}

function deriveLotStatus(lot: LotRawDto): LotViewModel['status'] {
  if (lot.expiresAt && new Date(lot.expiresAt).getTime() < Date.now()) return 'expired';
  if (Number(lot.quantityAvailable) <= 0) return 'depleted';
  return 'active';
}

function formatDateForSearch(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.toLowerCase();
  return date.toISOString().toLowerCase();
}
