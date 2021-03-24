import * as _ from 'lodash';
import {
  AlertAction,
  ClusterServiceVersionAction,
  DashboardsCard,
  DashboardsOverviewHealthResourceSubsystem,
  DashboardsOverviewUtilizationItem,
  DashboardsTab,
  HorizontalNavTab,
  ModelDefinition,
  ModelFeatureFlag,
  Plugin,
  ResourceTabPage,
  RoutePage,
  ResourceDetailsPage,
  DashboardsOverviewResourceActivity,
  CustomFeatureFlag,
  StorageClassProvisioner,
  ProjectDashboardInventoryItem,
  ResourceClusterNavItem,
  ResourceNSNavItem,
  ResourceListPage,
} from '@console/plugin-sdk';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { GridPosition } from '@console/shared/src/components/dashboard/DashboardGrid';
import { referenceForModel } from '@console/internal/module/k8s';
import { NodeModel } from '@console/internal/models';
import { LSO_DEVICE_DISCOVERY } from '@console/local-storage-operator-plugin/src/plugin';
import { OCS_ATTACHED_DEVICES_FLAG } from '@console/local-storage-operator-plugin/src/features';
import * as models from './models';
import { getCephHealthState } from './components/dashboards/persistent-internal/status-card/utils';
import { isClusterExpandActivity } from './components/dashboards/persistent-internal/activity-card/cluster-expand-activity';
import { StorageClassFormProvisoners } from './utils/ocs-storage-class-params';
import { WatchCephResource } from './types';
import {
  detectOCS,
  detectOCSSupportedFeatures,
  detectRGW,
  CEPH_FLAG,
  OCS_INDEPENDENT_FLAG,
  OCS_CONVERGED_FLAG,
  OCS_FLAG,
  NOOBAA_FLAG,
} from './features';
import { getAlertActionPath } from './utils/alert-action-path';
import { OSD_DOWN_ALERT, OSD_DOWN_AND_OUT_ALERT } from './constants';
import { getObcStatusGroups } from './components/dashboards/object-service/buckets-card/utils';

type ConsumedExtensions =
  | AlertAction
  | ModelFeatureFlag
  | HorizontalNavTab
  | ModelDefinition
  | DashboardsTab
  | DashboardsCard
  | DashboardsOverviewHealthResourceSubsystem<WatchCephResource>
  | DashboardsOverviewUtilizationItem
  | RoutePage
  | CustomFeatureFlag
  | ClusterServiceVersionAction
  | ResourceDetailsPage
  | ResourceTabPage
  | ClusterServiceVersionAction
  | DashboardsOverviewResourceActivity
  | StorageClassProvisioner
  | ProjectDashboardInventoryItem
  | ResourceClusterNavItem
  | ResourceNSNavItem
  | ResourceListPage;

