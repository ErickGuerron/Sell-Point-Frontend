import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  type OnChanges,
  type SimpleChanges,
  signal,
  ChangeDetectionStrategy,
  type Signal,
  inject,
  viewChild,
} from '@angular/core';
import { BillflowModalShellComponent } from '../../../shared/components/billflow-modal-shell.component';
import { BillflowComboboxComponent, type ComboboxOption } from '../../../shared/components/billflow-combobox.component';
import { UiFeedbackService } from '../../../shared/services/ui-feedback.service';
import type { ProductEntity, CreateProductPayload, UpdateProductPayload } from '../domain/product.entity';
import type { CategoryDto } from '../product-api.service';
import type { ProductsCopy } from '../i18n/products.translations';

@Component({
  selector: 'billflow-product-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, BillflowModalShellComponent, BillflowComboboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <billflow-modal-shell
      #shell
      *ngIf="open"
      title="{{ editingProduct ? copy.modalEditTitle : copy.modalCreateTitle }}"
      subtitle="{{ editingProduct ? copy.modalEditSubtitle : copy.modalCreateSubtitle }}"
      icon="inventory"
      maxWidth="xl"
      [hasFooter]="true"
      [disableClose]="saving"
      [formHasChanges]="hasUnsavedChanges"
      (close)="closeModal()"
    >
      <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- Code -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy.codeLabel }} <span class="text-error">*</span></label>
          <input
            type="text"
            class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            maxlength="20"
            placeholder="PROD-XXXXXXXXXXXXXXX"
            [ngModel]="formCode()"
            [readonly]="true"
            [disabled]="editingProduct !== null"
            (ngModelChange)="formCode.set($event.trim().toUpperCase())"
          />
          <p class="mt-1 text-[11px] text-outline-variant">{{ locale === 'es' ? 'Se genera automáticamente' : 'Auto-generated' }}</p>
        </div>

        <!-- Category -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy.category }} <span class="text-error">*</span></label>
          <billflow-combobox
            [options]="categorySelectOptions()"
            [value]="formCategoryId()"
            placeholder="{{ copy.categorySelect }}"
            searchPlaceholder="{{ locale === 'es' ? 'Buscar categoría...' : 'Search category...' }}"
            (valueChange)="formCategoryId.set($event)"
          ></billflow-combobox>
        </div>

        <!-- Name -->
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy.nameLabel }} <span class="text-error">*</span></label>
          <input
            type="text"
            class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            maxlength="50"
            placeholder="Ej: Coca Cola 1L"
            [ngModel]="formName()"
            (keydown.space)="blockOuterSpace($event)"
            (ngModelChange)="formName.set(trimOuterSpaces($event))"
            (blur)="formName.set(formName().trim())"
          />
          <p *ngIf="formName().length > 50" class="mt-1 text-[11px] text-error">{{ locale === 'es' ? 'Máximo 50 caracteres' : 'Maximum 50 characters' }}</p>
        </div>

        <!-- Description -->
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy.descriptionLabel }}</label>
          <textarea
            class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant resize-none h-20"
            placeholder="Ej: Bebida gaseosa refrescante sabor cola."
            [ngModel]="formDescription()"
            (keydown.space)="blockOuterSpace($event)"
            (ngModelChange)="formDescription.set(trimOuterSpaces($event))"
            (blur)="formDescription.set(formDescription().trim())"
          ></textarea>
        </div>

        <!-- Cost Price -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy.costPriceLabel }} <span class="text-error">*</span></label>
          <input
            type="number"
            inputmode="decimal"
            autocomplete="off"
            min="0"
            step="0.01"
            class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            placeholder="0.00"
            [ngModel]="formCostPrice()"
            (keydown)="onMoneyKeyDown($event)"
            (paste)="onMoneyPaste($event)"
            (ngModelChange)="onMoneyInput($event, 'cost')"
          />
          <p *ngIf="costPriceZero()" class="mt-1 text-[11px] text-error">{{ locale === 'es' ? 'El precio de costo debe ser mayor que 0' : 'Cost price must be greater than 0' }}</p>
        </div>

        <!-- Sale Price -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy.salePriceLabel }} <span class="text-error">*</span></label>
          <input
            type="number"
            inputmode="decimal"
            autocomplete="off"
            min="0"
            step="0.01"
            class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            placeholder="0.00"
            [ngModel]="formSalePrice()"
            (keydown)="onMoneyKeyDown($event)"
            (paste)="onMoneyPaste($event)"
            (ngModelChange)="onMoneyInput($event, 'sale')"
          />
          <p *ngIf="recommendedSaleRange()" class="mt-1 text-[11px] text-outline-variant">
            {{ locale === 'es' ? 'Precio recomendado:' : 'Recommended price:' }}
            {{ formatCurrency(recommendedSaleRange()!.min) }} - {{ formatCurrency(recommendedSaleRange()!.max) }}
          </p>
          <p *ngIf="priceMismatch()" class="mt-1 text-[11px] text-error">{{ locale === 'es' ? 'La venta debe estar dentro del precio recomendado' : 'Sale price must stay within the recommended range' }}</p>
        </div>

        <!-- Initial Stock (Only for Creation) -->
        <div class="md:col-span-2" *ngIf="editingProduct === null">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy.initialStockLabel }}</label>
          <input
            type="number"
            inputmode="numeric"
            autocomplete="off"
            min="0"
            max="1000"
            step="1"
            class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            placeholder="0"
            [ngModel]="formInitialStock()"
            (keydown)="onStockKeyDown($event)"
            (paste)="onStockPaste($event)"
            (ngModelChange)="onStockInput($event)"
          />
          <p *ngIf="stockOverflow()" class="mt-1 text-[11px] text-error">{{ locale === 'es' ? 'El stock inicial no puede superar 1000' : 'Initial stock cannot exceed 1000' }}</p>
        </div>
      </div>

      <div footer class="flex w-full items-center justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all border border-outline-variant/50"
          (click)="requestClose()"
        >
          {{ copy.cancel }}
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
          [disabled]="saving || !formValid() || !hasUnsavedChanges()"
          (click)="onSave()"
        >
          <span class="material-symbols-outlined text-[18px] align-middle mr-1" [style.animation]="saving ? 'spin 0.7s linear infinite' : 'none'">{{ saving ? 'refresh' : 'save' }}</span>
          {{ saving ? (locale === 'es' ? 'Guardando' : 'Saving') : (editingProduct ? copy.saveEdit : copy.save) }}
        </button>
      </div>
    </billflow-modal-shell>
  `,
})
export class ProductFormModalComponent implements OnChanges {
  private readonly feedback = inject(UiFeedbackService);

  // Spec 3 R6: viewChild to the shell so the host's Cancel button can route
  // through the shell's `requestClose()` (which owns the unsaved-changes guard).
  private readonly shell = viewChild(BillflowModalShellComponent);

  // ── Inputs ─────────────────────────────────────────────────────────────
  @Input({ required: true }) open = false;
  @Input() editingProduct: ProductEntity | null = null;
  @Input({ required: true }) categories: CategoryDto[] = [];
  @Input({ required: true }) locale = 'es';
  @Input({ required: true }) copy!: ProductsCopy;
  @Input() initialCode = '';
  @Input() saving = false;

  // ── Outputs ────────────────────────────────────────────────────────────
  @Output() save = new EventEmitter<CreateProductPayload | UpdateProductPayload>();
  @Output() close = new EventEmitter<void>();

  // ── Form signals ───────────────────────────────────────────────────────
  formCode = signal('');
  formName = signal('');
  formDescription = signal('');
  formSalePrice = signal<number | null>(null);
  formCostPrice = signal<number | null>(null);
  formInitialStock = signal<number | null>(null);
  formCategoryId = signal('');

  private readonly initialCodeSnapshot = signal('');
  private readonly initialNameSnapshot = signal('');
  private readonly initialDescriptionSnapshot = signal('');
  private readonly initialSalePriceSnapshot = signal<number | null>(null);
  private readonly initialCostPriceSnapshot = signal<number | null>(null);
  private readonly initialStockSnapshot = signal<number | null>(null);
  private readonly initialCategorySnapshot = signal('');

  readonly formValid = computed(() =>
    this.formCode().trim().length > 0 &&
    this.formName().trim().length > 0 && this.formName().trim().length <= 50 &&
    this.formCategoryId().trim().length > 0 &&
    this.formSalePrice() !== null && this.formSalePrice()! > 0 &&
    this.formCostPrice() !== null && this.formCostPrice()! > 0 &&
    this.salePriceWithinRecommendedRange() &&
    (this.formInitialStock() === null || (this.formInitialStock()! >= 0 && this.formInitialStock()! <= 1000 && Number.isInteger(this.formInitialStock())))
  );

  readonly priceMismatch = computed(() =>
    !this.salePriceWithinRecommendedRange() && this.formSalePrice() !== null && this.formCostPrice() !== null
  );

  readonly recommendedSaleRange = computed(() => {
    const cost = this.formCostPrice();
    if (cost === null || !Number.isFinite(cost) || cost <= 0) return null;

    return {
      min: cost * 1.25,
      max: cost * 1.5,
    };
  });

  readonly salePriceWithinRecommendedRange = computed(() => {
    const range = this.recommendedSaleRange();
    const sale = this.formSalePrice();
    if (!range || sale === null || !Number.isFinite(sale)) return false;

    return sale >= range.min && sale <= range.max;
  });

  readonly costPriceZero = computed(() =>
    this.formCostPrice() !== null && this.formCostPrice()! <= 0
  );

  readonly stockOverflow = computed(() =>
    this.formInitialStock() !== null && this.formInitialStock()! > 1000
  );

  readonly hasUnsavedChanges = computed(() =>
    this.formCode() !== this.initialCodeSnapshot()
    || this.formName().trim() !== this.initialNameSnapshot()
    || this.formDescription().trim() !== this.initialDescriptionSnapshot()
    || this.formSalePrice() !== this.initialSalePriceSnapshot()
    || this.formCostPrice() !== this.initialCostPriceSnapshot()
    || this.formInitialStock() !== this.initialStockSnapshot()
    || this.formCategoryId() !== this.initialCategorySnapshot()
  );

  readonly categorySelectOptions: Signal<ComboboxOption[]> = computed(() => [
    { value: '', label: this.copy.categorySelect },
    ...this.categories.map((c) => ({ value: c.id, label: c.name })),
  ]);

  // ── Sync form fields when modal inputs change ─────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingProduct']?.currentValue) {
      const product = changes['editingProduct'].currentValue as ProductEntity;
      this.syncEditState(product);
      return;
    }

    if (changes['open'] && this.open && !this.editingProduct) {
      this.syncCreateState();
      return;
    }

    if (changes['initialCode'] && this.open && !this.editingProduct) {
      this.syncCreateState();
    }
  }

  // ── Modal control ──────────────────────────────────────────────────────
  closeModal(): void {
    this.close.emit();
    this.editingProduct = null;
    this.resetForm();
  }

  /**
   * Host-side helper that routes the Cancel button through the shell's
   * `requestClose()`. The shell owns the unsaved-changes guard, so all
   * four close paths (X, backdrop, Escape, Cancel) share the same
   * decision matrix. The shell's `requestClose()` also honors the
   * `[disableClose]` input, which the host binds to `saving`, so the
   * saving-in-flight guard is preserved.
   */
  async requestClose(): Promise<void> {
    await this.shell()?.requestClose();
  }

  // ── Save ───────────────────────────────────────────────────────────────
  onSave(): void {
    if (this.saving || !this.formValid() || !this.hasUnsavedChanges()) return;

    const editing = this.editingProduct;
    if (editing) {
      const payload: UpdateProductPayload = {
        name: this.formName(),
        description: this.formDescription().trim() || undefined,
        salePrice: Number(this.formSalePrice()),
        costPrice: Number(this.formCostPrice()),
        categoryId: this.formCategoryId(),
      };
      this.save.emit(payload);
    } else {
      const payload: CreateProductPayload = {
        categoryId: this.formCategoryId(),
        code: this.formCode().trim().toUpperCase(),
        name: this.formName().trim(),
        description: this.formDescription().trim() || undefined,
        salePrice: Number(this.formSalePrice()),
        costPrice: Number(this.formCostPrice()),
        initialStock: this.formInitialStock() !== null ? Number(this.formInitialStock()) : 0,
      };
      this.save.emit(payload);
    }
  }

  // ── Form helpers ──────────────────────────────────────────────────────
  trimOuterSpaces(value: string): string {
    return typeof value === 'string' ? value.replace(/^\s+|\s+$/g, '') : value;
  }

  blockOuterSpace(event: KeyboardEvent): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target) return;

    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? 0;
    const hasSelection = selectionStart !== selectionEnd;

    if (!hasSelection && selectionStart === 0) {
      event.preventDefault();
    }
  }

  normalizeInteger(value: string, min: number, max: number): number | null {
    const cleaned = String(value).replace(/\D/g, '');
    if (!cleaned) return null;
    const parsed = Math.min(max, Math.max(min, Number.parseInt(cleaned, 10)));
    return Number.isFinite(parsed) ? parsed : null;
  }

  onMoneyKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLInputElement | null;
    if (target && (event.key === '.' || event.key === ',')) {
      const current = target.value ?? '';
      const selectionStart = target.selectionStart ?? 0;
      const selectionEnd = target.selectionEnd ?? 0;
      const hasSelection = selectionStart !== selectionEnd;

      if (current.trim().length === 0 || hasSelection) {
        event.preventDefault();
        target.value = '0.';
        target.dispatchEvent(new Event('input', { bubbles: true }));
        queueMicrotask(() => {
          const caret = target.value.length;
          try { target.setSelectionRange(caret, caret); } catch { /* ignore */ }
        });
        return;
      }
    }

    const allowedKeys = new Set([
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'Shift', 'Control', 'Alt', 'Meta',
    ]);
    if (allowedKeys.has(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;

    if (/^[0-9]$/.test(event.key)) return;
    if (event.key === '.' || event.key === ',') return;

    event.preventDefault();
  }

  onMoneyInput(value: string, field: 'sale' | 'cost'): void {
    const normalized = this.normalizeDecimal(value);
    const parsed = normalized === '' ? null : Number(normalized);
    if (field === 'sale') this.formSalePrice.set(parsed);
    else this.formCostPrice.set(parsed);
  }

  onMoneyPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!/^\s*[0-9.,]+\s*$/.test(text)) {
      event.preventDefault();
    }
  }

  onStockKeyDown(event: KeyboardEvent): void {
    const allowedKeys = new Set([
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'Shift', 'Control', 'Alt', 'Meta',
    ]);
    if (allowedKeys.has(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (/^[0-9]$/.test(event.key)) return;
    event.preventDefault();
  }

  onStockInput(value: string): void {
    const parsed = this.normalizeInteger(value, 0, 1000);
    this.formInitialStock.set(parsed);
  }

  onStockPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!/^\s*\d+\s*$/.test(text)) {
      event.preventDefault();
    }
  }

  formatCurrency(value: number): string {
    const locale = this.locale === 'es' ? 'es-EC' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(Number.isFinite(value) ? value : 0);
  }

  private normalizeDecimal(value: string): string {
    const raw = String(value ?? '').replace(/,/g, '.').replace(/[^0-9.]/g, '');
    if (!raw) return '';

    const parts = raw.split('.');
    const integer = parts[0] || '0';
    const fraction = parts.slice(1).join('').slice(0, 2);
    return fraction.length > 0 ? `${integer}.${fraction}` : integer;
  }

  private syncEditState(product: ProductEntity): void {
    this.formCode.set(product.code);
    this.formName.set(product.name);
    this.formDescription.set(product.description ?? '');
    this.formSalePrice.set(product.salePrice);
    this.formCostPrice.set(product.costPrice);
    this.formInitialStock.set(null);
    this.formCategoryId.set(product.categoryId);
    this.setInitialSnapshot({
      code: product.code,
      name: product.name,
      description: product.description ?? '',
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      initialStock: null,
      categoryId: product.categoryId,
    });
  }

  private syncCreateState(): void {
    this.formCode.set(this.initialCode);
    this.formName.set('');
    this.formDescription.set('');
    this.formSalePrice.set(null);
    this.formCostPrice.set(null);
    this.formInitialStock.set(0);
    this.formCategoryId.set('');
    this.setInitialSnapshot({
      code: this.initialCode,
      name: '',
      description: '',
      salePrice: null,
      costPrice: null,
      initialStock: 0,
      categoryId: '',
    });
  }

  private setInitialSnapshot(snapshot: {
    code: string;
    name: string;
    description: string;
    salePrice: number | null;
    costPrice: number | null;
    initialStock: number | null;
    categoryId: string;
  }): void {
    this.initialCodeSnapshot.set(snapshot.code);
    this.initialNameSnapshot.set(snapshot.name.trim());
    this.initialDescriptionSnapshot.set(snapshot.description.trim());
    this.initialSalePriceSnapshot.set(snapshot.salePrice);
    this.initialCostPriceSnapshot.set(snapshot.costPrice);
    this.initialStockSnapshot.set(snapshot.initialStock);
    this.initialCategorySnapshot.set(snapshot.categoryId);
  }

  private resetForm(): void {
    this.formCode.set(this.initialCode);
    this.formName.set('');
    this.formDescription.set('');
    this.formSalePrice.set(null);
    this.formCostPrice.set(null);
    this.formInitialStock.set(0);
    this.formCategoryId.set('');
  }
}
