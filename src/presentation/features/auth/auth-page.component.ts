import { CommonModule } from '@angular/common';
import { Component, computed, Input, signal } from '@angular/core';
import { AUTH_TEXT, detectAuthLocale, normalizeAuthMode } from './auth.dictionary';
import type { AuthLocale, AuthMode } from './auth.dictionary';
import { LoginFormComponent } from './components/login-form.component';
import { SignupFormComponent } from './components/signup-form.component';

@Component({
  selector: 'billflow-auth-page',
  standalone: true,
  imports: [CommonModule, LoginFormComponent, SignupFormComponent],
  host: {
    class: 'w-full flex justify-center'
  },
  template: `
    <!-- Main Authentication Container (Responsive Layout) -->
    <main class="relative w-full max-w-5xl h-[850px] md:h-[650px] bg-surface-container-lowest rounded-xl shadow-[0_10px_30px_rgba(79,70,229,0.08)] overflow-hidden flex flex-col md:flex-row border border-surface-variant">
      
      <!-- Pure CSS State Toggle (Checkbox Hack) -->
      <input class="hidden peer/auth" id="auth-toggle" type="checkbox" [checked]="mode() === 'signup'" (change)="toggleMode()" />

      <button
        type="button"
        class="absolute top-4 right-4 z-30 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-lg backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-[0_12px_26px_rgba(79,70,229,0.14)] dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-500 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
        (click)="toggleLocale()"
      >
        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">language</span>
        <span>{{ languageLabel() }}</span>
      </button>

      <!-- ========================================== -->
      <!-- LOGIN FORM (Default Visible)      -->
      <!-- ========================================== -->
      <div class="absolute top-0 left-0 w-full md:w-1/2 h-[55%] md:h-full flex flex-col justify-center px-8 md:px-12 lg:px-16 transition-all duration-700 ease-in-out z-10 peer-checked/auth:opacity-0 peer-checked/auth:-translate-y-12 md:peer-checked/auth:-translate-y-0 md:peer-checked/auth:-translate-x-12 peer-checked/auth:pointer-events-none bg-surface-container-lowest">
        <billflow-login-form [copy]="copy()" class="block w-full" />
      </div>

      <!-- ========================================== -->
      <!-- SIGN UP FORM (Hidden Default)    -->
      <!-- ========================================== -->
      <div class="absolute top-0 left-0 md:left-auto md:right-0 w-full md:w-1/2 h-[55%] md:h-full flex flex-col justify-center px-8 md:px-12 lg:px-16 transition-all duration-700 ease-in-out z-10 opacity-0 translate-y-12 md:translate-y-0 md:translate-x-12 pointer-events-none peer-checked/auth:opacity-100 peer-checked/auth:translate-y-0 md:peer-checked/auth:translate-x-0 peer-checked/auth:pointer-events-auto bg-surface-container-lowest">
        <billflow-signup-form [copy]="copy()" class="block w-full" />
      </div>

      <!-- ========================================== -->
      <!-- SLIDING OVERLAY PANEL (Image & Toggles)      -->
      <!-- ========================================== -->
      <div class="absolute top-[55%] md:top-0 right-0 w-full md:w-1/2 h-[45%] md:h-full z-20 transition-all duration-700 ease-in-out peer-checked/auth:-translate-y-[122.22%] md:peer-checked/auth:-translate-y-0 md:peer-checked/auth:-translate-x-full overflow-hidden shadow-[0_-10px_30px_rgba(79,70,229,0.1)] md:shadow-[-10px_0_30px_rgba(79,70,229,0.1)] peer-checked/auth:shadow-[0_10px_30px_rgba(79,70,229,0.1)] md:peer-checked/auth:shadow-[10px_0_30px_rgba(79,70,229,0.1)]">
        
        <!-- Parallax Image Wrapper -->
        <div class="absolute inset-0 w-full md:w-[200%] h-[200%] md:h-full transition-transform duration-700 ease-in-out -translate-y-1/4 md:-translate-y-0 md:-translate-x-1/4 peer-checked/auth:translate-y-0 md:peer-checked/auth:translate-x-0 bg-surface-tint">
          <img class="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD59D1_3c9uF0riJi7BKG1SW0puoB5fq0btxMHiJixJUWSiYqU1sIfELVT5aLeSNvmL0vUgj_4Xrv3Mnv04q1cUQtdZ4NQvZgnFHy1GnBCBUGsYDpOYCDyU5aC8S6vzbBMg_DcLP_FlorTk7GroGN9IRSaMvC_ekeyizl70a8Up_ynTAbu_rd2ApyRiJKLqqKYEwC3cE9Ab1tW7WP2QHEuXvYbCahDrfHMLQqD9FtqDByNy2aW0ZEzWOTAKZP4Gssv3tTZ4xjQmXRc" alt="Abstract deep indigo geometric shapes" />
          <div class="absolute inset-0 bg-gradient-to-br from-primary/90 to-secondary/80 mix-blend-multiply"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-on-primary-fixed/60 via-transparent to-transparent"></div>
          <div class="absolute inset-0 bg-pattern opacity-30"></div>
        </div>

        <!-- Content Container -->
        <div class="absolute inset-0 flex items-center justify-center">
          
          <!-- Login State Overlay Text -->
          <div class="absolute flex flex-col items-center justify-center text-center w-full px-6 md:px-12 transition-all duration-700 ease-in-out opacity-100 translate-y-0 md:translate-x-0 peer-checked/auth:opacity-0 peer-checked/auth:translate-y-12 md:peer-checked/auth:translate-y-0 md:peer-checked/auth:translate-x-12 pointer-events-auto peer-checked/auth:pointer-events-none">
            <div class="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 md:mb-6 shadow-lg border border-white/20">
              <span class="material-symbols-outlined text-on-primary text-2xl md:text-3xl">rocket_launch</span>
            </div>
            <h3 class="font-h2 md:font-h1 text-h2 md:text-h1 text-on-primary mb-2 md:mb-4 drop-shadow-sm">{{ copy().switchPanel.login.eyebrow }}</h3>
            <p class="font-body-md md:font-body-lg text-body-md md:text-body-lg text-primary-fixed mb-6 md:mb-8 drop-shadow-sm mx-auto">{{ copy().switchPanel.login.description }}</p>
            <label class="cursor-pointer bg-transparent border-2 border-on-primary text-on-primary hover:bg-on-primary hover:text-primary font-button text-button rounded-full px-8 py-3 md:px-10 md:py-3 transition-colors duration-300 shadow-lg hover:shadow-xl active:scale-[0.98] inline-block" for="auth-toggle">
              {{ copy().switchPanel.login.action }}
            </label>
          </div>

          <!-- Sign Up State Overlay Text -->
          <div class="absolute flex flex-col items-center justify-center text-center w-full px-6 md:px-12 transition-all duration-700 ease-in-out opacity-0 -translate-y-12 md:-translate-y-0 md:-translate-x-12 peer-checked/auth:opacity-100 peer-checked/auth:translate-y-0 md:peer-checked/auth:translate-x-0 pointer-events-none peer-checked/auth:pointer-events-auto">
            <div class="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 md:mb-6 shadow-lg border border-white/20">
              <span class="material-symbols-outlined text-on-primary text-2xl md:text-3xl">shield_person</span>
            </div>
            <h3 class="font-h2 md:font-h1 text-h2 md:text-h1 text-on-primary mb-2 md:mb-4 drop-shadow-sm">{{ copy().switchPanel.signup.eyebrow }}</h3>
            <p class="font-body-md md:font-body-lg text-body-md md:text-body-lg text-primary-fixed mb-6 md:mb-8 drop-shadow-sm max-w-xs mx-auto">{{ copy().switchPanel.signup.description }}</p>
            <label class="cursor-pointer bg-transparent border-2 border-on-primary text-on-primary hover:bg-on-primary hover:text-primary font-button text-button rounded-full px-8 py-3 md:px-10 md:py-3 transition-colors duration-300 shadow-lg hover:shadow-xl active:scale-[0.98] inline-block" for="auth-toggle">
              {{ copy().switchPanel.signup.action }}
            </label>
          </div>
          
        </div>
      </div>
    </main>
  `
})
export class AuthPageComponent {
  mode = signal<AuthMode>('login');
  locale = signal<AuthLocale>('en');
  copy = computed(() => AUTH_TEXT[this.locale()]);
  switchAction = computed(() => {
    const current = this.copy();
    return this.mode() === 'login' ? current.switchPanel.login.action : current.switchPanel.signup.action;
  });

  @Input() initialMode: AuthMode = 'login';

  constructor() {
    this.locale.set(detectAuthLocale());
  }

  ngOnInit() {
    this.mode.set(normalizeAuthMode(this.initialMode));
  }

  toggleMode() {
    this.mode.update((current) => (current === 'login' ? 'signup' : 'login'));
  }

  toggleLocale() {
    const next = this.locale() === 'es' ? 'en' : 'es';
    this.locale.set(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('billflow-lang', next);
      document.documentElement.lang = next;
    }
  }

  languageLabel() {
    return this.copy().language;
  }
}
