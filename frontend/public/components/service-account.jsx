import * as React from 'react';
import * as moment from 'moment';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Cog, navFactory, ResourceCog, ResourceLink, ResourceSummary } from './utils';
import { SecretsList, withSecretsList } from './secret';
import { registerTemplate } from '../yaml-templates';

const menuActions = [Cog.factory.Delete];

registerTemplate('v1.ServiceAccount', `apiVersion: v1
kind: ServiceAccount
metadata:
  name: example`);

const Header = props => <ListHeader>
  <ColHead {...props} className="col-xs-3" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="secrets">Secrets</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.creationTimestamp">Age</ColHead>
</ListHeader>;

const ServiceAccountRow = ({obj: serviceaccount}) => {
  const {metadata: {name, namespace, uid, creationTimestamp}, secrets} = serviceaccount;

  return (
    <ResourceRow obj={serviceaccount}>
      <div className="col-xs-3">
        <ResourceCog actions={menuActions} kind="ServiceAccount" resource={serviceaccount} />
        <ResourceLink kind="ServiceAccount" name={name} namespace={namespace} title={uid} />
      </div>
      <div className="col-xs-3">
        <ResourceLink kind="Namespace" name={namespace} title={namespace}/> {}
      </div>
      <div className="col-xs-3">
        {secrets ? secrets.length : 0}
      </div>
      <div className="col-xs-3">
        {moment(creationTimestamp).fromNow()}
      </div>
    </ResourceRow>
  );
};

const Details = ({obj: serviceaccount}) => {
  const {metadata: {namespace}, secrets} = serviceaccount;
  const filters = {selector: {field: 'metadata.name', values: new Set(_.map(secrets, 'name'))}};

  return (
    <div>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-md-6">
            <div className="co-m-pane__body-group">
              <ResourceSummary resource={serviceaccount} showPodSelector={false} showNodeSelector={false} />
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-xs-12">
            <h1 className="co-section-title">Secrets</h1>
          </div>
        </div>
        <SecretsList namespace={namespace} filters={filters} />
      </div>
    </div>
  );
};

const ServiceAccountsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
const ServiceAccountsList = props => <List {...props} Header={Header} Row={withSecretsList(ServiceAccountRow)} />;
const ServiceAccountsPage = props => <ListPage ListComponent={ServiceAccountsList} {...props} canCreate={true}/>;
export {ServiceAccountsList, ServiceAccountsPage, ServiceAccountsDetailsPage};
