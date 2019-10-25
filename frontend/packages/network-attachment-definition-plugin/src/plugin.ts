import * as _ from 'lodash';
import {
  Plugin,
  ResourceNSNavItem,
  ResourceListPage,
  ModelFeatureFlag,
  YAMLTemplate,
  ModelDefinition,
  RoutePage,
} from '@console/plugin-sdk';
import * as models from './models';
import { NetworkAttachmentDefinitionsYAMLTemplates } from './models/templates';

type ConsumedExtensions =
  | ResourceNSNavItem
  | ResourceListPage
  | ModelFeatureFlag
  | YAMLTemplate
  | ModelDefinition
  | RoutePage;

const FLAG_NET_ATTACH_DEF = 'NET_ATTACH_DEF';

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
      model: models.NetworkAttachmentDefinitionModel,
      flag: FLAG_NET_ATTACH_DEF,
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Networking',
      componentProps: {
        name: 'Network Attachment Definitions',
        resource: models.NetworkAttachmentDefinitionModel.plural,
        required: FLAG_NET_ATTACH_DEF,
      },
      mergeAfter: 'Network Policies',
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.NetworkAttachmentDefinitionModel,
      loader: () =>
        import(
          './components/network-attachment-definitions/NetworkAttachmentDefinition' /* webpackChunkName: "network-attachment-definitions" */
        ).then((m) => m.NetworkAttachmentDefinitionsPage),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/ns/:ns/networkattachmentdefinitions/~new'],
      loader: () =>
        import(
          './components/network-attachment-definitions/NetworkAttachmentDefinitionCreateYaml' /* webpackChunkName: "network-attachment-definitions" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: models.NetworkAttachmentDefinitionModel,
      template: NetworkAttachmentDefinitionsYAMLTemplates.getIn(['default']),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/ns/:ns/networkattachmentdefinitions/~new/form'],
      loader: () =>
        import(
          './components/network-attachment-definitions/NetworkAttachmentDefinitionsForm' /* webpackChunkName: "network-attachment-definitions" */
        ).then((m) => m.default),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: [
        '/k8s/ns/:ns/networkattachmentdefinitions',
        '/k8s/all-namespaces/networkattachmentdefinitions',
      ],
      loader: () =>
        import(
          './components/network-attachment-definitions' /* webpackChunkName: "network-attachment-definitions" */
        ).then((m) => m.NetworkAttachmentDefinitionsPage),
    },
  },
];

export default plugin;
