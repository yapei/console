export enum OperatingSystem {
  RHEL7 = 'Red Hat Enterprise Linux 7.0 or higher',
  RHEL8 = 'Red Hat Enterprise Linux 8.0 or higher',
  FEDORA = 'Fedora 32 or higher',
  CENTOS7 = 'CentOS 7 or higher',
  WINDOWS_10 = 'Microsoft Windows 10',
  VALIDATION_TEST = 'Validation Test',
}

export const OSIDLookup = {
  [OperatingSystem.WINDOWS_10]: 'win10',
};

export enum Flavor {
  TINY = 'Tiny',
  SMALL = 'Small',
  MEDIUM = 'Medium',
  LARGE = 'Large',
  CUSTOM = 'Custom',
}

export enum Workload {
  DESKTOP = 'Desktop',
  HIGH_PERFORMANCE = 'High-performance',
  SERVER = 'Server',
}

export enum Provider {
  RHV = 'Red Hat Virtualisation (RHV)',
  VMware = 'VMware',
}

export enum TemplateByName {
  RHEL6 = 'Red Hat Enterprise Linux 6.0+ VM',
  RHEL7 = 'Red Hat Enterprise Linux 7.0+ VM',
  RHEL8 = 'Red Hat Enterprise Linux 8.0+ VM',
  FEDORA = 'Fedora 31+ VM',
  WINDOWS_10 = 'Microsoft Windows 10 VM',
}

export enum StepTitle {
  SelectATemplate = 'Select a template',
  BootSource = 'Boot source',
  ReviewAndCreate = 'Review and create',
}
