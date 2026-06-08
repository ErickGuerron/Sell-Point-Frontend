import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InvoiceApiService, type ProductRowDto } from './invoice-api.service';
import { BillflowModalShellComponent } from '../../shared/components/billflow-modal-shell.component';
import { BillflowComboboxComponent, type ComboboxOption } from '../../shared/components/billflow-combobox.component';

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'billflow-product-selection-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, BillflowModalShellComponent, BillflowComboboxComponent],
  template: `
    <billflow-modal-shell
      *ngIf="open"
      title="{{ locale === 'es' ? 'Seleccionar Producto' : 'Select Product' }}"
      [subtitle]="productModalTotal() > 0 ? productModalTotal() + (locale === 'es' ? ' productos' : ' products') : (locale === 'es' ? 'Buscar por nombre o código...' : 'Search by name or code...')"
      icon="inventory_2"
      maxWidth="lg"
      [hasFooter]="true"
      [disableUnsavedGuard]="true"
      (close)="doClose()"
    >
      <!-- Search + filter -->
      <div class="px-6 py-3 border-b border-outline-variant/30 bg-surface/40 flex-shrink-0">
        <div class="flex items-center gap-3">
          <billflow-combobox
            [options]="productFilterOptions()"
            [value]="productFilterField()"
            [placeholder]="locale === 'es' ? 'Filtrar por...' : 'Filter by...'"
            searchPlaceholder="{{ locale === 'es' ? 'Buscar campo...' : 'Search field...' }}"
            [compact]="true"
            (valueChange)="onProductFilterFieldChange($event)"
          ></billflow-combobox>
          <div class="relative flex-1">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              id="product-modal-search"
              type="text"
              class="w-full pl-10 pr-10 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              [placeholder]="locale === 'es' ? 'Buscar por nombre o código...' : 'Search by name or code...'"
              [ngModel]="productQuery()"
              (ngModelChange)="onProductModalSearch($event)"
            />
            <button
              *ngIf="productQuery()"
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
              (click)="onProductModalSearch('')"
            >
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <table class="w-full text-left border-collapse">
        <thead class="sticky top-0 z-10">
          <tr class="bg-surface-container border-b-2 border-primary/20">
            <th class="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant w-24">{{ locale === 'es' ? 'COD_PRO' : 'Code' }}</th>
            <th class="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{{ locale === 'es' ? 'Nombre' : 'Name' }}</th>
            <th class="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right">{{ locale === 'es' ? 'Precio' : 'Price' }}</th>
            <th class="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right hidden sm:table-cell">{{ locale === 'es' ? 'Stock' : 'Stock' }}</th>
            <th class="py-3 px-4 w-10"></th>
          </tr>
        </thead>
        <tbody>
          <ng-container *ngIf="productModalLoading()">
            <tr *ngFor="let s of skeletonRows" class="border-b border-outline-variant/20 animate-pulse">
              <td class="py-3 px-4"><div class="h-3 bg-outline-variant/30 rounded w-8"></div></td>
              <td class="py-3 px-4"><div class="h-3 bg-outline-variant/30 rounded w-40"></div></td>
              <td class="py-3 px-4"><div class="h-3 bg-outline-variant/30 rounded w-16 ml-auto"></div></td>
              <td class="py-3 px-4 hidden sm:table-cell"><div class="h-3 bg-outline-variant/30 rounded w-10 ml-auto"></div></td>
              <td class="py-3 px-4"></td>
            </tr>
          </ng-container>
          <tr
            *ngFor="let p of visibleProductModalResults(); trackBy: productTrackBy"
            class="border-b border-outline-variant/20 hover:bg-primary/5 cursor-pointer transition-colors"
            (click)="selectProduct(p)"
          >
            <td class="py-3 px-4 text-xs text-outline font-mono">{{ p.code }}</td>
            <td class="py-3 px-4">
              <p class="text-sm font-semibold text-on-surface leading-tight">{{ p.name }}</p>
              <p class="text-xs text-outline mt-0.5">{{ p.code }}</p>
            </td>
            <td class="py-3 px-4 text-right text-sm font-bold text-primary">{{ formatMoney(p.unitPrice) }}</td>
            <td class="py-3 px-4 text-right hidden sm:table-cell">
              <span [class]="p.availableQuantity > 0 ? 'text-xs font-semibold text-tertiary' : 'text-xs font-semibold text-error'">{{ p.availableQuantity }}</span>
            </td>
            <td class="py-3 px-4 text-right">
              <span class="material-symbols-outlined text-outline/40 hover:text-primary transition-all text-[18px]">arrow_forward</span>
            </td>
          </tr>
          <tr *ngIf="!productModalLoading() && visibleProductModalResults().length === 0">
            <td colspan="5" class="py-16 text-center">
              <span class="material-symbols-outlined text-[44px] text-outline-variant block mb-3">inventory_2</span>
              <p class="text-sm font-medium text-on-surface-variant">{{ locale === 'es' ? 'No se encontraron productos' : 'No products found' }}</p>
              <p class="text-xs text-outline mt-1">{{ locale === 'es' ? 'Intentá con otro nombre o código, o revisá el stock' : 'Try another name or code, or check stock' }}</p>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination footer slot -->
      <div footer class="flex w-full items-center justify-between gap-3">
        <div class="flex items-center gap-3 text-sm text-on-surface-variant">
          <ng-container *ngIf="productModalTotal() > 0">
            <span>
              {{ locale === 'es' ? 'Página' : 'Page' }}
              <span class="font-semibold text-on-surface">{{ productModalPage() }}</span>
              {{ locale === 'es' ? 'de' : 'of' }}
              <span class="font-semibold text-on-surface">{{ totalProductModalPages() }}</span>
            </span>
          </ng-container>
          <ng-container *ngIf="visibleProductModalResults().length === 0 && !productModalLoading()">
            {{ locale === 'es' ? 'Sin resultados' : 'No results' }}
          </ng-container>
          <select
            class="bg-surface border border-outline-variant rounded-lg px-2 py-1 text-xs font-medium text-on-surface cursor-pointer focus:outline-none focus:border-primary"
            [value]="productModalPageSize()"
            (change)="onProductPageSizeChange($event)"
          >
            <option [value]="5">5</option>
            <option [value]="10">10</option>
            <option [value]="15">15</option>
            <option [value]="20">20</option>
            <option [value]="30">30</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30" [disabled]="productModalPage() <= 1" (click)="prevProductModalPage()"><span class="material-symbols-outlined text-[18px]">chevron_left</span></button>
          <button *ngFor="let p of productModalPageNumbers()" type="button" class="h-9 w-9 rounded-lg text-sm font-semibold transition" [ngClass]="p === productModalPage() ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'" (click)="goToProductModalPage(p)">{{ p }}</button>
          <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30" [disabled]="productModalPage() >= totalProductModalPages()" (click)="nextProductModalPage()"><span class="material-symbols-outlined text-[18px]">chevron_right</span></button>
        </div>
      </div>
    </billflow-modal-shell>
  `,
})
export class ProductSelectionModalComponent {
  private readonly api = inject(InvoiceApiService);

