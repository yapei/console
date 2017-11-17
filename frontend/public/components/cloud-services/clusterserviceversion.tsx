/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Link, match } from 'react-router-dom';
import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';
import { connect } from 'react-redux';

import { ClusterServiceVersionKind, ClusterServiceVersionLogo, CRDDescription, K8sResourceKind, ClusterServiceVersionPhase } from './index';
import { ClusterServiceVersionResourcesPage } from './clusterserviceversion-resource';
import { DetailsPage, ListHeader, ColHead, MultiListPage } from '../factory';
import { navFactory, StatusBox, Timestamp, ResourceLink, Overflow, Dropdown, history, MsgBox, makeReduxID, makeQuery, Box } from '../utils';
import { k8sKinds } from '../../module/k8s';

import * as appsLogo from '../../imgs/apps-logo.svg';

export const ClusterServiceVersionListItem: React.StatelessComponent<ClusterServiceVersionListItemProps> = (props) => {
  const {obj, namespaces = []} = props;
  const route = (namespace) => `/ns/${namespace}/clusterserviceversion-v1s/${obj.metadata.name}`;

  return <div className="co-clusterserviceversion-list-item">
    <div style={{cursor: namespaces.length === 1 ? 'pointer' : ''}} onClick={() => namespaces.length === 1 ? history.push(route(obj.metadata.namespace)) : null}>
      <ClusterServiceVersionLogo icon={_.get(obj, 'spec.icon', [])[0]} displayName={obj.spec.displayName} version={obj.spec.version} provider={obj.spec.provider} />
    </div>
    <div className="co-clusterserviceversion-list-item__description">{_.get(obj.spec, 'description', 'No description available')}</div>
    <div className="co-clusterserviceversion-list-item__actions">
      { namespaces.length > 1
        ? <Dropdown
          title="View namespace"
          items={namespaces.reduce((acc, ns) => ({...acc, [ns]: ns}), {})}
          onChange={(ns) => history.push(`${route(ns)}`)} />
        : <Link to={`${route(obj.metadata.namespace)}`} title="View details" className="btn btn-default">View details</Link> }
      { namespaces.length === 1 && <Link to={`${route(obj.metadata.namespace)}/instances`} title="View instances">View instances</Link> }
    </div>
  </div>;
};

export const ClusterServiceVersionHeader: React.StatelessComponent = () => <ListHeader>
  <ColHead className="col-xs-8">Name</ColHead>
  <ColHead className="col-xs-4">Actions</ColHead>
</ListHeader>;

export const ClusterServiceVersionRow: React.StatelessComponent<ClusterServiceVersionRowProps> = ({obj}) => {
  const route = `/ns/${obj.metadata.namespace}/clusterserviceversion-v1s/${obj.metadata.name}`;

  return <div className="row co-resource-list__item">
    <div className="col-xs-8">
      <ResourceLink kind={obj.kind} namespace={obj.metadata.namespace} title={obj.metadata.name} name={obj.metadata.name} />
    </div>
    <div className="col-xs-4">
      <Link to={`${route}`} title="View details" className="btn btn-default">View details</Link>
      <Link to={`${route}/instances`} title="View instances">View instances</Link>
    </div>
  </div>;
};

export const ClusterServiceVersionList: React.StatelessComponent<ClusterServiceVersionListProps> = (props) => {
  const {loaded, loadError, filters} = props;
  const EmptyMsg = () => <MsgBox title="No Applications Found" detail="Applications are installed per namespace from the Open Cloud Catalog." />;
  const clusterServiceVersions = (props.data.filter(res => res.kind === 'ClusterServiceVersion-v1') as ClusterServiceVersionKind[])
    .filter(csv => csv.status && csv.status.phase === ClusterServiceVersionPhase.CSVPhaseSucceeded);

  const apps = Object.keys(filters).reduce((filteredData, filterName) => {
    // TODO(alecmerdler): Make these cases into TypeScript `enum` values
    switch (filterName) {
      case 'name':
        return filteredData.filter((csv) => csv.spec.displayName.toLowerCase().includes(filters[filterName].toLowerCase()));
      case 'clusterserviceversion-status':
        if (filters[filterName] === 'running') {
          return filteredData.filter(({metadata, spec}) => spec.customresourcedefinitions.owned.some(({kind}) => props.data.some(res => res.kind === kind && res.metadata.namespace === metadata.namespace)));
        } else if (filters[filterName] === 'notRunning') {
          return filteredData.filter(({metadata, spec}) => !spec.customresourcedefinitions.owned.some(({kind}) => props.data.some(res => res.kind === kind && res.metadata.namespace === metadata.namespace)));
        }
        return filteredData;
      case 'clusterserviceversion-catalog':
        return filteredData.filter((csv) => filters[filterName] === 'all' || csv.spec.labels['alm-catalog'] === filters[filterName]);
      default:
        return filteredData;
    }
  }, clusterServiceVersions);

  const namespacesForApp = (name) => apps.filter(({metadata}) => metadata.name === name).map(({metadata}) => metadata.namespace);

  return <div>{ apps.length > 0
    ? <div className="co-clusterserviceversion-list">
      <div className="co-clusterserviceversion-list__section co-clusterserviceversion-list__section--catalog">
        <h1 className="co-section-title">Open Cloud Services</h1>
        <div className="co-clusterserviceversion-list__section--catalog__items">
          { apps.filter(({metadata}, i, allCSVs) => i === _.findIndex(allCSVs, (csv => csv.metadata.name === metadata.name)))
            .filter(({metadata}, _, allCSVs) => !allCSVs.some(({spec}) => spec.replaces === metadata.name))
            .map((csv, i) => (
              <div className="co-clusterserviceversion-list__section--catalog__items__item" key={i}>
                <ClusterServiceVersionListItem obj={csv} namespaces={namespacesForApp(csv.metadata.name)} />
              </div>)) }
        </div>
      </div>
    </div>
    : <StatusBox label="Applications" loaded={loaded} loadError={loadError} EmptyMsg={EmptyMsg} /> }
  </div>;
};

