import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '@console/internal/redux';
import { Status, useCsvWatchResource } from '@console/shared';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import {
  AddHorizontalPodAutoScaler,
  DeleteHorizontalPodAutoScaler,
  EditHorizontalPodAutoScaler,
  hideActionForHPAs,
} from '@console/app/src/actions/modify-hpa';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { DeploymentModel } from '../models';
import { DeploymentKind, K8sKind, K8sResourceKindReference } from '../module/k8s';
import { configureUpdateStrategyModal, errorModal } from './modals';
import { Conditions } from './conditions';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import { DetailsPage, ListPage, Table, RowFunction } from './factory';
import {
  AsyncComponent,
  DetailsItem,
  Kebab,
  KebabAction,
  ContainerTable,
  navFactory,
  ResourceSummary,
  SectionHeading,
  togglePaused,
  WorkloadPausedAlert,
} from './utils';
import { ReplicaSetsPage } from './replicaset';
import { WorkloadTableRow, WorkloadTableHeader } from './workload-table';

const deploymentsReference: K8sResourceKindReference = 'Deployment';
const { ModifyCount, AddStorage, common } = Kebab.factory;

const UpdateStrategy: KebabAction = (kind: K8sKind, deployment: DeploymentKind) => ({
  // t('workload~Edit update strategy')
  labelKey: 'workload~Edit update strategy',
  callback: () => configureUpdateStrategyModal({ deployment }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: deployment.metadata.name,
    namespace: deployment.metadata.namespace,
    verb: 'patch',
  },
});

const PauseAction: KebabAction = (kind: K8sKind, obj: DeploymentKind) => ({
  // t('workload~Resume rollouts')
  // t('workload~Pause rollouts')
  labelKey: obj.spec.paused ? 'workload~Resume rollouts' : 'workload~Pause rollouts',
  callback: () => togglePaused(kind, obj).catch((err) => errorModal({ error: err.message })),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});

export const menuActions = [
  hideActionForHPAs(ModifyCount),
  PauseAction,
  AddHealthChecks,
  AddHorizontalPodAutoScaler,
  EditHorizontalPodAutoScaler,
  AddStorage,
  UpdateStrategy,
  DeleteHorizontalPodAutoScaler,
  ...Kebab.getExtensionsActionsForKind(DeploymentModel),
  EditHealthChecks,
  ...common,
];

export const DeploymentDetailsList: React.FC<DeploymentDetailsListProps> = ({ deployment }) => {
  const { t } = useTranslation();
  return (
    <dl className="co-m-pane__details">
      <DetailsItem
        label={t('workload~Update strategy')}
        obj={deployment}
        path="spec.strategy.type"
      />
      {deployment.spec.strategy.type === 'RollingUpdate' && (
        <>
          <DetailsItem
            label={t('workload~Max unavailable')}
            obj={deployment}
            path="spec.strategy.rollingUpdate.maxUnavailable"
          >
            {t('workload~{{maxUnavailable}} of {{count}} pod', {
              maxUnavailable: deployment.spec.strategy.rollingUpdate.maxUnavailable ?? 1,
              count: deployment.spec.replicas,
            })}
          </DetailsItem>
          <DetailsItem
            label={t('workload~Max surge')}
            obj={deployment}
            path="spec.strategy.rollingUpdate.maxSurge"
          >
            {t('workload~{{maxSurge}} greater than {{count}} pod', {
              maxSurge: deployment.spec.strategy.rollingUpdate.maxSurge ?? 1,
              count: deployment.spec.replicas,
            })}
          </DetailsItem>
        </>
      )}
      <DetailsItem
        label={t('workload~Progress deadline seconds')}
        obj={deployment}
        path="spec.progressDeadlineSeconds"
      >
        {deployment.spec.progressDeadlineSeconds
          ? t('workload~second', { count: deployment.spec.progressDeadlineSeconds })
          : t('workload~Not configured')}
      </DetailsItem>
      <DetailsItem
        label={t('workload~Min ready seconds')}
        obj={deployment}
        path="spec.minReadySeconds"
      >
        {deployment.spec.minReadySeconds
          ? t('workload~second', { count: deployment.spec.minReadySeconds })
          : t('workload~Not configured')}
      </DetailsItem>
    </dl>
  );
};
DeploymentDetailsList.displayName = 'DeploymentDetailsList';

