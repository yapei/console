import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import { Alert } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { getActivePerspective } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { fromNow } from '@console/internal/components/utils/datetime';
import { Alert as AlertType } from '@console/internal/components/monitoring/types';
import { labelsToParams } from '@console/internal/components/monitoring/utils';
import { sortMonitoringAlerts } from '@console/shared';
import { getAlertType } from './monitoring-overview-alerts-utils';
import './MonitoringOverviewAlerts.scss';

interface MonitoringOverviewAlertsProps {
  alerts: AlertType[];
}

interface StateProps {
  activePerspective?: string;
}

const MonitoringOverviewAlerts: React.FC<MonitoringOverviewAlertsProps & StateProps> = ({
  alerts,
  activePerspective,
}) => {
  const sortedAlerts = sortMonitoringAlerts(alerts);

  return (
    <div className="odc-monitoring-overview-alerts">
      {_.map(sortedAlerts, (alert: AlertType) => {
        const {
          activeAt,
          annotations: { message },
          labels: { severity, alertname, namespace },
          rule: { name, id },
        } = alert;
        const alertDetailsPageLink =
          activePerspective === 'admin'
            ? `/monitoring/alerts/${id}?${labelsToParams(alert.labels)}`
            : `/dev-monitoring/ns/${namespace}/alerts/${id}?${labelsToParams(alert.labels)}`;
        return (
          <Alert
            variant={getAlertType(severity)}
            isInline
            title={<Link to={alertDetailsPageLink}>{name}</Link>}
            key={`${alertname}-${id}`}
          >
            {message}
            <div className="odc-monitoring-overview-alerts__timestamp">
              <small className="text-secondary">{fromNow(activeAt)}</small>
            </div>
          </Alert>
        );
      })}
    </div>
  );
};

const stateToProps = (state: RootState) => ({
  activePerspective: getActivePerspective(state),
});

export const InternalMonitoringOverviewAlerts = MonitoringOverviewAlerts;
export default connect<StateProps>(stateToProps)(MonitoringOverviewAlerts);
