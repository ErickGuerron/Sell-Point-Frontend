import { PermissionsService, PERMISSIONS } from './permissions.service';

describe('PermissionsService — AUDIT_LOGS_READ', () => {
  let service: PermissionsService;

  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
    service = new PermissionsService();
  });

  describe('PERMISSIONS.AUDIT_LOGS_READ', () => {
    it('should have AUDIT_LOGS_READ defined in PERMISSIONS', () => {
      expect(PERMISSIONS.AUDIT_LOGS_READ).toBe('audit-logs:read');
    });

    it('should be accessible only via ADMIN wildcard', () => {
      // ADMIN has '*', no explicit AUDIT_LOGS_READ necessary
      // Non-ADMIN roles do NOT have AUDIT_LOGS_READ
      // This is verified by checking the rolePermissions map structure
      const adminSet = (service as any).rolePermissions.get('ADMIN');
      const vendedorSet = (service as any).rolePermissions.get('VENDEDOR');
      const cajeroSet = (service as any).rolePermissions.get('CAJERO');
      const bodegaSet = (service as any).rolePermissions.get('BODEGA');

      // ADMIN has wildcard — means they can do everything
      expect(adminSet.has('*')).toBeTrue();

      // Non-admin roles do NOT have AUDIT_LOGS_READ
      expect(vendedorSet.has(PERMISSIONS.AUDIT_LOGS_READ)).toBeFalse();
      expect(cajeroSet.has(PERMISSIONS.AUDIT_LOGS_READ)).toBeFalse();
      expect(bodegaSet.has(PERMISSIONS.AUDIT_LOGS_READ)).toBeFalse();
    });
  });

  describe('hasPermission with AUDIT_LOGS_READ', () => {
    it('should return true for ADMIN role', () => {
      localStorage.setItem('billflow-session', JSON.stringify({ role: 'ADMIN' }));
      expect(service.hasPermission(PERMISSIONS.AUDIT_LOGS_READ)).toBeTrue();
    });

    it('should return false for VENDEDOR role', () => {
      localStorage.setItem('billflow-session', JSON.stringify({ role: 'VENDEDOR' }));
      expect(service.hasPermission(PERMISSIONS.AUDIT_LOGS_READ)).toBeFalse();
    });

    it('should return false for CAJERO role', () => {
      localStorage.setItem('billflow-session', JSON.stringify({ role: 'CAJERO' }));
      expect(service.hasPermission(PERMISSIONS.AUDIT_LOGS_READ)).toBeFalse();
    });

    it('should return false for BODEGA role', () => {
      localStorage.setItem('billflow-session', JSON.stringify({ role: 'BODEGA' }));
      expect(service.hasPermission(PERMISSIONS.AUDIT_LOGS_READ)).toBeFalse();
    });

    it('should return false when no session exists', () => {
      localStorage.removeItem('billflow-session');
      expect(service.hasPermission(PERMISSIONS.AUDIT_LOGS_READ)).toBeFalse();
    });
  });

  describe('canActivateRoute with /audit', () => {
    it('should return true for ADMIN accessing /audit', () => {
      localStorage.setItem('billflow-session', JSON.stringify({ role: 'ADMIN' }));
      expect(service.canActivateRoute('/audit')).toBeTrue();
    });

    it('should return false for VENDEDOR accessing /audit', () => {
      localStorage.setItem('billflow-session', JSON.stringify({ role: 'VENDEDOR' }));
      expect(service.canActivateRoute('/audit')).toBeFalse();
    });

    it('should return false for CAJERO accessing /audit', () => {
      localStorage.setItem('billflow-session', JSON.stringify({ role: 'CAJERO' }));
      expect(service.canActivateRoute('/audit')).toBeFalse();
    });

    it('should return false for BODEGA accessing /audit', () => {
      localStorage.setItem('billflow-session', JSON.stringify({ role: 'BODEGA' }));
      expect(service.canActivateRoute('/audit')).toBeFalse();
    });
  });

  describe('visibleRoutePrefixes with /audit', () => {
    it('should include /audit for ADMIN', () => {
      localStorage.setItem('billflow-session', JSON.stringify({ role: 'ADMIN' }));
      expect(service.visibleRoutePrefixes).toContain('/audit');
    });

    it('should NOT include /audit for non-ADMIN roles', () => {
      localStorage.setItem('billflow-session', JSON.stringify({ role: 'VENDEDOR' }));
      expect(service.visibleRoutePrefixes).not.toContain('/audit');

      localStorage.setItem('billflow-session', JSON.stringify({ role: 'CAJERO' }));
      expect(service.visibleRoutePrefixes).not.toContain('/audit');

      localStorage.setItem('billflow-session', JSON.stringify({ role: 'BODEGA' }));
      expect(service.visibleRoutePrefixes).not.toContain('/audit');
    });
  });
});
