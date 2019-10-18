import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { runFilters } from '../pipelines/PipelineRuns';
import { PipelineRunModel } from '../../models';
import PipelineRunsList from './PipelineRunList';

interface PipelineRunResourceListProps {
  namespace: string;
}

const PipelineRunResourceList: React.FC<PipelineRunResourceListProps> = ({ namespace }) => (
  <ListPage
    showTitle
    canCreate={false}
    kind={referenceForModel(PipelineRunModel)}
    namespace={namespace}
    ListComponent={PipelineRunsList}
    rowFilters={runFilters}
  />
);

export default PipelineRunResourceList;
