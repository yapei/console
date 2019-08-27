import * as React from 'react';
import { Button } from 'patternfly-react';
import { AddCircleOIcon } from '@patternfly/react-icons';
import {
  ProgressStatus,
  SuccessStatus,
  ErrorStatus,
  Status,
  StatusIconAndText,
} from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { RequireCreatePermission } from '@console/internal/components/utils';
import {
  HOST_STATUS_DISCOVERED,
  HOST_PROGRESS_STATES,
  HOST_ERROR_STATES,
  HOST_SUCCESS_STATES,
  HOST_STATUS_UNDER_MAINTENANCE,
  HOST_STATUS_STARTING_MAINTENANCE,
} from '../constants';
import { BaremetalHostModel } from '../models';
import { getHostErrorMessage } from '../selectors';
import { HostMultiStatus } from './types';
import MaintenancePopover from './maintenance/MaintenancePopover';

// TODO(jtomasek): Update this with onClick handler once add discovered host functionality
// is available
export const AddDiscoveredHostButton: React.FC<{ host: K8sResourceKind }> = (
  { host }, // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  const {
    metadata: { namespace },
  } = host;

  return (
    <RequireCreatePermission model={BaremetalHostModel} namespace={namespace}>
      <Button bsStyle="link">
        <StatusIconAndText icon={<AddCircleOIcon />} title="Add host" />
      </Button>
    </RequireCreatePermission>
  );
};

type BaremetalHostStatusProps = {
  status: HostMultiStatus;
};

const BaremetalHostStatus = ({ status: { status, title, ...props } }: BaremetalHostStatusProps) => {
  const statusTitle = title || status;
  switch (true) {
    case status === HOST_STATUS_DISCOVERED:
      return <AddDiscoveredHostButton host={props.host} />;
    case [HOST_STATUS_STARTING_MAINTENANCE, HOST_STATUS_UNDER_MAINTENANCE].includes(status):
      return (
        <MaintenancePopover title={statusTitle} maintenance={props.maintenance} host={props.host} />
      );
    case HOST_PROGRESS_STATES.includes(status):
      return <ProgressStatus title={statusTitle} />;
    case HOST_ERROR_STATES.includes(status):
      return <ErrorStatus title={statusTitle}>{getHostErrorMessage(props.host)}</ErrorStatus>;
    case HOST_SUCCESS_STATES.includes(status):
      return <SuccessStatus title={statusTitle} />;
    default:
      return <Status status={status} title={statusTitle} />;
  }
};

export default BaremetalHostStatus;
