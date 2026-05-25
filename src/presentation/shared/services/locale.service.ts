import { Injectable, signal } from '@angular/core';

export type AppLocale = 'es' | 'en';

const STORAGE_KEY = 'billflow-lang';

function readStoredLocale(): AppLocale {
  if (typeof window === 'undefined') return 'es';
  return window.localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'es';
}

@Injectable({ providedIn: 'root' })
export class LocaleService {
  /** Signal compartido — se inicializa UNA sola vez al arrancar la app */
  readonly locale = signal<AppLocale>(readStoredLocale());

  toggle() {
    const next: AppLocale = this.locale() === 'es' ? 'en' : 'es';
    this.locale.set(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
    }
  }
}
