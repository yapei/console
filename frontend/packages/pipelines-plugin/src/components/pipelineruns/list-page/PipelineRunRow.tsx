import * as React from 'react';
import { TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { ResourceLink, Timestamp } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { pipelineRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { getPipelineRunKebabActions } from '../../../utils/pipeline-actions';
import { pipelineRunDuration } from '../../../utils/pipeline-utils';
import { PipelineRunKind } from '../../../types';
import { PipelineRunModel } from '../../../models';
import LinkedPipelineRunTaskStatus from '../status/LinkedPipelineRunTaskStatus';
import { ResourceKebabWithUserLabel } from '../triggered-by';
import { tableColumnClasses } from './pipelinerun-table';
import PipelineRunStatus from '../status/PipelineRunStatus';

const pipelinerunReference = referenceForModel(PipelineRunModel);

type PLRStatusProps = {
  obj: PipelineRunKind;
};

const PLRStatus: React.FC<PLRStatusProps> = ({ obj }) => {
  return (
    <PipelineRunStatus
      status={pipelineRunFilterReducer(obj)}
      title={pipelineRunFilterReducer(obj)}
      pipelineRun={obj}
    />
  );
};

const PipelineRunRow: RowFunction<PipelineRunKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={pipelinerunReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
          data-test-id={obj.metadata.name}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <PLRStatus obj={obj} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <LinkedPipelineRunTaskStatus pipelineRun={obj} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={obj.status && obj.status.startTime} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>{pipelineRunDuration(obj)}</TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebabWithUserLabel
          actions={getPipelineRunKebabActions()}
          kind={pipelinerunReference}
          resource={obj}
        />
      </TableData>
    </TableRow>
  );
};

export default PipelineRunRow;
