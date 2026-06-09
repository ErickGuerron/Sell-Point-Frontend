import { TestBed } from '@angular/core/testing';
import { AuditApiService } from './audit-api.service';
import { AuthHttpService } from '../../shared/services/auth-http.service';

describe('AuditApiService', () => {
  let service: AuditApiService;
  let mockAuthHttp: jasmine.SpyObj<AuthHttpService>;

  beforeEach(() => {
    mockAuthHttp = jasmine.createSpyObj<AuthHttpService>('AuthHttpService', ['fetchWithRefresh']);

    TestBed.configureTestingModule({
      providers: [
        AuditApiService,
        { provide: AuthHttpService, useValue: mockAuthHttp },
      ],
    });

    service = TestBed.inject(AuditApiService);
  });

  describe('list', () => {
    it('should build correct query params with all filters', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            tableName: 'products',
            recordId: 'abc-123',
            action: 'UPDATE',
            userId: 'usr-1',
            email: 'admin@test.com',
            rol: 'ADMIN',
            changedColumns: ['name', 'price'],
            oldValues: { name: 'Old', price: 100 },
            newValues: { name: 'New', price: 150 },
            createdAt: '2026-06-08T12:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 5,
      };

      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response(JSON.stringify(mockResponse), { status: 200 }));

      const result = await service.list({
        page: 1,
        limit: 5,
        tableName: 'products',
        action: 'UPDATE',
        dateFrom: '2026-06-01',
        dateTo: '2026-06-08',
      });

      // Verify URL was constructed correctly (camelCase params)
      const url = mockAuthHttp.fetchWithRefresh.calls.mostRecent().args[0] as string;
      expect(url).toContain('page=1');
      expect(url).toContain('limit=5');
      expect(url).toContain('tableName=products');
      expect(url).toContain('action=UPDATE');
      expect(url).toContain('dateFrom=2026-06-01');
      expect(url).toContain('dateTo=2026-06-08');

      // Verify response mapping (API camelCase → entity camelCase)
      expect(result.data.length).toBe(1);
      expect(result.data[0].tableName).toBe('products');
      expect(result.data[0].recordId).toBe('abc-123');
      expect(result.data[0].changedByEmail).toBe('admin@test.com');
      expect(result.data[0].changedByRole).toBe('ADMIN');
      expect(result.data[0].changedByUserId).toBe('usr-1');
      expect(result.data[0].action).toBe('UPDATE');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(1);
    });

    it('should omit empty optional filters from query params', async () => {
      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response(JSON.stringify({ data: [], total: 0, page: 1, limit: 5 }), { status: 200 }));

      await service.list({ page: 2, limit: 25 });

      const url = mockAuthHttp.fetchWithRefresh.calls.mostRecent().args[0] as string;
      expect(url).toContain('page=2');
      expect(url).toContain('limit=25');
      expect(url).not.toContain('tableName');
      expect(url).not.toContain('action');
      expect(url).not.toContain('dateFrom');
      expect(url).not.toContain('dateTo');
    });

    it('should throw on non-ok response', async () => {
      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response(null, { status: 500 }));

      await expectAsync(service.list({ page: 1, limit: 5 })).toBeRejectedWithError('Audit list failed: 500');
    });
  });

  describe('getById', () => {
    it('should fetch and map a single entry', async () => {
      const mockResponse = {
        id: '1',
        tableName: 'users',
        recordId: 'usr-2',
        action: 'DELETE',
        userId: 'admin-1',
        email: 'admin@test.com',
        changedColumns: ['isActive'],
        oldValues: { isActive: true },
        newValues: { isActive: false },
        createdAt: '2026-06-08T12:00:00Z',
      };

      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response(JSON.stringify(mockResponse), { status: 200 }));

      const entry = await service.getById('1');

      expect(entry.id).toBe('1');
      expect(entry.tableName).toBe('users');
      expect(entry.action).toBe('DELETE');
      expect(entry.changedByEmail).toBe('admin@test.com');
      expect(entry.changedByUserId).toBe('admin-1');
      expect(entry.oldValues?.isActive).toBe(true);
      expect(entry.newValues?.isActive).toBe(false);
    });

    it('should throw on non-ok response', async () => {
      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response(null, { status: 404 }));

      await expectAsync(service.getById('999')).toBeRejectedWithError('Audit getById failed: 404');
    });
  });

  describe('getSummary', () => {
    it('should fetch and map summary from API response (arrays → flat)', async () => {
      const mockResponse = {
        actionsPerDay: [
          { date: '2026-06-08', count: 100 },
          { date: '2026-06-07', count: 45 },
        ],
        activeUsers: [
          { userId: 'u1', email: 'admin@test.com', count: 42 },
          { userId: 'u2', email: 'user@test.com', count: 18 },
        ],
        topModifiedEntities: [
          { tableName: 'products', count: 55 },
          { tableName: 'users', count: 30 },
        ],
      };

      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response(JSON.stringify(mockResponse), { status: 200 }));

      const summary = await service.getSummary();

      expect(summary.actionsToday).toBe(145); // 100 + 45
      expect(summary.activeUsers).toBe(2);     // 2 unique users
      expect(summary.topModifiedEntity).toBe('products');
    });

    it('should throw on non-ok response', async () => {
      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response(null, { status: 500 }));

      await expectAsync(service.getSummary()).toBeRejectedWithError('Audit summary failed: 500');
    });
  });
});
