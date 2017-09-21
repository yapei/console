import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary } from './utils';
import { registerTemplate } from '../yaml-templates';

registerTemplate('v1.ResourceQuota', `apiVersion: v1
kind: ResourceQuota
metadata:
  name: example
spec:
  hard:
    pods: "4"
    requests.cpu: "1"
    requests.memory: 1Gi
    limits.cpu: "2"
    limits.memory: 2Gi
`);


const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const Header = props => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.namespace">Namespace</ColHead>
</ListHeader>;

const kind = 'ResourceQuota';
const Row = ({obj: rq}) => <div className="row co-resource-list__item">
  <div className="col-xs-4">
    <ResourceCog actions={menuActions} kind={kind} resource={rq} />
    <ResourceLink kind={kind} name={rq.metadata.name} namespace={rq.metadata.namespace} title={rq.metadata.name} />
  </div>
  <div className="col-xs-3">
    <ResourceLink kind="Namespace" name={rq.metadata.namespace} title={rq.metadata.namespace} />
  </div>
</div>;

const Details = ({obj: rq}) => <div>
  <Heading text="ResourceQuota Overview" />
  <div className="co-m-pane__body">
    <div className="row">
      <div className="col-sm-6 col-xs-12">
        <ResourceSummary resource={rq} podSelector="spec.podSelector" showNodeSelector={false} />
      </div>
    </div>
  </div>
</div>;

export const ResourceQuotasList = props => <List {...props} Header={Header} Row={Row} />;
export const ResourceQuotasPage = props => <ListPage {...props} ListComponent={ResourceQuotasList} kind={kind} canCreate={true} />;

export const ResourceQuotasDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
