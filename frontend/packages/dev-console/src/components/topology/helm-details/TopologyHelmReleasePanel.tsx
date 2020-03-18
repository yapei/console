import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import {
  navFactory,
  ResourceIcon,
  SimpleTabNav,
  StatusBox,
} from '@console/internal/components/utils';
import * as UIActions from '@console/internal/actions/ui';
import { Node } from '@console/topology';
import HelmReleaseOverview from '../../helm/HelmReleaseOverview';
import TopologyHelmReleaseResourcesPanel from './TopologyHelmReleaseResourcesPanel';

type PropsFromState = {
  selectedDetailsTab?: any;
};

type PropsFromDispatch = {
  onClickTab?: (name: string) => void;
};

const stateToProps = ({ UI }): PropsFromState => ({
  selectedDetailsTab: UI.getIn(['overview', 'selectedDetailsTab']),
});

const dispatchToProps = (dispatch): PropsFromDispatch => ({
  onClickTab: (name) => dispatch(UIActions.selectOverviewDetailsTab(name)),
});

type OwnProps = {
  helmRelease: Node;
};

type TopologyHelmReleasePanelProps = PropsFromState & PropsFromDispatch & OwnProps;

const TopologyHelmReleasePanel = connect<
  PropsFromState,
  PropsFromDispatch,
  TopologyHelmReleasePanelProps
>(
  stateToProps,
  dispatchToProps,
)(({ helmRelease, selectedDetailsTab, onClickTab }: TopologyHelmReleasePanelProps) => {
  const secret = helmRelease.getData().resources.obj;
  const { manifestResources } = helmRelease.getData().data;
  const name = helmRelease.getLabel();
  const { namespace } = helmRelease.getData().groupResources[0].resources.obj.metadata;

  const detailsComponent = !secret
    ? () => (
        <StatusBox
          loaded
          loadError={{ message: `Unable to find resource for ${helmRelease.getLabel()}` }}
        />
      )
    : navFactory.details(HelmReleaseOverview).component;

  const resourcesComponent = () =>
    manifestResources ? (
      <TopologyHelmReleaseResourcesPanel manifestResources={manifestResources} />
    ) : null;

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon className="co-m-resource-icon--lg" kind="HelmRelease" />
            <Link
              to={`/helm-releases/ns/${namespace}/release/${name}`}
              className="co-resource-item__resource-name"
            >
              {name}
            </Link>
          </div>
        </h1>
      </div>
      <SimpleTabNav
        selectedTab={selectedDetailsTab || 'Resources'}
        onClickTab={onClickTab}
        tabs={[
          { name: 'Details', component: detailsComponent },
          { name: 'Resources', component: resourcesComponent },
        ]}
        tabProps={{ obj: secret }}
        additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
      />
    </div>
  );
});

export default TopologyHelmReleasePanel;
