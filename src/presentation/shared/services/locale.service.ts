import { Injectable, signal } from '@angular/core';

export type AppLocale = 'es' | 'en';

const STORAGE_KEY = 'billflow-lang';

function normalizeLocale(value: string | null | undefined): AppLocale {
  return value === 'en' ? 'en' : 'es';
}

function syncDocumentLanguage(locale: AppLocale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
}

function readStoredLocale(): AppLocale {
  if (typeof window === 'undefined') return 'es';
  return normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
}

function hasStoredLocale(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) !== null;
}

@Injectable({ providedIn: 'root' })
export class LocaleService {
  /** Signal compartido — se inicializa UNA sola vez al arrancar la app */
  readonly locale = signal<AppLocale>(readStoredLocale());

  seedLocale(locale: AppLocale): void {
    if (hasStoredLocale()) {
      syncDocumentLanguage(this.locale());
      return;
    }
    this.applyLocale(locale, false);
  }

  setLocale(locale: AppLocale): void {
    this.applyLocale(locale, true);
  }

  toggle() {
    const next: AppLocale = this.locale() === 'es' ? 'en' : 'es';
    this.setLocale(next);
  }

  private applyLocale(locale: AppLocale, persist: boolean): void {
    this.locale.set(locale);
    if (persist && typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
    syncDocumentLanguage(locale);
  }
}
