import * as _ from 'lodash';
import {
  K8sResourceKind,
  referenceForModel,
  referenceFor,
  modelFor,
  K8sKind,
} from '@console/internal/module/k8s';
import { checkAccess, history } from '@console/internal/components/utils';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import { UNASSIGNED_APPLICATIONS_KEY } from '@console/shared/src/constants';
import { CREATE_APPLICATION_KEY } from '@console/topology/src/const';
import {
  getAppLabels,
  getCommonAnnotations,
} from '@console/dev-console/src/utils/resource-label-utils';
import { Perspective } from '@console/plugin-sdk';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import {
  EventSources,
  EventSourceFormData,
  EventSourceSyncFormData,
  SinkType,
  EventSourceMetaData,
} from '../components/add/import-types';
import { getEventSourceIcon } from './get-knative-icon';
import { getEventSourceCatalogProviderData } from '../catalog/event-source-data';
import { CamelKameletModel } from '../models';
import { CAMEL_K_PROVIDER_ANNOTATION } from '../const';

export const isKnownEventSource = (eventSource: string): boolean =>
  Object.keys(EventSources).includes(eventSource);

export const getEventSourcesDepResource = (formData: EventSourceFormData): K8sResourceKind => {
  const {
    type,
    name,
    apiVersion,
    application: { name: applicationName },
    project: { name: namespace },
    data,
    sinkType,
    sink,
  } = formData;

  const defaultLabel = getAppLabels({ name, applicationName });
  const eventSrcData = data[type];
  const { name: sinkName, kind: sinkKind, apiVersion: sinkApiVersion, uri: sinkUri } = sink;
  const eventSourceResource: K8sResourceKind = {
    apiVersion,
    kind: type,
    metadata: {
      name,
      namespace,
      labels: {
        ...defaultLabel,
      },
      annotations: getCommonAnnotations(),
    },
    spec: {
      ...(eventSrcData && eventSrcData),
      ...(sinkType === SinkType.Resource && sinkName && sinkApiVersion && sinkKind
        ? {
            sink: {
              ref: {
                apiVersion: sinkApiVersion,
                kind: sinkKind,
                name: sinkName,
              },
            },
          }
        : {
            sink: {
              uri: sinkUri,
            },
          }),
    },
  };

  return eventSourceResource;
};

export const getKafkaSourceResource = (sourceFormData: any): K8sResourceKind => {
  const baseResource = getEventSourcesDepResource(sourceFormData.formData);
  const { net } = baseResource.spec;
  baseResource.spec.net = {
    ...net,
    ...(!net.sasl?.enable && { sasl: { user: {}, password: {} } }),
    ...(!net.tls?.enable && { tls: { caCert: {}, cert: {}, key: {} } }),
  };
  return baseResource;
};

export const loadYamlData = (formData: EventSourceSyncFormData) => {
  const {
    formData: {
      project: { name: namespace },
    },
    yamlData,
  } = formData;
  let yamlDataObj = safeYAMLToJS(yamlData);
  const modelData = yamlDataObj && modelFor(referenceFor(yamlDataObj));
  if (yamlDataObj?.metadata && modelData?.namespaced && !yamlDataObj.metadata?.namespace) {
    yamlDataObj = { ...yamlDataObj, metadata: { ...yamlDataObj.metadata, namespace } };
  }
  return yamlDataObj;
};

export const getCatalogEventSourceResource = (
  sourceFormData: EventSourceSyncFormData,
): K8sResourceKind => {
  if (sourceFormData.editorType === EditorType.YAML) {
    return loadYamlData(sourceFormData);
  }
  switch (sourceFormData.formData.type) {
    case EventSources.KafkaSource:
      return getKafkaSourceResource(sourceFormData);
    default:
      return getEventSourcesDepResource(sourceFormData.formData);
  }
};

export const getEventSourceData = (source: string) => {
  const eventSourceData = {
    [EventSources.CronJobSource]: {
      data: '',
      schedule: '',
    },
    [EventSources.PingSource]: {
      jsonData: '',
      schedule: '',
    },
    [EventSources.SinkBinding]: {
      subject: {
        apiVersion: '',
        kind: '',
        selector: {
          matchLabels: {},
        },
      },
    },
    [EventSources.ApiServerSource]: {
      mode: 'Reference',
      serviceAccountName: '',
      resources: [
        {
          apiVersion: '',
          kind: '',
        },
      ],
    },
    [EventSources.KafkaSource]: {
      bootstrapServers: [],
      topics: [],
      consumerGroup: '',
      net: {
        sasl: {
          enable: false,
          user: { secretKeyRef: { name: '', key: '' } },
          password: { secretKeyRef: { name: '', key: '' } },
        },
        tls: {
          enable: false,
          caCert: { secretKeyRef: { name: '', key: '' } },
          cert: { secretKeyRef: { name: '', key: '' } },
          key: { secretKeyRef: { name: '', key: '' } },
        },
      },
    },
    [EventSources.ContainerSource]: {
      template: {
        spec: {
          containers: [
            {
              image: '',
              name: '',
              args: [''],
              env: [],
            },
          ],
        },
      },
    },
  };
  return eventSourceData[source];
};

export const getKameletSourceData = (kameletData: K8sResourceKind) => ({
  source: {
    ref: {
      apiVersion: kameletData.apiVersion,
      kind: kameletData.kind,
      name: kameletData.metadata.name,
    },
    properties: {},
  },
});

