import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, inject, signal, ChangeDetectionStrategy, Input } from '@angular/core';
import type { OnInit } from '@angular/core';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { LocaleService } from '../../shared/services/locale.service';
import { SessionService } from '../../shared/services/session.service';
import { ThemeService } from '../../shared/services/theme.service';
import type { BillflowSidebarItem } from '../../shared/components/billflow-sidebar.component';
import { buildBillflowSidebarItems } from '../../shared/billflow-navigation';
import { BillflowPageShellComponent } from '../../shared/components/billflow-page-shell.component';
import { DashboardParticlesBackgroundComponent } from '../dashboard/dashboard-particles-background.component';
import { BillflowMobileSidebarComponent } from '../../shared/components/billflow-mobile-sidebar.component';
import { BillflowNotificationButtonComponent } from '../../shared/components/billflow-notification-button.component';
import { BillflowUserMenuComponent } from '../../shared/components/billflow-user-menu.component';
import { BillflowComboboxComponent, type ComboboxOption } from '../../shared/components/billflow-combobox.component';
import { CategoryKpiCardsComponent } from './components/category-kpi-cards.component';
import { CategoryTableComponent } from './components/category-table.component';
import { CategoryFormModalComponent } from './components/category-form-modal.component';
import { GetCategoriesUseCase } from './domain/use-cases/get-categories.use-case';
import { CreateCategoryUseCase } from './domain/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from './domain/use-cases/update-category.use-case';
import { ToggleCategoryActiveUseCase } from './domain/use-cases/toggle-category-active.use-case';
import type { CategoryEntity } from './domain/category.entity';
import { CategoryRepository } from './domain/category.repository';
import { CategoryRemoteDataSource } from './data/category-remote-datasource';
import { CategoryImplRepository } from './data/category-impl.repository';
import { CATEGORIES_TEXT } from './i18n/categories.translations';
import type { CategoriesCopy } from './i18n/categories.translations';
import type { CategoriesInitialData } from '../../shared/ssr-page-data';

