import { CommonModule } from '@angular/common';
import { Component, computed, Input, Output, EventEmitter, signal, ElementRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BillflowModalShellComponent } from '../../../shared/components/billflow-modal-shell.component';

type EmployeesLocale = 'es' | 'en';

interface EmployeeRowDto {
  id: string;
  employeeId: string;
  username: string;
  firstName: string;
  lastName: string;
  cedula?: string;
  email?: string;
  role: string;
  isActive: boolean;
  failedLoginAttempts: number;
}

interface EmployeesFormCopy {
  modalCreateTitle: string;
  modalCreateSubtitle: string;
  modalEditTitle: string;
  modalEditSubtitle: string;
  save: string;
  saveEdit: string;
  cancel: string;
  firstNameLabel: string;
  lastNameLabel: string;
  docLabel: string;
  emailLabel: string;
  usernameLabel: string;
  roleLabel: string;
  branchLabel: string;
  firstNameError: string;
  lastNameError: string;
  lastNameNoSpaces: string;
  cedulaExact10: string;
  emailInvalidFormat: string;
  usernameNoSpaces: string;
  charCountLabel: string;
  selectPlaceholder: string;
  savingText: string;
}

const FORM_COPY: Record<EmployeesLocale, EmployeesFormCopy> = {
  es: {
    modalCreateTitle: 'Nuevo Empleado', modalCreateSubtitle: 'Completá los datos del nuevo empleado',
    modalEditTitle: 'Editar Empleado', modalEditSubtitle: 'Actualizá los datos del empleado',
    save: 'Guardar Empleado', saveEdit: 'Actualizar Empleado', cancel: 'Cancelar',
    firstNameLabel: 'Nombre', lastNameLabel: 'Apellido', docLabel: 'Cédula',
    emailLabel: 'Email', usernameLabel: 'Usuario', roleLabel: 'Rol',
    branchLabel: 'Sucursal',
    firstNameError: 'Solo letras permitidas', lastNameError: 'Solo letras permitidas',
    lastNameNoSpaces: 'No se permiten espacios', cedulaExact10: 'Debe tener exactamente 10 dígitos',
    emailInvalidFormat: 'Formato de email inválido', usernameNoSpaces: 'No se permiten espacios',
    charCountLabel: '',
    selectPlaceholder: '-- Seleccionar --',
    savingText: 'Guardando...',
  },
  en: {
    modalCreateTitle: 'New Employee', modalCreateSubtitle: 'Fill in the new employee details',
    modalEditTitle: 'Edit Employee', modalEditSubtitle: 'Update the employee details',
    save: 'Save Employee', saveEdit: 'Update Employee', cancel: 'Cancel',
    firstNameLabel: 'First Name', lastNameLabel: 'Last Name', docLabel: 'ID Number',
    emailLabel: 'Email', usernameLabel: 'Username', roleLabel: 'Role',
    branchLabel: 'Branch',
    firstNameError: 'Only letters allowed', lastNameError: 'Only letters allowed',
    lastNameNoSpaces: 'No spaces allowed', cedulaExact10: 'Must be exactly 10 digits',
    emailInvalidFormat: 'Invalid email format', usernameNoSpaces: 'No spaces allowed',
    charCountLabel: '',
    selectPlaceholder: '-- Select --',
    savingText: 'Saving...',
  },
};

