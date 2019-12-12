import { FirehoseResult } from '@console/internal/components/utils';
import { DeploymentKind, PodKind } from '@console/internal/module/k8s';
import { TopologyDataModel, TopologyDataResources } from '../topology-types';

export const resources: TopologyDataResources = {
  replicationControllers: { loaded: true, loadError: '', data: [] },
  pods: { loaded: true, loadError: '', data: [] },
  deploymentConfigs: { loaded: true, loadError: '', data: [] },
  services: { loaded: true, loadError: '', data: [] },
  routes: { loaded: true, loadError: '', data: [] },
  deployments: { loaded: true, loadError: '', data: [] },
  replicaSets: { loaded: true, loadError: '', data: [] },
  buildConfigs: { loaded: true, loadError: '', data: [] },
  builds: { loaded: true, loadError: '', data: [] },
  daemonSets: { loaded: true, loadError: '', data: [] },
  statefulSets: { loaded: true, loadError: '', data: [] },
  pipelineRuns: { loaded: true, loadError: '', data: [] },
  pipelines: { loaded: true, loadError: '', data: [] },
};

export const topologyData: TopologyDataModel = {
  graph: { nodes: [], edges: [], groups: [] },
  topology: {},
};

export const sampleDeploymentConfigs: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      kind: 'DeploymentConfig',
      apiVersion: 'apps/v1',
      metadata: {
        name: 'nodejs',
        namespace: 'testproject1',
        selfLink: '/apis/apps.openshift.io/v1/namespaces/testproject1/deploymentconfigs/nodejs',
        uid: '02f680df-680f-11e9-b69e-5254003f9382',
        resourceVersion: '732186',
        generation: 2,
        creationTimestamp: '2019-04-22T11:58:33Z',
        labels: {
          app: 'nodejs',
          'app.kubernetes.io/instance': 'nodejs',
        },
        annotations: {
          'app.openshift.io/vcs-uri': 'https://github.com/redhat-developer/topology-example',
          'app.openshift.io/vcs-ref': 'master',
        },
      },
      spec: {
        strategy: {
          type: 'Rolling',
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              app: 'nodejs',
              deploymentconfig: 'nodejs',
            },
          },
          spec: {},
        },
      },
      status: {
        availableReplicas: 1,
        unavailableReplicas: 0,
        latestVersion: 1,
        updatedReplicas: 1,
        replicas: 1,
        readyReplicas: 1,
      },
    },
  ],
};
export const sampleDeployments: FirehoseResult<DeploymentKind[]> = {
  loaded: true,
  loadError: '',
  data: [
    {
      kind: 'Deployment',
      apiVersion: 'apps/v1',
      metadata: {
        annotations: {
          'app.openshift.io/connects-to': '["wit"]',
        },
        selfLink: '/apis/apps/v1/namespaces/testproject1/deployments/analytics-deployment',
        resourceVersion: '753748',
        name: 'analytics-deployment',
        uid: '5ca9ae28-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-22T11:35:37Z',
        generation: 5,
        namespace: 'testproject1',
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
      },
      spec: {
        replicas: 3,
        selector: {
          matchLabels: {
            'app.kubernetes.io/component': 'backend',
            'app.kubernetes.io/instance': 'analytics',
            'app.kubernetes.io/name': 'python',
            'app.kubernetes.io/part-of': 'application-1',
            'app.kubernetes.io/version': '1.0',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              'app.kubernetes.io/component': 'backend',
              'app.kubernetes.io/instance': 'analytics',
              'app.kubernetes.io/name': 'python',
              'app.kubernetes.io/part-of': 'application-1',
              'app.kubernetes.io/version': '1.0',
            },
          },
          spec: {
            containers: [],
          },
        },
        strategy: {
          type: 'RollingUpdate',
          rollingUpdate: {
            maxUnavailable: '25%',
            maxSurge: '25%',
          },
        },
        revisionHistoryLimit: 10,
        progressDeadlineSeconds: 600,
      },
      status: {},
    },
    {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
        },
        selfLink: '/apis/apps/v1/namespaces/testproject1/deployments/wit-deployment',
        resourceVersion: '726179',
        name: 'wit-deployment',
        uid: '60a9b423-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-22T11:35:43Z',
        generation: 2,
        namespace: 'testproject1',
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
      },
      spec: {
        replicas: 3,
        selector: {
          matchLabels: {
            'app.kubernetes.io/component': 'backend',
            'app.kubernetes.io/instance': 'wit',
            'app.kubernetes.io/name': 'nodejs',
            'app.kubernetes.io/part-of': 'application-1',
            'app.kubernetes.io/version': '1.0',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              'app.kubernetes.io/component': 'backend',
              'app.kubernetes.io/instance': 'wit',
              'app.kubernetes.io/name': 'nodejs',
              'app.kubernetes.io/part-of': 'application-1',
              'app.kubernetes.io/version': '1.0',
            },
          },
          spec: {
            containers: [],
          },
        },
        strategy: {
          type: 'RollingUpdate',
          rollingUpdate: {
            maxUnavailable: '25%',
            maxSurge: '25%',
          },
        },
        revisionHistoryLimit: 10,
        progressDeadlineSeconds: 600,
      },
      status: {},
    },
  ],
};

