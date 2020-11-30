import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { k8sCreate, TemplateKind } from '@console/internal/module/k8s';
import {
  ModalComponentProps,
  ModalTitle,
  ModalBody,
  createModalLauncher,
  ModalFooter,
} from '@console/internal/components/factory';
import { Alert, Button, ActionGroup, Stack, StackItem } from '@patternfly/react-core';
import { useAccessReview2, LoadingBox } from '@console/internal/components/utils';
import { UploadPVCFormStatus } from '../../cdi-upload-provider/upload-pvc-form/upload-pvc-form-status';
import { createUploadPVC } from '../../../k8s/requests/cdi-upload/cdi-upload-requests';
import {
  TEMPLATE_BASE_IMAGE_NAME_PARAMETER,
  TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER,
  DataVolumeSourceType,
} from '../../../constants';
import { getParameterValue } from '../../../selectors/selectors';
import { DataVolumeModel } from '../../../models';
import { CDIUploadContextProps } from '../../cdi-upload-provider/cdi-upload-provider';
import { bootFormReducer, initBootFormState } from '../../create-vm/forms/boot-source-form-reducer';
import { BootSourceForm } from '../../create-vm/forms/boot-source-form';
import { getRootDataVolume } from '../../../k8s/requests/vm/create/simple-create';
import { useErrorTranslation } from '../../../hooks/use-error-translation';

const getAction = (t: TFunction, dataSource: string): string => {
  switch (DataVolumeSourceType.fromString(dataSource)) {
    case DataVolumeSourceType.HTTP:
    case DataVolumeSourceType.REGISTRY:
    case DataVolumeSourceType.S3:
      return t('kubevirt-plugin~Save and import');
    case DataVolumeSourceType.PVC:
      return t('kubevirt-plugin~Save and clone');
    default:
      return t('kubevirt-plugin~Save and upload');
  }
};

type PermissionsErrorProps = {
  close: VoidFunction;
};

const PermissionsError: React.FC<PermissionsErrorProps> = ({ close }) => {
  const { t } = useTranslation();
  return (
    <>
      <ModalBody>
        <Alert variant="danger" isInline title={t('kubevirt-plugin~Permissions required')}>
          {t(
            'kubevirt-plugin~You do not have permissions to upload template source data into this namespace. Contact your system administrator for more information.',
          )}
        </Alert>
      </ModalBody>
      <ModalFooter inProgress={false}>
        <Button type="button" data-test-id="modal-close-action" onClick={close}>
          {t('kubevirt-plugin~Close')}
        </Button>
      </ModalFooter>
    </>
  );
};

type AddTemplateSourceModalProps = CDIUploadContextProps & {
  template: TemplateKind;
};

export const AddTemplateSourceModal: React.FC<ModalComponentProps &
  AddTemplateSourceModalProps> = ({ cancel, uploadData, close, template, uploads }) => {
  const { t } = useTranslation();
  const baseImageName = getParameterValue(template, TEMPLATE_BASE_IMAGE_NAME_PARAMETER);
  const baseImageNamespace = getParameterValue(template, TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER);
  const upload = uploads.find(
    (upl) => upl.pvcName === baseImageName && upl.namespace === baseImageNamespace,
  );
  const [isAllocating, setAllocating] = React.useState(false);
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [error, setError, setErrorKey, resetError] = useErrorTranslation();
  const [state, dispatch] = React.useReducer(bootFormReducer, initBootFormState);

  const [uploadAllowed, uploadAllowedLoading] = useAccessReview2({
    group: DataVolumeModel.apiGroup,
    resource: DataVolumeModel.plural,
    verb: 'create',
  });

  const { dataSource, file, isValid } = state;

  const onSubmit = async () => {
    resetError();
    setAllocating(true);
    setSubmitting(true);
    const dvObj = getRootDataVolume({
      name: baseImageName,
      pvcSize: state.pvcSize?.value,
      sizeValue: state.size?.value.value,
      sizeUnit: state.size?.value.unit,
      accessMode: state.accessMode?.value,
      cdRom: state.cdRom?.value,
      container: state.container?.value,
      pvcName: state.pvcName?.value,
      pvcNamespace: state.pvcNamespace?.value,
      url: state.url?.value,
      dataSource: state.dataSource?.value,
      storageClass: state.storageClass?.value,
    })
      .setNamespace(baseImageNamespace)
      .asResource();
    try {
      if (dataSource?.value === DataVolumeSourceType.PVC.getValue()) {
        const { token } = await createUploadPVC(dvObj);
        setAllocating(false);
        uploadData({
          file: file.value?.value,
          token,
          pvcName: dvObj.metadata.name,
          namespace: dvObj.metadata.namespace,
        });
      } else {
        await k8sCreate(DataVolumeModel, dvObj);
      }
      close();
    } catch (err) {
      // t('kubevirt-plugin~Could not create Persistent volume claim')
      err?.message
        ? setError(err.message)
        : setErrorKey('kubevirt-plugin~Could not create Persistent volume claim');
    } finally {
      setAllocating(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>{t('kubevirt-plugin~Add source to vendor template')}</ModalTitle>
      {uploadAllowedLoading ? (
        <LoadingBox />
      ) : uploadAllowed ? (
        <>
          <ModalBody>
            {!isSubmitting && (
              <Stack hasGutter>
                <StackItem>
                  <Trans t={t} ns="kubevirt-plugin">
                    This data can be found in{' '}
                    <b>Storage &gt; Persistent volume claims &gt; {baseImageName}</b> under the{' '}
                    <b>{baseImageNamespace}</b> project.
                  </Trans>
                </StackItem>
                <StackItem>
                  <BootSourceForm state={state} dispatch={dispatch} withUpload />
                </StackItem>
              </Stack>
            )}
            <UploadPVCFormStatus
              upload={upload}
              isSubmitting={isSubmitting}
              isAllocating={isAllocating}
              allocateError={undefined}
              onErrorClick={() => {
                setSubmitting(false);
                resetError();
              }}
            />
          </ModalBody>
          <ModalFooter errorMessage={error} inProgress={false}>
            <ActionGroup className="pf-c-form pf-c-form__actions--right pf-c-form__group--no-top-margin">
              <Button
                type="button"
                variant="secondary"
                data-test-id="modal-cancel-action"
                onClick={cancel}
              >
                {t('kubevirt-plugin~Close')}
              </Button>
              <Button
                variant="primary"
                isDisabled={!isValid || isSubmitting}
                data-test="confirm-action"
                id="confirm-action"
                onClick={onSubmit}
              >
                {getAction(t, dataSource?.value)}
              </Button>
            </ActionGroup>
          </ModalFooter>
        </>
      ) : (
        <PermissionsError close={close} />
      )}
    </div>
  );
};

export const addTemplateSourceModal = createModalLauncher(AddTemplateSourceModal);
