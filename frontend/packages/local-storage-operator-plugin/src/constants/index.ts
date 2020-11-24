import { DiskMechanicalProperties } from '../components/local-volume-set/types';

export const diskModeDropdownItems = Object.freeze({
  BLOCK: 'Block',
  FILESYSTEM: 'Filesystem',
});

export const DISK_TYPES: {
  [key: string]: {
    property?: keyof typeof DiskMechanicalProperties;
    title: string;
  };
} = {
  SSD: {
    property: 'NonRotational',
    title: 'SSD / NVMe',
  },
  HDD: {
    property: 'Rotational',
    title: 'HDD',
  },
  All: {
    title: 'All',
  },
};

export const diskTypeDropdownItems = Object.freeze({
  All: 'All',
  SSD: 'SSD / NVMe',
  HDD: 'HDD',
});

export const allNodesSelectorTxt =
  'Selecting all nodes will use the available disks that match the selected filters on all nodes.';

export const AUTO_DISCOVER_ERR_MSG = 'Failed to update the Auto Detect Volume!';

export const diskSizeUnitOptions = {
  Ti: 'TiB',
  Gi: 'GiB',
};

export const DISCOVERY_CR_NAME = 'auto-discover-devices';
export const LOCAL_STORAGE_NAMESPACE = 'openshift-local-storage';
export const HOSTNAME_LABEL_KEY = 'kubernetes.io/hostname';
export const LABEL_OPERATOR = 'In';
