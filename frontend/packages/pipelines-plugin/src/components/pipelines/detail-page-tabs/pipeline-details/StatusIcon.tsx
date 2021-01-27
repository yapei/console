import * as React from 'react';
import * as cx from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  AngleDoubleRightIcon,
  BanIcon,
  CheckCircleIcon,
  CircleIcon,
  ExclamationCircleIcon,
  HourglassHalfIcon,
  SyncAltIcon,
} from '@patternfly/react-icons';
import { getRunStatusColor, runStatus } from '../../../../utils/pipeline-augment';

import './StatusIcon.scss';

interface StatusIconProps {
  status: string;
  height?: number;
  width?: number;
  shiftOrigin?: boolean;
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status, shiftOrigin, ...props }) => {
  switch (status) {
    case runStatus['In Progress']:
    case runStatus.Running:
      return (
        <SyncAltIcon
          {...props}
          className={cx('fa-spin', { 'pipeline-status-icon--spin': shiftOrigin })}
        />
      );

    case runStatus.Succeeded:
      return <CheckCircleIcon {...props} />;

    case runStatus.Failed:
      return <ExclamationCircleIcon {...props} />;

    case runStatus.Idle:
    case runStatus.Pending:
      return <HourglassHalfIcon {...props} />;

    case runStatus.Cancelled:
      return <BanIcon {...props} />;

    case runStatus.Skipped:
      return <AngleDoubleRightIcon {...props} />;

    default:
      return <CircleIcon {...props} />;
  }
};

export const ColoredStatusIcon: React.FC<StatusIconProps> = ({ status, ...others }) => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        color: status
          ? getRunStatusColor(status, t).pftoken.value
          : getRunStatusColor(runStatus.Cancelled, t).pftoken.value,
      }}
    >
      <StatusIcon status={status} {...others} />
    </div>
  );
};
