import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillflowComboboxComponent } from '../../../shared/components/billflow-combobox.component';
import { BillflowDateRangePickerComponent } from '../../../shared/components/billflow-date-range-picker.component';
import type { ComboboxOption } from '../../../shared/components/billflow-combobox.component';
import { UiFeedbackService } from '../../../shared/services/ui-feedback.service';
import { LocaleService } from '../../../shared/services/locale.service';
import type { CustomerEntity } from '../domain/customer.entity';

@Component({
  selector: 'billflow-customer-table',
  standalone: true,
  imports: [CommonModule, FormsModule, BillflowComboboxComponent, BillflowDateRangePickerComponent],
  templateUrl: './customer-table.component.html',
})
export class CustomerTableComponent {
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);
  protected readonly locale = this.localeService.locale;

  // ── Inputs ─────────────────────────────────────────────────────────────
  @Input({ required: true }) customers: CustomerEntity[] = [];
  @Input({ required: true }) loading = false;
  @Input({ required: true }) page = 1;
  @Input({ required: true }) totalPages = 1;
  @Input({ required: true }) pageSize = 5;
  @Input({ required: true }) visiblePages: number[] = [];
  @Input({ required: true }) filteredCount = 0;
  @Input({ required: true }) rangeStart = 0;
  @Input({ required: true }) rangeEnd = 0;
  @Input({ required: true }) searchQuery = '';
  @Input({ required: true }) searchField = '';
  @Input({ required: true }) statusFilter = '';
  @Input({ required: true }) statusFilterOptions: ComboboxOption[] = [];
  @Input({ required: true }) searchFieldOptions: ComboboxOption[] = [];
  @Input({ required: true }) pageSizeOptions: ComboboxOption[] = [];
  @Input() createdFrom: string | null = null;
  @Input() createdTo: string | null = null;

  // ── Outputs ────────────────────────────────────────────────────────────
  @Output() edit = new EventEmitter<CustomerEntity>();
  @Output() toggleActive = new EventEmitter<CustomerEntity>();
  @Output() showInfo = new EventEmitter<CustomerEntity>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() searchFieldChange = new EventEmitter<string>();
  @Output() statusFilterChange = new EventEmitter<string>();
  @Output() refresh = new EventEmitter<void>();
  @Output() openCreate = new EventEmitter<void>();
  @Output() createdFromChange = new EventEmitter<string | null>();
  @Output() createdToChange = new EventEmitter<string | null>();

  // ── Helpers (extraídos del componente padre actual) ───────────────────
  customerFullName(customer: CustomerEntity): string {
    return customer.lastName?.trim()
      ? `${customer.firstName} ${customer.lastName}`
      : customer.firstName;
  }

  getCustomerInitials(customer: CustomerEntity): string {
    const first = customer.firstName ? customer.firstName.charAt(0) : '';
    const last = customer.lastName ? customer.lastName.charAt(0) : '';
    return (first + last).toUpperCase();
  }

  getCustomerGradient(customer: CustomerEntity): string {
    const hash = customer.firstName.charCodeAt(0) + (customer.lastName?.charCodeAt(0) || 0);
    const gradients = [
      'from-[#4f46e5]/20 to-[#06b6d4]/20 text-[#4f46e5] dark:text-[#c3c0ff] border-[#4f46e5]/20',
      'from-[#ec4899]/20 to-[#f43f5e]/20 text-[#ec4899] dark:text-[#ffb2b7] border-[#ec4899]/20',
      'from-[#10b981]/20 to-[#3b82f6]/20 text-[#10b981] dark:text-[#89ceff] border-[#10b981]/20',
      'from-[#f59e0b]/20 to-[#ef4444]/20 text-[#f59e0b] dark:text-[#ffb2b7] border-[#f59e0b]/20',
      'from-[#8b5cf6]/20 to-[#d946ef]/20 text-[#8b5cf6] dark:text-[#c3c0ff] border-[#8b5cf6]/20',
    ];
    return gradients[hash % gradients.length];
  }

  showCustomerInfo(customer: CustomerEntity): void {
    const statusText = customer.isActive
      ? (this.locale() === 'es' ? 'Activo' : 'Active')
      : (this.locale() === 'es' ? 'Inactivo' : 'Inactive');
    const fullName = this.customerFullName(customer);

    const html = `
<div style="font-family: monospace; font-size: 14px; line-height: 1.8; text-align: left;">
  <div style="font-weight: bold; padding-bottom: 6px; border-bottom: 1px solid #ccc; margin-bottom: 10px;">
    ${this.locale() === 'es' ? 'DATOS PERSONALES' : 'PERSONAL INFO'}
  </div>
  <div><strong>${this.locale() === 'es' ? 'Nombre' : 'Name'}:</strong> ${fullName}</div>
  <div><strong>${this.locale() === 'es' ? 'Cédula' : 'ID'}:</strong> ${customer.cedula ?? '—'}</div>
  <div><strong>Email:</strong> ${customer.email ?? '—'}</div>
  <div><strong>${this.locale() === 'es' ? 'Teléfono' : 'Phone'}:</strong> ${customer.phone ?? '—'}</div>
  <div><strong>${this.locale() === 'es' ? 'Dirección' : 'Address'}:</strong> ${customer.address ?? '—'}</div>
  <div style="font-weight: bold; padding-top: 10px; margin-top: 10px; border-top: 1px solid #ccc;">
    ${this.locale() === 'es' ? 'ESTADO' : 'STATUS'}
  </div>
  <div><strong>${this.locale() === 'es' ? 'Estado' : 'Status'}:</strong> ${statusText}</div>
</div>`;

    void this.feedback.alertHtml(
      'info',
      this.locale() === 'es' ? 'Detalles del Cliente' : 'Customer Details',
      html,
    );
  }

  // ── Pagination event helpers ──────────────────────────────────────────
  previousPage(): void {
    if (this.page > 1) {
      this.pageChange.emit(this.page - 1);
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.pageChange.emit(this.page + 1);
    }
  }

  goToPage(pageNumber: number): void {
    this.pageChange.emit(pageNumber);
  }

  onPageSizeChange(event: Event): void {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    if (!Number.isFinite(value) || value < 5) return;
    this.pageSizeChange.emit(value);
  }
}