export const samplePods: FirehoseResult<PodKind[]> = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        generateName: 'analytics-deployment-59dd7c47d4-',
        annotations: {
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/analytics-deployment-59dd7c47d4-2jp7t',
        resourceVersion: '1395096',
        name: 'analytics-deployment-59dd7c47d4-2jp7t',
        uid: '5cec460e-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:23:41Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'ReplicaSet',
            name: 'analytics-deployment-59dd7c47d4',
            uid: '5cad37cb-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '1588370380',
        },
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Running',
      },
    },
    {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        generateName: 'analytics-deployment-59dd7c47d4-',
        annotations: {
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/analytics-deployment-59dd7c47d4-6btjb',
        resourceVersion: '1394896',
        name: 'analytics-deployment-59dd7c47d4-6btjb',
        uid: 'c4592a49-683c-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T16:03:01Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'ReplicaSet',
            name: 'analytics-deployment-59dd7c47d4',
            uid: '5cad37cb-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '1588370380',
        },
      },
      spec: {
        containers: [],
      },

      status: {
        phase: 'Running',
      },
    },
    {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        generateName: 'analytics-deployment-59dd7c47d4-',
        annotations: {
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/analytics-deployment-59dd7c47d4-n4zrh',
        resourceVersion: '1394826',
        name: 'analytics-deployment-59dd7c47d4-n4zrh',
        uid: '5cec1049-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:23:41Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'ReplicaSet',
            name: 'analytics-deployment-59dd7c47d4',
            uid: '5cad37cb-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '1588370380',
        },
      },
      spec: {
        containers: [],
      },

      status: {
        phase: 'Running',
      },
    },
    {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        generateName: 'nodejs-1-',
        annotations: {
          'openshift.io/deployment-config.latest-version': '1',
          'openshift.io/deployment-config.name': 'nodejs',
          'openshift.io/deployment.name': 'nodejs-1',
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/nodejs-1-2v82p',
        resourceVersion: '1161178',
        name: 'nodejs-1-2v82p',
        uid: '19e6c6a5-680f-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:36:07Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'v1',
            kind: 'ReplicationController',
            name: 'nodejs-1',
            uid: '18c94ccd-680f-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          app: 'nodejs',
          deployment: 'nodejs-1',
          deploymentconfig: 'nodejs',
        },
      },
      spec: {
        containers: [],
      },

      status: {
        phase: 'Running',
      },
    },
    {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        annotations: {
          'openshift.io/build.name': 'nodejs-1',
          'openshift.io/scc': 'privileged',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/nodejs-1-build',
        resourceVersion: '1161133',
        name: 'nodejs-1-build',
        uid: '0361f689-680f-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:35:30Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'build.openshift.io/v1',
            kind: 'Build',
            name: 'nodejs-1',
            uid: '0335fc81-680f-11e9-b69e-5254003f9382',
            controller: true,
          },
        ],
        labels: {
          'openshift.io/build.name': 'nodejs-1',
        },
      },
      spec: {
        containers: [],
      },

      status: {
        phase: 'Succeeded',
      },
    },
    {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        generateName: 'wit-deployment-656cc8b469-',
        annotations: {
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/wit-deployment-656cc8b469-2n6nl',
        resourceVersion: '1394776',
        name: 'wit-deployment-656cc8b469-2n6nl',
        uid: '610c7d95-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:23:48Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'ReplicaSet',
            name: 'wit-deployment-656cc8b469',
            uid: '60a9b423-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '2127746025',
        },
      },
      spec: {
        containers: [],
      },

      status: {
        phase: 'Running',
      },
    },
    {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        generateName: 'wit-deployment-656cc8b469-',
        annotations: {
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/wit-deployment-656cc8b469-kzh9c',
        resourceVersion: '1394914',
        name: 'wit-deployment-656cc8b469-kzh9c',
        uid: '60dbfd78-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:23:48Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'ReplicaSet',
            name: 'wit-deployment-656cc8b469',
            uid: '60a9b423-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '2127746025',
        },
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Running',
      },
    },
    {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        generateName: 'wit-deployment-656cc8b469-',
        annotations: {
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testproject3/pods/wit-deployment-656cc8b469-r5nlj',
        resourceVersion: '1395115',
        name: 'wit-deployment-656cc8b469-r5nlj',
        uid: '610bbd96-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:23:48Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'ReplicaSet',
            name: 'wit-deployment-656cc8b469',
            uid: '60a9b423-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '2127746025',
        },
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Running',
      },
    },
    {
      kind: 'Pod',
      apiVersion: 'v1',
      metadata: {
        generateName: 'daemonset-testing-',
        annotations: {
          'k8s.v1.cni.cncf.io/networks-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.0.89"\n    ],\n    "default": true,\n    "dns": {}\n}]',
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/testing/pods/daemonset-testing-62h94',
        resourceVersion: '700638',
        name: 'daemonset-testing-62h94',
        uid: '0c4dd58f-a6e6-11e9-a20f-52fdfc072182',
        creationTimestamp: '2019-07-15T09:50:59Z',
        namespace: 'testing',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'DaemonSet',
            name: 'daemonset-testing',
            uid: '0c4a82c9-a6e6-11e9-a20f-52fdfc072182',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          app: 'hello-openshift',
          'controller-revision-hash': '5b58864494',
          'pod-template-generation': '1',
        },
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Pending',
        startTime: '2019-07-15T09:50:59Z',
      },
    },
    {
      kind: 'Pod',
      apiVersion: 'v1',
      metadata: {
        name: 'alertmanager-main-0',
        generateName: 'alertmanager-main-',
        namespace: 'openshift-monitoring',
        selfLink: '/api/v1/namespaces/openshift-monitoring/pods/alertmanager-main-0',
        uid: 'db4924ec-adfb-11e9-ac86-062ae0b85aca',
        resourceVersion: '14171',
        creationTimestamp: '2019-07-24T10:14:43Z',
        labels: {
          alertmanager: 'main',
          app: 'alertmanager',
          'controller-revision-hash': 'alertmanager-main-5b9d487b7f',
          'statefulset.kubernetes.io/pod-name': 'alertmanager-main-0',
        },
        annotations: {
          'openshift.io/scc': 'restricted',
        },
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'StatefulSet',
            name: 'alertmanager-main',
            uid: 'db365c19-adfb-11e9-ac86-062ae0b85aca',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Running',
        startTime: '2019-07-24T10:14:56Z',
      },
    },
  ],
};

