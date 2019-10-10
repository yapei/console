import * as React from 'react';
import { Form, FormSelect, FormSelectOption, TextInput } from '@patternfly/react-core';
import {
  FirehoseResult,
  HandlePromiseProps,
  validate,
  withHandlePromise,
} from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  StorageClassModel,
} from '@console/internal/models';
import { getName } from '@console/shared/src';
import { getLoadedData, prefixedID } from '../../../utils';
import { validateDisk } from '../../../utils/validations/vm';
import { isValidationError } from '../../../utils/validations/common';
import { FormRow } from '../../form/form-row';
import {
  asFormSelectValue,
  FormSelectPlaceholderOption,
} from '../../form/form-select-placeholder-option';
import { getDialogUIError, getSequenceName } from '../../../utils/strings';
import { ModalFooter } from '../modal/modal-footer';
import { useShowErrorToggler } from '../../../hooks/use-show-error-toggler';
import { DiskWrapper } from '../../../k8s/wrapper/vm/disk-wrapper';
import { DataVolumeWrapper } from '../../../k8s/wrapper/vm/data-volume-wrapper';
import { VolumeWrapper } from '../../../k8s/wrapper/vm/volume-wrapper';
import { DiskBus, DiskType } from '../../../constants/vm/storage';
import { getPvcStorageSize } from '../../../selectors/pvc/selectors';
import { K8sResourceSelectRow } from '../../form/k8s-resource-select-row';
import { SizeUnitFormRow, BinaryUnit } from '../../form/size-unit-form-row';
import { CombinedDisk } from '../../../k8s/wrapper/vm/combined-disk';
import { StorageUISource } from './storage-ui-source';

