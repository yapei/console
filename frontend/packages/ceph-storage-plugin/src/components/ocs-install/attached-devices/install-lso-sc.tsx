import * as React from 'react';
import { match as RouterMatch } from 'react-router';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import { Alert, ActionGroup, Button, Form } from '@patternfly/react-core';
import {
  NodeKind,
  StorageClassResourceKind,
  referenceForModel,
  k8sCreate,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import {
  withHandlePromise,
  HandlePromiseProps,
  history,
  ButtonBar,
} from '@console/internal/components/utils';
import { setFlag } from '@console/internal/actions/features';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { getName } from '@console/shared';
import {
  MINIMUM_NODES,
  defaultRequestSize,
  NO_PROVISIONER,
  OCS_INTERNAL_CR_NAME,
  OCS_DEVICE_SET_REPLICA,
} from '../../../constants';
import { OCSServiceModel } from '../../../models';
import AttachedDevicesNodeTable from './sc-node-list';
import { PVsAvailableCapacity } from '../pvs-available-capacity';
import {
  OCS_CONVERGED_FLAG,
  OCS_FLAG,
  OCS_ATTACHED_DEVICES_FLAG,
  OCS_INDEPENDENT_FLAG,
} from '../../../features';
import { scResource, pvResource } from '../../../constants/resources';
import { labelNodes, getOCSRequestData } from '../ocs-request-data';
import {
  OCSAlert,
  SelectNodesSection,
  StorageClassSection,
  EncryptSection,
  MinimalDeploymentAlert,
} from '../../../utils/common-ocs-install-el';
import {
  filterSCWithNoProv,
  getAssociatedNodes,
  shouldDeployAsMinimal,
  getNodeInfo,
} from '../../../utils/install';
import { getSCAvailablePVs } from '../../../selectors';
import '../ocs-install.scss';
import './attached-devices.scss';

const makeOCSRequest = (
  selectedNodes: NodeKind[],
  storageClass: StorageClassResourceKind,
  isEncrypted: boolean,
  isMinimal: boolean,
): Promise<any> => {
  const promises = labelNodes(selectedNodes);
  const scName = getName(storageClass);
  const ocsObj = getOCSRequestData(
    scName,
    defaultRequestSize.BAREMETAL,
    isEncrypted,
    isMinimal,
    NO_PROVISIONER,
  );

  return Promise.all(promises).then(() => k8sCreate(OCSServiceModel, ocsObj));
};

export const CreateOCS = withHandlePromise<CreateOCSProps & HandlePromiseProps>((props) => {
  const {
    handlePromise,
    errorMessage,
    inProgress,
    match,
    setIsNewSCToBeCreated,
    setHasNoProvSC,
  } = props;
  const { appName, ns } = match.params;
  const [filteredNodes, setFilteredNodes] = React.useState<string[]>([]);
  const [isEncrypted, setEncrypted] = React.useState(false);
  const [storageClass, setStorageClass] = React.useState<StorageClassResourceKind>(null);
  const [nodes, setNodes] = React.useState<NodeKind[]>([]);
  const dispatch = useDispatch();
  const [scData, scLoaded, scLoadError] = useK8sWatchResource<StorageClassResourceKind[]>(
    scResource,
  );
  const [pvData, pvLoaded, pvLoadError] = useK8sWatchResource<K8sResourceKind[]>(pvResource);

  const { cpu, memory } = getNodeInfo(nodes);
  const isMinimal = shouldDeployAsMinimal(cpu, memory, nodes.length);

  React.useEffect(() => {
    // this is needed to ensure that the useEffect should be called only when setHasNoProvSC is defined
    // setHasNoProvSC is defined, if called from create storage cluster view, if SC is present
    // setHasNoProvSC is undefined, if called from create storage cluster view from wizard's 3 step
    if (setHasNoProvSC) {
      if ((scLoadError || scData.length === 0) && scLoaded) {
        setHasNoProvSC(false);
      } else if (scLoaded) {
        const filteredSCData = scData.filter(
          (sc: StorageClassResourceKind) => sc?.provisioner === NO_PROVISIONER,
        );
        if (filteredSCData.length) {
          setHasNoProvSC(true);
        } else {
          setHasNoProvSC(false);
        }
      }
    }
  }, [scData, scLoaded, scLoadError, setHasNoProvSC]);

  const handleStorageClass = (sc: StorageClassResourceKind) => {
    setStorageClass(sc);

    if (sc) {
      const pvs = getSCAvailablePVs(pvData, getName(sc));
      const scNodes = getAssociatedNodes(pvs);
      setFilteredNodes(scNodes);
    } else {
      setFilteredNodes([]);
    }
  };

  React.useEffect(() => {
    if ((pvLoadError || pvData.length === 0) && pvLoaded) {
      setFilteredNodes([]);
    } else if (pvLoaded) {
      const pvs = getSCAvailablePVs(pvData, getName(storageClass));
      const scNodes = getAssociatedNodes(pvs);
      setFilteredNodes(scNodes);
    }
  }, [pvData, pvLoaded, pvLoadError, storageClass]);

  const submit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // eslint-disable-next-line promise/catch-or-return
    handlePromise(makeOCSRequest(nodes, storageClass, isEncrypted, isMinimal), () => {
      dispatch(setFlag(OCS_ATTACHED_DEVICES_FLAG, true));
      dispatch(setFlag(OCS_CONVERGED_FLAG, true));
      dispatch(setFlag(OCS_INDEPENDENT_FLAG, false));
      dispatch(setFlag(OCS_FLAG, true));
      history.push(
        `/k8s/ns/${ns}/clusterserviceversions/${appName}/${referenceForModel(
          OCSServiceModel,
        )}/${OCS_INTERNAL_CR_NAME}`,
      );
    });
  };

  const onlyNoProvSC = React.useCallback(filterSCWithNoProv, []);

  const goToCreateSCUI = () => {
    setIsNewSCToBeCreated(true);
  };

  return (
    <>
      <OCSAlert />
      <Form className="co-m-pane__body-group">
        <StorageClassSection handleStorageClass={handleStorageClass} filterSC={onlyNoProvSC}>
          <PVsAvailableCapacity
            replica={OCS_DEVICE_SET_REPLICA}
            data-test-id="ceph-ocs-install-pvs-available-capacity"
            storageClass={storageClass}
          />
        </StorageClassSection>

        <EncryptSection onToggle={setEncrypted} isChecked={isEncrypted} />

        {storageClass && (
          <>
            <h3 className="co-m-pane__heading co-m-pane__heading--baseline ceph-ocs-install__pane--margin">
              <div className="co-m-pane__name">Nodes</div>
            </h3>
            <SelectNodesSection
              table={AttachedDevicesNodeTable}
              customData={{ filteredNodes, nodes, setNodes }}
            >
              <span>Selected nodes are based on the selected storage class.</span>
            </SelectNodesSection>
          </>
        )}
        {storageClass && filteredNodes?.length < MINIMUM_NODES && (
          <Alert className="co-alert" variant="danger" title="Minimum Node Requirement" isInline>
            The OCS Storage cluster require a minimum of 3 nodes for the initial deployment. Please
            choose a different storage class or go to create a new volume set that matches the
            minimum node requirement.
            <div>
              <Button
                component="a"
                variant="link"
                onClick={goToCreateSCUI}
                className="ceph-ocs-install__create-new-sc-btn"
              >
                Create new volume set instance
              </Button>
            </div>
          </Alert>
        )}
        <>{isMinimal && <MinimalDeploymentAlert />}</>
        <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
          <ActionGroup className="pf-c-form">
            <Button
              type="button"
              variant="primary"
              onClick={submit}
              isDisabled={(filteredNodes?.length ?? 0) < MINIMUM_NODES}
            >
              Create
            </Button>
            <Button type="button" variant="secondary" onClick={history.goBack}>
              Cancel
            </Button>
          </ActionGroup>
        </ButtonBar>
      </Form>
    </>
  );
});

type CreateOCSProps = {
  match: RouterMatch<{ appName: string; ns: string }>;
  setIsNewSCToBeCreated?: React.Dispatch<boolean>;
  setHasNoProvSC?: React.Dispatch<boolean>;
};
