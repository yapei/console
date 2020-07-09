import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  click,
  createResources,
  deleteResources,
  waitForStringInElement,
} from '@console/shared/src/test-utils/utils';
import { VirtualMachineModel } from '@console/kubevirt-plugin/src/models';
import { getVMManifest, hddDisk, multusNetworkInterface, multusNAD } from './utils/mocks';
import { VirtualMachine } from './models/virtualMachine';
import {
  JASMINE_EXTENDED_TIMEOUT_INTERVAL,
  NOT_AVAILABLE,
  PAGE_LOAD_TIMEOUT_SECS,
  TAB,
  VM_ACTION,
  VM_STATUS,
  VM_BOOTUP_TIMEOUT_SECS,
  VM_CREATE_AND_EDIT_AND_CLOUDINIT_TIMEOUT_SECS,
  VM_IMPORT_TIMEOUT_SECS,
  VM_STOP_TIMEOUT_SECS,
} from './utils/consts';
import * as dashboardView from '../views/dashboard.view';

describe('Test VM dashboard', () => {
  const cloudInit = `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}\nruncmd:\n- dnf install -y qemu-guest-agent\n- systemctl start qemu-guest-agent`;
  const testVM = getVMManifest('Container', testName, null, cloudInit);

  let vm: VirtualMachine;

  beforeAll(async () => {
    createResources([multusNAD, testVM]);
    vm = new VirtualMachine(testVM.metadata);
    await vm.navigateToOverview();
    try {
      await browser.wait(
        until.not(until.textToBePresentInElement(dashboardView.vmStatus, VM_STATUS.Off)),
        PAGE_LOAD_TIMEOUT_SECS,
      );
    } catch (ex) {
      // continue, this is optional condition
      // we want to wait for import to start but in some cases it may have already completed
    }
    await browser.wait(
      until.textToBePresentInElement(dashboardView.vmStatus, VM_STATUS.Off),
      VM_IMPORT_TIMEOUT_SECS,
    );
  }, VM_IMPORT_TIMEOUT_SECS);

  afterAll(() => {
    deleteResources([vm.asResource(), multusNAD]);
  });

  it('ID(CNV-3333) Inventory card', async () => {
    expect(dashboardView.vmInventoryNICs.getText()).toEqual('1 NIC');
    expect(dashboardView.vmInventoryNICs.$('a').getAttribute('href')).toMatch(
      new RegExp(`.*/k8s/ns/${vm.namespace}/${VirtualMachineModel.plural}/${vm.name}/nics`),
    );
    expect(dashboardView.vmInventoryDisks.getText()).toEqual('2 Disks');
    expect(dashboardView.vmInventoryDisks.$('a').getAttribute('href')).toMatch(
      new RegExp(`.*/k8s/ns/${vm.namespace}/${VirtualMachineModel.plural}/${vm.name}/disks`),
    );

    await vm.addDisk(hddDisk);
    await vm.addNIC(multusNetworkInterface);
    await vm.navigateToTab(TAB.Overview);

    expect(dashboardView.vmInventoryNICs.getText()).toEqual('2 NICs');
    expect(dashboardView.vmInventoryDisks.getText()).toEqual('3 Disks');

    await vm.removeDisk(hddDisk.name);
    await vm.removeNIC(multusNetworkInterface.name);
  });

  it(
    'ID(CNV-3330) Status card',
    async () => {
      await vm.waitForStatus(VM_STATUS.Off);
      await vm.navigateToOverview();
      expect(dashboardView.vmStatus.getText()).toEqual(VM_STATUS.Off);

      await vm.action(VM_ACTION.Start, true, VM_BOOTUP_TIMEOUT_SECS);
      await vm.navigateToTab(TAB.Overview);
      expect(dashboardView.vmStatus.getText()).toEqual(VM_STATUS.Running);
      await browser.wait(until.stalenessOf(dashboardView.vmStatusAlert));
    },
    VM_CREATE_AND_EDIT_AND_CLOUDINIT_TIMEOUT_SECS,
  );

  it('ID(CNV-3332) Details card', async () => {
    await browser.wait(waitForStringInElement(dashboardView.vmDetailsHostname, vm.name));
    expect(dashboardView.vmDetailsName.getText()).toEqual(vm.name);
    expect(dashboardView.vmDetailsNamespace.getText()).toEqual(vm.namespace);
    expect(dashboardView.vmDetailsNode.getText()).not.toEqual(NOT_AVAILABLE);
    expect(dashboardView.vmDetailsIPAddress.getText()).not.toEqual(NOT_AVAILABLE);
    expect(dashboardView.vmDetailsOS.getText()).toContain('Fedora');
    expect(dashboardView.vmDetailsTZ.getText()).toContain('UTC');
    expect(dashboardView.vmDetailsLoggedUser.getText()).toEqual('No users logged in');

    await click(dashboardView.vmDetailsViewAll);
    const currentUrl = await browser.getCurrentUrl();
    expect(currentUrl).toMatch(
      new RegExp(`.*/k8s/ns/${vm.namespace}/${VirtualMachineModel.plural}/${vm.name}/details`),
    );

    await vm.action(VM_ACTION.Stop, true, VM_STOP_TIMEOUT_SECS);
    await vm.navigateToTab(TAB.Overview);

    expect(dashboardView.vmDetailsNode.getText()).toEqual(NOT_AVAILABLE);
    expect(dashboardView.vmDetailsIPAddress.getText()).toEqual(NOT_AVAILABLE);
    expect(dashboardView.vmDetailsHostname.getText()).toEqual('VM not running');
    expect(dashboardView.vmDetailsOS.getText()).toEqual('Red Hat Enterprise Linux 7.0 or higher');
    expect(dashboardView.vmDetailsTZ.getText()).toEqual('VM not running');
    expect(dashboardView.vmDetailsLoggedUser.getText()).toEqual('VM not running');
  });

  it(
    'ID(CNV-3331) Utilization card',
    async () => {
      expect(dashboardView.vmUtilizationItemUsage(0).getText()).toContain('CPU');
      expect(dashboardView.vmUtilizationItemUsage(0).getText()).toContain(NOT_AVAILABLE);
      expect(dashboardView.vmUtilizationItemMetrics(0).getText()).toContain('No datapoints found');

      await vm.action(VM_ACTION.Start, true, VM_BOOTUP_TIMEOUT_SECS);
      await vm.navigateToTab(TAB.Overview);
      expect(dashboardView.vmStatus.getText()).toEqual(VM_STATUS.Running);
      // CPU metrics takes very long time to show up
      await browser.wait(
        until.not(
          until.textToBePresentInElement(dashboardView.vmUtilizationItemUsage(0), NOT_AVAILABLE),
        ),
        150 * 1000,
      );
      for (let i = 0; i < dashboardView.vmUtilizationItems.count(); i++) {
        expect(dashboardView.vmUtilizationItemUsage(i).getText()).not.toContain(NOT_AVAILABLE);
        expect(dashboardView.vmUtilizationItemMetrics(i).getText()).not.toContain(
          'No datapoints found',
        );
      }
    },
    JASMINE_EXTENDED_TIMEOUT_INTERVAL,
  );

  it('ID(CNV-3329) Events card', async () => {
    await browser.wait(until.presenceOf(dashboardView.vmEvents));
    await click(dashboardView.vmEventsViewAll);
    const currentUrl = await browser.getCurrentUrl();
    expect(currentUrl).toMatch(
      new RegExp(`.*/k8s/ns/${vm.namespace}/${VirtualMachineModel.plural}/${vm.name}/events`),
    );
  });
});