export const sampleReplicationControllers: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: 'v1',
      kind: 'ReplicationController',
      metadata: {
        annotations: {
          'openshift.io/deployment-config.name': 'nodejs',
          'openshift.io/deployer-pod.completed-at': '2019-04-26 10:36:10 +0000 UTC',
          'openshift.io/deployment.phase': 'Complete',
        },
        selfLink: '/api/v1/namespaces/testproject3/replicationcontrollers/nodejs-1',
        resourceVersion: '1161189',
        name: 'nodejs-1',
        uid: '18c94ccd-680f-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:36:06Z',
        generation: 2,
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps.openshift.io/v1',
            kind: 'DeploymentConfig',
            name: 'nodejs',
            uid: '02f680df-680f-11e9-b69e-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          app: 'nodejs',
          'openshift.io/deployment-config.name': 'nodejs',
        },
      },
      spec: {},
      status: {
        replicas: 1,
        fullyLabeledReplicas: 1,
        readyReplicas: 1,
        availableReplicas: 1,
        observedGeneration: 2,
      },
    },
  ],
};

export const sampleReplicaSets: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      kind: 'ReplicaSet',
      apiVersion: 'apps/v1',
      metadata: {
        annotations: {
          'app.openshift.io/connects-to': '["wit"]',
          'deployment.kubernetes.io/desired-replicas': '3',
          'deployment.kubernetes.io/max-replicas': '4',
          'deployment.kubernetes.io/revision': '1',
          'deployment.kubernetes.io/revision-history': '1,1,1',
        },
        selfLink:
          '/apis/apps/v1/namespaces/testproject3/replicasets/analytics-deployment-59dd7c47d4',
        resourceVersion: '1398999',
        name: 'analytics-deployment-59dd7c47d4',
        uid: '5cad37cb-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:23:41Z',
        generation: 3,
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            name: 'analytics-deployment',
            uid: '5ca9ae28-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '1588370380',
        },
      },
      spec: {},
      status: {
        replicas: 3,
        fullyLabeledReplicas: 3,
        observedGeneration: 3,
      },
    },
    {
      kind: 'ReplicaSet',
      metadata: {
        annotations: {
          'deployment.kubernetes.io/desired-replicas': '3',
          'deployment.kubernetes.io/max-replicas': '4',
          'deployment.kubernetes.io/revision': '1',
        },
        selfLink: '/apis/apps/v1/namespaces/testproject3/replicasets/wit-deployment-656cc8b469',
        resourceVersion: '1389053',
        name: 'wit-deployment-656cc8b469',
        uid: '60a9b423-680d-11e9-8c69-5254003f9382',
        creationTimestamp: '2019-04-26T10:23:47Z',
        generation: 1,
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            name: 'wit-deployment',
            uid: '60a9b423-680d-11e9-8c69-5254003f9382',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
          'pod-template-hash': '2127746025',
        },
      },
      spec: {},
      status: {
        replicas: 3,
        fullyLabeledReplicas: 3,
        observedGeneration: 1,
      },
    },
  ],
};

