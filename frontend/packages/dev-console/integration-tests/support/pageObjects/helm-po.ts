export const helmPO = {
  noHelmReleasesMessage: 'h3',
  noHelmSearchMessage: '.loading-box.loading-box__loaded',
  search: '[data-test-id="item-filter"]',
  table: '[role="grid"]',
  helmReleaseName: 'tr td:nth-child(1)',
  resourcesTab: '[data-test-id="horizontal-link-Resources"]',
  revisionHistoryTab: '[data-test-id="horizontal-link-Revision history"]',
  releaseNotesTab: '[data-test-id="horizontal-link-Release notes"]',
  filterDropdown: '[data-test-id="filter-dropdown-toggle"] button[aria-label="Options menu"]',
  filterDropdownDialog: '[class$="menu-group"]',
  filterDropdownItem: '.co-filter-dropdown-item__name',
  filter: {
    pendingInstall: '[data-test-row-filter="pending-install"]',
    pendingUpgrade: '[data-test-row-filter="pending-upgrade"]',
    pendingRollback: '[data-test-row-filter="pending-rollback"]',
  },
  filterToolBar: '#filter-toolbar',
  deployedCheckbox: '[id*="deployed"]',
  failedCheckbox: '[id*="failed"]',
  otherCheckbox: '[id*="other"]',
  details: {
    title: '[data-test-section-heading="Helm Release Details"]',
  },
  upgradeHelmRelease: {
    replicaCount: '#root_replicaCount',
    chartVersion: '#form-dropdown-chartVersion-field',
    upgrade: '[data-test-id="submit-button"]',
    cancel: '[data-test-id="reset-button"]',
  },
  rollBackHelmRelease: {
    revision1: '#form-radiobutton-revision-1-field',
    rollBack: '[data-test-id="submit-button"]',
    cancel: '[data-test-id="reset-button"]',
  },
  uninstallHelmRelease: {
    releaseName: '#form-input-resourceName-field',
  },
  sidePane: {
    chartVersion: '.properties-side-panel-pf-property-value',
  },
  helmActions: {
    upgrade: '[data-test-action="Upgrade"]',
    rollBack: '[data-test-action="Rollback"]',
    deleteHelmRelease: '[data-test-action="Delete Helm Release"]',
  },
};