@Component({
  selector: 'billflow-categories-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BillflowPageShellComponent,
    DashboardParticlesBackgroundComponent,
    BillflowMobileSidebarComponent,
    BillflowNotificationButtonComponent,
    BillflowUserMenuComponent,
    BillflowComboboxComponent,
    CategoryKpiCardsComponent,
    CategoryTableComponent,
    CategoryFormModalComponent,
  ],
  providers: [
    CategoryRemoteDataSource,
    CategoryImplRepository,
    { provide: CategoryRepository, useClass: CategoryImplRepository },
    GetCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    ToggleCategoryActiveUseCase,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <billflow-page-shell
      [items]="sidebarItems()"
      [locale]="locale()"
      (settings)="session.openUserSettings()"
      (logout)="session.logout()"
    >
      <billflow-dashboard-particles-background class="app-invoice-bg"></billflow-dashboard-particles-background>

      <div class="flex-1 min-w-0 app-invoices-shell app-dashboard-main">
        <header
          class="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-xl"
        >
          <div class="py-3 px-5 md:px-6 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 shrink-0">
              <span class="hidden md:inline-flex lg:hidden">
                <billflow-mobile-sidebar
                  [items]="sidebarItems()"
                  [actionLabel]="copy().newCategory"
                  actionIcon="add"
                  (actionClick)="openCreateModal()"
                ></billflow-mobile-sidebar>
              </span>
              <span class="material-symbols-outlined text-outline">category</span>
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
          <!-- Header -->
          <section class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 class="font-h1 text-h1 tracking-tight text-on-background">{{ copy().title }}</h1>
              <p class="mt-2 text-body-md text-on-surface-variant">{{ copy().description }}</p>
            </div>
            <div class="flex items-center gap-2 text-sm text-on-surface-variant">
              <span class="rounded-full border border-outline-variant/60 px-3 py-1"
                >{{ totalCategoriesCount() }} {{ copy().resultsLabel }}</span
              >
              <span class="rounded-full border border-outline-variant/60 px-3 py-1"
                >{{ copy().themeLabel }}: {{ themeService.currentThemeLabel(locale()) }}</span
              >
            </div>
          </section>

          <!-- KPI Cards -->
          <billflow-category-kpi-cards
            [totalLabel]="copy().totalLabel"
            [activeLabel]="copy().activeLabel"
            [total]="totalCategoriesCount()"
            [active]="activeCategoriesCount()"
          ></billflow-category-kpi-cards>

          <!-- Table Card -->
          <section class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden">
            <!-- Toolbar -->
            <div class="p-4 md:p-5 flex flex-wrap items-center gap-3 border-b border-outline-variant/20">
              <!-- Search -->
              <div class="relative flex-1 min-w-[220px] max-w-md">
                <span
                  class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline-variant pointer-events-none"
                  >search</span
                >
                <input
                  class="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                  [placeholder]="copy().searchPlaceholder"
                  [value]="searchQuery()"
                  (input)="setSearchQuery(($any($event.target).value))"
                />
              </div>

              <!-- Refresh -->
              <button
                type="button"
                [title]="locale() === 'es' ? 'Recargar' : 'Reload'"
                class="inline-flex items-center justify-center bg-surface-container-lowest border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm hover:border-primary hover:text-primary"
                (click)="void reloadCategories()"
              >
                <span
                  class="material-symbols-outlined text-[20px]"
                  [style.animation]="loading() ? 'spin 0.7s linear infinite' : 'none'"
                  >refresh</span
                >
              </button>

              <!-- Back to Products -->
              <a
                href="/products"
                class="inline-flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-4 py-2 text-sm font-semibold text-on-surface hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                <span class="material-symbols-outlined text-[18px]">arrow_back</span>
                {{ copy().goBackToProducts }}
              </a>

              <!-- New -->
              <button
                type="button"
                class="inline-flex items-center gap-2 bg-primary text-on-primary rounded-lg px-4 py-2 text-sm font-bold hover:opacity-90 transition-all shadow-sm"
                (click)="openCreateModal()"
              >
                <span class="material-symbols-outlined text-[18px]">add</span>
                {{ copy().newCategory }}
              </button>
            </div>

            <!-- Table -->
            <billflow-category-table
              [copy]="copy()"
              [categories]="categories()"
              [loading]="loading()"
              [statusActive]="locale() === 'es' ? 'ACTIVO' : 'ACTIVE'"
              [statusInactive]="locale() === 'es' ? 'INACTIVO' : 'INACTIVE'"
              (edit)="openEditModal($event)"
              (toggle)="toggleActive($event)"
            ></billflow-category-table>

            <!-- Pagination Footer -->
            <div
              class="flex flex-col gap-4 border-t border-outline-variant/40 bg-surface/60 p-5 md:flex-row md:items-center md:justify-between dark:bg-slate-900/60"
            >
              <div class="flex items-center gap-3 text-sm text-on-surface-variant">
                <span>
                  {{ copy().showingText }}
                  <span class="font-semibold text-on-surface">{{ visibleRangeStart() }}</span>
                  {{ locale() === 'es' ? 'a' : 'to' }}
                  <span class="font-semibold text-on-surface">{{ visibleRangeEnd() }}</span>
                  {{ locale() === 'es' ? 'de' : 'of' }}
                  <span class="font-semibold text-on-surface">{{ totalCategoriesCount() }}</span>
                  {{ copy().entriesText }}
                </span>
                <select
                  [value]="pageSize()"
                  (change)="onPageSizeCombo(($any($event.target).value))"
                  class="bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary/50 py-[5px] px-2 rounded-lg cursor-pointer shadow-sm transition-all"
                >
                  @for (option of pageSizeOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30"
                  [disabled]="page() === 1"
                  (click)="previousPage()"
                >
                  <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                @for (pageNumber of visiblePages(); track pageNumber) {
                  <button
                    type="button"
                    class="h-9 w-9 rounded-lg text-sm font-semibold transition"
                    [class.bg-primary]="pageNumber === page()"
                    [class.text-on-primary]="pageNumber === page()"
                    [class.shadow-sm]="pageNumber === page()"
                    [class.text-on-surface-variant]="pageNumber !== page()"
                    [class.hover:bg-surface-container-low]="pageNumber !== page()"
                    [class.hover:text-on-surface]="pageNumber !== page()"
                    (click)="goToPage(pageNumber)"
                  >
                    {{ pageNumber }}
                  </button>
                }

                <button
                  type="button"
                  class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30"
                  [disabled]="page() === totalPages()"
                  (click)="nextPage()"
                >
                  <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </section>
        </main>

        <!-- Category Form Modal -->
        @if (categoryModalOpen()) {
          <billflow-category-form-modal
            [copy]="copy()"
            [editing]="editingCategory()"
            [(name)]="formName"
            [(description)]="formDescription"
            (close)="closeCategoryModal()"
            (save)="saveCategory()"
          />
        }

        <!-- Mobile Nav -->
        <nav class="md:hidden app-dashboard-mobile-nav">
          @for (item of mobileNavItems(); track item.label) {
            <a
              class="flex flex-col items-center justify-center w-full h-full pt-1 border-t-2 transition-colors app-dashboard-mobile-link"
              [href]="item.href"
              [class.text-primary]="item.active"
              [class.border-primary]="item.active"
              [class.app-dashboard-mobile-link--active]="item.active"
              [class.border-transparent]="!item.active"
            >
              <span
                class="material-symbols-outlined"
                [style.font-variation-settings]="themeService.iconVariationSettings(item.active ?? false)"
                >{{ item.icon }}</span
              >
              <span class="text-[10px] font-medium mt-1">{{ item.label }}</span>
            </a>
          }

          <div class="app-dashboard-mobile-fab-wrap">
            <button
              type="button"
              class="w-14 h-14 bg-[#6862f3] text-white rounded-full shadow-lg shadow-[#6862f3]/30 flex items-center justify-center hover:bg-[#514be6] active:scale-95 transition-all border-[3px] border-surface"
              (click)="openCreateModal()"
            >
              <span class="material-symbols-outlined text-[24px]">add</span>
            </button>
          </div>
        </nav>
      </div>
    </billflow-page-shell>
  `,
})
export class CategoriesPageComponent implements OnInit {
  private readonly getCategories = inject(GetCategoriesUseCase);
  private readonly createCategory = inject(CreateCategoryUseCase);
  private readonly updateCategory = inject(UpdateCategoryUseCase);
  private readonly toggleCategoryActive = inject(ToggleCategoryActiveUseCase);
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);
  protected readonly session = inject(SessionService);
  protected readonly themeService = inject(ThemeService);

  locale = this.localeService.locale;
  copy = computed(() => CATEGORIES_TEXT[this.locale()]);

  readonly sidebarItems = computed(() =>
    buildBillflowSidebarItems(
      {
        dashboard: this.copy().sidebarDashboard,
        invoices: this.copy().sidebarInvoices,
        products: this.copy().sidebarProducts,
        customers: this.copy().sidebarCustomers,
        employees: this.copy().sidebarEmployees,
        categories: this.copy().sidebarCategories,
      },
      'categories',
    ),
  );

  readonly mobileNavItems = computed<BillflowSidebarItem[]>(() => [
    { label: this.copy().sidebarDashboard, icon: 'dashboard', href: '/dashboard' },
    { label: this.copy().sidebarInvoices, icon: 'receipt_long', href: '/invoices' },
    { label: this.copy().sidebarProducts, icon: 'inventory_2', href: '/products' },
    { label: this.copy().sidebarCategories, icon: 'category', href: '/categories', active: true },
  ]);

  loading = signal(false);
  categories = signal<CategoryEntity[]>([]);

  // Filters
  searchQuery = signal('');

  // Pagination
  page = signal(1);
  pageSize = signal(5);
  totalCategoriesCount = signal(0);
  // TODO(backend): fetch from /categories/aggregates endpoint
  activeCategoriesCount = signal(0);

  readonly pageSizeOptions: ComboboxOption[] = [
    { value: '5', label: '5' },
    { value: '10', label: '10' },
    { value: '20', label: '20' },
    { value: '50', label: '50' },
  ];

  // Modal state
  categoryModalOpen = signal(false);
  editingCategory = signal<CategoryEntity | null>(null);

  // Form signals
  formName = signal('');
  formDescription = signal('');
  private hasInitialData = false;

  @Input() set initialData(value: CategoriesInitialData | null | undefined) {
    if (!value) return;
    this.hasInitialData = true;
    this.categories.set(value.categories);
    this.totalCategoriesCount.set(value.totalCategoriesCount);
    this.activeCategoriesCount.set(value.activeCategoriesCount);
    this.page.set(value.page);
    this.pageSize.set(value.pageSize);
    this.loading.set(false);
  }

  // ── Computed pagination ────────────────────────────────────────────────────

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalCategoriesCount() / this.pageSize())),
  );

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async ngOnInit() {
    this.themeService.init();
    this.session.init();
    if (typeof window !== 'undefined') {
      document.documentElement.lang = this.locale();
      if (this.hasInitialData) return;
      await this.reloadCategories();
    }
  }

  async reloadCategories() {
    this.loading.set(true);
    try {
      const result = await this.getCategories.execute({
        query: this.searchQuery(),
        page: this.page(),
        limit: this.pageSize(),
      });
      this.categories.set(result.data);
      this.totalCategoriesCount.set(result.total);
    } catch (err) {
      console.error('[reload categories]', err);
      await this.feedback.alert(
        'error',
        this.locale() === 'es' ? 'No se pudieron cargar las categorías' : 'Could not load categories',
        this.locale() === 'es' ? 'Revisá la conexión con el backend.' : 'Please check the backend connection.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  // ── Search & Filters ───────────────────────────────────────────────────────

  setSearchQuery(value: string) {
    this.searchQuery.set(value);
    this.page.set(1);
    void this.reloadCategories();
  }

  onPageSizeCombo(value: string) {
    const num = parseInt(value, 10);
    if (!Number.isFinite(num) || num < 5) return;
    this.pageSize.set(num);
    this.page.set(1);
    void this.reloadCategories();
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update((v) => v + 1);
      void this.reloadCategories();
    }
  }

  previousPage() {
    if (this.page() > 1) {
      this.page.update((v) => v - 1);
      void this.reloadCategories();
    }
  }

  goToPage(pageNumber: number) {
    this.page.set(pageNumber);
    void this.reloadCategories();
  }

  // ── Theme & locale ─────────────────────────────────────────────────────────

  toggleLocale() {
    this.localeService.toggle();
  }

  // ── Category Modal ─────────────────────────────────────────────────────────

  openCreateModal() {
    this.editingCategory.set(null);
    this.resetForm();
    this.categoryModalOpen.set(true);
  }

  openEditModal(cat: CategoryEntity) {
    this.editingCategory.set(cat);
    this.formName.set(cat.name);
    this.formDescription.set(cat.description ?? '');
    this.categoryModalOpen.set(true);
  }

  closeCategoryModal() {
    this.categoryModalOpen.set(false);
    this.editingCategory.set(null);
  }

  private resetForm() {
    this.formName.set('');
    this.formDescription.set('');
  }

  async saveCategory() {
    if (!this.formName().trim()) return;

    try {
      const editing = this.editingCategory();
      if (editing) {
        await this.updateCategory.execute(editing.id, {
          name: this.formName().trim(),
          description: this.formDescription().trim() || undefined,
        });
        await this.feedback.toast('success', this.copy().updatedToast);
      } else {
        await this.createCategory.execute({
          name: this.formName().trim(),
          description: this.formDescription().trim() || undefined,
        });
        await this.feedback.toast('success', this.copy().createdToast);
      }
      this.closeCategoryModal();
      await this.reloadCategories();
    } catch (err: any) {
      console.error('[save category]', err);
      const errMsg =
        err.message ||
        (this.locale() === 'es' ? 'Error al guardar la categoría' : 'Error saving category');
      await this.feedback.alert(
        'error',
        this.locale() === 'es' ? 'Error al guardar la categoría' : 'Error saving category',
        errMsg,
      );
    }
  }

  // ── Toggle Active ──────────────────────────────────────────────────────────

  async toggleActive(cat: CategoryEntity) {
    const isActive = cat.isActive;
    const confirmed = await this.feedback.confirm(
      isActive ? this.copy().confirmDeactivateTitle : this.copy().confirmActivateTitle,
      isActive ? this.copy().confirmDeactivateText : this.copy().confirmActivateText,
      this.copy().confirmBtn,
      this.copy().cancelBtn,
    );
    if (!confirmed) return;

    try {
      await this.toggleCategoryActive.execute(cat.id, isActive);
      const msg = isActive ? this.copy().toggledInactive : this.copy().toggledActive;
      await this.feedback.toast('success', msg);
      await this.reloadCategories();
    } catch (err) {
      console.error('[toggle active]', err);
      await this.feedback.alert(
        'error',
        this.locale() === 'es' ? 'Error al cambiar el estado' : 'Error changing status',
      );
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  visibleRangeStart() {
    if (this.categories().length === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  visibleRangeEnd() {
    return Math.min(this.totalCategoriesCount(), this.page() * this.pageSize());
  }
}
