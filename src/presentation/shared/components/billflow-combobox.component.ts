import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  signal,
} from '@angular/core';

export interface ComboboxOption {
  value: string;
  label: string;
}

@Component({
  selector: 'billflow-combobox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="billflow-combobox relative" [class.billflow-combobox--compact]="compact" #hostRef>
      <!-- Trigger -->
      <button
        type="button"
        class="billflow-combobox__trigger"
        [class.billflow-combobox__trigger--open]="isOpen()"
        (click)="toggleDropdown()"
      >
        <span class="billflow-combobox__value" [class.text-outline-variant]="!selectedLabel">
          {{ selectedLabel || placeholder }}
        </span>
        <span class="material-symbols-outlined billflow-combobox__arrow">
          {{ isOpen() ? 'expand_less' : 'expand_more' }}
        </span>
      </button>

      <!-- Dropdown -->
      <div
        *ngIf="isOpen()"
        class="billflow-combobox__dropdown"
        (click)="$event.stopPropagation()"
      >
        <!-- Search inside dropdown -->
        <div class="billflow-combobox__search-wrap">
          <span class="material-symbols-outlined billflow-combobox__search-icon text-[16px]">search</span>
          <input
            #searchInput
            class="billflow-combobox__search-input"
            type="text"
            [placeholder]="searchPlaceholder"
            [ngModel]="searchText()"
            (ngModelChange)="searchText.set($event)"
            (keydown)="onSearchKeydown($event)"
          />
        </div>

        <!-- Options list (max 5 visible, scrollable) -->
        <ul class="billflow-combobox__list">
          <li
            *ngFor="let opt of filteredOptions; let idx = index; let last = last"
            class="billflow-combobox__option"
            [class.billflow-combobox__option--selected]="opt.value === value"
            [class.billflow-combobox__option--focused]="focusedIndex() === idx"
            [class.border-b]="!last"
            (click)="selectOption(opt)"
            (mouseenter)="focusedIndex.set(idx)"
          >
            <span>{{ opt.label }}</span>
            <span
              *ngIf="opt.value === value"
              class="material-symbols-outlined text-primary text-[18px]"
            >check</span>
          </li>

          <!-- Empty state -->
          <li *ngIf="filteredOptions.length === 0" class="billflow-combobox__option billflow-combobox__option--empty">
            <span class="text-outline-variant">{{ emptyLabel }}</span>
          </li>
        </ul>
      </div>
    </div>
  `,
})
export class BillflowComboboxComponent {
  @ViewChild('searchInput') private searchInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('hostRef') private hostRef?: ElementRef<HTMLElement>;

  @Input() options: ComboboxOption[] = [];
  @Input() value = '';
  @Input() placeholder = 'Seleccionar...';
  @Input() searchPlaceholder = 'Buscar...';
  @Input() emptyLabel = 'Sin resultados';
  @Input() compact = false;

  @Output() valueChange = new EventEmitter<string>();
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  isOpen = signal(false);
  searchText = signal('');
  focusedIndex = signal(-1);

  get selectedLabel(): string {
    if (!this.value) return '';
    const match = this.options.find((o) => o.value === this.value);
    return match ? match.label : '';
  }

  get filteredOptions(): ComboboxOption[] {
    const q = this.searchText().toLowerCase().trim();
    if (!q) return this.options;
    return this.options.filter((o) => o.label.toLowerCase().includes(q));
  }

  toggleDropdown() {
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    this.isOpen.set(true);
    this.searchText.set('');
    this.focusedIndex.set(-1);
    this.opened.emit();
    setTimeout(() => {
      this.searchInputRef?.nativeElement?.focus();
    });
  }

  closeDropdown() {
    this.isOpen.set(false);
    this.searchText.set('');
    this.focusedIndex.set(-1);
    this.closed.emit();
  }

  selectOption(opt: ComboboxOption) {
    if (this.value !== opt.value) {
      this.value = opt.value;
      this.valueChange.emit(opt.value);
    }
    this.closeDropdown();
  }

  onSearchKeydown(event: KeyboardEvent) {
    const filtered = this.filteredOptions;
    if (filtered.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = this.focusedIndex() + 1;
      this.focusedIndex.set(next >= filtered.length ? 0 : next);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = this.focusedIndex() - 1;
      this.focusedIndex.set(prev < 0 ? filtered.length - 1 : prev);
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      const idx = this.focusedIndex();
      if (idx >= 0 && idx < filtered.length) {
        event.preventDefault();
        this.selectOption(filtered[idx]);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        this.selectOption(filtered[0]);
      }
    } else if (event.key === 'Escape') {
      this.closeDropdown();
    }
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    if (!this.isOpen()) return;
    const target = event.target as Node | null;
    if (!target || this.hostRef?.nativeElement.contains(target)) return;
    this.closeDropdown();
  }
}
