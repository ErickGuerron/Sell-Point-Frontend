import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

type AuditLocale = 'es' | 'en';

@Component({
  selector: 'billflow-audit-summary-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <!-- Actions Today -->
      <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
        <div class="absolute -right-4 -bottom-4 text-primary/5 dark:text-primary/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
          <span class="material-symbols-outlined text-[96px] font-light">history</span>
        </div>
        <div class="flex items-center gap-4">
          <div class="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 shadow-sm">
            <span class="material-symbols-outlined text-[24px]">history</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ actionsTodayLabel }}</p>
            <h3 class="text-2xl font-bold text-on-background mt-1">{{ actionsToday }}</h3>
          </div>
        </div>
      </div>

      <!-- Active Users -->
      <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
        <div class="absolute -right-4 -bottom-4 text-[#10b981]/5 dark:text-[#10b981]/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
          <span class="material-symbols-outlined text-[96px] font-light">group</span>
        </div>
        <div class="flex items-center gap-4">
          <div class="h-12 w-12 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center border border-[#10b981]/20 shrink-0 shadow-sm">
            <span class="material-symbols-outlined text-[24px]">group</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ activeUsersLabel }}</p>
            <h3 class="text-2xl font-bold text-on-background mt-1">{{ activeUsers }}</h3>
          </div>
        </div>
      </div>

      <!-- Top Modified Table -->
      <div class="dashboard-glass-card p-5 rounded-2xl border border-outline-variant/40 bg-surface/40 backdrop-blur-xl relative overflow-hidden group hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
        <div class="absolute -right-4 -bottom-4 text-[#f59e0b]/5 dark:text-[#f59e0b]/10 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
          <span class="material-symbols-outlined text-[96px] font-light">table_chart</span>
        </div>
        <div class="flex items-center gap-4">
          <div class="h-12 w-12 rounded-xl bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center border border-[#f59e0b]/20 shrink-0 shadow-sm">
            <span class="material-symbols-outlined text-[24px]">table_chart</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-outline uppercase tracking-wider">{{ topModifiedTableLabel }}</p>
            <h3 class="text-2xl font-bold text-on-background mt-1">{{ topModifiedTable }}</h3>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AuditSummaryCardsComponent {
  @Input({ required: true }) actionsToday = 0;
  @Input({ required: true }) activeUsers = 0;
  @Input({ required: true }) topModifiedTable = '—';
  @Input({ required: true }) actionsTodayLabel = '';
  @Input({ required: true }) activeUsersLabel = '';
  @Input({ required: true }) topModifiedTableLabel = '';
}
