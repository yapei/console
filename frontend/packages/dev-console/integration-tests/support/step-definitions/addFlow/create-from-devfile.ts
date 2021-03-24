import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addPage, gitPage, topologyPage, devFilePage } from '../../pages';
import { addOptions, messages } from '../../constants';
import { devFilePO, gitPO, topologyPO } from '../../pageObjects';

Given('user is at Import from Devfile page', () => {
  addPage.selectCardFromOptions(addOptions.DevFile);
});

When('user right clicks on topology empty graph', () => {
  cy.get(topologyPO.graph.emptyGraph).rightclick(1, 1);
});

When('user selects {string} option from Add to Project context menu', (option: string) => {
  cy.get(topologyPO.graph.contextMenuOptions.addToProject)
    .focus()
    .trigger('mouseover');
  cy.byTestActionID(option).click({ force: true });
});

When('user enters Git Repo url {string}', (gitUrl: string) => {
  gitPage.enterGitUrl(gitUrl);
  gitPage.verifyValidatedMessage();
});

Then('user is able to see workload {string} in topology page', (workloadName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});

When('user selects Try sample link', () => {
  devFilePage.clickTrySample();
  gitPage.verifyValidatedMessage();
  gitPage.enterAppName('devfile-sample-app');
  gitPage.enterComponentName('devfile-sample');
  cy.get(gitPO.gitRepoUrl).should(
    'have.value',
    'https://github.com/redhat-developer/devfile-sample',
  );
});

When('user clicks Create button on Devfile page', () => {
  gitPage.clickCreate();
});

When('user enters Git Repo url {string}', (privateGitRepoUrl: string) => {
  gitPage.enterGitUrl(privateGitRepoUrl);
  cy.get(devFilePO.formFields.validatedMessage).should(
    'have.text',
    messages.addFlow.privateGitRepoMessage,
  );
});
