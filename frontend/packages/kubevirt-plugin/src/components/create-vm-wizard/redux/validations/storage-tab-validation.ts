import { VMWizardTab } from '../../types';
import { InternalActionType, UpdateOptions } from '../types';
import { vmWizardInternalActions } from '../internal-actions';
import { validateDisk } from '../../../../utils/validations/vm';
import { iGetIn } from '../../../../utils/immutable';
import { checkTabValidityChanged } from '../../selectors/immutable/selectors';
import { getStoragesWithWrappers } from '../../selectors/selectors';
import { iGetStorages } from '../../selectors/immutable/storage';
import { iGetProvisionSource } from '../../selectors/immutable/vm-settings';
import { ProvisionSource } from '../../../../constants/vm/provision-source';

export const validateStorages = (options: UpdateOptions) => {
  const { id, prevState, dispatch, getState } = options;
  const state = getState();

  const prevIStorages = iGetStorages(prevState, id);
  const iStorages = iGetStorages(state, id);

  if (
    prevIStorages &&
    iStorages &&
    prevIStorages.size === iStorages.size &&
    !prevIStorages.find(
      (prevINetwork, prevINetworkIndex) => prevINetwork !== iStorages.get(prevINetworkIndex),
    )
  ) {
    return;
  }

  const storages = getStoragesWithWrappers(state, id);

  const validatedStorages = storages.map(
    ({
      diskWrapper,
      volumeWrapper,
      dataVolumeWrapper,
      persistentVolumeClaimWrapper,
      ...storageBundle
    }) => {
      const otherStorageBundles = storages.filter((n) => n.id !== storageBundle.id); // to discard networks with a same name
      const usedDiskNames = new Set(otherStorageBundles.map(({ diskWrapper: dw }) => dw.getName()));

      const usedPVCNames: Set<string> = new Set(
        otherStorageBundles
          .filter(({ dataVolume }) => dataVolume)
          .map(({ dataVolumeWrapper: dvw }) => dvw.getName()),
      );

      return {
        ...storageBundle,
        validation: validateDisk(
          diskWrapper,
          volumeWrapper,
          dataVolumeWrapper,
          persistentVolumeClaimWrapper,
          {
            usedDiskNames,
            usedPVCNames,
          },
        ),
      };
    },
  );

  dispatch(vmWizardInternalActions[InternalActionType.SetStorages](id, validatedStorages));
};

export const setStoragesTabValidity = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();
  const iStorages = iGetStorages(state, id);

  let hasAllRequiredFilled = iStorages.every((iStorage) =>
    iGetIn(iStorage, ['validation', 'hasAllRequiredFilled']),
  );

  if (hasAllRequiredFilled && iGetProvisionSource(state, id) === ProvisionSource.DISK) {
    hasAllRequiredFilled = !!iStorages.find(
      (storageBundle) =>
        iGetIn(storageBundle, ['disk', 'bootOrder']) === 1 &&
        iGetIn(storageBundle, ['disk', 'disk']) &&
        (iGetIn(storageBundle, ['volume', 'dataVolume']) ||
          iGetIn(storageBundle, ['volume', 'persistentVolumeClaim'])),
    );
  }

  let isValid = hasAllRequiredFilled;

  if (isValid) {
    isValid = iStorages.every((iStorage) => iGetIn(iStorage, ['validation', 'isValid']));
  }

  if (checkTabValidityChanged(state, id, VMWizardTab.STORAGE, isValid, hasAllRequiredFilled)) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetTabValidity](
        id,
        VMWizardTab.STORAGE,
        isValid,
        hasAllRequiredFilled,
      ),
    );
  }
};
