import { VM_ACTION, VMI_ACTION, VM_STATUS, VM_ACTION_TIMEOUT } from '../const/index';
import { VirtualMachineData } from '../types/vm';
import { detailViewAction, listViewAction } from './actions';
import { detailsTab } from './selector';
import { virtualization } from './virtualization';
import { wizard } from './wizard';

export const waitForStatus = (status: string, vmData?: VirtualMachineData, timeout?: number) => {
  cy.get(detailsTab.vmStatus, { timeout }).should('contain', status);
  if (status === VM_STATUS.Running) {
    const { name, namespace } = vmData;
    cy.waitForLoginPrompt(name, namespace);
  }
};

export const action = (selector: string) => {
  cy.get('body').then(($body) => {
    if ($body.text().includes('Filter')) {
      listViewAction(selector);
    }
    if ($body.text().includes('Actions')) {
      cy.byLegacyTestID('horizontal-link-Details').click();
      detailViewAction(selector);
    }
  });
};

export const vm = {
  create: (vmData: VirtualMachineData) => {
    const {
      cdrom,
      flavor,
      name,
      namespace,
      provisionSource,
      pvcSize,
      sshEnable,
      startOnCreation,
      template,
    } = vmData;
    virtualization.vms.visit();
    wizard.vm.open();
    wizard.vm.processSelectTemplate(template);
    wizard.vm.processBootSource(provisionSource, cdrom, pvcSize);
    wizard.vm.processReview(namespace, name, flavor, sshEnable, startOnCreation);
  },
  start: (vmData: VirtualMachineData) => {
    waitForStatus(VM_STATUS.Off);
    action(VM_ACTION.Start);
    waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
  },
  restart: (vmData: VirtualMachineData) => {
    waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
    action(VM_ACTION.Restart);
    waitForStatus(VM_STATUS.Starting, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
    waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
  },
  stop: (vmData: VirtualMachineData) => {
    waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
    action(VM_ACTION.Stop);
    waitForStatus(VM_STATUS.Off);
  },
  delete: () => {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Instance')) {
        action(VMI_ACTION.Delete);
      } else {
        action(VM_ACTION.Delete);
      }
    });
    cy.byTestID('create-vm-empty').should('be.visible');
  },
  unpause: (vmData: VirtualMachineData) => {
    waitForStatus(VM_STATUS.Paused);
    action(VM_ACTION.Unpause);
    waitForStatus(VM_STATUS.Running, vmData);
  },
};
