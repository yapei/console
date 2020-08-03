import * as _ from 'lodash';
import {
  NodeKind,
  Taint,
  StorageClassResourceKind,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import {
  humanizeBinaryBytes,
  convertToBaseValue,
  humanizeCpuCores,
} from '@console/internal/components/utils';
import { HOSTNAME_LABEL_KEY } from '@console/local-storage-operator-plugin/src/constants';
import { getNodeCPUCapacity, getNodeAllocatableMemory } from '@console/shared';
import { ocsTaint, NO_PROVISIONER, AVAILABLE } from '../constants';
import { Discoveries } from '../components/ocs-install/attached-devices/create-sc/state';

export const hasTaints = (node: NodeKind) => {
  return !_.isEmpty(node.spec?.taints);
};

export const hasOCSTaint = (node: NodeKind) => {
  const taints: Taint[] = node.spec?.taints || [];
  return taints.some((taint: Taint) => _.isEqual(taint, ocsTaint));
};

export const getConvertedUnits = (value: string) => {
  return humanizeBinaryBytes(convertToBaseValue(value)).string ?? '-';
};

export const filterSCWithNoProv = (sc: StorageClassResourceKind) =>
  sc?.provisioner === NO_PROVISIONER;

export const filterSCWithoutNoProv = (sc: StorageClassResourceKind) =>
  sc?.provisioner !== NO_PROVISIONER;

export const getTotalDeviceCapacity = (list: Discoveries[]) => {
  const totalCapacity = list.reduce((res, device) => {
    if (device?.status?.state === AVAILABLE) {
      const capacity = Number(convertToBaseValue(device.size));
      return res + capacity;
    }
    return res;
  }, 0);

  return humanizeBinaryBytes(totalCapacity);
};

export const getAssociatedNodes = (pvs: K8sResourceKind[]): string[] => {
  const nodes = pvs.reduce((res, pv) => {
    const nodeName = pv?.metadata?.labels?.[HOSTNAME_LABEL_KEY];
    if (nodeName) {
      res.add(nodeName);
    }
    return res;
  }, new Set<string>());

  return Array.from(nodes);
};

export const shouldDeployMinimally = (nodes: NodeKind[]) =>
  nodes.reduce((acc, curr) => {
    const cpus = humanizeCpuCores(getNodeCPUCapacity(curr)).value;
    const memoryRaw = getNodeAllocatableMemory(curr);
    const memory = humanizeBinaryBytes(convertToBaseValue(memoryRaw)).value;
    if (memory < 60 || cpus < 16) {
      return [...acc, curr];
    }
    return acc;
  }, []).length > 0;
