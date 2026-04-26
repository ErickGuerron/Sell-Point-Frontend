import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';

type Period = 'week' | 'month';

interface DashboardInvoice {
  id: string;
  client: string;
  amount: string;
  status: string;
  tone: 'success' | 'warning' | 'error';
}

interface DashboardProduct {
  rank: string;
  name: string;
  units: string;
  price: string;
}

interface DashboardKpi {
  label: string;
  value: string;
  icon: string;
  tone: 'primary' | 'secondary' | 'tertiary' | 'neutral';
  trendIcon: string;
  trend: string;
  trendTone: 'success' | 'error' | 'neutral';
  note: string;
}

interface DashboardNavItem {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}

interface QuickAction {
  label: string;
  icon: string;
  tone: 'primary' | 'secondary' | 'tertiary';
}

@Component({
  selector: 'billflow-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block w-full' },
  template: `
    <div class="app-dashboard-shell">
      <nav class="hidden md:flex app-dashboard-sidebar">
        <div class="mb-10 flex items-center gap-3 px-2">
          <span class="material-symbols-outlined text-primary text-[32px] filter drop-shadow-sm" style="font-variation-settings: 'FILL' 1;">point_of_sale</span>
          <div>
            <h1 class="text-2xl font-black text-primary tracking-tight">BillFlow</h1>
            <p class="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-0.5">POS Terminal</p>
          </div>
        </div>

        <div class="flex-1 space-y-1.5">
          <a *ngFor="let item of sidebarItems" [href]="item.href" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-95 app-dashboard-nav-link" [ngClass]="item.active ? 'bg-primary/10 text-primary font-bold app-dashboard-nav-link--active' : 'font-medium'">
            <span class="material-symbols-outlined" [style.font-variation-settings]="iconVariationSettings(item.active)">{{ item.icon }}</span>
            {{ item.label }}
          </a>
        </div>

        <div class="mt-auto pt-6">
          <button type="button" class="w-full py-3.5 px-4 bg-primary text-white rounded-xl font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2" (click)="startNewSale()">
            <span class="material-symbols-outlined text-[20px]">add</span>
            Nueva Venta
          </button>
        </div>
      </nav>

      <main class="app-dashboard-main">
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
          <div>
            <h2 class="font-h2 text-h2 dashboard-gradient-text">Hola de nuevo, {{ displayName }}</h2>
            <p class="font-body-sm text-body-sm text-outline mt-1.5 font-medium">Resumen de actividad de hoy</p>
          </div>

          <div class="flex items-center gap-5 w-full md:w-auto">
            <div class="relative w-full md:w-72">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline/70">search</span>
              <input class="w-full pl-12 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-full text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" placeholder="Buscar facturas..." type="text" [value]="searchQuery()" (input)="searchQuery.set(($any($event.target).value))" />
            </div>

            <button type="button" class="relative p-2.5 rounded-full bg-surface-container-lowest border border-outline-variant/60 hover:bg-surface-container-low transition-colors text-on-surface shadow-sm hover:shadow" (click)="showNotifications()">
              <span class="material-symbols-outlined text-[22px]">notifications</span>
              <span class="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-white"></span>
            </button>

            <div class="w-11 h-11 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shadow-sm hover:bg-primary/20 transition-colors cursor-pointer">
              {{ userInitials }}
            </div>
          </div>
        </header>

        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10">
          <div *ngFor="let kpi of kpis" class="dashboard-kpi-card dashboard-glass-card rounded-2xl p-6 relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-40 h-40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:scale-125 transition-transform duration-700" [ngClass]="kpiBackground(kpi.tone)"></div>
            <div class="dashboard-kpi-header flex justify-between items-start mb-5 relative z-10 w-full gap-3">
              <div class="min-w-0 flex-1">
                <p class="font-label-bold text-label-bold text-outline uppercase tracking-[0.15em]">{{ kpi.label }}</p>
                <h3 class="font-h1 text-h1 text-on-background mt-2.5 tracking-tight">{{ kpi.value }}</h3>
              </div>
              <div class="dashboard-kpi-icon p-3 rounded-xl shadow-sm shrink-0 self-start" [ngClass]="kpiIconTone(kpi.tone)">
                <span class="material-symbols-outlined dashboard-kpi-icon__glyph" style="font-variation-settings: 'FILL' 1;">{{ kpi.icon }}</span>
              </div>
            </div>
            <div class="flex items-center text-sm font-medium relative z-10">
              <span class="material-symbols-outlined text-[18px] rounded-full p-0.5" [ngClass]="trendToneClass(kpi.trendTone)">{{ kpi.trendIcon }}</span>
              <span class="font-bold ml-2" [ngClass]="trendTextClass(kpi.trendTone)">{{ kpi.trend }}</span>
              <span class="text-outline/80 ml-2">{{ kpi.note }}</span>
            </div>
          </div>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          <div class="lg:col-span-2 space-y-8">
            <div class="dashboard-glass-card rounded-2xl p-7">
              <div class="flex justify-between items-center mb-8 gap-4">
                <h3 class="font-h3 text-h3 text-on-background tracking-tight">Tendencia de Ingresos</h3>
                <select class="bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-sm py-1.5 px-4 text-on-surface font-medium focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" [value]="period()" (change)="setPeriod(($any($event.target).value))">
                  <option value="week">Esta Semana</option>
                  <option value="month">Este Mes</option>
                </select>
              </div>

              <div class="h-64 flex items-end justify-between gap-3 pb-6 relative">
                <div class="absolute inset-0 flex flex-col justify-between z-0 pb-6 pointer-events-none">
                  <div class="w-full border-b border-outline-variant/10 h-0 border-dashed"></div>
                  <div class="w-full border-b border-outline-variant/10 h-0 border-dashed"></div>
                  <div class="w-full border-b border-outline-variant/10 h-0 border-dashed"></div>
                  <div class="w-full border-b border-outline-variant/10 h-0 border-dashed"></div>
                  <div class="w-full border-b border-outline-variant/30 h-0"></div>
                </div>

                <div *ngFor="let bar of chartBars" class="dashboard-chart-bar rounded-t-lg relative z-10 group cursor-pointer min-h-[4px] flex-1" [style.height.%]="bar.height" [attr.aria-label]="bar.label" (click)="showPeriodDetail(bar.label, bar.value)">
                  <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{{ bar.value }}</div>
                </div>
              </div>

              <div class="flex justify-between text-[13px] font-medium text-outline mt-1 px-3">
                <span *ngFor="let bar of chartBars">{{ bar.label }}</span>
              </div>
            </div>

            <div class="dashboard-glass-card rounded-2xl p-0 overflow-hidden">
              <div class="p-6 md:p-7 border-b border-outline-variant/30 flex justify-between items-center bg-white/40">
                <h3 class="font-h3 text-h3 text-on-background tracking-tight">Facturas Recientes</h3>
                <button type="button" class="text-sm font-button text-primary hover:text-indigo-700 transition-colors flex items-center gap-1 group" (click)="showInvoiceOverview()">Ver todas <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span></button>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-surface-container-low/50 text-outline font-label-bold text-[11px] uppercase tracking-[0.1em]">
                      <th class="p-4 pl-7 font-semibold">ID Factura</th>
                      <th class="p-4 font-semibold">Cliente</th>
                      <th class="p-4 font-semibold">Monto</th>
                      <th class="p-4 pr-7 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody class="font-body-sm text-body-sm">
                    <tr *ngFor="let invoice of filteredInvoices()" class="border-b border-outline-variant/20 hover:bg-white/60 transition-colors group cursor-pointer" (click)="inspectInvoice(invoice)">
                      <td class="p-4 pl-7 font-semibold text-on-surface">{{ invoice.id }}</td>
                      <td class="p-4 text-on-surface-variant font-medium">{{ invoice.client }}</td>
                      <td class="p-4 text-on-surface font-semibold">{{ invoice.amount }}</td>
                      <td class="p-4 pr-7">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm" [ngClass]="statusToneClass(invoice.tone)">{{ invoice.status }}</span>
                      </td>
                    </tr>
                    <tr *ngIf="filteredInvoices().length === 0">
                      <td colspan="4" class="p-8 text-center text-on-surface-variant">No hay facturas que coincidan con la búsqueda.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="space-y-8">
            <div class="dashboard-glass-card rounded-2xl p-7">
              <h3 class="font-h3 text-h3 text-on-background mb-5 tracking-tight">Acciones Rápidas</h3>
              <div class="flex flex-col gap-3.5">
                <button *ngFor="let action of quickActions" type="button" class="w-full flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/60 bg-white/50 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-all text-on-surface font-button text-button group" (click)="triggerQuickAction(action)">
                  <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">{{ action.icon }}</span>
                    {{ action.label }}
                  </div>
                  <span class="material-symbols-outlined text-outline/60 group-hover:text-primary transition-colors">arrow_forward</span>
                </button>
              </div>
            </div>

            <div class="dashboard-glass-card rounded-2xl p-7">
              <h3 class="font-h3 text-h3 text-on-background mb-6 tracking-tight">Productos Top <span class="text-outline text-sm font-normal ml-1">(Hoy)</span></h3>
              <ul class="space-y-5">
                <li *ngFor="let product of topProducts" class="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-white/60 transition-colors" (click)="inspectProduct(product)">
                  <div class="flex items-center gap-4">
                    <div class="w-11 h-11 rounded-xl bg-surface-container-high/60 flex items-center justify-center text-on-surface-variant font-bold text-sm shadow-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors">{{ product.rank }}</div>
                    <div>
                      <p class="font-body-sm text-body-sm text-on-surface font-semibold group-hover:text-primary transition-colors">{{ product.name }}</p>
                      <p class="font-label-bold text-[11px] text-outline mt-0.5 tracking-wide">{{ product.units }}</p>
                    </div>
                  </div>
                  <span class="font-body-sm font-bold text-on-surface group-hover:text-primary transition-colors">{{ product.price }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <nav class="md:hidden app-dashboard-mobile-nav">
        <a *ngFor="let item of mobileNavItems" class="flex flex-col items-center justify-center w-full h-full pt-1 border-t-2 transition-colors app-dashboard-mobile-link" [href]="item.href" [ngClass]="item.active ? 'text-primary border-primary app-dashboard-mobile-link--active' : 'border-transparent'">
          <span class="material-symbols-outlined" [style.font-variation-settings]="iconVariationSettings(item.active)">{{ item.icon }}</span>
          <span class="text-[10px] font-medium mt-1">{{ item.label }}</span>
        </a>

        <div class="app-dashboard-mobile-fab-wrap">
          <button type="button" class="w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all border-[3px] border-surface" (click)="startNewSale()">
            <span class="material-symbols-outlined text-[24px]">add</span>
          </button>
        </div>
      </nav>
    </div>
  `,
})
export class DashboardPageComponent implements OnInit {
  private readonly feedback = inject(UiFeedbackService);

