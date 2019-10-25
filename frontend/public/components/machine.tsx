import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import {
  getMachineNodeName,
  getMachineRegion,
  getMachineRole,
  getMachineZone,
  getMachineAddresses,
} from '@console/shared';
import { MachineModel } from '../models';
import { MachineKind, referenceForModel } from '../module/k8s';
import { Conditions } from './conditions';
import NodeIPList from '@console/app/src/components/nodes/NodeIPList';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import {
  Kebab,
  NodeLink,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
} from './utils';
import { ResourceEventStream } from './events';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(MachineModel), ...common];
export const machineReference = referenceForModel(MachineModel);

const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-4', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-4', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-4', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const MachineTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Node',
      sortField: 'status.nodeRef.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Region',
      sortField: "metadata.labels['machine.openshift.io/region']",
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Availability Zone',
      sortField: "metadata.labels['machine.openshift.io/zone']",
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
MachineTableHeader.displayName = 'MachineTableHeader';

const MachineTableRow: React.FC<MachineTableRowProps> = ({ obj, index, key, style }) => {
  const nodeName = getMachineNodeName(obj);
  const region = getMachineRegion(obj);
  const zone = getMachineZone(obj);
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={classNames(tableColumnClasses[0], 'co-break-word')}>
        <ResourceLink
          kind={machineReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {nodeName ? <NodeLink name={nodeName} /> : '-'}
      </TableData>
      <TableData className={tableColumnClasses[3]}>{region || '-'}</TableData>
      <TableData className={tableColumnClasses[4]}>{zone || '-'}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={machineReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};
MachineTableRow.displayName = 'MachineTableRow';
type MachineTableRowProps = {
  obj: MachineKind;
  index: number;
  key: string;
  style: object;
};

const MachineDetails: React.SFC<MachineDetailsProps> = ({ obj }: { obj: MachineKind }) => {
  const nodeName = getMachineNodeName(obj);
  const machineRole = getMachineRole(obj);
  const region = getMachineRegion(obj);
  const zone = getMachineZone(obj);
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Machine Overview" />
        <ResourceSummary resource={obj}>
          {nodeName && (
            <>
              <dt>Node</dt>
              <dd>
                <NodeLink name={nodeName} />
              </dd>
            </>
          )}
          {machineRole && (
            <>
              <dt>Machine Role</dt>
              <dd>{machineRole}</dd>
            </>
          )}
          {region && (
            <>
              <dt>Region</dt>
              <dd>{region}</dd>
            </>
          )}
          {zone && (
            <>
              <dt>Availability Zone</dt>
              <dd>{zone}</dd>
            </>
          )}
          <dt>Machine Addresses</dt>
          <dd>
            <NodeIPList ips={getMachineAddresses(obj)} expand />
          </dd>
        </ResourceSummary>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Conditions" />
        <Conditions conditions={_.get(obj, 'status.providerStatus.conditions')} />
      </div>
    </>
  );
};

export const MachineList: React.SFC = (props) => (
  <Table
    {...props}
    aria-label="Machines"
    Header={MachineTableHeader}
    Row={MachineTableRow}
    virtualize
  />
);

export const MachinePage: React.SFC<MachinePageProps> = (props) => (
  <ListPage
    {...props}
    ListComponent={MachineList}
    kind={machineReference}
    textFilter="machine"
    filterLabel="by machine or node name"
    canCreate
  />
);

export const MachineDetailsPage: React.SFC<MachineDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    kind={machineReference}
    menuActions={menuActions}
    pages={[
      navFactory.details(MachineDetails),
      navFactory.editYaml(),
      navFactory.events(ResourceEventStream),
    ]}
  />
);

export type MachineDetailsProps = {
  obj: MachineKind;
};

export type MachinePageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

export type MachineDetailsPageProps = {
  match: any;
};
