import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'billflow-product-kpi-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <!-- Total Products -->
      <div
        class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300"
      >
        <div
          class="absolute -right-4 -bottom-4 text-primary/5 dark:text-primary/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none"
        >
          <span class="material-symbols-outlined text-[96px] font-light">inventory_2</span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 shadow-sm"
          >
            <span class="material-symbols-outlined text-[24px]">inventory_2</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-outline uppercase tracking-wider">
              {{ locale === 'es' ? 'Total Productos' : 'Total Products' }}
            </p>
            <h3 class="text-2xl font-bold text-on-background mt-1">{{ totalProducts }}</h3>
          </div>
        </div>
      </div>

      <!-- Active Products -->
      <div
        class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300"
      >
        <div
          class="absolute -right-4 -bottom-4 text-[#10b981]/5 dark:text-[#10b981]/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none"
        >
          <span class="material-symbols-outlined text-[96px] font-light">check_circle</span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="h-12 w-12 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center border border-[#10b981]/20 shrink-0 shadow-sm"
          >
            <span class="material-symbols-outlined text-[24px]">check_circle</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-outline uppercase tracking-wider">
              {{ locale === 'es' ? 'Activos' : 'Active' }}
            </p>
            <h3 class="text-2xl font-bold text-on-background mt-1">{{ activeCount }}</h3>
          </div>
        </div>
      </div>

      <!-- Low / Out of Stock -->
      <div
        class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300 col-span-2 lg:col-span-1"
      >
        <div
          class="absolute -right-4 -bottom-4 text-error/5 dark:text-error/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none"
        >
          <span class="material-symbols-outlined text-[96px] font-light">warning</span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="h-12 w-12 rounded-xl bg-error/10 text-error flex items-center justify-center border border-error/20 shrink-0 shadow-sm"
          >
            <span class="material-symbols-outlined text-[24px]">warning</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-outline uppercase tracking-wider">
              {{ locale === 'es' ? 'Bajo / Sin Stock' : 'Low / Out of Stock' }}
            </p>
            <h3 class="text-2xl font-bold text-on-background mt-1">{{ lowStockCount }}</h3>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class ProductKpiCardsComponent {
  @Input({ required: true }) totalProducts = 0;
  @Input({ required: true }) activeCount = 0;
  @Input({ required: true }) lowStockCount = 0;
  @Input({ required: true }) locale = 'es';
}
