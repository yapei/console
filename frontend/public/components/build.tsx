import * as React from 'react';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { Alert } from '@patternfly/react-core';

import { ONE_HOUR, ONE_MINUTE, Status } from '@console/shared';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import {
  K8sResourceKindReference,
  referenceFor,
  K8sResourceKind,
  k8sPatch,
  K8sKind,
} from '../module/k8s';
import { cloneBuild, formatBuildDuration, getBuildNumber } from '../module/k8s/builds';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import { errorModal, confirmModal } from './modals';
import {
  AsyncComponent,
  BuildHooks,
  BuildStrategy,
  DetailsItem,
  ExternalLink,
  history,
  humanizeBinaryBytes,
  humanizeCpuCores,
  Kebab,
  KebabAction,
  navFactory,
  ResourceKebab,
  ResourceLink,
  resourceObjPath,
  resourcePath,
  ResourceSummary,
  SectionHeading,
  Timestamp,
} from './utils';
import { BuildPipeline, BuildPipelineLogLink } from './build-pipeline';
import { BuildLogs } from './build-logs';
import { ResourceEventStream } from './events';
import { Area, requirePrometheus } from './graphs';
import { BuildModel } from '../models';
import { timeFormatter, timeFormatterWithSeconds } from './utils/datetime';

const BuildsReference: K8sResourceKindReference = 'Build';

const CloneBuildAction: KebabAction = (kind: K8sKind, build: K8sResourceKind) => ({
  // t('public~Rebuild')
  labelKey: 'public~Rebuild',
  callback: () =>
    cloneBuild(build)
      .then((clone) => {
        history.push(resourceObjPath(clone, referenceFor(clone)));
      })
      .catch((err) => {
        const error = err.message;
        errorModal({ error });
      }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    subresource: 'clone',
    name: build.metadata.name,
    namespace: build.metadata.namespace,
    verb: 'create',
  },
});

const CancelAction: KebabAction = (kind: K8sKind, build: K8sResourceKind) => ({
  // t('public~Cancel build')
  labelKey: 'public~Cancel build',
  hidden:
    build.status.phase !== 'Running' &&
    build.status.phase !== 'Pending' &&
    build.status.phase !== 'New',
  callback: () =>
    confirmModal({
      // t('public~Cancel build'),
      // t('public~Are you sure you want to cancel this build?'),
      // t('public~Yes, cancel'),
      // t("public~No, don't cancel"),
      titleKey: 'public~Cancel build',
      messageKey: 'public~Are you sure you want to cancel this build?',
      btnTextKey: 'public~Yes, cancel',
      cancelTextKey: "public~No, don't cancel",
      executeFn: () =>
        k8sPatch(kind, build, [{ op: 'add', path: '/status/cancelled', value: true }]),
    }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: build.metadata.name,
    namespace: build.metadata.namespace,
    verb: 'patch',
  },
});

const menuActions = [
  CloneBuildAction,
  CancelAction,
  ...Kebab.getExtensionsActionsForKind(BuildModel),
  ...Kebab.factory.common,
];

export enum BuildStrategyType {
  Docker = 'Docker',
  Devfile = 'Devfile',
  Custom = 'Custom',
  JenkinsPipeline = 'JenkinsPipeline',
  Source = 'Source',
}

export const BuildLogLink = ({ build }) => {
  const {
    metadata: { name, namespace },
  } = build;
  const isPipeline = _.get(build, 'spec.strategy.type') === BuildStrategyType.JenkinsPipeline;
  const { t } = useTranslation();
  return isPipeline ? (
    <BuildPipelineLogLink obj={build} />
  ) : (
    <Link to={`${resourcePath('Build', name, namespace)}/logs`}>{t('public~View logs')}</Link>
  );
};

export const BuildNumberLink = ({ build }) => {
  const {
    metadata: { name, namespace },
  } = build;
  const buildNumber = getBuildNumber(build);
  const title = _.isFinite(buildNumber) ? `#${buildNumber}` : name;

  return <Link to={resourcePath('Build', name, namespace)}>{title}</Link>;
};

