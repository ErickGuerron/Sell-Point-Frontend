import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { AuthLoginPayload, AuthText } from '../auth.dictionary';

@Component({
  selector: 'billflow-login-form',
  standalone: true,
  imports: [CommonModule],
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

      <form class="flex flex-col gap-md flex-grow justify-center" (submit)="submitLogin.emit({ identifier: employeeId.value.trim(), secret: pin.value }); $event.preventDefault(); employeeId.value=''; pin.value='';">
        <div class="app-auth-field">
          <label class="font-label-bold text-label-bold text-on-surface" for="employee-id">{{ copy.login.employeeLabel }}</label>
          <div class="app-auth-field__input-wrap">
            <span class="material-symbols-outlined app-auth-field__icon">badge</span>
            <input #employeeId id="employee-id" class="app-auth-field__input" [placeholder]="copy.login.employeePlaceholder" type="text" />
          </div>
        </div>

        <div class="app-auth-field">
          <label class="font-label-bold text-label-bold text-on-surface" for="pin">{{ copy.login.pinLabel }}</label>
          <div class="app-auth-field__input-wrap">
            <span class="material-symbols-outlined app-auth-field__icon">pin</span>
            <input #pin id="pin" class="app-auth-field__input" [placeholder]="copy.login.pinPlaceholder" type="password" />
          </div>
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
        <a class="app-auth-help__link font-body-sm text-body-sm" href="#">
          <span class="material-symbols-outlined text-[16px]">help</span>
          <span>{{ copy.login.help }}</span>
        </a>
      </div>
    </div>
  `
})
export class LoginFormComponent {
  @Input({ required: true }) copy!: AuthText;
  @Input() statusMessage: string | null = null;
  @Input() statusTone: 'idle' | 'success' | 'error' = 'idle';
  @Output() submitLogin = new EventEmitter<AuthLoginPayload>();
}