const stateToProps = ({k8s}, {match, namespace}) => ({
  resourceDescriptions: _.values(k8s.getIn([makeReduxID(k8sKinds['ClusterServiceVersion-v1'], makeQuery(match.params.ns)), 'data'], ImmutableMap()).toJS())
    .map((csv: ClusterServiceVersionKind) => _.get(csv.spec.customresourcedefinitions, 'owned', []))
    .reduce((descriptions, crdDesc) => descriptions.concat(crdDesc), []),
  namespaceEnabled: _.values<K8sResourceKind>(k8s.getIn(['namespaces', 'data'], ImmutableMap()).toJS())
    .filter((ns) => ns.metadata.name === namespace && _.get(ns, ['metadata', 'annotations', 'alm-manager']))
    .length === 1,
});

export const ClusterServiceVersionsPage = connect(stateToProps)(
  class ClusterServiceVersionsPage extends React.Component<ClusterServiceVersionsPageProps, ClusterServiceVersionsPageState> {
    constructor(props) {
      super(props);
      this.state = {resourceDescriptions: []};
    }

    render() {
      const resources = [{kind: this.props.kind, namespaced: true}]
        .concat(this.state.resourceDescriptions.map(crdDesc => ({kind: crdDesc.kind, namespaced: true, optional: true})));

      const flatten = (resources: {[kind: string]: {data: K8sResourceKind[]}}) => _.flatMap(resources, (resource) => _.map(resource.data, item => item));
      const dropdownFilters = [{
        type: 'clusterserviceversion-status',
        items: {
          all: 'Status: All',
          running: 'Status: Running',
          notRunning: 'Status: Not Running',
        },
        title: 'Running Status',
      }, {
        type: 'clusterserviceversion-catalog',
        items: {
          all: 'Catalog: All',
        },
        title: 'Catalog',
      }];

      return this.props.namespace && !this.props.namespaceEnabled
        ? <Box className="cos-text-center">
          <img className="co-clusterserviceversion-list__disabled-icon" src={appsLogo} />
          <MsgBox title="Open Cloud Services not enabled for this namespace" detail="Please contact a system administrator and ask them to enable OCS to continue." />
        </Box>
        : <MultiListPage
          {...this.props}
          resources={resources}
          flatten={flatten}
          dropdownFilters={dropdownFilters}
          ListComponent={ClusterServiceVersionList}
          filterLabel="Applications by name"
          title="Available Applications"
          showTitle={true} />;
    }

    componentWillReceiveProps(nextProps) {
      if (this.state.resourceDescriptions.length === 0 && nextProps.resourceDescriptions.length > 0) {
        this.setState({resourceDescriptions: nextProps.resourceDescriptions});
      }
    }

    shouldComponentUpdate(nextProps) {
      return !_.isEqual(_.omit(nextProps, 'resourceDescriptions'), _.omit(this.props, 'resourceDescriptions'))
        || nextProps.resourceDescriptions.length > 0 && this.state.resourceDescriptions.length === 0;
    }
  });

