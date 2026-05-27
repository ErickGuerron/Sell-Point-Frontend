import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'billflow-category-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="grid grid-cols-2 gap-4 mb-6">
      <!-- Total Categories -->
      <div
        class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300"
      >
        <div
          class="absolute -right-4 -bottom-4 text-primary/5 dark:text-primary/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none"
        >
          <span class="material-symbols-outlined text-[96px] font-light">category</span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 shadow-sm"
          >
            <span class="material-symbols-outlined text-[24px]">category</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-outline uppercase tracking-wider">
              {{ totalLabel() }}
            </p>
            <h3 class="text-2xl font-bold text-on-background mt-1">{{ total() }}</h3>
          </div>
        </div>
      </div>

      <!-- Active Categories -->
      <div
        class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300"
      >
        <div
          class="absolute -right-4 -bottom-4 text-emerald-500/5 dark:text-emerald-500/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none"
        >
          <span class="material-symbols-outlined text-[96px] font-light">check_circle</span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0 shadow-sm"
          >
            <span class="material-symbols-outlined text-[24px]">check_circle</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-outline uppercase tracking-wider">
              {{ activeLabel() }}
            </p>
            <h3 class="text-2xl font-bold text-on-background mt-1">{{ active() }}</h3>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class CategoryKpiCardsComponent {
  totalLabel = input.required<string>();
  activeLabel = input.required<string>();
  total = input.required<number>();
  active = input.required<number>();
}
