import { getRandomChars } from '@console/shared';
import { apiVersionForModel, k8sCreate, RouteKind } from '@console/internal/module/k8s';
import { RouteModel } from '@console/internal/models';
import { EventListenerModel, TriggerModel, TriggerTemplateModel } from '../../../../models';
import { PipelineKind, PipelineRunKind } from '../../../../types';
import { PIPELINE_SERVICE_ACCOUNT } from '../../const';
import { getPipelineOperatorVersion } from '../../utils/pipeline-operator';
import {
  EventListenerKind,
  EventListenerKindBindingReference,
  TriggerBindingKind,
  TriggerKind,
  TriggerTemplateKind,
  TriggerTemplateKindParam,
} from '../../resource-types';

export const createTriggerTemplate = (
  pipeline: PipelineKind,
  pipelineRun: PipelineRunKind,
  params: TriggerTemplateKindParam[],
): TriggerTemplateKind => {
  return {
    apiVersion: apiVersionForModel(TriggerTemplateModel),
    kind: TriggerTemplateModel.kind,
    metadata: {
      name: `trigger-template-${pipeline.metadata.name}-${getRandomChars()}`,
    },
    spec: {
      params,
      resourcetemplates: [pipelineRun],
    },
  };
};

export const dryRunTriggerResource = (trigger: TriggerKind): Promise<boolean> =>
  k8sCreate(TriggerModel, trigger, {
    ns: trigger.metadata?.namespace,
    queryParams: { dryRun: 'All' },
  })
    .then(() => true)
    .catch((e) => e?.response?.status !== 404);

export const createTrigger = (
  namespace: string,
  triggerTemplateRef: string,
  triggerBindings: TriggerBindingKind[],
): TriggerKind => ({
  apiVersion: apiVersionForModel(TriggerModel),
  kind: TriggerModel.kind,
  metadata: {
    name: `trigger-${getRandomChars()}`,
    namespace,
  },
  spec: {
    serviceAccountName: PIPELINE_SERVICE_ACCOUNT,
    bindings: triggerBindings.map((tb) => ({
      kind: tb.kind,
      ref: tb.metadata.name,
    })),
    template: {
      ref: triggerTemplateRef,
    },
  },
});

export const createEventListenerWithTrigger = (triggerRef: string): EventListenerKind => ({
  apiVersion: apiVersionForModel(EventListenerModel),
  kind: EventListenerModel.kind,
  metadata: {
    name: `event-listener-${getRandomChars()}`,
  },
  spec: {
    serviceAccountName: PIPELINE_SERVICE_ACCOUNT,
    triggers: [
      {
        triggerRef,
      },
    ],
  },
});

export const createEventListener = async (
  namespace: string,
  triggerBindings: TriggerBindingKind[],
  triggerTemplate: TriggerTemplateKind,
): Promise<EventListenerKind> => {
  const pipelineOperatorVersion = await getPipelineOperatorVersion(namespace);

  const mapTriggerBindings: (
    triggerBinding: TriggerBindingKind,
  ) => EventListenerKindBindingReference = (triggerBinding: TriggerBindingKind) => {
    // The Tekton CRD `EventListeners` before Tekton Triggers 0.5 requires a name
    // instead of a ref here to link `TriggerBinding` or `ClusterTriggerBinding`.
    if (
      pipelineOperatorVersion?.major === 0 ||
      (pipelineOperatorVersion?.major === 1 && pipelineOperatorVersion?.minor === 0)
    ) {
      return {
        kind: triggerBinding.kind,
        name: triggerBinding.metadata.name,
      } as EventListenerKindBindingReference;
    }
    return {
      kind: triggerBinding.kind,
      ref: triggerBinding.metadata.name,
    };
  };

  return {
    apiVersion: apiVersionForModel(EventListenerModel),
    kind: EventListenerModel.kind,
    metadata: {
      name: `event-listener-${getRandomChars()}`,
    },
    spec: {
      serviceAccountName: PIPELINE_SERVICE_ACCOUNT,
      triggers: [
        {
          bindings: triggerBindings.map(mapTriggerBindings),
          template: { name: triggerTemplate.metadata.name },
        },
      ],
    },
  };
};

export const createEventListenerRoute = (
  eventListener: EventListenerKind,
  generatedName?: string,
  targetPort: number = 8080,
): RouteKind => {
  const eventListenerName = eventListener.metadata.name;
  // Not ideal, but if all else fails, we can do our best guess
  const referenceName = generatedName || `el-${eventListenerName}`;

  return {
    apiVersion: apiVersionForModel(RouteModel),
    kind: RouteModel.kind,
    metadata: {
      name: referenceName,
      labels: {
        'app.kubernetes.io/managed-by': EventListenerModel.kind,
        'app.kubernetes.io/part-of': 'Triggers',
        eventlistener: eventListenerName,
      },
    },
    spec: {
      port: {
        targetPort,
      },
      to: {
        kind: 'Service',
        name: referenceName,
        weight: 100,
      },
    },
  };
};
