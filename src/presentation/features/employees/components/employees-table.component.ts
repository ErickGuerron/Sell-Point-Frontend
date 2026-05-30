import { CommonModule } from '@angular/common';
import { Component, computed, Input, signal } from '@angular/core';

type EmployeesLocale = 'es' | 'en';

interface EmployeeRowDto {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
  isActive: boolean;
  failedLoginAttempts: number;
}

interface EmployeesTableCopy {
  employee: string;
  email: string;
  role: string;
  status: string;
  attempts: string;
  actions: string;
  noEmployeesTitle: string;
  noEmployeesText: string;
  loadingText: string;
  edit: string;
  deactivate: string;
  activate: string;
  unlock: string;
  viewDetails: string;
  showText: string;
  toText: string;
  ofText: string;
  entriesText: string;
  pageText: string;
}

const TABLE_COPY: Record<EmployeesLocale, EmployeesTableCopy> = {
  es: {
    employee: 'Empleado', email: 'Email', role: 'Rol', status: 'Estado',
    attempts: 'Intentos', actions: 'Acciones', noEmployeesTitle: 'No hay empleados',
    noEmployeesText: 'Probá con otro filtro o término de búsqueda.',
    loadingText: 'Cargando empleados...',
    edit: 'Editar', deactivate: 'Desactivar', activate: 'Activar',
    unlock: 'Desbloquear', viewDetails: 'Ver Detalles',
    showText: 'Mostrando', toText: 'a', ofText: 'de', entriesText: 'registros',
    pageText: 'pág.',
  },
  en: {
    employee: 'Employee', email: 'Email', role: 'Role', status: 'Status',
    attempts: 'Attempts', actions: 'Actions', noEmployeesTitle: 'No employees found',
    noEmployeesText: 'Try another filter or search term.',
    loadingText: 'Loading employees...',
    edit: 'Edit', deactivate: 'Deactivate', activate: 'Activate',
    unlock: 'Unlock', viewDetails: 'View Details',
    showText: 'Showing', toText: 'to', ofText: 'of', entriesText: 'entries',
    pageText: 'page',
  },
};

