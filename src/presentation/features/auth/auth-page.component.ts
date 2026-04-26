import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import { AUTH_TEXT, detectAuthLocale } from './auth.dictionary';
import type { AuthLoginPayload } from './auth.dictionary';
import { LoginFormComponent } from './components/login-form.component';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

@Component({
  selector: 'billflow-auth-page',
  standalone: true,
  imports: [CommonModule, LoginFormComponent],
  host: { class: 'w-full flex justify-center' },
  template: `
    <div class="app-auth-shell">
      <button
        type="button"
        class="app-auth-theme-toggle"
        (click)="toggleLocale()"
      >
        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">language</span>
        <span>{{ copy().language }}</span>
      </button>

      <main class="app-auth-card">
      <section class="app-auth-login-panel">
        <billflow-login-form
          [copy]="copy()"
          [statusMessage]="loginStatusMessage()"
          [statusTone]="loginStatusTone()"
          (submitLogin)="handleLogin($event)"
        />
      </section>

      <section class="app-auth-visual-panel">
        <ng-container *ngFor="let slide of slides; let index = index">
          <img
            class="app-auth-visual-image"
            [class.opacity-100]="activeSlide() === index"
            [class.opacity-0]="activeSlide() !== index"
            [src]="slide.src"
            [alt]="slide.alt"
            loading="eager"
            decoding="async"
          />
        </ng-container>

        <div class="app-auth-visual-content">
          <h2 class="font-display text-display app-auth-visual-title leading-tight" [innerHTML]="copy().panel.title"></h2>
          <p class="font-body-lg text-body-lg app-auth-visual-text">{{ copy().panel.description }}</p>
          <div class="app-auth-visual-indicators">
            <button
              *ngFor="let slide of slides; let index = index"
              type="button"
              class="app-auth-visual-indicator"
              [ngClass]="activeSlide() === index ? 'app-auth-visual-indicator--active' : 'app-auth-visual-indicator--inactive'"
              [attr.aria-label]="'Slide ' + (index + 1)"
              (click)="showSlide(index)"
            ></button>
          </div>
        </div>
      </section>
      </main>
    </div>
  `
})
export class AuthPageComponent implements OnInit, OnDestroy {
  locale = signal(detectAuthLocale());
  activeSlide = signal(0);
  copy = computed(() => AUTH_TEXT[this.locale()]);
  loginStatusMessage = signal<string | null>(null);
  loginStatusTone = signal<'idle' | 'success' | 'error'>('idle');

  slides = [
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0vbZ0JzcqFqcNM-xhn2W-ar6-GR1CUQP0cTOVRBhz2ECOaJxNHljc1sSK7fwfvTMR_nIavMH_-ei-GcgvEvKVXJDLSiNwvQXthRrKWPWZMIWY8m5rki3-wxzLQ3SK57b2B0vEUXjfVkCzvV8eGdjjn9DVQflgjbx3qorefYgU8BnrUzwa1_NpDdXdiEnBZaOidZuj_YWLxtpDjsuSqGxVPXq9_kkx1wStQF5RizIW_wzvz15Aj6UXNLjjsRYHlu0VzSEhy4Dlq8o',
      alt: 'Modern diverse corporate team in a sleek, brightly lit glass-walled office environment, smiling and collaborating over financial data on a digital tablet, professional cinematic lighting.'
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuCGw7l4Q7_167SeUzRXrCa2dMTCqKD-3bizrjHmmA7j9xMew5hOAjH_rtBidbLs9donwG88E6nN3wICwdnNkYGSWkcLPsacJHIYhS_gMfS92Ln5YM_E4v5R25QtQsfUqMCeGrgaLf1LZPTAzc9jjYV3xC2CybktsEsik7pFiutcI_gaf3-v3zkUs0xsCG24H53nmjED85_hdoMJfLWk9vpOiSSLH-kE0kXHPZEJ0IvYfADM5IyPF92mTdfVAsfnmYQ2i6SCRGRY8',
      alt: 'Sleek digital dashboard on a computer screen'
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHFgLtMOablnpeQKfkcmD-i4_Tk5g3f94l-9NyXZ6NHo7I5yxm_4zAFWZMh0ZgTiOs2xJDM2IJwB0xkI7Mqa05ePr_z_3vBftcg16et1V3R765lu4dKdlv7Ro5wrv7lwblheFEDDwrs5FvVwa9eRKe5DdVg9xMoxiYS6Xf6AB6hT0CjKplRa6a5ohGnwDimLYwtSMrPheLLST6-CaFkmVJMVrk5c_DZYsplASLADWlFJL44Q9ttD5vpK7QLhupnoX_1Q11IXA1nwQ',
      alt: 'Modern point of sale terminal in a high-end retail store'
    }
  ];

  private intervalId: number | undefined;

  ngOnInit() {
    if (typeof window !== 'undefined' && this.slides.length > 1) {
      this.intervalId = window.setInterval(() => this.nextSlide(), 5000);
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined' && this.intervalId !== undefined) {
      window.clearInterval(this.intervalId);
    }
  }

  showSlide(index: number) {
    this.activeSlide.set(index);
    this.restartCarousel();
  }

  async handleLogin(payload: AuthLoginPayload) {
    this.loginStatusMessage.set(null);
    this.loginStatusTone.set('idle');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const session = await response.json();
      window.localStorage.setItem('billflow-session', JSON.stringify(session));
      this.loginStatusTone.set('success');
      this.loginStatusMessage.set(this.copy().feedback.success);
    } catch {
      this.loginStatusTone.set('error');
      this.loginStatusMessage.set(this.copy().feedback.invalid);
    }
  }

  toggleLocale() {
    const next = this.locale() === 'es' ? 'en' : 'es';
    this.locale.set(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('billflow-lang', next);
      document.documentElement.lang = next;
    }
  }

  nextSlide() {
    this.activeSlide.update((current) => (current + 1) % this.slides.length);
  }

  private restartCarousel() {
    if (typeof window === 'undefined') return;
    if (this.intervalId !== undefined) {
      window.clearInterval(this.intervalId);
    }
    this.intervalId = window.setInterval(() => this.nextSlide(), 5000);
  }

}
