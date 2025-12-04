import { checkErrors, testName } from '../support';
import { guidedTour } from '../views/guided-tour';
import * as yamlEditor from '../views/yaml-editor';

describe('PR-15741: ClusterExtension Creation Page - Positive Tests', () => {
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

  it('Scenario 5: Verify direct URL access with query parameters populates YAML correctly', () => {
    const testPackageName = 'test-pkg';
    const testVersion = '2.0.0';
    const testCatalog = 'test-catalog';

    cy.log('Navigate directly to URL with query parameters');
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${testPackageName}&version=${testVersion}&catalog=${testCatalog}`,
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify YAML content is populated correctly');
    yamlEditor.getEditorContent().then((content) => {
      cy.log('Check metadata.name');
      expect(content).to.include(`name: ${testPackageName}`);

      cy.log('Check spec.namespace');
      expect(content).to.include(`namespace: ${testPackageName}`);

      cy.log('Check spec.serviceAccount.name');
      expect(content).to.include(`name: ${testPackageName}-service-account`);

      cy.log('Check spec.source.catalog.packageName');
      expect(content).to.include(`packageName: ${testPackageName}`);

      cy.log('Check spec.source.catalog.version');
      expect(content).to.include(`version: ${testVersion}`);

      cy.log('Check spec.source.catalog.selector.matchLabels');
      expect(content).to.include(`olm.operatorframework.io/metadata.name: ${testCatalog}`);
    });
  });

  it('Scenario 6: Verify YAML editor allows manual modifications to pre-filled template', () => {
    cy.log('Navigate to ClusterExtension creation page with pre-filled values');
    cy.visit(
      '/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=original-name&version=1.0.0&catalog=test-catalog',
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Get original content');
    yamlEditor.getEditorContent().then((originalContent) => {
      cy.log('Modify metadata.name field');
      const modifiedContent = originalContent
        .replace('name: original-name', 'name: custom-extension-name')
        .replace('namespace: original-name', 'namespace: custom-namespace')
        .replace('name: original-name-service-account', 'name: custom-sa');

      cy.log('Set modified content');
      yamlEditor.setEditorContent(modifiedContent);

      cy.log('Verify modifications are reflected');
      yamlEditor.getEditorContent().then((content) => {
        expect(content).to.include('name: custom-extension-name');
        expect(content).to.include('namespace: custom-namespace');
        expect(content).to.include('name: custom-sa');
      });
    });
  });

  it('Scenario 7: Verify successful ClusterExtension creation with valid YAML', () => {
    const uniqueName = `${clusterExtensionName}-valid`;

    cy.log('Navigate to ClusterExtension creation page');
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${uniqueName}&version=1.0.0&catalog=test-catalog`,
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify YAML content is valid');
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.include('apiVersion: olm.operatorframework.io/v1');
      expect(content).to.include('kind: ClusterExtension');
      expect(content).to.include(`name: ${uniqueName}`);
    });

    cy.log('Click Create button');
    yamlEditor.clickSaveCreateButton();

    cy.log('Verify redirect to ClusterExtension details page');
    cy.url({ timeout: 10000 }).should('include', uniqueName);

    cy.log('Cleanup');
    cy.exec(`kubectl delete clusterextension ${uniqueName} --ignore-not-found=true`, {
      failOnNonZeroExit: false,
    });
  });

  it('Scenario 8: Verify cancel action does not create resource', () => {
    cy.log('Navigate to ClusterExtension creation page');
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${testName}&version=1.0.0&catalog=test-catalog`,
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Make some modifications');
    yamlEditor.getEditorContent().then((content) => {
      const modified = content.replace(testName, `${testName}-modified`);
      yamlEditor.setEditorContent(modified);
    });

    cy.log('Click Cancel button');
    yamlEditor.clickCancelButton();

    cy.log('Verify redirect away from creation page');
    cy.url().should('not.include', '/~new');

    cy.log('Verify resource was not created');
    cy.exec(`kubectl get clusterextension ${testName} 2>&1 || true`).then((result) => {
      expect(result.stdout || result.stderr).to.match(/NotFound|not found|No resources found/i);
    });
  });

  it('Scenario 9: Verify ClusterExtension creation with partial query parameters', () => {
    const partialPackageName = 'partial-pkg';

    cy.log('Navigate to URL with only packageName parameter');
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${partialPackageName}`,
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify YAML content');
    yamlEditor.getEditorContent().then((content) => {
      cy.log('Check packageName is populated');
      expect(content).to.include(`name: ${partialPackageName}`);
      expect(content).to.include(`packageName: ${partialPackageName}`);

      cy.log('Check missing parameters show placeholders');
      expect(content).to.include('<version>');
      expect(content).to.include('<cluster-catalog-name>');

      cy.log('Verify YAML is valid and editable');
      expect(content).to.include('apiVersion: olm.operatorframework.io/v1');
      expect(content).to.include('kind: ClusterExtension');
    });
  });

  it('Scenario 11: Verify correct API version and kind in generated YAML', () => {
    cy.log('Navigate to ClusterExtension creation page');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify API version and kind');
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.include('apiVersion: olm.operatorframework.io/v1');
      expect(content).to.include('kind: ClusterExtension');
    });
  });

  it('Scenario 13: Verify direct URL access without query parameters shows placeholder values', () => {
    cy.log('Navigate to ClusterExtension creation page without query parameters');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify placeholder values are displayed');
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.include('name: example');
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

  it('Scenario 29: Verify handling of query parameters with only packageName', () => {
    const onlyPackageName = 'only-package';

    cy.log('Navigate with only packageName parameter');
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${onlyPackageName}`,
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify YAML content');
    yamlEditor.getEditorContent().then((content) => {
      cy.log('Check metadata.name is populated');
      expect(content).to.include(`name: ${onlyPackageName}`);

      cy.log('Check spec.source.catalog.packageName is populated');
      expect(content).to.include(`packageName: ${onlyPackageName}`);

      cy.log('Check version and catalog show placeholders');
      expect(content).to.include('<version>');
      expect(content).to.include('<cluster-catalog-name>');

      cy.log('Verify template is valid');
      expect(content).to.include('apiVersion: olm.operatorframework.io/v1');
    });
  });
});
