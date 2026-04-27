import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface BillflowSidebarItem {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}

@Component({
  selector: 'billflow-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="hidden lg:flex app-dashboard-sidebar">
      <div class="mb-10 flex items-center gap-3 px-2">
        <span class="material-symbols-outlined text-primary text-[32px] filter drop-shadow-sm" style="font-variation-settings: 'FILL' 1;">point_of_sale</span>
        <div>
          <h1 class="text-2xl font-black text-primary tracking-tight">BillFlow</h1>
          <p class="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-0.5">POS Terminal</p>
        </div>
      </div>

      <div class="flex-1 space-y-1.5">
        <a
          *ngFor="let item of items"
          [href]="item.href"
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-95 app-dashboard-nav-link"
          [ngClass]="item.active ? 'bg-primary/10 text-primary font-bold app-dashboard-nav-link--active' : 'font-medium'"
        >
          <span class="material-symbols-outlined" [style.font-variation-settings]="iconSettings(item.active)">{{ item.icon }}</span>
          {{ item.label }}
        </a>
      </div>

      <div class="mt-auto pt-6">
        <button type="button" class="w-full py-3.5 px-4 bg-[#6862f3] text-white rounded-xl font-bold hover:bg-[#514be6] hover:shadow-lg hover:shadow-[#6862f3]/20 active:scale-95 transition-all flex items-center justify-center gap-2" (click)="actionClick.emit()">
          <span class="material-symbols-outlined text-[20px]">{{ actionIcon }}</span>
          {{ actionLabel }}
        </button>
      </div>
    </aside>
  `,
})
export class BillflowSidebarComponent {
  @Input({ required: true }) items: BillflowSidebarItem[] = [];
  @Input({ required: true }) actionLabel = '';
  @Input() actionIcon = 'add';
  @Output() actionClick = new EventEmitter<void>();

  iconSettings(active = false) {
    return active ? "'FILL' 1" : "'FILL' 0";
  }
}
