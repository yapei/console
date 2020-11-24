import { Plugin } from '@console/plugin-sdk';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import {
  TopologyComponentFactory,
  TopologyDataModelFactory,
  TopologyDisplayFilters,
} from '../extensions/topology';
import {
  getHelmComponentFactory,
  getHelmTopologyDataModel,
  getIsHelmResource,
  getTopologyFilters,
  applyDisplayOptions,
} from './index';

export type HelmTopologyConsumedExtensions =
  | TopologyComponentFactory
  | TopologyDataModelFactory
  | TopologyDisplayFilters;

const getHelmWatchedResources = (namespace: string): WatchK8sResources<any> => {
  return {
    secrets: {
      isList: true,
      kind: 'Secret',
      namespace,
      optional: true,
    },
  };
};

export const helmTopologyPlugin: Plugin<HelmTopologyConsumedExtensions> = [
  {
    type: 'Topology/ComponentFactory',
    properties: {
      getFactory: getHelmComponentFactory,
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'helm-topology-model-factory',
      priority: 400,
      getDataModel: getHelmTopologyDataModel,
      resources: getHelmWatchedResources,
      isResourceDepicted: getIsHelmResource,
    },
  },
  {
    type: 'Topology/DisplayFilters',
    properties: {
      getTopologyFilters,
      applyDisplayOptions,
    },
  },
];
