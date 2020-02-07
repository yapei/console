import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  NotificationDrawer,
  NotificationEntry,
  NotificationCategory,
  NotificationTypes,
} from '@console/patternfly';
import * as UIActions from '@console/internal/actions/ui';
import store, { RootState } from '@console/internal/redux';
import { Alert, alertURL } from '@console/internal/components/monitoring';
import { RedExclamationCircleIcon } from '@console/shared';
import {
  getAlertDescription,
  getAlertMessage,
  getAlertName,
  getAlertSeverity,
  getAlertTime,
  getAlerts,
} from '@console/shared/src/components/dashboard/status-card/alert-utils';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateSecondaryActions,
  EmptyStateVariant,
  Title,
} from '@patternfly/react-core';

import { coFetchJSON } from '../co-fetch';
import { FirehoseResult } from './utils';
import { ClusterUpdate, ClusterVersionKind } from '../module/k8s';
import { getSortedUpdates } from './modals/cluster-update-modal';
import { usePrevious } from '@console/metal3-plugin/src/hooks';

const criticalCompare = (a: Alert): boolean => getAlertSeverity(a) === 'critical';
const otherAlertCompare = (a: Alert): boolean => getAlertSeverity(a) !== 'critical';

const AlertErrorState: React.FC<AlertErrorProps> = ({ errorText }) => (
  <EmptyState variant={EmptyStateVariant.full}>
    <EmptyStateIcon className="co-status-card__alerts-icon" icon={RedExclamationCircleIcon} />
    <Title headingLevel="h5" size="lg">
      Alerts could not be loaded
    </Title>
    {errorText && <EmptyStateBody>{errorText}</EmptyStateBody>}
  </EmptyState>
);

const AlertEmptyState: React.FC<AlertEmptyProps> = ({ drawerToggle }) => (
  <EmptyState variant={EmptyStateVariant.full} className="co-status-card__alerts-msg">
    <Title headingLevel="h5" size="lg">
      No critical alerts
    </Title>
    <EmptyStateBody>
      There are currently no critical alerts firing. There may be firing alerts of other severities
      or silenced critical alerts however.
    </EmptyStateBody>
    <EmptyStateSecondaryActions>
      <Link to="/monitoring/alerts" onClick={drawerToggle}>
        View all alerts
      </Link>
    </EmptyStateSecondaryActions>
  </EmptyState>
);

const getAlertNotificationEntries = (
  isLoaded: boolean,
  alertData: Alert[],
  toggleNotificationDrawer: () => void,
  isCritical: boolean,
): React.ReactNode[] =>
  isLoaded && !_.isEmpty(alertData)
    ? alertData
        .filter((a) => (isCritical ? criticalCompare(a) : otherAlertCompare(a)))
        .map((alert, i) => (
          <NotificationEntry
            key={`${i}_${alert.activeAt}`}
            description={getAlertDescription(alert) || getAlertMessage(alert)}
            timestamp={getAlertTime(alert)}
            type={NotificationTypes[getAlertSeverity(alert)]}
            title={getAlertName(alert)}
            toggleNotificationDrawer={toggleNotificationDrawer}
            targetURL={alertURL(alert, alert.rule.id)}
          />
        ))
    : [];

const getUpdateNotificationEntries = (
  isLoaded: boolean,
  updateData: ClusterUpdate[],
  toggleNotificationDrawer: () => void,
): React.ReactNode[] =>
  isLoaded && !_.isEmpty(updateData)
    ? [
        <NotificationEntry
          key="cluster-udpate"
          description={updateData[0].version || 'Unknown'}
          type={NotificationTypes.update}
          title="Cluster update available"
          toggleNotificationDrawer={toggleNotificationDrawer}
          targetURL="/settings/cluster"
        />,
      ]
    : [];

