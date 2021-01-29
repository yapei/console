import {
  validateDNS1123SubdomainValue,
  ValidationErrorType,
  ValidationObject,
} from '@console/shared';
import { validateEntityAlreadyExists } from '../common';
import { UIValidation, UIValidationType } from '../../../types/ui/ui';

export const validateVmLikeEntityName = (
  value: string,
  namespace: string,
  vmLikeEntities,
  {
    existsErrorMessage,
    validations,
  }: { existsErrorMessage: string; validations?: UIValidation[] } = {
    existsErrorMessage: undefined,
    validations: undefined,
  },
): ValidationObject => {
  const lenValidation = validations?.find((val) => val.type === UIValidationType.LENGTH);
  const dnsValidation = validateDNS1123SubdomainValue(
    value,
    {
      // t('kubevirt-plugin~VM name cannot be empty')
      // t('kubevirt-plugin~VM name name can contain only alphanumberic characters')
      // t('kubevirt-plugin~VM name must start/end with alphanumberic character')
      // t('kubevirt-plugin~VM name cannot contain uppercase characters')
      // t('kubevirt-plugin~VM name is too long')
      // t('kubevirt-plugin~VM name is too short')
      emptyMsg: 'kubevirt-plugin~VM name cannot be empty',
      errorMsg: 'kubevirt-plugin~VM name name can contain only alphanumberic characters',
      startEndAlphanumbericMsg:
        'kubevirt-plugin~VM name must start/end with alphanumberic character',
      uppercaseMsg: 'kubevirt-plugin~VM name cannot contain uppercase characters',
      longMsg: 'kubevirt-plugin~VM name is too long',
      shortMsg: 'kubevirt-plugin~VM name is too short',
    },
    {
      min: lenValidation?.settings?.min,
      max: lenValidation?.settings?.max,
    },
  );

  return dnsValidation && dnsValidation.type === ValidationErrorType.Error
    ? dnsValidation
    : validateEntityAlreadyExists(value, namespace, vmLikeEntities, {
        errorMessage: existsErrorMessage,
      });
};
