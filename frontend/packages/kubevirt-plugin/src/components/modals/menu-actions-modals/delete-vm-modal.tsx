import * as React from 'react';
import * as _ from 'lodash';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory';
import { apiVersionForModel } from '@console/internal/module/k8s';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { VMKind, VMIKind, VMSnapshot } from '../../../types/vm';
import {
  VirtualMachineModel,
  VirtualMachineImportModel,
  VirtualMachineSnapshotModel,
} from '../../../models';
import { getVolumes } from '../../../selectors/vm';
import { useOwnedVolumeReferencedResources } from '../../../hooks/use-owned-volume-referenced-resources';
import { useVirtualMachineImport } from '../../../hooks/use-virtual-machine-import';
import { useUpToDateVMLikeEntity } from '../../../hooks/use-vm-like-entity';
import { deleteVM } from '../../../k8s/requests/vm';
import { VMIUsersAlert } from './vmi-users-alert';
import { redirectToList } from './utils';
import { getVmSnapshotVmName } from '../../../selectors/snapshot/snapshot';

export const DeleteVMModal = withHandlePromise((props: DeleteVMModalProps) => {
  const { inProgress, errorMessage, handlePromise, close, cancel, vm, vmi } = props;

  const snapshotResource: WatchK8sResource = {
    isList: true,
    kind: VirtualMachineSnapshotModel.kind,
    namespaced: true,
    namespace: getNamespace(vm),
  };

  const vmUpToDate = useUpToDateVMLikeEntity<VMKind>(vm);
  const [deleteDisks, setDeleteDisks] = React.useState<boolean>(true);
  const [deleteVMImport, setDeleteVMImport] = React.useState<boolean>(true);
  const [snapshots] = useK8sWatchResource<VMSnapshot[]>(snapshotResource);
  const vmHasSnapshots = snapshots.some((snap) => getVmSnapshotVmName(snap) === getName(vm));

  const namespace = getNamespace(vmUpToDate);
  const name = getName(vmUpToDate);

  const vmReference = {
    name,
    kind: VirtualMachineModel.kind,
    apiVersion: apiVersionForModel(VirtualMachineModel),
  } as any;

  const [vmImport, vmImportLoaded] = useVirtualMachineImport(vmUpToDate);
  const [ownedVolumeResources, isOwnedVolumeResourcesLoaded] = useOwnedVolumeReferencedResources(
    vmReference,
    namespace,
    getVolumes(vmUpToDate, null),
  );
  const isInProgress = inProgress || !vmImportLoaded || !isOwnedVolumeResourcesLoaded;
  const numOfAllResources = _.sum([ownedVolumeResources.length, vmImport ? 1 : 0]);

  const submit = (e) => {
    e.preventDefault();

    const promise = deleteVM(vmUpToDate, {
      vmImport,
      deleteVMImport,
      ownedVolumeResources,
      deleteOwnedVolumeResources: deleteDisks,
    });

    return handlePromise(promise, () => {
      close();
      redirectToList(vmUpToDate);
    });
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" />
        Delete {VirtualMachineModel.label}?
      </ModalTitle>
      <ModalBody>
        <p>
          Are you sure you want to delete <strong className="co-break-word">{name}</strong> in
          namespace <strong>{namespace}</strong>?
        </p>
        {numOfAllResources > 0 && (
          <p>
            The following resources will be deleted along with this virtual machine. Unchecked items
            will not be deleted.
          </p>
        )}
        {ownedVolumeResources.length > 0 && (
          <div className="checkbox">
            <label className="control-label">
              <input
                type="checkbox"
                onChange={() => setDeleteDisks(!deleteDisks)}
                checked={deleteDisks}
              />
              Delete Disks ({ownedVolumeResources.length}x)
            </label>
          </div>
        )}
        {vmImport && (
          <div className="checkbox">
            <label className="control-label">
              <input
                type="checkbox"
                onChange={() => setDeleteVMImport(!deleteVMImport)}
                checked={deleteVMImport}
              />
              Delete {VirtualMachineImportModel.label} Resource
            </label>
          </div>
        )}
        {vmHasSnapshots && (
          <>
            <strong>Warning: </strong>All snapshots of this virtual machine will be deleted as well.
          </>
        )}
      </ModalBody>
      <VMIUsersAlert vmi={vmi} cancel={cancel} alertTitle="Delete Virtual Machine alert" />
      <ModalSubmitFooter
        errorMessage={errorMessage}
        submitDisabled={isInProgress}
        inProgress={isInProgress}
        submitText="Delete"
        submitDanger
        cancel={cancel}
      />
    </form>
  );
});

export type DeleteVMModalProps = {
  vm: VMKind;
  vmi?: VMIKind;
} & ModalComponentProps &
  HandlePromiseProps;

export const deleteVMModal = createModalLauncher(DeleteVMModal);
