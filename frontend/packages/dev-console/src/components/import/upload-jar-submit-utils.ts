import * as _ from 'lodash';
import { k8sCreate, K8sResourceKind, k8sUpdate, K8sVerb } from '@console/internal/module/k8s';
import {
  ServiceModel,
  RouteModel,
  BuildConfigModel,
  ImageStreamModel,
  DeploymentModel,
  DeploymentConfigModel,
} from '@console/internal/models';
import { coFetch } from '@console/internal/co-fetch';
import { getKnativeServiceDepResource } from '@console/knative-plugin/src/utils/create-knative-utils';
import { ServiceModel as KnServiceModel } from '@console/knative-plugin';
import { createProject, createWebhookSecret } from './import-submit-utils';
import {
  getAppLabels,
  getCommonAnnotations,
  getPodLabels,
  getTemplateLabels,
  getTriggerAnnotation,
  mergeData,
} from '../../utils/resource-label-utils';
import { Resources, UploadJarFormData } from './import-types';
import { createRoute, createService, dryRunOpt } from '../../utils/shared-submit-utils';
import { getProbesData } from '../health-checks/create-health-checks-probe-utils';
import { AppResources } from '../edit-application/edit-application-types';

const createOrUpdateDeployment = (
  formData: UploadJarFormData,
  imageStream: K8sResourceKind,
  dryRun: boolean,
  originalDeployment?: K8sResourceKind,
  verb: K8sVerb = 'create',
): Promise<K8sResourceKind> => {
  const {
    name,
    project: { name: namespace },
    application: { name: applicationName },
    image: { ports, tag: selectedTag },
    deployment: {
      env,
      replicas,
      triggers: { image: imageChange },
    },
    fileUpload: { javaArgs },
    labels: userLabels,
    limits: { cpu, memory },
    healthChecks,
    runtimeIcon,
  } = formData;

  const imageStreamName = imageStream && imageStream.metadata.name;
  const defaultLabels = getAppLabels({
    name,
    applicationName,
    imageStreamName,
    runtimeIcon,
    selectedTag,
  });
  const imageName = name;
  const annotations = {
    ...getCommonAnnotations(),
    'alpha.image.policy.openshift.io/resolve-names': '*',
    ...getTriggerAnnotation(name, imageName, namespace, imageChange),
  };
  const podLabels = getPodLabels(name);
  const templateLabels = getTemplateLabels(originalDeployment);

  const newDeployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations,
    },
    spec: {
      selector: {
        matchLabels: {
          app: name,
        },
      },
      replicas,
      template: {
        metadata: {
          labels: { ...templateLabels, ...userLabels, ...podLabels },
        },
        spec: {
          containers: [
            {
              name,
              image: `${name}:latest`,
              ports,
              env: javaArgs ? [...env, { name: 'JAVA_ARGS', value: javaArgs }] : env,
              resources: {
                ...((cpu.limit || memory.limit) && {
                  limits: {
                    ...(cpu.limit && { cpu: `${cpu.limit}${cpu.limitUnit}` }),
                    ...(memory.limit && { memory: `${memory.limit}${memory.limitUnit}` }),
                  },
                }),
                ...((cpu.request || memory.request) && {
                  requests: {
                    ...(cpu.request && { cpu: `${cpu.request}${cpu.requestUnit}` }),
                    ...(memory.request && { memory: `${memory.request}${memory.requestUnit}` }),
                  },
                }),
              },
              ...getProbesData(healthChecks),
            },
          ],
        },
      },
    },
  };
  const deployment = mergeData(originalDeployment, newDeployment);

  return verb === 'update'
    ? k8sUpdate(DeploymentModel, deployment)
    : k8sCreate(DeploymentModel, deployment, dryRun ? dryRunOpt : {});
};