export const ClusterServiceVersionDetails: React.StatelessComponent<ClusterServiceVersionDetailsProps> = (props) => {
  const {spec, metadata} = props.obj;
  const createLink = (name: string) => `/ns/${metadata.namespace}/clusterserviceversion-v1s/${metadata.name}/${name.split('.')[0]}/new`;

  return <div className="co-clusterserviceversion-details co-m-pane__body">
    <div className="co-clusterserviceversion-details__section co-clusterserviceversion-details__section--info">
      <div style={{marginBottom: '15px'}}>
        { spec.customresourcedefinitions.owned.length > 1
          ? <Dropdown
            noButton={true}
            className="btn btn-primary"
            title="Create New"
            items={spec.customresourcedefinitions.owned.reduce((acc, crd) => ({...acc, [crd.name]: crd.displayName}), {})}
            onChange={(name) => history.push(createLink(name))} />
          : <Link to={createLink(spec.customresourcedefinitions.owned[0].name)} className="btn btn-primary">{`Create ${spec.customresourcedefinitions.owned[0].displayName}`}</Link> }
      </div>
      <dl className="co-clusterserviceversion-details__section--info__item">
        <dt>Provider</dt>
        <dd>{spec.provider && spec.provider.name ? spec.provider.name : 'Not available'}</dd>
        <dt>Created At</dt>
        <dd><Timestamp timestamp={metadata.creationTimestamp} /></dd>
      </dl>
      <dl className="co-clusterserviceversion-details__section--info__item">
        <dt>Links</dt>
        { spec.links && spec.links.length > 0
          ? spec.links.map((link, i) => <dd key={i} style={{display: 'flex', flexDirection: 'column'}}>
            {link.name} <a href={link.url}>{link.url}</a>
          </dd>)
          : <dd>Not available</dd> }
      </dl>
      <dl className="co-clusterserviceversion-details__section--info__item">
        <dt>Maintainers</dt>
        { spec.maintainers && spec.maintainers.length > 0
          ? spec.maintainers.map((maintainer, i) => <dd key={i} style={{display: 'flex', flexDirection: 'column'}}>
            {maintainer.name} <a href={`mailto:${maintainer.email}`}><Overflow value={maintainer.email} /></a>
          </dd>)
          : <dd>Not available</dd> }
      </dl>
    </div>
    <div className="co-clusterserviceversion-details__section co-clusterserviceversion-details__section--description">
      <h1>Description</h1>
      <span style={{color: spec.description ? '' : '#999'}}>
        {spec.description || 'Not available'}
      </span>
    </div>
  </div>;
};

export const ClusterServiceVersionsDetailsPage: React.StatelessComponent<ClusterServiceVersionsDetailsPageProps> = (props) => {
  const Instances: React.StatelessComponent<{obj: ClusterServiceVersionKind}> = ({obj}) => <div>
    <ClusterServiceVersionResourcesPage obj={obj} />
  </div>;
  Instances.displayName = 'Instances';

  return <DetailsPage
    {...props}
    pages={[navFactory.details(ClusterServiceVersionDetails), {href: 'instances', name: 'Instances', component: Instances}]}
    menuActions={[() => ({label: 'Edit Application Definition...', href: `/ns/${props.namespace}/clusterserviceversion-v1s/${props.name}/edit`})]} />;
};

export type ClusterServiceVersionsPageProps = {
  kind: string;
  namespace: string;
  namespaceEnabled: boolean;
  match: match<any>;
  resourceDescriptions: CRDDescription[];
};

export type ClusterServiceVersionsPageState = {
  resourceDescriptions: CRDDescription[];
};

export type ClusterServiceVersionListProps = {
  loaded: boolean;
  loadError?: string;
  data: (ClusterServiceVersionKind | K8sResourceKind)[];
  filters: {[key: string]: any};
};

export type ClusterServiceVersionListItemProps = {
  obj: ClusterServiceVersionKind;
  namespaces: string[];
};

export type ClusterServiceVersionsDetailsPageProps = {
  kind: string;
  name: string;
  namespace: string;
  match: match<any>;
};

export type ClusterServiceVersionDetailsProps = {
  obj: ClusterServiceVersionKind;
};

export type ClusterServiceVersionRowProps = {
  obj: ClusterServiceVersionKind;
};

// TODO(alecmerdler): Find Webpack loader/plugin to add `displayName` to React components automagically
ClusterServiceVersionList.displayName = 'ClusterServiceVersionList';
ClusterServiceVersionListItem.displayName = 'ClusterServiceVersionListItem';
ClusterServiceVersionsPage.displayName = 'ClusterServiceVersionsPage';
ClusterServiceVersionsDetailsPage.displayName = 'ClusterServiceVersionsDetailsPage';
ClusterServiceVersionRow.displayName = 'ClusterServiceVersionRow';
ClusterServiceVersionHeader.displayName = 'ClusterServiceVersionHeader';
