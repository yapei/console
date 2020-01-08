import * as _ from 'lodash';
import * as React from 'react';
import { asAccessReview, Kebab, KebabOption } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared';
import { confirmModal } from '@console/internal/components/modals';
import { VMIKind, VMKind } from '../../types/vm';
import { isVMImporting, isVMRunning, isVMRunningWithVMI } from '../../selectors/vm';
import { getMigrationVMIName, isMigrating, findVMIMigration } from '../../selectors/vmi-migration';
import { VirtualMachineInstanceMigrationModel } from '../../models';
import { VMMultiStatus } from '../../types';
import { restartVM, startVM, stopVM, VMActionType } from '../../k8s/requests/vm';
import { startVMIMigration } from '../../k8s/requests/vmi';
import { cancelMigration } from '../../k8s/requests/vmim';
import { cloneVMModal } from '../modals/clone-vm-modal';
import { VMCDRomModal } from '../modals/cdrom-vm-modal';
import { getVMStatus } from '../../statuses/vm/vm';

type ActionArgs = {
  migration?: K8sResourceKind;
  vmi?: VMIKind;
  vmStatus?: VMMultiStatus;
};

const getVMActionMessage = (vm, action: VMActionType) => (
  <>
    Are you sure you want to {action} <strong>{getName(vm)}</strong> in namespace{' '}
    <strong>{getNamespace(vm)}</strong>?
  </>
);

export const menuActionStart = (
  kindObj: K8sKind,
  vm: VMKind,
  { vmStatus }: ActionArgs,
): KebabOption => {
  const title = 'Start Virtual Machine';
  return {
    hidden: isVMImporting(vmStatus) || isVMRunning(vm),
    label: title,
    callback: () =>
      confirmModal({
        title,
        message: getVMActionMessage(vm, VMActionType.Start),
        btnText: _.capitalize(VMActionType.Start),
        executeFn: () => startVM(vm),
      }),
    accessReview: asAccessReview(kindObj, vm, 'patch'),
  };
};

const menuActionStop = (kindObj: K8sKind, vm: VMKind): KebabOption => {
  const title = 'Stop Virtual Machine';
  return {
    hidden: !isVMRunning(vm),
    label: title,
    callback: () =>
      confirmModal({
        title,
        message: getVMActionMessage(vm, VMActionType.Stop),
        btnText: _.capitalize(VMActionType.Stop),
        executeFn: () => stopVM(vm),
      }),
    accessReview: asAccessReview(kindObj, vm, 'patch'),
  };
};

const menuActionRestart = (
  kindObj: K8sKind,
  vm: VMKind,
  { vmStatus, vmi, migration }: ActionArgs,
): KebabOption => {
  const title = 'Restart Virtual Machine';
  return {
    hidden: isVMImporting(vmStatus) || !isVMRunningWithVMI({ vm, vmi }) || isMigrating(migration),
    label: title,
    callback: () =>
      confirmModal({
        title,
        message: getVMActionMessage(vm, VMActionType.Restart),
        btnText: _.capitalize(VMActionType.Restart),
        executeFn: () => restartVM(vm),
      }),
    accessReview: asAccessReview(kindObj, vm, 'patch'),
  };
};

const menuActionMigrate = (
  kindObj: K8sKind,
  vm: VMKind,
  { vmStatus, vmi, migration }: ActionArgs,
): KebabOption => {
  const title = 'Migrate Virtual Machine';
  return {
    hidden: isVMImporting(vmStatus) || isMigrating(migration) || !isVMRunningWithVMI({ vm, vmi }),
    label: title,
    callback: () =>
      confirmModal({
        title,
        message: (
          <>
            Do you wish to migrate <strong>{getName(vmi)}</strong> vmi to another node?
          </>
        ),
        btnText: 'Migrate',
        executeFn: () => startVMIMigration(vmi),
      }),
  };
};

const menuActionCancelMigration = (
  kindObj: K8sKind,
  vm: VMKind,
  { migration }: ActionArgs,
): KebabOption => {
  const title = 'Cancel Virtual Machine Migration';
  return {
    hidden: !isMigrating(migration),
    label: title,
    callback: () =>
      confirmModal({
        title,
        message: (
          <>
            Are you sure you want to cancel <strong>{getMigrationVMIName(migration)}</strong>{' '}
            migration in <strong>{getNamespace(migration)}</strong> namespace?
          </>
        ),
        btnText: 'Cancel Migration',
        executeFn: () => cancelMigration(migration),
      }),
    accessReview:
      migration && asAccessReview(VirtualMachineInstanceMigrationModel, migration, 'delete'),
  };
};

const menuActionClone = (kindObj: K8sKind, vm: VMKind, { vmStatus }: ActionArgs): KebabOption => {
  return {
    hidden: isVMImporting(vmStatus),
    label: 'Clone Virtual Machine',
    callback: () => cloneVMModal({ vm }),
    accessReview: asAccessReview(kindObj, vm, 'patch'),
  };
};

const menuActionCdEdit = (kindObj: K8sKind, vm: VMKind, { vmStatus }: ActionArgs): KebabOption => {
  return {
    hidden: isVMImporting(vmStatus),
    label: 'Edit CD-ROMs',
    callback: () => VMCDRomModal({ vmLikeEntity: vm, modalClassName: 'modal-lg' }),
    accessReview: asAccessReview(kindObj, vm, 'patch'),
  };
};

export const vmMenuActions = [
  menuActionStart,
  menuActionStop,
  menuActionRestart,
  menuActionMigrate,
  menuActionCancelMigration,
  menuActionClone,
  menuActionCdEdit,
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  Kebab.factory.Delete,
];

export const vmiMenuActions = [
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  Kebab.factory.Delete,
];

type ExtraResources = { vmi: VMIKind; pods: PodKind[]; migrations: K8sResourceKind[] };

export const menuActionsCreator = (
  kindObj: K8sKind,
  vm: VMKind,
  { vmi, pods, migrations }: ExtraResources,
) => {
  const vmStatus = getVMStatus({ vm, vmi, pods, migrations });
  const migration = findVMIMigration(vmi, migrations);

  return vmMenuActions.map((action) => {
    return action(kindObj, vm, { vmi, vmStatus, migration });
  });
};
