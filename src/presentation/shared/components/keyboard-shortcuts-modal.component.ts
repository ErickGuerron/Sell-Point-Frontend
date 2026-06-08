import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';
import { BillflowModalShellComponent } from './billflow-modal-shell.component';
import { LocaleService } from '../services/locale.service';

@Component({
  selector: 'keyboard-shortcuts-modal',
  standalone: true,
  imports: [CommonModule, BillflowModalShellComponent],
  template: `
    <billflow-modal-shell
      *ngIf="service.isOpen()"
      [title]="locale() === 'es' ? 'Atajos de Teclado' : 'Keyboard Shortcuts'"
      [subtitle]="locale() === 'es' ? 'Navegá el sistema sin usar el mouse' : 'Navigate the system without using the mouse'"
      icon="keyboard"
      maxWidth="lg"
      (close)="service.close()"
    >
      <div class="p-6 space-y-8">
        <!-- Quick hint -->
        <div class="bg-primary/5 rounded-xl p-4 border border-primary/10 flex items-start gap-3">
          <span class="material-symbols-outlined text-primary mt-0.5 text-[20px]">info</span>
          <div>
            <p class="text-sm font-semibold text-on-surface">
              {{ locale() === 'es' ? 'Presioná ? en cualquier momento para abrir este panel' : 'Press ? at any time to open this panel' }}
            </p>
            <p class="text-xs text-on-surface-variant mt-1">
              {{ locale() === 'es' ? 'Los atajos que requieren tecla líder (g) se ejecutan presionando g y luego la tecla correspondiente. No las presiones al mismo tiempo.' : 'Leader-key shortcuts (g) work by pressing g first, then the corresponding key. Do not press them simultaneously.' }}
            </p>
          </div>
        </div>

        <!-- Shortcut groups -->
        <ng-container *ngFor="let group of service.shortcutGroups()">
          <div class="space-y-3">
            <h4 class="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
              {{ locale() === 'es' ? group.labelEs : group.labelEn }}
            </h4>
            <div class="divide-y divide-outline-variant/20 border border-outline-variant/30 rounded-xl overflow-hidden bg-surface-container-low/30">
              <div
                *ngFor="let shortcut of group.shortcuts"
                class="flex items-center justify-between px-4 py-3 hover:bg-surface-container/50 transition-colors"
              >
                <span class="text-sm text-on-surface font-medium">
                  {{ locale() === 'es' ? shortcut.descriptionEs : shortcut.descriptionEn }}
                </span>
                <span class="inline-flex items-center gap-1 shrink-0 ml-4">
                  <ng-container *ngFor="let key of splitKeys(shortcut.keys); let last = last">
                    <kbd class="shortcut-key">{{ key }}</kbd>
                    <span *ngIf="!last" class="text-xs text-on-surface-variant font-bold">+</span>
                  </ng-container>
                </span>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- Empty state (shouldn't happen but just in case) -->
        <div *ngIf="service.shortcutGroups().length === 0" class="text-center py-8">
          <span class="material-symbols-outlined text-4xl text-outline/50 block mb-3">keyboard</span>
          <p class="text-sm text-on-surface-variant">
            {{ locale() === 'es' ? 'No hay atajos disponibles para tu rol' : 'No shortcuts available for your role' }}
          </p>
        </div>
      </div>
    </billflow-modal-shell>
  `,
  styles: [`
    :host {
      --shortcut-bg: #e8eaf6;
      --shortcut-text: #283593;
      --shortcut-border: #c5cae9;
    }
    :host-context(.dark) {
      --shortcut-bg: #263238;
      --shortcut-text: #b0bec5;
      --shortcut-border: #37474f;
    }
    .shortcut-key {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2rem;
      height: 1.75rem;
      padding: 0 0.5rem;
      font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
      font-size: 0.75rem;
      font-weight: 700;
      line-height: 1;
      color: var(--shortcut-text);
      background: var(--shortcut-bg);
      border: 1px solid var(--shortcut-border);
      border-radius: 0.375rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.08);
      text-transform: lowercase;
    }
    .shortcut-key:first-letter {
      text-transform: uppercase;
    }
  `],
})
export class KeyboardShortcutsModalComponent {
  readonly service = inject(KeyboardShortcutService);
  private readonly localeService = inject(LocaleService);
  readonly locale = this.localeService.locale;

  /** Split multi-key shortcuts like 'g i' into ['g', 'i'] */
  splitKeys(keys: string): string[] {
    return keys === '?' ? ['?'] : keys.split(' ');
  }
}
