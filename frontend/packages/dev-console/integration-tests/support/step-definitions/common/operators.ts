import { Given } from 'cypress-cucumber-preprocessor/steps';
import { operators, switchPerspective } from '../../constants';
import {
  perspective,
  operatorsPage,
  installOperator,
  verifyAndInstallKnativeOperator,
} from '../../pages';
import { operatorsPO } from '@console/dev-console/integration-tests/support/pageObjects';

Given('user has installed Web Terminal operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  cy.get(operatorsPO.installOperators.search)
    .should('be.visible')
    .clear()
    .type(operators.WebTerminalOperator);
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound)) {
      installOperator(operators.WebTerminalOperator);
    } else {
      cy.log('Serverless operator is installed in cluster');
    }
  });
});

Given('user has installed OpenShift Serverless Operator', () => {
  verifyAndInstallKnativeOperator();
});
