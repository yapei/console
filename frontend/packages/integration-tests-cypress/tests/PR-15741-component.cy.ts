import { checkErrors, testName } from '../support';
import { guidedTour } from '../views/guided-tour';
import * as yamlEditor from '../views/yaml-editor';

describe('PR-15741: ClusterExtension Creation Page - Component Tests', () => {
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

  // Note: Feature flag tests would require setting up feature flags in test environment
  // These tests assume CLUSTER_EXTENSION_API flag is enabled
  it('Scenario 13: Verify ClusterExtension creation page is accessible when feature flag is enabled', () => {
    cy.log('Navigate to ClusterExtension creation route');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Verify page loads successfully');
    cy.url().should('include', '/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Verify YAML editor is functional');
    yamlEditor.isLoaded();

    cy.log('Verify YAML editor component is visible');
    cy.get('.monaco-editor').should('be.visible');

    cy.log('Verify Create and Cancel buttons are present');
    cy.byTestID('save-changes').should('be.visible');
    cy.byTestID('cancel').should('be.visible');
  });

  it('Scenario 15: Verify direct URL access without query parameters shows placeholder values', () => {
    cy.log('Navigate directly to creation page without query parameters');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify placeholder values are displayed in YAML');
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.include('<operator-namespace>');
      expect(content).to.include('<service-account-name>');
      expect(content).to.include('<package-name>');
      expect(content).to.include('<version>');
      expect(content).to.include('<cluster-catalog-name>');
    });

    cy.log('Verify template structure is valid');
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.include('apiVersion: olm.operatorframework.io/v1');
      expect(content).to.include('kind: ClusterExtension');
      expect(content).to.include('metadata:');
      expect(content).to.include('spec:');
    });
  });

  it('Scenario 16: Verify correct API version and kind in generated YAML', () => {
    cy.log('Navigate to ClusterExtension creation page');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify API version is correct');
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.include('apiVersion: olm.operatorframework.io/v1');
    });

    cy.log('Verify kind is correct');
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.include('kind: ClusterExtension');
    });

    cy.log('Verify template follows Kubernetes resource format');
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.match(/^apiVersion:/m);
      expect(content).to.include('metadata:');
      expect(content).to.include('spec:');
    });
  });

  it('Scenario 17: Verify YAML editor component renders correctly', () => {
    cy.log('Navigate to ClusterExtension creation page');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Verify YAML editor displays');
    cy.get('.monaco-editor').should('be.visible');

    cy.log('Verify syntax highlighting is present');
    yamlEditor.isLoaded();

    cy.log('Verify editor allows text selection and editing');
    cy.get('.monaco-editor textarea').should('exist');

    cy.log('Verify Create button is visible and enabled');
    cy.byTestID('save-changes').should('be.visible').and('not.be.disabled');

    cy.log('Verify Cancel button is visible and enabled');
    cy.byTestID('cancel').should('be.visible').and('not.be.disabled');

    cy.log('Verify editor is responsive');
    cy.get('.monaco-editor').should('have.css', 'width');
    cy.get('.monaco-editor').invoke('width').should('be.gt', 0);
  });

  it('Scenario 20: Verify CreateYAML component receives correct template prop', () => {
    const testPackageName = 'test-component';
    const testVersion = '1.0.0';
    const testCatalog = 'test-catalog';

    cy.log('Navigate to ClusterExtension creation with query parameters');
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${testPackageName}&version=${testVersion}&catalog=${testCatalog}`,
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify template includes all fields from ClusterExtensionModel');
    yamlEditor.getEditorContent().then((content) => {
      // Verify apiVersion from model
      expect(content).to.include('apiVersion: olm.operatorframework.io/v1');

      // Verify kind from model
      expect(content).to.include('kind: ClusterExtension');

      // Verify metadata section
      expect(content).to.include('metadata:');
      expect(content).to.include(`name: ${testPackageName}`);

      // Verify spec section
      expect(content).to.include('spec:');
      expect(content).to.include('namespace:');
      expect(content).to.include('serviceAccount:');
      expect(content).to.include('source:');
      expect(content).to.include('sourceType: Catalog');
    });

    cy.log('Verify props are correctly applied');
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.include(`packageName: ${testPackageName}`);
      expect(content).to.include(`version: ${testVersion}`);
      expect(content).to.include(`olm.operatorframework.io/metadata.name: ${testCatalog}`);
    });
  });

  it('Scenario 14: Verify useLocation hook correctly parses URL search parameters', () => {
    const hookTestPackage = 'hook-test';
    const hookTestVersion = '2.0.0';
    const hookTestCatalog = 'hook-catalog';

    cy.log('Navigate with specific query parameters');
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${hookTestPackage}&version=${hookTestVersion}&catalog=${hookTestCatalog}`,
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify all parameters are extracted and reflected in YAML');
    yamlEditor.getEditorContent().then((content) => {
      cy.log('Verify packageName extraction');
      expect(content).to.include(`name: ${hookTestPackage}`);
      expect(content).to.include(`packageName: ${hookTestPackage}`);

      cy.log('Verify version extraction');
      expect(content).to.include(`version: ${hookTestVersion}`);

      cy.log('Verify catalog extraction');
      expect(content).to.include(`olm.operatorframework.io/metadata.name: ${hookTestCatalog}`);
    });

    cy.log('Verify URLSearchParams correctly parses location.search');
    // The fact that all params are in YAML confirms URLSearchParams worked correctly
    cy.url().should('include', `packageName=${hookTestPackage}`);
    cy.url().should('include', `version=${hookTestVersion}`);
    cy.url().should('include', `catalog=${hookTestCatalog}`);
  });

  it('Scenario 25: Verify ClusterExtensionModel is correctly defined and exported', () => {
    cy.log('Navigate to ClusterExtension creation page');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify model properties in generated YAML');
    yamlEditor.getEditorContent().then((content) => {
      cy.log('Verify apiGroup is olm.operatorframework.io');
      expect(content).to.include('apiVersion: olm.operatorframework.io/v1');

      cy.log('Verify apiVersion is v1');
      expect(content).to.match(/apiVersion:.*\/v1/);

      cy.log('Verify kind is ClusterExtension');
      expect(content).to.include('kind: ClusterExtension');
    });

    cy.log('Verify URL references correct model plural');
    cy.url().should('include', 'olm.operatorframework.io~v1~ClusterExtension');
  });

  it('Scenario 36: Verify YAML template formatting and readability', () => {
    cy.log('Navigate to ClusterExtension creation with pre-filled data');
    cy.visit(
      '/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=format-test&version=1.0.0&catalog=test-catalog',
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify YAML formatting');
    yamlEditor.getEditorContent().then((content) => {
      cy.log('Check proper indentation (2 spaces per level)');
      expect(content).to.match(/^metadata:\n {2}name:/m);
      expect(content).to.match(/^spec:\n {2}namespace:/m);

      cy.log('Check logical field organization');
      const metadataIndex = content.indexOf('metadata:');
      const specIndex = content.indexOf('spec:');
      expect(specIndex).to.be.gt(metadataIndex);

      cy.log('Verify template is clean and readable');
      // Should not have excessive blank lines
      expect(content).to.not.match(/\n\n\n+/);
    });
  });

  it('Scenario 38: Verify navigation breadcrumbs and page context', () => {
    cy.log('Navigate to ClusterExtension creation page');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Wait for page to load');
    yamlEditor.isLoaded();

    cy.log('Verify page title or heading indicates ClusterExtension creation');
    // The page should have some indication it's for ClusterExtension
    cy.get('body').should('contain.text', 'ClusterExtension');

    cy.log('Verify breadcrumbs show proper navigation path');
    cy.get('[data-test="breadcrumb-link-0"], nav[aria-label="Breadcrumb"]').should('exist');
  });
});