  private _open = false;
  @Input() set open(value: boolean) {
    this._open = value;
    if (value) this.openModal();
  }
  get open(): boolean { return this._open; }

  @Input({ required: true }) locale!: string;

  @Output() productSelected = new EventEmitter<ProductRowDto>();
  @Output() close = new EventEmitter<void>();

  productModalLoading = signal(false);
  productModalResults = signal<ProductRowDto[]>([]);
  productModalTotal = signal(0);
  productQuery = signal('');
  productModalPage = signal(1);
  productModalPageSize = signal(20);
  productFilterField = signal<'all' | 'name' | 'code' | 'description'>('all');
  readonly productFilterOptions = computed<ComboboxOption[]>(() => {
    const es = this.locale === 'es';
    return [
      { value: 'all',         label: es ? 'Todos'         : 'All' },
      { value: 'name',        label: es ? 'Nombre'        : 'Name' },
      { value: 'code',        label: es ? 'Código'        : 'Code' },
      { value: 'description', label: es ? 'Descripción'   : 'Description' },
    ];
  });
  readonly skeletonRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  private productModalSearchTimeout: number | undefined;
  private productModalRequestId = 0;

  readonly visibleProductModalResults = computed(() =>
    this.productModalResults().filter((product) => product.availableQuantity > 0)
  );

