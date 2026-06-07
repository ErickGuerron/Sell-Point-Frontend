import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, ChangeDetectionStrategy, Input, ViewChild, type ElementRef } from '@angular/core';
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
import { DashboardParticlesBackgroundComponent } from '../dashboard/dashboard-particles-background.component';
import { BillflowMobileSidebarComponent } from '../../shared/components/billflow-mobile-sidebar.component';
import { BillflowNotificationButtonComponent } from '../../shared/components/billflow-notification-button.component';
import { BillflowUserMenuComponent } from '../../shared/components/billflow-user-menu.component';
import { BillflowComboboxComponent, type ComboboxOption } from '../../shared/components/billflow-combobox.component';
import { BillflowDateRangePickerComponent } from '../../shared/components/billflow-date-range-picker.component';
import { ProductKpiCardsComponent } from './components/product-kpi-cards.component';
import { ProductTableComponent } from './components/product-table.component';
import { ProductFormModalComponent } from './components/product-form-modal.component';
import { ProductMovementsModalComponent } from './components/product-movements-modal.component';
import { HasPermissionDirective, IsAdminDirective } from '../../shared/directives/has-permission.directive';
import { GetProductsUseCase } from './domain/use-cases/get-products.use-case';
import { GetProductByIdUseCase } from './domain/use-cases/get-product-by-id.use-case';
import { CreateProductUseCase } from './domain/use-cases/create-product.use-case';
import { GetNextProductCodeUseCase } from './domain/use-cases/get-next-product-code.use-case';
import { UpdateProductUseCase } from './domain/use-cases/update-product.use-case';
import { ToggleProductActiveUseCase } from './domain/use-cases/toggle-product-active.use-case';
import { GetProductMovementsUseCase } from './domain/use-cases/get-product-movements.use-case';
import { AdjustStockUseCase } from './domain/use-cases/adjust-stock.use-case';
import type { ProductEntity, ProductMovementEntity, CreateProductPayload, UpdateProductPayload, StockAdjustmentPayload, ProductFilters } from './domain/product.entity';
import { ProductRepository } from './domain/product.repository';
import { ProductRemoteDataSource } from './data/product-remote-datasource';
import { ProductImplRepository } from './data/product-impl.repository';
import type { CategoryRawDto } from './data/product-remote-datasource';
import { PRODUCTS_TEXT } from './i18n/products.translations';
import type { ProductsCopy } from './i18n/products.translations';
import type { ProductsInitialData } from '../../shared/ssr-page-data';

