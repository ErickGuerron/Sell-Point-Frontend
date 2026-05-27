import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import type { ProductEntity } from '../domain/product.entity';
import type { ProductsCopy } from '../i18n/products.translations';

@Component({
  selector: 'billflow-product-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-x-auto">
      <table class="min-w-max w-full border-collapse text-left">
        <thead>
          <tr class="dashboard-table-card__head-row font-label-bold text-[11px] uppercase tracking-[0.1em]">
            <th class="dashboard-table-card__th p-4 pl-7 font-semibold">{{ copy.code }}</th>
            <th class="dashboard-table-card__th p-4 font-semibold">{{ copy.name }}</th>
            <th class="dashboard-table-card__th p-4 font-semibold">{{ copy.category }}</th>
            <th class="dashboard-table-card__th p-4 font-semibold text-right">{{ copy.salePrice }}</th>
            <th class="dashboard-table-card__th p-4 font-semibold text-right">{{ copy.costPrice }}</th>
            <th class="dashboard-table-card__th p-4 font-semibold text-right">{{ copy.stock }}</th>
            <th class="dashboard-table-card__th p-4 font-semibold">{{ copy.status }}</th>
            <th class="dashboard-table-card__th p-4 pr-7 font-semibold text-right">{{ copy.actions }}</th>
          </tr>
        </thead>

        <tbody class="font-body-sm text-body-sm">
          <!-- Loading state -->
          <tr *ngIf="loading">
            <td colspan="8" class="p-8 text-center text-on-surface-variant">
              <span class="material-symbols-outlined text-[24px] animate-spin">refresh</span>
            </td>
          </tr>

          <!-- Table rows -->
          <ng-container *ngIf="!loading">
            <tr
              *ngFor="let product of products; trackBy: trackById"
              class="dashboard-table-card__row group border-b border-outline-variant/20 hover:bg-surface-container-low/40 transition-colors duration-200"
              [ngClass]="!product.isActive ? 'opacity-70 bg-surface-container-lowest/20' : ''"
            >
              <td class="p-4 pl-7 font-mono font-bold text-primary">
                {{ product.code }}
              </td>
              <td class="p-4 font-semibold text-on-background">
                <div>
                  <div class="font-semibold text-on-background">{{ product.name }}</div>
                  <div class="text-[11px] text-outline mt-0.5 font-normal max-w-[250px] truncate" [title]="product.description ?? ''">
                    {{ product.description || '—' }}
                  </div>
                </div>
              </td>
              <td class="p-4">
                <span class="rounded-full bg-surface-container-high px-2.5 py-1 text-xs text-on-surface font-medium border border-outline-variant/40">
                  {{ product.categoryName }}
                </span>
              </td>
              <td class="p-4 text-right font-medium text-on-surface">
                {{ formatMoney(product.salePrice) }}
              </td>
              <td class="p-4 text-right font-medium text-outline">
                {{ formatMoney(product.costPrice) }}
              </td>
              <td class="p-4 text-right font-semibold">
                <span [ngClass]="product.currentStock <= 0 ? 'text-error' : product.currentStock <= 5 ? 'text-amber-500' : 'text-tertiary'">
                  {{ product.currentStock }}
                </span>
              </td>
              <td class="p-4">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide"
                  [ngClass]="product.isActive ? 'border-primary/20 bg-primary/10 text-primary shadow-sm shadow-primary/5' : 'border-outline-variant/40 bg-surface-container-high text-on-surface-variant'"
                >
                  <span class="h-1.5 w-1.5 rounded-full" [ngClass]="product.isActive ? 'bg-primary animate-pulse' : 'bg-outline'"></span>
                  {{ product.isActive ? (locale === 'es' ? 'ACTIVO' : 'ACTIVE') : (locale === 'es' ? 'INACTIVO' : 'INACTIVE') }}
                </span>
              </td>
              <td class="p-4 pr-7 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <!-- History (Movements) Button -->
                  <button
                    type="button"
                    [title]="copy.viewHistory"
                    class="inline-flex h-8 w-8 items-center justify-center bg-[#10b981] text-white rounded-lg shadow-sm transition-all duration-200 hover:bg-[#059669] active:scale-90 cursor-pointer"
                    (click)="viewMovements.emit(product)"
                  >
                    <span class="material-symbols-outlined text-[18px]">history</span>
                  </button>

                  <!-- Edit Button -->
                  <button
                    type="button"
                    [title]="copy.edit"
                    class="inline-flex h-8 w-8 items-center justify-center bg-primary text-on-primary rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer"
                    (click)="edit.emit(product)"
                  >
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>

                  <!-- Deactivate / Activate Button -->
                  <button
                    type="button"
                    [title]="product.isActive ? copy.deactivate : copy.activate"
                    class="inline-flex h-8 w-8 items-center justify-center text-white rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer"
                    [ngClass]="product.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:opacity-85'"
                    (click)="toggleActive.emit(product)"
                  >
                    <span class="material-symbols-outlined text-[18px]">{{ product.isActive ? 'close' : 'check' }}</span>
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty state -->
            <tr *ngIf="products.length === 0">
              <td colspan="8" class="p-8">
                <div class="dashboard-table-card__empty dashboard-table-card__empty--stacked mt-2">
                  <span class="material-symbols-outlined dashboard-table-card__empty-icon">inventory_2</span>
                  <p class="dashboard-table-card__empty-title">{{ copy.noProductsTitle }}</p>
                  <p class="dashboard-table-card__empty-text">{{ copy.noProductsText }}</p>
                </div>
              </td>
            </tr>
          </ng-container>
        </tbody>
      </table>
    </div>
  `,
})
export class ProductTableComponent {
  @Input({ required: true }) products: ProductEntity[] = [];
  @Input({ required: true }) loading = false;
  @Input({ required: true }) locale = 'es';
  @Input({ required: true }) copy!: ProductsCopy;

  @Output() edit = new EventEmitter<ProductEntity>();
  @Output() toggleActive = new EventEmitter<ProductEntity>();
  @Output() viewMovements = new EventEmitter<ProductEntity>();

  trackById(_index: number, product: ProductEntity): string {
    return product.id;
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
      Number.isFinite(Number(value)) ? Number(value) : 0
    );
  }
}
