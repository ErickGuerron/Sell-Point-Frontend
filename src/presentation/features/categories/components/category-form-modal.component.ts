import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, model, input, output, computed, signal, viewChild, type OnInit } from '@angular/core';
import { BillflowModalShellComponent } from '../../../shared/components/billflow-modal-shell.component';
import type { CategoryEntity } from '../domain/category.entity';
import type { CategoriesCopy } from '../i18n/categories.translations';

@Component({
  selector: 'billflow-category-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, BillflowModalShellComponent],
  template: `
    <billflow-modal-shell
      #shell
      title="{{ editing() ? copy().modalEditTitle : copy().modalCreateTitle }}"
      subtitle="{{ editing() ? copy().modalEditSubtitle : copy().modalCreateSubtitle }}"
      icon="category"
      maxWidth="md"
      [hasFooter]="true"
      [formHasChanges]="formHasChanges"
      (close)="close.emit()"
    >
      <div class="p-6 grid grid-cols-1 gap-5">
        <!-- Name -->
        <div>
          <label class="block text-sm font-semibold text-on-surface mb-1.5">
            {{ copy().nameLabel }} <span class="text-error">*</span>
          </label>
          <input
            type="text"
            class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            [maxLength]="100"
            [placeholder]="copy().namePlaceholder"
            [(ngModel)]="name"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-semibold text-on-surface mb-1.5">
            {{ copy().descriptionLabel }}
          </label>
          <textarea
            class="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant resize-none h-20"
            [placeholder]="copy().descriptionPlaceholder"
            [(ngModel)]="description"
          ></textarea>
        </div>
      </div>

      <div footer class="flex w-full items-center justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all border border-outline-variant/50"
          (click)="requestClose()"
        >
          {{ copy().cancel }}
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
          [disabled]="!name().trim()"
          (click)="save.emit()"
        >
          {{ editing() ? copy().saveEdit : copy().save }}
        </button>
      </div>
    </billflow-modal-shell>
  `,
})
export class CategoryFormModalComponent implements OnInit {
  // Spec 3 R6: viewChild to the shell so the host's Cancel button can route
  // through the shell's `requestClose()` (which owns the unsaved-changes guard).
  private readonly shell = viewChild(BillflowModalShellComponent);

  copy = input.required<CategoriesCopy>();
  editing = input<CategoryEntity | null>(null);
  name = model.required<string>();
  description = model.required<string>();
  close = output<void>();
  save = output<void>();

  // Spec 3 R6: initial-value snapshot. The modal is *ngIf'd by the parent
  // (categories-page) and re-created on every open, so the snapshot is
  // captured exactly once at ngOnInit (after inputs are bound).
  private readonly initialName = signal('');
  private readonly initialDescription = signal('');

  readonly formHasChanges = computed(() =>
    this.name() !== this.initialName() || this.description() !== this.initialDescription()
  );

  ngOnInit(): void {
    this.initialName.set(this.name());
    this.initialDescription.set(this.description());
  }

  /**
   * Host-side helper that routes the Cancel button through the shell's
   * `requestClose()`. The shell owns the unsaved-changes guard.
   */
  async requestClose(): Promise<void> {
    await this.shell()?.requestClose();
  }
}
