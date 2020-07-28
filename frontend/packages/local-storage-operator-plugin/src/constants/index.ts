export const LSO_NAMESPACE = 'local-storage';

export const diskModeDropdownItems = Object.freeze({
  BLOCK: 'Block',
  FILESYSTEM: 'Filesystem',
});
export const diskTypeDropdownItems = Object.freeze({
  SSD: 'SSD / NVMe',
  HDD: 'HDD',
});

export const allNodesSelectorTxt =
  'Selecting all nodes will use the available disks that match the selected filters on all nodes.';

export const diskSizeUnitOptions = {
  TiB: 'TiB',
  GiB: 'GiB',
};
export const DISCOVERY_CR_NAME = 'auto-discover-devices';
export const LOCAL_STORAGE_NAMESPACE = 'local-storage';
export const HOSTNAME_LABEL_KEY = 'kubernetes.io/hostname';
export const LABEL_OPERATOR = 'In';
