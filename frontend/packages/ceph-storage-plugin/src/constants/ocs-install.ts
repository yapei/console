import { Taint } from '@console/internal/module/k8s';
import { NetworkType } from '../components/ocs-install/types';

export const MINIMUM_NODES = 3;
export const ocsTaint: Taint = {
  key: 'node.ocs.openshift.io/storage',
  value: 'true',
  effect: 'NoSchedule',
};
Object.freeze(ocsTaint);

export const storageClassTooltip =
  'The Storage Class will be used to request storage from the underlying infrastructure to create the backing persistent volumes that will be used to provide the OpenShift Container Storage (OCS) service.';
export const requestedCapacityTooltip =
  'The backing storage requested will be higher as it will factor in the requested capacity, replica factor, and fault tolerant costs associated with the requested capacity.';
export const encryptionTooltip =
  'The storage cluster encryption level can be set to include all components under the cluster (including storage class and PVs) or to include only storage class encryption. PV encryption can use an auth token that will be used with the KMS configuration to allow multi-tenancy.';

export enum defaultRequestSize {
  BAREMETAL = '1',
  NON_BAREMETAL = '2Ti',
}

export enum CreateStepsSC {
  DISCOVER = 'DISCOVER',
  STORAGECLASS = 'STORAGECLASS',
  STORAGEANDNODES = 'STORAGEANDNODES',
  CONFIGURE = 'CONFIGURE',
  REVIEWANDCREATE = 'REVIEWANDCREATE',
}

export const diskModeDropdownItems = Object.freeze({
  BLOCK: 'Block',
});

export const allNodesSelectorTxt =
  'Selecting all nodes will use the available disks that match the selected filters on all nodes selected on previous step.';

export enum IP_FAMILY {
  IPV4 = 'IPV4',
  IPV6 = 'IPV6',
}

export const NetworkTypeLabels = {
  [NetworkType.DEFAULT]: 'Default (SDN)',
  [NetworkType.MULTUS]: 'Custom (Multus)',
};
