import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InvoiceApiService, type CustomerRowDto } from './invoice-api.service';
import { BillflowModalShellComponent } from '../../shared/components/billflow-modal-shell.component';
import { BillflowComboboxComponent, type ComboboxOption } from '../../shared/components/billflow-combobox.component';

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'billflow-customer-selection-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, BillflowModalShellComponent, BillflowComboboxComponent],
  template: `
    <billflow-modal-shell
      *ngIf="open"
      title="{{ locale === 'es' ? 'Seleccionar cliente' : 'Select customer' }}"
      [subtitle]="modalTotal() > 0 ? modalTotal() + (locale === 'es' ? ' clientes encontrados' : ' customers found') : (locale === 'es' ? 'Busque por nombre o cédula' : 'Search by name or ID')"
      icon="manage_accounts"
      maxWidth="lg"
      [hasFooter]="true"
      [disableUnsavedGuard]="true"
      (close)="doClose()"
    >
      <!-- Search bar + filter -->
      <div class="px-6 py-3 border-b border-outline-variant/30 flex-shrink-0 bg-surface-container/30">
        <div class="flex items-center gap-3">
          <billflow-combobox
            [options]="customerFilterOptions()"
            [value]="customerFilterField()"
            [placeholder]="locale === 'es' ? 'Filtrar por...' : 'Filter by...'"
            searchPlaceholder="{{ locale === 'es' ? 'Buscar campo...' : 'Search field...' }}"
            [compact]="true"
            (valueChange)="onCustomerFilterFieldChange($event)"
          ></billflow-combobox>
          <div class="relative flex-1">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              id="modal-customer-search"
              type="text"
              class="w-full pl-10 pr-10 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              [placeholder]="locale === 'es' ? 'Buscar por nombre o cédula...' : 'Search by name or ID...'"
              [ngModel]="customerQuery()"
              (ngModelChange)="onModalCustomerSearch($event)"
            />
            <button
              *ngIf="customerQuery()"
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
              (click)="onModalCustomerSearch('')"
            >
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Table area -->
      <table class="w-full border-collapse text-sm">
        <thead class="sticky top-0 z-20">
          <tr class="bg-surface-container border-b-2 border-primary/30">
            <th class="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-primary w-20">#</th>
            <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-primary">{{ locale === 'es' ? 'Nombre completo' : 'Full Name' }}</th>
            <th class="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-primary hidden sm:table-cell">Email</th>
            <th class="px-4 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody>
          <ng-container *ngIf="customerLoading()">
            <tr *ngFor="let s of skeletonRows">
              <td class="px-5 py-3.5 border-b border-outline-variant/20"><div class="h-3.5 w-8 rounded bg-outline-variant/30 animate-pulse"></div></td>
              <td class="px-4 py-3.5 border-b border-outline-variant/20"><div class="h-3.5 w-36 rounded bg-outline-variant/30 animate-pulse"></div></td>
              <td class="px-4 py-3.5 border-b border-outline-variant/20 hidden sm:table-cell"><div class="h-3.5 w-28 rounded bg-outline-variant/20 animate-pulse"></div></td>
              <td class="px-4 py-3.5 border-b border-outline-variant/20"></td>
            </tr>
          </ng-container>
          <tr
            *ngFor="let c of pagedModalCustomers(); let i = index; let even = even"
            class="group cursor-pointer transition-colors border-b border-outline-variant/15 hover:bg-primary/5"
            [class.bg-surface-container-lowest]="even"
            [class.bg-surface-container]="!even"
            (click)="selectCustomer(c)"
          >
            <td class="px-5 py-3.5"><span class="font-mono text-xs font-semibold text-on-surface-variant group-hover:text-primary transition-colors">{{ c.cedula ?? '—' }}</span></td>
            <td class="px-4 py-3.5">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0 group-hover:bg-primary/20 transition-colors">{{ initials(c.name, c.lastName) }}</div>
                <span class="font-semibold text-on-surface group-hover:text-primary transition-colors">{{ customerFullName(c) }}</span>
              </div>
            </td>
            <td class="px-4 py-3.5 text-on-surface-variant text-xs hidden sm:table-cell">{{ c.email ?? '—' }}</td>
            <td class="px-4 py-3.5 text-right"><span class="material-symbols-outlined text-outline/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all text-[18px]">arrow_forward</span></td>
          </tr>
          <tr *ngIf="!customerLoading() && modalCustomers().length === 0">
            <td colspan="4" class="px-5 py-14 text-center">
              <span class="material-symbols-outlined text-[44px] text-outline-variant block mb-3">person_search</span>
              <p class="text-sm font-medium text-on-surface-variant">{{ locale === 'es' ? 'No se encontraron clientes' : 'No customers found' }}</p>
              <p class="text-xs text-outline mt-1">{{ locale === 'es' ? 'Intentá con otro nombre o cédula' : 'Try another name or ID' }}</p>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination footer slot -->
      <div footer class="flex w-full items-center justify-between gap-3">
        <div class="flex items-center gap-3 text-sm text-on-surface-variant">
          <ng-container *ngIf="modalCustomers().length > 0">
            <span>
              {{ (modalPage() - 1) * customerPageSize() + 1 }}
              –
              {{ minOf(modalPage() * customerPageSize(), modalTotal() || modalCustomers().length) }}
              {{ locale === 'es' ? 'de' : 'of' }}
              <span class="font-semibold text-on-surface">{{ modalTotal() || modalCustomers().length }}</span>
            </span>
          </ng-container>
          <ng-container *ngIf="modalCustomers().length === 0 && !customerLoading()">
            {{ locale === 'es' ? 'Sin resultados' : 'No results' }}
          </ng-container>
          <select
            class="bg-surface border border-outline-variant rounded-lg px-2 py-1 text-xs font-medium text-on-surface cursor-pointer focus:outline-none focus:border-primary"
            [value]="customerPageSize()"
            (change)="onCustomerPageSizeChange($event)"
          >
            <option [value]="5">5</option>
            <option [value]="10">10</option>
            <option [value]="15">15</option>
            <option [value]="20">20</option>
            <option [value]="30">30</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30" [disabled]="modalPage() <= 1" (click)="prevModalPage()"><span class="material-symbols-outlined text-[18px]">chevron_left</span></button>
          <button *ngFor="let p of modalPageNumbers()" type="button" class="h-9 w-9 rounded-lg text-sm font-semibold transition" [ngClass]="p === modalPage() ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'" (click)="goToPage(p)">{{ p }}</button>
          <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30" [disabled]="modalPage() >= totalModalPages()" (click)="nextModalPage()"><span class="material-symbols-outlined text-[18px]">chevron_right</span></button>
        </div>
      </div>
    </billflow-modal-shell>
  `,
})
export class CustomerSelectionModalComponent {
  private readonly api = inject(InvoiceApiService);

