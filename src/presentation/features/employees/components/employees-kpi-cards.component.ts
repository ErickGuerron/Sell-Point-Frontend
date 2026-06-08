import { CommonModule } from '@angular/common';
import { Component, computed, Input, signal } from '@angular/core';

type EmployeesLocale = 'es' | 'en';

interface EmployeesKpiCardsCopy {
  totalLabel: string;
  activeLabel: string;
  inactiveLabel: string;
  blockedLabel: string;
}

const KPI_COPY: Record<EmployeesLocale, EmployeesKpiCardsCopy> = {
  es: { totalLabel: 'Total de Empleados', activeLabel: 'Activos', inactiveLabel: 'Inactivos', blockedLabel: 'Bloqueados' },
  en: { totalLabel: 'Total Employees', activeLabel: 'Active', inactiveLabel: 'Inactive', blockedLabel: 'Blocked' },
};

@Component({
  selector: 'billflow-employees-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
        <div class="absolute -right-4 -bottom-4 text-primary/5 dark:text-primary/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
          <span class="material-symbols-outlined text-[96px] font-light">badge</span>
        </div>
        <div class="flex items-center gap-4">
          <div class="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 shadow-sm">
            <span class="material-symbols-outlined text-[24px]">badge</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ copy().totalLabel }}</p>
            <h3 class="text-2xl font-bold text-on-background mt-1">{{ total }}</h3>
          </div>
        </div>
      </div>

      <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
        <div class="absolute -right-4 -bottom-4 text-[#10b981]/5 dark:text-[#10b981]/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
          <span class="material-symbols-outlined text-[96px] font-light">check_circle</span>
        </div>
        <div class="flex items-center gap-4">
          <div class="h-12 w-12 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center border border-[#10b981]/20 shrink-0 shadow-sm">
            <span class="material-symbols-outlined text-[24px]">check_circle</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ copy().activeLabel }}</p>
            <h3 class="text-2xl font-bold text-on-background mt-1">{{ active }}</h3>
          </div>
        </div>
      </div>

      <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
        <div class="absolute -right-4 -bottom-4 text-[#f59e0b]/5 dark:text-[#f59e0b]/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
          <span class="material-symbols-outlined text-[96px] font-light">pause_circle</span>
        </div>
        <div class="flex items-center gap-4">
          <div class="h-12 w-12 rounded-xl bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center border border-[#f59e0b]/20 shrink-0 shadow-sm">
            <span class="material-symbols-outlined text-[24px]">pause_circle</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ copy().inactiveLabel }}</p>
            <h3 class="text-2xl font-bold text-on-background mt-1">{{ inactive }}</h3>
          </div>
        </div>
      </div>

      <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
        <div class="absolute -right-4 -bottom-4 text-error/5 dark:text-error/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
          <span class="material-symbols-outlined text-[96px] font-light">lock</span>
        </div>
        <div class="flex items-center gap-4">
          <div class="h-12 w-12 rounded-xl bg-error/10 text-error flex items-center justify-center border border-error/20 shrink-0 shadow-sm">
            <span class="material-symbols-outlined text-[24px]">lock</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ copy().blockedLabel }}</p>
            <h3 class="text-2xl font-bold text-on-background mt-1">{{ blocked }}</h3>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class EmployeesKpiCardsComponent {
  @Input({ required: true }) locale!: 'es' | 'en';
  @Input({ required: true }) total!: number;
  @Input({ required: true }) active!: number;
  @Input({ required: true }) inactive!: number;
  @Input({ required: true }) blocked!: number;

  private readonly localeState = signal<EmployeesLocale>('es');

  ngOnInit() {
    this.localeState.set(this.locale === 'en' ? 'en' : 'es');
  }

  readonly copy = computed<KpiCardsCopy>(() => KPI_COPY[this.localeState()]);
}

type KpiCardsCopy = EmployeesKpiCardsCopy;