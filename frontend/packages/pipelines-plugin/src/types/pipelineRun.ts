import { K8sResourceCommon, ObjectMetadata } from '@console/internal/module/k8s';
import { PipelineKind, PipelineSpec } from './pipeline';

export type PLRTaskRunStep = {
  container: string;
  imageID: string;
  name: string;
  terminated?: {
    containerID: string;
    exitCode: number;
    finishedAt: string;
    reason: string;
    startedAt: string;
  };
};

export type PLRTaskRunData = {
  pipelineTaskName: string;
  status: {
    completionTime?: string;
    conditions: Condition[];
    /** Can be empty */
    podName: string;
    startTime: string;
    steps?: PLRTaskRunStep[];
  };
};

export type PLRTaskRuns = {
  [taskRunName: string]: PLRTaskRunData;
};

export type VolumeTypeSecret = {
  secretName: string;
  items?: {
    key: string;
    path: string;
  }[];
};

export type VolumeTypeConfigMaps = {
  name: string;
  items?: {
    key: string;
    path: string;
  }[];
};

export type VolumeTypePVC = {
  claimName: string;
};

export type PersistentVolumeClaimType = {
  persistentVolumeClaim: VolumeTypePVC;
};

export type VolumeClaimTemplateType = {
  volumeClaimTemplate: VolumeTypeClaim;
};
export type VolumeTypeClaim = {
  metadata: ObjectMetadata;
  spec: {
    accessModes: string[];
    resources: {
      requests: {
        storage: string;
      };
    };
  };
};

export type Condition = {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
};

export type PipelineRunInlineResourceParam = { name: string; value: string };
export type PipelineRunInlineResource = {
  name: string;
  resourceSpec: {
    params: PipelineRunInlineResourceParam[];
    type: string;
  };
};
export type PipelineRunReferenceResource = {
  name: string;
  resourceRef: {
    name: string;
  };
};
export type PipelineRunResource = PipelineRunReferenceResource | PipelineRunInlineResource;

export type PipelineRunWorkspace = {
  name: string;
  [volumeType: string]:
    | VolumeTypeSecret
    | VolumeTypeConfigMaps
    | VolumeTypePVC
    | VolumeTypeClaim
    | {};
};

export type PipelineRunParam = {
  name: string;
  value: string | string[];

  // TODO: To be validated
  input?: string;
  output?: string;
  resource?: object;
};

export type PipelineRunKind = K8sResourceCommon & {
  spec: {
    pipelineRef?: { name: string };
    pipelineSpec?: PipelineSpec;
    params?: PipelineRunParam[];
    workspaces?: PipelineRunWorkspace[];
    resources?: PipelineRunResource[];
    serviceAccountName?: string;
    timeout?: string;
    // Only used in a single case - cancelling a pipeline; should not be copied between PLRs
    status?: 'PipelineRunCancelled';
  };
  status?: {
    succeededCondition?: string;
    creationTimestamp?: string;
    conditions?: Condition[];
    startTime?: string;
    completionTime?: string;
    taskRuns?: PLRTaskRuns;
    pipelineSpec: PipelineSpec;
    skippedTasks?: {
      name: string;
    }[];
  };
};

export type PipelineWithLatest = PipelineKind & {
  latestRun?: PipelineRunKind;
};
