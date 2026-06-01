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
import { customersCopy, type CustomersLocale } from '../customers/i18n/customers.translations';

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
              (keydown.space)="blockOuterSpace($event)"
              (ngModelChange)="onNameInput(trimOuterSpaces($event), 'firstName')"
            />
            <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline">{{ newCustomerFirstName().length }}/100</span>
          </div>
          @if (nameFieldError() === 'firstName') {
            <p class="mt-1 text-xs text-error">{{ copy().nameError }}</p>
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
              (keydown.space)="blockOuterSpace($event)"
              (ngModelChange)="onNameInput(trimOuterSpaces($event), 'lastName')"
            />
            <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline">{{ newCustomerLastName().length }}/100</span>
          </div>
          @if (nameFieldError() === 'lastName') {
            <p class="mt-1 text-xs text-error">{{ copy().lastNameError }}</p>
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
              (keydown.space)="blockOuterSpace($event)"
              (keydown)="onNumericKeyDown($event)"
              (paste)="onNumericPaste($event)"
              (ngModelChange)="onNumericInput(trimOuterSpaces($event), 'cedula')"
            />
            <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline">{{ newCustomerCedula().length }}/10</span>
          </div>
          @if (formCedulaError()) {
            <p class="mt-1 text-xs text-error">{{ formCedulaError() }}</p>
          }
        </div>

        <!-- Phone -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ locale === 'es' ? 'Teléfono' : 'Phone' }}</label>
          <div class="relative">
            <input
              type="tel"
              class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              [maxLength]="10"
              [placeholder]="locale === 'es' ? '10 dígitos' : '10 digits'"
              [ngModel]="newCustomerPhone()"
              (keydown.space)="blockOuterSpace($event)"
              (keydown)="onNumericKeyDown($event)"
              (paste)="onNumericPaste($event)"
              (ngModelChange)="onNumericInput(trimOuterSpaces($event), 'phone')"
            />
              <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline">{{ newCustomerPhone().length }}/10</span>
          </div>
          @if (formPhoneError()) {
            <p class="mt-1 text-xs text-error">{{ formPhoneError() }}</p>
          }
        </div>

         <div class="md:col-span-2">
           <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ locale === 'es' ? 'Dirección' : 'Address' }}</label>
          <div class="relative">
            <input
              type="text"
              class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              [maxLength]="200"
              placeholder="Ej: Av. Principal 123, Asunción"
              [ngModel]="formAddress()"
              (ngModelChange)="formAddress.set($event)"
            />
          </div>
        </div>

        <!-- Email -->
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">Email</label>
          <div class="relative">
            <input
              type="email"
              class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant"
              [ngClass]="formEmailError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'"
              [maxLength]="255"
              [placeholder]="locale === 'es' ? 'Ej: carlos@ejemplo.com' : 'e.g. john@example.com'"
              [ngModel]="newCustomerEmail()"
              (ngModelChange)="newCustomerEmail.set($event)"
            />
            <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline">{{ newCustomerEmail().length }}/255</span>
          </div>
          @if (formEmailError()) {
            <p class="mt-1 text-xs text-error">{{ formEmailError() }}</p>
          }
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

  // Spec 2 R6 parity: bind a typed locale signal so the customersCopy()
  // helper can drive the new error keys (nameError, lastNameError,
  // cedulaError, phoneError, emailError) from a single source of truth.
  // The setter mirrors the input value into a writable signal; the
  // public getter keeps existing `this.locale === 'es'` ternaries working
  // for the non-error copy (titles, subtitles, placeholders).
  private readonly localeSig = signal<CustomersLocale>('es');
  @Input({ required: true })
  set locale(value: string) {
    this.localeSig.set((value === 'en' ? 'en' : 'es') as CustomersLocale);
  }
  get locale(): string {
    return this.localeSig();
  }
  protected readonly copy = customersCopy(this.localeSig);

  @Output() customerCreated = new EventEmitter<CustomerRowDto>();
  @Output() close = new EventEmitter<void>();

  newCustomerFirstName = signal('');
  newCustomerLastName = signal('');
  newCustomerCedula = signal('');
  newCustomerEmail = signal('');
  newCustomerPhone = signal('');
  nameFieldError = signal<'firstName' | 'lastName' | null>(null);
  formAddress = signal('');

  // Spec 2 R2: raw input tracking for the red-error feedback.
  private readonly lastRawCedula = signal('');
  private readonly lastRawPhone = signal('');

  readonly newCustomerFormValid = computed(() =>
    this.newCustomerFirstName().trim().length > 0
    && this.newCustomerLastName().trim().length > 0
    && this.newCustomerCedula().trim().length >= 6
  );

  // Spec 2 R2 + R4: per-field error computed signals.
  readonly formCedulaError = computed(() => {
    const raw = this.lastRawCedula();
    return raw && raw !== this.newCustomerCedula() ? this.copy().cedulaError : null;
  });

  readonly formPhoneError = computed(() => {
    const raw = this.lastRawPhone();
    return raw && raw !== this.newCustomerPhone() ? this.copy().phoneError : null;
  });

  readonly formEmailError = computed(() => {
    const v = this.newCustomerEmail();
    if (!v) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : this.copy().emailError;
  });

  onNameInput(value: string, target: 'firstName' | 'lastName') {
    // Spec 2 R1: drop the literal space from the allowed set so inner
    // spaces are stripped, not preserved.
    const cleaned = value.replace(/[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/g, '');
    if (target === 'firstName') this.newCustomerFirstName.set(cleaned);
    else this.newCustomerLastName.set(cleaned);

    if (value !== cleaned) {
      this.nameFieldError.set(target);
    } else if (this.nameFieldError() === target) {
      this.nameFieldError.set(null);
    }
  }

  onNumericInput(value: string, target: 'cedula' | 'phone') {
    // Spec 2 R2: track the raw (trimmed) input so the red error fires
    // when the user pasted / typed non-digit content.
    const trimmed = this.trimOuterSpaces(value);
    if (target === 'cedula') {
      this.lastRawCedula.set(trimmed);
      this.newCustomerCedula.set(trimmed.replace(/\D/g, '').slice(0, 10));
    } else {
      this.lastRawPhone.set(trimmed);
      this.newCustomerPhone.set(trimmed.replace(/\D/g, '').slice(0, 10));
    }
  }

  // Spec 2 R1 helpers (reused from product-form-modal pattern).
  trimOuterSpaces(value: string): string {
    return typeof value === 'string' ? value.replace(/^\s+|\s+$/g, '') : value;
  }

  blockOuterSpace(event: KeyboardEvent): void {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? 0;
    const hasSelection = selectionStart !== selectionEnd;
    if (!hasSelection && selectionStart === 0) {
      event.preventDefault();
    }
  }

  // Spec 2 R2: hard digit-only keydown + paste rejection.
  onNumericKeyDown(event: KeyboardEvent): void {
    const allowedKeys = new Set([
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'Shift', 'Control', 'Alt', 'Meta',
    ]);
    if (allowedKeys.has(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (/^[0-9]$/.test(event.key)) return;
    event.preventDefault();
  }

  onNumericPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!/^\s*\d+\s*$/.test(text)) {
      event.preventDefault();
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
      this.feedback.toast('error', this.copy().modalCreateTitle, err instanceof Error ? err.message : '');
    }
  }

  doClose() {
    this.close.emit();
  }
}
