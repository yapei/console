import * as React from 'react';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { DetailsPage } from '@console/internal/components/factory';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { ServiceModel } from '../../models';
import { serverlessTab } from '../../utils/serverless-tab-utils';

const ServiceDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { kindObj, match, kind } = props;
  const pages = [navFactory.details(DetailsForKind(kind)), navFactory.editYaml()];
  const commonActions = Kebab.factory.common.map((action) => action);
  const menuActionsCreator = [...Kebab.getExtensionsActionsForKind(ServiceModel), ...commonActions];
  const breadcrumbs = useTabbedTableBreadcrumbsFor(
    kindObj,
    match,
    'serving',
    serverlessTab(kindObj.kind),
  );
  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbs}
      pages={pages}
      menuActions={menuActionsCreator}
    />
  );
};

export default ServiceDetailsPage;
