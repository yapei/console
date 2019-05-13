import {
  Plugin,
  HrefNavItem,
  ResourceNSNavItem,
  ResourceListPage,
  ResourceDetailPage,
} from '@console/plugin-sdk';

// TODO(vojtech): internal code needed by plugins should be moved to console-shared package
import { PodModel } from '@console/internal/models';

type ConsumedExtensions =
  | HrefNavItem
  | ResourceNSNavItem
  | ResourceListPage
  | ResourceDetailPage;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'NavItem/Href',
    properties: {
      section: 'Home',
      componentProps: {
        name: 'Test Href Link',
        href: '/test',
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Workloads',
      componentProps: {
        name: 'Test ResourceNS Link',
        resource: 'pods',
      },
    },
  },
  {
    type: 'ResourcePage/List',
    properties: {
      model: PodModel,
      loader: () => import('@console/internal/components/pod' /* webpackChunkName: "pod" */).then(m => m.PodsPage),
    },
  },
  {
    type: 'ResourcePage/Detail',
    properties: {
      model: PodModel,
      loader: () => import('@console/internal/components/pod' /* webpackChunkName: "pod" */).then(m => m.PodsDetailsPage),
    },
  },
];

export default plugin;