@Component({
  selector: 'billflow-employees-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dashboard-glass-card dashboard-table-card rounded-2xl p-0 overflow-hidden">
      <div class="dashboard-table-card__head p-6 md:p-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap items-center gap-3">
          <ng-content select="[toolbar-left]"></ng-content>
        </div>
        <div class="flex items-center gap-2 w-full lg:w-auto">
          <ng-content select="[toolbar-right]"></ng-content>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="dashboard-table-card__head-row font-label-bold text-[11px] uppercase tracking-[0.1em]">
              <th class="dashboard-table-card__th p-4 pl-7 font-semibold">{{ copy().employee }}</th>
              <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().email }}</th>
              <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().role }}</th>
              <th class="dashboard-table-card__th p-4 font-semibold">{{ copy().status }}</th>
              <th class="dashboard-table-card__th p-4 font-semibold text-center">{{ copy().attempts }}</th>
              <th class="dashboard-table-card__th p-4 pr-7 font-semibold text-right">{{ copy().actions }}</th>
            </tr>
          </thead>
          <tbody class="font-body-sm text-body-sm">
            @for (employee of employees(); track employee.id) {
              <tr class="dashboard-table-card__row group border-b border-outline-variant/20 hover:bg-surface-container-low/40 transition-colors duration-200 cursor-pointer"
                  [ngClass]="!employee.isActive ? 'opacity-70 bg-surface-container-lowest/20' : ''"
                  (click)="onRowClick?.(employee)">
                <td class="p-4 pl-7 font-semibold text-on-background">
                  <div class="flex items-center gap-3">
                    <div class="h-9 w-9 rounded-full bg-gradient-to-br flex items-center justify-center border text-xs font-bold shrink-0 shadow-sm"
                         [ngClass]="getGradient(employee)">{{ getInitials(employee) }}</div>
                    <div>
                      <div class="font-semibold text-on-background">{{ fullName(employee) }}</div>
                      <div class="text-[10px] text-outline mt-0.5 md:hidden font-mono">{{ employee.employeeId }}</div>
                    </div>
                  </div>
                </td>
                <td class="p-4 text-on-surface font-medium max-w-[160px] truncate">{{ employee.email || '—' }}</td>
                <td class="p-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/40">{{ employee.role }}</span>
                </td>
                <td class="p-4">
                  <span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide"
                        [ngClass]="getStatusClass(employee)">
                    <span class="h-1.5 w-1.5 rounded-full" [ngClass]="getStatusDot(employee)"></span>{{ getStatusLabel(employee) | uppercase }}
                  </span>
                </td>
                <td class="p-4 text-center">
                  <span class="inline-flex items-center justify-center h-7 min-w-[2rem] px-2 rounded-md text-xs font-bold"
                        [ngClass]="employee.failedLoginAttempts >= 3 ? 'bg-error/10 text-error border border-error/20' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/40'">{{ employee.failedLoginAttempts }}</span>
                </td>
                <td class="p-4 pr-7 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button type="button" [title]="copy().viewDetails"
                            class="inline-flex h-8 w-8 items-center justify-center bg-primary text-on-primary rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer"
                            (click)="$event.stopPropagation(); onInfoClick?.(employee)">
                      <span class="material-symbols-outlined text-[18px]">info</span>
                    </button>
                    <button type="button" [title]="copy().edit"
                            class="inline-flex h-8 w-8 items-center justify-center bg-primary text-on-primary rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer"
                            (click)="$event.stopPropagation(); onEditClick?.(employee)">
                      <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    @if (employee.failedLoginAttempts >= 3) {
                      <button type="button" [title]="copy().unlock"
                              class="inline-flex h-8 w-8 items-center justify-center bg-[#f59e0b] text-white rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer"
                              (click)="$event.stopPropagation(); onUnlockClick?.(employee)">
                        <span class="material-symbols-outlined text-[18px]">lock_open</span>
                      </button>
                    }
                    <button type="button" [title]="employee.isActive ? copy().deactivate : copy().activate"
                            class="inline-flex h-8 w-8 items-center justify-center text-white rounded-lg shadow-sm transition-all duration-200 hover:opacity-85 active:scale-90 cursor-pointer"
                            [ngClass]="employee.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:opacity-85'"
                            (click)="$event.stopPropagation(); onToggleClick?.(employee)">
                      <span class="material-symbols-outlined text-[18px]">{{ employee.isActive ? 'close' : 'check' }}</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
            @if (employees().length === 0 && !loading()) {
              <tr>
                <td colspan="6" class="p-8">
                  <div class="dashboard-table-card__empty dashboard-table-card__empty--stacked mt-2">
                    <span class="material-symbols-outlined dashboard-table-card__empty-icon">badge</span>
                    <p class="dashboard-table-card__empty-title">{{ copy().noEmployeesTitle }}</p>
                    <p class="dashboard-table-card__empty-text">{{ copy().noEmployeesText }}</p>
                  </div>
                </td>
              </tr>
            }
            @if (loading()) {
              <tr>
                <td colspan="6" class="p-8">
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

      <div class="flex flex-col gap-4 border-t border-outline-variant/40 bg-surface/60 p-5 md:flex-row md:items-center md:justify-between dark:bg-slate-900/60">
        <div class="flex items-center gap-3 text-sm text-on-surface-variant">
          <span>{{ copy().showText }} <span class="font-semibold text-on-surface">{{ visibleStart() }}</span> {{ copy().toText }} <span class="font-semibold text-on-surface">{{ visibleEnd() }}</span> {{ copy().ofText }} <span class="font-semibold text-on-surface">{{ total() }}</span> {{ copy().entriesText }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30"
                  [disabled]="page() === 1" (click)="onPrevPage?.()">
            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span class="text-sm text-on-surface-variant">{{ copy().pageText }} {{ page() }} / {{ totalPages() }}</span>
          <button type="button" class="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-30"
                  [disabled]="page() === totalPages()" (click)="onNextPage?.()">
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  `,
})
export class EmployeesTableComponent {
  @Input({ required: true }) employees!: () => EmployeeRowDto[];
  @Input({ required: true }) loading!: () => boolean;
  @Input({ required: true }) locale!: () => 'es' | 'en';
  @Input({ required: true }) page!: () => number;
  @Input({ required: true }) total!: () => number;
  @Input({ required: true }) pageSize!: () => number;

  @Input() onRowClick?: (e: EmployeeRowDto) => void;
  @Input() onInfoClick?: (e: EmployeeRowDto) => void;
  @Input() onEditClick?: (e: EmployeeRowDto) => void;
  @Input() onUnlockClick?: (e: EmployeeRowDto) => void;
  @Input() onToggleClick?: (e: EmployeeRowDto) => void;
  @Input() onPrevPage?: () => void;
  @Input() onNextPage?: () => void;

  private localeState = signal<EmployeesLocale>('es');

  ngOnInit() {
    this.localeState.set(this.locale() === 'en' ? 'en' : 'es');
  }

  readonly copy = computed(() => TABLE_COPY[this.localeState()]);

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()) || 1);
  readonly visibleStart = computed(() => (this.page() - 1) * this.pageSize() + 1);
  readonly visibleEnd = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  getInitials(e: EmployeeRowDto) { return `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase(); }
  fullName(e: EmployeeRowDto) { return `${e.firstName} ${e.lastName}`; }

  getGradient(e: EmployeeRowDto) {
    const colors = ['from-indigo-500 to-purple-500', 'from-emerald-500 to-teal-500', 'from-orange-500 to-red-500', 'from-blue-500 to-cyan-500'];
    return colors[e.firstName.charCodeAt(0) % colors.length];
  }

  getStatusClass(e: EmployeeRowDto): string {
    if (!e.isActive) return 'border-amber-400/30 bg-amber-400/10 text-amber-400';
    if (e.failedLoginAttempts >= 3) return 'border-red-500/30 bg-red-500/10 text-red-500';
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500';
  }

  getStatusDot(e: EmployeeRowDto): string {
    if (!e.isActive) return 'bg-amber-400';
    if (e.failedLoginAttempts >= 3) return 'bg-red-500';
    return 'bg-emerald-500';
  }

  getStatusLabel(e: EmployeeRowDto): string {
    if (!e.isActive) return this.copy().deactivate;
    if (e.failedLoginAttempts >= 3) return this.copy().unlock;
    return this.copy().activate;
  }
}