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
        <!-- Email -->
        <div class="app-auth-field">
          <label class="font-label-bold text-label-bold text-on-surface" for="email">{{ copy.login.emailLabel }}</label>
          <div class="app-auth-field__input-wrap">
            <span class="material-symbols-outlined app-auth-field__icon">mail</span>
            <input
              id="email"
              name="email"
              class="app-auth-field__input"
              [placeholder]="copy.login.emailPlaceholder"
              type="email"
              [(ngModel)]="email"
              #emailModel="ngModel"
              required
              email
            />
          </div>
          <p *ngIf="showErrors && emailModel.errors?.['required']" class="app-auth-field__error">{{ copy.validation.emailRequired }}</p>
          <p *ngIf="showErrors && emailModel.errors?.['email']" class="app-auth-field__error">{{ copy.validation.emailInvalid }}</p>
        </div>

        <!-- Password with eye toggle -->
        <div class="app-auth-field">
          <label class="font-label-bold text-label-bold text-on-surface" for="password">{{ copy.login.passwordLabel }}</label>
          <div class="app-auth-field__input-wrap">
            <span class="material-symbols-outlined app-auth-field__icon">lock</span>
            <input
              id="password"
              name="password"
              class="app-auth-field__input"
              [placeholder]="copy.login.passwordPlaceholder"
              [type]="showPassword ? 'text' : 'password'"
              [(ngModel)]="password"
              #passwordModel="ngModel"
              required
              minlength="4"
            />
            <button
              type="button"
              class="app-auth-field__toggle"
              (click)="togglePassword()"
              [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
              tabindex="-1"
            >
              <span class="material-symbols-outlined text-[20px]">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
          <p *ngIf="showErrors && passwordModel.errors?.['required']" class="app-auth-field__error">{{ copy.validation.passwordRequired }}</p>
          <p *ngIf="showErrors && passwordModel.errors?.['minlength']" class="app-auth-field__error">{{ copy.validation.passwordMinLength }}</p>
        </div>

        <!-- Submit -->
        <div class="mt-xs">
          <button class="app-auth-button" type="submit">
            <span class="material-symbols-outlined text-[20px]">lock_open</span>
            <span>{{ copy.login.submit }}</span>
          </button>
        </div>

        <!-- Divider -->
        <div class="flex items-center gap-3 my-1">
          <span class="flex-1 h-px bg-outline-variant/50"></span>
          <span class="text-xs font-medium text-on-surface-variant/60 uppercase tracking-wider">{{ copy.login.orText }}</span>
          <span class="flex-1 h-px bg-outline-variant/50"></span>
        </div>

        <!-- Google Login -->
        <button
          type="button"
          class="app-auth-button app-auth-button--google"
          (click)="handleGoogleLogin()"
        >
          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>{{ copy.login.googleLogin }}</span>
        </button>
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
  `,
  styles: [`
    .app-auth-field__toggle {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--md-sys-color-outline-variant, #938f99);
      border-radius: 8px;
      transition: color 0.2s;
    }
    .app-auth-field__toggle:hover {
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
  `]
})
export class LoginFormComponent {
  private readonly feedback = inject(UiFeedbackService);

  @Input({ required: true }) copy!: AuthText;
  @Input() statusMessage: string | null = null;
  @Input() statusTone: 'idle' | 'success' | 'error' = 'idle';
  @Output() submitLogin = new EventEmitter<AuthLoginPayload>();
  @Output() requestSupport = new EventEmitter<void>();

  email = '';
  password = '';
  showPassword = false;
  showErrors = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async handleGoogleLogin() {
    // Placeholder — Google OAuth se conecta cuando el backend lo soporte
    await this.feedback.toast('info', 'Google login coming soon');
  }

  async handleSubmit(form: { valid: boolean }) {
    this.showErrors = true;

    if (!form.valid) {
      await this.feedback.toast('error', this.copy.validation.formInvalid);
      return;
    }

    this.submitLogin.emit({ identifier: this.email.trim(), secret: this.password });
  }
}