export const sampleServices: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      kind: 'Service',
      metadata: {
        name: 'analytics-service',
        namespace: 'testproject3',
        selfLink: '/api/v1/namespaces/testproject3/services/analytics-service',
        uid: '5cb930e0-680d-11e9-8c69-5254003f9382',
        resourceVersion: '1157349',
        creationTimestamp: '2019-04-26T10:23:41Z',
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
        annotations: {
          'kubectl.kubernetes.io/last-applied-configuration':
            '{"apiVersion":"v1","kind":"Service","metadata":{"annotations":{},"labels":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"analytics","app.kubernetes.io/name":"python","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"},"name":"analytics-service","namespace":"testproject3"},"spec":{"ports":[{"port":80}],"selector":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"analytics","app.kubernetes.io/name":"analytics","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"}}}\n',
        },
      },
      spec: {
        selector: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
      },
      status: {
        loadBalancer: {},
      },
    },
    {
      kind: 'Service',
      metadata: {
        name: 'nodejs',
        namespace: 'testproject3',
        selfLink: '/api/v1/namespaces/testproject3/services/nodejs',
        uid: '02f53542-680f-11e9-8c69-5254003f9382',
        resourceVersion: '1160881',
        creationTimestamp: '2019-04-26T10:35:29Z',
        labels: {
          app: 'nodejs',
        },
      },
      spec: {
        selector: {
          app: 'nodejs',
          deploymentconfig: 'nodejs',
        },
      },
      status: {
        loadBalancer: {},
      },
    },
    {
      kind: 'Service',
      metadata: {
        name: 'wit-service',
        namespace: 'testproject3',
        selfLink: '/api/v1/namespaces/testproject3/services/wit-service',
        uid: '60e010cc-680d-11e9-8c69-5254003f9382',
        resourceVersion: '1157449',
        creationTimestamp: '2019-04-26T10:23:48Z',
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
        annotations: {
          'kubectl.kubernetes.io/last-applied-configuration':
            '{"apiVersion":"v1","kind":"Service","metadata":{"annotations":{},"labels":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"wit","app.kubernetes.io/name":"nodejs","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"},"name":"wit-service","namespace":"testproject3"},"spec":{"ports":[{"port":80}],"selector":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"wit","app.kubernetes.io/name":"nodejs","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"}}}\n',
        },
      },
      spec: {
        selector: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
      },
      status: {
        loadBalancer: {},
      },
    },
  ],
};
export const sampleRoutes: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      kind: 'Route',
      metadata: {
        name: 'analytics-route',
        namespace: 'testproject3',
        selfLink: '/apis/route.openshift.io/v1/namespaces/testproject3/routes/analytics-route',
        uid: '5cb4135f-680d-11e9-b69e-5254003f9382',
        resourceVersion: '1157355',
        creationTimestamp: '2019-04-26T10:23:41Z',
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
        annotations: {
          'kubectl.kubernetes.io/last-applied-configuration':
            '{"apiVersion":"route.openshift.io/v1","kind":"Route","metadata":{"annotations":{},"labels":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"analytics","app.kubernetes.io/name":"python","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"},"name":"analytics-route","namespace":"testproject3"},"spec":{"host":"analytics.io","path":"/","to":{"kind":"Service","name":"analytics-service"}}}\n',
        },
      },
      spec: {
        host: 'analytics.io',
        to: {
          kind: 'Service',
          name: 'analytics-service',
          weight: 100,
        },
      },
      status: {},
    },
    {
      kind: 'Route',
      metadata: {
        name: 'nodejs',
        namespace: 'testproject3',
        selfLink: '/apis/route.openshift.io/v1/namespaces/testproject3/routes/nodejs',
        uid: '02f63696-680f-11e9-b69e-5254003f9382',
        resourceVersion: '1160889',
        creationTimestamp: '2019-04-26T10:35:29Z',
        labels: {
          app: 'nodejs',
        },
        annotations: {
          'openshift.io/host.generated': 'true',
        },
      },
      spec: {
        host: 'nodejs-testproject3.192.168.42.60.nip.io',
        to: {
          kind: 'Service',
          name: 'nodejs',
          weight: 100,
        },
      },
      status: {},
    },
    {
      kind: 'Route',
      metadata: {
        name: 'wit-route',
        namespace: 'testproject3',
        selfLink: '/apis/route.openshift.io/v1/namespaces/testproject3/routes/wit-route',
        uid: '60dba9b8-680d-11e9-b69e-5254003f9382',
        resourceVersion: '1157450',
        creationTimestamp: '2019-04-26T10:23:48Z',
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
        annotations: {
          'kubectl.kubernetes.io/last-applied-configuration':
            '{"apiVersion":"route.openshift.io/v1","kind":"Route","metadata":{"annotations":{},"labels":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"wit","app.kubernetes.io/name":"nodejs","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"},"name":"wit-route","namespace":"testproject3"},"spec":{"host":"wit.io","path":"/","to":{"kind":"Service","name":"wit-service"}}}\n',
        },
      },
      spec: {
        host: 'wit.io',
        to: {
          kind: 'Service',
          name: 'wit-service',
          weight: 100,
        },
      },
      status: {},
    },
  ],
};

