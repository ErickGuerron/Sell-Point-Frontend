import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { BillflowComboboxComponent, type ComboboxOption } from '../../../shared/components/billflow-combobox.component';
import { BillflowDateRangePickerComponent } from '../../../shared/components/billflow-date-range-picker.component';

@Component({
  selector: 'billflow-audit-filter-bar',
  standalone: true,
  imports: [CommonModule, BillflowComboboxComponent, BillflowDateRangePickerComponent],
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <billflow-combobox
        [options]="tableOptions"
        [value]="tableName()"
        [placeholder]="allTablesLabel"
        searchPlaceholder="{{ filterTablePlaceholder }}"
        [compact]="true"
        (valueChange)="onTableChange($event)"
      ></billflow-combobox>

      <billflow-combobox
        [options]="actionOptions"
        [value]="action()"
        [placeholder]="allActionsLabel"
        searchPlaceholder="{{ filterActionPlaceholder }}"
        [compact]="true"
        (valueChange)="onActionChange($event)"
      ></billflow-combobox>

      <billflow-date-range-picker
        [fromDate]="dateFrom()"
        [toDate]="dateTo()"
        [fromLabel]="fromLabel"
        [toLabel]="toLabel"
        (fromDateChange)="onFromDateChange($event)"
        (toDateChange)="onToDateChange($event)"
      ></billflow-date-range-picker>

      <button
        type="button"
        title="Refresh"
        class="inline-flex items-center justify-center bg-surface-container-lowest border border-outline-variant/60 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm hover:border-primary hover:text-primary"
        (click)="onRefresh.emit()"
      >
        <span class="material-symbols-outlined text-[20px]">refresh</span>
      </button>
    </div>
  `,
})
export class AuditFilterBarComponent {
  @Input() tableOptions: ComboboxOption[] = [];
  @Input() actionOptions: ComboboxOption[] = [];
  @Input() allTablesLabel = 'Todas las tablas';
  @Input() allActionsLabel = 'Todas las acciones';
  @Input() filterTablePlaceholder = 'Filtrar por tabla';
  @Input() filterActionPlaceholder = 'Filtrar por acción';
  @Input() fromLabel = 'Desde';
  @Input() toLabel = 'Hasta';

  @Output() filtersChange = new EventEmitter<{ tableName?: string; action?: string; dateFrom?: string; dateTo?: string }>();
  @Output() onRefresh = new EventEmitter<void>();

  tableName = signal('');
  action = signal('');
  dateFrom = signal<string | null>(null);
  dateTo = signal<string | null>(null);

  onTableChange(value: string) {
    this.tableName.set(value);
    this.emitFilters();
  }

  onActionChange(value: string) {
    this.action.set(value);
    this.emitFilters();
  }

  onFromDateChange(value: string | null) {
    this.dateFrom.set(value);
    this.emitFilters();
  }

  onToDateChange(value: string | null) {
    this.dateTo.set(value);
    this.emitFilters();
  }

  private emitFilters() {
    this.filtersChange.emit({
      tableName: this.tableName() || undefined,
      action: this.action() || undefined,
      dateFrom: this.dateFrom() ?? undefined,
      dateTo: this.dateTo() ?? undefined,
    });
  }
}
