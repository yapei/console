import * as React from 'react';
import { Link } from 'react-router-dom';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { PipelineRun } from '../../../utils/pipeline-augment';
import { PipelineRunModel } from '../../../models';
import { PipelineBars } from './PipelineBars';

export interface LinkedPipelineRunTaskStatusProps {
  pipelineRun: PipelineRun;
}

/**
 * Will attempt to render a link to the log file associated with the pipelineRun if it has the data.
 * If it does not, it'll just render the pipeline status.
 */
const LinkedPipelineRunTaskStatus: React.FC<LinkedPipelineRunTaskStatusProps> = ({
  pipelineRun,
}) => {
  const pipelineStatus = (
    <PipelineBars key={pipelineRun.metadata?.name} pipelinerun={pipelineRun} />
  );

  if (pipelineRun.metadata?.name && pipelineRun.metadata?.namespace) {
    return (
      <Link
        to={`${resourcePathFromModel(
          PipelineRunModel,
          pipelineRun.metadata.name,
          pipelineRun.metadata.namespace,
        )}/logs`}
      >
        {pipelineStatus}
      </Link>
    );
  }

  return pipelineStatus;
};

export default LinkedPipelineRunTaskStatus;
