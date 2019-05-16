import { $, browser } from 'protractor';
import { appHost } from '../protractor.conf';
import * as loginView from '../views/login.view';

const JASMINE_DEFAULT_TIMEOUT_INTERVAL = jasmine.DEFAULT_TIMEOUT_INTERVAL;
const JASMINE_EXTENDED_TIMEOUT_INTERVAL = 1000 * 60 * 3;
const {
  BRIDGE_SPECIFY_IDP = 'test',
  BRIDGE_SPECIFY_USERNAME = 'test',
  BRIDGE_SPECIFY_PASSWORD,
} = process.env;

describe('Auth test', () => {
  beforeAll(async() => {
    await browser.get(appHost);
    await browser.sleep(3000); // Wait long enough for the login redirect to complete
  });

    describe('Login test', async() => {
      beforeAll(() => {
        // Extend the default jasmine timeout interval just in case it takes a while for the htpasswd idp to be ready
        jasmine.DEFAULT_TIMEOUT_INTERVAL = JASMINE_EXTENDED_TIMEOUT_INTERVAL;
      });

      afterAll(() => {
        // Set jasmine timeout interval back to the original value after these tests are done
        jasmine.DEFAULT_TIMEOUT_INTERVAL = JASMINE_DEFAULT_TIMEOUT_INTERVAL;
      });

      it('logs in via specified identity provider', async() => {
        await loginView.login(BRIDGE_SPECIFY_IDP, BRIDGE_SPECIFY_USERNAME, BRIDGE_SPECIFY_PASSWORD);
        expect(browser.getCurrentUrl()).toContain(appHost);
        expect(loginView.userDropdown.getText()).toContain(BRIDGE_SPECIFY_USERNAME);
      });

      it('logs out specified user', async() => {
        await loginView.logout();
        expect(browser.getCurrentUrl()).toContain('oauth-openshift');
        expect($('.login-pf').isPresent()).toBeTruthy();

        // Log back in so that remaining tests can be run
        await loginView.login(BRIDGE_SPECIFY_IDP, BRIDGE_SPECIFY_USERNAME, BRIDGE_SPECIFY_PASSWORD);
        expect(loginView.userDropdown.getText()).toContain(BRIDGE_SPECIFY_USERNAME);
      });
    });
});
