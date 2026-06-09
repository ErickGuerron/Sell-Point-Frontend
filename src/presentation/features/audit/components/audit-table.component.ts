import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, computed, Input } from '@angular/core';
import type { AuditLogEntry } from '../domain/audit.entity';

type AuditLocale = 'es' | 'en';

interface AuditTableCopy {
  date: string;
  user: string;
  role: string;
  tableName: string;
  recordId: string;
  action: string;
  changedColumns: string;
  noEntriesTitle: string;
  noEntriesText: string;
  loadingText: string;
  showText: string;
  toText: string;
  ofText: string;
  entriesText: string;
  pageText: string;
}

const TABLE_COPY: Record<AuditLocale, AuditTableCopy> = {
  es: {
    date: 'Fecha/Hora',
    user: 'Usuario',
    role: 'Rol',
    tableName: 'Tabla',
    recordId: 'ID Registro',
    action: 'Acción',
    changedColumns: 'Columnas',
    noEntriesTitle: 'No hay entradas de auditoría',
    noEntriesText: 'Probá con otro filtro o rango de fechas.',
    loadingText: 'Cargando registro de auditoría...',
    showText: 'Mostrando',
    toText: 'a',
    ofText: 'de',
    entriesText: 'registros',
    pageText: 'pág.',
  },
  en: {
    date: 'Date/Time',
    user: 'User',
    role: 'Role',
    tableName: 'Table',
    recordId: 'Record ID',
    action: 'Action',
    changedColumns: 'Columns',
    noEntriesTitle: 'No audit entries found',
    noEntriesText: 'Try another filter or date range.',
    loadingText: 'Loading audit log...',
    showText: 'Showing',
    toText: 'to',
    ofText: 'of',
    entriesText: 'entries',
    pageText: 'page',
  },
};

function formatDate(iso: string, locale: AuditLocale): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale === 'es' ? 'es-PY' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function getActionClass(action: string): string {
  const upper = (action || '').toUpperCase();
  switch (upper) {
    case 'INSERT': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500';
    case 'UPDATE': return 'border-blue-500/30 bg-blue-500/10 text-blue-500';
    case 'DELETE': return 'border-red-500/30 bg-red-500/10 text-red-500';
    case 'CANCEL': return 'border-rose-500/30 bg-rose-500/10 text-rose-500';
    case 'SOFT_DELETE': return 'border-orange-500/30 bg-orange-500/10 text-orange-500';
    case 'RESTORE': return 'border-teal-500/30 bg-teal-500/10 text-teal-500';
    case 'LOGIN': return 'border-purple-500/30 bg-purple-500/10 text-purple-500';
    case 'LOGOUT': return 'border-slate-500/30 bg-slate-500/10 text-slate-500';
    case 'LOGIN_FAILED': return 'border-red-600/30 bg-red-600/10 text-red-600';
    default: return 'border-outline-variant/40 bg-surface-container-high text-on-surface-variant';
  }
}

