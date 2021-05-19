import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { addOptions } from '../../constants/add';
import { pageTitle } from '../../constants/pageTitle';
import { cardTitle } from '../../pageObjects/add-flow-po';
import { app } from '../app';

export const addPage = {
  selectCardFromOptions: (card: addOptions | string) => {
    app.waitForDocumentLoad();
    switch (card) {
      case 'Git':
      case addOptions.Git:
        cy.byLegacyTestID('import-from-git').click();
        // Bug: 1890678 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
        // cy.testA11y('Import from Git Page');
        detailsPage.titleShouldContain(pageTitle.Git);
        break;
      case 'Deploy Image':
      case addOptions.ContainerImage:
        cy.byLegacyTestID('deploy-image').click();
        // Bug: 1890678 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
        // cy.testA11y('Deploy Page');
        detailsPage.titleShouldContain(pageTitle.ContainerImage);
        break;
      case 'Import from Dockerfile':
      case addOptions.DockerFile:
        cy.byLegacyTestID('import-from-dockerfile').click();
        // Bug: 1890678 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
        // cy.testA11y('Import from Docker file');
        detailsPage.titleShouldContain(pageTitle.DockerFile);
        break;
      case 'Developer Catalog':
      case 'From Catalog':
      case addOptions.DeveloperCatalog:
        cy.byLegacyTestID('dev-catalog').click();
        app.waitForDocumentLoad();
        detailsPage.titleShouldContain(pageTitle.DeveloperCatalog);
        cy.testA11y(pageTitle.DeveloperCatalog);
        break;
      case 'Database':
      case addOptions.Database:
        cy.byLegacyTestID('dev-catalog-databases').click();
        detailsPage.titleShouldContain(pageTitle.DeveloperCatalog);
        cy.testA11y(pageTitle.DeveloperCatalog);
        break;
      case 'Event Source':
      case addOptions.EventSource:
        cy.byLegacyTestID('knative-event-source').click();
        detailsPage.titleShouldContain(pageTitle.EventSource);
        // Bug: ODC 5719 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
        // cy.testA11y(pageTitle.EventSource);
        break;
      case 'Helm Chart':
      case addOptions.HelmChart:
        cy.byLegacyTestID('helm').click({ force: true });
        detailsPage.titleShouldContain(pageTitle.HelmCharts);
        cy.testA11y(pageTitle.HelmCharts);
        break;
      case 'Operator Backed':
      case addOptions.OperatorBacked:
        cy.byLegacyTestID('operator-backed').click();
        detailsPage.titleShouldContain(pageTitle.OperatorBacked);
        cy.testA11y(pageTitle.OperatorBacked);
        break;
      case 'Pipeline':
      case addOptions.Pipeline:
        cy.byLegacyTestID('pipeline').click();
        cy.get('.odc-pipeline-builder-header__title').should(
          'have.text',
          pageTitle.PipelineBuilder,
        );
        cy.testA11y(pageTitle.PipelineBuilder);
        break;
      case 'Yaml':
      case addOptions.YAML:
        cy.byLegacyTestID('import-yaml').click();
        cy.get('[data-mode-id="yaml"]').should('be.visible');
        cy.testA11y(pageTitle.YAML);
        break;
      case 'Channel':
      case addOptions.Channel:
        cy.byLegacyTestID('knative-eventing-channel').click();
        detailsPage.titleShouldContain(pageTitle.Channel);
        cy.testA11y(pageTitle.Channel);
        break;
      case addOptions.DevFile:
        cy.byLegacyTestID('import-from-devfile').click();
        detailsPage.titleShouldContain(pageTitle.DevFile);
        // Below line is commented due to Bug: ODC-5832
        // cy.testA11y(pageTitle.DevFile);
        break;
      case addOptions.UploadJARFile:
        cy.byLegacyTestID('upload-jar').click();
        detailsPage.titleShouldContain(pageTitle.UploadJarFile);
        // Below line is commented due to Bug: ODC-5832
        // cy.testA11y(pageTitle.UploadJarFile);
        break;
      default:
        throw new Error(`Unable to find the "${card}" card on Add page`);
    }
  },
  verifyCard: (cardName: string) => cy.get(cardTitle).should('contain.text', cardName),
};
