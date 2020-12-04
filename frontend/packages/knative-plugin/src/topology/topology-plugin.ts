import { Plugin } from '@console/plugin-sdk';
import { getExecutableCodeRef } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-utils';
import {
  TopologyComponentFactory,
  TopologyDataModelFactory,
  TopologyDisplayFilters,
  TopologyCreateConnector,
  TopologyDecoratorProvider,
} from '@console/topology/src/extensions';
import { TopologyDecoratorQuadrant } from '@console/topology/src/topology-types';
import {
  getIsKnativeResource,
  getKnativeComponentFactory,
  getKnativeTopologyDataModel,
  getTopologyFilters,
  applyDisplayOptions,
  getCreateConnector,
} from './index';
import {
  FLAG_KNATIVE_EVENTING,
  FLAG_KNATIVE_SERVING,
  FLAG_KNATIVE_SERVING_CONFIGURATION,
  FLAG_KNATIVE_SERVING_REVISION,
  FLAG_KNATIVE_SERVING_ROUTE,
  FLAG_KNATIVE_SERVING_SERVICE,
} from '../const';
import {
  knativeServingResourcesConfigurationsWatchers,
  knativeServingResourcesRevisionWatchers,
  knativeServingResourcesRoutesWatchers,
  knativeServingResourcesServicesWatchers,
  knativeEventingResourcesSubscriptionWatchers,
  knativeEventingBrokerResourceWatchers,
  knativeEventingTriggerResourceWatchers,
  knativeCamelIntegrationsResourceWatchers,
  knativeCamelKameletBindingResourceWatchers,
} from '../utils/get-knative-resources';
import {
  getDynamicEventSourcesWatchers,
  getDynamicEventingChannelWatchers,
  fetchEventSourcesCrd,
  fetchChannelsCrd,
} from '../utils/fetch-dynamic-eventsources-utils';
import { getServiceRouteDecorator } from './components/decorators';

// Added it to perform discovery of Dynamic event sources on cluster on app load as kebab option needed models upfront
fetchEventSourcesCrd();
fetchChannelsCrd();

export const getKnativeResources = (namespace: string) => {
  return {
    ...knativeServingResourcesRevisionWatchers(namespace),
    ...knativeServingResourcesConfigurationsWatchers(namespace),
    ...knativeServingResourcesRoutesWatchers(namespace),
    ...knativeServingResourcesServicesWatchers(namespace),
    ...knativeEventingResourcesSubscriptionWatchers(namespace),
    ...getDynamicEventSourcesWatchers(namespace),
    ...getDynamicEventingChannelWatchers(namespace),
    ...knativeEventingBrokerResourceWatchers(namespace),
    ...knativeEventingTriggerResourceWatchers(namespace),
    ...knativeCamelIntegrationsResourceWatchers(namespace),
    ...knativeCamelKameletBindingResourceWatchers(namespace),
  };
};

export type TopologyConsumedExtensions =
  | TopologyComponentFactory
  | TopologyDataModelFactory
  | TopologyDisplayFilters
  | TopologyCreateConnector
  | TopologyDecoratorProvider;

export const topologyPlugin: Plugin<TopologyConsumedExtensions> = [
  {
    type: 'Topology/ComponentFactory',
    properties: {
      getFactory: getKnativeComponentFactory,
    },
    flags: {
      required: [
        FLAG_KNATIVE_SERVING_CONFIGURATION,
        FLAG_KNATIVE_SERVING,
        FLAG_KNATIVE_SERVING_REVISION,
        FLAG_KNATIVE_SERVING_ROUTE,
        FLAG_KNATIVE_SERVING_SERVICE,
        FLAG_KNATIVE_EVENTING,
      ],
    },
  },
  {
    type: 'Topology/DataModelFactory',
    properties: {
      id: 'knative-topology-model-factory',
      priority: 100,
      resources: getKnativeResources,
      workloadKeys: ['ksservices'],
      getDataModel: getKnativeTopologyDataModel,
      isResourceDepicted: getIsKnativeResource,
    },
    flags: {
      required: [
        FLAG_KNATIVE_SERVING_CONFIGURATION,
        FLAG_KNATIVE_SERVING,
        FLAG_KNATIVE_SERVING_REVISION,
        FLAG_KNATIVE_SERVING_ROUTE,
        FLAG_KNATIVE_SERVING_SERVICE,
        FLAG_KNATIVE_EVENTING,
      ],
    },
  },
  {
    type: 'Topology/DisplayFilters',
    properties: {
      getTopologyFilters: getExecutableCodeRef(getTopologyFilters),
      applyDisplayOptions: getExecutableCodeRef(applyDisplayOptions),
    },
  },
  {
    type: 'Topology/CreateConnector',
    properties: {
      getCreateConnector: getExecutableCodeRef(getCreateConnector),
    },
    flags: {
      required: [FLAG_KNATIVE_EVENTING],
    },
  },
  {
    type: 'Topology/Decorator',
    properties: {
      id: 'knative-service-route-decorator',
      priority: 100,
      quadrant: TopologyDecoratorQuadrant.upperRight,
      decorator: getExecutableCodeRef(getServiceRouteDecorator),
    },
    flags: {
      required: [
        FLAG_KNATIVE_SERVING_CONFIGURATION,
        FLAG_KNATIVE_SERVING,
        FLAG_KNATIVE_SERVING_REVISION,
        FLAG_KNATIVE_SERVING_ROUTE,
        FLAG_KNATIVE_SERVING_SERVICE,
        FLAG_KNATIVE_EVENTING,
      ],
    },
  },
];
