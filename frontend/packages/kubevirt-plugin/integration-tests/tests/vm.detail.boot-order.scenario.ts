import { browser } from 'protractor';
import * as _ from 'lodash';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { click, createResource, deleteResource } from '@console/shared/src/test-utils/utils';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import * as bootOrderView from '../views/editBootOrderView';
import { getBootableDevicesInOrder, getNonBootableDevices } from '../../src/selectors/vm/devices';
import { VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/consts';
import { VirtualMachine } from './models/virtualMachine';
import { getVMManifest, hddDisk } from './utils/mocks';
import { getRandStr, getResourceObject, getSelectOptions, selectOptionByText } from './utils/utils';
import { dragAndDrop } from './utils/scripts/drag-drop';

describe('KubeVirt VM detail - Boot Order Dialog', () => {
  const testVM = getVMManifest('Container', testName, `bootordervm-${getRandStr(5)}`);
  const vm = new VirtualMachine(testVM.metadata);

  beforeAll(async () => {
    createResource(testVM);
    await vm.addDisk(hddDisk);
  });

  afterAll(() => {
    deleteResource(testVM);
  });

  beforeEach(async () => {
    await vm.navigateToDetail();
    await vm.modalEditBootOrder();
  });

  it(
    'Displays boot devices',
    async () => {
      const bootableDevices = getBootableDevicesInOrder(
        getResourceObject(vm.name, vm.namespace, vm.kind),
      ).map((device) => `${_.get(device, 'value.name')}`);
      const displayedbootableDevices = (await vm.getBootDevices()).map(
        (device) => device.split(' ')[0],
      );
      expect(displayedbootableDevices).toEqual(bootableDevices);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'Deletes bootable device',
    async () => {
      const FIRST_DEVICE_POSITION = 1;
      const initialBootableDevices = getBootableDevicesInOrder(
        getResourceObject(vm.name, vm.namespace, vm.kind),
      );
      await click(bootOrderView.deleteDeviceButton(FIRST_DEVICE_POSITION));
      await click(bootOrderView.saveButton);
      // Wait for the boot Order to update
      await bootOrderView.waitForBootDevicesCount(
        vm.name,
        vm.namespace,
        initialBootableDevices.length - 1,
      );
      const orderedBootableDevices = getBootableDevicesInOrder(
        getResourceObject(vm.name, vm.namespace, vm.kind),
      ).map((device) => `${_.get(device, 'value.name')}`);
      const displayedbootableDevices = (await vm.getBootDevices()).map(
        (device) => device.split(' ')[0],
      );
      expect(orderedBootableDevices).toEqual(displayedbootableDevices);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'Adds bootable device',
    async () => {
      const initialVMObject = getResourceObject(vm.name, vm.namespace, vm.kind);
      const initialBootableDevices = getBootableDevicesInOrder(initialVMObject);
      const nonBootableDevices = getNonBootableDevices(initialVMObject).map(
        (device) => `${_.get(device, 'value.name')}`,
      );

      await click(bootOrderView.addDeviceButton);
      const nonBootableDevicesSelectOptions = (
        await getSelectOptions(bootOrderView.addDeviceSelect)
      ).map((device) => device.split(' ')[0]);
      // Expect that only non-bootable devices are listed in the 'Add device' dropdown
      expect(nonBootableDevices.sort()).toEqual(nonBootableDevicesSelectOptions.sort());
      // Select the last item from the selector
      await selectOptionByText(
        bootOrderView.addDeviceSelect,
        nonBootableDevicesSelectOptions[nonBootableDevicesSelectOptions.length - 1],
      );
      await click(bootOrderView.saveButton);
      // Wait for the boot Order to update
      await bootOrderView.waitForBootDevicesCount(
        vm.name,
        vm.namespace,
        initialBootableDevices.length + 1,
      );
      const orderedBootableDevices = getBootableDevicesInOrder(
        getResourceObject(vm.name, vm.namespace, vm.kind),
      ).map((device) => `${_.get(device, 'value.name')}`);
      const displayedbootableDevices = (await vm.getBootDevices()).map(
        (device) => device.split(' ')[0],
      );
      expect(orderedBootableDevices).toEqual(displayedbootableDevices);
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );

  it(
    'Drags and drops to change boot order',
    async () => {
      const initialBootableDevices = getBootableDevicesInOrder(
        getResourceObject(vm.name, vm.namespace, vm.kind),
      ).map((device) => `${_.get(device, 'value.name')}`);

      // Find devices at indexes 0 and 1 representing first and second device
      const source = bootOrderView.draggablePointer(0);
      const destination = bootOrderView.draggablePointer(1);

      await browser.executeScript(dragAndDrop, source, destination);
      // Wait for the DOM structure to update
      await browser.sleep(300);
      // Click and wait for the changes to be applied
      await click(bootOrderView.saveButton);
      await isLoaded();
      // Renavigate to force the page to update
      await vm.navigateToDetail();
      // Get current boot order from overview page
      const displayedBootableDevices = (await vm.getBootDevices()).map(
        (device) => device.split(' ')[0],
      );
      expect(displayedBootableDevices).toEqual([...initialBootableDevices].reverse());
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