  private _open = false;
  @Input() set open(value: boolean) {
    this._open = value;
    if (value) this.openModal();
  }
  get open(): boolean { return this._open; }

  @Input({ required: true }) locale!: string;

  @Output() selectedCustomer = new EventEmitter<CustomerRowDto>();
  @Output() close = new EventEmitter<void>();

  customerFilterField = signal<'all' | 'name' | 'lastName' | 'cedula' | 'email'>('all');
  readonly customerFilterOptions = computed<ComboboxOption[]>(() => {
    const es = this.locale === 'es';
    return [
      { value: 'all',      label: es ? 'Todos'     : 'All' },
      { value: 'name',     label: es ? 'Nombre'    : 'Name' },
      { value: 'lastName', label: es ? 'Apellido'  : 'Last Name' },
      { value: 'cedula',   label: es ? 'Cédula'    : 'ID' },
      { value: 'email',    label: 'Email' },
    ];
  });
  customerQuery = signal('');
  customerLoading = signal(false);
  modalCustomers = signal<CustomerRowDto[]>([]);
  modalPage = signal(1);
  modalTotal = signal(0);
  customerPageSize = signal(5);
  readonly skeletonRows = [1, 2, 3, 4, 5];

  readonly totalModalPages = computed(() => {
    const total = this.modalTotal() || this.modalCustomers().length;
    return Math.max(1, Math.ceil(total / this.customerPageSize()));
  });

  readonly pagedModalCustomers = computed(() => this.modalCustomers());

  readonly modalPageNumbers = computed(() => {
    const total = this.totalModalPages();
    const cur = this.modalPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [];
    const start = Math.max(1, Math.min(cur - 2, total - 4));
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  private customerSearchTimeout: number | undefined;
  private customerModalRequestId = 0;

  initials(name: string | null | undefined, lastName?: string): string {
    if (!name || typeof name !== 'string' || name.trim().length === 0) return '?';
    return name.trim()[0].toUpperCase();
  }

  customerFullName(c: { name: string; lastName?: string }): string {
    return c.lastName?.trim() ? `${c.name} ${c.lastName}` : c.name;
  }

  minOf(a: number, b: number) { return Math.min(a, b); }

  onCustomerFilterFieldChange(value: string) {
    this.customerFilterField.set(value as 'all' | 'name' | 'lastName' | 'cedula' | 'email');
    this.modalPage.set(1);
    void this.loadModalPage(1);
  }

  onCustomerPageSizeChange(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    this.customerPageSize.set(value);
    this.modalPage.set(1);
    void this.loadModalPage(1);
  }

  onModalCustomerSearch(value: string) {
    this.customerQuery.set(value);
    this.modalPage.set(1);
    if (typeof window !== 'undefined') window.clearTimeout(this.customerSearchTimeout);
    this.customerSearchTimeout = typeof window !== 'undefined'
      ? window.setTimeout(() => { void this.loadModalPage(1); }, 300)
      : undefined;
  }

  private async loadModalPage(page: number) {
    const requestId = ++this.customerModalRequestId;
    const query = this.customerQuery().trim();
    const field = this.customerFilterField();
    this.customerLoading.set(true);
    try {
      const res = await this.api.fetchCustomersPage(query, page, this.customerPageSize(), field);
      if (requestId !== this.customerModalRequestId) return;
      this.modalCustomers.set(res.data);
      this.modalTotal.set(res.total);
      this.modalPage.set(page);
    } catch (err) {
      if (requestId !== this.customerModalRequestId) return;
      console.error('[modal] fetch error:', err);
      this.modalCustomers.set([]);
      this.modalTotal.set(0);
    } finally {
      if (requestId === this.customerModalRequestId) this.customerLoading.set(false);
    }
  }

  prevModalPage() {
    const p = this.modalPage() - 1;
    if (p < 1) return;
    void this.loadModalPage(p);
  }

  nextModalPage() {
    const p = this.modalPage() + 1;
    if (p > this.totalModalPages()) return;
    void this.loadModalPage(p);
  }

  goToPage(p: number) { void this.loadModalPage(p); }

  selectCustomer(c: CustomerRowDto) {
    this.selectedCustomer.emit(c);
    this.doClose();
  }

  private openModal() {
    this.customerQuery.set('');
    this.modalCustomers.set([]);
    this.modalTotal.set(0);
    this.modalPage.set(1);
    this.customerModalRequestId++;
    void this.loadModalPage(1);
  }

  doClose() {
    this.customerQuery.set('');
    this.modalCustomers.set([]);
    this.customerModalRequestId++;
    this.close.emit();
  }
}
