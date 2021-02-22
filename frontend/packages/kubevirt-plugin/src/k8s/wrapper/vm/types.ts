import { CPURaw, V1Network, V1NetworkInterface } from '../../../types/vm';
import { V1Disk, V1Volume } from '../../../types/api';
import { K8sResourceKindMethods } from '../types/types';
import { BootableDeviceType } from '../../../types';

export interface VMILikeMethods extends K8sResourceKindMethods {
  getNetworkInterfaces: (defaultValue: V1NetworkInterface[]) => V1NetworkInterface[];

  getDisks: (defaultValue: V1Disk[]) => V1Disk[];

  getCDROMs: (defaultValue: V1Disk[]) => V1Disk[];

  getNetworks: (defaultValue: V1Network[]) => V1Network[];

  getVolumes: (defaultValue: V1Volume[]) => V1Volume[];

  getLabeledDevices: () => BootableDeviceType[];

  isDedicatedCPUPlacement: () => boolean;

  getOperatingSystem: () => string;

  getWorkloadProfile: () => string;

  getFlavor: () => string;

  getMemory: () => string;

  getCPU: () => CPURaw;
}
