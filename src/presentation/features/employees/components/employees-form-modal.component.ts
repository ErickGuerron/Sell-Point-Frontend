import { CommonModule } from '@angular/common';
import { Component, computed, Input, Output, EventEmitter, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BillflowModalShellComponent } from '../../../shared/components/billflow-modal-shell.component';

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
      <div class="md:col-span-1">
        <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().firstNameLabel }} <span class="text-error">*</span></label>
        <input type="text" class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant"
          [ngClass]="firstNameError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'"
          [maxLength]="100" placeholder="Ej: Carlos" [value]="firstName()" (input)="firstName.set($any($event.target).value)" />
        @if (firstNameError()) {
          <span class="text-xs text-error mt-1 block">{{ firstNameError() }}</span>
        }
        <span class="text-xs text-outline ml-auto mt-1 block text-right">{{ firstName().length }}/100</span>
      </div>
      <div class="md:col-span-1">
        <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().lastNameLabel }} <span class="text-error">*</span></label>
        <input type="text" class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant"
          [ngClass]="lastNameError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'"
          [maxLength]="100" placeholder="Ej: González" [value]="lastName()" (input)="lastName.set($any($event.target).value)" />
        @if (lastNameError()) {
          <span class="text-xs text-error mt-1 block">{{ lastNameError() }}</span>
        }
        <span class="text-xs text-outline ml-auto mt-1 block text-right">{{ lastName().length }}/100</span>
      </div>
      <div class="md:col-span-1">
        <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().docLabel }} <span class="text-error">*</span></label>
        <input type="text" class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant"
          [ngClass]="cedulaError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'"
          [maxLength]="10" placeholder="Ej: 1234567890" [value]="cedula()" (input)="cedula.set($any($event.target).value)" />
        @if (cedulaError()) {
          <span class="text-xs text-error mt-1 block">{{ cedulaError() }}</span>
        }
        <span class="text-xs text-outline ml-auto mt-1 block text-right">{{ cedula().length }}/10</span>
      </div>
      <div class="md:col-span-1">
        <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().emailLabel }} <span class="text-error">*</span></label>
        <input type="email" class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant"
          [ngClass]="emailError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'"
          [maxLength]="255" placeholder="Ej: empleado@ejemplo.com" [value]="email()" (input)="email.set($any($event.target).value)" />
        @if (emailError()) {
          <span class="text-xs text-error mt-1 block">{{ emailError() }}</span>
        }
        <span class="text-xs text-outline ml-auto mt-1 block text-right">{{ email().length }}/255</span>
      </div>
      <div class="md:col-span-1">
        <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().usernameLabel }} <span class="text-error">*</span></label>
        <input type="text" class="w-full px-4 py-2.5 bg-surface border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 transition-all placeholder:text-outline-variant"
          [ngClass]="usernameError() ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'"
          [maxLength]="50" placeholder="Ej: carlos.gonzalez" [value]="username()" (input)="username.set($any($event.target).value)" />
        @if (usernameError()) {
          <span class="text-xs text-error mt-1 block">{{ usernameError() }}</span>
        }
        <span class="text-xs text-outline ml-auto mt-1 block text-right">{{ username().length }}/50</span>
      </div>
      <div class="md:col-span-1">
        <label class="block text-sm font-semibold text-on-surface mb-1.5">{{ copy().roleLabel }} <span class="text-error">*</span></label>
        <select class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                [value]="role()" (change)="role.set($any($event.target).value)">
          <option value="">{{ copy().selectPlaceholder }}</option>
          @for (opt of roleOptions(); track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
      </div>
    </div>
    <div footer class="flex w-full items-center justify-end gap-3">
      <button type="button" class="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all border border-outline-variant/50" (click)="onCancel.emit()">{{ copy().cancel }}</button>
      <button type="button" class="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
              [disabled]="!isValid() || submitting()" (click)="onSave.emit(buildPayload())">
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

  @Output() onCancel = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<{
    firstName: string; lastName: string; cedula: string; email: string;
    username: string; role: string;
  }>();

  firstName = signal('');
  lastName = signal('');
  cedula = signal('');
  email = signal('');
  username = signal('');
  role = signal('');

  // Spec 3 R6: initial-value snapshot for the unsaved-changes guard.
  // The modal is *ngIf'd by the parent (employees-page) and re-created
  // on every open, so the snapshot is captured exactly once at ngOnInit.
  private readonly initialFirstName = signal('');
  private readonly initialLastName = signal('');
  private readonly initialCedula = signal('');
  private readonly initialEmail = signal('');
  private readonly initialUsername = signal('');
  private readonly initialRole = signal('');

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
  );

  private localeState = signal<EmployeesLocale>('es');

  get isEdit() { return !!this.employee; }

  ngOnInit() {
    this.localeState.set(this.locale() === 'en' ? 'en' : 'es');
    if (this.employee) {
      this.firstName.set(this.employee.firstName);
      this.lastName.set(this.employee.lastName);
      this.cedula.set(this.employee.employeeId.replace('EMP-', ''));
      this.email.set(this.employee.email ?? '');
      this.username.set(this.employee.email?.split('@')[0] ?? '');
      this.role.set(this.employee.role);
    }
    this.captureSnapshot();
  }

  private captureSnapshot(): void {
    this.initialFirstName.set(this.firstName());
    this.initialLastName.set(this.lastName());
    this.initialCedula.set(this.cedula());
    this.initialEmail.set(this.email());
    this.initialUsername.set(this.username());
    this.initialRole.set(this.role());
  }

  readonly copy = computed(() => FORM_COPY[this.localeState()]);

  readonly firstNameError = computed(() => {
    const v = this.firstName();
    if (!v) return '';
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(v) ? '' : FORM_COPY[this.localeState()].firstNameError;
  });
  readonly lastNameError = computed(() => {
    const v = this.lastName();
    if (!v) return '';
    if (/\s/.test(v)) return FORM_COPY[this.localeState()].lastNameNoSpaces;
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(v) ? '' : FORM_COPY[this.localeState()].lastNameError;
  });
  readonly cedulaError = computed(() => {
    const v = this.cedula();
    if (!v) return '';
    return /^\d{10}$/.test(v) ? '' : FORM_COPY[this.localeState()].cedulaExact10;
  });
  readonly emailError = computed(() => {
    const v = this.email();
    if (!v) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : FORM_COPY[this.localeState()].emailInvalidFormat;
  });
  readonly usernameError = computed(() => {
    const v = this.username();
    if (!v) return '';
    return /\s/.test(v) ? FORM_COPY[this.localeState()].usernameNoSpaces : '';
  });

  isValid() {
    return (
      this.firstName() && !this.firstNameError() &&
      this.lastName() && !this.lastNameError() &&
      this.cedula() && !this.cedulaError() &&
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
    };
  }
}
