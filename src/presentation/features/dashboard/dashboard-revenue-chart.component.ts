import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import type { ChartData, ChartOptions, ChartType } from 'chart.js';

interface DashboardChartInvoice {
  date: string;
  total: number;
}

@Component({
  selector: 'billflow-dashboard-revenue-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="dashboard-glass-card rounded-2xl p-7">
      <div class="flex justify-between items-center mb-8 gap-4">
        <h3 class="font-h3 text-h3 text-on-background tracking-tight">{{ revenueTitle }}</h3>
        <select class="bg-surface-container-lowest border border-outline-variant/60 rounded-lg text-sm py-1.5 px-4 text-on-surface font-medium focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" [value]="period" (change)="period = ($any($event.target).value)">
          <option value="week">{{ weekLabel }}</option>
          <option value="month">{{ monthLabel }}</option>
        </select>
      </div>

      <div class="app-dashboard-chart-wrap relative h-72 md:h-80">
        <canvas baseChart [type]="revenueChartType" [data]="revenueChartData()" [options]="revenueChartOptions()"></canvas>
      </div>
    </div>
  `,
})
export class DashboardRevenueChartComponent {
  @Input({ required: true }) invoices: DashboardChartInvoice[] = [];
  @Input({ required: true }) revenueTitle = '';
  @Input({ required: true }) weekLabel = '';
  @Input({ required: true }) monthLabel = '';
  @Input({ required: true }) locale = 'en';

  period: 'week' | 'month' = 'week';
  readonly revenueChartType: ChartType = 'bar';

  readonly revenueChartData = (): ChartData<'bar'> => {
    const today = new Date();
    const labels = this.period === 'month' ? this.monthLabels() : this.weekLabels();
    const data = this.period === 'month'
      ? Array.from({ length: 12 }, (_, month) => this.sumForMonth(this.invoices, today.getFullYear(), month))
      : Array.from({ length: 7 }, (_, index) => this.sumForWeekday(this.invoices, today, index));

    return {
      labels,
      datasets: [{
        data,
        label: this.revenueTitle,
        borderWidth: 2,
        borderRadius: 12,
        borderSkipped: false,
        barPercentage: 0.72,
        categoryPercentage: 0.72,
        backgroundColor: 'rgba(79, 70, 229, 0.78)',
        hoverBackgroundColor: 'rgba(53, 37, 205, 0.92)',
        borderColor: 'rgba(53, 37, 205, 1)',
      }],
    };
  };

  readonly revenueChartOptions = (): ChartOptions<'bar'> => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#eef0ff',
        bodyColor: '#eef0ff',
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: (context) => ` ${this.formatMoney(Number(context.parsed.y ?? 0))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11, weight: '600' }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
      },
      y: {
        beginAtZero: true,
        grace: '10%',
        grid: { color: 'rgba(148, 163, 184, 0.22)' },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          callback: (value) => this.formatCompactMoney(Number(value)),
        },
      },
    },
  });

  private weekLabels() {
    return this.locale === 'es'
      ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }

  private monthLabels() {
    return this.locale === 'es'
      ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  }

  private sumForWeekday(invoices: DashboardChartInvoice[], today: Date, index: number) {
    const weekStart = this.startOfWeek(today);
    const current = new Date(weekStart);
    current.setDate(weekStart.getDate() + index);
    return this.sumForDate(invoices, current);
  }

  private sumForMonth(invoices: DashboardChartInvoice[], year: number, month: number) {
    return invoices
      .filter((invoice) => this.sameMonthYear(invoice.date, year, month))
      .reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0);
  }

  private sumForDate(invoices: DashboardChartInvoice[], current: Date) {
    return invoices
      .filter((invoice) => this.sameLocalDate(invoice.date, current))
      .reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0);
  }

  private startOfWeek(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    return start;
  }

  private sameLocalDate(value: string, current: Date) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date.getFullYear() === current.getFullYear()
      && date.getMonth() === current.getMonth()
      && date.getDate() === current.getDate();
  }

  private sameMonthYear(value: string, year: number, month: number) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date.getFullYear() === year && date.getMonth() === month;
  }

  private formatMoney(value: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
  }

  private formatCompactMoney(value: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
  }
}
