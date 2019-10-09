import { createBasicLookup, getName } from '@console/shared/src';
import { InternalActionType, UpdateOptions } from '../../types';
import { iGetProvisionSource, iGetVmSettingValue } from '../../../selectors/immutable/vm-settings';
import {
  CloudInitField,
  VMSettingsField,
  VMWizardNetwork,
  VMWizardNetworkType,
  VMWizardProps,
  VMWizardStorage,
  VMWizardStorageType,
} from '../../../types';
import { iGetLoadedCommonData, iGetName } from '../../../selectors/immutable/selectors';
import { concatImmutableLists, immutableListToShallowJS } from '../../../../../utils/immutable';
import { iGetNetworks } from '../../../selectors/immutable/networks';
import { podNetwork } from '../../initial-state/networks-tab-initial-state';
import { vmWizardInternalActions } from '../../internal-actions';
import {
  CUSTOM_FLAVOR,
  DiskBus,
  DiskType,
  NetworkInterfaceModel,
  VolumeType,
} from '../../../../../constants/vm';
import {
  DEFAULT_CPU,
  getCPU,
  getDataVolumeTemplates,
  getDisks,
  getInterfaces,
  getMemory,
  getNetworks,
  getVolumes,
  hasAutoAttachPodInterface,
  parseCPU,
} from '../../../../../selectors/vm';
import { selectVM } from '../../../../../selectors/vm-template/selectors';
import {
  getTemplateFlavors,
  getTemplateOperatingSystems,
  getTemplateWorkloadProfiles,
} from '../../../../../selectors/vm-template/advanced';
import { V1Network } from '../../../../../types/vm';
import { getFlavors } from '../../../../../selectors/vm-template/combined-dependent';
import { getSimpleName } from '../../../../../selectors/utils';
import { getNextIDResolver } from '../../../../../utils/utils';
import { ProvisionSource } from '../../../../../constants/vm/provision-source';
import { DiskWrapper } from '../../../../../k8s/wrapper/vm/disk-wrapper';
import { V1Volume } from '../../../../../types/vm/disk/V1Volume';
import { MutableVolumeWrapper, VolumeWrapper } from '../../../../../k8s/wrapper/vm/volume-wrapper';
import { getProvisionSourceStorage } from '../../initial-state/storage-tab-initial-state';
import { CloudInitDataHelper } from '../../../../../k8s/wrapper/vm/cloud-init-data-helper';
import { getStorages } from '../../../selectors/selectors';

