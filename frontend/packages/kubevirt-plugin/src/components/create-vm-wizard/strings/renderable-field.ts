import {
  ImportProvidersField,
  VMImportProvider,
  VMSettingsField,
  RenderableFieldResolver,
  VMWareProviderField,
  OvirtProviderField,
} from '../types';
import { ProvisionSource } from '../../../constants/vm/provision-source';

export const titleResolver: RenderableFieldResolver = {
  [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]: 'Red Hat Virtualization Instance',
  [OvirtProviderField.API_URL]: 'API URL',
  [OvirtProviderField.USERNAME]: 'Username',
  [OvirtProviderField.PASSWORD]: 'Password',
  [OvirtProviderField.REMEMBER_PASSWORD]: 'Save as new Red Hat Virtualization Instance secret',
  [OvirtProviderField.CERTIFICATE]: 'CA certificate',
  [OvirtProviderField.CLUSTER]: 'Cluster',
  [OvirtProviderField.VM]: 'VM to Import',
  [OvirtProviderField.STATUS]: '',
  [ImportProvidersField.PROVIDER]: 'Provider',
  [VMWareProviderField.VCENTER]: 'vCenter instance',
  [VMWareProviderField.HOSTNAME]: 'vCenter hostname',
  [VMWareProviderField.USER_NAME]: 'Username',
  [VMWareProviderField.USER_PASSWORD_AND_CHECK_CONNECTION]: 'Password',
  [VMWareProviderField.REMEMBER_PASSWORD]: 'Save as new vCenter instance secret',
  [VMWareProviderField.STATUS]: '',
  [VMWareProviderField.VM]: 'VM or Template to Import',
  [VMSettingsField.NAME]: 'Name',
  [VMSettingsField.DESCRIPTION]: 'Description',
  [VMSettingsField.USER_TEMPLATE]: 'Template',
  [VMSettingsField.PROVISION_SOURCE_TYPE]: 'Source',
  [VMSettingsField.CONTAINER_IMAGE]: 'Container Image',
  [VMSettingsField.IMAGE_URL]: 'URL',
  [VMSettingsField.OPERATING_SYSTEM]: 'Operating System',
  [VMSettingsField.FLAVOR]: 'Flavor',
  [VMSettingsField.MEMORY]: 'Memory',
  [VMSettingsField.CPU]: 'CPUs',
  [VMSettingsField.WORKLOAD_PROFILE]: 'Workload Profile',
  [VMSettingsField.START_VM]: 'Start virtual machine on creation',
};

export const placeholderResolver = {
  [ImportProvidersField.PROVIDER]: '--- Select Provider ---',
  [OvirtProviderField.OVIRT_ENGINE_SECRET_NAME]:
    '--- Select Red Hat Virtualization Instance Secret ---',
  [OvirtProviderField.CLUSTER]: '--- Select Cluster ---',
  [OvirtProviderField.VM]: '--- Select VM ---',
  [VMWareProviderField.VCENTER]: '--- Select vCenter Instance Secret ---',
  [VMWareProviderField.VM]: '--- Select VM or Template ---',
  [VMSettingsField.USER_TEMPLATE]: '--- Select Template ---',
  [VMSettingsField.PROVISION_SOURCE_TYPE]: '--- Select Source ---',
  [VMSettingsField.OPERATING_SYSTEM]: '--- Select Operating System ---',
  [VMSettingsField.FLAVOR]: '--- Select Flavor ---',
  [VMSettingsField.WORKLOAD_PROFILE]: '--- Select Workload Profile ---',
};

const provisionSourceHelpResolver = {
  [ProvisionSource.URL.getValue()]: 'An external URL to the .iso, .img, .qcow2 or .raw that the virtual machine should be created from.',
  [ProvisionSource.PXE.getValue()]: 'Discover provisionable virtual machines over the network.',
  [ProvisionSource.CONTAINER.getValue()]: 'Ephemeral virtual machine disk image which will be pulled from container registry.',
  [ProvisionSource.DISK.getValue()]: 'Select an existing PVC in Storage tab',
};

const providerHelpResolver = {
  [VMImportProvider.VMWARE]:
    'The virtual machine will be imported from a vCenter instance. Please provide connection details and select the virtual machine.',
};

export const helpResolver = {
  [ImportProvidersField.PROVIDER]: (provider) => providerHelpResolver[provider],
  [OvirtProviderField.USERNAME]: () => 'Should be in the following format: admin@internal',
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
  [VMSettingsField.FLAVOR]: () =>
    'The combination of processing power and memory that will be provided to the virtual machine.',
  [VMSettingsField.MEMORY]: () =>
    'The amount of memory that will be dedicated to the virtual machine.',
  [VMSettingsField.CPU]: () =>
    'The number of virtual CPU cores that will be dedicated to the virtual machine.',
  [VMSettingsField.WORKLOAD_PROFILE]: () =>
    'The category of workload that this virtual machine will be used for.',
};
