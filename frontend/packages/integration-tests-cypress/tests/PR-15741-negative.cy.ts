import { checkErrors, testName } from '../support';
import { guidedTour } from '../views/guided-tour';
import * as yamlEditor from '../views/yaml-editor';

describe('PR-15741: ClusterExtension Creation Page - Negative Tests', () => {
  const clusterExtensionName = `test-extension-${testName}`;

  before(() => {
    cy.login();
    guidedTour.close();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    // Cleanup any created resources
    cy.exec(`kubectl delete clusterextension ${clusterExtensionName} --ignore-not-found=true`, {
      failOnNonZeroExit: false,
    });
  });

  it('Scenario 17: Verify validation error for missing required fields in YAML', () => {
    cy.log('Navigate to ClusterExtension creation page');
    cy.visit(
      '/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=test&version=1.0.0&catalog=test',
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Remove required field spec.source.catalog.packageName');
    yamlEditor.getEditorContent().then((content) => {
      // Remove the packageName line
      const modifiedContent = content.replace(/packageName:.*\n/, '');
      yamlEditor.setEditorContent(modifiedContent);
    });

    cy.log('Click Create button');
    yamlEditor.clickSaveCreateButton();

    cy.log('Verify error message is displayed');
    cy.get('.pf-v5-c-alert, .pf-v6-c-alert, .co-error', { timeout: 10000 }).should('be.visible');

    cy.log('Verify resource is not created');
    cy.url().should('include', '/~new');
  });

  it('Scenario 18: Verify validation error for invalid YAML syntax', () => {
    cy.log('Navigate to ClusterExtension creation page');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Enter invalid YAML syntax');
    const invalidYaml = `apiVersion: olm.operatorframework.io/v1
kind: ClusterExtension
metadata:
  name: invalid-yaml
spec:
    namespace: test
  serviceAccount:  # incorrect indentation
    name: test-sa
  source:
sourceType: Catalog  # missing indentation
    catalog:
      packageName: test`;

    yamlEditor.setEditorContent(invalidYaml);

    cy.log('Click Create button');
    yamlEditor.clickSaveCreateButton();

    cy.log('Verify error message is displayed');
    cy.get('[data-test="yaml-error"]', { timeout: 10000 }).should('be.visible');

    cy.log('Verify user remains on creation page');
    cy.url().should('include', '/~new');
  });

  it('Scenario 19: Verify validation error for invalid resource name format', () => {
    cy.log('Navigate to ClusterExtension creation page');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Set invalid resource name with uppercase letters');
    yamlEditor.getEditorContent().then((content) => {
      const invalidContent = content.replace('name: example', 'name: INVALID_NAME_CAPS');
      yamlEditor.setEditorContent(invalidContent);
    });

    cy.log('Click Create button');
    yamlEditor.clickSaveCreateButton();

    cy.log('Verify error message is displayed');
    cy.get('[data-test="yaml-error"]', { timeout: 10000 }).should('be.visible');

    cy.log('Verify resource is not created');
    cy.url().should('include', '/~new');
  });

  it('Scenario 20: Verify error handling when creating duplicate ClusterExtension', () => {
    const duplicateName = `${clusterExtensionName}-duplicate`;

    cy.log('Create first ClusterExtension resource');
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${duplicateName}&version=1.0.0&catalog=test`,
    );
    yamlEditor.isLoaded();
    yamlEditor.clickSaveCreateButton();

    cy.log('Wait for first resource creation');
    cy.url({ timeout: 15000 }).should('include', duplicateName);

    cy.log('Navigate to create duplicate resource');
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${duplicateName}&version=1.0.0&catalog=test`,
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Click Create button for duplicate');
    yamlEditor.clickSaveCreateButton();

    cy.log('Verify error message for duplicate resource');
    cy.get('[data-test="yaml-error"]', { timeout: 10000 }).should('be.visible');

    cy.log('Verify error indicates resource already exists');
    cy.get('[data-test="yaml-error"]').should(
      'include.text',
      /already exists|AlreadyExists|conflict/i,
    );

    cy.log('Cleanup');
    cy.exec(`kubectl delete clusterextension ${duplicateName} --ignore-not-found=true`, {
      failOnNonZeroExit: false,
    });
  });

  it('Scenario 21: Verify handling of malformed or empty URL query parameters', () => {
    cy.log('Navigate with empty query parameter values');
    cy.visit(
      '/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=&version=&catalog=',
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify placeholder values are displayed');
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.include('<package-name>');
      expect(content).to.include('<version>');
      expect(content).to.include('<cluster-catalog-name>');
    });

    cy.log('Verify YAML editor loads without errors');
    cy.get('.monaco-editor').should('be.visible');
  });

  it('Scenario 22: Verify validation error for invalid apiVersion', () => {
    cy.log('Navigate to ClusterExtension creation page');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Modify apiVersion to invalid value');
    yamlEditor.getEditorContent().then((content) => {
      const invalidContent = content.replace(
        'apiVersion: olm.operatorframework.io/v1',
        'apiVersion: invalid.io/v2',
      );
      yamlEditor.setEditorContent(invalidContent);
    });

    cy.log('Click Create button');
    yamlEditor.clickSaveCreateButton();

    cy.log('Verify error message is displayed');
    cy.get('[data-test="yaml-error"]', { timeout: 10000 }).should('be.visible');

    cy.log('Verify resource is not created');
    cy.url().should('include', '/~new');
  });

  it('Scenario 23: Verify error handling for invalid kind value', () => {
    cy.log('Navigate to ClusterExtension creation page');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Modify kind to different value');
    yamlEditor.getEditorContent().then((content) => {
      const invalidContent = content.replace('kind: ClusterExtension', 'kind: ClusterCatalog');
      yamlEditor.setEditorContent(invalidContent);
    });

    cy.log('Click Create button');
    yamlEditor.clickSaveCreateButton();

    cy.log('Verify error or redirect to different resource type');
    // The behavior might redirect to ClusterCatalog creation or show error
    cy.url({ timeout: 10000 }).then((url) => {
      if (url.includes('/~new')) {
        cy.log('Error displayed, staying on creation page');
        cy.get('[data-test="yaml-error"]').should('be.visible');
      } else {
        cy.log('Redirected to different resource type');
        expect(url).to.not.include('ClusterExtension');
      }
    });
  });
});
