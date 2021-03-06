import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import { match as RouteMatch } from 'react-router';
import {
  Alert,
  Wizard,
  AlertActionCloseButton,
  Stack,
  StackItem,
  WizardStep,
} from '@patternfly/react-core';
import { history } from '@console/internal/components/utils';
import { setFlag } from '@console/internal/actions/features';
import { k8sCreate, referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared';
import { OCSServiceModel } from '../../../models';
import { OCS_CONVERGED_FLAG, OCS_INDEPENDENT_FLAG, OCS_FLAG } from '../../../features';
import { OCS_INTERNAL_CR_NAME, MINIMUM_NODES, CreateStepsSC } from '../../../constants';
import { StorageClusterKind } from '../../../types';
import { labelNodes, getOCSRequestData } from '../ocs-request-data';
import { SelectCapacityAndNodes, Configure, ReviewAndCreate } from './install-wizard-steps';
import { initialState, reducer, InternalClusterState } from './reducer';
import '../install-wizard/install-wizard.scss';
import { createKmsResources } from '../../kms-config/utils';
import { NetworkType } from '../types';

const makeOCSRequest = (state: InternalClusterState): Promise<StorageClusterKind> => {
  const {
    storageClass,
    capacity,
    nodes,
    enableMinimal,
    publicNetwork,
    clusterNetwork,
    encryption,
    kms,
  } = state;
  const storageCluster: StorageClusterKind = getOCSRequestData(
    storageClass,
    capacity,
    encryption.clusterWide,
    enableMinimal,
    publicNetwork,
    clusterNetwork,
    kms.hasHandled && encryption.advanced,
  );
  const promises: Promise<K8sResourceKind>[] = [...labelNodes(nodes)];
  if (encryption.advanced && kms.hasHandled) {
    promises.push(...createKmsResources(kms));
  }
  return Promise.all(promises).then(() => k8sCreate(OCSServiceModel, storageCluster));
};

export const CreateInternalCluster: React.FC<CreateInternalClusterProps> = ({ match, mode }) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [showInfoAlert, setShowInfoAlert] = React.useState(true);
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const flagDispatcher = useDispatch();

  const title = 'create internal mode storage cluster wizard';
  const scName = getName(state.storageClass);
  // User can't have empty public NAD when using multus
  const hasConfiguredNetwork =
    state.networkType === NetworkType.MULTUS ? !!state.publicNetwork : true;
  const hasEnabledCreateStep =
    !!(state.nodes.length >= MINIMUM_NODES && scName && state.kms.hasHandled) &&
    hasConfiguredNetwork;

  const steps: WizardStep[] = [
    {
      name: 'Select capacity and nodes',
      id: CreateStepsSC.STORAGEANDNODES,
      component: <SelectCapacityAndNodes state={state} dispatch={dispatch} />,
      enableNext: !!(state.nodes.length >= MINIMUM_NODES && scName),
    },
    {
      name: 'Configure',
      id: CreateStepsSC.CONFIGURE,
      component: <Configure state={state} dispatch={dispatch} mode={mode} />,
      enableNext: state.encryption.hasHandled && hasConfiguredNetwork && state.kms.hasHandled,
    },
    {
      name: 'Review and create',
      id: CreateStepsSC.REVIEWANDCREATE,
      component: (
        <ReviewAndCreate state={state} errorMessage={errorMessage} inProgress={inProgress} />
      ),
      enableNext: hasEnabledCreateStep,
      nextButtonText: 'Create',
    },
  ];

  const createCluster = async () => {
    const { appName, ns } = match.params;
    try {
      setInProgress(true);
      await makeOCSRequest(state);
      flagDispatcher(setFlag(OCS_CONVERGED_FLAG, true));
      flagDispatcher(setFlag(OCS_INDEPENDENT_FLAG, false));
      flagDispatcher(setFlag(OCS_FLAG, true));
      history.push(
        `/k8s/ns/${ns}/clusterserviceversions/${appName}/${referenceForModel(
          OCSServiceModel,
        )}/${OCS_INTERNAL_CR_NAME}`,
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setInProgress(false);
    }
  };

  return (
    <Stack>
      <StackItem>
        {showInfoAlert && (
          <Alert
            variant="info"
            className="co-alert ocs-install-info-alert"
            title="Internal"
            actionClose={<AlertActionCloseButton onClose={() => setShowInfoAlert(false)} />}
            isInline
          >
            <p>
              This mode supports cloud deployments. As part of the storage cluster creation, a
              bucket will be created on the default backing store
            </p>
          </Alert>
        )}
      </StackItem>
      <StackItem isFilled>
        <Wizard
          className="ocs-install-wizard"
          navAriaLabel={`${title} steps`}
          mainAriaLabel={`${title} content`}
          steps={steps}
          onSave={createCluster}
          onClose={() => history.goBack()}
        />
      </StackItem>
    </Stack>
  );
};

type CreateInternalClusterProps = {
  match: RouteMatch<{ appName: string; ns: string }>;
  mode: string;
};
