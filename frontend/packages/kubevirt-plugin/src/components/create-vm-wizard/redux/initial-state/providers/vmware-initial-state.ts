import { VMImportProvider, VMWareProviderField } from '../../../types';
import { asDisabled, asHidden } from '../../../utils/utils';
import { V2VVMwareStatus } from '../../../../../statuses/v2vvmware';

export const getVmWareInitialState = () => {
  const hiddenByVCenter = asHidden(true, VMWareProviderField.VCENTER);
  const fields = {
    [VMWareProviderField.VCENTER]: {},
    [VMWareProviderField.HOSTNAME]: {
      isHidden: hiddenByVCenter,
    },
    [VMWareProviderField.USER_NAME]: {
      isHidden: hiddenByVCenter,
    },
    [VMWareProviderField.USER_PASSWORD_AND_CHECK_CONNECTION]: {
      isHidden: hiddenByVCenter,
    },
    [VMWareProviderField.CHECK_CONNECTION]: {
      isHidden: hiddenByVCenter,
      isDisabled: asDisabled(true, VMWareProviderField.VCENTER),
    },
    [VMWareProviderField.REMEMBER_PASSWORD]: {
      isHidden: hiddenByVCenter,
      value: true,
    },
    [VMWareProviderField.VM]: {
      isDisabled: asDisabled(true, VMWareProviderField.VM),
    },
    [VMWareProviderField.STATUS]: {
      isHidden: asHidden(true, VMImportProvider.VMWARE),
      value: V2VVMwareStatus.UNKNOWN.serialize(),
    },
    [VMWareProviderField.V2V_LAST_ERROR]: {
      isHidden: asHidden(true, VMWareProviderField.V2V_LAST_ERROR),
    },

    // simple values
    [VMWareProviderField.V2V_NAME]: null,
    [VMWareProviderField.NEW_VCENTER_NAME]: null,
  };

  Object.keys(fields).forEach((k) => {
    if (fields[k]) {
      fields[k].key = k;
    }
  });
  return fields;
};