  displayName = 'Carlos';
  userInitials = 'CA';
  period = signal<Period>('week');
  searchQuery = signal('');

  readonly sidebarItems: DashboardNavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', href: '#', active: true },
    { label: 'Facturas', icon: 'receipt_long', href: '#' },
    { label: 'Productos', icon: 'inventory_2', href: '#' },
    { label: 'Clientes', icon: 'groups', href: '#' },
    { label: 'Empleados', icon: 'badge', href: '#' },
  ];

  readonly mobileNavItems: DashboardNavItem[] = [
    { label: 'Inicio', icon: 'dashboard', href: '#', active: true },
    { label: 'Facturas', icon: 'receipt_long', href: '#' },
    { label: 'Clientes', icon: 'groups', href: '#' },
    { label: 'Más', icon: 'menu', href: '#' },
  ];

  readonly kpis: DashboardKpi[] = [
    { label: 'Ventas del Día', value: '$4,250.00', icon: 'payments', tone: 'primary', trendIcon: 'trending_up', trend: '+12.5%', trendTone: 'success', note: 'vs ayer' },
    { label: 'Facturas Hoy', value: '124', icon: 'receipt_long', tone: 'secondary', trendIcon: 'trending_up', trend: '+5', trendTone: 'success', note: 'vs ayer' },
    { label: 'Nuevos Clientes', value: '18', icon: 'person_add', tone: 'tertiary', trendIcon: 'trending_down', trend: '-2', trendTone: 'error', note: 'vs ayer' },
    { label: 'En Turno', value: '4/5', icon: 'badge', tone: 'neutral', trendIcon: 'circle', trend: 'Operación normal', trendTone: 'neutral', note: '' },
  ];

  readonly quickActions: QuickAction[] = [
    { label: 'Nueva Factura', icon: 'post_add', tone: 'primary' },
    { label: 'Añadir Cliente', icon: 'person_add', tone: 'secondary' },
    { label: 'Añadir Producto', icon: 'add_box', tone: 'tertiary' },
  ];

  readonly chartBars = [
    { label: 'Lun', value: '$1.2k', height: 45 },
    { label: 'Mar', value: '$1.8k', height: 65 },
    { label: 'Mié', value: '$1.0k', height: 40 },
    { label: 'Jue', value: '$2.4k', height: 85 },
    { label: 'Vie', value: '$1.6k', height: 60 },
    { label: 'Sáb', value: '$2.7k', height: 95 },
    { label: 'Dom', value: '$2.2k', height: 80 },
  ];

  readonly invoices: DashboardInvoice[] = [
    { id: '#INV-0842', client: 'TechCorp S.A.', amount: '$1,250.00', status: 'Pagado', tone: 'success' },
    { id: '#INV-0841', client: 'María González', amount: '$345.50', status: 'Pendiente', tone: 'warning' },
    { id: '#INV-0840', client: 'Librería El Ateneo', amount: '$890.00', status: 'Pagado', tone: 'success' },
    { id: '#INV-0839', client: 'Juan Pérez', amount: '$120.00', status: 'Vencido', tone: 'error' },
  ];

  readonly topProducts: DashboardProduct[] = [
    { rank: '01', name: 'Café de Especialidad', units: '42 uds', price: '$210.00' },
    { rank: '02', name: 'Croissant Mantequilla', units: '38 uds', price: '$114.00' },
    { rank: '03', name: 'Té Matcha', units: '25 uds', price: '$150.00' },
  ];

  readonly filteredInvoices = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.invoices;
    return this.invoices.filter((invoice) => [invoice.id, invoice.client, invoice.amount, invoice.status].some((field) => field.toLowerCase().includes(query)));
  });

  ngOnInit() {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem('billflow-session');
      if (!raw) {
        window.location.assign('/auth');
        return;
      }

      const session = JSON.parse(raw) as { user?: { name?: string; firstName?: string; fullName?: string } };
      const candidate = session.user?.fullName || session.user?.name || session.user?.firstName;
      if (candidate) {
        this.displayName = candidate;
        this.userInitials = candidate
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? '')
          .join('');
      }
    } catch {
      window.location.assign('/auth');
    }
  }

  async startNewSale() {
    await this.feedback.toast('success', 'Nueva venta', 'La terminal POS está lista para operar.');
  }

  async showNotifications() {
    await this.feedback.alert('info', 'Notificaciones', 'Tienes 3 movimientos críticos pendientes de revisión.');
  }

  async showInvoiceOverview() {
    await this.feedback.toast('info', 'Facturas recientes', 'Mostrando el resumen operativo del día.');
  }

  async inspectInvoice(invoice: DashboardInvoice) {
    await this.feedback.alert('info', invoice.id, `${invoice.client} · ${invoice.amount} · ${invoice.status}`);
  }

  async inspectProduct(product: DashboardProduct) {
    await this.feedback.toast('info', product.name, `${product.units} · ${product.price}`);
  }

  async triggerQuickAction(action: QuickAction) {
    await this.feedback.toast('success', action.label, 'Acción registrada en la interfaz del dashboard.');
  }

  async showPeriodDetail(label: string, value: string) {
    await this.feedback.toast('info', `Ventas ${label}`, `Valor aproximado: ${value}`);
  }

  async setPeriod(value: string) {
    this.period.set(value === 'month' ? 'month' : 'week');
    await this.feedback.toast('info', this.period() === 'month' ? 'Vista mensual' : 'Vista semanal', 'Se actualizó el análisis visual.');
  }

  kpiBackground(tone: DashboardKpi['tone']) {
    return {
      'bg-primary/5': tone === 'primary',
      'bg-secondary/5': tone === 'secondary',
      'bg-tertiary/5': tone === 'tertiary',
      'bg-surface-tint/5': tone === 'neutral',
    };
  }

  kpiIconTone(tone: DashboardKpi['tone']) {
    return {
      'bg-primary-fixed/60 text-primary': tone === 'primary',
      'bg-secondary-fixed/60 text-secondary': tone === 'secondary',
      'bg-tertiary-fixed/60 text-tertiary': tone === 'tertiary',
      'bg-primary/10 text-primary': tone === 'neutral',
    };
  }

  trendToneClass(tone: DashboardKpi['trendTone']) {
    return {
      'text-[#10b981] bg-[#10b981]/10': tone === 'success',
      'text-error bg-error/10': tone === 'error',
      'text-outline bg-outline/10': tone === 'neutral',
    };
  }

  trendTextClass(tone: DashboardKpi['trendTone']) {
    return {
      'text-[#10b981]': tone === 'success',
      'text-error': tone === 'error',
      'text-outline': tone === 'neutral',
    };
  }

  statusToneClass(tone: DashboardInvoice['tone']) {
    return {
      'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20': tone === 'success',
      'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20': tone === 'warning',
      'bg-error/10 text-error border border-error/20': tone === 'error',
    };
  }

  iconVariationSettings(active = false) {
    return active ? "'FILL' 1" : "'FILL' 0";
  }
}
