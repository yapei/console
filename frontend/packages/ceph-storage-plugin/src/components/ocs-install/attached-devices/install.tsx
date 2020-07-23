import * as React from 'react';
import { match as RouterMatch } from 'react-router';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { Alert, Button } from '@patternfly/react-core';
import { StorageClassResourceKind, K8sResourceKind, k8sList } from '@console/internal/module/k8s';
import { history, LoadingBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { StorageClassModel } from '@console/internal/models';
import { fetchK8s } from '@console/internal/graphql/client';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { LSO_NAMESPACE } from '@console/local-storage-operator-plugin/src/constants';
import { CreateOCS } from './install-lso-sc';
import { LSOSubscriptionResource } from '../../../constants/resources';
import { filterSCWithNoProv } from '../../../utils/install';
import CreateSC from './create-sc/create-sc';
import './attached-devices.scss';

export const CreateAttachedDevicesCluster: React.FC<CreateAttachedDevicesClusterProps> = ({
  match,
}) => {
  const { appName, ns } = match.params;
  const [hasNoProvSC, setHasNoProvSC] = React.useState(false);
  // LSO stands for local-storage-operator
  const [LSOEnabled, setLSOEnabled] = React.useState(false);
  const [isNewSCToBeCreated, setIsNewSCToBeCreated] = React.useState<boolean>(false);
  const [LSODataLoaded, setLSODataLoaded] = React.useState(false);
  const [LSOData, LSOLoaded, LSOLoadError] = useK8sWatchResource<K8sResourceKind>(
    LSOSubscriptionResource,
  );

  React.useEffect(() => {
    if ((LSOLoadError || !LSOData) && LSOLoaded) {
      setLSOEnabled(false);
    } else if (LSOLoaded) {
      // checking for availability of LSO CSV
      fetchK8s(ClusterServiceVersionModel, LSOData?.status?.currentCSV, LSO_NAMESPACE)
        .then(() => {
          setLSOEnabled(true);
          setLSODataLoaded(true);
        })
        .catch(() => {
          setLSOEnabled(false);
          setLSODataLoaded(true);
        });
    }
  }, [LSOData, LSOLoaded, LSOLoadError]);

  React.useEffect(() => {
    /* this call can't be watched here as watching will take the user back to this view 
    once a sc gets created from ocs install in case of no sc present */
    k8sList(StorageClassModel)
      .then((storageClasses: StorageClassResourceKind[]) => {
        const filteredSCData = storageClasses.filter(filterSCWithNoProv);
        if (filteredSCData.length) {
          setHasNoProvSC(true);
        }
      })
      .catch(() => setHasNoProvSC(false));
  }, [appName, ns]);

  const goToLSOInstallationPage = () => {
    history.push(
      '/operatorhub/all-namespaces?details-item=local-storage-operator-redhat-operators-openshift-marketplace',
    );
  };

  return (
    <div className="co-m-pane__body">
      {!LSODataLoaded && <LoadingBox />}
      {LSODataLoaded && !LSOEnabled && (
        <Alert
          className="co-alert"
          variant="info"
          title="Local Storage Operator Not Installed"
          isInline
        >
          <div>
            Before we can create a storage cluster, the local storage operator needs to be
            installed. When installation is finished come back to OpenShift Container Storage to
            create a storage cluster.
            <div className="ceph-ocs-install__lso-alert__button">
              <Button type="button" variant="primary" onClick={goToLSOInstallationPage}>
                Install
              </Button>
            </div>
          </div>
        </Alert>
      )}
      {hasNoProvSC && LSOEnabled && !isNewSCToBeCreated && (
        <CreateOCS
          match={match}
          setIsNewSCToBeCreated={setIsNewSCToBeCreated}
          setHasNoProvSC={setHasNoProvSC}
        />
      )}
      {((!hasNoProvSC && LSOEnabled) || isNewSCToBeCreated) && <CreateSC match={match} />}
    </div>
  );
};

type CreateAttachedDevicesClusterProps = {
  match: RouterMatch<{ appName: string; ns: string }>;
};
