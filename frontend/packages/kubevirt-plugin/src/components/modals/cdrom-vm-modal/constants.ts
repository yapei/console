import { V1CDRomTarget } from '../../../types/vm/disk/V1CDRomTarget';

export type CD = {
  name: string;
  bootOrder?: number;
  cdrom?: V1CDRomTarget;

  // UI
  changed?: boolean;
  ejected?: boolean;
  isInVM?: boolean;
  pvc?: string;
  container?: string;
  type?: string;
  bus?: string;
  url?: string;
  windowsTools?: string;
  storageClass?: string;
  size?: string | number;
  isURLValid?: boolean;
};

export type CDMap = {
  [name: string]: CD;
};

export const CD_SIZE = 'size';
export const CD_STORAGE_CLASS = 'storageClass';
export const WINTOOLS_CONTAINER_NAMES = {
  downstream: 'virtio-win-container',
  upstream: 'kubevirt/virtio-container-disk',
};

export const initialDisk = {
  container: 'path/to/container',
  url: 'http://path/to/iso',
  size: 10,
  isURLValid: true,
  changed: false,
};

export const sourceDict = {
  container: 'Container',
  url: 'URL',
  pvc: 'PVC',
  windowsTools: 'Windows Tools',
};

export const StorageType = {
  WINTOOLS: 'windowsTools',
  CONTAINER: 'container',
  URL: 'url',
  PVC: 'pvc',
};
