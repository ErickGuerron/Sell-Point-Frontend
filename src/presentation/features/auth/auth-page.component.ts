import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import { AUTH_TEXT, detectAuthLocale } from './auth.dictionary';
import type { AuthLoginPayload } from './auth.dictionary';
import { LoginFormComponent } from './components/login-form.component';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';
import { ThemeService } from '../../shared/services/theme.service';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

@Component({
  selector: 'billflow-auth-page',
  standalone: true,
  imports: [CommonModule, LoginFormComponent],
  host: { class: 'w-full flex justify-center' },
  template: `
    <div class="app-auth-shell">
      <div class="app-auth-top-actions">
        <button
          type="button"
          class="app-auth-theme-toggle"
          (click)="toggleLocale()"
        >
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">language</span>
          <span>{{ copy().language }}</span>
        </button>

        <button
          type="button"
          class="app-auth-theme-toggle app-auth-theme-toggle--secondary"
          (click)="toggleTheme()"
        >
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">
            {{ theme() === 'dark' ? 'light_mode' : 'dark_mode' }}
          </span>
          <span>{{ themeToggleLabel() }}</span>
        </button>
      </div>

      <main class="app-auth-card">
      <section class="app-auth-login-panel">
        <billflow-login-form
          [copy]="copy()"
          [statusMessage]="loginStatusMessage()"
          [statusTone]="loginStatusTone()"
          (requestSupport)="openSupportModal()"
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

      <div *ngIf="supportOpen() || supportClosing()" class="app-auth-support-overlay">
        <div class="app-auth-support-overlay__scrim" (click)="closeSupportModal()"></div>
        <div class="app-auth-support-modal" [class.app-auth-support-modal--enter]="supportOpen() && !supportClosing()" [class.app-auth-support-modal--exit]="supportClosing()">
          <button type="button" class="app-auth-support-modal__close" (click)="closeSupportModal()" [attr.aria-label]="copy().support.close">
            <span class="material-symbols-outlined">close</span>
          </button>

          <div class="app-auth-support-modal__header">
            <div class="app-auth-support-modal__icon">
              <span class="material-symbols-outlined icon-fill text-[28px]">forum</span>
            </div>
            <h2 class="font-h2 text-h2 text-on-surface mb-xs">{{ copy().support.title }}</h2>
            <p class="font-body-md text-body-md app-auth-support-modal__description">
              {{ copy().support.description }} <span class="app-auth-support-modal__email">guerronerick.10d@gmail.com</span>
            </p>
          </div>

          <div class="app-auth-support-modal__issues">
            <p class="font-label-bold text-label-bold text-on-surface mb-sm">{{ copy().support.issueLabel }}</p>
            <div class="app-auth-support-modal__issue-grid">
              <button type="button" class="app-auth-support-action" [ngClass]="{ 'app-auth-support-action--selected': supportSelectedIssues().includes(copy().support.issues.login) }" (click)="toggleSupportIssue(copy().support.issues.login)">
                <span class="app-auth-support-action__content">
                  <span class="material-symbols-outlined app-auth-support-action__icon">login</span>
                  <span>{{ copy().support.issues.login }}</span>
                </span>
                <span class="material-symbols-outlined app-auth-support-action__arrow">{{ supportSelectedIssues().includes(copy().support.issues.login) ? 'check' : 'arrow_forward' }}</span>
              </button>
              <button type="button" class="app-auth-support-action" [ngClass]="{ 'app-auth-support-action--selected': supportSelectedIssues().includes(copy().support.issues.access) }" (click)="toggleSupportIssue(copy().support.issues.access)">
                <span class="app-auth-support-action__content">
                  <span class="material-symbols-outlined app-auth-support-action__icon">manage_accounts</span>
                  <span>{{ copy().support.issues.access }}</span>
                </span>
                <span class="material-symbols-outlined app-auth-support-action__arrow">{{ supportSelectedIssues().includes(copy().support.issues.access) ? 'check' : 'arrow_forward' }}</span>
              </button>
              <button type="button" class="app-auth-support-action" [ngClass]="{ 'app-auth-support-action--selected': supportSelectedIssues().includes(copy().support.issues.bug) }" (click)="toggleSupportIssue(copy().support.issues.bug)">
                <span class="app-auth-support-action__content">
                  <span class="material-symbols-outlined app-auth-support-action__icon">bug_report</span>
                  <span>{{ copy().support.issues.bug }}</span>
                </span>
                <span class="material-symbols-outlined app-auth-support-action__arrow">{{ supportSelectedIssues().includes(copy().support.issues.bug) ? 'check' : 'arrow_forward' }}</span>
              </button>
              <button type="button" class="app-auth-support-action" [ngClass]="{ 'app-auth-support-action--selected': supportSelectedIssues().includes(copy().support.issues.other) }" (click)="toggleSupportIssue(copy().support.issues.other)">
                <span class="app-auth-support-action__content">
                  <span class="material-symbols-outlined app-auth-support-action__icon">more_horiz</span>
                  <span>{{ copy().support.issues.other }}</span>
                </span>
                <span class="material-symbols-outlined app-auth-support-action__arrow">{{ supportSelectedIssues().includes(copy().support.issues.other) ? 'check' : 'arrow_forward' }}</span>
              </button>
            </div>
          </div>

          <div class="app-auth-support-modal__details">
            <label class="block font-label-bold text-label-bold text-on-surface mb-sm" for="support-details">{{ copy().support.detailsLabel }}</label>
            <textarea
              id="support-details"
              class="w-full min-h-32 rounded-lg border border-outline-variant bg-surface-container-low px-sm py-sm font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              [placeholder]="copy().support.detailsPlaceholder"
              [value]="supportDetails()"
              (input)="supportDetails.set(($any($event.target).value))"
            ></textarea>
          </div>

          <div class="app-auth-support-modal__services">
            <button type="button" class="app-auth-support-action" (click)="openMailService('gmail')">
              <span class="app-auth-support-action__content">
                <span class="material-symbols-outlined app-auth-support-action__icon icon-fill">mail</span>
                <span>{{ copy().support.services.gmail }}</span>
              </span>
              <span class="material-symbols-outlined app-auth-support-action__arrow">arrow_forward</span>
            </button>
            <button type="button" class="app-auth-support-action" (click)="openMailService('outlook')">
              <span class="app-auth-support-action__content">
                <span class="material-symbols-outlined app-auth-support-action__icon">forward_to_inbox</span>
                <span>{{ copy().support.services.outlook }}</span>
              </span>
              <span class="material-symbols-outlined app-auth-support-action__arrow">arrow_forward</span>
            </button>
            <button type="button" class="app-auth-support-action" (click)="openMailService('yahoo')">
              <span class="app-auth-support-action__content">
                <span class="material-symbols-outlined app-auth-support-action__icon">mark_email_read</span>
                <span>{{ copy().support.services.yahoo }}</span>
              </span>
              <span class="material-symbols-outlined app-auth-support-action__arrow">arrow_forward</span>
            </button>
          </div>

          <div class="mt-lg pt-sm border-t border-outline-variant/30 text-center">
            <p class="font-body-sm text-body-sm text-on-surface-variant/70">Your default mail client will open securely.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuthPageComponent implements OnInit, OnDestroy {
  private readonly feedback = inject(UiFeedbackService);
  private readonly themeService = inject(ThemeService);

  locale = signal(detectAuthLocale());
  activeSlide = signal(0);
  theme = this.themeService.theme;
  copy = computed(() => AUTH_TEXT[this.locale()]);
  loginStatusMessage = signal<string | null>(null);
  loginStatusTone = signal<'idle' | 'success' | 'error'>('idle');
  supportOpen = signal(false);
  supportClosing = signal(false);
  supportSelectedIssues = signal<string[]>([]);
  supportDetails = signal('');

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
  private supportCloseTimeout: number | undefined;

  ngOnInit() {
    this.themeService.init();
    if (typeof window !== 'undefined' && this.slides.length > 1) {
      this.intervalId = window.setInterval(() => this.nextSlide(), 5000);
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined' && this.intervalId !== undefined) {
      window.clearInterval(this.intervalId);
    }
    if (typeof window !== 'undefined' && this.supportCloseTimeout !== undefined) {
      window.clearTimeout(this.supportCloseTimeout);
    }
  }

  showSlide(index: number) {
    this.activeSlide.set(index);
    this.restartCarousel();
  }

  openSupportModal() {
    if (typeof window !== 'undefined' && this.supportCloseTimeout !== undefined) {
      window.clearTimeout(this.supportCloseTimeout);
      this.supportCloseTimeout = undefined;
    }
    this.supportClosing.set(false);
    this.supportOpen.set(true);
  }

  closeSupportModal() {
    if (!this.supportOpen() || this.supportClosing()) return;
    this.supportClosing.set(true);
    this.supportCloseTimeout = window.setTimeout(() => {
      this.supportOpen.set(false);
      this.supportClosing.set(false);
      this.supportSelectedIssues.set([]);
      this.supportDetails.set('');
      this.supportCloseTimeout = undefined;
    }, 180);
  }

  toggleSupportIssue(issue: string) {
    const current = this.supportSelectedIssues();
    this.supportSelectedIssues.set(
      current.includes(issue) ? current.filter((item) => item !== issue) : [...current, issue],
    );
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  themeToggleLabel() {
    return this.themeService.themeToggleLabel(this.locale());
  }

  openMailService(service: 'gmail' | 'outlook' | 'yahoo') {
    const subject = encodeURIComponent('BillFlow POS - IT Support Request');
    const issues = this.supportSelectedIssues();
    const issueBlock = issues.length > 0 ? issues.map((issue) => `- ${issue}`).join('\n') : '- No issue selected';
    const details = this.supportDetails().trim() || '- None provided';
    const body = encodeURIComponent(
      `Hello IT Support,\n\nI need help with BillFlow POS.\n\nSelected issue(s):\n${issueBlock}\n\nAdditional details:\n${details}\n\nEnvironment:\n- Locale: ${this.locale()}\n- Browser: ${typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'}\n\nBest regards,`,
    );
    const to = encodeURIComponent('guerronerick.10d@gmail.com');

    const urls: Record<'gmail' | 'outlook' | 'yahoo', string> = {
      gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`,
      outlook: `https://outlook.office.com/mail/deeplink/compose?to=${to}&subject=${subject}&body=${body}`,
      yahoo: `https://compose.mail.yahoo.com/?to=${to}&subject=${subject}&body=${body}`,
    };

    if (typeof window !== 'undefined') {
      window.open(urls[service], '_blank', 'noopener,noreferrer');
    }
    this.closeSupportModal();
  }

  async handleLogin(payload: AuthLoginPayload) {
    this.loginStatusMessage.set(null);
    this.loginStatusTone.set('idle');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload.identifier,
          password: payload.secret,
          rememberMe: false,
        }),
      });

      if (!response.ok) {
        // Intentar leer el body del error para detectar cuenta bloqueada
        let body: Record<string, unknown> | null = null;
        try {
          body = (await response.json()) as Record<string, unknown>;
        } catch {
          // body no es JSON válido, seguir con el error genérico
        }

        const message =
          (body?.message as string | undefined) ??
          (body?.error as string | undefined) ??
          '';

        const isBlocked =
          response.status === 423 ||
          response.status === 403 ||
          /blocked|locked|bloqueada|bloqueado|deshabilitada|disabled/i.test(message);

        if (isBlocked) {
          this.loginStatusTone.set('error');
          this.loginStatusMessage.set(this.copy().feedback.blockedTitle);
          await this.feedback.alert(
            'warning',
            this.copy().feedback.blockedTitle,
            `${this.copy().feedback.blockedMessage}\n\n${this.copy().feedback.blockedContact}`,
          );
          return;
        }

        throw new Error('Invalid credentials');
      }

      const session = await response.json();
      window.localStorage.setItem('billflow-session', JSON.stringify(session));
      this.loginStatusTone.set('success');
      this.loginStatusMessage.set(this.copy().feedback.success);
      void this.feedback.toast('success', this.copy().feedback.success);
      window.setTimeout(() => {
        window.location.replace('/dashboard');
      }, 180);
    } catch {
      this.loginStatusTone.set('error');
      this.loginStatusMessage.set(this.copy().feedback.invalid);
      await this.feedback.toast('error', this.copy().feedback.invalid);
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
