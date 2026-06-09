// Task 4.3: Page loads with 5 rows (default page size)
// Task 4.4: Filter combo triggers correct API params
// Task 4.5: Pagination
// Task 4.6: ADMIN access /audit, non-ADMIN redirect

describe('Audit Page', () => {
  const baseUrl = 'http://localhost:4321';

  // ── 4.6: ADMIN access /audit, non-ADMIN redirect ──────────────────────

  describe('Task 4.6: ADMIN access check', () => {
    it('should redirect non-ADMIN users to /403', () => {
      cy.setCookie('billflow-session', JSON.stringify({ role: 'VENDEDOR', token: 'fake-token' }));
      cy.visit('/audit', { failOnStatusCode: false });
      cy.url().should('include', '/403');
    });

    it('should allow ADMIN users to access /audit', () => {
      cy.setCookie('billflow-session', JSON.stringify({ role: 'ADMIN', token: 'fake-token' }));
      cy.intercept('GET', '**/audit?page=1&limit=5', { fixture: 'audit-list.json' }).as('getAudit');
      cy.intercept('GET', '**/audit/summary', { fixture: 'audit-summary.json' }).as('getSummary');

      cy.visit('/audit');
      cy.wait('@getAudit');
      cy.wait('@getSummary');
      cy.contains('Audit Log').should('exist');
    });
  });

  // ── 4.3: Page loads with 5 rows (default) ─────────────────────────────

  describe('Task 4.3: Page loads with entries', () => {
    beforeEach(() => {
      cy.setCookie('billflow-session', JSON.stringify({ role: 'ADMIN', token: 'fake-token' }));
    });

    it('should render 5 audit entries in the table (default page size)', () => {
      const entries = Array.from({ length: 5 }, (_, i) => ({
        id: String(i + 1),
        table_name: i % 2 === 0 ? 'products' : 'users',
        record_id: `rec-${String(i + 1).padStart(3, '0')}`,
        action: i % 3 === 0 ? 'INSERT' : i % 3 === 1 ? 'UPDATE' : 'DELETE',
        changed_by_user_id: `usr-${(i % 10) + 1}`,
        changed_by_email: `user${(i % 10) + 1}@test.com`,
        changed_by_role: 'ADMIN',
        changed_columns: ['field1', 'field2'],
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
      }));

      cy.intercept('GET', '**/audit?page=1&limit=5', {
        statusCode: 200,
        body: { data: entries, total: 5, page: 1, limit: 5, totalPages: 1 },
      }).as('getAudit5');
      cy.intercept('GET', '**/audit/summary', { fixture: 'audit-summary.json' }).as('getSummary');

      cy.visit('/audit');
      cy.wait('@getAudit5');
      cy.wait('@getSummary');

      cy.get('table tbody tr').should('have.length', 5);
      cy.contains('5 resultados').should('exist');
    });

    it('should show KPI cards with summary data', () => {
      cy.intercept('GET', '**/audit?page=1&limit=5', { fixture: 'audit-list.json' }).as('getAudit');
      cy.intercept('GET', '**/audit/summary', { fixture: 'audit-summary.json' }).as('getSummary');

      cy.visit('/audit');
      cy.wait('@getAudit');
      cy.wait('@getSummary');

      cy.contains('145').should('exist'); // actionsToday
      cy.contains('12').should('exist');  // activeUsers
      cy.contains('products').should('exist'); // topModifiedTable
    });

    it('should show empty state when no entries returned', () => {
      cy.intercept('GET', '**/audit?page=1&limit=5', {
        statusCode: 200,
        body: { data: [], total: 0, page: 1, limit: 5, totalPages: 0 },
      }).as('getEmpty');
      cy.intercept('GET', '**/audit/summary', {
        statusCode: 200,
        body: { actions_today: 0, active_users: 0, top_modified_entity: '—' },
      }).as('getEmptySummary');

      cy.visit('/audit');
      cy.wait('@getEmpty');
      cy.wait('@getEmptySummary');

      cy.contains('No audit entries found').should('exist');
    });
  });

  // ── 4.4: Filter combo triggers correct API params ─────────────────────

  describe('Task 4.4: Filter combo triggers correct API params', () => {
    beforeEach(() => {
      cy.setCookie('billflow-session', JSON.stringify({ role: 'ADMIN', token: 'fake-token' }));
      cy.intercept('GET', '**/audit?page=1&limit=5', { fixture: 'audit-list.json' }).as('initialLoad');
      cy.intercept('GET', '**/audit/summary', { fixture: 'audit-summary.json' }).as('summary');
    });

    it('should include table_name=products in request when table filter selected', () => {
      cy.visit('/audit');
      cy.wait('@initialLoad');

      cy.intercept('GET', '**/audit*table_name*products**', { fixture: 'audit-list.json' }).as('filteredRequest');

      // Open the table combobox and select "products"
      cy.get('billflow-combobox').first().click();
      cy.get('.billflow-combobox__option').contains('products').click();

      cy.wait('@filteredRequest').its('request.url').should('include', 'table_name=products');
    });

    it('should include action=UPDATE in request when action filter selected', () => {
      cy.visit('/audit');
      cy.wait('@initialLoad');

      cy.intercept('GET', '**/audit*action*UPDATE**', { fixture: 'audit-list.json' }).as('filteredAction');

      // Open the action combobox (second one) and select UPDATE
      cy.get('billflow-combobox').eq(1).click();
      cy.get('.billflow-combobox__option').contains('UPDATE').click();

      cy.wait('@filteredAction').its('request.url').should('include', 'action=UPDATE');
      cy.wait('@filteredAction').its('request.url').should('include', 'page=1'); // reset to page 1
    });
  });

  // ── 4.5: Pagination ───────────────────────────────────────────────────

  describe('Task 4.5: Pagination', () => {
    beforeEach(() => {
      cy.setCookie('billflow-session', JSON.stringify({ role: 'ADMIN', token: 'fake-token' }));
      cy.intercept('GET', '**/audit/summary', { fixture: 'audit-summary.json' }).as('summary');
    });

    it('should change page size to 25 and show correct entries', () => {
      const entries = Array.from({ length: 25 }, (_, i) => ({
        id: String(i + 1),
        table_name: 'products',
        record_id: `rec-${String(i + 1).padStart(3, '0')}`,
        action: 'UPDATE',
        changed_by_user_id: 'usr-1',
        changed_by_email: 'admin@test.com',
        changed_by_role: 'ADMIN',
        changed_columns: ['name'],
        created_at: new Date(Date.now() - i * 60000).toISOString(),
      }));

      cy.intercept('GET', '**/audit?page=1&limit=5', {
        statusCode: 200,
        body: { data: entries.slice(0, 5), total: 120, page: 1, limit: 5, totalPages: 24 },
      }).as('loadPage1_5');

      cy.visit('/audit');
      cy.wait('@loadPage1_5');
      cy.wait('@summary');

      // Change page size to 25
      cy.intercept('GET', '**/audit?page=1&limit=25', {
        statusCode: 200,
        body: { data: entries, total: 120, page: 1, limit: 25, totalPages: 5 },
      }).as('loadPageSize25');

      cy.get('select').first().select('25');
      cy.wait('@loadPageSize25');
      cy.get('table tbody tr').should('have.length', 25);
    });

    it('should navigate to next page and show page 2 entries', () => {
      const page1Entries = Array.from({ length: 5 }, (_, i) => ({
        id: `p1-${i + 1}`,
        table_name: 'products',
        record_id: `rec-${i + 1}`,
        action: 'UPDATE',
        changed_by_user_id: 'usr-1',
        changed_by_email: 'admin@test.com',
        changed_by_role: 'ADMIN',
        changed_columns: ['name'],
        created_at: new Date(Date.now() - i * 60000).toISOString(),
      }));

      const page2Entries = Array.from({ length: 5 }, (_, i) => ({
        id: `p2-${i + 1}`,
        table_name: 'users',
        record_id: `rec-${i + 6}`,
        action: 'INSERT',
        changed_by_user_id: 'usr-2',
        changed_by_email: 'user2@test.com',
        changed_by_role: 'VENDEDOR',
        changed_columns: ['email'],
        created_at: new Date(Date.now() - (i + 5) * 60000).toISOString(),
      }));

      cy.intercept('GET', '**/audit?page=1&limit=5', {
        statusCode: 200,
        body: { data: page1Entries, total: 10, page: 1, limit: 5, totalPages: 2 },
      }).as('page1');

      cy.visit('/audit');
      cy.wait('@page1');

      cy.intercept('GET', '**/audit?page=2&limit=5', {
        statusCode: 200,
        body: { data: page2Entries, total: 10, page: 2, limit: 5, totalPages: 2 },
      }).as('page2');

      // Click next page button
      cy.get('button').contains('chevron_right').click();
      cy.wait('@page2');

      // Verify page 2 data
      cy.get('table tbody tr').should('have.length', 5);
    });
  });
});