export const sampleBuildConfigs: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      kind: 'BuildConfig',
      metadata: {
        name: 'analytics-build',
        namespace: 'testproject3',
        selfLink:
          '/apis/build.openshift.io/v1/namespaces/testproject3/buildconfigs/analytics-build',
        uid: '5ca46c49-680d-11e9-b69e-5254003f9382',
        resourceVersion: '1772624',
        creationTimestamp: '2019-04-26T10:23:40Z',
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'user-analytics',
          'app.kubernetes.io/name': 'python',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
        annotations: {
          'app.openshift.io/vcs-ref': 'v1.0.0',
          'app.openshift.io/vcs-uri': 'git@github.com:redhat-developer/topology-example.git',
          'kubectl.kubernetes.io/last-applied-configuration':
            '{"apiVersion":"build.openshift.io/v1","kind":"BuildConfig","metadata":{"annotations":{"app.openshift.io/vcs-ref":"v1.0.0","app.openshift.io/vcs-uri":"git@github.com:redhat-developer/topology-example.git"},"labels":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"user-analytics","app.kubernetes.io/name":"python","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"},"name":"analytics-build","namespace":"testproject3"},"spec":{"output":{"to":{"kind":"ImageStreamTag","name":"analytics-build:latest"}},"source":{"git":{"uri":"git@github.com:DhritiShikhar/topology-example.git"},"type":"Git"},"strategy":{"dockerStrategy":{"noCache":true}}}}\n',
        },
      },
      spec: {},
      status: {
        lastVersion: 1,
      },
    },
    {
      kind: 'BuildConfig',
      metadata: {
        name: 'nodejs',
        namespace: 'testproject3',
        selfLink: '/apis/build.openshift.io/v1/namespaces/testproject3/buildconfigs/nodejs',
        uid: '02fc958f-680f-11e9-b69e-5254003f9382',
        resourceVersion: '1160891',
        creationTimestamp: '2019-04-26T10:35:29Z',
        labels: {
          app: 'nodejs',
        },
      },
      spec: {},
      status: {
        lastVersion: 1,
      },
    },
    {
      kind: 'BuildConfig',
      metadata: {
        name: 'wit-build',
        namespace: 'testproject3',
        selfLink: '/apis/build.openshift.io/v1/namespaces/testproject3/buildconfigs/wit-build',
        uid: '608914d2-680d-11e9-b69e-5254003f9382',
        resourceVersion: '1157436',
        creationTimestamp: '2019-04-26T10:23:47Z',
        labels: {
          'app.kubernetes.io/component': 'backend',
          'app.kubernetes.io/instance': 'wit',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/version': '1.0',
        },
        annotations: {
          'app.openshift.io/vcs-ref': 'v1.0.0',
          'app.openshift.io/vcs-uri': 'git@github.com:redhat-developer/topology-example.git',
          'kubectl.kubernetes.io/last-applied-configuration':
            '{"apiVersion":"build.openshift.io/v1","kind":"BuildConfig","metadata":{"annotations":{"app.openshift.io/vcs-ref":"v1.0.0","app.openshift.io/vcs-uri":"git@github.com:redhat-developer/topology-example.git"},"labels":{"app.kubernetes.io/component":"backend","app.kubernetes.io/instance":"wit","app.kubernetes.io/name":"nodejs","app.kubernetes.io/part-of":"application-1","app.kubernetes.io/version":"1.0"},"name":"wit-build","namespace":"testproject3"},"spec":{"output":{"to":{"kind":"ImageStreamTag","name":"wit-build:latest"}},"source":{"git":{"uri":"git@github.com:DhritiShikhar/topology-example.git"},"type":"Git"},"strategy":{"dockerStrategy":{"noCache":true}}}}\n',
        },
      },
      spec: {},
      status: {
        lastVersion: 0,
      },
    },
  ],
};

