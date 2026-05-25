import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'billflow-modal-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      (click)="onBackdropClick()"
    >
      <!-- Backdrop con Glassmorphism -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"></div>

      <!-- Modal Panel -->
      <div 
        class="relative z-10 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/50 flex flex-col overflow-hidden max-h-[90vh] transition-all duration-200 animate-in zoom-in-95 fade-in"
        [ngClass]="maxWidthClass"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface/60 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center" *ngIf="icon">
              <span class="material-symbols-outlined text-primary text-[20px]">{{ icon }}</span>
            </div>
            <div>
              <h3 class="text-base font-bold text-on-surface leading-tight">{{ title }}</h3>
              <p class="text-xs text-on-surface-variant mt-0.5" *ngIf="subtitle">
                {{ subtitle }}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            class="w-8 h-8 flex items-center justify-center rounded-lg text-outline hover:bg-surface-container hover:text-on-surface transition-all" 
            (click)="onClose()"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Content (flex-1 + min-h-0 = fill remaining space and scroll) -->
        <div class="flex-1 min-h-0 overflow-y-auto">
          <ng-content></ng-content>
        </div>

        <!-- Footer Slot -->
        <div class="px-6 py-4 border-t border-outline-variant/40 bg-surface/60 flex items-center justify-between flex-shrink-0" *ngIf="hasFooter">
          <ng-content select="[footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class BillflowModalShellComponent {
  @Input({ required: true }) isOpen = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
  @Input() maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '//' = 'md';
  @Input() hasFooter = false;

  @Output() close = new EventEmitter<void>();

  get maxWidthClass() {
    const map = {
      'sm': 'max-w-md',
      'md': 'max-w-2xl',
      'lg': 'max-w-4xl',
      'xl': 'max-w-6xl',
      '//': 'w-full'
    };
    return map[this.maxWidth] || map['md'];
  }

  onBackdropClick() {
    this.close.emit();
  }

  onClose() {
    this.close.emit();
  }
}
