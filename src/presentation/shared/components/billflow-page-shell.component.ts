import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BillflowSidebarComponent, type BillflowSidebarItem } from './billflow-sidebar.component';
import { KeyboardShortcutsModalComponent } from './keyboard-shortcuts-modal.component';

@Component({
  selector: 'billflow-page-shell',
  standalone: true,
  imports: [CommonModule, BillflowSidebarComponent, KeyboardShortcutsModalComponent],
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
    <keyboard-shortcuts-modal></keyboard-shortcuts-modal>
  `,
})
export class BillflowPageShellComponent {
  @Input({ required: true }) items: BillflowSidebarItem[] = [];
  @Input() locale = 'en';
  @Output() settings = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
}
