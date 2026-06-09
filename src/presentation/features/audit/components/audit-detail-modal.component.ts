import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { BillflowModalShellComponent } from '../../../shared/components/billflow-modal-shell.component';
import type { AuditLogEntry } from '../domain/audit.entity';

type AuditLocale = 'es' | 'en';

interface AuditDetailCopy {
  detailTitle: string;
  detailSubtitle: string;
  metadataLabel: string;
  changesLabel: string;
  oldValue: string;
  newValue: string;
  noChanges: string;
  columnLabel: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  closeLabel: string;
  action: string;
  user: string;
  role: string;
  tableName: string;
  recordId: string;
  changedColumns: string;
}

const DETAIL_COPY: Record<AuditLocale, AuditDetailCopy> = {
  es: {
    detailTitle: 'Detalle de Auditoría',
    detailSubtitle: 'Información completa de la entrada de auditoría',
    metadataLabel: 'Metadatos',
    changesLabel: 'Cambios',
    oldValue: 'Valor Anterior',
    newValue: 'Valor Nuevo',
    noChanges: 'Sin cambios de datos',
    columnLabel: 'Columna',
    ipAddress: 'Dirección IP',
    userAgent: 'User Agent',
    timestamp: 'Fecha/Hora',
    closeLabel: 'Cerrar',
    action: 'Acción',
    user: 'Usuario',
    role: 'Rol',
    tableName: 'Tabla',
    recordId: 'ID Registro',
    changedColumns: 'Columnas modificadas',
  },
  en: {
    detailTitle: 'Audit Detail',
    detailSubtitle: 'Full audit entry information',
    metadataLabel: 'Metadata',
    changesLabel: 'Changes',
    oldValue: 'Old Value',
    newValue: 'New Value',
    noChanges: 'No data changes',
    columnLabel: 'Column',
    ipAddress: 'IP Address',
    userAgent: 'User Agent',
    timestamp: 'Timestamp',
    closeLabel: 'Close',
    action: 'Action',
    user: 'User',
    role: 'Role',
    tableName: 'Table',
    recordId: 'Record ID',
    changedColumns: 'Changed Columns',
  },
};

function formatJsonValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

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
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

@Component({
  selector: 'billflow-audit-detail-modal',
  standalone: true,
  imports: [CommonModule, BillflowModalShellComponent],
  template: `
    <billflow-modal-shell
      *ngIf="entry"
      [title]="copy().detailTitle"
      [subtitle]="copy().detailSubtitle"
      icon="assignment"
      maxWidth="2xl"
      [hasFooter]="true"
      (close)="onClose.emit()"
    >
      <div class="p-6 md:p-7 space-y-6">
        <!-- Metadata Section -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-outline mb-3">{{ copy().metadataLabel }}</h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div class="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3">
              <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-outline">{{ copy().action }}</p>
              <p class="mt-1 font-semibold text-sm text-on-surface">{{ entry.action }}</p>
            </div>
            <div class="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3">
              <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-outline">{{ copy().user }}</p>
              <p class="mt-1 font-semibold text-sm text-on-surface break-all">{{ entry.changedByEmail || entry.changedByUserId }}</p>
            </div>
            <div class="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3">
              <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-outline">{{ copy().role }}</p>
              <p class="mt-1 font-semibold text-sm text-on-surface">{{ entry.changedByRole || '—' }}</p>
            </div>
            <div class="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3">
              <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-outline">{{ copy().tableName }}</p>
              <p class="mt-1 font-mono text-sm text-on-surface">{{ entry.tableName }}</p>
            </div>
            <div class="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3">
              <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-outline">{{ copy().recordId }}</p>
              <p class="mt-1 font-mono text-xs text-on-surface break-all">{{ entry.recordId }}</p>
            </div>
            <div class="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3">
              <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-outline">{{ copy().timestamp }}</p>
              <p class="mt-1 text-sm text-on-surface">{{ formatDate(entry.createdAt) }}</p>
            </div>
            @if (entry.ipAddress) {
              <div class="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3">
                <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-outline">{{ copy().ipAddress }}</p>
                <p class="mt-1 font-mono text-sm text-on-surface">{{ entry.ipAddress }}</p>
              </div>
            }
            @if (entry.userAgent) {
              <div class="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 md:col-span-2">
                <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-outline">{{ copy().userAgent }}</p>
                <p class="mt-1 text-xs text-on-surface break-all">{{ entry.userAgent }}</p>
              </div>
            }
          </div>
        </div>

        <!-- Changes Section (Old vs New) -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-outline mb-3">{{ copy().changesLabel }}</h4>

          @if (changedKeys.length === 0) {
            <div class="rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-low px-6 py-10 text-center">
              <span class="material-symbols-outlined text-[48px] text-outline-variant">info</span>
              <p class="mt-2 text-sm text-on-surface-variant">{{ copy().noChanges }}</p>
            </div>
          } @else {
            <div class="overflow-x-auto rounded-xl border border-outline-variant/40">
              <table class="w-full border-collapse text-left">
                <thead>
                  <tr class="bg-surface-container-high text-[11px] uppercase tracking-[0.1em]">
                    <th class="p-3 pl-4 font-semibold text-outline w-[30%]">{{ copy().columnLabel }}</th>
                    <th class="p-3 font-semibold text-outline">{{ copy().oldValue }}</th>
                    <th class="p-3 pr-4 font-semibold text-outline">{{ copy().newValue }}</th>
                  </tr>
                </thead>
                <tbody class="font-body-sm text-body-sm">
                  @for (key of changedKeys; track key) {
                    <tr class="border-b border-outline-variant/20 last:border-b-0">
                      <td class="p-3 pl-4 font-mono text-sm font-semibold text-on-surface">{{ key }}</td>
                      <td class="p-3">
                        <pre class="text-xs text-on-surface-variant whitespace-pre-wrap break-words max-w-[240px] overflow-auto" [style.max-height]="'160px'">{{ formatValue(entry.oldValues?.[key]) }}</pre>
                      </td>
                      <td class="p-3 pr-4">
                        <pre class="text-xs text-on-surface whitespace-pre-wrap break-words max-w-[240px] overflow-auto" [style.max-height]="'160px'">{{ formatValue(entry.newValues?.[key]) }}</pre>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>

      <div footer class="flex w-full items-center justify-end gap-3 border-t border-outline-variant/30 bg-surface/60 px-6 py-4 dark:bg-slate-900/50 md:px-7">
        <button type="button"
          class="rounded-xl border border-outline-variant/50 bg-surface px-4 py-2 text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface"
          (click)="onClose.emit()">{{ copy().closeLabel }}</button>
      </div>
    </billflow-modal-shell>
  `,
})
export class AuditDetailModalComponent {
  @Input() set entry(value: AuditLogEntry | null) {
    this._entry.set(value);
  }
  get entry(): AuditLogEntry | null {
    return this._entry();
  }
  @Input() locale!: 'es' | 'en';

  @Output() onClose = new EventEmitter<void>();

  private readonly _entry = signal<AuditLogEntry | null>(null);

  readonly copy = computed(() => DETAIL_COPY[this.locale === 'en' ? 'en' : 'es']);

  get changedKeys(): string[] {
    const e = this.entry;
    if (!e) return [];
    const oldKeys = e.oldValues ? Object.keys(e.oldValues) : [];
    const newKeys = e.newValues ? Object.keys(e.newValues) : [];
    const allKeys = new Set([...oldKeys, ...newKeys]);
    return Array.from(allKeys);
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  formatDate(iso: string): string {
    return formatDate(iso, this.locale as AuditLocale);
  }
}
