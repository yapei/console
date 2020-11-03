export {};
declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      byTestID(selector: string): Chainable<Element>;
      byTestActionID(selector: string): Chainable<Element>;
      byLegacyTestID(selector: string): Chainable<Element>;
      byButtonText(selector: string): Chainable<Element>;
      byDataID(selector: string): Chainable<Element>;
      byTestSelector(selector: string): Chainable<Element>;
      byTestDropDownMenu(selector: string): Chainable<Element>;
    }
  }
}

// any command added below, must be added to global Cypress interface above

Cypress.Commands.add('byTestID', (selector: string) => {
  cy.get(`[data-test="${selector}"]`);
});
Cypress.Commands.add('byTestActionID', (selector: string) =>
  cy.get(`[data-test-action="${selector}"]:not(.pf-m-disabled)`),
);
// depreciated!  new IDs should use 'data-test', ie. `cy.byTestID(...)`
Cypress.Commands.add('byLegacyTestID', (selector: string) =>
  cy.get(`[data-test-id="${selector}"]`),
);
Cypress.Commands.add('byButtonText', (selector: string) =>
  cy.get('button[type="button"]').contains(`${selector}`),
);
Cypress.Commands.add('byDataID', (selector: string) => cy.get(`[data-id="${selector}"]`));

Cypress.Commands.add('byTestSelector', (selector: string) =>
  cy.get(`[data-test-selector="${selector}"]`),
);

Cypress.Commands.add('byTestDropDownMenu', (selector: string) =>
  cy.get(`[data-test-dropdown-menu="${selector}"]`),
);