  readonly totalProductModalPages = computed(() => {
    const total = this.productModalTotal() || this.visibleProductModalResults().length;
    return Math.max(1, Math.ceil(total / this.productModalPageSize()));
  });

  readonly productModalPageNumbers = computed(() => {
    const total = this.totalProductModalPages();
    const cur = this.productModalPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [];
    const start = Math.max(1, Math.min(cur - 2, total - 4));
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  productTrackBy(_index: number, product: ProductRowDto): string {
    return product.id;
  }

  formatMoney(value: number) {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(
      Number.isFinite(Number(value)) ? Number(value) : 0
    );
  }

  onProductFilterFieldChange(value: string) {
    this.productFilterField.set(value as 'all' | 'name' | 'code' | 'description');
    this.productModalPage.set(1);
    void this.loadProductModalPage(1);
  }

  onProductPageSizeChange(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    this.productModalPageSize.set(value);
    this.productModalPage.set(1);
    void this.loadProductModalPage(1);
  }

  onProductModalSearch(value: string) {
    this.productQuery.set(value);
    if (typeof window !== 'undefined') window.clearTimeout(this.productModalSearchTimeout);
    this.productModalPage.set(1);
    if (!value.trim()) this.productModalRequestId++;
    this.productModalSearchTimeout = typeof window !== 'undefined'
      ? window.setTimeout(() => { void this.loadProductModalPage(1); }, 300)
      : undefined;
  }

  private async loadProductModalPage(page: number) {
    const requestId = ++this.productModalRequestId;
    const query = this.productQuery().trim();
    const field = this.productFilterField();
    this.productModalLoading.set(true);
    try {
      const res = await this.api.fetchProductsPage(query, page, this.productModalPageSize(), field);
      if (requestId !== this.productModalRequestId) return;
      this.productModalResults.set(res.data);
      this.productModalTotal.set(res.total);
      this.productModalPage.set(page);
    } catch (err) {
      if (requestId !== this.productModalRequestId) return;
      console.error('[product-modal] fetch error:', err);
      this.productModalResults.set([]);
      this.productModalTotal.set(0);
    } finally {
      if (requestId === this.productModalRequestId) this.productModalLoading.set(false);
    }
  }

  prevProductModalPage() {
    const p = this.productModalPage() - 1;
    if (p < 1) return;
    void this.loadProductModalPage(p);
  }

  nextProductModalPage() {
    const p = this.productModalPage() + 1;
    if (p > this.totalProductModalPages()) return;
    void this.loadProductModalPage(p);
  }

  goToProductModalPage(p: number) {
    void this.loadProductModalPage(p);
  }

  selectProduct(product: ProductRowDto) {
    this.productSelected.emit(product);
    this.doClose();
  }

  private openModal() {
    this.productQuery.set('');
    this.productModalResults.set([]);
    this.productModalTotal.set(0);
    this.productModalPage.set(1);
    this.productModalRequestId++;
    void this.loadProductModalPage(1);
  }

  doClose() {
    this.productQuery.set('');
    this.productModalResults.set([]);
    this.productModalPage.set(1);
    this.productModalRequestId++;
    this.close.emit();
  }
}
