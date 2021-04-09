import * as React from 'react';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import {
  useExtensions,
  DashboardsCard,
  DashboardsTab,
  isDashboardsCard,
  isDashboardsTab,
} from '@console/plugin-sdk';
import {
  getPluginTabPages,
  mapStateToProps,
  DashboardsPageProps,
} from '@console/internal/components/dashboard/dashboards-page/dashboards';
import { HorizontalNav, PageHeading, LoadingBox } from '@console/internal/components/utils';

const OCSDashboardsPage: React.FC<DashboardsPageProps> = ({ match, kindsInFlight, k8sModels }) => {
  const { t } = useTranslation();
  const title = t('ceph-storage-plugin~OpenShift Container Storage Overview');
  const tabExtensions = useExtensions<DashboardsTab>(isDashboardsTab);
  const cardExtensions = useExtensions<DashboardsCard>(isDashboardsCard);

  const pluginPages = React.useMemo(
    () => getPluginTabPages(tabExtensions, cardExtensions, 'storage', 'persistent-storage'),
    [tabExtensions, cardExtensions],
  );

  return kindsInFlight && k8sModels.size === 0 ? (
    <LoadingBox />
  ) : (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading title={title} detail />
      <HorizontalNav match={match} pages={pluginPages} noStatusBox />
    </>
  );
};

export const DashboardsPage = connect(mapStateToProps)(OCSDashboardsPage);
