import * as React from 'react';
import { Form, Alert, Button, pluralize } from '@patternfly/react-core';
import { Modal } from '@console/shared';
import { k8sCreate } from '@console/internal/module/k8s';
import { LocalVolumeSetModel } from '@console/local-storage-operator-plugin/src/models';
import {
  LocalVolumeSetInner,
  LocalVolumeSetHeader,
} from '@console/local-storage-operator-plugin/src/components/local-volume-set/local-volume-set-inner';
import { getLocalVolumeSetRequestData } from '@console/local-storage-operator-plugin/src/components/local-volume-set/local-volume-set-request-data';
import { State, Action } from '../state';
import { DiscoveryDonutChart } from './donut-chart';
import {
  MINIMUM_NODES,
  diskTypeDropdownItems,
  diskModeDropdownItems,
  allNodesSelectorTxt,
} from '../../../../../constants';
import '../../attached-devices.scss';

const makeLocalVolumeSetCall = (state: State, dispatch: React.Dispatch<Action>) => {
  dispatch({ type: 'setIsLoading', value: true });
  const requestData = getLocalVolumeSetRequestData(state);
  k8sCreate(LocalVolumeSetModel, requestData)
    .then(() => {
      state.onNextClick();
      dispatch({ type: 'setIsLoading', value: false });
      dispatch({ type: 'setFinalStep', value: true });
    })
    .catch((err) => {
      dispatch({ type: 'setError', value: err.message });
      dispatch({ type: 'setIsLoading', value: false });
    });
};

export const CreateLocalVolumeSet: React.FC<CreateLocalVolumeSetProps> = ({ state, dispatch }) => {
  return (
    <>
      <LocalVolumeSetHeader />
      <div className="ceph-ocs-install__form-wrapper">
        <Form noValidate={false} className="ceph-ocs-install__create-sc-form">
          <LocalVolumeSetInner
            state={state}
            dispatch={dispatch}
            diskTypeOptions={diskTypeDropdownItems}
            diskModeOptions={diskModeDropdownItems}
            allNodesHelpTxt={allNodesSelectorTxt}
          />
        </Form>
        <DiscoveryDonutChart state={state} dispatch={dispatch} />
      </div>
      <ConfirmationModal state={state} dispatch={dispatch} />
      {state.filteredNodes.length < MINIMUM_NODES && (
        <Alert
          className="co-alert ceph-ocs-install__wizard-alert"
          variant="danger"
          title="Minimum Node Requirement"
          isInline
        >
          The OCS storage cluster require a minimum of 3 nodes for the intial deployment. Only{' '}
          {pluralize(state.filteredNodes.length, 'node')} match to the selected filters. Please
          adjust the filters to include more nodes.
        </Alert>
      )}
    </>
  );
};

type CreateLocalVolumeSetProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
};

const ConfirmationModal = ({ state, dispatch }) => {
  const makeLVSCall = () => {
    dispatch({ type: 'setShowConfirmModal', value: false });
    makeLocalVolumeSetCall(state, dispatch);
  };

  const cancel = () => {
    dispatch({ type: 'setCreateLVS', value: false });
    dispatch({ type: 'setShowConfirmModal', value: false });
  };

  return (
    <Modal
      title="Create Storage Class"
      isOpen={state.showConfirmModal}
      onClose={cancel}
      variant="small"
      actions={[
        <Button key="confirm" variant="primary" onClick={makeLVSCall}>
          Yes
        </Button>,
        <Button key="cancel" variant="link" onClick={cancel}>
          Cancel
        </Button>,
      ]}
    >
      {
        "After the volume set and storage class are created you won't be able to go back to this step. Are you sure you want to continue?"
      }
    </Modal>
  );
};
