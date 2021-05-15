import * as React from 'react';
import TaskRunsListPage from '../../taskruns/list-page/TaskRunsListPage';
import { TaskRunKind } from '../../../types';

interface TaskRunsProps {
  obj: TaskRunKind;
}

const TaskRuns: React.FC<TaskRunsProps> = ({ obj }) => (
  <TaskRunsListPage
    showTitle={false}
    selector={{ 'tekton.dev/pipelineRun': obj.metadata.name }}
    showPipelineColumn={false}
    namespace={obj.metadata.namespace}
    hideBadge
  />
);

export default TaskRuns;
