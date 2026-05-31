import { CommonModule } from '@angular/common';
import { HttpErrorResponse, provideHttpClient, withFetch } from '@angular/common/http';
import { Component, Input, computed, inject, signal } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import { FormsModule, type NgForm } from '@angular/forms';
import { AUTH_TEXT, detectAuthLocale } from './auth.dictionary';
import { AuthApiService } from './data/auth-api.service';
import { ThemeService } from '../../shared/services/theme.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';

@Component({
  selector: 'billflow-reset-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [AuthApiService],
  host: { class: 'w-full flex justify-center' },
  template: `
    <div class="app-auth-shell">
      <div class="app-auth-top-actions">
        <button type="button" class="app-auth-theme-toggle" (click)="toggleLocale()">
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
          <div class="app-auth-login-panel__inner">
            <div class="app-auth-panel-stage app-auth-panel-stage--static">
              <div class="app-auth-panel-surface">
                <div class="app-auth-panel-view app-auth-panel-view--active app-auth-panel-view--static">
                  <div class="app-auth-form-shell app-auth-form-shell--reset">
                    <div class="app-auth-brand">
                      <div class="app-auth-brand__badge">
                        <span class="material-symbols-outlined text-2xl">point_of_sale</span>
                      </div>
                      <span class="font-h3 text-h3 text-primary font-bold tracking-tight">{{ copy().brand }}</span>
                    </div>

                    <div class="app-auth-reset__header">
                      <a href="/auth" class="app-auth-reset__back app-auth-help__link font-body-sm text-body-sm">
                        <span aria-hidden="true" class="material-symbols-outlined text-[18px]">arrow_back</span>
                        <span>{{ copy().reset.backToLogin }}</span>
                      </a>

                      <div class="app-auth-heading app-auth-heading--recovery app-auth-reset__intro">
                        <h1 class="font-h1 text-h1 text-on-surface mb-xs">{{ copy().reset.title }}</h1>
                        <p class="font-body-md text-body-md text-on-surface-variant">{{ copy().reset.subtitle }}</p>
                      </div>
                    </div>

                    <form #resetForm="ngForm" class="app-auth-reset__form flex flex-col gap-md" (ngSubmit)="handleSubmit(resetForm)">
                      <div class="app-auth-field">
                        <label class="font-label-bold text-label-bold text-on-surface" for="new-password">{{ copy().reset.passwordLabel }}</label>
                        <div class="app-auth-field__input-wrap">
                          <span class="material-symbols-outlined app-auth-field__icon">lock</span>
                          <input
                            id="new-password"
                            name="newPassword"
                            class="app-auth-field__input"
                            [placeholder]="copy().reset.passwordPlaceholder"
                            [type]="showPassword ? 'text' : 'password'"
                            [(ngModel)]="newPassword"
                            #newPasswordModel="ngModel"
                            required
                            minlength="8"
                          />
                          <button
                            type="button"
                            class="app-auth-field__toggle"
                            (click)="showPassword = !showPassword"
                            [attr.aria-label]="showPassword ? copy().login.hidePasswordAria : copy().login.showPasswordAria"
                          >
                            <span class="material-symbols-outlined text-[20px]">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                          </button>
                        </div>
                        <p *ngIf="showErrors && newPasswordModel.errors?.['required']" class="app-auth-field__error">{{ copy().reset.validation.passwordRequired }}</p>
                        <p *ngIf="showErrors && newPasswordModel.errors?.['minlength']" class="app-auth-field__error">{{ copy().reset.validation.passwordMinLength }}</p>
                      </div>

                      <div class="app-auth-reset__checklist" aria-label="Security checklist">
                        <div class="app-auth-reset__checklist-item" [class.app-auth-reset__checklist-item--met]="hasMinLength()">
                          <span class="material-symbols-outlined text-[16px]" aria-hidden="true">
                            {{ hasMinLength() ? 'check_circle' : 'radio_button_unchecked' }}
                          </span>
                          <span>{{ copy().reset.criteria.minLength }}</span>
                        </div>
                        <div class="app-auth-reset__checklist-item" [class.app-auth-reset__checklist-item--met]="hasNumberOrSymbol()">
                          <span class="material-symbols-outlined text-[16px]" aria-hidden="true">
                            {{ hasNumberOrSymbol() ? 'check_circle' : 'radio_button_unchecked' }}
                          </span>
                          <span>{{ copy().reset.criteria.numberOrSymbol }}</span>
                        </div>
                        <div class="app-auth-reset__checklist-item" [class.app-auth-reset__checklist-item--met]="matchesConfirmation()">
                          <span class="material-symbols-outlined text-[16px]" aria-hidden="true">
                            {{ matchesConfirmation() ? 'check_circle' : 'radio_button_unchecked' }}
                          </span>
                          <span>{{ copy().reset.criteria.matchesConfirmation }}</span>
                        </div>
                      </div>

                      <div class="app-auth-field">
                        <label class="font-label-bold text-label-bold text-on-surface" for="confirm-password">{{ copy().reset.confirmPasswordLabel }}</label>
                        <div class="app-auth-field__input-wrap">
                          <span class="material-symbols-outlined app-auth-field__icon">verified_user</span>
                          <input
                            id="confirm-password"
                            name="confirmPassword"
                            class="app-auth-field__input"
                            [placeholder]="copy().reset.confirmPasswordPlaceholder"
                            [type]="showConfirmPassword ? 'text' : 'password'"
                            [(ngModel)]="confirmPassword"
                            #confirmPasswordModel="ngModel"
                            required
                            minlength="8"
                          />
                          <button
                            type="button"
                            class="app-auth-field__toggle"
                            (click)="showConfirmPassword = !showConfirmPassword"
                            [attr.aria-label]="showConfirmPassword ? copy().login.hidePasswordAria : copy().login.showPasswordAria"
                          >
                            <span class="material-symbols-outlined text-[20px]">{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</span>
                          </button>
                          <span
                            *ngIf="confirmPassword.length > 0"
                            class="app-auth-field__match-indicator"
                            [class.app-auth-field__match-indicator--valid]="matchesConfirmation()"
                            [class.app-auth-field__match-indicator--invalid]="!matchesConfirmation()"
                            aria-hidden="true"
                          >
                            <span class="material-symbols-outlined text-[18px]">{{ matchesConfirmation() ? 'check_circle' : 'cancel' }}</span>
                          </span>
                        </div>
                        <p *ngIf="showErrors && confirmPasswordModel.errors?.['required']" class="app-auth-field__error">{{ copy().reset.validation.confirmPasswordRequired }}</p>
                        <p *ngIf="showErrors && confirmPasswordModel.errors?.['minlength']" class="app-auth-field__error">{{ copy().reset.validation.passwordMinLength }}</p>
                        <p *ngIf="showErrors && !confirmPasswordModel.errors && passwordsMismatch()" class="app-auth-field__error">{{ copy().reset.validation.passwordsMismatch }}</p>
                      </div>

                      <div class="mt-xs">
                        <button class="app-auth-button" type="submit" [disabled]="submitting()">
                          <span class="material-symbols-outlined text-[20px]">save</span>
                          <span>{{ copy().reset.submit }}</span>
                        </button>
                      </div>
                    </form>

                    <p *ngIf="statusMessage()" class="app-auth-feedback app-auth-recovery__feedback" [class.app-auth-feedback--success]="statusTone() === 'success'" [class.app-auth-feedback--error]="statusTone() === 'error'" role="status" aria-live="polite">
                      {{ statusMessage() }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            <div class="app-auth-reset-visual__badge">
              <span class="material-symbols-outlined text-[28px]" aria-hidden="true">shield_lock</span>
            </div>
            <h2 class="font-h2 text-h2 app-auth-visual-title leading-tight">{{ copy().reset.securityTitle }}</h2>
            <p class="font-body-lg text-body-lg app-auth-visual-text">{{ copy().reset.securityDescription }}</p>
            <div class="app-auth-visual-indicators">
              <button
                *ngFor="let slide of slides; let index = index"
                type="button"
                class="app-auth-visual-indicator"
                [ngClass]="activeSlide() === index ? 'app-auth-visual-indicator--active' : 'app-auth-visual-indicator--inactive'"
                [attr.aria-label]="copy().panel.slideLabel + ' ' + (index + 1)"
                (click)="showSlide(index)"
              ></button>
            </div>
          </div>
        </section>
      </main>
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
    .app-auth-field__match-indicator {
      position: absolute;
      right: 40px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      pointer-events: none;
    }
    .app-auth-field__match-indicator--valid {
      color: #10b981;
    }
    .app-auth-field__match-indicator--valid .material-symbols-outlined {
      font-variation-settings: 'FILL' 1;
    }
    .app-auth-field__match-indicator--invalid {
      color: #ef4444;
    }
    .app-auth-field__match-indicator--invalid .material-symbols-outlined {
      font-variation-settings: 'FILL' 1;
    }
    .app-auth-reset__intro {
      text-align: left;
    }
    .app-auth-reset__checklist {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.875rem 1rem;
      border-radius: 0.75rem;
      background: rgba(40, 48, 68, 0.46);
      border: 1px solid rgba(119, 117, 135, 0.25);
      color: var(--color-on-surface-variant);
    }
    .app-auth-reset__checklist-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      line-height: 1.5;
    }
    .app-auth-reset__checklist-item .material-symbols-outlined {
      color: rgba(199, 196, 216, 0.85);
    }
    .app-auth-reset__checklist-item--met {
      color: var(--color-on-surface);
    }
    .app-auth-reset__checklist-item--met .material-symbols-outlined {
      color: #10b981;
      font-variation-settings: 'FILL' 1;
    }
    .app-auth-reset-visual__badge {
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 9999px;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(242, 243, 255, 0.14);
      border: 1px solid rgba(199, 196, 216, 0.28);
      color: var(--color-primary-fixed);
      backdrop-filter: blur(10px);
    }
  `]
})
export class ResetPasswordPageComponent implements OnInit, OnDestroy {
  static clientProviders = [provideHttpClient(withFetch())];
  static renderProviders = [...ResetPasswordPageComponent.clientProviders];

