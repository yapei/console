import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import { Status } from '@console/shared';
import { ResourceEventStream } from './events';
import { DetailsPage, ListPage, Table, TableData, TableRow } from './factory';
import { replicaSetMenuActions } from './replicaset';
import {
  ContainerTable,
  navFactory,
  SectionHeading,
  ResourceSummary,
  ResourcePodCount,
  AsyncComponent,
  Kebab,
  ResourceLink,
  resourcePath,
  ResourceKebab,
  asAccessReview,
  OwnerReferences,
  Timestamp,
  PodsComponent,
} from './utils';

import { VolumesTable } from './volumes-table';
import { confirmModal } from './modals';
import { k8sPatch } from '../module/k8s';

const CancelAction = (kind, obj) => ({
  // t('workload~Cancel rollout')
  labelKey: 'workload~Cancel rollout',
  hidden: !_.includes(
    ['New', 'Pending', 'Running'],
    obj?.metadata?.annotations?.['openshift.io/deployment.phase'],
  ),
  callback: () =>
    confirmModal({
      title: i18next.t('workload~Cancel rollout'),
      message: i18next.t('workload~Are you sure you want to cancel this rollout?'),
      btnText: i18next.t('workload~Yes, cancel'),
      cancelText: i18next.t("workload~No, don't cancel"),
      executeFn: () =>
        k8sPatch(kind, obj, [
          {
            op: 'add',
            path: '/metadata/annotations/openshift.io~1deployment.cancelled',
            value: 'true',
          },
          {
            op: 'add',
            path: '/metadata/annotations/openshift.io~1deployment.status-reason',
            value: 'cancelled by the user',
          },
        ]),
    }),
  accessReview: asAccessReview(kind, obj, 'patch'),
});

const menuActions = [CancelAction, ...replicaSetMenuActions];

const EnvironmentPage = (props) => (
  <AsyncComponent
    loader={() => import('./environment.jsx').then((c) => c.EnvironmentPage)}
    {...props}
  />
);

const envPath = ['spec', 'template', 'spec', 'containers'];
const environmentComponent = (props) => (
  <EnvironmentPage
    obj={props.obj}
    rawEnvData={props.obj.spec.template.spec}
    envPath={envPath}
    readOnly={false}
  />
);

const { details, editYaml, pods, envEditor, events } = navFactory;

const ReplicationControllerPods = (props) => (
  <PodsComponent {...props} customData={{ showNodes: true }} />
);

export const ReplicationControllersDetailsPage = (props) => {
  const { t } = useTranslation();
  const Details = ({ obj: replicationController }) => {
    const revision = _.get(replicationController, [
      'metadata',
      'annotations',
      'openshift.io/deployment-config.latest-version',
    ]);
    const phase = _.get(replicationController, [
      'metadata',
      'annotations',
      'openshift.io/deployment.phase',
    ]);
    return (
      <>
        <div className="co-m-pane__body">
          <SectionHeading text={t('workload~ReplicationController details')} />
          <div className="row">
            <div className="col-md-6">
              <ResourceSummary
                resource={replicationController}
                showPodSelector
                showNodeSelector
                showTolerations
              >
                {revision && (
                  <>
                    <dt>{t('workload~Deployment revision')}</dt>
                    <dd>{revision}</dd>
                  </>
                )}
              </ResourceSummary>
            </div>
            <div className="col-md-6">
              {phase && (
                <>
                  <dt>{t('workload~Phase')}</dt>
                  <dd>
                    <Status status={phase} />
                  </dd>
                </>
              )}
              <ResourcePodCount resource={replicationController} />
            </div>
          </div>
        </div>
        <div className="co-m-pane__body">
          <SectionHeading text={t('workload~Containers')} />
          <ContainerTable containers={replicationController.spec.template.spec.containers} />
        </div>
        <div className="co-m-pane__body">
          <VolumesTable resource={replicationController} heading={t('workload~Volumes')} />
        </div>
      </>
    );
  };

  return (
    <DetailsPage
      {...props}
      getResourceStatus={(resource) =>
        resource?.metadata?.annotations?.['openshift.io/deployment.phase'] || null
      }
      menuActions={menuActions}
      pages={[
        details(Details),
        editYaml(),
        pods(ReplicationControllerPods),
        envEditor(environmentComponent),
        events(ResourceEventStream),
      ]}
    />
  );
};

const kind = 'ReplicationController';

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

export const ReplicationControllersList = (props) => {
  const { t } = useTranslation();
  const ReplicationControllerTableRow = ({ obj, index, key, style }) => {
    const phase = obj?.metadata?.annotations?.['openshift.io/deployment.phase'];

    return (
      <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
        <TableData className={tableColumnClasses[0]}>
          <ResourceLink
            kind={kind}
            name={obj.metadata.name}
            namespace={obj.metadata.namespace}
            title={obj.metadata.uid}
          />
        </TableData>
        <TableData
          className={classNames(tableColumnClasses[1], 'co-break-word')}
          columnID="namespace"
        >
          <ResourceLink
            kind="Namespace"
            name={obj.metadata.namespace}
            title={obj.metadata.namespace}
          />
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          <Link
            to={`${resourcePath(kind, obj.metadata.name, obj.metadata.namespace)}/pods`}
            title="pods"
          >
            {t('workload~{{statusReplicas}} of {{specReplicas}} pods', {
              statusReplicas: obj.status.replicas || 0,
              specReplicas: obj.spec.replicas,
            })}
          </Link>
        </TableData>
        <TableData className={tableColumnClasses[3]}>
          <Status status={phase} />
        </TableData>
        <TableData className={tableColumnClasses[4]}>
          <OwnerReferences resource={obj} />
        </TableData>
        <TableData className={tableColumnClasses[5]}>
          <Timestamp timestamp={obj.metadata.creationTimestamp} />
        </TableData>
        <TableData className={tableColumnClasses[6]}>
          <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
        </TableData>
      </TableRow>
    );
  };

  const ReplicationControllerTableHeader = () => [
    {
      title: t('workload~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('workload~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: t('workload~Status'),
      sortFunc: 'numReplicas',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('workload~Phase'),
      sortField: 'metadata.annotations["openshift.io/deployment.phase"]',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('workload~Owner'),
      sortField: 'metadata.ownerReferences[0].name',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('workload~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];

  return (
    <Table
      {...props}
      aria-label={t('workload~ReplicationControllers')}
      Header={ReplicationControllerTableHeader}
      Row={ReplicationControllerTableRow}
      virtualize
    />
  );
};

export const ReplicationControllersPage = (props) => {
  const { canCreate = true } = props;
  return (
    <ListPage
      canCreate={canCreate}
      kind="ReplicationController"
      ListComponent={ReplicationControllersList}
      {...props}
    />
  );
};
