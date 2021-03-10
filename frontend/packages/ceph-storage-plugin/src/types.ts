import { IRow } from '@patternfly/react-table';
import {
  K8sResourceKind,
  K8sResourceCommon,
  NodeKind,
  SecretKind,
} from '@console/internal/module/k8s';
import { TableProps } from '@console/internal/components/factory';
import { PROVIDERS_NOOBAA_MAP, NOOBAA_TYPE_MAP } from './constants/providers';

export type SpecProvider = typeof PROVIDERS_NOOBAA_MAP[keyof typeof PROVIDERS_NOOBAA_MAP];
export type SpecType = typeof NOOBAA_TYPE_MAP[keyof typeof NOOBAA_TYPE_MAP];

export enum PlacementPolicy {
  Spread = 'Spread',
  Mirror = 'Mirror',
}

export type K8sListResponse<T> = {
  items: T[];
};

export type BackingStoreKind = K8sResourceCommon & {
  spec: {
    [key in SpecProvider]: {
      [key: string]: string;
    };
  } & {
    type: SpecType;
  };
};

export type BucketClassKind = K8sResourceCommon & {
  spec: {
    placementPolicy: {
      tiers: {
        backingStores: string[];
        placement: PlacementPolicy;
      }[];
    };
  };
};

type NodeTableRow = {
  cells: IRow['cells'];
  props: {
    id: string;
  };
  selected?: boolean;
};

export type GetRows = (
  {
    componentProps,
    customData,
  }: {
    componentProps: { data: NodeKind[] };
    customData?: {
      onRowSelected?: (nodes: NodeKind[]) => void;
      nodes?: NodeKind[];
      filteredNodes?: string[];
      setNodes?: (nodes: NodeKind[]) => void;
    };
  },
  visibleRows?: Set<string>,
  setVisibleRows?: React.Dispatch<React.SetStateAction<Set<string>>>,
  selectedNodes?: Set<string>,
  setSelectedNodes?: (nodes: NodeKind[]) => void,
) => NodeTableRow[];

export type NodeTableProps = TableProps & {
  data: NodeKind[];
  customData?: {
    onRowSelected?: (nodes: NodeKind[]) => void;
    nodes?: NodeKind[];
    filteredNodes?: string[];
    setNodes?: (nodes: NodeKind[]) => void;
  };
  filters: { name: string; label: { all: string[] } };
};

export type EncryptionType = {
  clusterWide: boolean;
  storageClass: boolean;
  advanced: boolean;
  hasHandled: boolean;
};

export type KMSConfig = {
  name: {
    value: string;
    valid: boolean;
  };
  token?: {
    value: string;
    valid: boolean;
  };
  address: {
    value: string;
    valid: boolean;
  };
  port: {
    value: string;
    valid: boolean;
  };
  backend: string;
  caCert: SecretKind;
  caCertFile: string;
  tls: string;
  clientCert: SecretKind;
  clientCertFile: string;
  clientKey: SecretKind;
  clientKeyFile: string;
  providerNamespace: string;
  hasHandled: boolean;
};

export enum NetworkType {
  DEFAULT = 'DEFAULT',
  MULTUS = 'MULTUS',
}
export type KMSConfigMap = {
  KMS_PROVIDER: string;
  KMS_SERVICE_NAME: string;
  VAULT_ADDR: string; // address + port
  VAULT_BACKEND_PATH: string;
  VAULT_CACERT: string;
  VAULT_CACERT_FILE?: string;
  VAULT_TLS_SERVER_NAME: string;
  VAULT_CLIENT_CERT: string;
  VAULT_CLIENT_CERT_FILE?: string;
  VAULT_CLIENT_KEY: string;
  VAULT_CLIENT_KEY_FILE?: string;
  VAULT_NAMESPACE: string;
  VAULT_TOKEN_NAME?: string;
};

export type WatchCephResource = {
  ceph: K8sResourceKind[];
};

export type CephClusterKind = K8sResourceCommon & {
  status: {
    storage: {
      deviceClasses: CephDeviceClass[];
    };
    phase?: string;
  };
};

type CephDeviceClass = {
  name: string;
};

export type StoragePoolKind = K8sResourceCommon & {
  spec: {
    compressionMode?: string;
    deviceClass?: string;
    replicated: {
      size: number;
    };
    parameters?: {
      compression_mode: string;
    };
  };
  status?: {
    phase?: string;
  };
};

export type StorageClusterKind = K8sResourceCommon & {
  spec: {
    network: {
      provider: string;
      selectors: {
        public: string;
        private?: string;
      };
    };
    manageNodes: boolean;
    storageDeviceSets: DeviceSet[];
    resources: StorageClusterResource;
    encryption?: {
      enable: boolean;
      kms?: {
        enable: boolean;
      };
    };
    arbiter: {
      enable: boolean;
    };
    nodeTopologies: {
      arbiterLocation: string;
    };
    flexibleScaling?: boolean;
    monDataDirHostPath?: string;
  };
  status?: {
    phase: string;
  };
};

export type DeviceSet = {
  name: string;
  count: number;
  replica: number;
  resources: ResourceConstraints;
  placement?: any;
  portable: boolean;
  dataPVCTemplate: {
    spec: {
      storageClassName: string;
      accessModes: string[];
      volumeMode: string;
      resources: {
        requests: {
          storage: string;
        };
      };
    };
  };
};

export type StorageClusterResource = {
  mds?: ResourceConstraints;
  rgw?: ResourceConstraints;
};

export type ResourceConstraints = {
  limits?: {
    cpu: string;
    memory: string;
  };
  requests?: {
    cpu: string;
    memory: string;
  };
};
