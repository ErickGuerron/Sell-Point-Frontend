import { Injectable, inject } from '@angular/core';
import { AuthIdentityStore } from '../auth/auth-identity.store';

export const PERMISSIONS = {
  // Employee management — ADMIN only
  EMPLOYEES_READ: 'employees:read',
  EMPLOYEES_CREATE: 'employees:create',
  EMPLOYEES_UPDATE: 'employees:update',
  EMPLOYEES_DELETE: 'employees:delete',
  EMPLOYEES_UNLOCK: 'employees:unlock',

  // Product management
  PRODUCTS_READ: 'products:read',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  PRODUCTS_ADJUST_STOCK: 'products:adjust-stock',
  PRODUCTS_MOVEMENTS: 'products:movements:read',

  // Category management — ADMIN only for write operations
  // GET (read) is public — all authenticated roles can list categories
  CATEGORIES_READ: 'categories:read',
  CATEGORIES_CREATE: 'categories:create',   // ADMIN only
  CATEGORIES_UPDATE: 'categories:update',       // ADMIN only
  CATEGORIES_DELETE: 'categories:delete',      // ADMIN only

  // Customer management
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',

  // Invoice management
  INVOICES_READ: 'invoices:read',
  INVOICES_CREATE: 'invoices:create',
  INVOICES_CANCEL: 'invoices:cancel',
  INVOICES_PDF: 'invoices:pdf',
  INVOICES_RESEND_EMAIL: 'invoices:resend-email',

  // Sales management
  SALES_READ: 'sales:read',
  SALES_CREATE: 'sales:create',
  SALES_CANCEL: 'sales:cancel',

  // Tax rates — ADMIN only
  TAX_RATES_READ: 'tax-rates:read',
  TAX_RATES_CREATE: 'tax-rates:create',
  TAX_RATES_UPDATE: 'tax-rates:update',

  // Invoice series — ADMIN only
  INVOICE_SERIES_READ: 'invoice-series:read',
  INVOICE_SERIES_CREATE: 'invoice-series:create',
  INVOICE_SERIES_UPDATE: 'invoice-series:update',
  INVOICE_SERIES_DELETE: 'invoice-series:delete',

  // Roles — ADMIN only
  ROLES_READ: 'roles:read',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',

  // Dashboard
  DASHBOARD_READ: 'dashboard:read',

  // User management
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_UNLOCK: 'users:unlock',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly authIdentityStore = inject(AuthIdentityStore);

  // ── Role constants ──────────────────────────────────────────────
  static readonly ROLE_ADMIN = 'ADMIN';
  static readonly ROLE_VENDEDOR = 'VENDEDOR';
  static readonly ROLE_CAJERO = 'CAJERO';
  static readonly ROLE_BODEGA = 'BODEGA';

  // ── Permission map per role ──────────────────────────────────────
  private readonly rolePermissions: ReadonlyMap<string, ReadonlySet<Permission>> = new Map([
    [
      PermissionsService.ROLE_ADMIN,
      new Set([
        '*', // wildcard — admin can do everything
      ] as Permission[]),
    ],
    [
      PermissionsService.ROLE_VENDEDOR,
      new Set([
        // Sales
        PERMISSIONS.SALES_CREATE,
        PERMISSIONS.SALES_CANCEL,
        PERMISSIONS.SALES_READ,
        // Products (read + stock adjustment only)
        PERMISSIONS.PRODUCTS_READ,
        PERMISSIONS.PRODUCTS_ADJUST_STOCK,
        PERMISSIONS.PRODUCTS_MOVEMENTS,
        // Customers — read only for VENDEDOR/CAJERO; write operations are ADMIN only per backend
        PERMISSIONS.CUSTOMERS_READ,
        // Invoices
        PERMISSIONS.INVOICES_READ,
        PERMISSIONS.INVOICES_PDF,
        // Categories — read only (write operations are ADMIN only per backend)
        PERMISSIONS.CATEGORIES_READ,
        // Dashboard
        PERMISSIONS.DASHBOARD_READ,
      ] as Permission[]),
    ],
    [
      PermissionsService.ROLE_CAJERO,
      new Set([
        // Sales
        PERMISSIONS.SALES_CREATE,
        PERMISSIONS.SALES_CANCEL,
        PERMISSIONS.SALES_READ,
        // Products
        PERMISSIONS.PRODUCTS_READ,
        PERMISSIONS.PRODUCTS_ADJUST_STOCK,
        PERMISSIONS.PRODUCTS_MOVEMENTS,
        // Customers — read only for CAJERO; write operations are ADMIN only per backend
        PERMISSIONS.CUSTOMERS_READ,
        // Invoices
        PERMISSIONS.INVOICES_READ,
        PERMISSIONS.INVOICES_PDF,
        PERMISSIONS.INVOICES_RESEND_EMAIL,
        // Categories — read only (write operations are ADMIN only per backend)
        PERMISSIONS.CATEGORIES_READ,
        // Dashboard
        PERMISSIONS.DASHBOARD_READ,
      ] as Permission[]),
    ],
    [
      PermissionsService.ROLE_BODEGA,
      new Set([
        // Products — full access for stock management
        PERMISSIONS.PRODUCTS_READ,
        PERMISSIONS.PRODUCTS_ADJUST_STOCK,
        PERMISSIONS.PRODUCTS_MOVEMENTS,
        // Categories — read only
        PERMISSIONS.CATEGORIES_READ,
        // Dashboard
        PERMISSIONS.DASHBOARD_READ,
      ] as Permission[]),
    ],
  ]);

  // ── Current user ────────────────────────────────────────────────
  /**
   * Returns the current user's role from the in-memory identity store.
   * The store is populated by `AuthHttpService.fetchAndStoreIdentity()`
   * on login / first authenticated call and is hydrated from
   * `localStorage` (non-secret fields only) on boot.
   */
  get currentRole(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    const identity = this.authIdentityStore.get();
    const role = identity.role;
    if (role) return role;
    const inner = identity.user as { role?: string } | undefined;
    return inner?.role;
  }

  // ── Role checks ──────────────────────────────────────────────────
  isAdmin(): boolean {
    return this.currentRole === PermissionsService.ROLE_ADMIN;
  }

  isVendedor(): boolean {
    return this.currentRole === PermissionsService.ROLE_VENDEDOR;
  }

  isCajero(): boolean {
    return this.currentRole === PermissionsService.ROLE_CAJERO;
  }

  isBodega(): boolean {
    return this.currentRole === PermissionsService.ROLE_BODEGA;
  }

  // ── Permission checks ────────────────────────────────────────────
  /**
   * Returns true if the current user has the given permission.
   * ADMIN always returns true (wildcard match).
   */
  hasPermission(permission: Permission | string): boolean {
    const role = this.currentRole;
    if (!role) return false;

    const perms = this.rolePermissions.get(role);
    if (!perms) return false;

    // Wildcard — admin can do anything
    if (perms.has('*' as Permission)) return true;

    return perms.has(permission as Permission);
  }

  /**
   * Shortcut: check multiple permissions with AND logic.
   * User must have ALL listed permissions.
   */
  hasAllPermissions(...permissions: (Permission | string)[]): boolean {
    return permissions.every((p) => this.hasPermission(p));
  }

  /**
   * Shortcut: check multiple permissions with OR logic.
   * User must have AT LEAST ONE listed permission.
   */
  hasAnyPermission(...permissions: (Permission | string)[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  }

  // ── Route guards ────────────────────────────────────────────────
  /**
   * Check if the current user can access a given route path.
   * Returns true for public routes, false for protected ones.
   */
  canActivateRoute(path: string): boolean {
    const role = this.currentRole;

    // Admin-only routes
    const adminRoutes = ['/employees', '/roles'];
    if (adminRoutes.some((r) => path.startsWith(r))) {
      return role === PermissionsService.ROLE_ADMIN;
    }

    // All authenticated users can access the rest
    return role !== undefined;
  }

  /**
   * Returns which routes should be visible in the navigation for the current role.
   * Used to filter sidebar/mobile nav items.
   */
  get visibleRoutePrefixes(): string[] {
    const role = this.currentRole;

    if (!role) return ['/dashboard'];

    if (role === PermissionsService.ROLE_ADMIN) {
      return ['/dashboard', '/invoices', '/products', '/customers', '/employees', '/categories'];
    }

    // VENDEDOR, CAJERO, BODEGA — no employees page
    return ['/dashboard', '/invoices', '/products', '/customers', '/categories'];
  }
}