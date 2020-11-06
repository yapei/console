import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { K8sKind, NodeKind } from '@console/internal/module/k8s';
import { Kebab, KebabAction, asAccessReview } from '@console/internal/components/utils';
import { isNodeUnschedulable } from '@console/shared';
import { makeNodeSchedulable } from '../../k8s/requests/nodes';
import { createConfigureUnschedulableModal } from './modals';
import { NodeModel } from '@console/internal/models';
import { deleteModal } from '@console/internal/components/modals/delete-modal';

export const MarkAsUnschedulable: KebabAction = (kind: K8sKind, obj: NodeKind) => ({
  labelKey: 'nodes~Mark as unschedulable',
  hidden: isNodeUnschedulable(obj),
  callback: () => createConfigureUnschedulableModal({ resource: obj }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});

export const MarkAsSchedulable: KebabAction = (
  kind: K8sKind,
  obj: NodeKind,
  resources: {},
  { nodeMaintenance } = { nodeMaintenance: false }, // NOTE: used by node actions in metal3-plugin
) => ({
  labelKey: 'nodes~Mark as schedulable',
  hidden: !isNodeUnschedulable(obj) || nodeMaintenance,
  callback: () => makeNodeSchedulable(obj),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});

export const Delete: KebabAction = (kindObj: K8sKind, node: NodeKind) => {
  const { t } = useTranslation();
  const message = (
    <p>
      {t(
        'nodes~This action cannot be undone. Deleting a node will instruct Kubernetes that the node is down or unrecoverable and delete all pods scheduled to that node. If the node is still running but unresponsive and the node is deleted, stateful workloads and persistent volumes may suffer corruption or data loss. Only delete a node that you have confirmed is completely stopped and cannot be restored.',
      )}
    </p>
  );

  return {
    // t('nodes~Delete node')
    labelKey: 'nodes~Delete node',
    callback: () =>
      deleteModal({
        kind: kindObj,
        resource: node,
        message,
      }),
    accessReview: asAccessReview(NodeModel, node, 'delete'),
  };
};

const { ModifyLabels, ModifyAnnotations, Edit } = Kebab.factory;
export const menuActions = [
  MarkAsSchedulable,
  MarkAsUnschedulable,
  ModifyLabels,
  ModifyAnnotations,
  Edit,
  Delete,
];
