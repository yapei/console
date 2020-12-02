import { browser } from 'protractor';
import { deleteResource, waitForStringInElement } from '@console/shared/src/test-utils/utils';
import { getDetailActionDropdownOptions } from '@console/shared/src/test-utils/actions.view';
import { vmDetailNode } from '../views/virtualMachine.view';
import { rwxRootDisk } from './mocks/mocks';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  VM_MIGRATION_TIMEOUT_SECS,
  VM_IMPORT_TIMEOUT_SECS,
  PAGE_LOAD_TIMEOUT_SECS,
} from './utils/constants/common';
import { VM_ACTION, VM_STATUS } from './utils/constants/vm';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { VMBuilder } from './models/vmBuilder';
import { getBasicVMBuilder } from './mocks/vmBuilderPresets';

describe('Test VM Migration', () => {
  const MIGRATE_VM = 'Migrate Virtual Machine';
  const CANCEL_MIGRATION = 'Cancel Virtual Machine Migration';
  const VM_BOOT_AND_MIGRATE_TIMEOUT = VM_BOOTUP_TIMEOUT_SECS + VM_MIGRATION_TIMEOUT_SECS;

  const vm = new VMBuilder(getBasicVMBuilder())
    .setProvisionSource(ProvisionSource.URL)
    .setDisks([rwxRootDisk])
    .generateNameForPrefix('vm-for-migration-test')
    .build();

  beforeAll(async () => {
    await vm.create();
    await vm.waitForStatus(VM_STATUS.Off, VM_IMPORT_TIMEOUT_SECS);
  });

  afterAll(async () => {
    deleteResource(vm.asResource());
  });

  afterEach(async () => {
    await vm.detailViewAction(VM_ACTION.Stop);
  }, VM_BOOT_AND_MIGRATE_TIMEOUT);

  it(
    'ID(CNV-2140) Migrate VM action button is displayed appropriately',
    async () => {
      expect(await getDetailActionDropdownOptions()).not.toContain(MIGRATE_VM);
      expect(await getDetailActionDropdownOptions()).not.toContain(CANCEL_MIGRATION);

      await vm.detailViewAction(VM_ACTION.Start);
      expect(await getDetailActionDropdownOptions()).toContain(MIGRATE_VM);
      expect(await getDetailActionDropdownOptions()).not.toContain(CANCEL_MIGRATION);

      await vm.detailViewAction(VM_ACTION.Migrate, false);
      await vm.waitForStatus(VM_STATUS.Migrating, PAGE_LOAD_TIMEOUT_SECS);
      expect(await getDetailActionDropdownOptions()).not.toContain(MIGRATE_VM);
      expect(await getDetailActionDropdownOptions()).toContain(CANCEL_MIGRATION);
    },
    VM_BOOT_AND_MIGRATE_TIMEOUT,
  );

  it(
    'ID(CNV-2133) Migrate already migrated VM',
    async () => {
      await vm.detailViewAction(VM_ACTION.Start);
      let sourceNode = await vm.getNode();

      await vm.detailViewAction(VM_ACTION.Migrate);
      await vm.waitForMigrationComplete(sourceNode, VM_MIGRATION_TIMEOUT_SECS);
      sourceNode = await vm.getNode();

      await vm.detailViewAction(VM_ACTION.Migrate);
      await vm.waitForMigrationComplete(sourceNode, VM_MIGRATION_TIMEOUT_SECS);
      expect(vm.getStatus()).toEqual(VM_STATUS.Running);
    },
    VM_BOOT_AND_MIGRATE_TIMEOUT * 2,
  );

  it(
    'ID(CNV-2132) Cancel ongoing VM migration',
    async () => {
      await vm.detailViewAction(VM_ACTION.Start);
      const sourceNode = await vm.getNode();

      // Start migration without waiting for it to finish
      await vm.detailViewAction(VM_ACTION.Migrate, false);
      await vm.waitForStatus(VM_STATUS.Migrating, VM_MIGRATION_TIMEOUT_SECS);

      await vm.detailViewAction(VM_ACTION.Cancel, false);
      await vm.waitForStatus(VM_STATUS.Running, VM_BOOT_AND_MIGRATE_TIMEOUT);
      await browser.wait(
        waitForStringInElement(vmDetailNode(vm.namespace, vm.name), sourceNode),
        VM_MIGRATION_TIMEOUT_SECS,
      );
    },
    VM_BOOT_AND_MIGRATE_TIMEOUT,
  );
});
