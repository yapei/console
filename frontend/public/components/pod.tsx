import * as React from 'react';
import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import { Status, ErrorStatus } from '@console/shared';

import { ContainerSpec, K8sResourceKindReference, PodKind } from '../module/k8s';
import {
  getRestartPolicyLabel,
  podPhase,
  podPhaseFilterReducer,
  podReadiness,
} from '../module/k8s/pods';
import { getContainerState, getContainerStatus } from '../module/k8s/container';
import { ResourceEventStream } from './events';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import {
  AsyncComponent,
  DetailsItem,
  Kebab,
  NodeLink,
  OwnerReferences,
  ResourceIcon,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  ScrollToTopOnMount,
  SectionHeading,
  Timestamp,
  humanizeCpuCores,
  humanizeDecimalBytes,
  navFactory,
  pluralize,
  units,
} from './utils';
import { PodLogs } from './pod-logs';
import { requirePrometheus, Area } from './graphs';
import { CamelCaseWrap } from './utils/camel-case-wrap';
import { VolumesTable } from './volumes-table';
import { PodDashboard } from './dashboard/pod-dashboard/pod-dashboard';

export const menuActions = [...Kebab.factory.common];
const validReadinessStates = new Set(['ContainersNotReady', 'Ready', 'PodCompleted']);

export const Readiness: React.FC<ReadinessProps> = ({ pod }) => {
  const readiness = podReadiness(pod);
  if (!readiness) {
    return null;
  }
  if (validReadinessStates.has(readiness)) {
    return <CamelCaseWrap value={readiness} />;
  }
  return (
    <span className="co-error co-icon-and-text">
      <ErrorStatus title={readiness} />
    </span>
  );
};
Readiness.displayName = 'Readiness';

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const kind = 'Pod';