export const sampleBuilds: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      kind: 'Builds',
      metadata: {
        annotations: {
          'openshift.io/build-config.name': 'analytics-build',
          'openshift.io/build.number': '1',
        },
        selfLink: '/apis/build.openshift.io/v1/namespaces/testproject3/builds/analytics-build-1',
        resourceVersion: '358822',
        name: 'analytics-build-1',
        uid: '58d6b528-9c89-11e9-80f4-0a580a82001a',
        creationTimestamp: '2019-07-02T05:22:12Z',
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'build.openshift.io/v1',
            kind: 'BuildConfig',
            name: 'analytics-build',
            uid: '5ca46c49-680d-11e9-b69e-5254003f9382',
            controller: true,
          },
        ],
        labels: {
          app: 'analytics-build',
          'app.kubernetes.io/component': 'analytics-build',
          'app.kubernetes.io/instance': 'analytics-build',
          'app.kubernetes.io/name': 'nodejs',
          'app.kubernetes.io/part-of': 'myapp',
          buildconfig: 'analytics-build',
          'openshift.io/build-config.name': 'analytics-build',
          'openshift.io/build.start-policy': 'Serial',
        },
      },
      spec: {
        serviceAccount: 'builder',
        source: {
          type: 'Git',
          git: {
            uri: 'https://github.com/fabric8-ui/fabric8-ui',
          },
          contextDir: '/',
        },
        strategy: {
          type: 'Source',
          sourceStrategy: {
            from: {
              kind: 'DockerImage',
              name:
                'image-registry.openshift-image-registry.svc:5000/openshift/nodejs@sha256:0ad231dc2d1c34ed3fb29fb304821171155e0a1a23f0e0490b2cd8ca60915517',
            },
            pullSecret: {
              name: 'builder-dockercfg-tx6qx',
            },
          },
        },
        output: {
          to: {
            kind: 'ImageStreamTag',
            name: 'analytics-build:latest',
          },
        },
        resources: {},
        postCommit: {},
        nodeSelector: null,
        triggeredBy: [
          {
            message: 'Image change',
            imageChangeBuild: {
              imageID:
                'image-registry.openshift-image-registry.svc:5000/openshift/nodejs@sha256:0ad231dc2d1c34ed3fb29fb304821171155e0a1a23f0e0490b2cd8ca60915517',
              fromRef: {
                kind: 'ImageStreamTag',
                namespace: 'openshift',
                name: 'nodejs:10',
              },
            },
          },
        ],
      },
      status: {
        phase: 'New',
        reason: 'CannotCreateBuildPod',
        message: 'Failed creating build pod.',
        config: {
          kind: 'BuildConfig',
          namespace: 'testproject3',
          name: 'analytics-build',
        },
        output: {},
      },
    },
  ],
};

