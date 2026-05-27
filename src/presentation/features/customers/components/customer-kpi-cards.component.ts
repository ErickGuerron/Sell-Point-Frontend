import { Component, Input, inject } from '@angular/core';
import { LocaleService } from '../../../shared/services/locale.service';

@Component({
  selector: 'billflow-customer-kpi-cards',
  standalone: true,
  template: `
    <section class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <!-- Card 1: Total Clientes -->
      <div
        class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300"
      >
        <div
          class="absolute -right-4 -bottom-4 text-primary/5 dark:text-primary/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none"
        >
          <span class="material-symbols-outlined text-[96px] font-light">groups</span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 shadow-sm"
          >
            <span class="material-symbols-outlined text-[24px]">groups</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-outline uppercase tracking-wider">
              {{ locale() === 'es' ? 'Total de Clientes' : 'Total Customers' }}
            </p>
            <h3 class="text-2xl font-bold text-on-background mt-1">{{ total }}</h3>
          </div>
        </div>
      </div>

      <!-- Card 2: Clientes Activos -->
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
              {{ locale() === 'es' ? 'Activos' : 'Active' }}
            </p>
            <h3 class="text-2xl font-bold text-on-background mt-1">{{ active }}</h3>
          </div>
        </div>
      </div>

      <!-- Card 3: Clientes Inactivos -->
      <div
        class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300"
      >
        <div
          class="absolute -right-4 -bottom-4 text-error/5 dark:text-error/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none"
        >
          <span class="material-symbols-outlined text-[96px] font-light">block</span>
        </div>
        <div class="flex items-center gap-4">
          <div
            class="h-12 w-12 rounded-xl bg-error/10 text-error flex items-center justify-center border border-error/20 shrink-0 shadow-sm"
          >
            <span class="material-symbols-outlined text-[24px]">block</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-outline uppercase tracking-wider">
              {{ locale() === 'es' ? 'Inactivos' : 'Inactive' }}
            </p>
            <h3 class="text-2xl font-bold text-on-background mt-1">{{ inactive }}</h3>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class CustomerKpiCardsComponent {
  private readonly localeService = inject(LocaleService);
  protected readonly locale = this.localeService.locale;

  @Input({ required: true }) total = 0;
  @Input({ required: true }) active = 0;
  @Input({ required: true }) inactive = 0;
}
