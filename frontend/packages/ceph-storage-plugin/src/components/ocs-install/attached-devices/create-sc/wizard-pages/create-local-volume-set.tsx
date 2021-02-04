import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Alert, Button, Grid, GridItem } from '@patternfly/react-core';
import { Modal, useFlag } from '@console/shared';
import { k8sCreate } from '@console/internal/module/k8s';
import { LocalVolumeSetModel } from '@console/local-storage-operator-plugin/src/models';

import { GUARDED_FEATURES } from '../../../../../features';
import {
  LocalVolumeSetInner,
  LocalVolumeSetHeader,
} from '@console/local-storage-operator-plugin/src/components/local-volume-set/local-volume-set-inner';
import { getLocalVolumeSetRequestData } from '@console/local-storage-operator-plugin/src/components/local-volume-set/local-volume-set-request-data';
import { hasOCSTaint } from '../../../../../utils/install';
import {
  MINIMUM_NODES,
  diskModeDropdownItems,
  arbiterText,
  OCS_TOLERATION,
} from '../../../../../constants';
import { RequestErrors } from '../../../install-wizard/review-and-create';
import '../../attached-devices.scss';
import { State, Action } from '../state';
import { DiscoveryDonutChart } from './donut-chart';

const makeLocalVolumeSetCall = (
  state: State,
  dispatch: React.Dispatch<Action>,
  setInProgress: React.Dispatch<React.SetStateAction<boolean>>,
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>,
  ns: string,
) => {
  setInProgress(true);

  const requestData = getLocalVolumeSetRequestData(state, ns, OCS_TOLERATION);
  k8sCreate(LocalVolumeSetModel, requestData)
    .then(() => {
      dispatch({
        type: 'setStorageClassName',
        name: state.storageClassName || state.volumeSetName,
      });
      state.onNextClick();
      setInProgress(false);
    })
    .catch((err) => {
      setErrorMessage(err.message);
      setInProgress(false);
    });
};

export const CreateLocalVolumeSet: React.FC<CreateLocalVolumeSetProps> = ({
  state,
  dispatch,
  ns,
}) => {
  const { t } = useTranslation();

  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const allNodesSelectorTxt = t(
    'ceph-storage-plugin~Selecting all nodes will use the available disks that match the selected filters on all nodes selected on previous step.',
  );

  return (
    <>
      <LocalVolumeSetHeader />
      <Grid className="ceph-ocs-install__form-wrapper">
        <GridItem lg={10} md={12} sm={12}>
          <Form noValidate={false}>
            <LocalVolumeSetInner
              state={state}
              dispatch={dispatch}
              diskModeOptions={diskModeDropdownItems}
              allNodesHelpTxt={allNodesSelectorTxt}
              taintsFilter={hasOCSTaint}
            />
          </Form>
        </GridItem>
        <GridItem
          lg={2}
          lgOffset={10}
          md={4}
          mdOffset={4}
          sm={4}
          smOffset={4}
          className="ceph-ocs-install__donut-chart"
        >
          <DiscoveryDonutChart state={state} dispatch={dispatch} />
        </GridItem>
      </Grid>
      <ConfirmationModal
        ns={ns}
        state={state}
        dispatch={dispatch}
        setInProgress={setInProgress}
        setErrorMessage={setErrorMessage}
      />
      {state.filteredNodes.length < MINIMUM_NODES && (
        <Alert
          className="co-alert ceph-ocs-install__wizard-alert"
          variant="danger"
          title={t('ceph-storage-plugin~Minimum Node Requirement')}
          isInline
        >
          {t(
            'ceph-storage-plugin~The OCS storage cluster require a minimum of 3 nodes for the intial deployment. Only {{nodes}} node match to the selected filters. Please adjust the filters to include more nodes.',
            { nodes: state.filteredNodes.length },
          )}
        </Alert>
      )}
      <RequestErrors errorMessage={errorMessage} inProgress={inProgress} />
    </>
  );
};

type CreateLocalVolumeSetProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  ns: string;
};

const ConfirmationModal = ({ state, dispatch, setInProgress, setErrorMessage, ns }) => {
  const { t } = useTranslation();
  const isArbiterSupported = useFlag(GUARDED_FEATURES.OCS_ARBITER);

  const makeLVSCall = () => {
    dispatch({ type: 'setShowConfirmModal', value: false });
    makeLocalVolumeSetCall(state, dispatch, setInProgress, setErrorMessage, ns);
  };

  const cancel = () => {
    dispatch({ type: 'setShowConfirmModal', value: false });
  };

  const description = (
    <>
      <span>
        {t(
          'ceph-storage-plugin~After the volume set and storage class are created you wont be able to go back to this step.',
        )}
      </span>
      {isArbiterSupported && (
        <p className="pf-u-pt-sm">
          <strong>{t('ceph-storage-plugin~Note:')} </strong>
          {arbiterText(t)}
        </p>
      )}
    </>
  );

  return (
    <Modal
      title={t('ceph-storage-plugin~Create Storage Class')}
      isOpen={state.showConfirmModal}
      onClose={cancel}
      variant="small"
      actions={[
        <Button key="confirm" variant="primary" onClick={makeLVSCall}>
          {t('ceph-storage-plugin~Yes')}
        </Button>,
        <Button key="cancel" variant="link" onClick={cancel}>
          {t('ceph-storage-plugin~Cancel')}
        </Button>,
      ]}
      description={description}
    >
      <p>{t('ceph-storage-plugin~Are you sure you want to continue ?')}</p>
    </Modal>
  );
};
