import { GuidedTourItem, TourStatus } from './guided-tour-typings';
import { GuidedTourStatus } from './guided-tour-status';

export const mockGuidedTours: GuidedTourItem[] = [
  {
    iconURL:
      '/api/kubernetes/apis/packages.operators.coreos.com/v1/namespaces/openshift-marketplace/packagemanifests/3scale-community-operator/icon?resourceVersion=3scale-community-operator.threescale-2.8.3scale-community-operator.v0.5.1',
    altIcon: 'KNative',
    id: 'serverless-explore',
    name: 'Explore Serverless',
    duration: 5,
    description:
      'Install the Serverless Operator to enable the containers, microservices and functions to run "serverless"',
    prerequisites: ['Release requirement if any', 'installs x number of resources'],
  },
  {
    iconURL:
      '/api/kubernetes/apis/packages.operators.coreos.com/v1/namespaces/openshift-marketplace/packagemanifests/serverless-operator/icon?resourceVersion=serverless-operator.4.3.serverless-operator.v1.7.1',
    altIcon: 'KNative',
    id: 'serverless-applications',
    name: 'Serverless Aplications',
    duration: 10,
    description: 'Learn how to create a serverless application',
    prerequisites: ['Complete "Explore Serverless" tour'],
  },
  {
    iconURL:
      '/api/kubernetes/apis/packages.operators.coreos.com/v1/namespaces/openshift-marketplace/packagemanifests/serverless-operator/icon?resourceVersion=serverless-operator.4.3.serverless-operator.v1.7.1',
    altIcon: 'TKN',
    id: 'pipelines-build',
    name: 'Build Pipelines',
    duration: 15,
    description: 'Release requirement if any installs x number of resources',
    prerequisites: ['Release requirement if any', 'installs x number of resources'],
  },
];

export const mockStatus: Record<string, TourStatus> = {
  'Explore Serverless': { status: GuidedTourStatus.COMPLETE },
  'Serverless Aplications': { status: GuidedTourStatus.IN_PROGRESS, active: true },
  'Build Pipelines': { status: GuidedTourStatus.NOT_STARTED },
};

export const mockPrerequisiteStatus: Record<string, boolean> = {
  'Explore Serverless': false,
  'Serverless Aplications': false,
  'Build Pipelines': true,
};