const createOrUpdateDeploymentConfig = (
  formData: UploadJarFormData,
  imageStream: K8sResourceKind,
  dryRun: boolean,
  originalDeploymentConfig?: K8sResourceKind,
  verb: K8sVerb = 'create',
): Promise<K8sResourceKind> => {
  const {
    name,
    project: { name: namespace },
    application: { name: applicationName },
    image: { ports, tag: selectedTag },
    deployment: { env, replicas, triggers },
    fileUpload: { javaArgs },
    labels: userLabels,
    limits: { cpu, memory },
    healthChecks,
  } = formData;

  const imageStreamName = imageStream && imageStream.metadata.name;
  const defaultLabels = getAppLabels({ name, applicationName, imageStreamName, selectedTag });
  const defaultAnnotations = { ...getCommonAnnotations() };
  const podLabels = getPodLabels(name);
  const templateLabels = getTemplateLabels(originalDeploymentConfig);

  const newDeploymentConfig = {
    apiVersion: 'apps.openshift.io/v1',
    kind: 'DeploymentConfig',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: defaultAnnotations,
    },
    spec: {
      selector: podLabels,
      replicas,
      template: {
        metadata: {
          labels: { ...templateLabels, ...userLabels, ...podLabels },
        },
        spec: {
          containers: [
            {
              name,
              image: `${name}:latest`,
              ports,
              env: javaArgs ? [...env, { name: 'JAVA_ARGS', value: javaArgs }] : env,
              resources: {
                ...((cpu.limit || memory.limit) && {
                  limits: {
                    ...(cpu.limit && { cpu: `${cpu.limit}${cpu.limitUnit}` }),
                    ...(memory.limit && { memory: `${memory.limit}${memory.limitUnit}` }),
                  },
                }),
                ...((cpu.request || memory.request) && {
                  requests: {
                    ...(cpu.request && { cpu: `${cpu.request}${cpu.requestUnit}` }),
                    ...(memory.request && { memory: `${memory.request}${memory.requestUnit}` }),
                  },
                }),
              },
              ...getProbesData(healthChecks),
            },
          ],
        },
      },
      triggers: [
        {
          type: 'ImageChange',
          imageChangeParams: {
            automatic: triggers.image,
            containerNames: [name],
            from: {
              kind: 'ImageStreamTag',
              name: `${name}:latest`,
            },
          },
        },
        ...(triggers.config ? [{ type: 'ConfigChange' }] : []),
      ],
    },
  };
  const deploymentConfig = mergeData(originalDeploymentConfig, newDeploymentConfig);

  return verb === 'update'
    ? k8sUpdate(DeploymentConfigModel, deploymentConfig)
    : k8sCreate(DeploymentConfigModel, deploymentConfig, dryRun ? dryRunOpt : {});
};

export const createOrUpdateImageStream = (
  formData: UploadJarFormData,
  imageStreamData: K8sResourceKind,
  dryRun: boolean,
  imageStreamList: K8sResourceKind[],
  verb: K8sVerb = 'create',
  generatedImageStreamName: string = '',
): Promise<K8sResourceKind> => {
  const imageStreamFilterData = _.orderBy(imageStreamList, ['metadata.resourceVersion'], ['desc']);
  const originalImageStream = (imageStreamFilterData.length && imageStreamFilterData[0]) || {};
  const {
    name,
    project: { name: namespace },
    application: { name: applicationName },
    labels: userLabels,
    image: { tag: selectedTag },
  } = formData;
  const imageStreamName = imageStreamData && imageStreamData.metadata.name;
  const defaultLabels = getAppLabels({ name, applicationName, imageStreamName, selectedTag });
  const defaultAnnotations = { ...getCommonAnnotations() };
  const newImageStream = {
    apiVersion: 'image.openshift.io/v1',
    kind: 'ImageStream',
    metadata: {
      name: `${generatedImageStreamName || name}`,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: defaultAnnotations,
    },
  };
  const imageStream = mergeData(originalImageStream, newImageStream);
  return verb === 'update'
    ? k8sUpdate(ImageStreamModel, imageStream)
    : k8sCreate(ImageStreamModel, newImageStream, dryRun ? dryRunOpt : {});
};

export const createOrUpdateBuildConfig = (
  formData: UploadJarFormData,
  imageStream: K8sResourceKind,
  dryRun: boolean,
  originalBuildConfig?: K8sResourceKind,
  verb: K8sVerb = 'create',
  generatedImageStreamName: string = '',
): Promise<K8sResourceKind> => {
  const {
    name,
    project: { name: namespace },
    application: { name: applicationName },
    image: { tag: selectedTag },
    build: { env, strategy: buildStrategy },
    labels: userLabels,
  } = formData;

  const imageStreamName = imageStream && imageStream.metadata.name;
  const imageStreamNamespace = imageStream && imageStream.metadata.namespace;

  const defaultLabels = getAppLabels({ name, applicationName, imageStreamName, selectedTag });
  const defaultAnnotations = { ...getCommonAnnotations() };
  const buildStrategyData = {
    sourceStrategy: {
      env,
      from: {
        kind: 'ImageStreamTag',
        name: `${imageStreamName}:${selectedTag}`,
        namespace: imageStreamNamespace,
      },
    },
  };

  const newBuildConfig = {
    apiVersion: 'build.openshift.io/v1',
    kind: 'BuildConfig',
    metadata: {
      name,
      namespace,
      labels: { ...defaultLabels, ...userLabels },
      annotations: defaultAnnotations,
    },
    spec: {
      output: {
        to: {
          kind: 'ImageStreamTag',
          name: `${generatedImageStreamName || name}:latest`,
        },
      },
      source: {
        type: 'Binary',
        binary: {},
      },
      strategy: {
        type: buildStrategy,
        ...buildStrategyData,
      },
      triggers: [
        {
          type: 'Generic',
          generic: {
            secretReference: { name: `${name}-generic-webhook-secret` },
          },
        },
      ],
    },
  };

  const buildConfig = mergeData(originalBuildConfig, newBuildConfig);

  return verb === 'update'
    ? k8sUpdate(BuildConfigModel, buildConfig)
    : k8sCreate(BuildConfigModel, buildConfig, dryRun ? dryRunOpt : {});
};

