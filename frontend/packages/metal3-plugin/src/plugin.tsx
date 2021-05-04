import * as _ from 'lodash';
import * as React from 'react';
import { MaintenanceIcon } from '@patternfly/react-icons';
import {
  DashboardsOverviewInventoryItem,
  Plugin,
  ResourceListPage,
  ResourceDetailsPage,
  RoutePage,
  ModelFeatureFlag,
  ModelDefinition,
  DashboardsOverviewResourceActivity,
  DashboardsOverviewInventoryItemReplacement,
  DashboardsInventoryItemGroup,
  CustomFeatureFlag,
  ResourceTabPage,
} from '@console/plugin-sdk';
import '@console/internal/i18n.js';
import { referenceForModel } from '@console/internal/module/k8s';
import { MachineModel, NodeModel, CertificateSigningRequestModel } from '@console/internal/models';
// TODO(jtomasek): change this to '@console/shared/src/utils' once @console/shared/src/utils modules
// no longer import from @console/internal (cyclic deps issues)
import { BareMetalHostModel, NodeMaintenanceModel, NodeMaintenanceOldModel } from './models';
import { getHostPowerStatus, hasPowerManagement } from './selectors';
import { HOST_POWER_STATUS_POWERING_OFF, HOST_POWER_STATUS_POWERING_ON } from './constants';
import { BareMetalHostKind } from './types';
import {
  detectBaremetalPlatform,
  BAREMETAL_FLAG,
  NODE_MAINTENANCE_FLAG,
  detectBMOEnabled,
  NODE_MAINTENANCE_OLD_FLAG,
} from './features';

type ConsumedExtensions =
  | DashboardsOverviewInventoryItem
  | DashboardsOverviewInventoryItemReplacement
  | DashboardsInventoryItemGroup
  | ResourceListPage
  | ResourceDetailsPage
  | RoutePage
  | ModelFeatureFlag
  | ModelDefinition
  | CustomFeatureFlag
  | DashboardsOverviewResourceActivity
  | ResourceTabPage;

