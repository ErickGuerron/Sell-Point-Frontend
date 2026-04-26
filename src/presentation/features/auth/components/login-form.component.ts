import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { AuthText } from '../auth.dictionary';

@Component({
  selector: 'billflow-login-form',
  standalone: true,
  host: { class: 'block w-full' },
  template: `
    <div class="w-full max-w-[460px]">
      <div class="flex items-center gap-xs mb-xl">
        <div class="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
          <span class="material-symbols-outlined text-2xl">point_of_sale</span>
        </div>
        <span class="font-h3 text-h3 text-primary font-bold tracking-tight">{{ copy.brand }}</span>
      </div>

      <div class="mb-lg">
        <h1 class="font-h1 text-h1 text-on-surface mb-xs">{{ copy.login.title }}</h1>
        <p class="font-body-md text-body-md text-on-surface-variant">{{ copy.login.subtitle }}</p>
      </div>

      <form class="flex flex-col gap-md flex-grow justify-center" (submit)="$event.preventDefault()">
        <div class="flex flex-col gap-base">
          <label class="font-label-bold text-label-bold text-on-surface" for="employee-id">{{ copy.login.employeeLabel }}</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-[20px] text-outline pointer-events-none">badge</span>
            <input id="employee-id" class="bg-surface-container-low border border-outline-variant rounded-lg pl-[48px] pr-sm py-[12px] font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors w-full" [placeholder]="copy.login.employeePlaceholder" type="text" />
          </div>
        </div>

        <div class="flex flex-col gap-base">
          <label class="font-label-bold text-label-bold text-on-surface" for="pin">{{ copy.login.pinLabel }}</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-[20px] text-outline pointer-events-none">pin</span>
            <input id="pin" class="bg-surface-container-low border border-outline-variant rounded-lg pl-[48px] pr-sm py-[12px] font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors w-full" [placeholder]="copy.login.pinPlaceholder" type="password" />
          </div>
        </div>

        <div class="mt-xs">
          <button class="w-full bg-primary text-on-primary font-button text-button py-[14px] rounded-lg hover:bg-gradient-to-r hover:from-primary hover:to-secondary-container transition-all duration-300 shadow-[0_4px_14px_0_rgba(53,37,205,0.39)] hover:shadow-[0_6px_20px_rgba(53,37,205,0.23)] hover:-translate-y-px flex items-center justify-center gap-xs" type="button">
            <span class="material-symbols-outlined text-[20px]">lock_open</span>
            <span>{{ copy.login.submit }}</span>
          </button>
        </div>
      </form>

      <div class="mt-xl text-center">
        <a class="font-body-sm text-body-sm text-primary hover:text-secondary-container transition-colors inline-flex items-center gap-base" href="#">
          <span class="material-symbols-outlined text-[16px]">help</span>
          <span>{{ copy.login.help }}</span>
        </a>
      </div>
    </div>
  `
})
export class LoginFormComponent {
  @Input({ required: true }) copy!: AuthText;
  @Output() submitLogin = new EventEmitter<void>();
}
