import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as Rmatch } from 'react-router-dom';
import { referenceForModel } from '@console/internal/module/k8s';
import { Page } from '@console/internal/components/utils';
import { TechPreviewBadge, MultiTabListPage } from '@console/shared';
import { DefaultPage } from '@console/internal/components/default-resource';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import {
  EventListenerModel,
  TriggerTemplateModel,
  TriggerBindingModel,
  ClusterTriggerBindingModel,
} from '../../models';

interface TriggersPageProps {
  match: Rmatch<any>;
}

const TriggersPage: React.FC<TriggersPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const {
    params: { ns: namespace },
  } = match;
  const [showTitle, canCreate] = [false, false];
  const menuActions = {
    eventListener: { model: EventListenerModel },
    triggerTemplate: { model: TriggerTemplateModel },
    triggerBinding: { model: TriggerBindingModel },
    culsterTriggerBinding: { model: ClusterTriggerBindingModel },
  };
  const pages: Page[] = [
    {
      href: '',
      name: EventListenerModel.labelPlural,
      component: DefaultPage,
      pageData: {
        kind: referenceForModel(EventListenerModel),
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'trigger-templates',
      name: TriggerTemplateModel.labelPlural,
      component: DefaultPage,
      pageData: {
        kind: referenceForModel(TriggerTemplateModel),
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'trigger-bindings',
      name: TriggerBindingModel.labelPlural,
      component: DefaultPage,
      pageData: {
        kind: referenceForModel(TriggerBindingModel),
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'cluster-trigger-bindings',
      name: ClusterTriggerBindingModel.labelPlural,
      component: DefaultPage,
      pageData: {
        kind: referenceForModel(ClusterTriggerBindingModel),
        canCreate,
        showTitle,
      },
    },
  ];

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <MultiTabListPage
        pages={pages}
        match={match}
        title={t('pipelines-plugin~Triggers')}
        badge={<TechPreviewBadge />}
        menuActions={menuActions}
      />
    </NamespacedPage>
  );
};

export default TriggersPage;