const BuildGraphs = requirePrometheus(({ build }) => {
  const podName = build.metadata.annotations?.['openshift.io/build.pod-name'];
  if (!podName) {
    return null;
  }
  const endTime = build.status.completionTimestamp
    ? new Date(build.status.completionTimestamp).getTime()
    : Date.now();
  const runTime = build.status.startTimestamp
    ? endTime - new Date(build.status.startTimestamp).getTime()
    : ONE_HOUR;
  const timespan = Math.max(runTime, ONE_MINUTE); // Minimum timespan of one minute
  const namespace = build.metadata.namespace;
  const domain = React.useMemo(() => ({ x: [endTime - timespan, endTime] }), [endTime, timespan]);
  const areaProps = React.useMemo(
    () => ({
      namespace,
      endTime,
      timespan,
      formatDate: (d) =>
        timespan < 5 * ONE_MINUTE ? timeFormatterWithSeconds.format(d) : timeFormatter.format(d),
      domain, // force domain to match queried timespan
    }),
    [domain, endTime, namespace, timespan],
  );

  const { t } = useTranslation();
  return (
    <>
      <div className="row">
        <div className="col-md-12 col-lg-4">
          <Area
            byteDataType={ByteDataTypes.BinaryBytes}
            humanize={humanizeBinaryBytes}
            query={`sum(container_memory_working_set_bytes{pod='${podName}',namespace='${namespace}',container=''}) BY (pod, namespace)`}
            title={t('public~Memory usage')}
            {...areaProps}
          />
        </div>
        <div className="col-md-12 col-lg-4">
          <Area
            humanize={humanizeCpuCores}
            query={`pod:container_cpu_usage:sum{pod='${podName}',container='',namespace='${namespace}'}`}
            title={t('public~CPU usage')}
            {...areaProps}
          />
        </div>
        <div className="col-md-12 col-lg-4">
          <Area
            byteDataType={ByteDataTypes.BinaryBytes}
            humanize={humanizeBinaryBytes}
            query={`pod:container_fs_usage_bytes:sum{pod='${podName}',container='',namespace='${namespace}'}`}
            title={t('public~Filesystem')}
            {...areaProps}
          />
        </div>
      </div>
      <br />
    </>
  );
});

export const PipelineBuildStrategyAlert: React.FC<BuildsDetailsProps> = () => {
  const { t } = useTranslation();
  return (
    <Alert
      isInline
      className="co-alert"
      variant="info"
      title={t('public~Pipeline build strategy deprecation')}
    >
      <Trans i18nKey="public~pipelineBuildStrategyAlert">
        With the release of{' '}
        <ExternalLink
          href="https://openshift.github.io/pipelines-docs/"
          text={t('public~OpenShift Pipelines based on Tekton')}
        />
        , the pipelines build strategy has been deprecated. Users should either use Jenkins files
        directly on Jenkins or use cloud-native CI/CD with Openshift Pipelines.
        <ExternalLink
          href="https://github.com/openshift/pipelines-tutorial/"
          text={t('public~Try the OpenShift Pipelines tutorial')}
        />
      </Trans>
    </Alert>
  );
};

export const BuildsDetails: React.SFC<BuildsDetailsProps> = ({ obj: build }) => {
  const { logSnippet, message, startTimestamp } = build.status;
  const triggeredBy = _.map(build.spec.triggeredBy, 'message').join(', ');
  const duration = formatBuildDuration(build);
  const hasPipeline = build.spec.strategy.type === BuildStrategyType.JenkinsPipeline;
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        {hasPipeline && <PipelineBuildStrategyAlert obj={build} />}
        <SectionHeading text={t('public~Build details')} />
        <BuildGraphs build={build} />
        {hasPipeline && (
          <div className="row">
            <div className="col-xs-12">
              <BuildPipeline obj={build} />
            </div>
          </div>
        )}
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={build}>
              <DetailsItem
                label={t('public~Triggered by')}
                obj={build}
                path="spec.triggeredBy"
                hideEmpty
              >
                {triggeredBy}
              </DetailsItem>
              <DetailsItem
                label={t('public~Started')}
                obj={build}
                path="status.startTimestamp"
                hideEmpty
              >
                <Timestamp timestamp={startTimestamp} />
              </DetailsItem>
            </ResourceSummary>
          </div>
          <div className="col-sm-6">
            <BuildStrategy resource={build}>
              <DetailsItem label={t('public~Status')} obj={build} path="status.phase">
                <Status status={build.status.phase} />
              </DetailsItem>
              <DetailsItem label={t('public~Message')} obj={build} path="status.message" hideEmpty>
                {message}
              </DetailsItem>
              <DetailsItem
                label={t('public~Log snippet')}
                obj={build}
                path="status.logSnippet"
                hideEmpty
              >
                <pre>{logSnippet}</pre>
              </DetailsItem>
              <DetailsItem
                label={t('public~Duration')}
                obj={build}
                path="status.duration"
                hideEmpty
              >
                {duration}
              </DetailsItem>
            </BuildStrategy>
          </div>
        </div>
      </div>
      <BuildHooks resource={build} />
    </>
  );
};

