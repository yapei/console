import * as React from 'react';

import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '@console/shared';
import { getAlertSeverity, getAlertMessage, getAlertDescription } from './';
import { Alert } from '../../monitoring';

const getSeverityIcon = (severity: string) => {
  let icon;
  switch (severity) {
    case 'critical':
      icon = <RedExclamationCircleIcon />;
      break;
    case 'warning':
    default:
      icon = <YellowExclamationTriangleIcon />;
  }
  return <div className="co-dashboard-icon">{icon}</div>;
};

export const AlertItem: React.FC<AlertItemProps> = ({ alert }) => {
  return (
    <div className="co-health-card__alerts-item">
      {getSeverityIcon(getAlertSeverity(alert))}
      <span className="co-health-card__text">{getAlertDescription(alert) || getAlertMessage(alert)}</span>
    </div>
  );
};

type AlertItemProps = {
  alert: Alert;
};
