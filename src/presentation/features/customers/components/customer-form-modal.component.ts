import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, Input, Output, EventEmitter, computed, effect, inject, signal } from '@angular/core';
import { BillflowModalShellComponent } from '../../../shared/components/billflow-modal-shell.component';
import { LocaleService } from '../../../shared/services/locale.service';
import type { CustomerEntity, CreateCustomerPayload } from '../domain/customer.entity';
import type { CustomersCopy } from '../i18n/customers.translations';

@Component({
  selector: 'billflow-customer-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, BillflowModalShellComponent],
  template: `
    <billflow-modal-shell
      *ngIf="open"
      title="{{ editing ? copy.modalEditTitle : copy.modalCreateTitle }}"
      subtitle="{{ editing ? copy.modalEditSubtitle : copy.modalCreateSubtitle }}"
      icon="person_add"
      maxWidth="xl"
      [hasFooter]="true"
      (close)="closeModal()"
    >
      <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- First Name -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5"
            >{{ copy.firstNameLabel }} <span class="text-error">*</span></label
          >
          <div class="relative">
            <input
              type="text"
              class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              [maxLength]="100"
              placeholder="Ej: Carlos"
              [ngModel]="formFirstName()"
              (keydown.space)="blockOuterSpace($event)"
              (ngModelChange)="onNameInput(trimOuterSpaces($event), 'firstName')"
            />
            <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline"
              >{{ formFirstName().length }}/100</span
            >
          </div>
          @if (nameFieldError() === 'firstName') {
            <p class="mt-1 text-xs text-error">{{ copy.nameError }}</p>
          }
        </div>

        <!-- Last Name -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5"
            >{{ copy.lastNameLabel }} <span class="text-error">*</span></label
          >
          <div class="relative">
            <input
              type="text"
              class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              [maxLength]="100"
              placeholder="Ej: Rodríguez"
              [ngModel]="formLastName()"
              (keydown.space)="blockOuterSpace($event)"
              (ngModelChange)="onNameInput(trimOuterSpaces($event), 'lastName')"
            />
            <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline"
              >{{ formLastName().length }}/100</span
            >
          </div>
          @if (nameFieldError() === 'lastName') {
            <p class="mt-1 text-xs text-error">{{ copy.lastNameError }}</p>
          }
        </div>

        <!-- Document (Cédula) -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5"
            >{{ copy.docLabel }} <span class="text-error">*</span></label
          >
          <div class="relative">
            <input
              type="text"
              class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              [ngClass]="cedulaDisabled() ? 'cursor-not-allowed opacity-60' : ''"
              [maxLength]="10"
              [placeholder]="copy.cedulaPlaceholder"
              [ngModel]="formCedula()"
              [disabled]="cedulaDisabled()"
              (keydown.space)="blockOuterSpace($event)"
              (keydown)="onNumericKeyDown($event)"
              (paste)="onNumericPaste($event)"
              (ngModelChange)="onNumericInput(trimOuterSpaces($event), 'cedula')"
            />
            <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline"
              >{{ formCedula().length }}/10</span
            >
          </div>
          @if (formCedulaError()) {
            <p class="mt-1 text-xs text-error">{{ formCedulaError() }}</p>
          }
        </div>

        <!-- Phone -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy.phoneLabel }}</label>
          <div class="relative">
            <input
              type="tel"
              class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              [maxLength]="10"
              [placeholder]="copy.phonePlaceholder"
              [ngModel]="formPhone()"
              (keydown.space)="blockOuterSpace($event)"
              (keydown)="onNumericKeyDown($event)"
              (paste)="onNumericPaste($event)"
              (ngModelChange)="onNumericInput(trimOuterSpaces($event), 'phone')"
            />
            <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline"
              >{{ formPhone().length }}/10</span
            >
          </div>
          @if (formPhoneError()) {
            <p class="mt-1 text-xs text-error">{{ formPhoneError() }}</p>
          }
        </div>

        <!-- Address -->
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold text-on-surface mb-1.5"
            >{{ locale() === 'es' ? 'Dirección' : 'Address' }}</label
          >
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
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy.emailLabel }}</label>
          <div class="relative">
            <input
              type="email"
              class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant"
              [ngClass]="formEmailError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'"
              [maxLength]="255"
              [placeholder]="copy.emailPlaceholder"
              [ngModel]="formEmail()"
              (ngModelChange)="formEmail.set($event)"
            />
            <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline"
              >{{ formEmail().length }}/255</span
            >
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
          (click)="closeModal()"
        >
          {{ copy.cancel }}
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
          [disabled]="!formValid()"
          (click)="onSave()"
        >
          {{ editing ? copy.saveEdit : copy.save }}
        </button>
      </div>
    </billflow-modal-shell>
  `,
})
export class CustomerFormModalComponent {
  private readonly localeService = inject(LocaleService);
  protected readonly locale = this.localeService.locale;

