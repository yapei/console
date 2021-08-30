import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  getMachineAddresses,
  getMachineInstanceType,
  getMachineNodeName,
  getMachineRegion,
  getMachineRole,
  getMachineZone,
  Status,
  getMachinePhase,
} from '@console/shared';
import { MachineModel } from '../models';
import { MachineKind, referenceForModel, Selector } from '../module/k8s';
import { Conditions } from './conditions';
import NodeIPList from '@console/app/src/components/nodes/NodeIPList';
import { DetailsPage, TableData } from './factory';
import ListPageFilter from './factory/ListPage/ListPageFilter';
import ListPageHeader from './factory/ListPage/ListPageHeader';
import ListPageBody from './factory/ListPage/ListPageBody';
import { useListPageFilter } from './factory/ListPage/filter-hook';
import ListPageCreate from './factory/ListPage/ListPageCreate';
import {
  DetailsItem,
  Kebab,
  NodeLink,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
} from './utils';
import { ResourceEventStream } from './events';
import { useK8sWatchResource } from './utils/k8s-watch-hook';
import VirtualizedTable, { RowProps, TableColumn } from './factory/Table/VirtualizedTable';
import { sortResourceByValue } from './factory/Table/sort';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(MachineModel), ...common];
export const machineReference = referenceForModel(MachineModel);

const tableColumnClasses = [
  '',
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-md'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  Kebab.columnClass,
];

const getMachineProviderState = (obj: MachineKind): string =>
  obj?.status?.providerStatus?.instanceState;

const MachineTableRow: React.FC<RowProps<MachineKind>> = ({ obj }) => {
  const nodeName = getMachineNodeName(obj);
  const region = getMachineRegion(obj);
  const zone = getMachineZone(obj);
  const providerState = getMachineProviderState(obj);
  return (
    <>
      <TableData className={classNames(tableColumnClasses[0], 'co-break-word')}>
        <ResourceLink
          kind={machineReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {nodeName ? <NodeLink name={nodeName} /> : '-'}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Status status={getMachinePhase(obj)} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>{providerState ?? '-'}</TableData>
      <TableData className={tableColumnClasses[5]}>{region || '-'}</TableData>
      <TableData className={tableColumnClasses[6]}>{zone || '-'}</TableData>
      <TableData className={tableColumnClasses[7]}>
        <ResourceKebab actions={menuActions} kind={machineReference} resource={obj} />
      </TableData>
    </>
  );
};

const MachineDetails: React.SFC<MachineDetailsProps> = ({ obj }: { obj: MachineKind }) => {
  const nodeName = getMachineNodeName(obj);
  const machineRole = getMachineRole(obj);
  const instanceType = getMachineInstanceType(obj);
  const region = getMachineRegion(obj);
  const zone = getMachineZone(obj);
  const providerState = getMachineProviderState(obj);
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Machine details')} />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={obj} />
            </div>
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <DetailsItem label={t('public~Phase')} obj={obj} path="status.phase">
                  <Status status={getMachinePhase(obj)} />
                </DetailsItem>
                <DetailsItem
                  label={t('public~Provider state')}
                  obj={obj}
                  path="status.providerStatus.instanceState"
                >
                  {providerState}
                </DetailsItem>
                {nodeName && (
                  <>
                    <dt>{t('public~Node')}</dt>
                    <dd>
                      <NodeLink name={nodeName} />
                    </dd>
                  </>
                )}
                {machineRole && (
                  <>
                    <dt>{t('public~Machine role')}</dt>
                    <dd>{machineRole}</dd>
                  </>
                )}
                {instanceType && (
                  <>
                    <dt>{t('public~Instance type')}</dt>
                    <dd>{instanceType}</dd>
                  </>
                )}
                {region && (
                  <>
                    <dt>{t('public~Region')}</dt>
                    <dd>{region}</dd>
                  </>
                )}
                {zone && (
                  <>
                    <dt>{t('public~Availability zone')}</dt>
                    <dd>{zone}</dd>
                  </>
                )}
                <dt>{t('public~Machine addresses')}</dt>
                <dd>
                  <NodeIPList ips={getMachineAddresses(obj)} expand />
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={obj.status?.providerStatus?.conditions} />
      </div>
    </>
  );
};

type MachineListProps = {
  data: MachineKind[];
  unfilteredData: MachineKind[];
  loaded: boolean;
  loadError: any;
};

export const MachineList: React.FC<MachineListProps> = (props) => {
  const { t } = useTranslation();

  const machineTableColumn = React.useMemo<TableColumn<MachineKind>[]>(
    () => [
      {
        title: t('public~Name'),
        sort: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Namespace'),
        sort: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
        id: 'namespace',
      },
      {
        title: t('public~Node'),
        sort: 'status.nodeRef.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Phase'),
        sort: (data, direction) => data.sort(sortResourceByValue(direction, getMachinePhase)),
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('public~Provider state'),
        sort: 'status.providerStatus.instanceState',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: t('public~Region'),
        sort: "metadata.labels['machine.openshift.io/region']",
        transforms: [sortable],
        props: { className: tableColumnClasses[5] },
      },
      {
        title: t('public~Availability zone'),
        sort: "metadata.labels['machine.openshift.io/zone']",
        transforms: [sortable],
        props: { className: tableColumnClasses[6] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[7] },
      },
    ],
    [t],
  );

  return (
    <VirtualizedTable<MachineKind>
      {...props}
      aria-label={t('public~Machines')}
      columns={machineTableColumn}
      Row={MachineTableRow}
    />
  );
};

export const MachinePage: React.FC<MachinePageProps> = ({
  selector,
  namespace,
  showTitle = true,
  hideLabelFilter,
  hideNameLabelFilters,
  hideColumnManagement,
}) => {
  const { t } = useTranslation();

  const [machines, loaded, loadError] = useK8sWatchResource<MachineKind[]>({
    kind: referenceForModel(MachineModel),
    isList: true,
    selector,
    namespace,
  });

  const [data, filteredData, onFilterChange] = useListPageFilter(machines);

  return (
    <>
      <ListPageHeader title={showTitle ? t(MachineModel.labelPluralKey) : undefined}>
        <ListPageCreate groupVersionKind={referenceForModel(MachineModel)}>
          {t('public~Create machine')}
        </ListPageCreate>
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter
          data={data}
          loaded={loaded}
          onFilterChange={onFilterChange}
          hideNameLabelFilters={hideNameLabelFilters}
          hideLabelFilter={hideLabelFilter}
          hideColumnManagement={hideColumnManagement}
        />
        <MachineList
          data={filteredData}
          unfilteredData={machines}
          loaded={loaded}
          loadError={loadError}
        />
      </ListPageBody>
    </>
  );
};

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
    getResourceStatus={getMachinePhase}
  />
);

export type MachineDetailsProps = {
  obj: MachineKind;
};

export type MachinePageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: Selector;
  hideLabelFilter?: boolean;
  hideNameLabelFilters?: boolean;
  hideColumnManagement?: boolean;
};

export type MachineDetailsPageProps = {
  match: any;
};
