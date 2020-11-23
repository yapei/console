import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import { getActiveNamespace } from '@console/internal/actions/ui';
import TopologyApplicationResourceList from './TopologyApplicationList';

const MAX_RESOURCES = 5;

export type ApplicationGroupResourceProps = {
  title: string;
  resourcesData: K8sResourceKind[];
  group: string;
};

const ApplicationGroupResource: React.FC<ApplicationGroupResourceProps> = ({
  title,
  resourcesData,
  group,
}) =>
  !_.isEmpty(resourcesData) ? (
    <div className="overview__sidebar-pane-body">
      <SidebarSectionHeading text={title}>
        {_.size(resourcesData) > MAX_RESOURCES && (
          <Link
            className="sidebar__section-view-all"
            to={`/search/ns/${getActiveNamespace()}?kind=${referenceFor(
              resourcesData[0],
            )}&q=${encodeURIComponent(`app.kubernetes.io/part-of=${group}`)}`}
          >
            {`View all (${_.size(resourcesData)})`}
          </Link>
        )}
      </SidebarSectionHeading>
      <TopologyApplicationResourceList resources={_.take(resourcesData, MAX_RESOURCES)} />
    </div>
  ) : null;

export default ApplicationGroupResource;
