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
            table_name: 'products',
            record_id: 'abc-123',
            action: 'UPDATE',
            changed_by_user_id: 'usr-1',
            changed_by_email: 'admin@test.com',
            changed_by_role: 'ADMIN',
            changed_columns: ['name', 'price'],
            old_values: { name: 'Old', price: 100 },
            new_values: { name: 'New', price: 150 },
            created_at: '2026-06-08T12:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 5,
        totalPages: 1,
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

      // Verify URL was constructed correctly
      const url = mockAuthHttp.fetchWithRefresh.calls.mostRecent().args[0] as string;
      expect(url).toContain('page=1');
      expect(url).toContain('limit=5');
      expect(url).toContain('table_name=products');
      expect(url).toContain('action=UPDATE');
      expect(url).toContain('date_from=2026-06-01');
      expect(url).toContain('date_to=2026-06-08');

      // Verify response mapping (snake_case → camelCase)
      expect(result.data.length).toBe(1);
      expect(result.data[0].tableName).toBe('products');
      expect(result.data[0].recordId).toBe('abc-123');
      expect(result.data[0].changedByEmail).toBe('admin@test.com');
      expect(result.data[0].changedByRole).toBe('ADMIN');
      expect(result.data[0].action).toBe('UPDATE');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(1);
    });

    it('should omit empty optional filters from query params', async () => {
      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response(JSON.stringify({ data: [], total: 0, page: 1, limit: 5, totalPages: 0 }), { status: 200 }));

      await service.list({ page: 2, limit: 25 });

      const url = mockAuthHttp.fetchWithRefresh.calls.mostRecent().args[0] as string;
      expect(url).toContain('page=2');
      expect(url).toContain('limit=25');
      expect(url).not.toContain('table_name');
      expect(url).not.toContain('action');
      expect(url).not.toContain('date_from');
      expect(url).not.toContain('date_to');
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
        table_name: 'users',
        record_id: 'usr-2',
        action: 'DELETE',
        changed_by_user_id: 'admin-1',
        changed_by_email: 'admin@test.com',
        changed_columns: ['isActive'],
        old_values: { isActive: true },
        new_values: { isActive: false },
        created_at: '2026-06-08T12:00:00Z',
      };

      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response(JSON.stringify(mockResponse), { status: 200 }));

      const entry = await service.getById('1');

      expect(entry.id).toBe('1');
      expect(entry.tableName).toBe('users');
      expect(entry.action).toBe('DELETE');
      expect(entry.changedByEmail).toBe('admin@test.com');
      expect(entry.oldValues?.isActive).toBe(true);
      expect(entry.newValues?.isActive).toBe(false);
    });

    it('should throw on non-ok response', async () => {
      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response(null, { status: 404 }));

      await expectAsync(service.getById('999')).toBeRejectedWithError('Audit getById failed: 404');
    });
  });

  describe('getSummary', () => {
    it('should fetch and map summary from both snake_case and camelCase', async () => {
      const mockResponse = {
        actions_today: 145,
        active_users: 12,
        top_modified_entity: 'products',
      };

      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response(JSON.stringify(mockResponse), { status: 200 }));

      const summary = await service.getSummary();

      expect(summary.actionsToday).toBe(145);
      expect(summary.activeUsers).toBe(12);
      expect(summary.topModifiedEntity).toBe('products');
    });

    it('should throw on non-ok response', async () => {
      mockAuthHttp.fetchWithRefresh.and.resolveTo(new Response(null, { status: 500 }));

      await expectAsync(service.getSummary()).toBeRejectedWithError('Audit summary failed: 500');
    });
  });
});