export const ConnectedNotificationDrawer_: React.FC<ConnectedNotificationDrawerProps> = ({
  isDesktop,
  toggleNotificationDrawer,
  toggleNotificationsRead,
  isDrawerExpanded,
  notificationsRead,
  alerts,
  resources,
  children,
}) => {
  React.useEffect(() => {
    let pollerTimeout = null;
    const poll: NotificationPoll = (url, dataHandler) => {
      const key = 'notificationAlerts';
      store.dispatch(UIActions.monitoringLoading(key));
      const notificationPoller = (): void => {
        coFetchJSON(url)
          .then((response) => dataHandler(response))
          .then((data) => store.dispatch(UIActions.monitoringLoaded(key, data)))
          .catch((e) => store.dispatch(UIActions.monitoringErrored(key, e)))
          .then(() => (pollerTimeout = setTimeout(notificationPoller, 15 * 1000)));
      };
      notificationPoller();
    };
    const { prometheusBaseURL } = window.SERVER_FLAGS;

    if (prometheusBaseURL) {
      poll(`${prometheusBaseURL}/api/v1/rules`, getAlerts);
    } else {
      store.dispatch(
        UIActions.monitoringErrored('notificationAlerts', new Error('prometheusBaseURL not set')),
      );
    }
    return () => pollerTimeout.clearTimeout;
  }, []);
  const cv: ClusterVersionKind = resources.cv?.data;
  const cvLoaded: boolean = resources.cv?.loaded;
  const updateData: ClusterUpdate[] = getSortedUpdates(cv);
  const { data, loaded, loadError } = alerts || {};

  const updateList: React.ReactNode[] = getUpdateNotificationEntries(
    cvLoaded,
    updateData,
    toggleNotificationDrawer,
  );
  const criticalAlertList: React.ReactNode[] = getAlertNotificationEntries(
    true,
    data,
    toggleNotificationDrawer,
    true,
  );
  const otherAlertList: React.ReactNode[] = getAlertNotificationEntries(
    loaded,
    data,
    toggleNotificationDrawer,
    false,
  );
  const [isAlertExpanded, toggleAlertExpanded] = React.useState<boolean>(
    !_.isEmpty(criticalAlertList),
  );
  const [isNonCriticalAlertExpanded, toggleNonCriticalAlertExpanded] = React.useState<boolean>(
    false,
  );
  const [isClusterUpdateExpanded, toggleClusterUpdateExpanded] = React.useState<boolean>(false);
  const prevDrawerToggleState = usePrevious(isDrawerExpanded);

  const hasCriticalAlerts = criticalAlertList.length > 0;
  React.useEffect(() => {
    if (hasCriticalAlerts && !prevDrawerToggleState && isDrawerExpanded) {
      toggleAlertExpanded(true);
    }
  }, [hasCriticalAlerts, isAlertExpanded, isDrawerExpanded, prevDrawerToggleState]);

  const emptyState = !_.isEmpty(loadError) ? (
    <AlertErrorState errorText={loadError.message} />
  ) : (
    <AlertEmptyState drawerToggle={toggleNotificationDrawer} />
  );

  const criticalAlerts = _.isEmpty(criticalAlertList) ? emptyState : criticalAlertList;
  const criticalAlertCategory: React.ReactElement = (
    <NotificationCategory
      key="critical-alerts"
      isExpanded={isAlertExpanded}
      label="Critical Alerts"
      count={criticalAlertList.length}
      onExpandContents={toggleAlertExpanded}
    >
      {criticalAlerts}
    </NotificationCategory>
  );
  const nonCriticalAlertCategory: React.ReactElement = !_.isEmpty(otherAlertList) ? (
    <NotificationCategory
      key="other-alerts"
      isExpanded={isNonCriticalAlertExpanded}
      label="Other Alerts"
      count={otherAlertList.length}
      onExpandContents={toggleNonCriticalAlertExpanded}
    >
      {otherAlertList}
    </NotificationCategory>
  ) : null;

  const messageCategory: React.ReactElement = !_.isEmpty(updateList) ? (
    <NotificationCategory
      key="messages"
      isExpanded={isClusterUpdateExpanded}
      label="Messages"
      count={updateList.length}
      onExpandContents={toggleClusterUpdateExpanded}
    >
      {updateList}
    </NotificationCategory>
  ) : null;

  if (_.isEmpty(data) && _.isEmpty(updateList) && !notificationsRead) {
    toggleNotificationsRead();
  } else if ((!_.isEmpty(data) || !_.isEmpty(updateList)) && notificationsRead) {
    toggleNotificationsRead();
  }

  return (
    <NotificationDrawer
      isInline={isDesktop}
      isExpanded={isDrawerExpanded}
      notificationEntries={[criticalAlertCategory, nonCriticalAlertCategory, messageCategory]}
    >
      {children}
    </NotificationDrawer>
  );
};

type NotificationPoll = (url: string, dataHandler: (data) => any) => void;

export type WithNotificationsProps = {
  isDrawerExpanded: boolean;
  notificationsRead: boolean;
  alerts?: {
    data: Alert[];
    loaded: boolean;
    loadError?: {
      message?: string;
    };
  };
};

export type ConnectedNotificationDrawerProps = {
  isDesktop: boolean;
  toggleNotificationsRead: () => any;
  toggleNotificationDrawer: () => any;
  isDrawerExpanded: boolean;
  notificationsRead: boolean;
  alerts: {
    data: Alert[];
    loaded: boolean;
    loadError?: {
      message?: string;
    };
  };
  resources?: {
    cv: FirehoseResult<ClusterVersionKind>;
  };
};

const notificationStateToProps = ({ UI }: RootState): WithNotificationsProps => ({
  isDrawerExpanded: !!UI.getIn(['notifications', 'isExpanded']),
  notificationsRead: !!UI.getIn(['notifications', 'isRead']),
  alerts: UI.getIn(['monitoring', 'notificationAlerts']),
});

type AlertErrorProps = {
  errorText: string;
};

type AlertEmptyProps = {
  drawerToggle: (event: React.MouseEvent<HTMLElement>) => void;
};

const connectToNotifications = connect((state: RootState) => notificationStateToProps(state), {
  toggleNotificationDrawer: UIActions.notificationDrawerToggleExpanded,
  toggleNotificationsRead: UIActions.notificationDrawerToggleRead,
});
export const ConnectedNotificationDrawer = connectToNotifications(ConnectedNotificationDrawer_);
