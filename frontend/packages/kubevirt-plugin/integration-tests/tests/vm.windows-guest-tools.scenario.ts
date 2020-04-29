import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { withResource } from '@console/shared/src/test-utils/utils';
import { isWinToolsImage, getVolumeContainerImage, getVolumes } from '../../src/selectors/vm';
import { VirtualMachine } from './models/virtualMachine';
import { VM_BOOTUP_TIMEOUT_SECS } from './utils/consts';
import { getProvisionConfigs, vmConfig } from './vm.wizard.configs';
import { ProvisionConfigName } from './utils/constants/wizard';
import { windowsVMConfig } from './utils/mocks';
import { windowsGuestToolsCDElement } from '../views/dialogs/editCDView';

describe('Kubevirt Windows Guest tools', () => {
  const leakedResources = new Set<string>();
  const provisionConfigs = getProvisionConfigs();

  const configName = ProvisionConfigName.CONTAINER;
  const provisionConfig = provisionConfigs.get(configName);

  provisionConfig.networkResources = [];
  provisionConfig.storageResources = [];

  it(
    'ID(CNV-3593) Checks that Guest Tools CD is mounted after Windows VM creation',
    async () => {
      const windowsConfig = vmConfig(
        configName.toLowerCase(),
        testName,
        provisionConfig,
        windowsVMConfig,
        false, // dont startOnCreation
      );
      const vm = new VirtualMachine(windowsConfig);

      const isWindowsCDMounted = () =>
        !!getVolumes(vm.getResource()).some((volume) =>
          isWinToolsImage(getVolumeContainerImage(volume)),
        );

      await withResource(leakedResources, vm.asResource(), async () => {
        await vm.create(windowsConfig);
        await browser.wait(until.presenceOf(windowsGuestToolsCDElement));
        expect(isWindowsCDMounted()).toBeTruthy();
      });
    },
    VM_BOOTUP_TIMEOUT_SECS,
  );
});
