import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { pipelineRunStatus } from '../../utils/pipeline-filter-reducer';
import { PipelineRunDetails } from './PipelineRunDetails';
import { PipelineRunLogsWithActiveTask } from './PipelineRunLogs';

const PipelineRunDetailsPage: React.FC<DetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    getResourceStatus={pipelineRunStatus}
    pages={[
      navFactory.details(PipelineRunDetails),
      navFactory.editYaml(),
      {
        href: 'logs',
        path: 'logs/:name?',
        name: 'Logs',
        component: PipelineRunLogsWithActiveTask,
      },
    ]}
  />
);

export default PipelineRunDetailsPage;
