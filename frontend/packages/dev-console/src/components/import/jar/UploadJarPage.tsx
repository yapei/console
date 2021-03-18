import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import {
  useK8sWatchResources,
  WatchK8sResults,
  WatchK8sResultsObject,
} from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ImageStreamModel, ProjectModel } from '@console/internal/models';
import { LoadingBox, PageHeading } from '@console/internal/components/utils';
import UploadJar from './UploadJar';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import QueryFocusApplication from '../../QueryFocusApplication';
import { normalizeBuilderImages, NormalizedBuilderImages } from '../../../utils/imagestream-utils';

export type UploadJarPageProps = RouteComponentProps<{ ns?: string }>;

type watchResource = {
  [key: string]: K8sResourceKind[] | K8sResourceKind;
};

const UploadJarPage: React.FunctionComponent<UploadJarPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const imageStreamName = 'java';
  const resources: WatchK8sResults<watchResource> = useK8sWatchResources<watchResource>({
    projects: {
      kind: ProjectModel.kind,
      isList: true,
    },
    imagestream: {
      kind: ImageStreamModel.kind,
      name: imageStreamName,
      namespace: 'openshift',
    },
  });

  const isResourceLoaded = () => {
    const resKeys = Object.keys(resources);
    if (
      resKeys.length > 0 &&
      resKeys.every((key) => resources[key].loaded || !!resources[key].loadError)
    ) {
      return true;
    }
    return false;
  };

  if (!isResourceLoaded()) return <LoadingBox />;

  const { [imageStreamName]: builderImage }: NormalizedBuilderImages = normalizeBuilderImages(
    resources.imagestream.data,
  );

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{t('devconsole~Upload JAR file')}</title>
      </Helmet>
      <PageHeading title={t('devconsole~Upload JAR file')}>
        {t('devconsole~Upload a JAR file from your local desktop to OpenShift')}
      </PageHeading>
      <QueryFocusApplication>
        {(desiredApplication) => (
          <UploadJar
            forApplication={desiredApplication}
            namespace={namespace}
            projects={resources.projects as WatchK8sResultsObject<K8sResourceKind[]>}
            builderImage={builderImage}
          />
        )}
      </QueryFocusApplication>
    </NamespacedPage>
  );
};

export default UploadJarPage;
