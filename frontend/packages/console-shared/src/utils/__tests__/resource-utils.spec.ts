import * as _ from 'lodash';
import { ResourceUtil } from '@console/shared';
import { MockResources, sampleDeploymentConfigs, sampleDeployments } from './test-resource-data';
import {
  getKnativeServingRevisions,
  getKnativeServingConfigurations,
  getKnativeServingRoutes,
  getKnativeServingServices,
} from '@console/knative-plugin/src/utils/get-knative-resources';
import {
  sampleKnativeDeployments,
  MockKnativeResources,
} from '@console/knative-plugin/src/topology/__tests__/topology-knative-test-data';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Alert } from '@console/internal/components/monitoring/types';
import { createOverviewItemsForType, getWorkloadMonitoringAlerts } from '../resource-utils';
import { mockAlerts } from '../__mocks__/alerts-and-rules-data';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveProperties(a: string[]): R;
    }
  }
}

const knativeOverviewResourceUtils: ResourceUtil[] = [
  getKnativeServingRevisions,
  getKnativeServingConfigurations,
  getKnativeServingRoutes,
  getKnativeServingServices,
];

expect.extend({
  toHaveProperties(received, argument) {
    const pass = argument.every((arg: string) => {
      return _.has(received, arg);
    });
    if (pass) {
      return {
        message: () =>
          `expected  ${this.utils.printReceived(
            received,
          )} to contain Keys ${this.utils.printExpected(argument)}`,
        pass: true,
      };
    }
    return {
      message: () =>
        `expected ${this.utils.printReceived(received)} to contain Keys ${this.utils.printExpected(
          argument,
        )} but got ${this.utils.printExpected(Object.keys(received))}`,
      pass: false,
    };
  },
});

enum Keys {
  REVISIONS = 'revisions',
  KNATIVECONFIGS = 'configurations',
  KSROUTES = 'ksroutes',
}

const knativeKeys = [Keys.REVISIONS, Keys.KNATIVECONFIGS, Keys.KSROUTES];

describe('TransformResourceData', () => {
  it('should create Deployment config Items', () => {
    const transformedData = createOverviewItemsForType(
      'deploymentConfigs',
      MockResources,
      knativeOverviewResourceUtils,
    );
    expect(transformedData).toHaveLength(2);
    expect(transformedData[0].obj).toEqual(sampleDeploymentConfigs.data[0]);
    expect(transformedData[0].isMonitorable).toBeTruthy();
    expect(transformedData[0].monitoringAlerts).toHaveLength(0);
    expect(transformedData[1].obj).toEqual(sampleDeploymentConfigs.data[1]);
    expect(transformedData[1].isMonitorable).toBeTruthy();
    expect(transformedData[1].monitoringAlerts).toHaveLength(0);
    expect(transformedData[0]).not.toHaveProperties(knativeKeys);
  });

  it('should create Deployment Items', () => {
    const transformedData = createOverviewItemsForType(
      'deployments',
      MockResources,
      knativeOverviewResourceUtils,
    );
    expect(transformedData).toHaveLength(3);
    expect(transformedData[0].obj).toEqual(sampleDeployments.data[0]);
    expect(transformedData[0].isMonitorable).toBeTruthy();
    expect(transformedData[0].monitoringAlerts).toHaveLength(0);
    expect(transformedData[0]).not.toHaveProperties(knativeKeys);
    expect(transformedData[1].obj).toEqual(sampleDeployments.data[1]);
    expect(transformedData[1].isMonitorable).toBeTruthy();
    expect(transformedData[1].monitoringAlerts).toHaveLength(0);
    expect(transformedData[1]).not.toHaveProperties(knativeKeys);
    expect(transformedData[2].obj).toEqual(sampleDeployments.data[2]);
    expect(transformedData[2].isMonitorable).toBeTruthy();
    expect(transformedData[2].monitoringAlerts).toHaveLength(0);
    expect(transformedData[2]).not.toHaveProperties(knativeKeys);
  });

  it('should create Knative Deployment Items for a provided deployment', () => {
    const transformedData = createOverviewItemsForType(
      'deployments',
      { ...MockKnativeResources, deployments: sampleKnativeDeployments },
      knativeOverviewResourceUtils,
    );
    expect(transformedData).toHaveLength(2);
    expect(transformedData[0]).toHaveProperties(knativeKeys);
  });

  it('should create StatefulSets Items for a provided ss', () => {
    const transformedData = createOverviewItemsForType(
      'statefulSets',
      MockResources,
      knativeOverviewResourceUtils,
    );
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0]).not.toHaveProperties(knativeKeys);
  });

  it('should create DaemonSets Items for a provided ds', () => {
    const transformedData = createOverviewItemsForType(
      'daemonSets',
      MockResources,
      knativeOverviewResourceUtils,
    );
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0]).not.toHaveProperties(knativeKeys);
  });

  it('should return only standalone pods', () => {
    const transformedData = createOverviewItemsForType(
      'pods',
      MockResources,
      knativeOverviewResourceUtils,
    );
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0]).not.toHaveProperties(knativeKeys);
  });

  it('should create standalone Job Items', () => {
    const transformedData = createOverviewItemsForType('jobs', MockResources);
    expect(transformedData).toHaveLength(1);
    expect(transformedData[0]).not.toHaveProperties(knativeKeys);
  });

  it('should create CronJob Items', () => {
    const transformedData = createOverviewItemsForType('cronJobs', MockResources);
    expect(transformedData).toHaveLength(1);
  });

  it('should return all the alerts related to a workload', () => {
    const deploymentResource: K8sResourceKind = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: 'prometheus-example-app',
        uid: '6876876',
        namespace: 'ns1',
        labels: {
          app: 'prometheus-example-app',
        },
      },
      spec: {
        replicas: '1',
      },
    };
    const alerts: Alert[] = getWorkloadMonitoringAlerts(deploymentResource, mockAlerts);
    const expectedAlerts: Alert[] = _.pullAt(mockAlerts.data, [0, 1]);
    expect(alerts).toEqual(expectedAlerts);
  });
});
