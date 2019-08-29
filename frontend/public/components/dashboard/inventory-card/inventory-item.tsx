import * as React from 'react';
import { Link } from 'react-router-dom';
import { InProgressIcon, QuestionCircleIcon } from '@patternfly/react-icons';

import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared';
import * as plugins from '../../../plugins';
import {
  LoadingInline,
} from '../../utils';
import { K8sResourceKind, K8sKind } from '../../../module/k8s';
import { InventoryStatusGroup } from './status-group';
import { connectToFlags, FlagsObject, WithFlagsProps } from '../../../reducers/features';
import { getFlagsForExtensions } from '../../dashboards-page/utils';

const defaultStatusGroupIcons = {
  [InventoryStatusGroup.OK]: (
    <GreenCheckCircleIcon />
  ),
  [InventoryStatusGroup.WARN]: (
    <YellowExclamationTriangleIcon />
  ),
  [InventoryStatusGroup.ERROR]: (
    <RedExclamationCircleIcon />
  ),
  [InventoryStatusGroup.PROGRESS]: (
    <InProgressIcon className="co-inventory-card__status-icon--progress" />
  ),
  [InventoryStatusGroup.NOT_MAPPED]: (
    <QuestionCircleIcon className="co-inventory-card__status-icon--question" />
  ),
};

const getStatusGroupIcons = (flags: FlagsObject) => {
  const groupStatusIcons = {...defaultStatusGroupIcons};
  plugins.registry.getDashboardsInventoryItemGroups().filter(e => flags[e.properties.required]).forEach(group => {
    if (!groupStatusIcons[group.properties.id]) {
      groupStatusIcons[group.properties.id] = group.properties.icon;
    }
  });
  return groupStatusIcons;
};

export const InventoryItem: React.FC<InventoryItemProps> = React.memo(
  ({ isLoading, singularTitle, pluralTitle, count, children, error = false }) => {
    const title = count !== 1 ? pluralTitle : singularTitle;
    let status: React.ReactNode;
    if (error) {
      status = <div className="co-dashboard-text--small text-secondary">Unavailable</div>;
    } else if (isLoading) {
      status = <LoadingInline />;
    } else {
      status = children;
    }
    return (
      <div className="co-inventory-card__item">
        <div className="co-inventory-card__item-title">{isLoading || error ? title : `${count} ${title}`}</div>
        <div className="co-inventory-card__item-status">{status}</div>
      </div>
    );
  }
);

export const Status: React.FC<StatusProps> = React.memo(({ groupID, count, flags }) => {
  const statusGroupIcons = getStatusGroupIcons(flags);
  const groupIcon = statusGroupIcons[groupID] || statusGroupIcons[InventoryStatusGroup.NOT_MAPPED];
  return (
    <div className="co-inventory-card__status">
      <span className="co-dashboard-icon">{groupIcon}</span>
      <span className="co-inventory-card__status-text">{count}</span>
    </div>
  );
});

const StatusLink: React.FC<StatusLinkProps> = React.memo(
  ({ groupID, count, statusIDs, kind, namespace, filterType, flags }) => {
    const statusItems = encodeURIComponent(statusIDs.join(','));
    const namespacePath = namespace ? `ns/${namespace}` : 'all-namespaces';
    const to = filterType && statusItems.length > 0 ? `/k8s/${namespacePath}/${kind.plural}?rowFilter-${filterType}=${statusItems}` : `/k8s/${namespacePath}/${kind.plural}`;
    const statusGroupIcons = getStatusGroupIcons(flags);
    const groupIcon = statusGroupIcons[groupID] || statusGroupIcons[InventoryStatusGroup.NOT_MAPPED];
    return (
      <div className="co-inventory-card__status">
        <Link to={to} style={{textDecoration: 'none'}}>
          <span className="co-dashboard-icon">{groupIcon}</span>
          <span className="co-inventory-card__status-text">{count}</span>
        </Link>
      </div>
    );
  }
);

export const ResourceInventoryItem = connectToFlags<ResourceInventoryItemProps>(
  ...getFlagsForExtensions(plugins.registry.getDashboardsInventoryItemGroups()),
)(React.memo(
  ({ kind, useAbbr, resources, additionalResources, isLoading, mapper, namespace, error, showLink = true, flags = {}}) => {
    const groups = mapper(resources, additionalResources);
    const [singularTitle, pluralTitle] = useAbbr ? [kind.abbr, `${kind.abbr}s`] : [kind.label, kind.labelPlural];
    return (
      <InventoryItem
        isLoading={isLoading}
        singularTitle={singularTitle}
        pluralTitle={pluralTitle}
        count={resources.length}
        error={error}
      >
        {Object.keys(groups).filter(key => groups[key].count > 0).map(key => showLink ?
          (
            <StatusLink
              key={key}
              kind={kind}
              namespace={namespace}
              groupID={key}
              count={groups[key].count}
              statusIDs={groups[key].statusIDs}
              filterType={groups[key].filterType}
              flags={flags}
            />
          ) : (
            <Status
              groupID={key}
              count={groups[key].count}
              flags={flags}
            />
          )
        )}
      </InventoryItem>
    );
  }
));

export type StatusGroupMapper = (resources: K8sResourceKind[], additionalResources?: {[key: string]: K8sResourceKind[]}) => {[key in InventoryStatusGroup | string]: {filterType?: string, statusIDs: string[], count: number}};

type InventoryItemProps = {
  isLoading: boolean;
  singularTitle: string;
  pluralTitle: string;
  count: number;
  children?: React.ReactNode;
  error: boolean;
};

type StatusProps = WithFlagsProps & {
  groupID: InventoryStatusGroup | string;
  count: number;
}

type StatusLinkProps = StatusProps & {
  statusIDs: string[];
  kind: K8sKind;
  namespace?: string;
  filterType?: string;
}

type ResourceInventoryItemProps = WithFlagsProps & {
  resources: K8sResourceKind[];
  additionalResources?: {[key: string]: K8sResourceKind[]};
  mapper: StatusGroupMapper;
  kind: K8sKind;
  useAbbr?: boolean;
  isLoading: boolean;
  namespace?: string;
  error: boolean;
  showLink?: boolean;
}