export const prefillVmTemplateUpdater = ({ id, dispatch, getState }: UpdateOptions) => {
  const state = getState();

  const userTemplateName = iGetVmSettingValue(state, id, VMSettingsField.USER_TEMPLATE);

  const iUserTemplates = iGetLoadedCommonData(state, id, VMWizardProps.userTemplates);

  const iUserTemplate =
    userTemplateName && iUserTemplates
      ? iUserTemplates.find((template) => iGetName(template) === userTemplateName)
      : null;

  let isCloudInitForm = null;
  const vmSettingsUpdate = {};

  // filter out oldTemplates
  let networksUpdate = immutableListToShallowJS<VMWizardNetwork>(iGetNetworks(state, id)).filter(
    (network) => network.type !== VMWizardNetworkType.TEMPLATE,
  );
  const getNextNetworkID = getNextIDResolver(networksUpdate);

  const storagesUpdate = getStorages(state, id).filter(
    (storage) =>
      ![
        VMWizardStorageType.PROVISION_SOURCE_DISK,
        VMWizardStorageType.TEMPLATE,
        VMWizardStorageType.PROVISION_SOURCE_TEMPLATE_DISK,
      ].includes(storage.type) &&
      VolumeWrapper.initialize(storage.volume).getType() !== VolumeType.CLOUD_INIT_NO_CLOUD,
  );
  const getNextStorageID = getNextIDResolver(storagesUpdate);

  if (!networksUpdate.find((row) => !!row.network.pod)) {
    networksUpdate.unshift({ ...podNetwork, id: getNextNetworkID() });
  }

  if (iUserTemplate) {
    const userTemplate = iUserTemplate.toJS();

    const vm = selectVM(userTemplate);

    // update flavor
    const [flavor] = getTemplateFlavors([userTemplate]);
    vmSettingsUpdate[VMSettingsField.FLAVOR] = { value: flavor };
    if (flavor === CUSTOM_FLAVOR) {
      vmSettingsUpdate[VMSettingsField.CPU] = { value: parseCPU(getCPU(vm), DEFAULT_CPU).cores }; // TODO also add sockets + threads
      const memory = getMemory(vm);
      vmSettingsUpdate[VMSettingsField.MEMORY] = { value: memory ? parseInt(memory, 10) : null };
    }

    // update os
    const [os] = getTemplateOperatingSystems([userTemplate]);
    vmSettingsUpdate[VMSettingsField.OPERATING_SYSTEM] = { value: os && os.id };

    // update workload profile
    const [workload] = getTemplateWorkloadProfiles([userTemplate]);
    vmSettingsUpdate[VMSettingsField.WORKLOAD_PROFILE] = { value: workload };

    // update provision source
    const provisionSourceDetails = ProvisionSource.getProvisionSourceDetails(userTemplate);
    vmSettingsUpdate[VMSettingsField.PROVISION_SOURCE_TYPE] = {
      value: provisionSourceDetails.type ? provisionSourceDetails.type.getValue() : null,
    };

    const networkLookup = createBasicLookup<V1Network>(getNetworks(vm), getSimpleName);
    // prefill networks
    const templateNetworks: VMWizardNetwork[] = getInterfaces(vm).map((intface) => ({
      id: getNextNetworkID(),
      type: VMWizardNetworkType.TEMPLATE,
      network: networkLookup[getSimpleName(intface)],
      networkInterface: {
        ...intface,
        model: intface.model || NetworkInterfaceModel.VIRTIO.getValue(),
      },
    }));

    // remove pod networks if there is already one in template or autoAttachPodInterface is set to false
    if (
      templateNetworks.some((network) => !!network.network.pod) ||
      !hasAutoAttachPodInterface(vm, true)
    ) {
      networksUpdate = networksUpdate.filter((network) => !network.network.pod);
    }

    networksUpdate.push(...templateNetworks);

    const volumeLookup = createBasicLookup<V1Volume>(getVolumes(vm), getSimpleName);
    const datavolumeTemplatesLookup = createBasicLookup(getDataVolumeTemplates(vm), getName);
    // // prefill storage
    const templateStorages: VMWizardStorage[] = getDisks(vm).map((disk) => {
      const diskWrapper = DiskWrapper.initialize(disk);
      let volume = volumeLookup[diskWrapper.getName()];
      const volumeWrapper = VolumeWrapper.initialize(volume);

      if (volumeWrapper.getType() === VolumeType.CLOUD_INIT_NO_CLOUD) {
        const helper = new CloudInitDataHelper(volumeWrapper.getCloudInitNoCloud());
        if (helper.includesOnlyFormValues()) {
          isCloudInitForm = true;
          helper.makeFormCompliant();
          volume = new MutableVolumeWrapper(volume, { copy: true })
            .replaceTypeData(helper.asCloudInitNoCloudSource())
            .asMutableResource();
          // do not overwrite with more cloud-init disks
        } else if (isCloudInitForm == null) {
          isCloudInitForm = false;
        }
      }

      return {
        id: getNextStorageID(),
        type: diskWrapper.isFirstBootableDevice()
          ? VMWizardStorageType.PROVISION_SOURCE_TEMPLATE_DISK
          : VMWizardStorageType.TEMPLATE,
        volume,
        dataVolume: datavolumeTemplatesLookup[volumeWrapper.getDataVolumeName()],
        disk:
          diskWrapper.getType() === DiskType.DISK && !diskWrapper.getDiskBus()
            ? DiskWrapper.mergeWrappers(
                diskWrapper,
                DiskWrapper.initializeFromSimpleData({ type: DiskType.DISK, bus: DiskBus.VIRTIO }),
              ).asResource()
            : disk,
      };
    });
    storagesUpdate.unshift(...templateStorages);
  } else {
    const iCommonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);

    const flavors = getFlavors(
      immutableListToShallowJS(concatImmutableLists(iCommonTemplates, iUserTemplates)),
      {
        workload: iGetVmSettingValue(state, id, VMSettingsField.WORKLOAD_PROFILE),
        os: iGetVmSettingValue(state, id, VMSettingsField.OPERATING_SYSTEM),
        userTemplate: null,
      },
    );
    if (flavors.length === 1) {
      vmSettingsUpdate[VMSettingsField.FLAVOR] = { value: flavors[0] };
    }

    const newSourceStorage = getProvisionSourceStorage(iGetProvisionSource(state, id));
    if (newSourceStorage) {
      storagesUpdate.unshift({ ...newSourceStorage, id: getNextStorageID() });
    }
  }

  dispatch(vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, vmSettingsUpdate));
  dispatch(vmWizardInternalActions[InternalActionType.SetNetworks](id, networksUpdate));
  dispatch(vmWizardInternalActions[InternalActionType.SetStorages](id, storagesUpdate));
  if (isCloudInitForm != null) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetCloudInitFieldValue](
        id,
        CloudInitField.IS_FORM,
        isCloudInitForm,
      ),
    );
  }
};