const METAL3_FLAG = 'METAL3';

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: [BareMetalHostModel, NodeMaintenanceModel, NodeMaintenanceOldModel],
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: BareMetalHostModel,
      flag: METAL3_FLAG,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: NodeMaintenanceModel,
      flag: NODE_MAINTENANCE_FLAG,
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: NodeMaintenanceOldModel,
      flag: NODE_MAINTENANCE_OLD_FLAG,
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectBaremetalPlatform,
    },
  },
  {
    type: 'FeatureFlag/Custom',
    properties: {
      detect: detectBMOEnabled,
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: BareMetalHostModel,
      loader: () =>
        import(
          './components/baremetal-hosts/BareMetalHostsPage' /* webpackChunkName: "metal3-baremetalhost" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: BareMetalHostModel,
      loader: () =>
        import(
          './components/baremetal-hosts/BareMetalHostDetailsPage' /* webpackChunkName: "metal3-baremetalhost" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${referenceForModel(BareMetalHostModel)}/~new/form`,
      loader: () =>
        import(
          './components/baremetal-hosts/add-baremetal-host/AddBareMetalHostPage' /* webpackChunkName: "metal3-baremetalhost" */
        ).then((m) => m.default),
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/${referenceForModel(BareMetalHostModel)}/:name/edit`,
      loader: () =>
        import(
          './components/baremetal-hosts/add-baremetal-host/AddBareMetalHostPage' /* webpackChunkName: "metal3-baremetalhost" */
        ).then((m) => m.default),
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item/Replacement',
    properties: {
      model: NodeModel,
      additionalResources: {
        oldMaintenances: {
          isList: true,
          kind: referenceForModel(NodeMaintenanceOldModel),
          optional: true,
        },
        maintenances: {
          isList: true,
          kind: referenceForModel(NodeMaintenanceModel),
          optional: true,
        },
        csrs: {
          isList: true,
          kind: CertificateSigningRequestModel.kind,
          optional: true,
        },
      },
      mapper: () =>
        import('./components/baremetal-nodes/dashboard/utils' /* webpackChunkName: "node" */).then(
          (m) => m.getBMNStatusGroups,
        ),
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Dashboards/Overview/Inventory/Item',
    properties: {
      additionalResources: {
        machines: {
          isList: true,
          kind: referenceForModel(MachineModel),
        },
        nodes: {
          isList: true,
          kind: NodeModel.kind,
        },
        oldMaintenances: {
          isList: true,
          kind: referenceForModel(NodeMaintenanceOldModel),
          optional: true,
        },
        maintenances: {
          isList: true,
          kind: referenceForModel(NodeMaintenanceModel),
          optional: true,
        },
      },
      model: BareMetalHostModel,
      mapper: () =>
        import(
          './components/baremetal-hosts/dashboard/utils' /* webpackChunkName: "metal3-baremetalhost" */
        ).then((m) => m.getBMHStatusGroups),
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/cluster/nodes/'],
      loader: () =>
        import(
          './components/baremetal-nodes/BareMetalNodesPage' /* webpackChunkName: "node" */
        ).then((m) => m.default),
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Page/Route',
    properties: {
      path: ['/k8s/cluster/nodes/:name'],
      loader: () =>
        import(
          './components/baremetal-nodes/BareMetalNodeDetailsPage' /* webpackChunkName: "node" */
        ).then((m) => m.default),
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Dashboards/Overview/Activity/Resource',
    properties: {
      k8sResource: {
        isList: true,
        kind: referenceForModel(NodeMaintenanceModel),
        prop: 'maintenances',
      },
      isActivity: (resource) => _.get(resource.status, 'phase') === 'Running',
      getTimestamp: (resource) => new Date(resource.metadata.creationTimestamp),
      loader: () =>
        import(
          './components/maintenance/MaintenanceDashboardActivity' /* webpackChunkName: "node-maintenance" */
        ).then((m) => m.default),
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG, NODE_MAINTENANCE_FLAG],
    },
  },
  {
    type: 'Dashboards/Overview/Activity/Resource',
    properties: {
      k8sResource: {
        isList: true,
        kind: referenceForModel(NodeMaintenanceOldModel),
        prop: 'maintenances',
      },
      isActivity: (resource) => _.get(resource.status, 'phase') === 'Running',
      getTimestamp: (resource) => new Date(resource.metadata.creationTimestamp),
      loader: () =>
        import(
          './components/maintenance/MaintenanceDashboardActivity' /* webpackChunkName: "node-maintenance" */
        ).then((m) => m.default),
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG, NODE_MAINTENANCE_OLD_FLAG],
    },
  },
  {
    type: 'Dashboards/Inventory/Item/Group',
    properties: {
      id: 'node-maintenance',
      icon: <MaintenanceIcon />,
    },
  },
  {
    type: 'Dashboards/Overview/Activity/Resource',
    properties: {
      k8sResource: {
        kind: referenceForModel(BareMetalHostModel),
        prop: 'bmhs',
        isList: true,
      },
      isActivity: (resource: BareMetalHostKind) =>
        [HOST_POWER_STATUS_POWERING_OFF, HOST_POWER_STATUS_POWERING_ON].includes(
          getHostPowerStatus(resource),
        ) && hasPowerManagement(resource),
      loader: () =>
        import(
          './components/baremetal-hosts/dashboard/BareMetalStatusActivity' /* webpackChunkName: "metal3-powering" */
        ).then((m) => m.default),
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Page/Resource/Tab',
    properties: {
      href: 'nics',
      model: NodeModel,
      // t('metal3-plugin~Network Interfaces')
      name: '%metal3-plugin~Network Interfaces%',
      loader: () =>
        import('./components/baremetal-nodes/NICsPage').then(
          (m) => m.default,
        ) /* webpackChunkName: "metal3-bmn-nics" */,
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
  {
    type: 'Page/Resource/Tab',
    properties: {
      href: 'disks',
      model: NodeModel,
      // t('metal3-plugin~Disks')
      name: '%metal3-plugin~Disks%',
      loader: () =>
        import('./components/baremetal-nodes/DisksPage').then(
          (m) => m.default,
        ) /* webpackChunkName: "metal3-bmn-disks" */,
    },
    flags: {
      required: [BAREMETAL_FLAG, METAL3_FLAG],
    },
  },
];

export default plugin;
