import { Injectable, inject, signal, computed, type WritableSignal } from '@angular/core';
import { PermissionsService, type Permission } from './permissions.service';

export interface ShortcutDef {
  /** Key(s) to press, e.g. 'g i', '?', 'Escape', 'n', '/' */
  keys: string;
  /** English description */
  descriptionEn: string;
  /** Spanish description */
  descriptionEs: string;
  /** Category for grouping in the modal */
  category: 'navigation' | 'actions' | 'general';
  /** Action callback */
  action: () => void;
  /** Optional permission required to see/show this shortcut */
  permission?: Permission;
}

export interface ShortcutGroup {
  label: string;
  labelEn: string;
  labelEs: string;
  shortcuts: ShortcutDef[];
}

@Injectable({ providedIn: 'root' })
export class KeyboardShortcutService {
  private readonly permissions = inject(PermissionsService);

  // ── Modal state ────────────────────────────────────────────────────
  readonly isOpen: WritableSignal<boolean> = signal(false);

  // ── Shortcut registries ─────────────────────────────────────────────
  private globalShortcuts: ShortcutDef[] = [];
  private pageShortcuts: ShortcutDef[] = [];

  /** All currently registered shortcuts, filtered by permissions */
  readonly availableShortcuts = computed<ShortcutDef[]>(() => {
    const all = [...this.globalShortcuts, ...this.pageShortcuts];
    return all.filter((s) => !s.permission || this.permissions.hasPermission(s.permission));
  });

  /** Shortcuts grouped by category for the modal display */
  readonly shortcutGroups = computed<ShortcutGroup[]>(() => {
    const groups: ShortcutGroup[] = [];
    const categories = this.availableShortcuts().reduce((acc, s) => {
      const cat = s.category;
      if (!acc.has(cat)) acc.set(cat, []);
      acc.get(cat)!.push(s);
      return acc;
    }, new Map<string, ShortcutDef[]>());

    const order = ['navigation', 'actions', 'general'] as const;
    const labels: Record<string, { en: string; es: string }> = {
      navigation: { en: 'Navigation', es: 'Navegación' },
      actions: { en: 'Actions', es: 'Acciones' },
      general: { en: 'General', es: 'General' },
    };

    for (const cat of order) {
      const items = categories.get(cat);
      if (items && items.length > 0) {
        groups.push({
          label: labels[cat]?.es ?? cat,
          labelEn: labels[cat]?.en ?? cat,
          labelEs: labels[cat]?.es ?? cat,
          shortcuts: items,
        });
      }
    }
    return groups;
  });

