import { browser, $, ExpectedConditions as until } from 'protractor';

import { appHost, checkLogs, checkErrors, testName } from '../../protractor.conf';
import * as sidenavView from '../../views/sidenav.view';
import * as horizontalnavView from '../../views/horizontal-nav.view';
import * as crudView from '../../views/crud.view';
import * as srvCatalogView from '../../views/service-catalog.view';

describe('Test for existence of Service Catalog nav items', () => {
  beforeAll(async () => {
    browser.get(`${appHost}/status/ns/${testName}`);
    await browser.wait(until.presenceOf($('.pf-c-nav')));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays `Service Catalog` nav menu item in sidebar', async () => {
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Service Catalog')));

    expect(sidenavView.navSectionFor('Service Catalog').isDisplayed()).toBe(true);
  });

  it('displays `template-service-broker`', async () => {
    await sidenavView.clickNavLink(['Service Catalog', 'Broker Management']);
    await crudView.isLoaded();

    expect(crudView.rowForName('template-service-broker').isDisplayed()).toBe(true);
  });

  it('displays `MariaDB` service class', async () => {
    await sidenavView.clickNavLink(['Service Catalog', 'Broker Management']);
    await horizontalnavView.clickHorizontalTab('Service Classes');
    await crudView.isLoaded();

    await crudView.filterForName('MariaDB');
    await srvCatalogView.cscLinksPresent();

    expect(srvCatalogView.linkForCSC('MariaDB').isDisplayed()).toBe(true);
  });

  it('initially displays no service instances', async () => {
    await sidenavView.clickNavLink(['Service Catalog', 'Provisioned Services']);
    await crudView.isLoaded();

    expect(crudView.emptyState.getText()).toEqual('No Service Instances Found');
  });

  it('initially displays no service bindings', async () => {
    await sidenavView.clickNavLink(['Service Catalog', 'Provisioned Services']);
    await horizontalnavView.clickHorizontalTab('Service Bindings');
    await crudView.isLoaded();

    expect(crudView.emptyState.getText()).toEqual('No Service Bindings Found');
  });
});
