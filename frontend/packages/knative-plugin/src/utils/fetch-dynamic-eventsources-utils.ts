import * as _ from 'lodash';
import { useEffect } from 'react';
import { coFetch } from '@console/internal/co-fetch';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { K8sKind, kindToAbbr, referenceForModel } from '@console/internal/module/k8s';
import { chart_color_red_300 as knativeEventingColor } from '@patternfly/react-tokens';
import {
  EventSourceContainerModel,
  EventSourceApiServerModel,
  EventSourceSinkBindingModel,
  EventSourceCamelModel,
  EventSourcePingModel,
  EventSourceKafkaModel,
  EventSourceCronJobModel,
} from '../models';

interface EventSourcetData {
  loaded: boolean;
  eventSourceModels: K8sKind[];
}

const eventSourceData: EventSourcetData = {
  loaded: false,
  eventSourceModels: [],
};

// To order sources with known followed by CamelSource and everything else
export const orderedEventSourceModelData = (allModels: K8sKind[]): K8sKind[] => {
  const sortModels = _.orderBy(allModels, ['kind'], ['asc']);
  const knownSourcesList = [
    EventSourceApiServerModel.kind,
    EventSourceContainerModel.kind,
    EventSourceCronJobModel.kind,
    EventSourceKafkaModel.kind,
    EventSourcePingModel.kind,
    EventSourceSinkBindingModel.kind,
  ];
  const knownSourcesCrd = _.filter(sortModels, (model) => knownSourcesList.includes(model.kind));
  const camelSourcesCrd = _.filter(
    sortModels,
    (model) => model?.kind === EventSourceCamelModel.kind,
  );
  const dynamicSourcesCrd = _.filter(
    sortModels,
    (model) => !knownSourcesList.includes(model.kind) && model.kind !== EventSourceCamelModel.kind,
  );
  return [...knownSourcesCrd, ...camelSourcesCrd, ...dynamicSourcesCrd];
};

export const fetchEventSourcesCrd = async () => {
  const url = 'api/console/knative-event-sources';
  try {
    const res = await coFetch(url);
    const resolvedRes = await res.json();
    const allModels = _.reduce(
      resolvedRes?.items,
      (accumulator, crd) => {
        const {
          metadata: { labels },
          spec: {
            group,
            versions,
            names: { kind, plural, singular },
          },
        } = crd;
        const { name: version } = versions?.find((ver) => ver.served && ver.storage);
        if (version) {
          const sourceModel = {
            apiGroup: group,
            apiVersion: version,
            kind,
            plural,
            id: singular,
            label: singular,
            labelPlural: plural,
            abbr: kindToAbbr(kind),
            namespaced: true,
            crd: true,
            color: knativeEventingColor.value,
          };
          const sourceIndex = _.findIndex(accumulator, ['kind', kind]);
          // added check as some sources has multiple entries with deprecated APIgroups
          if (sourceIndex === -1) {
            accumulator.push(sourceModel);
          } else if (!labels?.['eventing.knative.dev/deprecated'] === true) {
            accumulator.splice(sourceIndex, 1, sourceModel);
          }
        }
        return accumulator;
      },
      [],
    );

    eventSourceData.eventSourceModels = orderedEventSourceModelData(allModels);
  } catch (err) {
    // show warning if there is an error fetching the CRDs
    // eslint-disable-next-line no-console
    console.warn('Error fetching CRDs for dynamic event sources', err);
    eventSourceData.eventSourceModels = [];
  }
  eventSourceData.loaded = true;
  return eventSourceData.eventSourceModels;
};

export const useEventSourceModels = (): EventSourcetData => {
  const [modelsData, setModelsData] = useSafetyFirst({ loaded: false, eventSourceModels: [] });
  useEffect(() => {
    if (!eventSourceData.loaded) {
      fetchEventSourcesCrd()
        .then((data) => {
          setModelsData({ loaded: true, eventSourceModels: data });
        })
        .catch((err) => {
          setModelsData({ loaded: true, eventSourceModels: eventSourceData.eventSourceModels });
          // eslint-disable-next-line no-console
          console.warn('Error fetching CRDs for dynamic event sources', err);
        });
    } else {
      setModelsData({ loaded: true, eventSourceModels: eventSourceData.eventSourceModels });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return modelsData;
};

export const getEventSourceModels = (): K8sKind[] => eventSourceData.eventSourceModels;

export const getDynamicEventSourcesResourceList = (namespace: string) => {
  return eventSourceData.eventSourceModels.map((model) => {
    return {
      isList: true,
      kind: referenceForModel(model),
      namespace,
      prop: referenceForModel(model),
      optional: true,
    };
  });
};

export const getDynamicEventSourceModel = (resourceRef: string): K8sKind => {
  return eventSourceData.eventSourceModels.find(
    (model: K8sKind) => referenceForModel(model) === resourceRef,
  );
};

export const getDynamicEventSourcesModelRefs = (): string[] => {
  return eventSourceData.eventSourceModels.map((model: K8sKind) => referenceForModel(model));
};

export const isDynamicEventResourceKind = (resourceRef: string): boolean => {
  const index = eventSourceData.eventSourceModels.findIndex(
    (model: K8sKind) => referenceForModel(model) === resourceRef,
  );
  return index !== -1;
};

export const hideDynamicEventSourceCard = () =>
  eventSourceData.eventSourceModels && eventSourceData.eventSourceModels.length > 0;
