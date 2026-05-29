import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  ChangeDetectionStrategy,
  type OnChanges,
  type SimpleChanges,
  type Signal,
} from '@angular/core';
import { BillflowModalShellComponent } from '../../../shared/components/billflow-modal-shell.component';
import { BillflowComboboxComponent, type ComboboxOption } from '../../../shared/components/billflow-combobox.component';
import type { ProductEntity, ProductMovementEntity, StockAdjustmentPayload } from '../domain/product.entity';
import type { ProductsCopy } from '../i18n/products.translations';

@Component({
  selector: 'billflow-product-movements-modal',
  standalone: true,
  imports: [CommonModule, BillflowModalShellComponent, BillflowComboboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <billflow-modal-shell
      *ngIf="open"
      title="{{ product?.name }} ({{ product?.code }})"
      subtitle="{{ copy.modalMovementsSubtitle }}"
      icon="history"
      maxWidth="2xl"
      [hasFooter]="false"
      (close)="closeModal()"
    >
      <div class="p-6">
        <!-- ══ Stock Adjustment Form ══ -->
        <div class="rounded-xl border border-outline-variant/40 bg-surface-container-low/30 p-4 mb-5">
          <h4 class="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] text-primary">swap_vert</span>
            {{ copy.stockAdjustTitle }}
          </h4>
          <div class="flex flex-wrap items-end gap-3">
            <!-- Type -->
            <div class="min-w-[120px]">
              <label class="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">{{ copy.stockAdjustType }}</label>
              <billflow-combobox
                [options]="movementTypeOptions()"
                [value]="mvtFormType()"
                placeholder="{{ copy.stockAdjustType }}"
                searchPlaceholder="{{ locale === 'es' ? 'Buscar...' : 'Search...' }}"
                [compact]="true"
                (valueChange)="mvtFormType.set($event)"
              ></billflow-combobox>
            </div>

            <!-- Quantity -->
            <div class="min-w-[100px]">
              <label class="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">{{ copy.stockAdjustQty }}</label>
              <input
                type="number"
                min="1"
                class="w-full px-3 py-[5px] bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary/50 transition-all"
                placeholder="0"
                [value]="mvtFormQuantity()"
                (input)="onMvtQuantityInput($any($event.target).value)"
              />
            </div>

            <!-- Reason -->
            <div class="flex-1 min-w-[150px]">
              <label class="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">{{ copy.stockAdjustReason }}</label>
              <input
                type="text"
                class="w-full px-3 py-[5px] bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary/50 transition-all"
                [placeholder]="locale === 'es' ? 'Motivo del ajuste...' : 'Adjustment reason...'"
                [value]="mvtFormDescription()"
                (input)="mvtFormDescription.set($any($event.target).value)"
              />
            </div>

            <!-- Submit -->
            <button
              type="button"
              class="inline-flex items-center gap-1 bg-primary text-on-primary rounded-lg px-3 py-[5px] text-xs font-bold hover:opacity-90 transition-all shadow-sm disabled:opacity-50 shrink-0"
              [disabled]="!mvtFormValid() || mvtFormSubmitting"
              (click)="onAdjustStock()"
            >
              <span class="material-symbols-outlined text-[16px]" [style.animation]="mvtFormSubmitting ? 'spin 0.7s linear infinite' : 'none'">{{ mvtFormSubmitting ? 'refresh' : 'check' }}</span>
              {{ copy.stockAdjustBtn }}
            </button>
          </div>
        </div>
        <!-- ══ /Stock Adjustment Form ══ -->

        <!-- ══ Movement History ══ -->
        <h4 class="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px] text-outline">history</span>
          {{ locale === 'es' ? 'Historial de Movimientos' : 'Movement History' }}
        </h4>
        <div class="overflow-x-auto rounded-xl border border-outline-variant/40 overflow-hidden mb-4">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="bg-surface-container-low font-label-bold text-[10px] uppercase tracking-[0.1em] border-b border-outline-variant/40">
                <th class="p-3 pl-5 font-semibold text-outline">{{ copy.mvtDate }}</th>
                <th class="p-3 font-semibold text-outline text-center">{{ copy.mvtType }}</th>
                <th class="p-3 font-semibold text-outline text-right">{{ copy.mvtQuantity }}</th>
                <th class="p-3 font-semibold text-outline text-right">{{ locale === 'es' ? 'Stock Ant.' : 'Prev. Stock' }}</th>
                <th class="p-3 font-semibold text-outline text-right">{{ locale === 'es' ? 'Stock Nuevo' : 'New Stock' }}</th>
                <th class="p-3 pr-5 font-semibold text-outline">{{ copy.mvtReason }}</th>
              </tr>
            </thead>
            <tbody class="font-mono text-xs">
              <!-- Loading state -->
              <tr *ngIf="mvtLoading">
                <td colspan="6" class="p-8 text-center text-on-surface-variant">
                  <span class="material-symbols-outlined text-[24px] animate-spin">refresh</span>
                </td>
              </tr>

              <!-- Movement rows -->
              <ng-container *ngIf="!mvtLoading">
                <tr
                  *ngFor="let m of movements; trackBy: trackByMovementId"
                  class="border-b border-outline-variant/20 hover:bg-surface-container-low/20 transition-colors"
                >
                  <td class="p-3 pl-5 text-on-surface">
                    {{ formatDateTime(m.createdAt) }}
                  </td>
                  <td class="p-3 text-center">
                    <span
                      class="inline-flex rounded px-2 py-0.5 text-[10px] font-bold"
                      [ngClass]="m.type === 'IN' ? 'bg-[#10b981]/15 text-[#10b981]' : m.type === 'OUT' ? 'bg-red-600/15 text-red-500' : m.type === 'SALE' ? 'bg-orange-500/15 text-orange-500' : 'bg-amber-500/15 text-amber-500'"
                    >
                      {{ m.type }}
                    </span>
                  </td>
                  <td class="p-3 text-right font-bold" [ngClass]="m.type === 'IN' ? 'text-[#10b981]' : (m.type === 'OUT' || m.type === 'SALE') ? 'text-red-500' : 'text-on-surface'">
                    {{ m.type === 'IN' ? '+' : (m.type === 'OUT' || m.type === 'SALE') ? '-' : '' }}{{ m.quantity }}
                  </td>
                  <td class="p-3 text-right font-mono text-xs text-on-surface-variant">
                    {{ m.previousStock }}
                  </td>
                  <td class="p-3 text-right font-mono text-xs font-semibold text-on-surface">
                    {{ m.newStock }}
                  </td>
                  <td class="p-3 pr-5 text-on-surface-variant max-w-[200px] truncate" [title]="m.reason">
                    {{ m.reason || '—' }}
                  </td>
                </tr>

                <!-- Empty state -->
                <tr *ngIf="movements.length === 0 && !mvtLoading">
                  <td colspan="6" class="p-8 text-center text-on-surface-variant">
                    <span class="material-symbols-outlined text-4xl text-outline-variant mb-2">history</span>
                    <p class="font-semibold">{{ copy.noMovementsTitle }}</p>
                    <p class="text-xs">{{ copy.noMovementsText }}</p>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>

        <!-- Movements Pager -->
        <div class="flex items-center justify-between text-xs text-on-surface-variant" *ngIf="mvtTotalPages > 1">
          <span>
            {{ copy.showingText }} {{ mvtRangeStart() }} - {{ mvtRangeEnd() }} {{ locale === 'es' ? 'de' : 'of' }} {{ mvtTotalCount }}
          </span>
          <div class="flex items-center gap-1">
            <button type="button" class="p-1.5 border border-outline-variant/60 rounded hover:border-primary disabled:opacity-30 cursor-pointer" [disabled]="mvtPage === 1" (click)="onPrevPage()">
              <span class="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span class="px-2 font-semibold">{{ mvtPage }} / {{ mvtTotalPages }}</span>
            <button type="button" class="p-1.5 border border-outline-variant/60 rounded hover:border-primary disabled:opacity-30 cursor-pointer" [disabled]="mvtPage === mvtTotalPages" (click)="onNextPage()">
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </billflow-modal-shell>
  `,
})
export class ProductMovementsModalComponent implements OnChanges {
  // ── Inputs ─────────────────────────────────────────────────────────────
  @Input({ required: true }) open = false;
  @Input() product: ProductEntity | null = null;
  @Input({ required: true }) locale = 'es';
  @Input({ required: true }) copy!: ProductsCopy;
  @Input({ required: true }) movements: ProductMovementEntity[] = [];
  @Input({ required: true }) mvtLoading = false;
  @Input({ required: true }) mvtPage = 1;
  @Input({ required: true }) mvtTotalPages = 1;
  @Input({ required: true }) mvtTotalCount = 0;
  @Input() mvtPageSize = 5;
  @Input() mvtFormSubmitting = false;
  /** Increment to trigger form reset after successful adjustment */
  @Input() resetFormTrigger = 0;

  // ── Outputs ────────────────────────────────────────────────────────────
  @Output() adjustStock = new EventEmitter<StockAdjustmentPayload>();
  @Output() prevPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  // ── Movement form signals ──────────────────────────────────────────────
  mvtFormType = signal<'IN' | 'OUT' | 'ADJUST'>('IN');
  mvtFormQuantity = signal<number | null>(null);
  mvtFormDescription = signal('');

  readonly mvtFormValid = computed(() =>
    this.mvtFormQuantity() !== null && this.mvtFormQuantity()! > 0
  );

  readonly movementTypeOptions: Signal<ComboboxOption[]> = computed(() => [
    { value: 'IN', label: this.copy.stockTypeIn },
    { value: 'OUT', label: this.copy.stockTypeOut },
    { value: 'ADJUST', label: this.copy.stockTypeAdjust },
  ]);

  readonly mvtRangeStart = computed(() =>
    this.movements.length > 0 ? (this.mvtPage - 1) * this.mvtPageSize + 1 : 0
  );

  readonly mvtRangeEnd = computed(() =>
    Math.min(this.mvtTotalCount, this.mvtPage * this.mvtPageSize)
  );

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetFormTrigger'] && !changes['resetFormTrigger'].firstChange) {
      this.resetFormInternal();
    }
  }

  // ── Event handlers ─────────────────────────────────────────────────────
  trackByMovementId(_index: number, m: ProductMovementEntity): number | string {
    return m.id;
  }

  onMvtQuantityInput(raw: string): void {
    const cleaned = raw.replace(/\D/g, '');
    this.mvtFormQuantity.set(cleaned ? Number(cleaned) : null);
  }

  onAdjustStock(): void {
    if (!this.mvtFormValid()) return;

    const payload: StockAdjustmentPayload = {
      type: this.mvtFormType(),
      quantity: Number(this.mvtFormQuantity()),
      description: this.mvtFormDescription().trim() || '',
    };

    this.adjustStock.emit(payload);
  }

  private resetFormInternal(): void {
    this.mvtFormType.set('IN');
    this.mvtFormQuantity.set(null);
    this.mvtFormDescription.set('');
  }

  onPrevPage(): void {
    this.prevPage.emit();
  }

  onNextPage(): void {
    this.nextPage.emit();
  }

  closeModal(): void {
    this.close.emit();
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  formatDateTime(isoString: string): string {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleString(this.locale === 'es' ? 'es-PY' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  }
}
