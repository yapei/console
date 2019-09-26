import * as React from 'react';
import { FireMan_ as FireMan } from '@console/internal/components/factory';
import { Firehose } from '@console/internal/components/utils';
import { DevPreviewBadge } from '@console/shared';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineModel } from '../../models';
import DefaultPage from '../DefaultPage';
import { filters } from './PipelineAugmentRuns';
import PipelineAugmentRunsWrapper from './PipelineAugmentRunsWrapper';

interface PipelinesPageProps {
  namespace: string;
}

const PipelinesPage: React.FC<PipelinesPageProps> = ({ namespace }) => {
  const resources = [
    {
      isList: true,
      kind: referenceForModel(PipelineModel),
      namespace,
      prop: PipelineModel.id,
      filters: { ...filters },
    },
  ];
  return namespace ? (
    <FireMan
      canCreate={false}
      canExpand={false}
      filterLabel="by name"
      textFilter="name"
      resources={resources}
      title={PipelineModel.labelPlural}
      badge={<DevPreviewBadge />}
    >
      <Firehose resources={resources}>
        <PipelineAugmentRunsWrapper />
      </Firehose>
    </FireMan>
  ) : (
    <DefaultPage title="Pipelines" badge={<DevPreviewBadge />}>
      Select a project to view the list of pipelines
    </DefaultPage>
  );
};

export default PipelinesPage;
