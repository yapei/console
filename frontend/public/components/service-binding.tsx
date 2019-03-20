import * as React from 'react';
import * as _ from 'lodash-es';
import { match } from 'react-router-dom';

// eslint-disable-next-line no-unused-vars
import { serviceCatalogStatus, referenceForModel, K8sResourceKind } from '../module/k8s';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Kebab, SectionHeading, navFactory, ResourceKebab, ResourceLink, ResourceSummary, StatusWithIcon } from './utils';
import { ResourceEventStream } from './events';
import { Conditions } from './conditions';
import { ServiceCatalogParameters, ServiceCatalogParametersSecrets } from './service-catalog-parameters';
import { ServiceBindingDescription } from './service-instance';
import { addSecretToWorkload } from './secret';
import { ServiceBindingModel, ServiceInstanceModel } from '../models';

const actionButtons = [
  addSecretToWorkload,
];

const { common } = Kebab.factory;
const menuActions = [...common];

const secretLink = (obj) => serviceCatalogStatus(obj) === 'Ready'
  ? <ResourceLink kind="Secret" name={obj.spec.secretName} title={obj.spec.secretName} namespace={obj.metadata.namespace} />
  : '-';

const ServiceBindingDetails: React.SFC<ServiceBindingDetailsProps> = ({obj: sb}) => {
  const sbParameters = _.get(sb, 'status.externalProperties.parameters', {});
  const notReady = serviceCatalogStatus(sb) === 'Not Ready' ? true : false;

  return <React.Fragment>
    <div className="co-m-pane__body">
      {notReady && <p className="alert alert-warning">
        <span className="pficon pficon-warning-triangle-o" aria-hidden="true"></span>
        This binding is not ready yet. Once it is ready, bind its secret to a workload.
      </p>}
      <ServiceBindingDescription instanceName={sb.spec.instanceRef.name} className="co-m-pane__explanation" />
      <SectionHeading text="Service Binding Overview" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={sb} />
        </div>
        <div className="col-sm-6">
          <dl className="co-m-pane__details">
            <dt>Service Instance</dt>
            <dd><ResourceLink kind={referenceForModel(ServiceInstanceModel)} name={sb.spec.instanceRef.name} namespace={sb.metadata.namespace} /></dd>
            <dt>Secret</dt>
            <dd>{ secretLink(sb) }</dd>
            <dt>Status</dt>
            <dd><StatusWithIcon obj={sb} /></dd>
          </dl>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Conditions" />
      <Conditions conditions={sb.status.conditions} />
    </div>
    {!_.isEmpty(sb.spec.parametersFrom) && <ServiceCatalogParametersSecrets obj={sb} /> }
    {!_.isEmpty(sbParameters) && <ServiceCatalogParameters parameters={sbParameters} /> }
  </React.Fragment>;
};

const pages = [navFactory.details(ServiceBindingDetails), navFactory.editYaml(), navFactory.events(ResourceEventStream)];
export const ServiceBindingDetailsPage: React.SFC<ServiceBindingDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    kind={referenceForModel(ServiceBindingModel)}
    buttonActions={actionButtons}
    menuActions={menuActions}
    pages={pages} />;
ServiceBindingDetailsPage.displayName = 'ServiceBindingDetailsPage';

const ServiceBindingsHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-4 hidden-xs" sortField="spec.instanceRef.name">Service Instance</ColHead>
  <ColHead {...props} className="col-md-3 hidden-sm hidden-xs" sortField="spec.secretName">Secret</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortFunc="serviceCatalogStatus">Status</ColHead>
</ListHeader>;

const ServiceBindingsRow: React.SFC<ServiceBindingsRowProps> = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-md-3 col-sm-4 col-xs-6">
    <ResourceLink kind={referenceForModel(ServiceBindingModel)} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-md-2 col-sm-4 col-xs-6 co-break-word">
    <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
  </div>
  <div className="col-md-2 col-sm-4 hidden-xs co-break-word">
    <ResourceLink kind={referenceForModel(ServiceInstanceModel)} name={obj.spec.instanceRef.name} title={obj.spec.instanceRef.name} namespace={obj.metadata.namespace} />
  </div>
  <div className="col-md-3 hidden-sm hidden-xs co-break-word">
    { secretLink(obj) }
  </div>
  <div className="col-md-2 hidden-sm hidden-xs co-break-word">
    <StatusWithIcon obj={obj} />
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={menuActions} kind={referenceForModel(ServiceBindingModel)} resource={obj} />
  </div>
</div>;

const ServiceBindingsList: React.SFC = props => <List {...props} Header={ServiceBindingsHeader} Row={ServiceBindingsRow} />;
ServiceBindingsList.displayName = 'ServiceBindingsList';

export const ServiceBindingsPage: React.SFC<ServiceBindingsPageProps> = props =>
  <ListPage
    {...props}
    namespace={props.namespace ||_.get(props.match, 'params.ns')}
    showTitle={false}
    kind={referenceForModel(ServiceBindingModel)}
    ListComponent={ServiceBindingsList}
    filterLabel="Service Bindings by name"
  />;

/* eslint-disable no-undef */
export type ServiceBindingsRowProps = {
  obj: K8sResourceKind,
};

export type ServiceBindingDetailsProps = {
  obj: K8sResourceKind,
};

export type ServiceBindingsPageProps = {
  autoFocus?: boolean,
  canCreate?: boolean,
  createHandler?: any,
  filters?: any,
  namespace?: string,
  match?: match<{ns?: string}>,
  selector?: any,
  showTitle?: boolean,
};

export type ServiceBindingDetailsPageProps = {
  match: any,
};
/* eslint-enable no-undef */

ServiceBindingsPage.displayName = 'ServiceBindingsListPage';