@Component({
  selector: 'billflow-products-page',
  standalone: true,
  imports: [
    CommonModule,
    BillflowPageShellComponent,
    DashboardParticlesBackgroundComponent,
    BillflowMobileSidebarComponent,
    BillflowNotificationButtonComponent,
    BillflowUserMenuComponent,
    BillflowComboboxComponent,
    BillflowDateRangePickerComponent,
    ProductKpiCardsComponent,
    ProductTableComponent,
    ProductFormModalComponent,
    ProductMovementsModalComponent,
    HasPermissionDirective,
    IsAdminDirective,
  ],
  providers: [
    ProductRemoteDataSource,
    ProductImplRepository,
    { provide: ProductRepository, useClass: ProductImplRepository },
    GetProductsUseCase,
    GetProductByIdUseCase,
    CreateProductUseCase,
    GetNextProductCodeUseCase,
    UpdateProductUseCase,
    ToggleProductActiveUseCase,
    GetProductMovementsUseCase,
    AdjustStockUseCase,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <billflow-page-shell [items]="sidebarItems()" [locale]="locale()" (settings)="session.openUserSettings()" (logout)="session.logout()">
      <billflow-dashboard-particles-background class="app-invoice-bg"></billflow-dashboard-particles-background>

      <div class="flex-1 min-w-0 app-invoices-shell app-dashboard-main">
        <header class="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div class="py-3 px-5 md:px-6 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 shrink-0">
              <span class="hidden md:inline-flex lg:hidden">
                <billflow-mobile-sidebar [items]="sidebarItems()" [actionLabel]="copy().newProduct" actionIcon="add" (actionClick)="openCreateModal()"></billflow-mobile-sidebar>
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
          @defer (on timer(200ms)) {
            <section class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 class="font-h1 text-h1 tracking-tight text-on-background">{{ copy().title }}</h1>
                <p class="mt-2 text-body-md text-on-surface-variant">{{ copy().description }}</p>
              </div>
              <div class="flex items-center gap-2 text-sm text-on-surface-variant">
                <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ totalProducts() }} {{ copy().resultsLabel }}</span>
                <span class="rounded-full border border-outline-variant/60 px-3 py-1">{{ copy().themeLabel }}: {{ themeService.currentThemeLabel(locale()) }}</span>
              </div>
            </section>

            <billflow-product-kpi-cards
              [totalProducts]="totalProductsCount()"
              [activeCount]="activeCount()"
              [lowStockCount]="lowStockCount()"
              [locale]="locale()"
            />
          } @placeholder {
            <section class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div class="h-8 w-48 rounded bg-surface-container-high animate-pulse"></div>
                <div class="h-4 w-64 rounded bg-surface-container-high mt-2 animate-pulse"></div>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-7 w-24 rounded-full bg-surface-container-high animate-pulse"></div>
                <div class="h-7 w-24 rounded-full bg-surface-container-high animate-pulse"></div>
              </div>
            </section>
            <section class="grid grid-cols-3 gap-4 mb-6">
              @for (i of [1,2,3]; track i) {
                <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 animate-pulse">
                  <div class="flex items-center gap-4">
                    <div class="h-10 w-10 rounded-xl bg-surface-container-high shrink-0"></div>
                    <div class="flex-1 space-y-2">
                      <div class="h-3 w-20 rounded bg-surface-container-high"></div>
                      <div class="h-6 w-12 rounded bg-surface-container-high"></div>
                    </div>
                  </div>
                </div>
              }
            </section>
          }
        </main>

        @defer (on idle) {
          <section class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden">
            <!-- Header: actions + filters + search en una sola fila (como imagen) -->
            <div class="dashboard-table-card__head p-6 md:p-7 border-b border-outline-variant/20">
              <div class="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  [title]="copy().reloadLabel"
                  class="inline-flex items-center justify-center h-10 w-10 bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-on-surface hover:border-primary hover:text-primary transition-all shadow-sm"
                  (click)="void reloadProducts()"
                >
                  <span
                    class="material-symbols-outlined text-[20px] transition-transform"
                    [style.animation]="loading() ? 'spin 0.7s linear infinite' : 'none'"
                  >refresh</span>
                </button>

                <a
                  href="/categories"
                  class="inline-flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-4 py-2 text-sm font-semibold text-on-surface hover:border-primary hover:text-primary transition-all shadow-sm whitespace-nowrap"
                >
                  <span class="material-symbols-outlined text-[18px]">category</span>
                  <span class="hidden sm:inline">{{ copy().categoriesLabel }}</span>
                </a>

                <button
                  *appIsAdmin
                  type="button"
                  class="inline-flex items-center gap-2 bg-primary text-on-primary rounded-lg px-4 py-2 text-sm font-bold hover:opacity-90 transition-all shadow-sm whitespace-nowrap"
                  (click)="openCreateModal()"
                >
                  <span class="material-symbols-outlined text-[18px]">add</span>
                  {{ copy().newProduct }}
                </button>

                <div class="w-px h-7 bg-outline-variant/30 mx-1"></div>

                <billflow-combobox
                  [options]="statusFilterOptions()"
                  [value]="statusFilter()"
                  placeholder="{{ copy().allStatuses }}"
                  searchPlaceholder="{{ copy().searchStatusPlaceholder }}"
                  emptyLabel="{{ copy().noResultsText }}"
                  [compact]="true"
                  (valueChange)="setStatusFilter($event)"
                ></billflow-combobox>

                <billflow-combobox
                  [options]="categoryFilterOptions()"
                  [value]="categoryFilter()"
                  placeholder="{{ copy().allCategories }}"
                  searchPlaceholder="{{ copy().searchCategoryPlaceholder }}"
                  emptyLabel="{{ copy().noResultsText }}"
                  [compact]="true"
                  (valueChange)="setCategoryFilter($event)"
                ></billflow-combobox>

                <!-- Search Group: Joined Combobox + Input (empujado a la derecha, ancho fijo sin flex) -->
                <div class="flex items-stretch w-80 ml-auto">
                  <billflow-combobox
                    [options]="searchFieldOptions()"
                    [value]="searchField()"
                    placeholder="{{ copy().allLabel }}"
                    searchPlaceholder="{{ copy().searchFieldPlaceholder }}"
                    emptyLabel="{{ copy().noResultsText }}"
                    [compact]="true"
                    (valueChange)="searchField.set($event)"
                    class="rounded-r-none"
                  ></billflow-combobox>
                  <div class="relative flex-1">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none text-[18px]">search</span>
                    <input
                      #productSearchInput
                      class="w-full min-w-0 pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/60 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm h-full rounded-none rounded-r-lg"
                      [placeholder]="searchField() === 'code' ? copy().searchByCodePlaceholder : searchField() === 'name' ? copy().searchByNamePlaceholder : copy().searchPlaceholder"
                      [value]="searchQuery()"
                      (input)="setSearchQuery(($any($event.target).value))"
                    />
                  </div>
                </div>

                <billflow-date-range-picker
                  [fromDate]="createdFrom()"
                  [toDate]="createdTo()"
                  [fromLabel]="copy().fromLabel || 'Desde'"
                  [toLabel]="copy().toLabel || 'Hasta'"
                  (fromDateChange)="createdFrom.set($event); page.set(1); void reloadProducts()"
                  (toDateChange)="createdTo.set($event); page.set(1); void reloadProducts()"
                ></billflow-date-range-picker>
              </div>
            </div>

            <billflow-product-table
              [products]="visibleProducts()"
              [loading]="loading()"
              [locale]="locale()"
              [copy]="copy()"
              [isAdmin]="permissions.isAdmin()"
              (edit)="openEditModal($event)"
              (toggleActive)="toggleActive($event)"
              (viewMovements)="openMovementsModal($event)"
            />

            <!-- Pagination Footer -->
            <div class="flex flex-col gap-4 border-t border-outline-variant/40 bg-surface/60 p-5 md:flex-row md:items-center md:justify-between dark:bg-slate-900/60">
              <div class="flex items-center gap-3 text-sm text-on-surface-variant">
                <span>
                  {{ copy().showingText }} <span class="font-semibold text-on-surface">{{ visibleRangeStart() }}</span> {{ copy().rangeFrom }} <span class="font-semibold text-on-surface">{{ visibleRangeEnd() }}</span> {{ copy().rangeOf }} <span class="font-semibold text-on-surface">{{ totalProductsCount() }}</span> {{ copy().entriesText }}
                </span>
                <select
                  class="bg-surface border border-outline-variant rounded-lg px-2 py-1 text-xs font-medium text-on-surface cursor-pointer focus:outline-none focus:border-primary"
                  [value]="pageSize()"
                  (change)="onPageSizeChange($event)"
                >
                  <option [value]="5">5</option>
                  <option [value]="10">10</option>
                  <option [value]="20">20</option>
                  <option [value]="50">50</option>
                  <option [value]="100">100</option>
                </select>
              </div>

              <div class="flex items-center gap-2">
                <div class="flex items-center gap-1 mr-2">
                  <label class="text-xs text-on-surface-variant hidden sm:inline">{{ copy().goToLabel }}</label>
                  <input
                    type="number"
                    min="1"
                    [max]="totalPages()"
                    class="w-14 h-9 rounded-lg border border-outline-variant/60 bg-surface text-sm text-center text-on-surface focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    [value]="page()"
                    (keyup.enter)="goToPageFromInput($event)"
                  />
                </div>

                <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30" [disabled]="page() === 1" (click)="previousPage()">
                  <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                <button *ngFor="let pageNumber of visiblePages(); trackBy: trackByPage" type="button" class="h-9 w-9 rounded-lg text-sm font-semibold transition" [ngClass]="pageNumber === page() ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'" (click)="goToPage(pageNumber)">
                  {{ pageNumber }}
                </button>

                <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30" [disabled]="page() === totalPages()" (click)="nextPage()">
                  <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </section>
        } @placeholder {
          <div class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden animate-pulse">
            <div class="p-3 md:p-3 flex items-center gap-1.5 border-b border-outline-variant/30">
              <div class="h-9 w-9 rounded-lg bg-surface-container-high"></div>
              <div class="h-9 w-32 rounded-lg bg-surface-container-high"></div>
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

        @defer (on interaction) {
          <billflow-product-form-modal
            [open]="productModalOpen()"
            [editingProduct]="editingProduct()"
            [categories]="categories()"
            [locale]="locale()"
            [copy]="copy()"
            [initialCode]="nextProductCode()"
            [saving]="productSaving()"
            (save)="handleProductSave($event)"
            (close)="closeProductModal()"
          />

          <billflow-product-movements-modal
            [open]="movementsModalOpen()"
            [product]="selectedProductForMovements()"
            [locale]="locale()"
            [copy]="copy()"
            [movements]="movements()"
            [mvtLoading]="mvtLoading()"
            [mvtPage]="mvtPage()"
            [mvtTotalPages]="mvtTotalPages()"
            [mvtTotalCount]="mvtTotalCount()"
            [mvtPageSize]="mvtPageSize()"
            [mvtFormSubmitting]="mvtFormSubmitting()"
            [resetFormTrigger]="resetFormTrigger()"
            (adjustStock)="handleAdjustStock($event)"
            (prevPage)="mvtPrevPage()"
            (nextPage)="mvtNextPage()"
            (close)="closeMovementsModal()"
          />
        } @placeholder {
          <!-- Product modals deferred until user interaction -->
        }

        <nav class="md:hidden app-dashboard-mobile-nav">
          <a *ngFor="let item of mobileNavItems(); trackBy: trackByHref" class="flex flex-col items-center justify-center w-full h-full pt-1 border-t-2 transition-colors app-dashboard-mobile-link" [href]="item.href" [ngClass]="item.active ? 'text-primary border-primary app-dashboard-mobile-link--active' : 'border-transparent'">
            <span class="material-symbols-outlined" [style.font-variation-settings]="themeService.iconVariationSettings(item.active)">{{ item.icon }}</span>
            <span class="text-[10px] font-medium mt-1">{{ item.label }}</span>
          </a>

          <div class="app-dashboard-mobile-fab-wrap">
            <button type="button" class="w-14 h-14 bg-[#6862f3] text-white rounded-full shadow-lg shadow-[#6862f3]/30 flex items-center justify-center hover:bg-[#514be6] active:scale-95 transition-all border-[3px] border-surface" (click)="openCreateModal()">
              <span class="material-symbols-outlined text-[24px]">add</span>
            </button>
          </div>
        </nav>
      </div>
    </billflow-page-shell>
  `,
})
export class ProductsPageComponent implements OnInit, OnDestroy {
  private readonly getProductsUseCase = inject(GetProductsUseCase);
  private readonly getProductByIdUseCase = inject(GetProductByIdUseCase);
  private readonly createProductUseCase = inject(CreateProductUseCase);
  private readonly getNextProductCodeUseCase = inject(GetNextProductCodeUseCase);
  private readonly updateProductUseCase = inject(UpdateProductUseCase);
  private readonly toggleProductActiveUseCase = inject(ToggleProductActiveUseCase);
  private readonly getProductMovementsUseCase = inject(GetProductMovementsUseCase);
  private readonly adjustStockUseCase = inject(AdjustStockUseCase);
  private readonly dataSource = inject(ProductRemoteDataSource);
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);
  protected readonly session = inject(SessionService);
  protected readonly themeService = inject(ThemeService);
  private readonly permissions = inject(PermissionsService);
  private readonly keyboardShortcuts = inject(KeyboardShortcutService);

  locale = this.localeService.locale;
  copy = computed(() => PRODUCTS_TEXT[this.locale()]);

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
    categories: this.copy().sidebarCategories,
  }, 'products', this.permissions));

  readonly mobileNavItems = computed<BillflowSidebarItem[]>(() => {
    const items: BillflowSidebarItem[] = [
      { label: this.copy().sidebarDashboard, icon: 'dashboard', href: '/dashboard' },
      { label: this.copy().sidebarInvoices, icon: 'receipt_long', href: '/invoices' },
      { label: this.copy().sidebarCustomers, icon: 'groups', href: '/customers' },
      { label: this.copy().sidebarProducts, icon: 'inventory_2', href: '/products', active: true },
    ];

    // Only ADMIN sees employees in mobile nav
    if (this.permissions.isAdmin()) {
      items.push({ label: this.copy().sidebarEmployees, icon: 'badge', href: '/employees' });
    }
    return items;
  });

  // ─── State signals ──────────────────────────────────────────────────────────
  loading = signal(false);
  products = signal<ProductEntity[]>([]);
  categories = signal<CategoryRawDto[]>([]);

  // Filters
  searchQuery = signal('');
  @ViewChild('productSearchInput') private searchInputRef?: ElementRef<HTMLInputElement>;
  searchField = signal<'all' | 'code' | 'name'>('all');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  categoryFilter = signal<string>('all');
  createdFrom = signal<string | null>(null);
  createdTo = signal<string | null>(null);

  readonly statusFilterOptions = computed<ComboboxOption[]>(() => [
    { value: 'all', label: this.copy().allStatuses },
    { value: 'active', label: this.copy().active },
    { value: 'inactive', label: this.copy().inactive },
  ]);

  readonly searchFieldOptions = computed<ComboboxOption[]>(() => [
    { value: 'all', label: this.copy().allLabel },
    { value: 'code', label: this.copy().code },
    { value: 'name', label: this.copy().name },
  ]);

  readonly pageSizeOptions: ComboboxOption[] = [
    { value: '5', label: '5' },
    { value: '10', label: '10' },
    { value: '20', label: '20' },
    { value: '50', label: '50' },
    { value: '100', label: '100' },
  ];

  readonly categoryFilterOptions = computed<ComboboxOption[]>(() => [
    { value: 'all', label: this.copy().allCategories },
    ...this.categories().map((c) => ({ value: c.id, label: c.name })),
  ]);

  // Pagination
  page = signal(1);
  pageSize = signal(5);
  totalProductsCount = signal(0);

  // TODO(backend): fetch these from a /products/aggregates endpoint
  activeCount = signal(0);
  lowStockCount = signal(0);

  readonly totalProducts = computed(() => this.totalProductsCount());
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalProductsCount() / this.pageSize())));

  readonly visibleProducts = computed(() => {
    const products = this.products();
    if (products.length <= this.pageSize()) return products;

    const start = (this.page() - 1) * this.pageSize();
    return products.slice(start, start + this.pageSize());
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

  // Product modal state
  productModalOpen = signal(false);
  editingProduct = signal<ProductEntity | null>(null);
  nextProductCode = signal('');
  productSaving = signal(false);

  // Movements modal state
  movementsModalOpen = signal(false);
  selectedProductForMovements = signal<ProductEntity | null>(null);
  movements = signal<ProductMovementEntity[]>([]);
  mvtLoading = signal(false);
  mvtPage = signal(1);
  mvtPageSize = signal(5);
  mvtTotalCount = signal(0);
  mvtTotalPages = computed(() => Math.max(1, Math.ceil(this.mvtTotalCount() / this.mvtPageSize())));
  mvtFormSubmitting = signal(false);
  private resetFormTrigger = signal(0);
  private hasInitialData = false;

  @Input() set initialData(value: ProductsInitialData | null | undefined) {
    if (!value) return;
    this.hasInitialData = true;
    this.products.set(value.products);
    this.categories.set(value.categories);
    this.totalProductsCount.set(value.totalProductsCount);
    this.page.set(value.page);
    this.pageSize.set(value.pageSize);
    this.activeCount.set(value.activeCount);
    this.lowStockCount.set(value.lowStockCount);
    this.loading.set(false);
  }

  // ─── Abort / debounce handles ──────────────────────────────────────────────
  private abortController: AbortController | null = null;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // ─── TrackBy ────────────────────────────────────────────────────────────────
  trackByPage(_index: number, page: number): number { return page; }
  trackByHref(_index: number, item: BillflowSidebarItem): string { return item.href; }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────
  async ngOnInit() {
    this.themeService.init();
    this.session.init();
    this.keyboardShortcuts.register(
      { keys: 'n', descriptionEn: 'New Product', descriptionEs: 'Nuevo Producto', category: 'actions', permission: PERMISSIONS.PRODUCTS_CREATE, action: () => { void this.openCreateModal(); } },
      { keys: 'r', descriptionEn: 'Refresh list', descriptionEs: 'Actualizar lista', category: 'actions', action: () => { void this.reloadProducts(); } },
      { keys: '/', descriptionEn: 'Focus search', descriptionEs: 'Buscar', category: 'actions', action: () => this.focusSearch() },
    );
    if (typeof window !== 'undefined') {
      document.documentElement.lang = this.locale();
      if (this.hasInitialData) return;
      await this.loadCategories();
      await this.reloadProducts();
      void this.reloadKpis();
    }
  }

  ngOnDestroy(): void {
    this.keyboardShortcuts.unregister('n', 'r', '/');
  }

  private focusSearch(): void {
    this.searchInputRef?.nativeElement.focus();
    this.searchInputRef?.nativeElement.select();
  }

  async loadCategories() {
    try {
      const cats = await this.dataSource.listCategories();
      this.categories.set(cats);
    } catch (err) {
      console.error('[load categories]', err);
    }
  }

  async reloadProducts() {
    this.abortController?.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.loading.set(true);
    try {
      const filters: ProductFilters = {
        query: this.searchQuery(),
        searchField: this.searchField(),
        categoryId: this.categoryFilter(),
        isActive: this.statusFilter(),
        page: this.page(),
        limit: this.pageSize(),
      };
      const res = await this.getProductsUseCase.execute(filters, signal);
      this.products.set(res.data);
      this.totalProductsCount.set(res.total);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      console.error('[reload products]', err);
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'No se pudieron cargar los productos' : 'Could not load products',
        this.locale() === 'es' ? 'Revise la conexión con el backend.' : 'Please check the backend connection.');
    } finally {
      this.loading.set(false);
    }
  }

  async reloadKpis() {
    try {
      const kpis = await this.dataSource.getKpis();
      this.totalProductsCount.set(kpis.totalProducts);
      this.activeCount.set(kpis.activeCount);
      this.lowStockCount.set(kpis.lowStockCount);
    } catch (err) {
      console.error('[products] kpis load error:', err);
    }
  }

  // ─── Search & Filters ──────────────────────────────────────────────────────
  setSearchQuery(value: string) {
    this.searchQuery.set(value);
    this.page.set(1);

    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => void this.reloadProducts(), 350);
  }

  setStatusFilter(value: string) {
    this.statusFilter.set(value as any);
    this.page.set(1);
    void this.reloadProducts();
  }

  setCategoryFilter(value: string) {
    this.categoryFilter.set(value);
    this.page.set(1);
    void this.reloadProducts();
  }

  onPageSizeChange(event: Event) {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    if (!Number.isFinite(value) || value < 5) return;
    this.pageSize.set(value);
    this.page.set(1);
    void this.reloadProducts();
  }

  onPageSizeCombo(value: string) {
    const num = parseInt(value, 10);
    if (!Number.isFinite(num) || num < 5) return;
    this.pageSize.set(num);
    this.page.set(1);
    void this.reloadProducts();
  }

  // ─── Pagination ────────────────────────────────────────────────────────────
  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update((v) => v + 1);
      void this.reloadProducts();
    }
  }

  previousPage() {
    if (this.page() > 1) {
      this.page.update((v) => v - 1);
      void this.reloadProducts();
    }
  }

  goToPage(pageNumber: number) {
    this.page.set(pageNumber);
    void this.reloadProducts();
  }

  goToPageFromInput(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (!Number.isFinite(value) || value < 1 || value > this.totalPages()) return;
    this.goToPage(value);
  }

  // ─── Theme & locale ────────────────────────────────────────────────────────
  toggleLocale() {
    this.localeService.toggle();
  }

  // ─── Product Modal ─────────────────────────────────────────────────────────
  async openCreateModal() {
    this.editingProduct.set(null);
    try {
      this.nextProductCode.set(await this.getNextProductCodeUseCase.execute());
    } catch (err) {
      console.error('[next product code]', err);
      await this.feedback.alert(
        'error',
        this.locale() === 'es' ? 'No se pudo preparar el código del producto' : 'Could not prepare product code',
        this.locale() === 'es' ? 'Intentá nuevamente.' : 'Please try again.',
      );
      return;
    }
    this.productModalOpen.set(true);
  }

  async openEditModal(product: ProductEntity) {
    this.nextProductCode.set('');
    try {
      const detailedProduct = await this.getProductByIdUseCase.execute(product.id);
      this.editingProduct.set(detailedProduct);
      this.productModalOpen.set(true);
    } catch (err) {
      console.error('[get product by id]', err);
      await this.feedback.alert(
        'error',
        this.locale() === 'es' ? 'No se pudo cargar el producto' : 'Could not load product',
        this.locale() === 'es' ? 'Intentá nuevamente.' : 'Please try again.',
      );
    }
  }

  closeProductModal() {
    this.productModalOpen.set(false);
    this.editingProduct.set(null);
    this.nextProductCode.set('');
  }

  async handleProductSave(payload: CreateProductPayload | UpdateProductPayload) {
    if (this.productSaving()) return;
    this.productSaving.set(true);
    try {
      const editing = this.editingProduct();
      if (editing) {
        await this.updateProductUseCase.execute(editing.id, payload as UpdateProductPayload);
        await this.feedback.toast('success', this.copy().updatedToast);
      } else {
        await this.createProductUseCase.execute(payload as CreateProductPayload);
        await this.feedback.toast('success', this.copy().createdToast);
      }
      this.closeProductModal();
      await this.reloadProducts();
      void this.reloadKpis();
    } catch (err: any) {
      console.error('[save product]', err);
      const errMsg = err.message || (this.locale() === 'es' ? 'Error al guardar el producto' : 'Error saving product');
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'Error al guardar el producto' : 'Error saving product',
        errMsg);
    } finally {
      this.productSaving.set(false);
    }
  }

  async toggleActive(product: ProductEntity) {
    const isActive = product.isActive;
    const confirmed = await this.feedback.confirm(
      isActive ? this.copy().confirmDeactivateTitle : this.copy().confirmActivateTitle,
      isActive ? this.copy().confirmDeactivateText : this.copy().confirmActivateText,
      this.copy().confirmBtn,
      this.copy().cancelBtn,
    );
    if (!confirmed) return;

    try {
      await this.toggleProductActiveUseCase.execute(product.id, isActive);
      const msg = isActive ? this.copy().toggledInactive : this.copy().toggledActive;
      await this.feedback.toast('success', msg);
      await this.reloadProducts();
      void this.reloadKpis();
    } catch (err) {
      console.error('[toggle active]', err);
      await this.feedback.alert('error',
        this.locale() === 'es' ? 'Error al cambiar el estado' : 'Error changing status');
    }
  }

  // ─── Stock Movements Modal ──────────────────────────────────────────────────
  openMovementsModal(product: ProductEntity) {
    this.selectedProductForMovements.set(product);
    this.movements.set([]);
    this.mvtPage.set(1);
    this.mvtTotalCount.set(0);
    this.movementsModalOpen.set(true);
    void this.loadMovements();
  }

  closeMovementsModal() {
    this.movementsModalOpen.set(false);
    this.selectedProductForMovements.set(null);
  }

  async loadMovements() {
    const product = this.selectedProductForMovements();
    if (!product) return;

    this.mvtLoading.set(true);
    try {
      const res = await this.getProductMovementsUseCase.execute(product.id, this.mvtPage(), this.mvtPageSize());
      this.movements.set(res.data);
      this.mvtTotalCount.set(res.total);
    } catch (err) {
      console.error('[load movements]', err);
    } finally {
      this.mvtLoading.set(false);
    }
  }

  mvtNextPage() {
    if (this.mvtPage() < this.mvtTotalPages()) {
      this.mvtPage.update(v => v + 1);
      void this.loadMovements();
    }
  }

  mvtPrevPage() {
    if (this.mvtPage() > 1) {
      this.mvtPage.update(v => v - 1);
      void this.loadMovements();
    }
  }

  async handleAdjustStock(payload: StockAdjustmentPayload) {
    const product = this.selectedProductForMovements();
    if (!product) return;

    this.mvtFormSubmitting.set(true);
    try {
      await this.adjustStockUseCase.execute(product.id, payload);
      await this.feedback.toast('success', this.copy().stockAdjustSuccess);

      // Reset movement form and reload
      this.resetFormTrigger.update(v => v + 1);
      this.mvtPage.set(1);
      await this.loadMovements();
      await this.reloadProducts();
      void this.reloadKpis();
    } catch (err) {
      console.error('[handleAdjustStock]', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('insufficient')) {
        await this.feedback.toast('error', this.copy().stockInsufficient);
      } else {
        await this.feedback.toast('error', this.copy().stockAdjustError);
      }
    } finally {
      this.mvtFormSubmitting.set(false);
    }
  }

  // ─── Helper methods ─────────────────────────────────────────────────────────
  visibleRangeStart() {
    if (this.products().length === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  visibleRangeEnd() {
    return Math.min(this.totalProductsCount(), this.page() * this.pageSize());
  }
}
