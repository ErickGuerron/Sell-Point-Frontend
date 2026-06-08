import { CommonModule } from '@angular/common';
import { Component, input, output, computed } from '@angular/core';
import type { CategoryEntity } from '../domain/category.entity';
import type { CategoriesCopy } from '../i18n/categories.translations';

@Component({
  selector: 'billflow-category-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-x-auto">
      <table class="min-w-max w-full border-collapse text-left">
        <thead>
          <tr class="dashboard-table-card__head-row font-label-bold text-[11px] uppercase tracking-[0.1em]">
            <th class="dashboard-table-card__th p-4 pl-7 font-semibold">{{ copy().name }}</th>
            <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().descriptionLabel }}</th>
            <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().status }}</th>
            <th class="dashboard-table-card__th p-4 pr-7 font-semibold text-right">{{ copy().actions }}</th>
          </tr>
        </thead>

        <tbody class="font-body-sm text-body-sm">
          @for (cat of categories(); track cat.id) {
            <tr
              class="dashboard-table-card__row group border-b border-outline-variant/20 hover:bg-surface-container-low/40 transition-colors duration-200"
              [class.opacity-70]="!cat.isActive"
              [class.bg-surface-container-lowest/20]="!cat.isActive"
            >
              <td class="p-4 pl-7 font-semibold text-on-background">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-[18px]">category</span>
                  </div>
                  <span class="font-semibold">{{ cat.name }}</span>
                </div>
              </td>
              <td class="p-4">
                <span
                  class="text-sm text-on-surface-variant max-w-[300px] truncate block"
                  [title]="cat.description ?? ''"
                >
                  {{ cat.description || '—' }}
                </span>
              </td>
              <td class="p-4">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide"
                  [class.border-primary/20]="cat.isActive"
                  [class.bg-primary/10]="cat.isActive"
                  [class.text-primary]="cat.isActive"
                  [class.shadow-sm]="cat.isActive"
                  [class.shadow-primary/5]="cat.isActive"
                  [class.border-outline-variant/40]="!cat.isActive"
                  [class.bg-surface-container-high]="!cat.isActive"
                  [class.text-on-surface-variant]="!cat.isActive"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    [class.bg-primary]="cat.isActive"
                    [class.animate-pulse]="cat.isActive"
                    [class.bg-outline]="!cat.isActive"
                  ></span>
                  {{ cat.isActive ? statusActive() : statusInactive() }}
                </span>
              </td>
              <td class="p-4 pr-7 text-right">
                @if (isAdmin()) {
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- Edit -->
                    <button
                      type="button"
                      [title]="copy().edit"
                      class="inline-flex h-8 w-8 items-center justify-center bg-primary text-on-primary rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer"
                      (click)="edit.emit(cat)"
                    >
                      <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>

                    <!-- Toggle Active -->
                    <button
                      type="button"
                      [title]="cat.isActive ? copy().deactivate : copy().activate"
                      class="inline-flex h-8 w-8 items-center justify-center text-white rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer"
                      [class.bg-red-600]="cat.isActive"
                      [class.hover:bg-red-700]="cat.isActive"
                      [class.bg-primary]="!cat.isActive"
                      (click)="toggle.emit(cat)"
                    >
                      <span class="material-symbols-outlined text-[18px]">
                        {{ cat.isActive ? 'close' : 'check' }}
                      </span>
                    </button>
                  </div>
                }
              </td>
            </tr>
          } @empty {
            @if (!loading()) {
              <tr>
                <td colspan="4" class="p-8">
                  <div class="dashboard-table-card__empty dashboard-table-card__empty--stacked mt-2">
                    <span class="material-symbols-outlined dashboard-table-card__empty-icon">category</span>
                    <p class="dashboard-table-card__empty-title">{{ copy().noCategoriesTitle }}</p>
                    <p class="dashboard-table-card__empty-text">{{ copy().noCategoriesText }}</p>
                  </div>
                </td>
              </tr>
            } @else {
              <tr>
                <td colspan="4" class="p-12 text-center text-on-surface-variant">
                  <span class="material-symbols-outlined text-[32px] animate-spin inline-block">refresh</span>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
})
export class CategoryTableComponent {
  copy = input.required<CategoriesCopy>();
  categories = input.required<CategoryEntity[]>();
  loading = input.required<boolean>();
  statusActive = input.required<string>();
  statusInactive = input.required<string>();
  isAdmin = input<boolean>(false);

  edit = output<CategoryEntity>();
  toggle = output<CategoryEntity>();
}
