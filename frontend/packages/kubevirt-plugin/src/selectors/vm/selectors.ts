import * as _ from 'lodash';
import { getName } from '@console/shared/src/selectors/common';
import { createBasicLookup } from '@console/shared/src/utils/utils';
import {
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../constants/vm';
import { CPURaw, V1Network, V1NetworkInterface, VMIKind, VMKind } from '../../types';
import { findKeySuffixValue, getSimpleName, getValueByPrefix } from '../utils';
import { getAnnotations, getLabels } from '../selectors';
import { NetworkWrapper } from '../../k8s/wrapper/vm/network-wrapper';
import { getDataVolumeStorageClassName, getDataVolumeStorageSize } from '../dv/selectors';
import { V1Disk } from '../../types/vm/disk/V1Disk';
import {
  getVolumeCloudInitNoCloud,
  getVolumeContainerImage,
  getVolumePersistentVolumeClaimName,
} from './volume';
import { getVMIDisks } from '../vmi/basic';
import { VirtualMachineModel } from '../../models';
import { V1Volume } from '../../types/vm/disk/V1Volume';
import { VMGenericLikeEntityKind, VMILikeEntityKind } from '../../types/vmLike';
import { RunStrategy, StateChangeRequest } from '../../constants/vm/vm';

export const getMemory = (vm: VMKind) =>
  _.get(vm, 'spec.template.spec.domain.resources.requests.memory');
export const getCPU = (vm: VMKind): CPURaw => _.get(vm, 'spec.template.spec.domain.cpu');
export const getResourcesRequestsCPUCount = (vm: VMKind): string =>
  vm?.spec?.template?.spec?.domain?.resources?.requests?.cpu;
export const getResourcesLimitsCPUCount = (vm: VMKind): string =>
  vm?.spec?.template?.spec?.domain?.resources?.limits?.cpu;
export const isDedicatedCPUPlacement = (vm: VMKind) =>
  _.get(vm, 'spec.template.spec.domain.cpu.dedicatedCpuPlacement');
export const getDisks = (vm: VMKind, defaultValue: V1Disk[] = []): V1Disk[] =>
  _.get(vm, 'spec.template.spec.domain.devices.disks') == null
    ? defaultValue
    : vm.spec.template.spec.domain.devices.disks;

export const getInterfaces = (
  vm: VMKind,
  defaultValue: V1NetworkInterface[] = [],
): V1NetworkInterface[] =>
  _.get(vm, 'spec.template.spec.domain.devices.interfaces') == null
    ? defaultValue
    : vm.spec.template.spec.domain.devices.interfaces;

export const getNetworks = (vm: VMKind, defaultValue: V1Network[] = []): V1Network[] =>
  _.get(vm, 'spec.template.spec.networks') == null ? defaultValue : vm.spec.template.spec.networks;
export const getVolumes = (vm: VMKind, defaultValue: V1Volume[] = []): V1Volume[] =>
  _.get(vm, 'spec.template.spec.volumes') == null ? defaultValue : vm.spec.template.spec.volumes;
export const getDataVolumeTemplates = (vm: VMKind, defaultValue = []) =>
  _.get(vm, 'spec.dataVolumeTemplates') == null ? defaultValue : vm.spec.dataVolumeTemplates;

export const getConfigMapVolumes = (vm: VMKind, defaultValue: V1Volume[] = []): V1Volume[] =>
  getVolumes(vm, defaultValue).filter((vol) => Object.keys(vol).includes('configMap'));

export const getSecretVolumes = (vm: VMKind, defaultValue: V1Volume[] = []): V1Volume[] =>
  getVolumes(vm, defaultValue).filter((vol) => Object.keys(vol).includes('secret'));

export const getServiceAccountVolumes = (vm: VMKind, defaultValue: V1Volume[] = []): V1Volume[] =>
  getVolumes(vm, defaultValue).filter((vol) => Object.keys(vol).includes('serviceAccount'));

export const getEnvDiskVolumes = (vm: VMKind, defaultValue: V1Volume[] = []): V1Volume[] => [
  ...getConfigMapVolumes(vm, defaultValue),
  ...getSecretVolumes(vm, defaultValue),
  ...getServiceAccountVolumes(vm, defaultValue),
];

export const getConfigMapDisks = (vm: VMKind, defaultValue: V1Disk[] = []): V1Disk[] =>
  getDisks(vm, defaultValue).filter(
    (disk) => !!getConfigMapVolumes(vm).find((vol) => vol.name === disk.name),
  );

export const getSecretDisks = (vm: VMKind, defaultValue: V1Disk[] = []): V1Disk[] =>
  getDisks(vm, defaultValue).filter(
    (disk) => !!getSecretVolumes(vm).find((vol) => vol.name === disk.name),
  );

export const getServiceAccountDisks = (vm: VMKind, defaultValue: V1Disk[] = []): V1Disk[] =>
  getDisks(vm, defaultValue).filter(
    (disk) => !!getServiceAccountVolumes(vm).find((vol) => vol.name === disk.name),
  );

export const getEnvDisks = (vm: VMKind, defaultValue: V1Disk[] = []): V1Disk[] => [
  ...getConfigMapDisks(vm, defaultValue),
  ...getSecretDisks(vm, defaultValue),
  ...getServiceAccountDisks(vm, defaultValue),
];

export const getBootableDisks = (vm: VMKind, defaultValue: V1Disk[] = []): V1Disk[] =>
  getDisks(vm, defaultValue).filter(
    (disk) => !getEnvDisks(vm).find((envDisk) => envDisk.name === disk.name),
  );

export const getNonBootableDisks = (vm: VMKind, defaultValue: V1Disk[] = []): V1Disk[] =>
  getDisks(vm, defaultValue).filter((disk) =>
    getEnvDisks(vm).find((envDisk) => envDisk.name === disk.name),
  );

export const getOperatingSystem = (vmLike: VMGenericLikeEntityKind): string =>
  findKeySuffixValue(getLabels(vmLike), TEMPLATE_OS_LABEL);
export const getOperatingSystemName = (vmLike: VMGenericLikeEntityKind) =>
  getValueByPrefix(
    getAnnotations(vmLike),
    `${TEMPLATE_OS_NAME_ANNOTATION}/${getOperatingSystem(vmLike)}`,
  );

export const getWorkloadProfile = (vm: VMGenericLikeEntityKind) =>
  findKeySuffixValue(getLabels(vm), TEMPLATE_WORKLOAD_LABEL);
export const getFlavor = (vmLike: VMGenericLikeEntityKind) =>
  findKeySuffixValue(getLabels(vmLike), TEMPLATE_FLAVOR_LABEL);

export const isVMReady = (vm: VMKind) => !!vm?.status?.ready;

export const isVMCreated = (vm: VMKind) => !!vm?.status?.created;

export const isVMExpectedRunning = (vm: VMKind) => {
  if (!vm?.spec) {
    return false;
  }
  const { running, runStrategy } = vm.spec;

  if (running != null) {
    return running;
  }

  if (runStrategy != null) {
    let changeRequests;
    switch (runStrategy as RunStrategy) {
      case RunStrategy.Halted:
        return false;
      case RunStrategy.Always:
      case RunStrategy.RerunOnFailure:
        return true;
      case RunStrategy.Manual:
      default:
        changeRequests = new Set(
          (vm.status?.stateChangeRequests || []).map((chRequest) => chRequest?.action),
        );

        if (changeRequests.has(StateChangeRequest.Stop)) {
          return false;
        }
        if (changeRequests.has(StateChangeRequest.Start)) {
          return true;
        }

        return isVMCreated(vm); // if there is no change request we can assume created is representing running (current and expected)
    }
  }
  return false;
};

export const isVMRunningOrExpectedRunning = (vm: VMKind) => {
  return isVMCreated(vm) || isVMExpectedRunning(vm);
};

export const getUsedNetworks = (vm: VMKind): NetworkWrapper[] => {
  const interfaces = getInterfaces(vm);
  const networkLookup = createBasicLookup<any>(getNetworks(vm), getSimpleName);

  return interfaces
    .map((i) => new NetworkWrapper(networkLookup[i.name]))
    .filter((i) => i.getType());
};

export const getCloudInitVolume = (vm: VMKind) => {
  const cloudInitVolume = getVolumes(vm).find(getVolumeCloudInitNoCloud);

  if (cloudInitVolume) {
    // make sure volume is used by disk
    const disks = getDisks(vm);
    if (disks.find((disk) => disk.name === cloudInitVolume.name)) {
      return cloudInitVolume;
    }
  }
  return null;
};

export const hasAutoAttachPodInterface = (vm: VMKind, defaultValue = false) =>
  _.get(vm, 'spec.template.spec.domain.devices.autoattachPodInterface', defaultValue);

export const getCDRoms = (vm: VMILikeEntityKind) =>
  vm.kind === VirtualMachineModel.kind
    ? getDisks(vm as VMKind).filter((device) => !!device.cdrom)
    : getVMIDisks(vm as VMIKind).filter((device) => !!device.cdrom);

export const getContainerImageByDisk = (vm: VMKind, name: string) =>
  getVolumeContainerImage(getVolumes(vm).find((vol) => name === vol.name));

export const getPVCSourceByDisk = (vm: VMKind, diskName: string) =>
  getVolumePersistentVolumeClaimName(getVolumes(vm).find((vol) => vol.name === diskName));

export const getURLSourceByDisk = (vm: VMKind, name: string) => {
  const dvTemplate = getDataVolumeTemplates(vm).find((vol) => getName(vol).includes(name));
  return (
    dvTemplate &&
    dvTemplate.spec &&
    dvTemplate.spec.source &&
    dvTemplate.spec.source.http &&
    dvTemplate.spec.source.http.url
  );
};

export const getStorageSizeByDisk = (vm: VMKind, diskName: string) =>
  getDataVolumeStorageSize(
    getDataVolumeTemplates(vm).find((vol) => getName(vol).includes(diskName)),
  );

export const getStorageClassNameByDisk = (vm: VMKind, diskName: string) =>
  getDataVolumeStorageClassName(
    getDataVolumeTemplates(vm).find((vol) => getName(vol).includes(diskName)),
  );

export const getNodeSelector = (vm: VMKind) => vm?.spec?.template?.spec?.nodeSelector;

export const getTolerations = (vm: VMKind) => vm?.spec?.template?.spec?.tolerations;

export const getAffinity = (vm: VMKind) => vm?.spec?.template?.spec?.affinity;
