import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import { AUTH_TEXT, detectAuthLocale } from './auth.dictionary';
import { LoginFormComponent } from './components/login-form.component';

@Component({
  selector: 'billflow-auth-page',
  standalone: true,
  imports: [CommonModule, LoginFormComponent],
  host: { class: 'w-full flex justify-center' },
  template: `
    <div class="relative w-full max-w-[1024px]">
      <button
        type="button"
        class="absolute top-4 right-4 z-30 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-lg backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-[0_12px_26px_rgba(79,70,229,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        (click)="toggleLocale()"
      >
        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">language</span>
        <span>{{ copy().language }}</span>
      </button>

      <main class="w-full bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0px_10px_30px_rgba(79,70,229,0.08)] border border-outline-variant/30 flex flex-col md:flex-row min-h-[600px]">
      <section class="w-full md:w-1/2 flex flex-col p-lg lg:p-xl justify-center relative z-10">
        <billflow-login-form [copy]="copy()" />
      </section>

      <section class="hidden md:flex w-1/2 relative bg-primary overflow-hidden items-end p-xl">
        <ng-container *ngFor="let slide of slides; let index = index">
          <img
            class="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000"
            [class.opacity-100]="activeSlide() === index"
            [class.opacity-0]="activeSlide() !== index"
            [src]="slide.src"
            [alt]="slide.alt"
            loading="eager"
            decoding="async"
          />
        </ng-container>

        <div class="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent z-10 mix-blend-multiply"></div>
        <div class="absolute inset-0 bg-primary/40 z-10"></div>

        <div class="relative z-20 w-full text-left text-on-primary">
          <h2 class="font-display text-display text-on-primary mb-sm leading-tight">Welcome to<br/>BillFlow POS</h2>
          <p class="font-body-lg text-body-lg text-on-primary-container">Precision billing for high-energy growth. Access your terminal to manage sales, inventory, and analytics.</p>
          <div class="mt-lg flex gap-base items-center">
            <button
              *ngFor="let slide of slides; let index = index"
              type="button"
              class="carousel-indicator rounded-full transition-all duration-300"
              [ngClass]="activeSlide() === index ? 'w-12 h-1 bg-secondary-container' : 'w-2 h-1 bg-on-primary-container opacity-50 hover:opacity-100'"
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
