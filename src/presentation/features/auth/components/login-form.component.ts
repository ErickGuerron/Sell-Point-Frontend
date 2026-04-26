import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AuthLoginPayload, AuthText } from '../auth.dictionary';
import { UiFeedbackService } from '../../../shared/services/ui-feedback.service';

@Component({
  selector: 'billflow-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: { class: 'block w-full' },
  template: `
    <div class="w-full max-w-[460px]">
      <div class="app-auth-brand">
        <div class="app-auth-brand__badge">
          <span class="material-symbols-outlined text-2xl">point_of_sale</span>
        </div>
        <span class="font-h3 text-h3 text-primary font-bold tracking-tight">{{ copy.brand }}</span>
      </div>

      <div class="app-auth-heading">
        <h1 class="font-h1 text-h1 text-on-surface mb-xs">{{ copy.login.title }}</h1>
        <p class="font-body-md text-body-md text-on-surface-variant">{{ copy.login.subtitle }}</p>
      </div>

      <form #loginForm="ngForm" class="flex flex-col gap-md flex-grow justify-center" (ngSubmit)="handleSubmit(loginForm)">
        <div class="app-auth-field">
          <label class="font-label-bold text-label-bold text-on-surface" for="employee-id">{{ copy.login.employeeLabel }}</label>
          <div class="app-auth-field__input-wrap">
            <span class="material-symbols-outlined app-auth-field__icon">badge</span>
            <input
              id="employee-id"
              name="employeeId"
              class="app-auth-field__input"
              [placeholder]="copy.login.employeePlaceholder"
              type="text"
              [(ngModel)]="employeeId"
              #employeeIdModel="ngModel"
              required
              minlength="3"
            />
          </div>
          <p *ngIf="showErrors && employeeIdModel.errors?.['required']" class="app-auth-field__error">{{ copy.validation.employeeRequired }}</p>
          <p *ngIf="showErrors && employeeIdModel.errors?.['minlength']" class="app-auth-field__error">{{ copy.validation.employeeMinLength }}</p>
        </div>

        <div class="app-auth-field">
          <label class="font-label-bold text-label-bold text-on-surface" for="pin">{{ copy.login.pinLabel }}</label>
          <div class="app-auth-field__input-wrap">
            <span class="material-symbols-outlined app-auth-field__icon">pin</span>
            <input
              id="pin"
              name="pin"
              class="app-auth-field__input"
              [placeholder]="copy.login.pinPlaceholder"
              type="password"
              [(ngModel)]="pin"
              #pinModel="ngModel"
              required
              minlength="4"
            />
          </div>
          <p *ngIf="showErrors && pinModel.errors?.['required']" class="app-auth-field__error">{{ copy.validation.pinRequired }}</p>
          <p *ngIf="showErrors && pinModel.errors?.['minlength']" class="app-auth-field__error">{{ copy.validation.pinMinLength }}</p>
        </div>

        <div class="mt-xs">
          <button class="app-auth-button" type="submit">
            <span class="material-symbols-outlined text-[20px]">lock_open</span>
            <span>{{ copy.login.submit }}</span>
          </button>
        </div>
      </form>

      <p *ngIf="statusMessage" class="app-auth-feedback" [class.app-auth-feedback--success]="statusTone === 'success'" [class.app-auth-feedback--error]="statusTone === 'error'">
        {{ statusMessage }}
      </p>

      <div class="app-auth-help">
        <button type="button" class="app-auth-help__link font-body-sm text-body-sm bg-transparent border-0 p-0" (click)="requestSupport.emit()">
          <span class="material-symbols-outlined text-[16px]">help</span>
          <span>{{ copy.login.help }}</span>
        </button>
      </div>
    </div>
  `
})
export class LoginFormComponent {
  private readonly feedback = inject(UiFeedbackService);

  @Input({ required: true }) copy!: AuthText;
  @Input() statusMessage: string | null = null;
  @Input() statusTone: 'idle' | 'success' | 'error' = 'idle';
  @Output() submitLogin = new EventEmitter<AuthLoginPayload>();
  @Output() requestSupport = new EventEmitter<void>();

  employeeId = '';
  pin = '';
  showErrors = false;

  async handleSubmit(form: { valid: boolean }) {
    this.showErrors = true;

    if (!form.valid) {
      await this.feedback.toast('error', this.copy.validation.formInvalid);
      return;
    }

    this.submitLogin.emit({ identifier: this.employeeId.trim(), secret: this.pin });
  }
}