export const sampleDaemonSets: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      metadata: {
        name: 'daemonset-testing',
        namespace: 'testing',
        selfLink: '/apis/apps/v1/namespaces/testing/daemonsets/daemonset-testing',
        uid: '0c4a82c9-a6e6-11e9-a20f-52fdfc072182',
        resourceVersion: '700614',
        generation: 1,
        creationTimestamp: '2019-07-15T09:50:59Z',
        annotations: {
          'deprecated.daemonset.template.generation': '1',
        },
      },
      spec: {
        selector: {
          matchLabels: {
            app: 'hello-openshift',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              app: 'hello-openshift',
            },
          },
          spec: {
            containers: [
              {
                name: 'hello-openshift',
                image: 'openshift/hello-openshift',
                ports: [
                  {
                    containerPort: 8080,
                    protocol: 'TCP',
                  },
                ],
                resources: {},
                terminationMessagePath: '/dev/termination-log',
                terminationMessagePolicy: 'File',
                imagePullPolicy: 'Always',
              },
            ],
            restartPolicy: 'Always',
            terminationGracePeriodSeconds: 30,
            dnsPolicy: 'ClusterFirst',
            securityContext: {},
            schedulerName: 'default-scheduler',
          },
        },
        updateStrategy: {
          type: 'RollingUpdate',
          rollingUpdate: {
            maxUnavailable: 1,
          },
        },
        revisionHistoryLimit: 10,
      },
      status: {
        currentNumberScheduled: 1,
        numberMisscheduled: 0,
        desiredNumberScheduled: 1,
        numberReady: 0,
        observedGeneration: 1,
        updatedNumberScheduled: 1,
        numberUnavailable: 1,
      },
      kind: 'DaemonSet',
      apiVersion: 'apps/v1',
    },
  ],
};

export const sampleStatefulSets: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      metadata: {
        name: 'alertmanager-main',
        namespace: 'openshift-monitoring',
        selfLink: '/apis/apps/v1/namespaces/openshift-monitoring/statefulsets/alertmanager-main',
        uid: 'db365c19-adfb-11e9-ac86-062ae0b85aca',
        resourceVersion: '14506',
        generation: 1,
        creationTimestamp: '2019-07-24T10:14:43Z',
        labels: {
          alertmanager: 'main',
        },
        ownerReferences: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            kind: 'Alertmanager',
            name: 'main',
            uid: 'db2f029d-adfb-11e9-8783-0a4de0430898',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
      },
      spec: {
        replicas: 3,
        selector: {
          matchLabels: {
            alertmanager: 'main',
            app: 'alertmanager',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              alertmanager: 'main',
              app: 'alertmanager',
            },
          },
          spec: {
            containers: [
              {
                name: 'alertmanager',
                image:
                  'registry.svc.ci.openshift.org/ocp/4.2-2019-07-24-010407@sha256:7f17f55f2f3901d83ad1757ffb1c617963e713916e54c870531446e8f80edc8a',
                args: [
                  '--config.file=/etc/alertmanager/config/alertmanager.yaml',
                  '--cluster.listen-address=[$(POD_IP)]:6783',
                  '--storage.path=/alertmanager',
                  '--data.retention=120h',
                  '--web.listen-address=127.0.0.1:9093',
                  '--web.external-url=https://alertmanager-main-openshift-monitoring.apps.rorai-cluster3.devcluster.openshift.com/',
                  '--web.route-prefix=/',
                  '--cluster.peer=alertmanager-main-0.alertmanager-operated.openshift-monitoring.svc:6783',
                  '--cluster.peer=alertmanager-main-1.alertmanager-operated.openshift-monitoring.svc:6783',
                  '--cluster.peer=alertmanager-main-2.alertmanager-operated.openshift-monitoring.svc:6783',
                ],
                ports: [
                  {
                    name: 'mesh',
                    containerPort: 6783,
                    protocol: 'TCP',
                  },
                ],
                env: [
                  {
                    name: 'POD_IP',
                    valueFrom: {
                      fieldRef: {
                        apiVersion: 'v1',
                        fieldPath: 'status.podIP',
                      },
                    },
                  },
                ],
                resources: {
                  requests: {
                    memory: '200Mi',
                  },
                },
                volumeMounts: [
                  {
                    name: 'config-volume',
                    mountPath: '/etc/alertmanager/config',
                  },
                  {
                    name: 'alertmanager-main-db',
                    mountPath: '/alertmanager',
                  },
                  {
                    name: 'secret-alertmanager-main-tls',
                    readOnly: true,
                    mountPath: '/etc/alertmanager/secrets/alertmanager-main-tls',
                  },
                  {
                    name: 'secret-alertmanager-main-proxy',
                    readOnly: true,
                    mountPath: '/etc/alertmanager/secrets/alertmanager-main-proxy',
                  },
                ],
                terminationMessagePath: '/dev/termination-log',
                terminationMessagePolicy: 'File',
                imagePullPolicy: 'IfNotPresent',
              },
            ],
            restartPolicy: 'Always',
            terminationGracePeriodSeconds: 120,
            dnsPolicy: 'ClusterFirst',
            nodeSelector: {
              'beta.kubernetes.io/os': 'linux',
            },
            serviceAccountName: 'alertmanager-main',
            serviceAccount: 'alertmanager-main',
            securityContext: {},
            schedulerName: 'default-scheduler',
            priorityClassName: 'system-cluster-critical',
          },
        },
        serviceName: 'alertmanager-operated',
        podManagementPolicy: 'OrderedReady',
        updateStrategy: {
          type: 'RollingUpdate',
        },
        revisionHistoryLimit: 10,
      },
      status: {
        observedGeneration: 1,
        replicas: 3,
        readyReplicas: 3,
        currentReplicas: 3,
        updatedReplicas: 3,
        currentRevision: 'alertmanager-main-5b9d487b7f',
        updateRevision: 'alertmanager-main-5b9d487b7f',
        collisionCount: 0,
      },
      kind: 'StatefulSet',
    },
  ],
};

