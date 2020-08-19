import {
  K8sKind,
  K8sResourceKind,
  PersistentVolumeClaimKind,
  PodKind,
  TemplateKind,
} from '@console/internal/module/k8s';
import { VMIKind, VMKind } from '../../types/vm';
import { VMGenericLikeEntityKind, VMILikeEntityKind } from '../../types/vmLike';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';

type PendingChange = {
  isPendingChange: boolean;
  execAction: () => void;
  vmTab?: VMTabEnum;
  resourceNames?: string[];
};

export type PendingChanges = {
  [key: string]: PendingChange;
};

export type PendingChangesByTab = {
  [vmTab in VMTabEnum]?: {
    resources?: string[];
    pendingChangesKey?: string;
  };
};

export type VMTabProps = {
  obj?: VMILikeEntityKind;
  vm?: VMKind;
  vmis?: VMIKind[];
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  templates?: TemplateKind[];
  pvcs?: PersistentVolumeClaimKind[];
  dataVolumes?: V1alpha1DataVolume[];
  vmImports?: VMImportKind[];
  customData: {
    kindObj: K8sKind;
  };
  showOpenInNewWindow?: boolean;
};

export type VMLikeEntityTabProps = {
  obj?: VMGenericLikeEntityKind;
};

export enum IsPendingChange {
  flavor = 'Flavor',
  bootOrder = 'Boot Order',
  env = 'Environment',
  nics = 'Network Interfaces',
  disks = 'Disks',
}

export enum VMTabURLEnum {
  details = 'details',
  env = 'environment',
  nics = 'nics',
  disks = 'disks',
}

export enum VMTabEnum {
  details = 'Details',
  env = 'Environment',
  nics = 'Network Interfaces',
  disks = 'Disks',
}