const apiObjectRef = referenceForModel(models.OCSServiceModel);

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.OCSServiceModel,
      flag: CEPH_FLAG,
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectOCSSupportedFeatures,
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectOCS,
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectRGW,
    },
    flags: {
      required: [OCS_FLAG],
    },
  },
  {
    type: 'StorageClass/Provisioner',
    properties: {
      getStorageClassProvisioner: StorageClassFormProvisoners,
    },
  },
  {
    type: 'Dashboards/Tab',
    properties: {
      id: 'persistent-storage',
      // t('ceph-storage-plugin~Persistent Storage')
      title: '%ceph-storage-plugin~Persistent Storage%',
    },
    flags: {
      required: [OCS_CONVERGED_FLAG],
      disallowed: [OCS_INDEPENDENT_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${apiObjectRef}/~new`,
      loader: () =>
        import('./components/ocs-install/install-page' /* webpackChunkName: "install-page" */).then(
          (m) => m.default,
        ),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${referenceForModel(
        ClusterServiceVersionModel,
      )}/:appName/${apiObjectRef}/~new`,
      loader: () =>
        import('./components/ocs-install/install-page' /* webpackChunkName: "install-page" */).then(
          (m) => m.default,
        ),
    },
  },
  // Ceph Storage Dashboard Left cards
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboards/persistent-internal/details-card' /* webpackChunkName: "ceph-storage-details-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboards/persistent-internal/inventory-card' /* webpackChunkName: "ceph-storage-inventory-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboards/persistent-internal/storage-efficiency-card/storage-efficiency-card' /* webpackChunkName: "ceph-storage-efficiency-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  // Ceph Storage Dashboard Main Cards
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboards/persistent-internal/status-card/status-card' /* webpackChunkName: "ceph-storage-status-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboards/persistent-internal/raw-capacity-card/raw-capacity-card' /* webpackChunkName: "raw-capacity-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboards/persistent-internal/capacity-breakdown-card/capacity-breakdown-card' /* webpackChunkName: "ceph-storage-usage-breakdown-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboards/persistent-internal/utilization-card/utilization-card' /* webpackChunkName: "ceph-storage-utilization-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  // Ceph Storage Dashboard Right Cards
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'persistent-storage',
      position: GridPosition.RIGHT,
      loader: () =>
        import(
          './components/dashboards/persistent-internal/activity-card/activity-card' /* webpackChunkName: "ceph-storage-activity-card" */
        ).then((m) => m.ActivityCard),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'Dashboards/Overview/Health/Resource',
    properties: {
      // t('ceph-storage-plugin~Storage')
      title: '%ceph-storage-plugin~Storage%',
      resources: {
        ceph: {
          kind: referenceForModel(models.CephClusterModel),
          namespaced: false,
          isList: true,
        },
      },
      healthHandler: getCephHealthState,
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'ClusterServiceVersion/Action',
    properties: {
      kind: 'StorageCluster',
      // t('ceph-storage-plugin~Add Capacity')
      label: '%ceph-storage-plugin~Add Capacity%',
      apiGroup: models.OCSServiceModel.apiGroup,
      callback: (kind, ocsConfig) => () => {
        const clusterObject = { ocsConfig };
        import(
          './components/modals/add-capacity-modal/add-capacity-modal' /* webpackChunkName: "ceph-storage-add-capacity-modal" */
        )
          .then((m) => m.addCapacityModal(clusterObject))
          .catch((e) => {
            throw e;
          });
      },
    },
    flags: {
      disallowed: [OCS_INDEPENDENT_FLAG],
    },
  },
  {
    type: 'Dashboards/Tab',
    properties: {
      id: 'independent-dashboard',
      // t('ceph-storage-plugin~Persistent Storage')
      title: '%ceph-storage-plugin~Persistent Storage%',
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG],
    },
  },
  // Left Cards
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'independent-dashboard',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboards/persistent-external/details-card' /* webpackChunkName: "indepedent-details-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'independent-dashboard',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboards/persistent-internal/inventory-card' /* webpackChunkName: "ceph-storage-inventory-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG],
    },
  },
  // Center
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'independent-dashboard',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboards/persistent-external/status-card' /* webpackChunkName: "indepedent-status-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'independent-dashboard',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboards/persistent-external/breakdown-card' /* webpackChunkName: "independent-breakdown-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'independent-dashboard',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboards/persistent-external/utilization-card' /* webpackChunkName: "utilization-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG],
    },
  },
  // Right
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'independent-dashboard',
      position: GridPosition.RIGHT,
      loader: () =>
        import(
          './components/dashboards/persistent-internal/activity-card/activity-card' /* webpackChunkName: "ceph-storage-activity-card" */
        ).then((m) => m.ActivityCard),
    },
    flags: {
      required: [OCS_INDEPENDENT_FLAG],
    },
  },
  {
    type: 'Dashboards/Overview/Activity/Resource',
    properties: {
      k8sResource: {
        isList: true,
        kind: referenceForModel(models.OCSServiceModel),
        namespaced: false,
        prop: 'storage-cluster',
      },
      isActivity: isClusterExpandActivity,
      loader: () =>
        import(
          './components/dashboards/persistent-internal/activity-card/cluster-expand-activity' /* webpackChunkName: "ceph-storage-plugin" */
        ).then((m) => m.ClusterExpandActivity),
    },
    flags: {
      required: [CEPH_FLAG],
    },
  },
  {
    type: 'HorizontalNavTab',
    properties: {
      model: NodeModel,
      page: {
        href: 'disks',
        // t('ceph-storage-plugin~Disks')
        name: '%ceph-storage-plugin~Disks%',
      },
      loader: () =>
        import(
          './components/disk-inventory/ocs-disks-list' /* webpackChunkName: "ocs-nodes-disks-list" */
        ).then((m) => m.OCSNodesDiskListPage),
    },
    flags: {
      required: [OCS_ATTACHED_DEVICES_FLAG, LSO_DEVICE_DISCOVERY],
    },
  },
  {
    type: 'AlertAction',
    properties: {
      alert: OSD_DOWN_ALERT,
      // t('ceph-storage-plugin~Troubleshoot')
      text: '%ceph-storage-plugin~Troubleshoot%',
      path: getAlertActionPath,
    },
    flags: {
      required: [LSO_DEVICE_DISCOVERY, OCS_ATTACHED_DEVICES_FLAG],
    },
  },
  {
    type: 'AlertAction',
    properties: {
      alert: OSD_DOWN_AND_OUT_ALERT,
      // t('ceph-storage-plugin~Troubleshoot')
      text: '%ceph-storage-plugin~Troubleshoot%',
      path: getAlertActionPath,
    },
    flags: {
      required: [LSO_DEVICE_DISCOVERY, OCS_ATTACHED_DEVICES_FLAG],
    },
  },
  // Noobaa Related Plugins
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${referenceForModel(
        models.NooBaaBucketClassModel,
      )}/~new`,
      loader: () =>
        import('./components/bucket-class/create-bc' /* webpackChunkName: "create-bc" */).then(
          (m) => m.default,
        ),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: [
        `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${referenceForModel(
          models.NooBaaBackingStoreModel,
        )}/~new`,
        `/k8s/ns/:ns/${referenceForModel(models.NooBaaBackingStoreModel)}/~new`,
      ],
      loader: () =>
        import(
          './components/create-backingstore-page/create-bs-page' /* webpackChunkName: "create-bs" */
        ).then((m) => m.default),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: [
        `/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/${referenceForModel(
          models.NooBaaNamespaceStoreModel,
        )}/~new`,
        `/k8s/ns/:ns/${referenceForModel(models.NooBaaNamespaceStoreModel)}/~new`,
      ],
      loader: () =>
        import(
          './components/namespace-store/create-namespace-store' /* webpackChunkName: "create-namespace-store" */
        ).then((m) => m.default),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.NooBaaSystemModel,
      flag: NOOBAA_FLAG,
    },
  },
  {
    type: 'Dashboards/Tab',
    properties: {
      id: 'object-service',
      // t('ceph-storage-plugin~Object Service')
      title: '%ceph-storage-plugin~Object Service%',
    },
    flags: {
      required: [NOOBAA_FLAG, OCS_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboards/object-service/status-card/status-card' /* webpackChunkName: "object-service-status-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboards/object-service/details-card/details-card' /* webpackChunkName: "object-service-details-card" */
        ).then((m) => m.DetailsCard),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboards/object-service/storage-efficiency-card/storage-efficiency-card' /* webpackChunkName: "object-service-storage-efficiency-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboards/object-service/buckets-card/buckets-card' /* webpackChunkName: "object-service-buckets-card" */
        ).then((m) => m.BucketsCard),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboards/object-service/capacity-breakdown/capacity-breakdown-card' /* webpackChunkName: "object-service-capacity-breakdown-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.MAIN,
      loader: () =>
        import(
          './components/dashboards/object-service/data-consumption-card/data-consumption-card' /* webpackChunkName: "object-service-data-consumption-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.RIGHT,
      loader: () =>
        import(
          './components/dashboards/object-service/activity-card/activity-card' /* webpackChunkName: "object-service-activity-card" */
        ).then((m) => m.default),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Dashboards/Card',
    properties: {
      tab: 'object-service',
      position: GridPosition.LEFT,
      loader: () =>
        import(
          './components/dashboards/object-service/resource-providers-card/resource-providers-card' /* webpackChunkName: "object-service-resource-providers-card" */
        ).then((m) => m.ResourceProvidersCard),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'NavItem/ResourceCluster',
    properties: {
      id: 'objectbuckets',
      section: 'storage',
      componentProps: {
        // t('ceph-storage-plugin~Object Buckets')
        name: '%ceph-storage-plugin~Object Buckets%',
        resource: models.NooBaaObjectBucketModel.plural,
      },
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.NooBaaObjectBucketModel,
      loader: () =>
        import(
          './components/object-bucket-page/object-bucket' /* webpackChunkName: "object-bucket-page" */
        ).then((m) => m.ObjectBucketsPage),
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.NooBaaObjectBucketModel,
      loader: () =>
        import(
          './components/object-bucket-page/object-bucket' /* webpackChunkName: "object-bucket-page" */
        ).then((m) => m.ObjectBucketDetailsPage),
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      id: 'objectbucketclaims',
      section: 'storage',
      componentProps: {
        // t('ceph-storage-plugin~Object Bucket Claims')
        name: '%ceph-storage-plugin~Object Bucket Claims%',
        resource: models.NooBaaObjectBucketClaimModel.plural,
      },
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.NooBaaObjectBucketClaimModel,
      loader: () =>
        import(
          './components/object-bucket-claim-page/object-bucket-claim' /* webpackChunkName: "object-bucket-claim-page" */
        ).then((m) => m.ObjectBucketClaimsPage),
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.NooBaaObjectBucketClaimModel,
      loader: () =>
        import(
          './components/object-bucket-claim-page/object-bucket-claim' /* webpackChunkName: "object-bucket-claim-page" */
        ).then((m) => m.ObjectBucketClaimsDetailsPage),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: `/k8s/ns/:ns/${referenceForModel(models.NooBaaObjectBucketClaimModel)}/~new/form`,
      loader: () =>
        import(
          './components/object-bucket-claim-page/create-obc' /* webpackChunkName: "create-obc" */
        ).then((m) => m.CreateOBCPage),
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'Project/Dashboard/Inventory/Item',
    properties: {
      model: models.NooBaaObjectBucketClaimModel,
      mapper: getObcStatusGroups,
    },
    flags: {
      required: [NOOBAA_FLAG],
    },
  },
  {
    type: 'ClusterServiceVersion/Action',
    properties: {
      kind: models.NooBaaBucketClassModel.kind,
      // t('ceph-storage-plugin~Edit Bucket Class Resources')
      label: '%ceph-storage-plugin~Edit Bucket Class Resources%',
      apiGroup: models.NooBaaBucketClassModel.apiGroup,
      callback: (kind, obj) => () =>
        import('./components/bucket-class/modals/edit-backingstore-modal')
          .then((m) => m.default({ bucketClass: obj, modalClassName: 'nb-modal' }))
          // eslint-disable-next-line no-console
          .catch((e) => console.error(e)),
    },
  },
];

export default plugin;