@Component({
  selector: 'billflow-audit-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden">
      <div class="dashboard-table-card__head p-6 md:p-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap items-center gap-3">
          <ng-content select="[toolbar-left]"></ng-content>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="dashboard-table-card__head-row font-label-bold text-[11px] uppercase tracking-[0.1em]">
              <th class="dashboard-table-card__th p-4 pl-7 font-semibold">{{ copy().date }}</th>
              <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().user }}</th>
              <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().role }}</th>
              <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().tableName }}</th>
              <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().recordId }}</th>
              <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().action }}</th>
              <th class="dashboard-table-card__th p-4 pr-7 font-semibold">{{ copy().changedColumns }}</th>
            </tr>
          </thead>
          <tbody class="font-body-sm text-body-sm">
            @for (entry of entries(); track entry.id) {
              <tr class="dashboard-table-card__row group border-b border-outline-variant/20 hover:bg-surface-container-low/40 transition-colors duration-200 cursor-pointer"
                  (click)="onRowClick.emit(entry)">
                <td class="p-4 pl-7 text-on-surface font-medium text-sm whitespace-nowrap">{{ formatDate(entry.createdAt) }}</td>
                <td class="p-4 text-on-surface font-medium max-w-[160px] truncate">{{ entry.changedByEmail || entry.changedByUserId || '—' }}</td>
                <td class="p-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/40">
                    {{ entry.changedByRole || '—' }}
                  </span>
                </td>
                <td class="p-4 font-mono text-sm text-on-surface">{{ entry.tableName }}</td>
                <td class="p-4 font-mono text-xs text-on-surface-variant max-w-[120px] truncate" [title]="entry.recordId">{{ entry.recordId }}</td>
                <td class="p-4">
                  <span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide"
                        [ngClass]="getActionClass(entry.action)">
                    <span class="h-1.5 w-1.5 rounded-full" [ngClass]="getActionDotClass(entry.action)"></span>{{ entry.action }}
                  </span>
                </td>
                <td class="p-4 pr-7">
                  <span class="text-sm text-on-surface-variant">{{ formatChangedColumns(entry.changedColumns) }}</span>
                </td>
              </tr>
            }
            @if (entries().length === 0 && !loading()) {
              <tr>
                <td colspan="7" class="p-8">
                  <div class="dashboard-table-card__empty dashboard-table-card__empty--stacked mt-2">
                    <span class="material-symbols-outlined dashboard-table-card__empty-icon">assignment</span>
                    <p class="dashboard-table-card__empty-title">{{ copy().noEntriesTitle }}</p>
                    <p class="dashboard-table-card__empty-text">{{ copy().noEntriesText }}</p>
                  </div>
                </td>
              </tr>
            }
            @if (loading()) {
              <tr>
                <td colspan="7" class="p-8">
                  <div class="dashboard-table-card__empty dashboard-table-card__empty--stacked mt-2">
                    <div class="flex items-center gap-3 text-on-surface-variant">
                      <svg class="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      <span>{{ copy().loadingText }}</span>
                    </div>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="flex flex-col gap-4 border-t border-outline-variant/40 bg-surface/60 p-5 md:flex-row md:items-center md:justify-between dark:bg-slate-900/60">
        <div class="flex items-center gap-3 text-sm text-on-surface-variant">
          <span>{{ copy().showText }} <span class="font-semibold text-on-surface">{{ visibleStart() }}</span> {{ copy().toText }} <span class="font-semibold text-on-surface">{{ visibleEnd() }}</span> {{ copy().ofText }} <span class="font-semibold text-on-surface">{{ total() }}</span> {{ copy().entriesText }}</span>
          <select class="bg-surface border border-outline-variant rounded-lg px-2 py-1 text-xs font-medium text-on-surface cursor-pointer focus:outline-none focus:border-primary"
            [value]="pageSize()" (change)="onPageSizeChange.emit(+($any($event.target).value))">
            <option value="5">5</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30"
                  [disabled]="page() === 1" (click)="onPrevPage.emit()">
            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          <button *ngFor="let p of visiblePages()" type="button" class="h-9 w-9 rounded-lg text-sm font-semibold transition"
                  [ngClass]="p === page() ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'"
                  (click)="onPageClick.emit(p)">
            {{ p }}
          </button>

          <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30"
                  [disabled]="page() === totalPages()" (click)="onNextPage.emit()">
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  `,
})
export class AuditTableComponent {
  @Input({ required: true }) entries!: () => AuditLogEntry[];
  @Input({ required: true }) loading!: () => boolean;
  @Input({ required: true }) locale!: () => 'es' | 'en';
  @Input({ required: true }) page!: () => number;
  @Input({ required: true }) total!: () => number;
  @Input({ required: true }) pageSize!: () => number;

  @Output() onRowClick = new EventEmitter<AuditLogEntry>();
  @Output() onPrevPage = new EventEmitter<void>();
  @Output() onNextPage = new EventEmitter<void>();
  @Output() onPageClick = new EventEmitter<number>();
  @Output() onPageSizeChange = new EventEmitter<number>();

  readonly copy = computed(() => TABLE_COPY[this.locale() === 'en' ? 'en' : 'es']);

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()) || 1);
  readonly visibleStart = computed(() => this.total() === 0 ? 0 : ((this.page() - 1) * this.pageSize() + 1));
  readonly visibleEnd = computed(() => this.total() === 0 ? 0 : Math.min(this.page() * this.pageSize(), this.total()));
  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  });

  formatDate(iso: string): string {
    return formatDate(iso, this.locale() as AuditLocale);
  }

  getActionClass(action: string): string {
    return getActionClass(action);
  }

  getActionDotClass(action: string): string {
    const upper = (action || '').toUpperCase();
    switch (upper) {
      case 'INSERT': return 'bg-emerald-500';
      case 'UPDATE': return 'bg-blue-500';
      case 'DELETE': return 'bg-red-500';
      case 'CANCEL': return 'bg-rose-500';
      case 'SOFT_DELETE': return 'bg-orange-500';
      case 'RESTORE': return 'bg-teal-500';
      case 'LOGIN': return 'bg-purple-500';
      case 'LOGOUT': return 'bg-slate-500';
      case 'LOGIN_FAILED': return 'bg-red-600';
      default: return 'bg-outline-variant';
    }
  }

  formatChangedColumns(columns?: string[]): string {
    if (!columns || columns.length === 0) return '—';
    if (columns.length <= 2) return columns.join(', ');
    return `${columns[0]}, ${columns[1]} +${columns.length - 2}`;
  }
}