@Component({
  selector: 'billflow-employees-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
      @if (isEdit && employee) {
        <div class="md:col-span-2 rounded-2xl border border-outline-variant/50 bg-surface-container-low p-4 shadow-sm">
          <div class="flex items-center justify-between gap-3 mb-3">
            <div>
              <p class="text-sm font-semibold text-on-surface">Identificación del empleado</p>
              <p class="text-xs text-on-surface-variant">Solo lectura</p>
            </div>
            <span class="inline-flex items-center rounded-full border border-outline-variant/60 bg-surface px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
              Datos internos
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="rounded-xl border border-outline-variant/40 bg-surface px-4 py-3">
              <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Cédula</p>
              <p class="mt-1 font-mono text-sm text-on-surface break-all">{{ employee.cedula || '—' }}</p>
            </div>
            <div class="rounded-xl border border-outline-variant/40 bg-surface px-4 py-3">
              <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">User ID</p>
              <p class="mt-1 font-mono text-sm text-on-surface break-all">{{ employee.employeeId }}</p>
            </div>
          </div>
        </div>
      }

      <!-- First Name -->
      <div class="md:col-span-1">
        <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().firstNameLabel }} <span class="text-error">*</span></label>
        <div class="relative">
          <input type="text" data-form="firstName"
            class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant border-outline-variant focus:border-primary focus:ring-primary/20"
            [ngClass]="{'!border-error !focus:border-error !focus:ring-error/20': firstNameError()}"
            [maxLength]="100" placeholder="Ej: Carlos" [value]="firstName()"
            (keydown)="onNameKeyDown($event)"
            (input)="onFirstNameInput($any($event.target).value)" />
          <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline pointer-events-none select-none">{{ firstName().length }}/100</span>
        </div>
        @if (firstNameError()) {
          <p class="mt-1 text-xs text-error">{{ firstNameError() }}</p>
        }
      </div>
      <!-- Last Name -->
      <div class="md:col-span-1">
        <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().lastNameLabel }} <span class="text-error">*</span></label>
        <div class="relative">
          <input type="text" data-form="lastName"
            class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant border-outline-variant focus:border-primary focus:ring-primary/20"
            [ngClass]="{'!border-error !focus:border-error !focus:ring-error/20': lastNameError()}"
            [maxLength]="100" placeholder="Ej: González" [value]="lastName()"
            (keydown)="onNameKeyDown($event)"
            (input)="onLastNameInput($any($event.target).value)" />
          <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline pointer-events-none select-none">{{ lastName().length }}/100</span>
        </div>
        @if (lastNameError()) {
          <p class="mt-1 text-xs text-error">{{ lastNameError() }}</p>
        }
      </div>
      @if (!isEdit) {
        <!-- Cédula -->
        <div class="md:col-span-1">
          <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().docLabel }} <span class="text-error">*</span></label>
          <div class="relative">
            <input type="text" data-form="cedula" inputmode="numeric"
              class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant border-outline-variant focus:border-primary focus:ring-primary/20"
              [ngClass]="{'!border-error !focus:border-error !focus:ring-error/20': cedulaDisplayError()}"
              [maxLength]="10" placeholder="10 dígitos" [value]="cedula()"
              (keydown.space)="blockOuterSpace($event)"
              (keydown)="onNumericKeyDown($event)"
              (paste)="onNumericPaste($event)"
              (input)="onCedulaInput($any($event.target).value)" />
            <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline pointer-events-none select-none">{{ cedula().length }}/10</span>
          </div>
          @if (cedulaDisplayError()) {
            <p class="mt-1 text-xs text-error">{{ cedulaDisplayError() }}</p>
          }
        </div>
      }

      <!-- Email -->
      <div class="md:col-span-1">
        <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().emailLabel }} <span class="text-error">*</span></label>
        <div class="relative">
          <input type="email" data-form="email"
            class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant border-outline-variant focus:border-primary focus:ring-primary/20"
            [ngClass]="{'!border-error !focus:border-error !focus:ring-error/20': emailDisplayError()}"
            [maxLength]="255" placeholder="Ej: empleado@ejemplo.com" [value]="email()"
            (keydown.space)="blockOuterSpace($event)"
            (input)="onEmailInput($any($event.target).value)" />
          <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline pointer-events-none select-none">{{ email().length }}/255</span>
        </div>
        @if (emailDisplayError()) {
          <p class="mt-1 text-xs text-error">{{ emailDisplayError() }}</p>
        }
      </div>
      <!-- Username -->
      <div class="md:col-span-1">
        <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().usernameLabel }} <span class="text-error">*</span></label>
        <div class="relative">
          <input type="text" data-form="username"
            class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant border-outline-variant focus:border-primary focus:ring-primary/20"
            [ngClass]="{'!border-error !focus:border-error !focus:ring-error/20': usernameDisplayError()}"
            [maxLength]="50" placeholder="Ej: carlos.gonzalez" [value]="username()"
            (keydown.space)="blockOuterSpace($event)"
            (input)="onUsernameInput($any($event.target).value)" />
          <span class="absolute right-3 bottom-2.5 text-[10px] font-mono text-outline pointer-events-none select-none">{{ username().length }}/50</span>
        </div>
        @if (usernameDisplayError()) {
          <p class="mt-1 text-xs text-error">{{ usernameDisplayError() }}</p>
        }
      </div>
      <!-- Role -->
      <div class="md:col-span-1">
        <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().roleLabel }} <span class="text-error">*</span></label>
        <select
          class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          [value]="role()" (change)="role.set(normalizeRole($any($event.target).value))">
          <option value="">{{ copy().selectPlaceholder }}</option>
          @for (opt of visibleRoleOptions(); track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
      </div>
      <!-- Branch -->
      <div class="md:col-span-1">
        <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().branchLabel }}</label>
        <div class="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-500 px-3 py-1 text-[10px] font-bold tracking-wide select-none">
          <span class="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
          {{ branchLabel() | uppercase }}
        </div>
      </div>
    </div>
    <div footer class="flex w-full items-center justify-end gap-3">
      <button type="button"
        class="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all border border-outline-variant/50"
        (click)="onCancel.emit()">{{ copy().cancel }}</button>
      <button type="button"
        class="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
        [disabled]="!canSubmit() || submitting()" (click)="onSave.emit(buildPayload())">
        @if (submitting()) {
          <span class="inline-flex items-center gap-2">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ copy().savingText }}
          </span>
        } @else {
          {{ isEdit ? copy().saveEdit : copy().save }}
        }
      </button>
    </div>
  `,
})
export class EmployeesFormModalComponent {
  @Input({ required: true }) locale!: () => 'es' | 'en';
  @Input() employee?: EmployeeRowDto;
  @Input() roleOptions: () => { value: string; label: string }[] = () => [];
  @Input() submitting = () => false;
  @Input() defaultBranchId: () => string = () => '';
  @Input() serverCedulaError = () => '';
  @Input() serverEmailError = () => '';
  @Input() serverUsernameError = () => '';
  @Input() clearServerCedulaError: () => void = () => {};
  @Input() clearServerEmailError: () => void = () => {};
  @Input() clearServerUsernameError: () => void = () => {};

  @Output() onCancel = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<{
    firstName: string; lastName: string; cedula: string; email: string;
    username: string; role: string; defaultBranchId: string;
  }>();

  firstName = signal('');
  lastName = signal('');
  cedula = signal('');
  email = signal('');
  username = signal('');
  role = signal('');
  branchId = signal('');

  readonly branchLabel = computed(() =>
    this.localeState() === 'es' ? 'Sucursal actual' : 'Current branch'
  );

  // Spec 3 R6: initial-value snapshot for the unsaved-changes guard.
  // The modal is *ngIf'd by the parent (employees-page) and re-created
  // on every open, so the snapshot is captured exactly once at ngOnInit.
  private readonly initialFirstName = signal('');
  private readonly initialLastName = signal('');
  private readonly initialCedula = signal('');
  private readonly initialEmail = signal('');
  private readonly initialUsername = signal('');
  private readonly initialRole = signal('');
  private readonly initialBranchId = signal('');

  // Spec 3 R6: dirty signal — true when any form field diverges from the
  // initial baseline. Read by the parent (employees-page) which threads
  // the signal into the surrounding `<billflow-modal-shell>` via
  // `[formHasChanges]`. (The shell lives in the parent because this
  // modal is rendered as `<ng-content>` inside the page's shell.)
  readonly formHasChanges = computed(() =>
    this.firstName() !== this.initialFirstName()
    || this.lastName() !== this.initialLastName()
    || this.cedula() !== this.initialCedula()
    || this.email() !== this.initialEmail()
    || this.username() !== this.initialUsername()
    || this.role() !== this.initialRole()
    || this.branchId() !== this.initialBranchId()
  );

  private localeState = signal<EmployeesLocale>('es');

  get isEdit() { return !!this.employee; }

  ngOnInit() {
    this.localeState.set(this.locale() === 'en' ? 'en' : 'es');
    if (this.employee) {
      this.firstName.set(this.employee.firstName);
      this.lastName.set(this.employee.lastName);
      this.cedula.set(this.employee.cedula ?? '');
      this.email.set(this.employee.email ?? '');
      this.username.set(this.employee.username ?? '');
      this.role.set(this.normalizeRole(this.employee.role));
    }
    this.branchId.set(this.defaultBranchId());
    this.captureSnapshot();
  }

  private captureSnapshot(): void {
    this.initialFirstName.set(this.firstName());
    this.initialLastName.set(this.lastName());
    this.initialCedula.set(this.cedula());
    this.initialEmail.set(this.email());
    this.initialUsername.set(this.username());
    this.initialRole.set(this.role());
    this.initialBranchId.set(this.branchId());
  }

  readonly copy = computed(() => FORM_COPY[this.localeState()]);

  private normalizeRole(value: string | null | undefined): string {
    return typeof value === 'string' ? value.trim().toUpperCase() : '';
  }

  readonly visibleRoleOptions = computed(() => {
    const options = [...this.roleOptions()];
    if (!this.isEdit || !this.employee?.role) return options;

    const currentRole = this.normalizeRole(this.employee.role);
    if (!currentRole) return options;
    if (options.some((opt) => this.normalizeRole(opt.value) === currentRole)) return options;

    return [{ value: currentRole, label: currentRole }, ...options];
  });

  readonly canSubmit = computed(() => {
    if (!this.isValid()) return false;
    return this.isEdit ? this.formHasChanges() : true;
  });

  // ── Input handlers ────────────────────────────────────────────────────────

  onFirstNameInput(value: string) {
    // Solo letras, sin espacios ni números ni caracteres especiales
    this.firstName.set(value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, ''));
  }

  onLastNameInput(value: string) {
    // Solo letras, sin espacios ni números ni caracteres especiales
    this.lastName.set(value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, ''));
  }

  onCedulaInput(value: string) {
    // Solo dígitos, máximo 10
    this.cedula.set(value.replace(/\D/g, '').slice(0, 10));
    this.clearServerCedulaError();
  }

  onEmailInput(value: string) {
    // Los emails no pueden contener espacios en ninguna posición
    this.email.set(value.replace(/\s/g, ''));
    this.clearServerEmailError();
  }

  onUsernameInput(value: string) {
    // Sin espacios en el username
    this.username.set(value.replace(/\s/g, ''));
    this.clearServerUsernameError();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

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

  onNameKeyDown(event: KeyboardEvent): void {
    // Allow: backspace, delete, tab, escape, enter, arrows, home, end, ctrl/cmd
    const allowedKeys = new Set([
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'Shift', 'Control', 'Alt', 'Meta',
    ]);
    if (allowedKeys.has(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    // Block all digits and other non-letter characters
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      return;
    }
    if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(event.key)) {
      event.preventDefault();
    }
  }

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

  readonly firstNameError = computed(() => {
    const v = this.firstName();
    if (!v) return '';
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/.test(v) ? '' : FORM_COPY[this.localeState()].firstNameError;
  });
  readonly lastNameError = computed(() => {
    const v = this.lastName();
    if (!v) return '';
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/.test(v) ? '' : FORM_COPY[this.localeState()].lastNameError;
  });
  readonly cedulaError = computed(() => {
    const v = this.cedula();
    if (!v) return '';
    return /^\d{10}$/.test(v) ? '' : FORM_COPY[this.localeState()].cedulaExact10;
  });
  readonly cedulaDisplayError = computed(() => this.cedulaError() || this.serverCedulaError());
  readonly emailError = computed(() => {
    const v = this.email();
    if (!v) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : FORM_COPY[this.localeState()].emailInvalidFormat;
  });
  readonly emailDisplayError = computed(() => this.emailError() || this.serverEmailError());
  readonly usernameError = computed(() => {
    const v = this.username();
    if (!v) return '';
    return /\s/.test(v) ? FORM_COPY[this.localeState()].usernameNoSpaces : '';
  });
  readonly usernameDisplayError = computed(() => this.usernameError() || this.serverUsernameError());

  isValid() {
    return (
      this.firstName() && !this.firstNameError() &&
      this.lastName() && !this.lastNameError() &&
      (this.isEdit || (this.cedula() && !this.cedulaError())) &&
      this.email() && !this.emailError() &&
      this.username() && !this.usernameError() &&
      this.role()
    );
  }

  buildPayload() {
    return {
      firstName: this.firstName(),
      lastName: this.lastName(),
      cedula: this.cedula(),
      email: this.email(),
      username: this.username(),
      role: this.role(),
      defaultBranchId: this.branchId(),
    };
  }
}
