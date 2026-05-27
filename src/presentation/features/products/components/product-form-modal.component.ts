import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  effect,
  signal,
  ChangeDetectionStrategy,
  type Signal,
} from '@angular/core';
import { BillflowModalShellComponent } from '../../../shared/components/billflow-modal-shell.component';
import { BillflowComboboxComponent, type ComboboxOption } from '../../../shared/components/billflow-combobox.component';
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
      *ngIf="open"
      title="{{ editingProduct ? copy.modalEditTitle : copy.modalCreateTitle }}"
      subtitle="{{ editingProduct ? copy.modalEditSubtitle : copy.modalCreateSubtitle }}"
      icon="inventory"
      maxWidth="xl"
      [hasFooter]="true"
      (close)="closeModal()"
    >
      <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- Code -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy.codeLabel }} <span class="text-error">*</span></label>
          <input
            type="text"
            class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            [maxLength]="50"
            placeholder="Ej: BEB-001"
            [ngModel]="formCode()"
            [disabled]="editingProduct !== null"
            (ngModelChange)="formCode.set($event.trim().toUpperCase())"
          />
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
            [maxLength]="255"
            placeholder="Ej: Coca Cola 1L"
            [ngModel]="formName()"
            (ngModelChange)="formName.set($event)"
          />
        </div>

        <!-- Description -->
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy.descriptionLabel }}</label>
          <textarea
            class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant resize-none h-20"
            placeholder="Ej: Bebida gaseosa refrescante sabor cola."
            [ngModel]="formDescription()"
            (ngModelChange)="formDescription.set($event)"
          ></textarea>
        </div>

        <!-- Cost Price -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy.costPriceLabel }} <span class="text-error">*</span></label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            placeholder="0.00"
            [ngModel]="formCostPrice()"
            (ngModelChange)="formCostPrice.set($event)"
          />
        </div>

        <!-- Sale Price -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy.salePriceLabel }} <span class="text-error">*</span></label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            placeholder="0.00"
            [ngModel]="formSalePrice()"
            (ngModelChange)="formSalePrice.set($event)"
          />
        </div>

        <!-- Initial Stock (Only for Creation) -->
        <div class="md:col-span-2" *ngIf="editingProduct === null">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy.initialStockLabel }}</label>
          <input
            type="number"
            min="0"
            class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            placeholder="0"
            [ngModel]="formInitialStock()"
            (ngModelChange)="formInitialStock.set($event)"
          />
        </div>
      </div>

      <div footer class="flex w-full items-center justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all border border-outline-variant/50"
          (click)="closeModal()"
        >
          {{ copy.cancel }}
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
          [disabled]="!formValid()"
          (click)="onSave()"
        >
          {{ editingProduct ? copy.saveEdit : copy.save }}
        </button>
      </div>
    </billflow-modal-shell>
  `,
})
export class ProductFormModalComponent {
  // ── Inputs ─────────────────────────────────────────────────────────────
  @Input({ required: true }) open = false;
  @Input() editingProduct: ProductEntity | null = null;
  @Input({ required: true }) categories: CategoryDto[] = [];
  @Input({ required: true }) locale = 'es';
  @Input({ required: true }) copy!: ProductsCopy;

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

  readonly formValid = computed(() =>
    this.formCode().trim().length > 0 &&
    this.formName().trim().length > 0 &&
    this.formCategoryId().trim().length > 0 &&
    this.formSalePrice() !== null && this.formSalePrice()! > 0 &&
    this.formCostPrice() !== null && this.formCostPrice()! > 0
  );

  readonly categorySelectOptions: Signal<ComboboxOption[]> = computed(() => [
    { value: '', label: this.copy.categorySelect },
    ...this.categories.map((c) => ({ value: c.id, label: c.name })),
  ]);

  // ── Sync form fields when `editingProduct` input changes ──────────────
  private readonly syncEffect = effect(() => {
    const product = this.editingProduct;
    if (product) {
      this.formCode.set(product.code);
      this.formName.set(product.name);
      this.formDescription.set(product.description ?? '');
      this.formSalePrice.set(product.salePrice);
      this.formCostPrice.set(product.costPrice);
      this.formInitialStock.set(null);
      this.formCategoryId.set(product.categoryId);
    } else if (this.open) {
      this.resetForm();
    }
  });

  // ── Modal control ──────────────────────────────────────────────────────
  closeModal(): void {
    this.close.emit();
    this.editingProduct = null;
    this.resetForm();
  }

  // ── Save ───────────────────────────────────────────────────────────────
  onSave(): void {
    if (!this.formValid()) return;

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
        code: this.formCode(),
        name: this.formName(),
        description: this.formDescription().trim() || undefined,
        salePrice: Number(this.formSalePrice()),
        costPrice: Number(this.formCostPrice()),
        initialStock: this.formInitialStock() !== null ? Number(this.formInitialStock()) : 0,
      };
      this.save.emit(payload);
    }
  }

  // ── Form helpers ──────────────────────────────────────────────────────
  private resetForm(): void {
    this.formCode.set('');
    this.formName.set('');
    this.formDescription.set('');
    this.formSalePrice.set(null);
    this.formCostPrice.set(null);
    this.formInitialStock.set(null);
    this.formCategoryId.set('');
  }
}
