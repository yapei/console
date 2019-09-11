import * as React from 'react';
import { inject } from '@console/internal/components/utils';
import { K8sKind } from '@console/internal/module/k8s';
import { augmentRunsToData, PropPipelineData, KeyedRuns } from '../../utils/pipeline-augment';
import { pipelineFilterReducer, pipelineStatusFilter } from '../../utils/pipeline-filter-reducer';

interface ListPipelineData extends K8sKind {
  data: PropPipelineData[];
}
export const filters = [
  {
    type: 'pipeline-status',
    selected: ['Running', 'Failed', 'Succeeded'],
    reducer: pipelineFilterReducer,
    items: [
      { id: 'Running', title: 'Running' },
      { id: 'Failed', title: 'Failed' },
      { id: 'Succeeded', title: 'Succeeded' },
    ],
    filter: pipelineStatusFilter,
  },
];

export type PipelineAugmentRunsProps = {
  data?: PropPipelineData[];
  propsReferenceForRuns?: string[];
  pipeline?: ListPipelineData;
  reduxIDs?: string[];
  applyFilter?: () => void;
  filters?: Record<string, any>[];
};
// Firehose injects a lot of props and some of those are considered the KeyedRuns
const PipelineAugmentRuns: React.FC<PipelineAugmentRunsProps> = ({
  propsReferenceForRuns,
  ...props
}) => {
  const resourceData =
    props.pipeline && props.pipeline.data && propsReferenceForRuns
      ? augmentRunsToData(props.pipeline.data, propsReferenceForRuns, props as KeyedRuns)
      : null;

  const children = inject(props.children, {
    ...props,
    resources: { pipeline: { data: resourceData } },
  });
  return <React.Fragment>{children}</React.Fragment>;
};

export default PipelineAugmentRuns;
