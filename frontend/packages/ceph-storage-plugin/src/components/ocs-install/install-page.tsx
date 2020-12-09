import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as RouteMatch } from 'react-router';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  ClusterServiceVersionModel,
  ClusterServiceVersionKind,
} from '@console/operator-lifecycle-manager';
import { BreadCrumbs } from '@console/internal/components/utils';
import { getAnnotations } from '@console/shared/src/selectors/common';
import { RadioGroup } from '@console/internal/components/radio';
import { InfrastructureModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useDeepCompareMemoize } from '@console/shared';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { getRequiredKeys, createDownloadFile } from '../independent-mode/utils';
import CreateExternalCluster from '../independent-mode/install';
import { CreateInternalCluster } from './internal-mode/install-wizard';
import { MODES } from '../../constants';
import { CreateAttachedDevicesCluster } from './attached-devices/install';
import './install-page.scss';

const INDEP_MODE_SUPPORTED_PLATFORMS = ['BareMetal', 'None', 'VSphere', 'OpenStack', 'oVirt'];

const InstallCluster: React.FC<InstallClusterProps> = ({ match }) => {
  const {
    params: { ns, appName },
    url,
  } = match;
  const { t } = useTranslation();
  const [isIndepModeSupportedPlatform, setIndepModeSupportedPlatform] = React.useState(false);
  const [independentReqdKeys, setIndependentReqdKeys] = React.useState<{ [key: string]: string[] }>(
    null,
  );
  const [downloadFile, setDownloadFile] = React.useState(null);
  const [mode, setMode] = React.useState(MODES.INTERNAL);
  const [clusterServiceVersion, setClusterServiceVersion] = React.useState(null);

  const handleModeChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setMode(value as MODES);
  };

  const csvResource = {
    kind: referenceForModel(ClusterServiceVersionModel),
    name: appName,
    namespace: ns,
    isList: false,
  };

  const [csv, csvLoaded, csvError] = useK8sWatchResource<ClusterServiceVersionKind>(csvResource);
  const [infra, infraLoaded, infraError] = useK8sGet<any>(InfrastructureModel, 'cluster');

  const memoizedCSV = useDeepCompareMemoize(csv, true);

  React.useEffect(() => {
    if (csvLoaded && !csvError) {
      const { configMaps = [], secrets = [], storageClasses = [] } = getRequiredKeys(memoizedCSV);
      setIndependentReqdKeys({ configMaps, secrets, storageClasses });
      const file = createDownloadFile(
        getAnnotations(memoizedCSV)?.['external.features.ocs.openshift.io/export-script'],
      );
      setDownloadFile(file);
      setClusterServiceVersion(memoizedCSV);
    }
  }, [memoizedCSV, csvLoaded, csvError]);

  React.useEffect(() => {
    if (infraLoaded && !infraError) {
      const infraType = infra?.spec?.platformSpec?.type;
      const supportsExternal = INDEP_MODE_SUPPORTED_PLATFORMS.includes(infraType);
      setIndepModeSupportedPlatform(supportsExternal);
    }
  }, [infra, infraLoaded, infraError]);

  return (
    <>
      <div className="co-create-operand__header">
        <div className="co-create-operand__header-buttons">
          {clusterServiceVersion !== null && (
            <BreadCrumbs
              breadcrumbs={[
                {
                  name: clusterServiceVersion.spec.displayName,
                  path: url.replace('/~new', ''),
                },
                {
                  name: t('ceph-storage-plugin~Create Storage Cluster'),
                  path: url,
                },
              ]}
            />
          )}
        </div>
        <h1 className="co-create-operand__header-text">
          {t('ceph-storage-plugin~Create Storage Cluster')}
        </h1>
        <p className="help-block">
          {t(
            'ceph-storage-plugin~OCS runs as a cloud-native service for optimal integration with applications in need of storage and handles the scenes such as provisioning and management.',
          )}
        </p>
      </div>

      <div className="ceph-install__mode-toggle">
        <RadioGroup
          label="Select Mode:"
          currentValue={mode}
          inline
          items={[
            {
              value: MODES.INTERNAL,
              title: MODES.INTERNAL,
            },
            {
              value: MODES.ATTACHED_DEVICES,
              title: MODES.ATTACHED_DEVICES,
            },
            {
              value: MODES.EXTERNAL,
              title: MODES.EXTERNAL,
              disabled: !isIndepModeSupportedPlatform,
            },
          ]}
          onChange={handleModeChange}
        />
      </div>
      {mode === MODES.INTERNAL && <CreateInternalCluster match={match} mode={mode} />}
      {mode === MODES.EXTERNAL && (
        <CreateExternalCluster
          match={match}
          minRequiredKeys={independentReqdKeys}
          downloadFile={downloadFile}
        />
      )}
      {mode === MODES.ATTACHED_DEVICES && (
        <CreateAttachedDevicesCluster match={match} mode={mode} />
      )}
    </>
  );
};

export default InstallCluster;

type InstallClusterProps = {
  match: RouteMatch<{ ns: string; appName: string }>;
};
