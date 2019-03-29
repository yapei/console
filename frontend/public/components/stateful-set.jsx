import * as React from 'react';

import { ResourceEventStream } from './events';
import {
  DetailsPage,
  List,
  ListPage,
  WorkloadListHeader,
  WorkloadListRow,
} from './factory';
import {
  AsyncComponent,
  Kebab,
  ContainerTable,
  ResourceSummary,
  SectionHeading,
  navFactory,
} from './utils';
import { MountedVolumes } from './mounted-vol';

const { AddStorage, EditEnvironment, common } = Kebab.factory;
export const menuActions = [AddStorage, EditEnvironment, ...common];

const kind = 'StatefulSet';
const Row = props => <WorkloadListRow {...props} kind={kind} actions={menuActions} />;

const Details = ({obj: ss}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="StatefulSet Overview" />
    <ResourceSummary resource={ss} showPodSelector showNodeSelector showTolerations />
  </div>
  <div className="co-m-pane__body">
    <SectionHeading text="Containers" />
    <ContainerTable containers={ss.spec.template.spec.containers} />
  </div>
  <div className="co-m-pane__body">
    <MountedVolumes podTemplate={ss.spec.template} heading="Mounted Volumes" />
  </div>
</React.Fragment>;

const EnvironmentPage = (props) => <AsyncComponent loader={() => import('./environment.jsx').then(c => c.EnvironmentPage)} {...props} />;

const envPath = ['spec','template','spec','containers'];
const environmentComponent = (props) => <EnvironmentPage
  obj={props.obj}
  rawEnvData={props.obj.spec.template.spec}
  envPath={envPath}
  readOnly={false}
/>;

export const StatefulSetsList = props => <List {...props} Header={WorkloadListHeader} Row={Row} />;
export const StatefulSetsPage = props => <ListPage {...props} ListComponent={StatefulSetsList} kind={kind} canCreate={true} />;

const pages = [
  navFactory.details(Details),
  navFactory.editYaml(),
  navFactory.pods(),
  navFactory.envEditor(environmentComponent),
  navFactory.events(ResourceEventStream),
];

export const StatefulSetsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={pages}
/>;
