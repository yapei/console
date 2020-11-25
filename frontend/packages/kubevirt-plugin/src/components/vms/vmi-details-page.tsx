import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { navFactory } from '@console/internal/components/utils';
import { DetailsPage } from '@console/internal/components/factory';
import { PodModel, TemplateModel } from '@console/internal/models';
import { VMDisksAndFileSystemsPage } from '../vm-disks/vm-disks';
import { VMNics } from '../vm-nics';
import {
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';
import { getResource } from '../../utils';
import {
  VM_DETAIL_DETAILS_HREF,
  VM_DETAIL_DISKS_HREF,
  VM_DETAIL_NETWORKS_HREF,
  VM_DETAIL_CONSOLES_HREF,
} from '../../constants';
import { VMEvents } from './vm-events';
import { VMConsoleFirehose } from './vm-console';
import { VMDetailsFirehose } from './vm-details';
import { vmiMenuActionsCreator } from './menu-actions';
import { VMDashboard } from './vm-dashboard';
import VMIDetailsPageInfoMessage from '../info-messages/VMIDetailsPageInfoMessage';
import { TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_VM } from '../../constants/vm';
import { breadcrumbsForVMPage } from './vm-details-page';

export const VirtualMachinesInstanceDetailsPage: React.FC<VirtualMachinesInstanceDetailsPageProps> = (
  props,
) => {
  const { t } = useTranslation();
  const { name, ns: namespace } = props.match.params;

  const overviewPage = {
    href: '', // default landing page
    name: t('kubevirt-plugin~Overview'),
    component: VMDashboard,
  };

  const detailsPage = {
    href: VM_DETAIL_DETAILS_HREF,
    name: t('kubevirt-plugin~Details'),
    component: VMDetailsFirehose,
  };

  const consolePage = {
    href: VM_DETAIL_CONSOLES_HREF,
    name: t('kubevirt-plugin~Console'),
    component: VMConsoleFirehose,
  };

  const nicsPage = {
    href: VM_DETAIL_NETWORKS_HREF,
    name: t('kubevirt-plugin~Network Interfaces'),
    component: VMNics,
  };

  const disksPage = {
    href: VM_DETAIL_DISKS_HREF,
    name: t('kubevirt-plugin~Disks'),
    component: VMDisksAndFileSystemsPage,
  };

  const pages = [
    overviewPage,
    detailsPage,
    navFactory.editYaml(),
    consolePage,
    navFactory.events(VMEvents),
    nicsPage,
    disksPage,
  ];

  const resources = [
    getResource(VirtualMachineModel, {
      name,
      namespace,
      isList: false,
      prop: 'vm',
      optional: true,
    }),
    getResource(PodModel, { namespace, prop: 'pods' }),
    getResource(VirtualMachineInstanceMigrationModel, { namespace, prop: 'migrations' }),
    getResource(TemplateModel, {
      isList: true,
      namespace,
      prop: 'templates',
      matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_VM },
    }),
  ];

  return (
    <DetailsPage
      {...props}
      name={name}
      namespace={namespace}
      kind={VirtualMachineInstanceModel.kind}
      kindObj={VirtualMachineInstanceModel}
      menuActions={vmiMenuActionsCreator}
      pages={pages}
      resources={resources}
      breadcrumbsFor={breadcrumbsForVMPage(t, props.match)}
      customData={{ kindObj: VirtualMachineInstanceModel }}
    >
      <VMIDetailsPageInfoMessage name={name} namespace={namespace} />
    </DetailsPage>
  );
};

export type VirtualMachinesInstanceDetailsPageProps = {
  match: any;
};
