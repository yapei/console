import * as React from 'react';
import * as moment from 'moment';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import ConfigMapAndSecretData from './configmap-and-secret-data';
import { Cog, Heading, navFactory, ResourceCog, ResourceLink, ResourceSummary } from './utils';
import { registerTemplate } from '../yaml-templates';

registerTemplate('v1.ConfigMap', `apiVersion: v1
kind: ConfigMap
metadata:
  name: example
  namespace: default
data:
  example.property.1: hello
  example.property.2: world
  example.property.file: |-
    property.1=value-1
    property.2=value-2
    property.3=value-3`);


const menuActions = Cog.factory.common;

const ConfigMapHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Config Map Name</ColHead>
  <ColHead {...props} className="col-xs-4" sortFunc="dataSize">Config Map Data</ColHead>
  <ColHead {...props} className="col-xs-4" sortField="metadata.creationTimestamp">Config Map Age</ColHead>
</ListHeader>;

const ConfigMapRow = ({obj: configMap}) => <ResourceRow obj={configMap}>
  <div className="col-xs-4">
    <ResourceCog actions={menuActions} kind="ConfigMap" resource={configMap} />
    <ResourceLink kind="ConfigMap" name={configMap.metadata.name} namespace={configMap.metadata.namespace} title={configMap.metadata.uid} />
  </div>
  <div className="col-xs-4">{_.size(configMap.data)}</div>
  <div className="col-xs-4">{moment(configMap.metadata.creationTimestamp).fromNow()}</div>
</ResourceRow>;

const ConfigMapDetails = ({obj: configMap}) => {
  return <div className="row">
    <div className="col-md-12">
      <div className="co-m-pane">
        <div className="co-m-pane__body">
          <ResourceSummary resource={configMap} showPodSelector={false} showNodeSelector={false} />
        </div>

        <Heading text="Data" />
        <div className="co-m-pane__body">
          <ConfigMapAndSecretData data={configMap.data} />
        </div>
      </div>
    </div>
  </div>;
};

const ConfigMaps = props => <List {...props} Header={ConfigMapHeader} Row={ConfigMapRow} />;
const ConfigMapsPage = props => <ListPage ListComponent={ConfigMaps} canCreate={true} {...props} />;
const ConfigMapsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(ConfigMapDetails), navFactory.editYaml()]}
/>;

export {ConfigMaps, ConfigMapsPage, ConfigMapsDetailsPage};
