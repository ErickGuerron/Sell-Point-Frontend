import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { BillflowModalShellComponent } from '../../../shared/components/billflow-modal-shell.component';
import { LocaleService } from '../../../shared/services/locale.service';
import { UiFeedbackService } from '../../../shared/services/ui-feedback.service';
import type { CustomerEntity, CreateCustomerPayload } from '../domain/customer.entity';
import type { CustomersCopy } from '../i18n/customers.translations';

@Component({
  selector: 'billflow-customer-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, BillflowModalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <billflow-modal-shell
      #shell
      *ngIf="open"
      title="{{ editing ? (locale() === 'es' ? 'Editar Cliente' : 'Edit Customer') : (locale() === 'es' ? 'Nuevo Cliente' : 'New Customer') }}"
      subtitle="{{ editing ? (locale() === 'es' ? 'Modificá los datos del cliente' : 'Edit customer details') : (locale() === 'es' ? 'Completá los datos del nuevo cliente' : 'Fill in the new customer details') }}"
      icon="person_add"
      maxWidth="xl"
      [hasFooter]="true"
      [formHasChanges]="formHasChanges"
      (close)="closeModal()"
    >
      <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- First Name -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5"
            >{{ locale() === 'es' ? 'Nombre' : 'First Name' }} <span class="text-error">*</span></label
          >
          <div class="relative">
            <input
              type="text"
              class="w-full pr-16 px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant"
              [ngClass]="nameFieldError() === 'firstName' ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'"
              [maxLength]="100"
              [placeholder]="locale() === 'es' ? 'Ej: Carlos' : 'e.g. John'"
              [ngModel]="formFirstName()"
              (keydown)="onNameKeyDown($event, 'firstName')"
              (paste)="onNamePaste($event, 'firstName')"
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
            >{{ locale() === 'es' ? 'Apellido' : 'Last Name' }} <span class="text-error">*</span></label
          >
          <div class="relative">
            <input
              type="text"
              class="w-full pr-16 px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant"
              [ngClass]="nameFieldError() === 'lastName' ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'"
              [maxLength]="100"
              [placeholder]="locale() === 'es' ? 'Ej: Rodríguez' : 'e.g. Doe'"
              [ngModel]="formLastName()"
              (keydown)="onNameKeyDown($event, 'lastName')"
              (paste)="onNamePaste($event, 'lastName')"
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
            >{{ locale() === 'es' ? 'Cédula' : 'ID Number' }} <span class="text-error">*</span></label
          >
          <div class="relative">
            <input
              type="text"
              class="w-full pr-14 px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant"
              [ngClass]="[
                cedulaDisabled() ? 'cursor-not-allowed opacity-60' : '',
                formCedulaError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'
              ].join(' ')"
              [maxLength]="10"
              [placeholder]="locale() === 'es' ? '10 dígitos' : '10 digits'"
              [ngModel]="formCedula()"
              [disabled]="cedulaDisabled()"
              (keydown.space)="blockOuterSpace($event)"
              (keydown)="onNumericKeyDown($event, 'cedula')"
              (paste)="onNumericPaste($event, 'cedula')"
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
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ locale() === 'es' ? 'Teléfono' : 'Phone' }}</label>
          <div class="relative">
            <input
              type="tel"
              class="w-full pr-14 px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant"
              [ngClass]="formPhoneError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'"
              [maxLength]="10"
              [placeholder]="locale() === 'es' ? '10 dígitos' : '10 digits'"
              [ngModel]="formPhone()"
              (keydown.space)="blockOuterSpace($event)"
              (keydown)="onNumericKeyDown($event, 'phone')"
              (paste)="onNumericPaste($event, 'phone')"
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
              class="w-full pr-20 px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              [maxLength]="200"
              placeholder="Ej: Av. Principal 123, Asunción"
              [ngModel]="formAddress()"
              (keydown.space)="blockOuterSpace($event)"
              (ngModelChange)="formAddress.set($event)"
            />
            <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline"
              >{{ formAddress().length }}/200</span
            >
          </div>
        </div>

        <!-- Email -->
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ locale() === 'es' ? 'Email' : 'Email' }}</label>
          <div class="relative">
            <input
              type="email"
              class="w-full pr-20 px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant"
              [ngClass]="formEmailError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'"
              [maxLength]="255"
              [placeholder]="locale() === 'es' ? 'Ej: carlos@ejemplo.com' : 'e.g. john@example.com'"
              [ngModel]="formEmail()"
              (keydown)="onEmailKeyDown($event)"
              (ngModelChange)="formEmail.set($event.replace(/\s/g, ''))"
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
          (click)="requestClose()"
        >
          {{ locale() === 'es' ? 'Cancelar' : 'Cancel' }}
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
          [disabled]="!formValid()"
          (click)="onSave()"
        >
          {{ editing ? (locale() === 'es' ? 'Guardar Cambios' : 'Save Changes') : (locale() === 'es' ? 'Guardar Cliente' : 'Save Customer') }}
        </button>
      </div>
    </billflow-modal-shell>
  `,
})
export class CustomerFormModalComponent {
  private readonly localeService = inject(LocaleService);
  private readonly feedback = inject(UiFeedbackService);
  protected readonly locale = this.localeService.locale;

  // ── Req 1.8: debounce toast per-field (100ms) ─────────────────────
  private readonly lastToastTimestamps: Record<string, number> = {};

  // Spec 3 R6: viewChild to the shell so the host's Cancel button can route
  // through the shell's `requestClose()` (which owns the unsaved-changes guard).
  private readonly shell = viewChild(BillflowModalShellComponent);

  // ── Inputs (signal-backed so syncEffect reacts to changes) ─────────────
  private readonly _open = signal(false);
  @Input({ required: true }) set open(value: boolean) { this._open.set(value); }
  get open(): boolean { return this._open(); }

  private readonly _editing = signal<CustomerEntity | null>(null);
  @Input() set editing(value: CustomerEntity | null) { this._editing.set(value); }
  get editing(): CustomerEntity | null { return this._editing(); }

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

  // ── Spec 3 R6: initial-value snapshot for the unsaved-changes guard ───
  private readonly initialFirstName = signal('');
  private readonly initialLastName = signal('');
  private readonly initialCedula = signal('');
  private readonly initialPhone = signal('');
  private readonly initialEmail = signal('');
  private readonly initialAddress = signal('');

  readonly formValid = computed(() =>
    this.formFirstName().trim().length > 0
    && this.formLastName().trim().length > 0
    && this.formCedula().trim().length >= 6
  );

  readonly cedulaDisabled = computed(() => this.editing !== null);

  // ── Spec 2 R2 + R4: per-field error computed signals ─────────────────
  readonly formCedulaError = computed(() => {
    const raw = this.lastRawCedula();
    return raw && raw !== this.formCedula() ? this.copy.cedulaError : null;
  });

  readonly formPhoneError = computed(() => {
    const raw = this.lastRawPhone();
    return raw && raw !== this.formPhone() ? this.copy.phoneError : null;
  });

  readonly formEmailError = computed(() => {
    const v = this.formEmail();
    if (!v) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : this.copy.emailError;
  });

  // ── Spec 3 R6: dirty signal — true when any form field diverges from ──
  // the snapshot captured at modal-open time.
  readonly formHasChanges = computed(() =>
    this.formFirstName() !== this.initialFirstName()
    || this.formLastName() !== this.initialLastName()
    || this.formCedula() !== this.initialCedula()
    || this.formPhone() !== this.initialPhone()
    || this.formEmail() !== this.initialEmail()
    || this.formAddress() !== this.initialAddress()
  );

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
      this.captureSnapshot();
    } else if (this.open) {
      // Only reset when opening for create (not when closing)
      this.resetForm();
      this.captureSnapshot();
    }
  });

  private captureSnapshot(): void {
    // untracked() prevents the effect() that calls captureSnapshot() from
    // tracking these form signals as reactive dependencies. Without it, any
    // keystroke would re-trigger the effect → resetForm() → counter resets to 0.
    this.initialFirstName.set(untracked(() => this.formFirstName()));
    this.initialLastName.set(untracked(() => this.formLastName()));
    this.initialCedula.set(untracked(() => this.formCedula()));
    this.initialPhone.set(untracked(() => this.formPhone()));
    this.initialEmail.set(untracked(() => this.formEmail()));
    this.initialAddress.set(untracked(() => this.formAddress()));
  }

  // ── Modal control ──────────────────────────────────────────────────────
  closeModal(): void {
    this.close.emit();
    this.editing = null;
    this.resetForm();
  }

  /**
   * Host-side helper that routes the Cancel button through the shell's
   * `requestClose()`. The shell owns the unsaved-changes guard, so all
   * four close paths (X, backdrop, Escape, Cancel) share the same
   * decision matrix.
   */
  async requestClose(): Promise<void> {
    await this.shell()?.requestClose();
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
      address: this.formAddress().trim() || undefined,  // trim deferred to save
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

  // ── Req 1.8: debounced toast helper ──────────────────────────────────
  private showErrorToast(message: string, fieldKey: string): void {
    const now = Date.now();
    if (now - (this.lastToastTimestamps[fieldKey] ?? 0) < 100) return;
    this.lastToastTimestamps[fieldKey] = now;
    this.feedback.toast('error', message);
  }

  // ── Req 5 + Req 2: unified keydown handler for name fields ─────────
  onNameKeyDown(event: KeyboardEvent, target: 'firstName' | 'lastName'): void {
    const allowedKeys = new Set([
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'Shift', 'Control', 'Alt', 'Meta',
    ]);
    if (allowedKeys.has(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;

    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    const errorMsg = target === 'firstName' ? this.copy.nameError : this.copy.lastNameError;

    if (event.key === ' ') {
      // Req 2.2: delegate leading space to blockOuterSpace
      this.blockOuterSpace(event);
      // Req 2.3: middle/end space → toast
      if (!event.defaultPrevented) {
        event.preventDefault();
        this.showErrorToast(errorMsg, target);
        this.nameFieldError.set(target);
      }
      return;
    }

    // Req 5.2: validate against name char set
    if (!/^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]$/.test(event.key)) {
      event.preventDefault();
      this.nameFieldError.set(target);
      // Req 1.1: toast only when field is at max length
      if (input.value.length >= 100) {
        this.showErrorToast(errorMsg, target);
      }
    }
  }

  // ── Req 2.4: strip spaces from pasted name content ─────────────────
  onNamePaste(event: ClipboardEvent, target: 'firstName' | 'lastName'): void {
    const text = event.clipboardData?.getData('text') ?? '';
    const stripped = text.replace(/\s/g, '');
    if (!stripped) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const current = target === 'firstName' ? this.formFirstName() : this.formLastName();
    const merged = current.substring(0, start) + stripped + current.substring(end);
    // Let onNameInput handle further cleaning and error state
    this.onNameInput(merged, target);
  }

  // ── Req 6 + space control: block whitespace in email ───────────────
  onEmailKeyDown(event: KeyboardEvent): void {
    const allowedKeys = new Set([
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'Shift', 'Control', 'Alt', 'Meta',
    ]);
    if (allowedKeys.has(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;

    if (event.key === ' ') {
      const input = event.target as HTMLInputElement | null;
      if (!input) return;
      const selectionStart = input.selectionStart ?? 0;
      const selectionEnd = input.selectionEnd ?? 0;
      const hasSelection = selectionStart !== selectionEnd;

      // Leading space (cursor at 0, no selection) → silent block
      if (!hasSelection && selectionStart === 0) {
        event.preventDefault();
        return;
      }

      // Middle/end space → block with toast
      event.preventDefault();
      this.showErrorToast(this.copy.emailError, 'email');
    }
  }

  onNameInput(value: string, target: 'firstName' | 'lastName'): void {
    // Safety net: strip invalid chars + enforce max length for paste/edge cases
    const cleaned = value.replace(/[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/g, '').slice(0, 100);
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

  // ── Req 1.2 + 4: numeric keydown with toast for full-field / space ──
  onNumericKeyDown(event: KeyboardEvent, fieldType: 'cedula' | 'phone'): void {
    const allowedKeys = new Set([
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'Shift', 'Control', 'Alt', 'Meta',
    ]);
    if (allowedKeys.has(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (/^[0-9]$/.test(event.key)) return;

    const errorMsg = fieldType === 'cedula' ? this.copy.cedulaError : this.copy.phoneError;

    // Req 4.1: space at middle/end → toast (leading space handled by blockOuterSpace)
    if (event.key === ' ' && !event.defaultPrevented) {
      this.showErrorToast(errorMsg, fieldType);
    } else if (event.key !== ' ') {
      // Req 1.2: invalid char at max length → toast
      const input = event.target as HTMLInputElement | null;
      if (input && input.value.length >= 10) {
        this.showErrorToast(errorMsg, fieldType);
      }
    }

    event.preventDefault();
  }

  // ── Req 4.3/4.4: paste rejection + visual error state ──────────────
  onNumericPaste(event: ClipboardEvent, fieldType: 'cedula' | 'phone'): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!/^\s*\d+\s*$/.test(text)) {
      event.preventDefault();
      // Req 4.4: show visual error by setting raw signal to paste text;
      // form signal stays unchanged → formXxxError computed triggers mismatch
      if (fieldType === 'cedula') {
        this.lastRawCedula.set(text);
      } else {
        this.lastRawPhone.set(text);
      }
    }
  }
}