  // ── Inputs ─────────────────────────────────────────────────────────────
  @Input({ required: true }) open = false;
  @Input() editing: CustomerEntity | null = null;
  @Input({ required: true }) copy!: CustomersCopy;

  // ── Outputs ────────────────────────────────────────────────────────────
  @Output() save = new EventEmitter<CreateCustomerPayload>();
  @Output() close = new EventEmitter<void>();

  // ── Form signals ───────────────────────────────────────────────────────
  formFirstName = signal('');
  formLastName = signal('');
  formCedula = signal('');
  formPhone = signal('');
  formEmail = signal('');
  formAddress = signal('');
  nameFieldError = signal<'firstName' | 'lastName' | null>(null);

  // ── Spec 2 R2: raw input tracking for the red-error feedback ──────────
  private readonly lastRawCedula = signal('');
  private readonly lastRawPhone = signal('');

  readonly formValid = computed(() =>
    this.formFirstName().trim().length > 0
    && this.formLastName().trim().length > 0
    && this.formCedula().trim().length >= 6
  );

  readonly cedulaDisabled = computed(() => this.editing !== null);

  // ── Spec 2 R2 + R4: per-field error computed signals ─────────────────
  readonly formCedulaError = computed(() => {
    const raw = this.lastRawCedula();
    return raw && raw !== this.formCedula() ? this.copy().cedulaError : null;
  });

  readonly formPhoneError = computed(() => {
    const raw = this.lastRawPhone();
    return raw && raw !== this.formPhone() ? this.copy().phoneError : null;
  });

  readonly formEmailError = computed(() => {
    const v = this.formEmail();
    if (!v) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : this.copy().emailError;
  });

  // ── Sync form fields when `editing` input changes ──────────────────────
  private readonly syncEffect = effect(() => {
    const customer = this.editing;
    if (customer) {
      this.formFirstName.set(customer.firstName);
      this.formLastName.set(customer.lastName);
      this.formCedula.set(customer.cedula);
      this.formPhone.set(customer.phone ?? '');
      this.formEmail.set(customer.email ?? '');
      this.formAddress.set(customer.address ?? '');
      this.nameFieldError.set(null);
    } else if (this.open) {
      // Only reset when opening for create (not when closing)
      this.resetForm();
    }
  });

  // ── Modal control ──────────────────────────────────────────────────────
  closeModal(): void {
    this.close.emit();
    this.editing = null;
    this.resetForm();
  }

  // ── Save ───────────────────────────────────────────────────────────────
  onSave(): void {
    if (!this.formValid()) return;

    const payload: CreateCustomerPayload = {
      firstName: this.formFirstName().trim(),
      lastName: this.formLastName().trim(),
      cedula: this.formCedula().trim(),
      email: this.formEmail().trim() || undefined,
      phone: this.formPhone().trim() || undefined,
      address: this.formAddress().trim() || undefined,
    };

    this.save.emit(payload);
  }

  // ── Form helpers (extraídos del padre actual) ─────────────────────────
  resetForm(): void {
    this.formFirstName.set('');
    this.formLastName.set('');
    this.formCedula.set('');
    this.formPhone.set('');
    this.formEmail.set('');
    this.formAddress.set('');
    this.nameFieldError.set(null);
  }

  onNameInput(value: string, target: 'firstName' | 'lastName'): void {
    // Spec 2 R1: drop \s from the allowed-character regex so inner spaces
    // are stripped, not preserved. Outer spaces are trimmed by the template
    // binding via `trimOuterSpaces($event)` before this handler runs.
    const cleaned = value.replace(/[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/g, '');
    if (target === 'firstName') this.formFirstName.set(cleaned);
    else this.formLastName.set(cleaned);
    if (value !== cleaned) this.nameFieldError.set(target);
    else if (this.nameFieldError() === target) this.nameFieldError.set(null);
  }

  onNumericInput(value: string, target: 'cedula' | 'phone'): void {
    // Spec 2 R2: track the raw (trimmed) input so the red error fires when
    // the user pasted / typed non-digit content. The cleaned value goes to
    // the bound signal.
    const trimmed = this.trimOuterSpaces(value);
    if (target === 'cedula') {
      this.lastRawCedula.set(trimmed);
      this.formCedula.set(trimmed.replace(/\D/g, '').slice(0, 10));
    } else {
      this.lastRawPhone.set(trimmed);
      this.formPhone.set(trimmed.replace(/\D/g, '').slice(0, 10));
    }
  }

  // ── Spec 2 R1 helpers (reused from product-form-modal pattern) ──────
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

  // ── Spec 2 R2: hard digit-only keydown + paste rejection ────────────
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
}
