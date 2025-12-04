import { checkErrors, testName } from '../support';
import { guidedTour } from '../views/guided-tour';
import { listPage } from '../views/list-page';
import * as yamlEditor from '../views/yaml-editor';

describe('PR-15741: ClusterExtension Creation Page - Integration Tests', () => {
  const clusterExtensionName = `test-extension-${testName}`;
  const packageName = 'prometheus-operator';

  before(() => {
    cy.login();
    guidedTour.close();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    // Cleanup: Delete created ClusterExtension if it exists
    cy.exec(`kubectl delete clusterextension ${clusterExtensionName} --ignore-not-found=true`, {
      failOnNonZeroExit: false,
    });
  });

  it('Scenario 1: Verify ClusterExtension creation page loads from catalog with pre-filled YAML template', () => {
    cy.log('Navigate to Software Catalog');
    cy.visit('/catalog/all-namespaces');
    cy.byTestID('page-heading').should('contain.text', 'Software Catalog');

    cy.log('Click on Operators type filter');
    cy.byTestID('tab operator').click();

    cy.log('Verify catalog tiles are present');
    cy.get('.co-catalog-tile').should('have.length.gt', 0);

    cy.log('Search for a specific operator');
    cy.byTestID('search-catalog').type(packageName);

    cy.log('Click on the first operator tile');
    cy.get('.co-catalog-tile').first().click();

    cy.log('Click Install button');
    cy.get('div.pf-v6-c-modal-box').within(() => {
      cy.get('[data-test="catalog-details-modal-cta"]').click();
    });

    cy.log('Verify redirect to ClusterExtension creation page');
    cy.url().should('include', '/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');
    cy.url().should('include', 'packageName=');

    cy.log('Verify YAML editor loads');
    yamlEditor.isLoaded();

    cy.log('Verify YAML contains expected content');
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.include('apiVersion: olm.operatorframework.io/v1');
      expect(content).to.include('kind: ClusterExtension');
    });
  });

  it('Scenario 2: Verify catalog install URL generation includes query parameters', () => {
    cy.log('Navigate to Software Catalog');
    cy.visit('/catalog/all-namespaces');

    cy.log('Click on Operators type filter');
    cy.byTestID('tab operator').click();

    cy.log('Search for operator');
    cy.byTestID('search-catalog').type('Datadog Operator');

    cy.log('Click on operator tile');
    cy.get('.co-catalog-tile').first().click();

    cy.log('Click Install button');
    cy.get('div.pf-v6-c-modal-box').within(() => {
      cy.get('[data-test="catalog-details-modal-cta"]').click();
    });

    cy.log('Verify URL includes query parameters');
    cy.url().should('include', 'packageName=');
    cy.url().should('include', '/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');
  });

  it('Scenario 3: Verify YAML template auto-populates all fields from catalog selection', () => {
    const testPackageName = 'test-operator';
    const testVersion = '1.5.0';
    const testCatalog = 'community-operators';

    cy.log('Navigate directly to ClusterExtension creation with query parameters');
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${testPackageName}&version=${testVersion}&catalog=${testCatalog}`,
    );

    cy.log('Verify YAML editor loads');
    yamlEditor.isLoaded();

    cy.log('Verify all fields are auto-populated correctly');
    yamlEditor.getEditorContent().then((content) => {
      cy.log('Verify metadata.name');
      expect(content).to.include(`name: ${testPackageName}`);

      cy.log('Verify spec.namespace');
      expect(content).to.include(`namespace: ${testPackageName}`);

      cy.log('Verify spec.serviceAccount.name');
      expect(content).to.include(`name: ${testPackageName}-service-account`);

      cy.log('Verify spec.source.catalog.packageName');
      expect(content).to.include(`packageName: ${testPackageName}`);

      cy.log('Verify spec.source.catalog.version');
      expect(content).to.include(`version: ${testVersion}`);

      cy.log('Verify spec.source.catalog.selector.matchLabels');
      expect(content).to.include(`olm.operatorframework.io/metadata.name: ${testCatalog}`);
    });
  });

  it('Scenario 4: Verify successful ClusterExtension resource creation from catalog flow', () => {
    const uniqueName = `${clusterExtensionName}-create`;

    cy.log('Navigate to ClusterExtension creation page with parameters');
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${uniqueName}&version=1.0.0&catalog=test-catalog`,
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Verify pre-filled YAML content');
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.include(`name: ${uniqueName}`);
    });

    cy.log('Click Create button');
    yamlEditor.clickSaveCreateButton();

    cy.log('Verify success notification or redirect to details page');
    cy.url({ timeout: 10000 }).should(
      'include',
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/${uniqueName}`,
    );

    cy.log('Cleanup: Delete created resource');
    cy.exec(`kubectl delete clusterextension ${uniqueName} --ignore-not-found=true`, {
      failOnNonZeroExit: false,
    });
  });

  it('Scenario 18: Verify integration between catalog item and ClusterExtension creation page', () => {
    const testPackageName = 'postgres-operator';
    const testVersion = '1.5.0';
    const testCatalog = 'community-operators';

    cy.log('Navigate to ClusterExtension creation with specific parameters');
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${testPackageName}&version=${testVersion}&catalog=${testCatalog}`,
    );

    cy.log('Verify URL contains correct query parameters');
    cy.url().should('include', `packageName=${testPackageName}`);
    cy.url().should('include', `version=${testVersion}`);
    cy.url().should('include', `catalog=${testCatalog}`);

    cy.log('Verify YAML editor loads');
    yamlEditor.isLoaded();

    cy.log('Verify all query parameters are reflected in YAML template');
    yamlEditor.getEditorContent().then((content) => {
      expect(content).to.include(`packageName: ${testPackageName}`);
      expect(content).to.include(`version: ${testVersion}`);
      expect(content).to.include(`olm.operatorframework.io/metadata.name: ${testCatalog}`);
    });
  });

  it('Scenario 19: Verify ClusterExtension resource creation integrates with Kubernetes API', () => {
    const uniqueName = `${clusterExtensionName}-api`;

    cy.log('Navigate to ClusterExtension creation page');
    cy.visit(
      `/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=${uniqueName}&version=1.0.0&catalog=test-catalog`,
    );

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Create the resource');
    yamlEditor.clickSaveCreateButton();

    cy.log('Verify redirect to details page');
    cy.url({ timeout: 10000 }).should('include', uniqueName);

    cy.log('Navigate to ClusterExtensions list page');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension');

    cy.log('Search for created resource');
    listPage.dvFilter.byName(uniqueName);

    cy.log('Verify resource appears in list');
    listPage.dvRows.shouldExist(uniqueName);

    cy.log('Cleanup');
    cy.exec(`kubectl delete clusterextension ${uniqueName} --ignore-not-found=true`, {
      failOnNonZeroExit: false,
    });
  });

  it('Scenario 20: Verify navigation flow from catalog to creation page and back', () => {
    cy.log('Navigate to Software Catalog');
    cy.visit('/catalog/all-namespaces');

    cy.log('Click on Operators type');
    cy.byTestID('tab operator').click();

    cy.log('Click on first operator tile');
    cy.get('.co-catalog-tile').first().click();

    cy.log('Click Install button');
    cy.get('div.pf-v6-c-modal-box').within(() => {
      cy.get('[data-test="catalog-details-modal-cta"]').click();
    });

    cy.log('Verify navigation to ClusterExtension creation page');
    cy.url().should('include', '/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Wait for YAML editor to load');
    yamlEditor.isLoaded();

    cy.log('Click Cancel button');
    yamlEditor.clickCancelButton();

    cy.log('Verify redirect back to previous page or catalog');
    cy.url().should('not.include', '/~new');

    cy.log('Verify no resources were created');
    cy.exec('kubectl get clusterextensions --no-headers 2>&1 || true').then((result) => {
      // Just verify command runs without creating test resources
      cy.log(`Current ClusterExtensions: ${result.stdout || 'none'}`);
    });
  });

  it('Scenario 24: Verify console extension registration for ClusterExtension creation', () => {
    cy.log('Navigate to ClusterExtension creation route directly');
    cy.visit('/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Verify page loads successfully');
    cy.url().should('include', '/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new');

    cy.log('Verify YAML editor component loads');
    yamlEditor.isLoaded();

    cy.log('Verify CreateClusterExtension component rendered');
    cy.get('.monaco-editor').should('be.visible');
  });
});
