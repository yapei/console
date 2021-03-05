import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import { pipelinesPage, startPipelineInPipelinesPage } from '../../pages/pipelines/pipelines-page';
import { pipelineBuilderPage } from '../../pages/pipelines/pipelineBuilder-page';
import { modal } from '../../../../../integration-tests-cypress/views/modal';
import { pipelineRunDetailsPage } from '../../pages/pipelines/pipelineRun-details-page';
import { navigateTo } from '@console/dev-console/integration-tests/support/pages/app';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants/global';
import { pipelineBuilderPO, pipelinesPO } from '../../page-objects/pipelines-po';

When(
  'user selects {string} option from kebab menu for pipeline {string}',
  (option: string, pipelineName: string) => {
    pipelinesPage.search(pipelineName);
    pipelinesPage.selectKebabMenu(pipelineName);
    cy.byTestActionID(option).click();
  },
);

Given('pipeline run is displayed for {string} with resource', (pipelineName: string) => {
  pipelinesPage.clickOnCreatePipeline();
  pipelineBuilderPage.createPipelineWithGitResources(pipelineName);
  cy.byLegacyTestID('breadcrumb-link-0').click();
  pipelinesPage.search(pipelineName);
  pipelinesPage.selectKebabMenu(pipelineName);
  cy.byTestActionID('Start').click();
  modal.modalTitleShouldContain('Start Pipeline');
  startPipelineInPipelinesPage.addGitResource('https://github.com/sclorg/nodejs-ex.git');
  startPipelineInPipelinesPage.clickStart();
  pipelineRunDetailsPage.verifyTitle();
  navigateTo(devNavigationMenu.Pipelines);
  pipelinesPage.search(pipelineName);
  cy.get(pipelinesPO.pipelinesTable.pipelineRunIcon).should('be.visible');
});

When('user adds another task {string} in parallel', (taskName: string) => {
  pipelineBuilderPage.selectParallelTask(taskName);
  pipelineBuilderPage.addResource('git resource');
  pipelineBuilderPage.clickOnTask(taskName);
  cy.get(pipelineBuilderPO.formView.sidePane.inputResource).click();
  cy.byTestDropDownMenu('git resource').click();
  pipelineBuilderPage.clickCreateButton();
});

Given('user is at pipelines page', () => {
  navigateTo(devNavigationMenu.Pipelines);
});

Given('user has installed OpenShift Pipelines operator using cli', () => {
  cy.exec(`oc apply -f testData/installPipelinesOperator.yaml`);
  cy.exec(
    `oc patch OperatorHub cluster --type json -p '[{"op": "add", "path": "/spec/disableAllDefaultSources", "value": true}]'`,
  );
});
