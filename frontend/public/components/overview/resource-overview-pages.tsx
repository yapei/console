import { Map as ImmutableMap } from 'immutable';

import {
  GroupVersionKind,
  referenceForModel,
} from '../../module/k8s';
import {
  DaemonSetModel,
  DeploymentModel,
  DeploymentConfigModel,
  StatefulSetModel,
  PodModel,
} from '../../models';

export const resourceOverviewPages = ImmutableMap<GroupVersionKind | string, () => Promise<React.ComponentType<any>>>()
  .set(referenceForModel(DaemonSetModel), () => import('./daemon-set-overview' /* webpackChunkNmae: "daemon-set"*/).then(m => m.DaemonSetOverview))
  .set(referenceForModel(DeploymentModel), () => import('./deployment-overview' /* webpackChunkNmae: "deployment"*/).then(m => m.DeploymentOverviewPage))
  .set(referenceForModel(DeploymentConfigModel), () => import('./deployment-config-overview' /* webpackChunkNmae: "deployment-config"*/).then(m => m.DeploymentConfigOverviewPage))
  .set(referenceForModel(PodModel), () => import('./pod-overview' /* webpackChunkNmae: "pod"*/).then(m => m.PodOverviewPage))
  .set(referenceForModel(StatefulSetModel), () => import('./stateful-set-overview' /* webpackChunkNmae: "stateful-set"*/).then(m => m.StatefulSetOverview));
