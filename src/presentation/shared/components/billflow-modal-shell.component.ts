import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
  type Signal,
} from '@angular/core';
import { UiFeedbackService } from '../services/ui-feedback.service';
import { LocaleService } from '../services/locale.service';
import { getSharedTranslations } from '../i18n/shared.translations';

@Component({
  selector: 'billflow-modal-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      (click)="requestClose()"
    >
      <!-- Backdrop con Glassmorphism -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"></div>

      <!-- Modal Panel -->
      <div
        class="relative z-10 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/50 flex flex-col overflow-hidden max-h-[90vh] transition-all duration-200 animate-in zoom-in-95 fade-in"
        [ngClass]="maxWidthClass"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface/60 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center" *ngIf="icon">
              <span class="material-symbols-outlined text-primary text-[20px]">{{ icon }}</span>
            </div>
            <div>
              <h3 class="text-base font-bold text-on-surface leading-tight">{{ title }}</h3>
              <p class="text-xs text-on-surface-variant mt-0.5" *ngIf="subtitle">
                {{ subtitle }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-outline hover:bg-surface-container hover:text-on-surface transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            [disabled]="disableClose"
            (click)="requestClose()"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Content (flex-1 + min-h-0 = fill remaining space and scroll) -->
        <div class="flex-1 min-h-0 overflow-y-auto">
          <ng-content></ng-content>
        </div>

        <!-- Footer Slot -->
        <div class="px-6 py-4 border-t border-outline-variant/40 bg-surface/60 flex items-center justify-between flex-shrink-0" *ngIf="hasFooter">
          <ng-content select="[footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class BillflowModalShellComponent {
  private readonly feedback = inject(UiFeedbackService);
  private readonly localeService = inject(LocaleService);

  @Input({ required: true }) isOpen = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
  @Input() maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '//' = 'md';
  @Input() hasFooter = false;
  @Input() disableClose = false;

  /**
   * Opt-out switch for the unsaved-changes guard. When `true`, the shell
   * closes silently on every path (X, backdrop, Cancel via `(close)`, Escape).
   * Used by picker modals (no form state to lose).
   */
  @Input() disableUnsavedGuard = false;

  /**
   * Signal from the host form modal reporting whether the form is dirty.
   * `null` = legacy/preset mode (close silently). Any non-null signal
   * drives the guard: if `formHasChanges() === true`, the shell shows a
   * SweetAlert2 confirmation before emitting `close`.
   */
  @Input() formHasChanges: Signal<boolean> | null = null;

  @Output() close = new EventEmitter<void>();

  get maxWidthClass() {
    const map = {
      'sm': 'max-w-md',
      'md': 'max-w-2xl',
      'lg': 'max-w-4xl',
      'xl': 'max-w-6xl',
      '//': 'w-full'
    };
    return map[this.maxWidth] || map['md'];
  }

  /**
   * Single close path for the shell. All four close triggers — X button
   * click, backdrop click, the host's Cancel button (via the `@HostListener`
   * on Escape), and the host calling `shell.requestClose()` from its own
   * Cancel button — funnel through here.
   *
   * Decision matrix (Spec 3 R3):
   *   - `disableClose === true`                         → return (caller is in flight)
   *   - `disableUnsavedGuard === true`                  → close.emit() (opt-out)
   *   - `formHasChanges === null`                       → close.emit() (legacy / picker)
   *   - `formHasChanges() === false`                    → close.emit() (clean form)
   *   - else                                           → SweetAlert; close.emit() on confirm
   */
  async requestClose(): Promise<void> {
    if (this.disableClose) return;
    if (this.disableUnsavedGuard || this.formHasChanges === null || !this.formHasChanges()) {
      this.close.emit();
      return;
    }

    const locale = this.localeService?.locale() ?? 'es';
    const forms = getSharedTranslations(locale).forms;
    const confirmed = await this.feedback.confirm(
      forms.unsavedChangesTitle,
      forms.unsavedChangesText,
      forms.unsavedChangesConfirm,
      forms.unsavedChangesCancel,
    );
    if (confirmed) this.close.emit();
  }

  /**
   * Escape routes through the same `requestClose()` so the four close
   * paths share one decision matrix.
   */
  @HostListener('document:keydown.escape')
  async onEscape(): Promise<void> {
    await this.requestClose();
  }
}