  private readonly feedback = inject(UiFeedbackService);
  private readonly themeService = inject(ThemeService);
  private readonly authApi = inject(AuthApiService);

  @Input({ required: true }) token!: string;

  locale = signal(detectAuthLocale());
  theme = this.themeService.theme;
  copy = computed(() => AUTH_TEXT[this.locale()]);
  activeSlide = signal(0);
  statusMessage = signal<string | null>(null);
  statusTone = signal<'idle' | 'success' | 'error'>('idle');
  submitting = signal(false);

  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  showErrors = false;

  private intervalId: number | undefined;

  slides = [
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIsVrOzE1RoBKQkSNjsfedTzyZPlb5JstQyK_p0aGUYp24g-rlwvJf8ZYgbQkc-m8rHD5nOjZ-mqAyEBGT--WRgl_4YItwRCS9nlJVgmGgKGQ1csyVZITCsMsxnIA9-_am6DjROFBY6zQs8HTfCCxiUppOYNn_wVmAv-Omi3Nz6Vj4ZoQPwtbPKr8wQe0n_Xx1oPghoJF_0lzkvNCqgUL8pS2nNukVLmp2Og0RDNwlt5rBaMvUpHN2fb588ort7WyKYS2TEX9udPUu',
      alt: 'Secure server infrastructure supporting payment terminals and protected commerce operations.'
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHFgLtMOablnpeQKfkcmD-i4_Tk5g3f94l-9NyXZ6NHo7I5yxm_4zAFWZMh0ZgTiOs2xJDM2IJwB0xkI7Mqa05ePr_z_3vBftcg16et1V3R765lu4dKdlv7Ro5wrv7lwblheFEDDwrs5FvVwa9eRKe5DdVg9xMoxiYS6Xf6AB6hT0CjKplRa6a5ohGnwDimLYwtSMrPheLLST6-CaFkmVJMVrk5c_DZYsplASLADWlFJL44Q9ttD5vpK7QLhupnoX_1Q11IXA1nwQ',
      alt: 'Modern point of sale terminal in a protected retail environment.'
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuCGw7l4Q7_167SeUzRXrCa2dMTCqKD-3bizrjHmmA7j9xMew5hOAjH_rtBidbLs9donwG88E6nN3wICwdnNkYGSWkcLPsacJHIYhS_gMfS92Ln5YM_E4v5R25QtQsfUqMCeGrgaLf1LZPTAzc9jjYV3xC2CybktsEsik7pFiutcI_gaf3-v3zkUs0xsCG24H53nmjED85_hdoMJfLWk9vpOiSSLH-kE0kXHPZEJ0IvYfADM5IyPF92mTdfVAsfnmYQ2i6SCRGRY8',
      alt: 'Secure analytics dashboard for point of sale monitoring.'
    }
  ];

  async ngOnInit(): Promise<void> {
    this.startSlideRotation();

    if (!this.hasPlausibleToken(this.token)) {
      this.redirectToAuth();
      return;
    }

    try {
      const validation = await this.authApi.validateResetToken(this.token);
      if (!validation.valid) {
        await this.feedback.toast('error', validation.reason === 'expired'
          ? this.copy().reset.tokenExpired
          : this.copy().reset.invalidToken);
        this.redirectToAuth();
      }
    } catch {
      this.redirectToAuth();
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) window.clearInterval(this.intervalId);
  }

  passwordsMismatch(): boolean {
    return this.confirmPassword.length > 0 && this.newPassword !== this.confirmPassword;
  }

  hasMinLength(): boolean {
    return this.newPassword.trim().length >= 8;
  }

  hasNumberOrSymbol(): boolean {
    return /[\d\W_]/.test(this.newPassword);
  }

  matchesConfirmation(): boolean {
    return this.confirmPassword.length > 0 && this.newPassword === this.confirmPassword;
  }

  toggleLocale() {
    const next = this.locale() === 'en' ? 'es' : 'en';
    this.locale.set(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('billflow-lang', next);
    }
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  themeToggleLabel() {
    const isDark = this.theme() === 'dark';
    return this.locale() === 'es'
      ? (isDark ? 'Modo claro' : 'Modo oscuro')
      : (isDark ? 'Light mode' : 'Dark mode');
  }

  showSlide(index: number) {
    this.activeSlide.set(index);
  }

  async handleSubmit(form: NgForm) {
    this.showErrors = true;
    this.statusMessage.set(null);
    this.statusTone.set('idle');

    if (!this.hasPlausibleToken(this.token)) {
      this.statusTone.set('error');
      this.statusMessage.set(this.copy().reset.invalidToken);
      await this.feedback.toast('error', this.copy().reset.invalidToken);
      this.redirectToAuth();
      return;
    }

    if (form.invalid || this.passwordsMismatch()) {
      await this.feedback.toast('error', this.passwordsMismatch() ? this.copy().reset.validation.passwordsMismatch : this.copy().reset.validation.formInvalid);
      return;
    }

    try {
      this.submitting.set(true);

      const tokenIsStillUsable = await this.ensureTokenIsStillUsable();
      if (!tokenIsStillUsable) {
        return;
      }

      await this.authApi.resetPassword({
        token: this.token,
        newPassword: this.newPassword,
        confirmPassword: this.confirmPassword,
      });
      this.statusTone.set('success');
      this.statusMessage.set(this.copy().reset.success);
      await this.feedback.toast('success', this.copy().reset.success);
      window.setTimeout(() => this.redirectToAuth(), 1400);
    } catch (error) {
      const httpError = error as HttpErrorResponse;
      const body = httpError.error as { message?: string; error?: string } | string | null;
      const message = typeof body === 'string'
        ? body
        : ((body?.message as string | undefined) ?? (body?.error as string | undefined) ?? this.copy().reset.error);
      const finalMessage = httpError.status === 400 ? message || this.copy().reset.invalidToken : message || this.copy().reset.error;
      this.statusTone.set('error');
      this.statusMessage.set(finalMessage);
      await this.feedback.toast('error', finalMessage);
    } finally {
      this.submitting.set(false);
    }
  }

  private startSlideRotation() {
    if (typeof window === 'undefined') return;
    this.intervalId = window.setInterval(() => {
      this.activeSlide.set((this.activeSlide() + 1) % this.slides.length);
    }, 6000);
  }

  private hasPlausibleToken(token: string | null | undefined) {
    return typeof token === 'string' && /^[a-f0-9]{64}$/i.test(token.trim());
  }

  private async ensureTokenIsStillUsable(): Promise<boolean> {
    try {
      const validation = await this.authApi.validateResetToken(this.token.trim());
      if (!validation.valid) {
        await this.feedback.toast('error', validation.reason === 'expired'
          ? this.copy().reset.tokenExpired
          : this.copy().reset.invalidToken);
        this.redirectToAuth();
        return false;
      }

      return true;
    } catch {
      this.redirectToAuth();
      return false;
    }
  }

  private redirectToAuth() {
    if (typeof window !== 'undefined') {
      window.location.replace('/auth');
    }
  }
}