export const getStrategyType = (strategy: BuildStrategyType) => {
  switch (strategy) {
    case BuildStrategyType.Docker:
      return 'dockerStrategy';
    case BuildStrategyType.Devfile:
      return 'devfileStrategy';
    case BuildStrategyType.Custom:
      return 'customStrategy';
    case BuildStrategyType.JenkinsPipeline:
      return 'jenkinsPipelineStrategy';
    case BuildStrategyType.Source:
      return 'sourceStrategy';
    default:
      return null;
  }
};

export const getEnvPath = (props) => {
  const strategyType = getStrategyType(props.obj.spec.strategy.type);
  return strategyType ? ['spec', 'strategy', strategyType] : null;
};

const EnvironmentPage = (props) => (
  <AsyncComponent
    loader={() => import('./environment.jsx').then((c) => c.EnvironmentPage)}
    {...props}
  />
);

export const BuildEnvironmentComponent = (props) => {
  const { obj } = props;
  const readOnly = obj.kind === 'Build';
  const envPath = getEnvPath(props);
  const { t } = useTranslation();
  if (envPath) {
    return (
      <EnvironmentPage
        obj={obj}
        rawEnvData={obj.spec.strategy[getStrategyType(obj.spec.strategy.type)]}
        envPath={getEnvPath(props)}
        readOnly={readOnly}
      />
    );
  }
  return (
    <div className="cos-status-box">
      <div className="text-center">
        {t('public~The environment variable editor does not support build strategy: {{ type }}', {
          type: obj.spec.strategy.type,
        })}
        .
      </div>
    </div>
  );
};

const pages = [
  navFactory.details(BuildsDetails),
  navFactory.editYaml(),
  navFactory.envEditor(BuildEnvironmentComponent),
  navFactory.logs(BuildLogs),
  navFactory.events(ResourceEventStream),
];

export const BuildsDetailsPage: React.SFC<BuildsDetailsPageProps> = (props) => (
  <DetailsPage {...props} kind={BuildsReference} menuActions={menuActions} pages={pages} />
);
BuildsDetailsPage.displayName = 'BuildsDetailsPage';

const tableColumnClasses = [
  classNames('col-sm-3', 'col-xs-6'),
  classNames('col-sm-3', 'col-xs-6'),
  classNames('col-sm-3', 'hidden-xs'),
  classNames('col-sm-3', 'hidden-xs'),
  Kebab.columnClass,
];

const BuildsTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={BuildsReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={obj.status.phase} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={BuildsReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export const BuildsList: React.SFC = (props) => {
  const { t } = useTranslation();
  const BuildsTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
        id: 'namespace',
      },
      {
        title: t('public~Status'),
        sortField: 'status.phase',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Created'),
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[4] },
      },
    ];
  };
  BuildsTableHeader.displayName = 'BuildsTableHeader';

  return (
    <Table
      {...props}
      aria-label={t('public~Builds')}
      Header={BuildsTableHeader}
      Row={BuildsTableRow}
      virtualize
    />
  );
};

BuildsList.displayName = 'BuildsList';

export const buildPhase = (build) => build.status.phase;

const allPhases = ['New', 'Pending', 'Running', 'Complete', 'Failed', 'Error', 'Cancelled'];

export const BuildsPage: React.SFC<BuildsPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <ListPage
      {...props}
      title={t('public~Builds')}
      kind={BuildsReference}
      ListComponent={BuildsList}
      canCreate={false}
      rowFilters={[
        {
          filterGroupName: t('public~Status'),
          type: 'build-status',
          reducer: buildPhase,
          items: _.map(allPhases, (phase) => ({
            id: phase,
            title: phase,
          })),
        },
      ]}
    />
  );
};
BuildsPage.displayName = 'BuildsListPage';

export type BuildsDetailsProps = {
  obj: any;
};

export type BuildsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

export type BuildsDetailsPageProps = {
  match: any;
};