export const DiskModal = withHandlePromise((props: DiskModalProps) => {
  const {
    storageClasses,
    usedPVCNames,
    persistentVolumeClaims,
    vmName,
    vmNamespace,
    namespace,
    namespaces,
    onNamespaceChanged,
    usedDiskNames,
    disableSourceChange,
    onSubmit,
    inProgress,
    errorMessage,
    handlePromise,
    close,
    cancel,
  } = props;
  const asId = prefixedID.bind(null, 'disk');
  const disk = props.disk || DiskWrapper.EMPTY;
  const volume = props.volume || VolumeWrapper.EMPTY;
  const dataVolume = props.dataVolume || DataVolumeWrapper.EMPTY;
  const isEditing = disk !== DiskWrapper.EMPTY;

  const [source, setSource] = React.useState<StorageUISource>(
    isEditing
      ? StorageUISource.fromTypes(volume.getType(), dataVolume.getType()) || StorageUISource.OTHER
      : StorageUISource.BLANK,
  );

  const [url, setURL] = React.useState<string>(dataVolume.getURL);

  const [containerImage, setContainerImage] = React.useState<string>(
    volume.getContainerImage() || '',
  );

  const [pvcName, setPVCName] = React.useState<string>(
    new CombinedDisk({
      diskWrapper: disk,
      volumeWrapper: volume,
      dataVolumeWrapper: dataVolume,
    }).getPVCName(source),
  );

  const [name, setName] = React.useState<string>(
    disk.getName() || getSequenceName('disk', usedDiskNames),
  );
  const [bus, setBus] = React.useState<DiskBus>(
    disk.getDiskBus() || (isEditing ? null : DiskBus.VIRTIO),
  );
  const [storageClassName, setStorageClassName] = React.useState<string>(
    dataVolume.getStorageClassName(),
  );

  const [size, setSize] = React.useState<string>(`${dataVolume.getSize().value}`);
  const [unit, setUnit] = React.useState<string>(dataVolume.getSize().unit || BinaryUnit.Gi);

  const resultDisk = DiskWrapper.initializeFromSimpleData({
    name,
    bus,
    type: DiskType.DISK,
  });

  const resultDataVolumeName = prefixedID(vmName, name);
  let resultVolume;
  if (source.requiresVolume()) {
    // update just Disk for unknown sources
    resultVolume = VolumeWrapper.initializeFromSimpleData(
      {
        name,
        type: source.getVolumeType(),
        typeData: {
          name: resultDataVolumeName,
          claimName: pvcName,
          image: containerImage,
        },
      },
      { sanitizeTypeData: true },
    );
  }

  let resultDataVolume;
  if (source.requiresDatavolume()) {
    resultDataVolume = DataVolumeWrapper.initializeFromSimpleData(
      {
        name: resultDataVolumeName,
        storageClassName: storageClassName || undefined,
        type: source.getDataVolumeSourceType(),
        size,
        unit,
        typeData: { name: pvcName, namespace, url },
      },
      { sanitizeTypeData: true },
    );
  }

  const {
    validations: {
      name: nameValidation,
      size: sizeValidation,
      container: containerValidation,
      pvc: pvcValidation,
      url: urlValidation,
    },
    isValid,
    hasAllRequiredFilled,
  } = validateDisk(resultDisk, resultVolume, resultDataVolume, { usedDiskNames, usedPVCNames });

  const [showUIError, setShowUIError] = useShowErrorToggler(false, isValid, isValid);

  const submit = (e) => {
    e.preventDefault();

    if (isValid) {
      // eslint-disable-next-line promise/catch-or-return
      handlePromise(onSubmit(resultDisk, resultVolume, resultDataVolume)).then(close);
    } else {
      setShowUIError(true);
    }
  };

  const onSourceChanged = (uiSource) => {
    if (disableSourceChange) {
      return;
    }
    setSize('');
    setUnit('Gi');
    setURL('');
    setPVCName('');
    setContainerImage('');
    setStorageClassName('');
    onNamespaceChanged(vmNamespace);
    setSource(StorageUISource.fromString(uiSource));
  };

  const onPVCChanged = (newPVCName) => {
    setPVCName(newPVCName);
    if (source === StorageUISource.ATTACH_CLONED_DISK) {
      const newSizeBundle = getPvcStorageSize(
        getLoadedData(persistentVolumeClaims).find((p) => getName(p) === newPVCName),
      );
      const [newSize, newUnit] = validate.split(newSizeBundle);
      setSize(newSize);
      setUnit(newUnit);
    }
  };

  return (
    <div className="modal-content">
      <ModalTitle>{isEditing ? 'Edit' : 'Add'} Disk</ModalTitle>
      <ModalBody>
        <Form>
          <FormRow title="Source" fieldId={asId('source')} isRequired>
            <FormSelect
              onChange={onSourceChanged}
              value={asFormSelectValue(source)}
              id={asId('source')}
              isDisabled={inProgress || disableSourceChange || source === StorageUISource.OTHER}
            >
              {StorageUISource.getAll()
                .filter(
                  (storageUISource) =>
                    storageUISource !== StorageUISource.OTHER || source === StorageUISource.OTHER,
                )
                .map((uiType) => {
                  return (
                    <FormSelectOption
                      key={uiType.getValue()}
                      value={uiType.getValue()}
                      label={uiType.toString()}
                    />
                  );
                })}
            </FormSelect>
          </FormRow>
          {source.requiresURL() && (
            <FormRow title="URL" fieldId={asId('url')} isRequired validation={urlValidation}>
              <TextInput
                isValid={!isValidationError(urlValidation)}
                key="url"
                isDisabled={inProgress}
                isRequired
                id={asId('url')}
                value={url}
                onChange={(v) => setURL(v)}
              />
            </FormRow>
          )}
          {source.requiresContainerImage() && (
            <FormRow
              title="Container"
              fieldId={asId('container')}
              isRequired
              validation={containerValidation}
            >
              <TextInput
                isValid={!isValidationError(containerValidation)}
                key="container"
                isDisabled={inProgress}
                isRequired
                id={asId('container')}
                value={containerImage}
                onChange={(v) => setContainerImage(v)}
              />
            </FormRow>
          )}
          {source.requiresNamespace() && (
            <K8sResourceSelectRow
              key="namespace"
              id={asId('namespace')}
              isDisabled={inProgress}
              name={namespace}
              data={namespaces}
              model={NamespaceModel}
              title={`PVC ${NamespaceModel.label}`}
              onChange={(sc) => {
                setPVCName('');
                onNamespaceChanged(sc);
              }}
            />
          )}
          {source.requiresPVC() && (
            <K8sResourceSelectRow
              key="pvc-select"
              id={asId('pvc')}
              isDisabled={inProgress || !namespace}
              name={pvcName}
              validation={pvcValidation}
              data={persistentVolumeClaims}
              model={PersistentVolumeClaimModel}
              hasPlaceholder
              isPlaceholderDisabled
              onChange={onPVCChanged}
              filter={(p) => !(usedPVCNames && usedPVCNames.has(getName(p)))}
            />
          )}
          <FormRow
            title="Name"
            fieldId={asId('name')}
            isRequired
            isLoading={!usedDiskNames}
            validation={nameValidation}
          >
            <TextInput
              isValid={!isValidationError(nameValidation)}
              isDisabled={!usedDiskNames || inProgress}
              isRequired
              id={asId('name')}
              value={name}
              onChange={React.useCallback((v) => setName(v), [setName])}
            />
          </FormRow>
          {source.requiresDatavolume() && (
            <SizeUnitFormRow
              key="size-row"
              id={asId('size-row')}
              size={size}
              unit={unit as BinaryUnit}
              validation={sizeValidation}
              isDisabled={inProgress}
              isRequired
              onSizeChanged={setSize}
              onUnitChanged={setUnit}
            />
          )}
          <FormRow title="Interface" fieldId={asId('interface')} isRequired>
            <FormSelect
              onChange={React.useCallback((diskBus) => setBus(DiskBus.fromString(diskBus)), [
                setBus,
              ])}
              value={asFormSelectValue(bus)}
              id={asId('interface')}
              isDisabled={inProgress}
            >
              <FormSelectPlaceholderOption isDisabled placeholder="--- Select Interface ---" />
              {DiskBus.getAll().map((b) => {
                return (
                  <FormSelectOption key={b.getValue()} value={b.getValue()} label={b.toString()} />
                );
              })}
            </FormSelect>
          </FormRow>
          {source.requiresDatavolume() && (
            <K8sResourceSelectRow
              key="storage-class"
              id={asId('storage-class')}
              isDisabled={inProgress}
              name={storageClassName}
              data={storageClasses}
              model={StorageClassModel}
              hasPlaceholder
              onChange={(sc) => setStorageClassName(sc)}
            />
          )}
        </Form>
      </ModalBody>
      <ModalFooter
        id="disk"
        submitButtonText={isEditing ? 'Save' : 'Add'}
        errorMessage={errorMessage || (showUIError ? getDialogUIError(hasAllRequiredFilled) : null)}
        isDisabled={inProgress}
        isSimpleError={showUIError}
        onSubmit={submit}
        onCancel={(e) => {
          e.stopPropagation();
          cancel();
        }}
      />
    </div>
  );
});

export type DiskModalProps = {
  disk?: DiskWrapper;
  disableSourceChange?: boolean;
  volume?: VolumeWrapper;
  dataVolume?: DataVolumeWrapper;
  onSubmit: (
    disk: DiskWrapper,
    volume: VolumeWrapper,
    dataVolume: DataVolumeWrapper,
  ) => Promise<any>;
  namespaces?: FirehoseResult<K8sResourceKind[]>;
  storageClasses?: FirehoseResult<K8sResourceKind[]>;
  persistentVolumeClaims?: FirehoseResult<K8sResourceKind[]>;
  vmName: string;
  vmNamespace: string;
  namespace: string;
  onNamespaceChanged: (namespace: string) => void;
  usedDiskNames: Set<string>;
  usedPVCNames: Set<string>;
} & ModalComponentProps &
  HandlePromiseProps;

export const diskModal = createModalLauncher(DiskModal);
