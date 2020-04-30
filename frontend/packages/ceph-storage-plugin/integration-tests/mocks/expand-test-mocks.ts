import { testName } from '@console/internal-integration-tests/protractor.conf';
import { SIZE_UNITS } from '../utils/consts';

export const testDeployment = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: 'example',
    namespace: testName,
  },
  spec: {
    selector: {
      matchLabels: {
        app: 'hello-openshift',
      },
    },
    replicas: 1,
    template: {
      metadata: {
        labels: {
          app: 'hello-openshift',
        },
      },
      spec: {
        volumes: [
          {
            name: `${testName}-pvc`,
            persistentVolumeClaim: {
              claimName: `${testName}-pvc`,
            },
          },
        ],
        containers: [
          {
            name: 'hello-openshift',
            image: 'openshift/hello-openshift',
            ports: [
              {
                containerPort: 8080,
              },
            ],
            volumeMounts: [
              {
                name: `${testName}-pvc`,
                mountPath: '/data',
              },
            ],
          },
        ],
      },
    },
  },
};

export const testPVC = {
  name: `${testName}-pvc`,
  namespace: testName,
  size: '5',
  sizeUnits: SIZE_UNITS.MI,
};
