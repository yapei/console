import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import HorizontalStackedBars from '../../charts/HorizontalStackedBars';
import {
  getTaskStatus,
  runStatus,
  getRunStatusColor,
  PipelineRun,
} from '../../../utils/pipeline-augment';
import TaskStatusToolTip from './TaskStatusTooltip';

export interface PipelineBarProps {
  pipelinerun: PipelineRun;
}

export const PipelineBars: React.FC<PipelineBarProps> = ({ pipelinerun }) => {
  const taskStatus = getTaskStatus(pipelinerun);

  return (
    <Tooltip content={<TaskStatusToolTip taskStatus={taskStatus} />}>
      <HorizontalStackedBars
        height="1em"
        inline
        values={Object.keys(runStatus).map((status) => ({
          color: getRunStatusColor(runStatus[status]).pftoken.value,
          name: status,
          size: taskStatus[runStatus[status]],
        }))}
      />
    </Tooltip>
  );
};
