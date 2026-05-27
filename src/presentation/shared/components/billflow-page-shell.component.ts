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
        <billflow-sidebar
          [items]="items"
          [locale]="locale"
          (settingsClicked)="settings.emit()"
          (logoutClicked)="logout.emit()"
        ></billflow-sidebar>
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class BillflowPageShellComponent {
  @Input({ required: true }) items: BillflowSidebarItem[] = [];
  @Input() locale = 'en';
  @Output() settings = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
}