const DeploymentDetails: React.FC<DeploymentDetailsProps> = ({ obj: deployment }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('workload~Deployment details')} />
        {deployment.spec.paused && <WorkloadPausedAlert obj={deployment} model={DeploymentModel} />}
        <PodRingSet key={deployment.metadata.uid} obj={deployment} path="/spec/replicas" />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary
                resource={deployment}
                showPodSelector
                showNodeSelector
                showTolerations
              >
                <dt>{t('workload~Status')}</dt>
                <dd>
                  {deployment.status.availableReplicas === deployment.status.updatedReplicas &&
                  deployment.spec.replicas === deployment.status.availableReplicas ? (
                    <Status status="Up to date" />
                  ) : (
                    <Status status="Updating" />
                  )}
                </dd>
              </ResourceSummary>
            </div>
            <div className="col-sm-6">
              <DeploymentDetailsList deployment={deployment} />
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('workload~Containers')} />
        <ContainerTable containers={deployment.spec.template.spec.containers} />
      </div>
      <div className="co-m-pane__body">
        <VolumesTable resource={deployment} heading={t('workload~Volumes')} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('workload~Conditions')} />
        <Conditions conditions={deployment.status.conditions} />
      </div>
    </>
  );
};
DeploymentDetails.displayName = 'DeploymentDetails';

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

const ReplicaSetsTab: React.FC<ReplicaSetsTabProps> = ({ obj }) => {
  const {
    metadata: { namespace },
    spec: { selector },
  } = obj;

  // Hide the create button to avoid confusion when showing replica sets for an object.
  return (
    <ReplicaSetsPage
      showTitle={false}
      namespace={namespace}
      selector={selector}
      canCreate={false}
    />
  );
};

const { details, editYaml, pods, envEditor, events } = navFactory;
export const DeploymentsDetailsPage: React.FC<DeploymentsDetailsPageProps> = (props) => {
  const ns = useSelector((state: RootState) => getActiveNamespace(state));

  const { csvData } = useCsvWatchResource(ns);
  // t('details-page~ReplicaSets')
  return (
    <DetailsPage
      {...props}
      kind={deploymentsReference}
      menuActions={menuActions}
      pages={[
        details(DeploymentDetails),
        editYaml(),
        {
          href: 'replicasets',
          nameKey: 'details-page~ReplicaSets',
          component: ReplicaSetsTab,
        },
        pods(),
        envEditor(environmentComponent),
        events(ResourceEventStream),
      ]}
      customData={{ csvs: csvData }}
    />
  );
};
DeploymentsDetailsPage.displayName = 'DeploymentsDetailsPage';

type DeploymentDetailsListProps = {
  deployment: DeploymentKind;
};

type DeploymentDetailsProps = {
  obj: DeploymentKind;
};

const kind = 'Deployment';

const DeploymentTableRow: RowFunction<DeploymentKind> = ({ obj, index, key, style, ...props }) => {
  return (
    <WorkloadTableRow
      obj={obj}
      index={index}
      rowKey={key}
      style={style}
      menuActions={menuActions}
      kind={kind}
      {...props}
    />
  );
};

const DeploymentTableHeader = () => {
  return WorkloadTableHeader();
};
DeploymentTableHeader.displayName = 'DeploymentTableHeader';

export const DeploymentsList: React.FC = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t('workload~Deployments')}
      Header={DeploymentTableHeader}
      Row={DeploymentTableRow}
      virtualize
    />
  );
};
DeploymentsList.displayName = 'DeploymentsList';

export const DeploymentsPage: React.FC<DeploymentsPageProps> = (props) => {
  const { csvData } = useCsvWatchResource(props.namespace);
  return (
    <ListPage
      kind={deploymentsReference}
      canCreate={true}
      ListComponent={DeploymentsList}
      customData={{ csvs: csvData }}
      {...props}
    />
  );
};
DeploymentsPage.displayName = 'DeploymentsPage';

type ReplicaSetsTabProps = {
  obj: DeploymentKind;
};

type DeploymentsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type DeploymentsDetailsPageProps = {
  match: any;
};
