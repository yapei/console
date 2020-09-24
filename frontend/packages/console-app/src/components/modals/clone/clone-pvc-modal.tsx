import './_clone-pvc-modal.scss';

import * as React from 'react';

import { Form, FormGroup, TextInput } from '@patternfly/react-core';
import {
  k8sCreate,
  referenceFor,
  PersistentVolumeClaimKind,
  StorageClassResourceKind,
} from '@console/internal/module/k8s';
import {
  LoadingInline,
  ResourceIcon,
  humanizeBinaryBytes,
  history,
  withHandlePromise,
  RequestSizeInput,
  validate,
  resourceObjPath,
  convertToBaseValue,
} from '@console/internal/components/utils';
import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  createModalLauncher,
} from '@console/internal/components/factory';
import { DataPoint } from '@console/internal/components/graphs';
import { HandlePromiseProps } from '@console/internal/components/utils/promise-component';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  StorageClassModel,
} from '@console/internal/models';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { getRequestedPVCSize } from '@console/shared/src/selectors';
import { dropdownUnits, accessModeRadios } from '@console/internal/components/storage/shared';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { isCephProvisioner } from '@console/shared';

const ClonePVCModal = withHandlePromise((props: ClonePVCModalProps) => {
  const { close, cancel, resource, handlePromise, errorMessage, inProgress } = props;
  const { name: pvcName, namespace } = resource?.metadata;
  const defaultSize: string[] = validate.split(getRequestedPVCSize(resource));
  const pvcRequestedSize = `${defaultSize[0]} ${dropdownUnits[defaultSize[1]]}`;

  const [clonePVCName, setClonePVCName] = React.useState(`${pvcName}-clone`);
  const [requestedSize, setRequestedSize] = React.useState(defaultSize[0] || '');
  const accessMode = accessModeRadios.find(
    (mode) => mode.value === resource?.spec?.accessModes?.[0],
  );

  const [requestedUnit, setRequestedUnit] = React.useState(defaultSize[1] || 'Ti');
  const [validSize, setValidSize] = React.useState(true);

  const [scResource, scResourceLoaded, scResourceLoadError] = useK8sGet<StorageClassResourceKind>(
    StorageClassModel,
    resource?.spec?.storageClassName,
  );

  const pvcUsedCapacityQuery: string = `kubelet_volume_stats_used_bytes{persistentvolumeclaim='${pvcName}'}`;
  const [response, error, loading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: pvcUsedCapacityQuery,
    namespace,
  });
  const pvcUsedCapacityQueryResult: DataPoint[] = getInstantVectorStats(
    response,
    null,
    humanizeBinaryBytes,
  );
  const pvcUsedCapacity = pvcUsedCapacityQueryResult?.[0]?.label || '-';
  const requestedSizeInputChange = ({ value, unit }) => {
    setRequestedSize(value);
    setRequestedUnit(unit);
    const cloneSizeInBytes = convertToBaseValue(value + unit);
    const pvcSizeInBytes = convertToBaseValue(getRequestedPVCSize(resource));
    const isValid = cloneSizeInBytes >= pvcSizeInBytes;
    setValidSize(isValid);
  };

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();

    const pvcCloneObj: PersistentVolumeClaimKind = {
      apiVersion: PersistentVolumeClaimModel.apiVersion,
      kind: PersistentVolumeClaimModel.kind,
      metadata: {
        name: clonePVCName,
        namespace: resource.metadata.namespace,
      },
      spec: {
        storageClassName: resource.spec.storageClassName,
        dataSource: {
          name: pvcName,
          kind: PersistentVolumeClaimModel.kind,
          apiGroup: '',
        },
        resources: {
          requests: {
            storage: `${requestedSize}${requestedUnit}`,
          },
        },
        accessModes: resource.spec.accessModes,
        volumeMode: resource.spec.volumeMode,
      },
    };

    return handlePromise(k8sCreate(PersistentVolumeClaimModel, pvcCloneObj), (cloneResource) => {
      close();
      history.push(resourceObjPath(cloneResource, referenceFor(cloneResource)));
    });
  };

  return (
    <Form onSubmit={submit}>
      <div className="modal-content modal-content--no-inner-scroll">
        <ModalTitle>Clone</ModalTitle>
        <ModalBody>
          <FormGroup label="Name" isRequired fieldId="clone-pvc-modal__name">
            <TextInput
              type="text"
              className="co-clone-pvc-modal__name--margin"
              value={clonePVCName}
              onChange={setClonePVCName}
              aria-label="Clone Pvc"
            />
          </FormGroup>
          <FormGroup
            label="Size"
            isRequired
            fieldId="clone-pvc-modal__size"
            className="co-clone-pvc-modal__ocs-size"
            helperTextInvalid="Size should be equal or greater than the requested size of PVC"
            validated={validSize ? 'default' : 'error'}
          >
            {scResourceLoaded ? (
              <RequestSizeInput
                name="requestSize"
                testID="input-request-size"
                onChange={requestedSizeInputChange}
                defaultRequestSizeUnit={requestedUnit}
                defaultRequestSizeValue={requestedSize}
                dropdownUnits={dropdownUnits}
                isInputDisabled={scResourceLoadError || isCephProvisioner(scResource?.provisioner)}
                required
              />
            ) : (
              <div className="skeleton-text" />
            )}
          </FormGroup>
          <div className="co-clone-pvc-modal__details">
            <p className="text-muted">PVC Details</p>
            <div className="co-clone-pvc-modal__details-section">
              <div>
                <div>
                  <p className="co-clone-pvc-modal__pvc-details">Namespace</p>
                  <p>
                    <ResourceIcon kind={NamespaceModel.kind} />
                    {resource.metadata.namespace}
                  </p>
                </div>
                <div>
                  <p className="co-clone-pvc-modal__pvc-details">Storage Class</p>
                  <p>
                    <ResourceIcon kind={StorageClassModel.kind} />
                    {resource.spec?.storageClassName || '-'}
                  </p>
                </div>
              </div>
              <div>
                <div>
                  <p className="co-clone-pvc-modal__pvc-details">Requested Capacity</p>
                  <p>{pvcRequestedSize}</p>
                </div>
                <div>
                  <p className="co-clone-pvc-modal__pvc-details">Used Capacity</p>
                  <div>
                    {!loading && !error && pvcUsedCapacity}
                    {loading && <LoadingInline />}
                    {!loading && error && '-'}
                  </div>
                </div>
              </div>
              <div>
                <div>
                  <p className="co-clone-pvc-modal__pvc-details">Access Mode</p>
                  <p>{accessMode.title || '-'}</p>
                </div>
                <div>
                  <p className="co-clone-pvc-modal__pvc-details">Volume Mode</p>
                  <p>{resource.spec.volumeMode}</p>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalSubmitFooter
          inProgress={inProgress}
          submitDisabled={!validSize}
          errorMessage={errorMessage}
          submitText="Clone"
          cancel={cancel}
        />
      </div>
    </Form>
  );
});

export type ClonePVCModalProps = {
  resource?: PersistentVolumeClaimKind;
} & HandlePromiseProps &
  ModalComponentProps;

export default createModalLauncher(ClonePVCModal);
