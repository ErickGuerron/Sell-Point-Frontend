import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { type ProductRowDto } from './invoice-api.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LineItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  maxQuantity: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'billflow-invoice-line-items',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
      <!-- Header row: title + cart badge + open-modal button -->
      <div class="px-5 pt-5 pb-4 bg-surface/50 border-b border-outline-variant/50 flex items-center gap-3 flex-wrap">
        <span class="material-symbols-outlined text-primary">shopping_cart</span>
        <h2 class="text-base font-semibold text-on-surface flex-1">{{ locale === 'es' ? 'Líneas de Producto' : 'Product Lines' }}</h2>
        <span class="text-xs font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">{{ items().length }}</span>
        <button
          type="button"
          id="open-product-modal-btn"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold shadow hover:bg-primary/90 active:scale-95 transition-all"
          (click)="onAddProduct()"
        >
          <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
          {{ locale === 'es' ? 'Buscar Producto' : 'Browse Products' }}
        </button>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full min-w-[480px] text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-low border-b border-outline-variant/50">
              <th class="py-3 px-3 md:px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{{ locale === 'es' ? 'Producto' : 'Product' }}</th>
              <th class="py-3 px-3 md:px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right">{{ locale === 'es' ? 'Cant.' : 'Qty.' }}</th>
              <th class="py-3 px-3 md:px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right hidden sm:table-cell">{{ locale === 'es' ? 'Precio Unit.' : 'Unit Price' }}</th>
              <th class="py-3 px-3 md:px-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right">{{ locale === 'es' ? 'Total' : 'Total' }}</th>
              <th class="py-3 px-3 md:px-4 w-10"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              *ngFor="let item of items(); let i = index"
              class="border-b border-outline-variant/20 hover:bg-surface-container-low/50 transition-colors"
            >
              <td class="py-3 px-3 md:px-4 md:py-4">
                <p class="font-medium text-sm text-on-surface leading-tight">{{ item.productName }}</p>
                <p class="text-xs text-on-surface-variant mt-0.5">{{ item.productCode }}</p>
              </td>
              <td class="py-3 px-3 md:px-4 md:py-4 text-right">
                <!-- Editing mode -->
                <div *ngIf="editingIndex() === i" class="inline-flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    class="w-16 text-center border border-primary rounded-lg px-2 py-1 text-sm font-semibold text-on-surface bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    [value]="editValue()"
                    (input)="onEditValueChange($event)"
                    (keydown.enter)="confirmEdit(i)"
                    (keydown.escape)="cancelEdit()"
                    (blur)="cancelEdit()"
                    autofocus
                  />
                  <button
                    type="button"
                    class="px-2 py-1 rounded-md bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition-all shadow-sm"
                    (mousedown)="$event.preventDefault()"
                    (click)="confirmEdit(i)"
                  >
                    {{ locale === 'es' ? 'Actualizar Valor' : 'Update Value' }}
                  </button>
                </div>
                <!-- Display mode: click to edit -->
                <div
                  *ngIf="editingIndex() !== i"
                  class="inline-flex items-center border border-outline-variant rounded-lg overflow-hidden bg-surface-container-lowest cursor-pointer"
                  (click)="startEdit(i)"
                >
                  <button type="button" class="px-1.5 md:px-2 py-1 hover:bg-surface-container text-outline transition-colors" (click)="$event.stopPropagation(); decQty(i)">
                    <span class="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <span class="px-2 md:px-3 text-sm font-semibold min-w-[1.5rem] text-center select-none">{{ item.quantity }}</span>
                  <button type="button" class="px-1.5 md:px-2 py-1 hover:bg-surface-container text-outline transition-colors" (click)="$event.stopPropagation(); incQty(i)">
                    <span class="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </td>
              <td class="py-3 px-3 md:px-4 md:py-4 text-right text-sm text-on-surface hidden sm:table-cell">{{ formatMoney(item.unitPrice) }}</td>
              <td class="py-3 px-3 md:px-4 md:py-4 text-right text-sm font-semibold text-on-surface">{{ formatMoney(item.unitPrice * item.quantity) }}</td>
              <td class="py-3 px-3 md:px-4 md:py-4 text-center">
                <button type="button" class="text-outline hover:text-error transition-colors" (click)="removeLineItem(i)">
                  <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </td>
            </tr>

            <!-- Empty state -->
            <tr *ngIf="items().length === 0">
              <td colspan="5" class="py-12 text-center">
                <span class="material-symbols-outlined text-[40px] text-outline-variant block mb-2">add_shopping_cart</span>
                <p class="text-sm text-on-surface-variant">{{ locale === 'es' ? 'Busque un producto para agregar.' : 'Search for a product to add.' }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div class="px-4 py-5 md:px-6 bg-surface-container-lowest border-t border-outline-variant/50 flex justify-end">
        <div class="w-full sm:w-72 md:w-80 space-y-3">
          <div class="flex justify-between text-sm text-on-surface-variant">
            <span>{{ locale === 'es' ? 'Subtotal' : 'Subtotal' }}</span>
            <span class="font-medium">{{ formatMoney(subtotal()) }}</span>
          </div>
          <div class="flex justify-between text-sm text-on-surface-variant pb-3 border-b border-outline-variant/50">
            <span>{{ locale === 'es' ? 'IVA (15%)' : 'VAT (15%)' }}</span>
            <span class="font-medium">{{ formatMoney(ivaAmount()) }}</span>
          </div>
          <div class="flex justify-between items-center pt-1">
            <span class="text-lg md:text-xl font-bold text-on-surface">{{ locale === 'es' ? 'Total' : 'Total' }}</span>
            <span class="text-lg md:text-xl font-bold text-primary">{{ formatMoney(total()) }}</span>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class InvoiceLineItemsComponent {
  private readonly feedback = inject(UiFeedbackService);

  @Input({ required: true }) locale!: string;
  @Input({ required: true }) submitting!: boolean;

  /** Increment to trigger a full reset (e.g. on "New Invoice") */
  private _resetKey = 0;
  @Input() set resetKey(v: number) {
    if (v !== this._resetKey) {
      this._resetKey = v;
      this.items.set([]);
      this.editingIndex.set(null);
      this.editValue.set(0);
      this.emitItems();
    }
  }

  @Output() addProduct = new EventEmitter<void>();
  @Output() itemsChange = new EventEmitter<LineItem[]>();

  // ── Internal state ────────────────────────────────────────────────────────
  readonly items = signal<LineItem[]>([]);
  readonly editingIndex = signal<number | null>(null);
  readonly editValue = signal<number>(0);

  // ── Computed totals ────────────────────────────────────────────────────────
  readonly subtotal = computed(() =>
    this.items().reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  );
  readonly ivaAmount = computed(() => this.subtotal() * 0.15);
  readonly total = computed(() => this.subtotal() + this.ivaAmount());

  // ── Public methods ──────────────────────────────────────────────────────────

  /** Emits addProduct to parent when user clicks "Browse Products" */
  onAddProduct() {
    this.addProduct.emit();
  }

  /** Called by parent when a product is selected from the modal */
  addProductItem(product: ProductRowDto): void {
    const existing = this.items().findIndex(i => i.productId === product.id);
    if (existing >= 0) {
      const currentItem = this.items()[existing];
      if (currentItem.quantity >= product.availableQuantity) {
        this.feedback.toast('warning', this.locale === 'es'
          ? `Stock máximo alcanzado (${product.availableQuantity})`
          : `Maximum stock reached (${product.availableQuantity})`);
        return;
      }
      this.items.update(items =>
        items.map((item, idx) =>
          idx === existing ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      this.items.update(items => [
        ...items,
        {
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          quantity: 1,
          unitPrice: product.unitPrice,
          maxQuantity: product.availableQuantity,
        },
      ]);
    }
    this.emitItems();
  }

  incQty(index: number) {
    this.items.update((items) =>
      items.map((item, i) => {
        if (i !== index) return item;
        if (item.quantity >= item.maxQuantity) {
          this.feedback.toast('warning', this.locale === 'es'
            ? `Stock máximo: ${item.maxQuantity}`
            : `Max stock: ${item.maxQuantity}`);
          return item;
        }
        return { ...item, quantity: item.quantity + 1 };
      })
    );
    this.emitItems();
  }

  decQty(index: number) {
    this.items.update((items) =>
      items.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item))
    );
    this.emitItems();
  }

  removeLineItem(index: number) {
    this.items.update((items) => items.filter((_, i) => i !== index));
    this.emitItems();
  }

  startEdit(index: number) {
    const currentQty = this.items()[index].quantity;
    this.editingIndex.set(index);
    this.editValue.set(currentQty);
  }

  confirmEdit(index: number) {
    const value = this.editValue();
    if (Number.isFinite(value) && value >= 1) {
      const floorVal = Math.floor(value);
      const item = this.items()[index];
      if (floorVal > item.maxQuantity) {
        this.feedback.toast('warning', this.locale === 'es'
          ? `Stock máximo: ${item.maxQuantity}`
          : `Max stock: ${item.maxQuantity}`);
        this.cancelEdit();
        return;
      }
      this.items.update((items) =>
        items.map((item, i) =>
          i === index ? { ...item, quantity: floorVal } : item
        )
      );
    }
    this.editingIndex.set(null);
    this.editValue.set(0);
    this.emitItems();
  }

  cancelEdit() {
    this.editingIndex.set(null);
    this.editValue.set(0);
  }

  onEditValueChange(event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    const parsed = parseInt(raw, 10);
    this.editValue.set(Number.isFinite(parsed) && parsed >= 1 ? parsed : 1);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private emitItems() {
    this.itemsChange.emit(this.items());
  }

  private formatMoney(value: number) {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(
      Number.isFinite(Number(value)) ? Number(value) : 0
    );
  }
}