  // ── Leader-key state ────────────────────────────────────────────────
  private leaderBuffer = '';
  private leaderTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.registerGlobalShortcuts();
    this.listen();
  }

  // ── Public API ──────────────────────────────────────────────────────
  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  /**
   * Register page-specific shortcuts. Call in ngOnInit and
   * unregister in ngOnDestroy.
   */
  register(...shortcuts: ShortcutDef[]): void {
    for (const s of shortcuts) {
      const existing = this.pageShortcuts.findIndex(
        (ps) => ps.keys === s.keys && ps.category === s.category,
      );
      if (existing !== -1) {
        this.pageShortcuts[existing] = s;
      } else {
        this.pageShortcuts.push(s);
      }
    }
  }

  /** Unregister page-specific shortcuts by key. */
  unregister(...keys: string[]): void {
    this.pageShortcuts = this.pageShortcuts.filter((s) => !keys.includes(s.keys));
  }

  /** Clear all page-specific shortcuts (call on destroy). */
  clearPageShortcuts(): void {
    this.pageShortcuts = [];
  }

  // ── Global shortcuts ────────────────────────────────────────────────
  private registerGlobalShortcuts(): void {
    this.globalShortcuts = [
      {
        keys: '?',
        descriptionEn: 'Show keyboard shortcuts',
        descriptionEs: 'Mostrar atajos de teclado',
        category: 'general',
        action: () => this.toggle(),
      },
      {
        keys: 'Escape',
        descriptionEn: 'Close modal / panel',
        descriptionEs: 'Cerrar modal / panel',
        category: 'general',
        action: () => this.close(),
      },
      // ── Navigation ──
      {
        keys: 'g d',
        descriptionEn: 'Go to Dashboard',
        descriptionEs: 'Ir al Dashboard',
        category: 'navigation',
        action: () => { window.location.href = '/dashboard'; },
      },
      {
        keys: 'g i',
        descriptionEn: 'Go to Invoices',
        descriptionEs: 'Ir a Facturas',
        category: 'navigation',
        action: () => { window.location.href = '/invoices'; },
      },
      {
        keys: 'g n',
        descriptionEn: 'New Invoice',
        descriptionEs: 'Nueva Factura',
        category: 'navigation',
        action: () => { window.location.href = '/create-invoice'; },
      },
      {
        keys: 'g p',
        descriptionEn: 'Go to Products',
        descriptionEs: 'Ir a Productos',
        category: 'navigation',
        action: () => { window.location.href = '/products'; },
      },
      {
        keys: 'g c',
        descriptionEn: 'Go to Customers',
        descriptionEs: 'Ir a Clientes',
        category: 'navigation',
        action: () => { window.location.href = '/customers'; },
      },
      {
        keys: 'g r',
        descriptionEn: 'Go to Categories',
        descriptionEs: 'Ir a Categorías',
        category: 'navigation',
        action: () => { window.location.href = '/categories'; },
      },
      {
        keys: 'g e',
        descriptionEn: 'Go to Employees',
        descriptionEs: 'Ir a Empleados',
        category: 'navigation',
        permission: 'employees:read' as Permission,
        action: () => { window.location.href = '/employees'; },
      },
      {
        keys: 'g o',
        descriptionEn: 'Go to Profile',
        descriptionEs: 'Ir a Perfil',
        category: 'navigation',
        action: () => { window.location.href = '/profile'; },
      },
    ];
  }

  // ── Keydown listener ────────────────────────────────────────────────
  private listen(): void {
    if (typeof document === 'undefined') return;
    document.addEventListener('keydown', this.handleKeydown);
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    // Never capture when user is typing in an input/textarea/select
    if (this.isInputFocused()) return;

    // If the shortcuts modal is open, only handle Escape and Enter/click equivalents
    if (this.isOpen()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
        return;
      }
      // Don't eat other keys when modal is open
      return;
    }

    const key = event.key;

    // ── Leader key: 'g' ────────────────────────────────────────────────
    if (key.toLowerCase() === 'g' && this.leaderBuffer === '') {
      this.leaderBuffer = 'g';
      this.resetLeaderTimeout();
      event.preventDefault();
      return;
    }

    if (this.leaderBuffer === 'g') {
      const combo = `g ${key.toLowerCase()}`;
      this.clearLeaderBuffer();
      const shortcut = this.findShortcut(combo);
      if (shortcut) {
        event.preventDefault();
        shortcut.action();
        return;
      }
      return; // Consumed the key even if no match
    }

    // ── Single-key shortcuts ──────────────────────────────────────────
    // '?'' requires Shift+/ → event.key is '?'
    if (key === '?') {
      event.preventDefault();
      this.toggle();
      return;
    }

    // Check other single-key shortcuts ('n', 'r', '/', Escape, etc.)
    const singleKey = key === '/' ? '/' : key.toLowerCase();
    const shortcut = this.findShortcut(singleKey);
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
      return;
    }
  };

  private isInputFocused(): boolean {
    const tag = document.activeElement?.tagName ?? '';
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      (document.activeElement as HTMLElement | null)?.isContentEditable === true
    );
  }

  private findShortcut(keys: string): ShortcutDef | undefined {
    return this.availableShortcuts().find((s) => s.keys === keys);
  }

  // ── Leader helpers ──────────────────────────────────────────────────
  private resetLeaderTimeout(): void {
    this.clearLeaderTimeout();
    this.leaderTimeout = setTimeout(() => this.clearLeaderBuffer(), 500);
  }

  private clearLeaderBuffer(): void {
    this.leaderBuffer = '';
  }

  private clearLeaderTimeout(): void {
    if (this.leaderTimeout !== undefined) {
      clearTimeout(this.leaderTimeout);
      this.leaderTimeout = undefined;
    }
  }
}
