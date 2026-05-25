import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BillflowSidebarComponent, type BillflowSidebarItem } from './billflow-sidebar.component';

@Component({
  selector: 'billflow-page-shell',
  standalone: true,
  imports: [CommonModule, BillflowSidebarComponent],
  template: `
    <div class="app-dashboard-shell min-h-screen bg-background text-on-background transition-colors duration-300">
      <div class="flex min-h-screen">
        <billflow-sidebar [items]="items" [actionLabel]="actionLabel" [actionIcon]="actionIcon" (actionClick)="actionClick.emit()"></billflow-sidebar>
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class BillflowPageShellComponent {
  @Input({ required: true }) items: BillflowSidebarItem[] = [];
  @Input({ required: true }) actionLabel = '';
  @Input() actionIcon = 'add';
  @Output() actionClick = new EventEmitter<void>();
}
