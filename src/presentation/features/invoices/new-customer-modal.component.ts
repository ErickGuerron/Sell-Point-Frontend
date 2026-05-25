import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  InvoiceApiService,
  type CustomerRowDto,
  type CreateCustomerPayload,
} from './invoice-api.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { BillflowModalShellComponent } from '../../shared/components/billflow-modal-shell.component';

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'billflow-new-customer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, BillflowModalShellComponent],
  template: `
    <billflow-modal-shell
      *ngIf="open"
      title="{{ locale === 'es' ? 'Nuevo Cliente' : 'New Customer' }}"
      subtitle="{{ locale === 'es' ? 'Completá los datos del nuevo cliente' : 'Fill in the new customer details' }}"
      icon="person_add"
      maxWidth="xl"
      [hasFooter]="true"
      (close)="doClose()"
    >
      <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- First Name -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ locale === 'es' ? 'Nombre' : 'First Name' }} <span class="text-error">*</span></label>
          <div class="relative">
            <input
              type="text"
              class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              [maxLength]="100"
              [placeholder]="locale === 'es' ? 'Ej: Carlos' : 'e.g. John'"
              [ngModel]="newCustomerFirstName()"
              (ngModelChange)="onNameInput($event, 'firstName')"
            />
            <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline">{{ newCustomerFirstName().length }}/100</span>
          </div>
          @if (nameFieldError() === 'firstName') {
            <p class="mt-1 text-xs text-error">
              {{ locale === 'es' ? 'Los nombres no deben contener números' : 'Names must not contain numbers' }}
            </p>
          }
        </div>

        <!-- Last Name -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ locale === 'es' ? 'Apellido' : 'Last Name' }} <span class="text-error">*</span></label>
          <div class="relative">
            <input
              type="text"
              class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              [maxLength]="100"
              [placeholder]="locale === 'es' ? 'Ej: Rodríguez' : 'e.g. Doe'"
              [ngModel]="newCustomerLastName()"
              (ngModelChange)="onNameInput($event, 'lastName')"
            />
            <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline">{{ newCustomerLastName().length }}/100</span>
          </div>
          @if (nameFieldError() === 'lastName') {
            <p class="mt-1 text-xs text-error">
              {{ locale === 'es' ? 'Los nombres no deben contener números' : 'Names must not contain numbers' }}
            </p>
          }
        </div>

        <!-- Cédula -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ locale === 'es' ? 'Cédula' : 'ID Number' }} <span class="text-error">*</span></label>
          <div class="relative">
            <input
              type="text"
              class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              [maxLength]="10"
              [placeholder]="locale === 'es' ? '10 dígitos' : '10 digits'"
              [ngModel]="newCustomerCedula()"
              (ngModelChange)="onNumericInput($event, 'cedula')"
            />
            <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline">{{ newCustomerCedula().length }}/10</span>
          </div>
        </div>

        <!-- Phone -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ locale === 'es' ? 'Teléfono' : 'Phone' }}</label>
          <div class="relative">
            <input
              type="tel"
              class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              [maxLength]="20"
              [placeholder]="locale === 'es' ? 'Ej: +595 981 123456' : 'e.g. +1 555 123 4567'"
              [ngModel]="newCustomerPhone()"
              (ngModelChange)="onNumericInput($event, 'phone')"
            />
          </div>
        </div>

        <!-- Email -->
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">Email</label>
          <div class="relative">
            <input
              type="email"
              class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              [maxLength]="255"
              [placeholder]="locale === 'es' ? 'Ej: carlos@ejemplo.com' : 'e.g. john@example.com'"
              [ngModel]="newCustomerEmail()"
              (ngModelChange)="newCustomerEmail.set($event)"
            />
            <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline">{{ newCustomerEmail().length }}/255</span>
          </div>
        </div>
      </div>

      <div footer class="flex w-full items-center justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all border border-outline-variant/50"
          (click)="doClose()"
        >
          {{ locale === 'es' ? 'Cancelar' : 'Cancel' }}
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
          [disabled]="!newCustomerFormValid()"
          (click)="saveNewCustomer()"
        >
          {{ locale === 'es' ? 'Guardar Cliente' : 'Save Customer' }}
        </button>
      </div>
    </billflow-modal-shell>
  `,
})
export class NewCustomerModalComponent {
  private readonly api = inject(InvoiceApiService);
  private readonly feedback = inject(UiFeedbackService);

  @Input({ required: true }) open = false;
  @Input({ required: true }) locale!: string;

  @Output() customerCreated = new EventEmitter<CustomerRowDto>();
  @Output() close = new EventEmitter<void>();

  newCustomerFirstName = signal('');
  newCustomerLastName = signal('');
  newCustomerCedula = signal('');
  newCustomerEmail = signal('');
  newCustomerPhone = signal('');
  nameFieldError = signal<'firstName' | 'lastName' | null>(null);

  readonly newCustomerFormValid = computed(() =>
    this.newCustomerFirstName().trim().length > 0
    && this.newCustomerLastName().trim().length > 0
    && this.newCustomerCedula().trim().length === 10
  );

  onNameInput(value: string, target: 'firstName' | 'lastName') {
    const cleaned = value.replace(/[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]/g, '');
    if (target === 'firstName') this.newCustomerFirstName.set(cleaned);
    else this.newCustomerLastName.set(cleaned);

    if (value !== cleaned) {
      this.nameFieldError.set(target);
    } else if (this.nameFieldError() === target) {
      this.nameFieldError.set(null);
    }
  }

  onNumericInput(value: string, target: 'cedula' | 'phone') {
    if (target === 'cedula') {
      this.newCustomerCedula.set(value.replace(/\D/g, '').slice(0, 10));
    } else {
      this.newCustomerPhone.set(value.replace(/\D/g, ''));
    }
  }

  async saveNewCustomer() {
    const payload: CreateCustomerPayload = {
      firstName: this.newCustomerFirstName().trim(),
      lastName: this.newCustomerLastName().trim(),
      cedula: this.newCustomerCedula().trim(),
      email: this.newCustomerEmail().trim() || undefined,
      phone: this.newCustomerPhone().trim() || undefined,
    };
    try {
      const customer = await this.api.createCustomer(payload);
      this.customerCreated.emit(customer);
    } catch (err) {
      console.error('[create customer]', err);
      this.feedback.toast('error', this.locale === 'es' ? 'Error al crear cliente' : 'Error creating customer');
    }
  }

  doClose() {
    this.close.emit();
  }
}
