import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { BillflowSidebarComponent, type BillflowSidebarItem } from './billflow-sidebar.component';

@Component({
  selector: 'billflow-mobile-sidebar',
  standalone: true,
  imports: [CommonModule, BillflowSidebarComponent],
  template: `
    <div class="relative lg:hidden">
      <button type="button" class="app-dashboard-tablet-menu inline-flex shrink-0 mt-1" aria-label="Abrir menú" [attr.aria-expanded]="open()" (click)="toggle()">
        <span class="material-symbols-outlined">menu</span>
      </button>

      <div *ngIf="open()" class="app-dashboard-tablet-drawer lg:hidden">
        <button type="button" class="app-dashboard-tablet-drawer__backdrop" aria-label="Cerrar menú" (click)="close()"></button>
        <aside class="app-dashboard-tablet-drawer__panel app-dashboard-tablet-drawer__panel--open">
          <div class="app-dashboard-tablet-drawer__header">
            <div class="flex items-center gap-3 min-w-0">
              <span class="material-symbols-outlined text-primary text-[30px] filter drop-shadow-sm" style="font-variation-settings: 'FILL' 1;">point_of_sale</span>
              <div class="min-w-0">
                <h1 class="text-2xl font-black text-primary tracking-tight">BillFlow</h1>
                <p class="app-dashboard-tablet-drawer__subtitle text-[10px] uppercase tracking-[0.2em] font-bold mt-0.5">POS Terminal</p>
              </div>
            </div>
            <button type="button" class="app-dashboard-tablet-drawer__close" aria-label="Cerrar menú" (click)="close()">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="app-dashboard-tablet-drawer__nav space-y-1.5">
            <a *ngFor="let item of items" [href]="item.href" class="app-dashboard-tablet-drawer__link flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-95 app-dashboard-nav-link" [ngClass]="item.active ? 'bg-primary/10 text-primary font-bold app-dashboard-nav-link--active' : 'font-medium'" (click)="close()">
              <span class="material-symbols-outlined" [style.font-variation-settings]="iconSettings(item.active)">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          </div>

          <div class="app-dashboard-tablet-drawer__actions">
            <button type="button" class="w-full py-3.5 px-4 bg-[#6862f3] text-white rounded-xl font-bold hover:bg-[#514be6] hover:shadow-lg hover:shadow-[#6862f3]/20 active:scale-95 transition-all flex items-center justify-center gap-2" (click)="emitAction()">
              <span class="material-symbols-outlined text-[20px]">{{ actionIcon }}</span>
              {{ actionLabel }}
            </button>
          </div>
        </aside>
      </div>
    </div>
  `,
})
export class BillflowMobileSidebarComponent {
  @Input({ required: true }) items: BillflowSidebarItem[] = [];
  @Input({ required: true }) actionLabel = '';
  @Input() actionIcon = 'add';
  @Output() actionClick = new EventEmitter<void>();

  readonly open = signal(false);

  toggle() {
    this.open.update((value) => !value);
  }

  close() {
    this.open.set(false);
  }

  emitAction() {
    this.actionClick.emit();
    this.close();
  }

  iconSettings(active = false) {
    return active ? "'FILL' 1" : "'FILL' 0";
  }
}
