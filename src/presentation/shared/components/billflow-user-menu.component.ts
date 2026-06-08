import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, signal, inject } from '@angular/core';
import { LocaleService } from '../services/locale.service';
import { ThemeService } from '../services/theme.service';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';

@Component({
  selector: 'billflow-user-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #host class="relative">
      <button type="button" class="app-dashboard-user-badge bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shadow-sm hover:bg-primary/20 transition-colors cursor-pointer overflow-hidden" style="width:2.875rem; height:2.875rem; border-radius:9999px;" (click)="toggleMenu($event)" [attr.aria-expanded]="open()" aria-haspopup="menu">
        <span class="w-full h-full rounded-full bg-primary text-on-primary flex items-center justify-center text-xs shrink-0 overflow-hidden">{{ initials }}</span>
      </button>

      <div *ngIf="visible()" #panel class="app-dashboard-user-menu" [class.app-dashboard-user-menu--exit]="closing()" role="menu">
        <button type="button" class="app-dashboard-user-menu__backdrop" aria-label="Cerrar menú" (click)="closeMenu()"></button>
        <div class="app-dashboard-user-menu__panel">
          <div class="app-dashboard-user-menu__header">
            <div class="app-dashboard-user-menu__avatar">{{ initials }}</div>
            <div class="min-w-0">
              <p class="app-dashboard-user-menu__title">{{ displayName }}</p>
              <p class="app-dashboard-user-menu__subtitle">{{ sessionLabel }}</p>
            </div>
          </div>

          <button *ngIf="showLanguageToggle" type="button" class="app-dashboard-user-menu__item" role="menuitem" (click)="languageToggle.emit()">
            <span class="material-symbols-outlined">language</span>
            <span>{{ languageLabel }}</span>
          </button>

          <button type="button" class="app-dashboard-user-menu__item" role="menuitem" (click)="toggleTheme()">
            <span class="material-symbols-outlined">{{ themeIcon() }}</span>
            <span>{{ themeToggleLabel() }}</span>
          </button>

          <button type="button" class="app-dashboard-user-menu__item" role="menuitem" (click)="openShortcuts()">
            <span class="material-symbols-outlined">keyboard</span>
            <span>{{ shortcutsLabel() }}</span>
          </button>

          <button type="button" class="app-dashboard-user-menu__item" role="menuitem" (click)="settings.emit()">
            <span class="material-symbols-outlined">settings</span>
            <span>{{ settingsLabel }}</span>
          </button>
          <button type="button" class="app-dashboard-user-menu__item app-dashboard-user-menu__item--danger" role="menuitem" (click)="logout.emit()">
            <span class="material-symbols-outlined">logout</span>
            <span>{{ logoutLabel }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class BillflowUserMenuComponent {
  private readonly localeService = inject(LocaleService);
  private readonly themeService = inject(ThemeService);
  private readonly keyboardShortcuts = inject(KeyboardShortcutService);

  @Input() displayName = 'Usuario';
  @Input() initials = 'US';
  @Input() showLanguageToggle = false;
  @Input() languageLabel = 'ES';
  @Input() settingsLabel = 'Settings';
  @Input() logoutLabel = 'Sign out';
  @Input() sessionLabel = 'Session';
  @Output() languageToggle = new EventEmitter<void>();
  @Output() settings = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  private visible = signal(false);
  private closing = signal(false);
  protected open = signal(false);
  private closeTimeout: number | undefined;

  protected readonly locale = this.localeService.locale;
  protected readonly theme = this.themeService.theme;

  @ViewChild('host') private host?: ElementRef<HTMLElement>;

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    if (this.visible()) { this.closeMenu(); return; }
    if (this.closeTimeout !== undefined && typeof window !== 'undefined') {
      window.clearTimeout(this.closeTimeout);
      this.closeTimeout = undefined;
    }
    this.closing.set(false);
    this.visible.set(true);
    this.open.set(true);
  }

  private closeMenu() {
    if (!this.visible() || this.closing()) return;
    this.closing.set(true);
    if (typeof window === 'undefined') return;
    this.closeTimeout = window.setTimeout(() => {
      this.visible.set(false);
      this.open.set(false);
      this.closing.set(false);
      this.closeTimeout = undefined;
    }, 180);
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  themeToggleLabel(): string {
    return this.themeService.themeToggleLabel(this.locale());
  }

  themeIcon(): string {
    return this.theme() === 'dark' ? 'light_mode' : 'dark_mode';
  }

  openShortcuts(): void {
    this.closeMenu();
    this.keyboardShortcuts.toggle();
  }

  shortcutsLabel(): string {
    return this.locale() === 'es' ? 'Atajos de Teclado' : 'Keyboard Shortcuts';
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (target && this.host?.nativeElement.contains(target)) return;
    this.closeMenu();
  }
}
