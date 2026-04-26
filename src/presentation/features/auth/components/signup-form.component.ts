import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { AuthText } from '../auth.dictionary';

@Component({
  selector: 'billflow-signup-form',
  standalone: true,
  host: { class: 'block w-full' },
  template: `
    <div class="w-full mx-auto">
      <div class="flex items-center gap-3 mb-6 md:mb-12">
        <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          <span class="material-symbols-outlined text-2xl">payments</span>
        </div>
        <span class="font-h3 text-h3 text-on-surface tracking-tight">{{ copy.brand }}</span>
      </div>

      <h2 class="font-h2 text-h2 text-on-surface mb-3">{{ copy.signup.title }}</h2>
      <p class="font-body-md text-body-md text-on-surface-variant mb-6 md:mb-10">{{ copy.signup.subtitle }}</p>

      <form class="space-y-4 md:space-y-6" (submit)="$event.preventDefault()">
        <div>
          <label class="block font-label-bold text-label-bold text-on-surface-variant mb-3">{{ copy.signup.nameLabel }}</label>
          <input class="w-full bg-surface-container-low border border-transparent focus:border-primary focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest rounded-lg px-5 py-3.5 font-body-sm text-on-surface transition-colors outline-none placeholder:text-outline-variant" [placeholder]="copy.signup.namePlaceholder" type="text" required />
        </div>

        <div>
          <label class="block font-label-bold text-label-bold text-on-surface-variant mb-3">{{ copy.signup.emailLabel }}</label>
          <input class="w-full bg-surface-container-low border border-transparent focus:border-primary focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest rounded-lg px-5 py-3.5 font-body-sm text-on-surface transition-colors outline-none placeholder:text-outline-variant" [placeholder]="copy.signup.emailPlaceholder" type="email" required />
        </div>

        <div>
          <label class="block font-label-bold text-label-bold text-on-surface-variant mb-3">{{ copy.signup.passwordLabel }}</label>
          <input class="w-full bg-surface-container-low border border-transparent focus:border-primary focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest rounded-lg px-5 py-3.5 font-body-sm text-on-surface transition-colors outline-none placeholder:text-outline-variant" [placeholder]="copy.signup.passwordPlaceholder" type="password" required />
        </div>

        <button class="w-full bg-primary hover:bg-surface-tint text-on-primary font-button text-button rounded-lg py-3.5 mt-3 md:mt-5 transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98]" type="submit">
          {{ copy.signup.submit }}
        </button>
      </form>
    </div>
  `
})
export class SignupFormComponent {
  @Input({ required: true }) copy!: AuthText;
  @Output() submitSignup = new EventEmitter<void>();
}
