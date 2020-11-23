import { Plugin, PostFormSubmissionAction } from '@console/plugin-sdk';
import {
  TopologyComponentFactory,
  TopologyDataModelFactory,
  TopologyDisplayFilters,
  TopologyCreateConnector,
} from '../extensions/topology';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src';
import { INCONTEXT_ACTIONS_SERVICE_BINDING } from '@console/dev-console/src/const';
import { ServiceBindingModel } from '../models';
import { ALLOW_SERVICE_BINDING_FLAG } from '../const';
import { getCreateConnector } from './actions';
import {
  getOperatorsComponentFactory,
  getOperatorTopologyDataModel,
  getDataModelReconciler,
  getTopologyFilters,
  applyDisplayOptions,
} from './index';
import { doContextualBinding } from '../utils/connector-utils';

export type OperatorsTopologyConsumedExtensions =
  | TopologyComponentFactory
  | TopologyDataModelFactory
  | TopologyCreateConnector
  | TopologyDisplayFilters
  | PostFormSubmissionAction;

const getOperatorWatchedResources = (namespace: string): WatchK8sResources<any> => {
  return {
    clusterServiceVersions: {
      isList: true,
      kind: referenceForModel(ClusterServiceVersionModel),
      namespace,
      optional: true,
    },
  };
};

const getServiceBindingWatchedResources = (namespace: string): WatchK8sResources<any> => {
  return {
    serviceBindingRequests: {
      isList: true,
      kind: referenceForModel(ServiceBindingModel),
      namespace,
      optional: true,
    },
  };
};

export const operatorsTopologyPlugin: Plugin<OperatorsTopologyConsumedExtensions> = [
  {
    type: 'Topology/ComponentFactory',
    properties: {
      getFactory: getOperatorsComponentFactory,
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'operator-topology-model-factory',
      priority: 500,
      getDataModel: getOperatorTopologyDataModel,
      resources: getOperatorWatchedResources,
      getDataModelReconciler,
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'service-binding-topology-model-factory',
      priority: 501,
      resources: getServiceBindingWatchedResources,
    },
    flags: {
      required: [ALLOW_SERVICE_BINDING_FLAG],
    },
  },
  {
    type: 'Topology/CreateConnector',
    properties: {
      getCreateConnector,
    },
    flags: {
      required: [ALLOW_SERVICE_BINDING_FLAG],
    },
  },
  {
    type: 'Topology/DisplayFilters',
    properties: {
      getTopologyFilters,
      applyDisplayOptions,
    },
  },
  {
    type: 'PostFormSubmissionAction',
    properties: {
      type: INCONTEXT_ACTIONS_SERVICE_BINDING,
      callback: doContextualBinding,
    },
    flags: {
      required: [ALLOW_SERVICE_BINDING_FLAG],
    },
  },
];