export const samplePipeline: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: 'tekton.dev/v1alpha1',
      kind: 'Pipeline',
      metadata: {
        creationTimestamp: '2019-10-18T10:06:37Z',
        generation: 1,
        name: 'hello-world-pipeline',
        namespace: 't-s',
        resourceVersion: '371236',
        selfLink: '/apis/tekton.dev/v1alpha1/namespaces/t-s/pipelines/hello-world-pipeline',
        uid: '73d7842d-975f-44ab-99e4-727b7cf097b6',
        labels: {
          'app.kubernetes.io/instance': 'nodejs',
        },
      },
      spec: {
        tasks: [
          {
            name: 'hello-world',
            taskRef: {
              name: 'hello-world',
            },
          },
        ],
      },
    },
  ],
};

export const samplePipelineRun: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: 'tekton.dev/v1alpha1',
      kind: 'PipelineRun',
      metadata: {
        creationTimestamp: '2019-10-18T10:07:28Z',
        generation: 1,
        labels: {
          'tekton.dev/pipeline': 'hello-world-pipeline',
        },
        name: 'hello-world-pipeline',
        namespace: 't-s',
        resourceVersion: '371822',
        selfLink: '/apis/tekton.dev/v1alpha1/namespaces/t-s/pipelineruns/hello-world-pipeline',
        uid: 'a049c81e-ba40-4248-ac54-a2728893afcb',
      },
      spec: {
        pipelineRef: {
          name: 'hello-world-pipeline',
        },
        podTemplate: {},
        timeout: '1h0m0s',
      },
      status: {
        completionTime: '2019-10-18T10:08:00Z',
        conditions: [
          {
            lastTransitionTime: '2019-10-18T10:08:00Z',
            message: 'All Tasks have completed executing',
            reason: 'Succeeded',
            status: 'True',
            type: 'Succeeded',
          },
        ],
        startTime: '2019-10-18T10:07:28Z',
        taskRuns: {
          'hello-world-pipeline-hello-world-6mbs6': {
            pipelineTaskName: 'hello-world',
            status: {
              completionTime: '2019-10-18T10:08:00Z',
              conditions: [
                {
                  lastTransitionTime: '2019-10-18T10:08:00Z',
                  message: 'All Steps have completed executing',
                  reason: 'Succeeded',
                  status: 'True',
                  type: 'Succeeded',
                },
              ],
              podName: 'hello-world-pipeline-hello-world-6mbs6-pod-ab38ef',
              startTime: '2019-10-18T10:07:28Z',
              steps: [
                {
                  container: 'step-echo',
                  imageID:
                    'docker.io/library/ubuntu@sha256:1bbdea4846231d91cce6c7ff3907d26fca444fd6b7e3c282b90c7fe4251f9f86',
                  name: 'echo',
                  terminated: {
                    containerID:
                      'cri-o://14b1d028e46e921b5fa3445def9fbeb35403ae3332da347d62c01807717eba49',
                    exitCode: 0,
                    finishedAt: '2019-10-18T10:07:59Z',
                    reason: 'Completed',
                    startedAt: '2019-10-18T10:07:57Z',
                  },
                },
              ],
            },
          },
        },
      },
    },
  ],
};

export const MockResources: TopologyDataResources = {
  deployments: sampleDeployments,
  deploymentConfigs: sampleDeploymentConfigs,
  replicationControllers: sampleReplicationControllers,
  replicaSets: sampleReplicaSets,
  pods: samplePods,
  services: sampleServices,
  routes: sampleRoutes,
  buildConfigs: sampleBuildConfigs,
  builds: sampleBuilds,
  daemonSets: sampleDaemonSets,
  statefulSets: sampleStatefulSets,
  pipelines: samplePipeline,
  pipelineRuns: samplePipelineRun,
};