export const sanitizeKafkaSourceResource = (formData: EventSourceFormData): EventSourceFormData => {
  const formDataActual = formData.data?.[EventSources.KafkaSource] || {};
  const initialSecretKeyData = { secretKeyRef: { name: '', key: '' } };
  return {
    ...formData,
    data: {
      [EventSources.KafkaSource]: {
        bootstrapServers: Array.isArray(formDataActual.bootstrapServers)
          ? formDataActual.bootstrapServers
          : [],
        topics: Array.isArray(formDataActual.topics) ? formDataActual.topics : [],
        consumerGroup:
          typeof formDataActual.consumerGroup === 'string' ? formDataActual.consumerGroup : '',
        net: {
          sasl: {
            enable:
              typeof formDataActual.net?.sasl?.enable === 'boolean'
                ? formDataActual.net?.sasl?.enable
                : false,
            user:
              typeof formDataActual.net?.sasl?.user === 'object'
                ? { ...initialSecretKeyData, ...formDataActual.net.sasl.user }
                : initialSecretKeyData,
            password:
              typeof formDataActual.net?.sasl?.password === 'object'
                ? { ...initialSecretKeyData, ...formDataActual.net.sasl.password }
                : initialSecretKeyData,
          },
          tls: {
            enable:
              typeof formDataActual.net?.tls?.enable === 'boolean'
                ? formDataActual.net?.tls?.enable
                : false,
            caCert:
              typeof formDataActual.net?.tls?.caCert === 'object'
                ? { ...initialSecretKeyData, ...formDataActual.net.tls.caCert }
                : initialSecretKeyData,
            cert:
              typeof formDataActual.net?.tls?.cert === 'object'
                ? { ...initialSecretKeyData, ...formDataActual.net.tls.cert }
                : initialSecretKeyData,
            key:
              typeof formDataActual.net?.tls?.key === 'object'
                ? { ...initialSecretKeyData, ...formDataActual.net.tls.key }
                : initialSecretKeyData,
          },
        },
      },
    },
  };
};

export const getKameletMetadata = (kamelet: K8sResourceKind): EventSourceMetaData => {
  let normalizedKamelet = {};
  if (kamelet?.kind === CamelKameletModel.kind) {
    const {
      kind,
      metadata: { annotations },
      spec: {
        definition: { title, description },
      },
    } = kamelet;
    const provider = annotations?.[CAMEL_K_PROVIDER_ANNOTATION] || '';
    const iconUrl = getEventSourceIcon(kind, kamelet);
    normalizedKamelet = {
      name: title,
      description,
      provider,
      iconUrl,
    };
  }
  return normalizedKamelet as EventSourceMetaData;
};

export const getEventSourceMetadata = (eventSourceModel: K8sKind, t): EventSourceMetaData => {
  let normalizedSource = {};
  if (eventSourceModel) {
    const { kind, label: name } = eventSourceModel;
    const { description, provider } = getEventSourceCatalogProviderData(kind, t) ?? {};
    normalizedSource = {
      name,
      description,
      provider,
      iconUrl: getEventSourceIcon(referenceForModel(eventSourceModel)),
    };
  }
  return normalizedSource as EventSourceMetaData;
};

export const getEventSourceModelsWithAccess = (
  namespace: string,
  eventSourceModels: K8sKind[],
): Promise<K8sKind>[] => {
  return eventSourceModels.map((model) => {
    const { apiGroup, plural } = model;
    return checkAccess({
      group: apiGroup,
      resource: plural,
      namespace,
      verb: 'create',
    })
      .then((result) => (result.status.allowed ? model : null))
      .catch(() => null);
  });
};

export const getBootstrapServers = (kafkaResources: K8sResourceKind[]) => {
  const servers = [];
  _.forEach(kafkaResources, (kafka) => {
    const listeners = kafka?.status?.listeners;
    _.map(listeners, (l) => {
      servers.push(..._.split(l?.bootstrapServers, ','));
    });
  });
  return servers;
};

export const handleRedirect = (
  project: string,
  perspective: string,
  perspectiveExtensions: Perspective[],
) => {
  const perspectiveData = perspectiveExtensions.find((item) => item.properties.id === perspective);
  const redirectURL = perspectiveData.properties.getImportRedirectURL(project);
  history.push(redirectURL);
};

export const sanitizeSourceToForm = (
  newFormData: K8sResourceKind,
  formDataValues: EventSourceFormData,
  kameletSource?: K8sResourceKind,
) => {
  const specData = newFormData.spec;
  const appGroupName = newFormData.metadata?.labels?.['app.kubernetes.io/part-of'];
  const formData = {
    ...formDataValues,
    application: {
      ...formDataValues.application,
      ...(appGroupName &&
        appGroupName !== formDataValues.application.name && {
          name: appGroupName,
          selectedKey: formDataValues.application.selectedKey ? CREATE_APPLICATION_KEY : '',
        }),
      ...(!appGroupName && {
        name: '',
        selectedKey: UNASSIGNED_APPLICATIONS_KEY,
      }),
    },
    name: newFormData.metadata?.name,
    sinkType: specData?.sink?.ref ? SinkType.Resource : SinkType.Uri,
    sink: {
      apiVersion: specData?.sink?.ref?.apiVersion,
      kind: specData?.sink?.ref?.kind,
      name: specData?.sink?.ref?.name,
      key: `${specData?.sink?.ref?.kind}-${specData?.sink?.ref?.name}`,
      uri: specData?.sink?.uri || '',
    },
    data: {
      [formDataValues.type]: {
        ..._.omit(specData, 'sink'),
      },
      ...(kameletSource && {
        [formDataValues.type]: {
          source: {
            ref: {
              apiVersion: kameletSource.apiVersion,
              kind: kameletSource.kind,
              name: kameletSource.metadata.name,
            },
            properties: specData?.source?.properties,
          },
        },
      }),
    },
  };
  return formDataValues.type === EventSources.KafkaSource
    ? sanitizeKafkaSourceResource(formData)
    : formData;
};