const PodTableRow: React.FC<PodTableRowProps> = ({ obj: pod, index, key, style }) => {
  const phase = podPhase(pod);
  return (
    <TableRow id={pod.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={pod.metadata.name}
          namespace={pod.metadata.namespace}
          title={pod.metadata.uid}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink
          kind="Namespace"
          name={pod.metadata.namespace}
          title={pod.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <OwnerReferences resource={pod} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <NodeLink name={pod.spec.nodeName} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Status status={phase} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <Readiness pod={pod} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab
          actions={menuActions}
          kind={kind}
          resource={pod}
          isDisabled={phase === 'Terminating'}
        />
      </TableData>
    </TableRow>
  );
};
PodTableRow.displayName = 'PodTableRow';
type PodTableRowProps = {
  obj: PodKind;
  index: number;
  key?: string;
  style: object;
};

const PodTableHeader = () => {
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
      title: 'Owner',
      sortField: 'metadata.ownerReferences[0].name',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Node',
      sortField: 'spec.nodeName',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Status',
      sortFunc: 'podPhase',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Readiness',
      sortFunc: 'podReadiness',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};
PodTableHeader.displayName = 'PodTableHeader';

const ContainerLink: React.FC<ContainerLinkProps> = ({ pod, name }) => (
  <span className="co-resource-item co-resource-item--inline">
    <ResourceIcon kind="Container" />
    <Link to={`/k8s/ns/${pod.metadata.namespace}/pods/${pod.metadata.name}/containers/${name}`}>
      {name}
    </Link>
  </span>
);

export const ContainerRow: React.FC<ContainerRowProps> = ({ pod, container }) => {
  const cstatus = getContainerStatus(pod, container.name);
  const cstate = getContainerState(cstatus);
  const startedAt = _.get(cstate, 'startedAt');
  const finishedAt = _.get(cstate, 'finishedAt');

  return (
    <div className="row">
      <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">
        <ContainerLink pod={pod} name={container.name} />
      </div>
      <div className="col-lg-2 col-md-3 col-sm-5 col-xs-7 co-truncate co-nowrap co-select-to-copy">
        {container.image || '-'}
      </div>
      <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">
        <Status status={cstate.label} />
      </div>
      <div className="col-lg-1 col-md-2 hidden-sm hidden-xs">
        {_.get(cstatus, 'restartCount', '0')}
      </div>
      <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
        <Timestamp timestamp={startedAt} />
      </div>
      <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
        <Timestamp timestamp={finishedAt} />
      </div>
      <div className="col-lg-1 hidden-md hidden-sm hidden-xs">{_.get(cstate, 'exitCode', '-')}</div>
    </div>
  );
};

export const PodContainerTable: React.FC<PodContainerTableProps> = ({
  heading,
  containers,
  pod,
}) => (
  <>
    <SectionHeading text={heading} />
    <div className="co-m-table-grid co-m-table-grid--bordered">
      <div className="row co-m-table-grid__head">
        <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">Name</div>
        <div className="col-lg-2 col-md-3 col-sm-5 col-xs-7">Image</div>
        <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">State</div>
        <div className="col-lg-1 col-md-2 hidden-sm hidden-xs">Restarts</div>
        <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">Started</div>
        <div className="col-lg-2 hidden-md hidden-sm hidden-xs">Finished</div>
        <div className="col-lg-1 hidden-md hidden-sm hidden-xs">Exit Code</div>
      </div>
      <div className="co-m-table-grid__body">
        {containers.map((c: any, i: number) => (
          <ContainerRow key={i} pod={pod} container={c} />
        ))}
      </div>
    </div>
  </>
);

const PodGraphs = requirePrometheus(({ pod }) => (
  <>
    <div className="row">
      <div className="col-md-12 col-lg-4">
        <Area
          title="Memory Usage"
          humanize={humanizeDecimalBytes}
          namespace={pod.metadata.namespace}
          query={`sum(container_memory_working_set_bytes{pod='${pod.metadata.name}',namespace='${
            pod.metadata.namespace
          }',container='',}) BY (pod, namespace)`}
        />
      </div>
      <div className="col-md-12 col-lg-4">
        <Area
          title="CPU Usage"
          humanize={humanizeCpuCores}
          namespace={pod.metadata.namespace}
          query={`pod:container_cpu_usage:sum{pod='${pod.metadata.name}',namespace='${
            pod.metadata.namespace
          }'}`}
        />
      </div>
      <div className="col-md-12 col-lg-4">
        <Area
          title="Filesystem"
          humanize={humanizeDecimalBytes}
          namespace={pod.metadata.namespace}
          query={`pod:container_fs_usage_bytes:sum{pod='${pod.metadata.name}',namespace='${
            pod.metadata.namespace
          }'}`}
        />
      </div>
    </div>

    <br />
  </>
));

export const PodStatus: React.FC<PodStatusProps> = ({ pod }) => <Status status={podPhase(pod)} />;

export const PodDetailsList: React.FC<PodDetailsListProps> = ({ pod }) => {
  return (
    <dl className="co-m-pane__details">
      <dt>Status</dt>
      <dd>
        <PodStatus pod={pod} />
      </dd>
      <DetailsItem label="Restart Policy" obj={pod} path="spec.restartPolicy">
        {getRestartPolicyLabel(pod)}
      </DetailsItem>
      <DetailsItem label="Active Deadline Seconds" obj={pod} path="spec.activeDeadlineSeconds">
        {pod.spec.progressDeadlineSeconds
          ? pluralize(pod.spec.activeDeadlineSeconds, 'second')
          : 'Not Configured'}
      </DetailsItem>
      <DetailsItem label="Pod IP" obj={pod} path="status.podIP" />
      <DetailsItem label="Node" obj={pod} path="spec.nodeName" hideEmpty>
        <NodeLink name={pod.spec.nodeName} />
      </DetailsItem>
    </dl>
  );
};

export const PodResourceSummary: React.FC<PodResourceSummaryProps> = ({ pod }) => (
  <ResourceSummary resource={pod} showNodeSelector showTolerations />
);

const Details: React.FC<PodDetailsProps> = ({ obj: pod }) => {
  const limits = {
    cpu: null,
    memory: null,
  };
  limits.cpu = _.reduce(
    pod.spec.containers,
    (sum, container) => {
      const value = units.dehumanize(_.get(container, 'resources.limits.cpu', 0), 'numeric').value;
      return sum + value;
    },
    0,
  );
  limits.memory = _.reduce(
    pod.spec.containers,
    (sum, container) => {
      const value = units.dehumanize(
        _.get(container, 'resources.limits.memory', 0),
        'binaryBytesWithoutB',
      ).value;
      return sum + value;
    },
    0,
  );

  return (
    <>
      <ScrollToTopOnMount />
      <div className="co-m-pane__body">
        <SectionHeading text="Pod Overview" />
        <PodGraphs pod={pod} />
        <div className="row">
          <div className="col-sm-6">
            <PodResourceSummary pod={pod} />
          </div>
          <div className="col-sm-6">
            <PodDetailsList pod={pod} />
          </div>
        </div>
      </div>
      {pod.spec.initContainers && (
        <div className="co-m-pane__body">
          <PodContainerTable
            key="initContainerTable"
            heading="Init Containers"
            containers={pod.spec.initContainers}
            pod={pod}
          />
        </div>
      )}
      <div className="co-m-pane__body">
        <PodContainerTable
          key="containerTable"
          heading="Containers"
          containers={pod.spec.containers}
          pod={pod}
        />
      </div>
      <div className="co-m-pane__body">
        <VolumesTable resource={pod} heading="Volumes" />
      </div>
    </>
  );
};

const EnvironmentPage = (props: any) => (
  <AsyncComponent
    loader={() => import('./environment.jsx').then((c) => c.EnvironmentPage)}
    {...props}
  />
);

const envPath = ['spec', 'containers'];
const PodEnvironmentComponent = (props) => (
  <EnvironmentPage obj={props.obj} rawEnvData={props.obj.spec} envPath={envPath} readOnly={true} />
);

const PodExecLoader: React.FC<PodExecLoaderProps> = ({ obj }) => (
  <div className="co-m-pane__body">
    <div className="row">
      <div className="col-xs-12">
        <div className="panel-body">
          <AsyncComponent loader={() => import('./pod-exec').then((c) => c.PodExec)} obj={obj} />
        </div>
      </div>
    </div>
  </div>
);

export const PodsDetailsPage: React.FC<PodDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    pages={[
      {
        href: 'dashboard', // TODO: make it default once additional Cards are implemented
        name: 'Dashboard',
        component: PodDashboard,
      },
      navFactory.details(Details),
      navFactory.editYaml(),
      navFactory.envEditor(PodEnvironmentComponent),
      navFactory.logs(PodLogs),
      navFactory.events(ResourceEventStream),
      {
        href: 'terminal',
        name: 'Terminal',
        component: PodExecLoader,
      },
    ]}
  />
);
PodsDetailsPage.displayName = 'PodsDetailsPage';

export const PodList: React.FC = (props) => (
  <Table {...props} aria-label="Pods" Header={PodTableHeader} Row={PodTableRow} virtualize />
);
PodList.displayName = 'PodList';

const filters = [
  {
    type: 'pod-status',
    selected: ['Running', 'Pending', 'Terminating', 'CrashLoopBackOff'],
    reducer: podPhaseFilterReducer,
    items: [
      { id: 'Running', title: 'Running' },
      { id: 'Pending', title: 'Pending' },
      { id: 'Terminating', title: 'Terminating' },
      { id: 'CrashLoopBackOff', title: 'CrashLoopBackOff' },
      // Use title "Completed" to match what appears in the status column for the pod.
      // The pod phase is "Succeeded," but the container state is "Completed."
      { id: 'Succeeded', title: 'Completed' },
      { id: 'Failed', title: 'Failed' },
      { id: 'Unknown', title: 'Unknown ' },
    ],
  },
];

export class PodsPage extends React.Component<PodPageProps> {
  shouldComponentUpdate(nextProps: PodPageProps) {
    return !_.isEqual(nextProps, this.props);
  }
  render() {
    const { canCreate = true } = this.props;
    return (
      <ListPage
        {...this.props}
        canCreate={canCreate}
        kind="Pod"
        ListComponent={PodList}
        rowFilters={filters}
      />
    );
  }
}

type ReadinessProps = {
  pod: PodKind;
};

type ContainerLinkProps = {
  pod: PodKind;
  name: string;
};

type ContainerRowProps = {
  pod: PodKind;
  container: ContainerSpec;
};

type PodContainerTableProps = {
  heading: string;
  containers: ContainerSpec[];
  pod: PodKind;
};

type PodStatusProps = {
  pod: PodKind;
};

type PodResourceSummaryProps = {
  pod: PodKind;
};

type PodDetailsListProps = {
  pod: PodKind;
};

type PodExecLoaderProps = {
  obj: PodKind;
};

type PodDetailsProps = {
  obj: PodKind;
};

type PodPageProps = {
  canCreate?: boolean;
  fieldSelector?: any;
  namespace?: string;
  selector?: any;
  showTitle?: boolean;
};

type PodDetailsPageProps = {
  kind: K8sResourceKindReference;
  match: any;
};
