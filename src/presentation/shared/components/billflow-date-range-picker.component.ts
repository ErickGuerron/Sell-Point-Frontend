import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'billflow-date-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-row items-center gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-label-bold uppercase tracking-[0.1em] text-on-surface-variant">
          {{ fromLabel }}
        </label>
        <div class="relative flex items-center">
          <span class="material-symbols-outlined absolute left-3 text-[16px] text-outline-variant pointer-events-none">calendar_month</span>
          <input
            type="date"
            class="bg-surface-container-lowest border border-outline-variant/60 rounded-lg pl-10 pr-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm w-36"
            [value]="fromDate || ''"
            (change)="onFromChange($event)"
          />
        </div>
      </div>

      <span class="text-outline-variant mt-5">—</span>

      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-label-bold uppercase tracking-[0.1em] text-on-surface-variant">
          {{ toLabel }}
        </label>
        <div class="relative flex items-center">
          <span class="material-symbols-outlined absolute left-3 text-[16px] text-outline-variant pointer-events-none">calendar_month</span>
          <input
            type="date"
            class="bg-surface-container-lowest border border-outline-variant/60 rounded-lg pl-10 pr-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm w-36"
            [value]="toDate || ''"
            (change)="onToChange($event)"
          />
        </div>
      </div>
    </div>
  `,
})
export class BillflowDateRangePickerComponent {
  @Input() fromDate: string | null = null;
  @Input() toDate: string | null = null;
  @Input() fromLabel = 'Desde';
  @Input() toLabel = 'Hasta';

  @Output() fromDateChange = new EventEmitter<string | null>();
  @Output() toDateChange = new EventEmitter<string | null>();

  onFromChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fromDateChange.emit(value || null);
  }

  onToChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.toDateChange.emit(value || null);
  }
}