export const instantiateBinaryBuild = (
  namespace: string,
  buildConfigName: string,
  filename: string,
  value: File,
) =>
  coFetch(
    `/api/kubernetes/apis/build.openshift.io/v1/namespaces/${namespace}/buildconfigs/${buildConfigName}/instantiatebinary?asFile=${filename}`,
    {
      method: 'POST',
      body: value,
      headers: {
        'Content-type': value.type,
      },
    },
    0,
  );

export const createOrUpdateJarFile = async (
  formData: UploadJarFormData,
  imageStream: K8sResourceKind,
  createNewProject?: boolean,
  dryRun: boolean = false,
  verb: K8sVerb = 'create',
  appResources?: AppResources,
): Promise<K8sResourceKind[]> => {
  const {
    name,
    fileUpload: { name: fileName, value: fileValue },
    project: { name: namespace },
    route: { create: canCreateRoute, disable },
    image: { ports },
    build: { strategy: buildStrategy },
    deployment: {
      triggers: { image: imageChange },
    },
    resources,
  } = formData;
  const {
    imageStream: appResImageStream,
    buildConfig: appResBuildConfig,
    editAppResource,
    service: appResService,
    route: appResRoute,
  } = appResources || {};

  const imageStreamName = imageStream?.metadata.name;

  createNewProject && (await createProject(formData.project));

  const responses: K8sResourceKind[] = [];
  const generatedImageStreamName: string = '';

  const imageStreamResponse = await createOrUpdateImageStream(
    formData,
    imageStream,
    dryRun,
    appResImageStream?.data,
    verb,
  );
  responses.push(imageStreamResponse);

  const buildConfigResponse = await createOrUpdateBuildConfig(
    formData,
    imageStream,
    dryRun,
    appResBuildConfig?.data,
    verb,
    generatedImageStreamName,
  );

  buildConfigResponse &&
    !dryRun &&
    instantiateBinaryBuild(
      namespace,
      buildConfigResponse.metadata.name,
      fileName,
      fileValue as File,
    );

  responses.push(buildConfigResponse);

  if (verb === 'create') {
    responses.push(await createWebhookSecret(formData, 'generic', dryRun));
  }

  if (resources === Resources.KnativeService) {
    // knative service doesn't have dry run capability so returning the promises.
    if (dryRun) {
      return responses;
    }
    const imageStreamURL = imageStreamResponse.status.dockerImageRepository;

    const originalAnnotations = editAppResource?.data?.metadata?.annotations || {};
    const triggerAnnotations = getTriggerAnnotation(
      name,
      generatedImageStreamName || name,
      namespace,
      imageChange,
    );
    const annotations = {
      ...originalAnnotations,
      ...triggerAnnotations,
    };
    const knDeploymentResource = getKnativeServiceDepResource(
      formData,
      imageStreamURL,
      imageStreamName,
      undefined,
      undefined,
      annotations,
      editAppResource?.data,
      formData.fileUpload,
    );
    return Promise.all([
      verb === 'update'
        ? k8sUpdate(KnServiceModel, knDeploymentResource)
        : k8sCreate(KnServiceModel, knDeploymentResource),
    ]);
  }
  if (resources === Resources.Kubernetes) {
    responses.push(
      await createOrUpdateDeployment(formData, imageStream, dryRun, editAppResource?.data, verb),
    );
  } else if (resources === Resources.OpenShift) {
    responses.push(
      await createOrUpdateDeploymentConfig(
        formData,
        imageStream,
        dryRun,
        editAppResource?.data,
        verb,
      ),
    );
  }

  if (!_.isEmpty(ports) || buildStrategy === 'Source') {
    const originalService = appResService?.data;
    const service = createService(formData, imageStream, originalService);

    if (verb === 'create') {
      responses.push(await k8sCreate(ServiceModel, service, dryRun ? dryRunOpt : {}));
    } else if (verb === 'update' && !_.isEmpty(originalService)) {
      responses.push(await k8sUpdate(ServiceModel, service));
    }

    const originalRoute = appResRoute?.data;
    const route = createRoute(formData, imageStream, originalRoute);
    if (verb === 'update' && disable) {
      responses.push(await k8sUpdate(RouteModel, route, namespace, name));
    } else if (canCreateRoute) {
      responses.push(await k8sCreate(RouteModel, route, dryRun ? dryRunOpt : {}));
    }
  }

  return responses;
};
