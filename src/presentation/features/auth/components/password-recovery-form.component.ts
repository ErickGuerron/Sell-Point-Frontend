import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AuthText } from '../auth.dictionary';
import { UiFeedbackService } from '../../../shared/services/ui-feedback.service';

@Component({
  selector: 'billflow-password-recovery-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: { class: 'block w-full' },
  template: `
    <div class="app-auth-form-shell app-auth-form-shell--recovery">
      <button
        type="button"
        class="app-auth-recovery__back app-auth-help__link font-body-sm text-body-sm bg-transparent border-0 p-0"
        (click)="requestBack.emit()"
      >
        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
        <span>{{ copy.recovery.backToLogin }}</span>
      </button>

      <div class="app-auth-recovery__content">
        <div class="app-auth-heading app-auth-heading--recovery">
          <div class="app-auth-recovery__badge">
            <span class="material-symbols-outlined text-[20px]" aria-hidden="true">mark_email_read</span>
          </div>
          <h1 class="font-h1 text-h1 text-on-surface mb-xs">{{ copy.recovery.title }}</h1>
          <p class="font-body-md text-body-md text-on-surface-variant">{{ copy.recovery.subtitle }}</p>
        </div>

        <form #recoveryForm="ngForm" class="app-auth-recovery__form flex flex-col gap-md" (ngSubmit)="handleSubmit(recoveryForm)">
          <div class="app-auth-field">
            <label class="font-label-bold text-label-bold text-on-surface" for="recovery-email">{{ copy.recovery.emailLabel }}</label>
            <div class="app-auth-field__input-wrap">
              <span class="material-symbols-outlined app-auth-field__icon">mail</span>
              <input
                id="recovery-email"
                name="recoveryEmail"
                class="app-auth-field__input"
                [placeholder]="copy.recovery.emailPlaceholder"
                type="email"
                [(ngModel)]="email"
                #emailModel="ngModel"
                required
                email
              />
            </div>
            <p *ngIf="showErrors && emailModel.errors?.['required']" class="app-auth-field__error">{{ copy.recovery.validation.emailRequired }}</p>
            <p *ngIf="showErrors && emailModel.errors?.['email']" class="app-auth-field__error">{{ copy.recovery.validation.emailInvalid }}</p>
          </div>

          <div class="mt-xs">
            <button class="app-auth-button" type="submit">
              <span class="material-symbols-outlined text-[20px]">send</span>
              <span>{{ copy.recovery.submit }}</span>
            </button>
          </div>
        </form>

        <p *ngIf="statusMessage" class="app-auth-feedback app-auth-recovery__feedback" [class.app-auth-feedback--success]="statusTone === 'success'" [class.app-auth-feedback--error]="statusTone === 'error'" role="status" aria-live="polite">
          {{ statusMessage }}
        </p>

        <div class="app-auth-help app-auth-recovery__help flex flex-col items-center gap-2">
          <button type="button" class="app-auth-help__link font-body-sm text-body-sm bg-transparent border-0 p-0" (click)="requestSupport.emit()">
            <span class="material-symbols-outlined text-[16px]">help</span>
            <span>{{ copy.recovery.help }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PasswordRecoveryFormComponent {
  private readonly feedback = inject(UiFeedbackService);

  @Input({ required: true }) copy!: AuthText;
  @Input() statusMessage: string | null = null;
  @Input() statusTone: 'idle' | 'success' | 'error' = 'idle';
  @Output() submitRecovery = new EventEmitter<{ email: string }>();
  @Output() requestBack = new EventEmitter<void>();
  @Output() requestSupport = new EventEmitter<void>();

  email = '';
  showErrors = false;

  async handleSubmit(form: { valid: boolean }) {
    this.showErrors = true;

    if (!form.valid) {
      await this.feedback.toast('error', this.copy.recovery.validation.formInvalid);
      return;
    }

    this.submitRecovery.emit({ email: this.email.trim() });
  }
}
