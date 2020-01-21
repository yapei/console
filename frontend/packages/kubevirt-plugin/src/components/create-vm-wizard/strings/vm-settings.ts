import {
  VMImportProvider,
  VMSettingsField,
  VMSettingsRenderableFieldResolver,
  VMWareProviderField,
} from '../types';
import { ProvisionSource } from '../../../constants/vm/provision-source';

export const titleResolver: VMSettingsRenderableFieldResolver = {
  [VMWareProviderField.VCENTER]: 'vCenter instance',
  [VMWareProviderField.HOSTNAME]: 'vCenter hostname',
  [VMWareProviderField.USER_NAME]: 'Username',
  [VMWareProviderField.USER_PASSWORD_AND_CHECK_CONNECTION]: 'Password',
  [VMWareProviderField.REMEMBER_PASSWORD]: 'Save as new vCenter instance secret',
  [VMWareProviderField.STATUS]: '',
  [VMWareProviderField.VM]: 'VM or Template to Import',
  [VMSettingsField.NAME]: 'Name',
  [VMSettingsField.HOSTNAME]: 'Hostname',
  [VMSettingsField.DESCRIPTION]: 'Description',
  [VMSettingsField.USER_TEMPLATE]: 'Template',
  [VMSettingsField.PROVISION_SOURCE_TYPE]: 'Source',
  [VMSettingsField.PROVIDER]: 'Provider',
  [VMSettingsField.CONTAINER_IMAGE]: 'Container Image',
  [VMSettingsField.IMAGE_URL]: 'URL',
  [VMSettingsField.OPERATING_SYSTEM]: 'Operating System',
  [VMSettingsField.FLAVOR]: 'Flavor',
  [VMSettingsField.MEMORY]: 'Memory (GiB)',
  [VMSettingsField.CPU]: 'CPUs',
  [VMSettingsField.WORKLOAD_PROFILE]: 'Workload Profile',
  [VMSettingsField.START_VM]: 'Start virtual machine on creation',
};

export const placeholderResolver = {
  [VMWareProviderField.VCENTER]: '--- Select vCenter Instance Secret ---',
  [VMWareProviderField.VM]: '--- Select VM or Template ---',
  [VMSettingsField.USER_TEMPLATE]: '--- Select Template ---',
  [VMSettingsField.PROVISION_SOURCE_TYPE]: '--- Select Source ---',
  [VMSettingsField.PROVIDER]: '--- Select Provider ---',
  [VMSettingsField.OPERATING_SYSTEM]: '--- Select Operating System ---',
  [VMSettingsField.FLAVOR]: '--- Select Flavor ---',
  [VMSettingsField.WORKLOAD_PROFILE]: '--- Select Workload Profile ---',
};

const provisionSourceHelpResolver = {
  [ProvisionSource.URL.getValue()]: 'An external URL to the .iso, .img, .qcow2 or .raw that the virtual machine should be created from.',
  [ProvisionSource.PXE.getValue()]: 'Discover provisionable virtual machines over the network.',
  [ProvisionSource.CONTAINER.getValue()]: 'Ephemeral virtual machine disk image which will be pulled from container registry.',
  [ProvisionSource.IMPORT.getValue()]: 'Import a virtual machine from external service using a provider.',
  [ProvisionSource.DISK.getValue()]: 'Select an existing PVC in Storage tab',
};

const providerHelpResolver = {
  [VMImportProvider.VMWARE]:
    'The virtual machine will be imported from a vCenter instance. Please provide connection details and select the virtual machine.',
};

export const helpResolver = {
  [VMWareProviderField.VCENTER]: () =>
    'Select secret containing connection details for a vCenter instance.',
  [VMWareProviderField.HOSTNAME]: () =>
    'Address to be used for connection to a vCenter instance. The "https://" protocol will be added automatically. Example: "my.domain.com:1234".',
  [VMWareProviderField.USER_NAME]: () =>
    'User name to be used for connection to a vCenter instance.',
  [VMWareProviderField.USER_PASSWORD_AND_CHECK_CONNECTION]: () =>
    'User password to be used for connection to a vCenter instance.',
  [VMWareProviderField.VM]: () =>
    'Select a vCenter virtual machine to import. Loading of their list might take some time. The list will be enabled for selection once data are loaded.',
  [VMSettingsField.PROVISION_SOURCE_TYPE]: (sourceType: string) =>
    provisionSourceHelpResolver[sourceType],
  [VMSettingsField.PROVIDER]: (provider) => providerHelpResolver[provider],
  [VMSettingsField.FLAVOR]: () =>
    'The combination of processing power and memory that will be provided to the virtual machine.',
  [VMSettingsField.MEMORY]: () =>
    'The amount of memory that will be dedicated to the virtual machine.',
  [VMSettingsField.CPU]: () =>
    'The number of virtual CPU cores that will be dedicated to the virtual machine.',
  [VMSettingsField.WORKLOAD_PROFILE]: () =>
    'The category of workload that this virtual machine will be used for.',
};
