import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'billflow-notification-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button type="button" class="app-dashboard-notification-button relative bg-surface-container-lowest border border-outline-variant/60 hover:bg-surface-container-low transition-colors text-on-surface shadow-sm hover:shadow overflow-hidden" style="border-radius:9999px;" (click)="clicked.emit()">
      <span class="material-symbols-outlined text-[22px]">notifications</span>
      <span *ngIf="showBadge" class="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-white overflow-hidden"></span>
    </button>
  `,
})
export class BillflowNotificationButtonComponent {
  @Input() showBadge = true;
  @Output() clicked = new EventEmitter<void>();
}
