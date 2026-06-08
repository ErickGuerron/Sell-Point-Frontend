import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<AppTheme>(this.readInitialTheme());

  init(): void {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('billflow-theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const next: AppTheme = stored === 'dark' || stored === 'light' ? stored : prefersDark ? 'dark' : 'light';
    this.apply(next);
  }

  toggle(): void {
    const next: AppTheme = this.theme() === 'dark' ? 'light' : 'dark';
    this.apply(next);
  }

  currentThemeLabel(locale: string): string {
    return locale === 'es'
      ? (this.theme() === 'dark' ? 'Modo oscuro' : 'Modo claro')
      : (this.theme() === 'dark' ? 'Dark mode' : 'Light mode');
  }

  themeToggleLabel(locale: string): string {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    if (locale === 'es') return next === 'dark' ? 'Modo oscuro' : 'Modo claro';
    return next === 'dark' ? 'Dark mode' : 'Light mode';
  }

  iconVariationSettings(active = false): string {
    return active ? "'FILL' 1" : "'FILL' 0";
  }

  private apply(next: AppTheme): void {
    this.theme.set(next);
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('billflow-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.style.colorScheme = next;
  }

  private readInitialTheme(): AppTheme {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem('billflow-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
