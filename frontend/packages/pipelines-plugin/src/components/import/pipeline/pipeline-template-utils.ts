import * as _ from 'lodash';
import { k8sCreate, k8sUpdate } from '@console/internal/module/k8s';
import { PipelineData } from '../import-types';
import { PIPELINE_RUNTIME_LABEL } from '../../../const';
import { PipelineModel } from '../../../models';
import { PipelineKind, PipelineRunKind, PipelineWorkspace, TektonParam } from '../../../types';
import { createPipelineResource } from '../../pipelines/pipeline-resource/pipelineResource-utils';
import {
  convertPipelineToModalData,
  getDefaultVolumeClaimTemplate,
} from '../../pipelines/modals/common/utils';
import { submitStartPipeline } from '../../pipelines/modals/start-pipeline/submit-utils';
import { StartPipelineFormValues } from '../../pipelines/modals/start-pipeline/types';

const getImageUrl = (name: string, namespace: string) => {
  return `image-registry.openshift-image-registry.svc:5000/${namespace}/${name}`;
};

export const createGitResource = (url: string, namespace: string, ref: string = 'master') => {
  const params = { url, revision: ref };
  return createPipelineResource(params, 'git', namespace);
};

export const createImageResource = (name: string, namespace: string) => {
  const params = {
    url: getImageUrl(name, namespace),
  };

  return createPipelineResource(params, 'image', namespace);
};

export const getPipelineParams = (
  params: TektonParam[],
  name: string,
  namespace: string,
  gitUrl: string,
  gitRef: string,
  gitDir: string,
  dockerfilePath: string,
) => {
  return params.map((param) => {
    switch (param.name) {
      case 'APP_NAME':
        return { ...param, default: name };
      case 'GIT_REPO':
        return { ...param, default: gitUrl };
      case 'GIT_REVISION':
        return { ...param, default: gitRef || 'master' };
      case 'PATH_CONTEXT':
        return { ...param, default: gitDir.replace(/^\//, '') || param.default };
      case 'IMAGE_NAME':
        return { ...param, default: getImageUrl(name, namespace) };
      case 'DOCKERFILE':
        return { ...param, default: dockerfilePath };
      default:
        return param;
    }
  });
};

export const createPipelineForImportFlow = async (
  name: string,
  namespace: string,
  gitUrl: string,
  gitRef: string,
  gitDir: string,
  pipeline: PipelineData,
  dockerfilePath: string,
) => {
  const template = _.cloneDeep(pipeline.template);

  template.metadata = {
    name: `${name}`,
    namespace,
    labels: { ...template.metadata?.labels, 'app.kubernetes.io/instance': name },
  };

  template.spec.params =
    template.spec.params &&
    getPipelineParams(
      template.spec.params,
      name,
      namespace,
      gitUrl,
      gitRef,
      gitDir,
      dockerfilePath,
    );

  return k8sCreate(PipelineModel, template, { ns: namespace });
};

export const createPipelineRunForImportFlow = async (
  pipeline: PipelineKind,
): Promise<PipelineRunKind> => {
  const pipelineInitialValues: StartPipelineFormValues = {
    ...convertPipelineToModalData(pipeline),
    workspaces: (pipeline.spec.workspaces || []).map((workspace: PipelineWorkspace) => ({
      ...workspace,
      type: 'volumeClaimTemplate',
      data: getDefaultVolumeClaimTemplate(pipeline?.metadata?.name),
    })),
    secretOpen: false,
  };
  return submitStartPipeline(pipelineInitialValues, pipeline);
};

export const updatePipelineForImportFlow = async (
  pipeline: PipelineKind,
  template: PipelineKind,
  name: string,
  namespace: string,
  gitUrl: string,
  gitRef: string,
  gitDir: string,
  dockerfilePath: string,
): Promise<PipelineKind> => {
  let updatedPipeline = _.cloneDeep(pipeline);

  if (!template) {
    updatedPipeline.metadata.labels = _.omit(
      updatedPipeline.metadata.labels,
      'app.kubernetes.io/instance',
    );
  } else {
    if (
      template.metadata?.labels[PIPELINE_RUNTIME_LABEL] !==
      pipeline.metadata?.labels[PIPELINE_RUNTIME_LABEL]
    ) {
      updatedPipeline = _.cloneDeep(template);
      updatedPipeline.metadata = {
        resourceVersion: pipeline.metadata.resourceVersion,
        name: `${name}`,
        namespace,
        labels: { ...template.metadata?.labels, 'app.kubernetes.io/instance': name },
      };
    }

    updatedPipeline.spec.params = getPipelineParams(
      template.spec.params,
      name,
      namespace,
      gitUrl,
      gitRef,
      gitDir,
      dockerfilePath,
    );
  }
  return k8sUpdate(PipelineModel, updatedPipeline, namespace, name);
};
