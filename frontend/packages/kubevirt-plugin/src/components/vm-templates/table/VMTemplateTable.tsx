import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { Stack, StackItem } from '@patternfly/react-core';
import { sortable, info } from '@patternfly/react-table';
import { RowFunction, Table } from '@console/internal/components/factory';
import { dimensifyHeader } from '@console/shared';
import { FirehoseResult } from '@console/internal/components/utils';
import { PersistentVolumeClaimKind, PodKind, TemplateKind } from '@console/internal/module/k8s';

import { usePinnedTemplates } from '../../../hooks/use-pinned-templates';
import { useBaseImages } from '../../../hooks/use-base-images';
import { getTemplateName, getTemplateProvider } from '../../../selectors/vm-template/basic';
import VMTemplateRow from './VMTemplateRow';
import VMCustomizeRow from './VMCustomizeRow';
import { tableColumnClasses } from './utils';
import { VirtualMachineTemplateBundle } from './types';
import VMTemplateSupport from '../VMTemplateSupport';
import { V1alpha1DataVolume } from '../../../types/api';
import { useNamespace } from '../../../hooks/use-namespace';
import { VMIKind } from '../../../types';

import './vm-template-table.scss';

const vmTemplateTableHeader = (showNamespace: boolean, t: TFunction) =>
  dimensifyHeader(
    [
      {
        title: t('kubevirt-plugin~Name'),
        sortFunc: 'vmTemplateName',
        transforms: [sortable],
      },
      {
        title: t('kubevirt-plugin~Provider'),
        sortFunc: 'vmTemplateProvider',
        transforms: [sortable],
      },
      {
        title: t('kubevirt-plugin~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
      },
      {
        title: t('kubevirt-plugin~Boot source'),
        transforms: [
          info({
            tooltip: t(
              'kubevirt-plugin~Any template with an available source will show in the developer catalog.',
            ),
          }),
        ],
      },
      {
        title: '',
      },
    ],
    tableColumnClasses(showNamespace),
  );

vmTemplateTableHeader.displayName = 'VMTemplateTableHeader';

const VMTemplateTable: React.FC<VMTemplateTableProps> = (props) => {
  const { t } = useTranslation();
  const [isPinned, togglePin] = usePinnedTemplates();
  const namespace = useNamespace();
  const [baseImages, imagesLoaded, error, baseImageDVs, baseImagePods] = useBaseImages(
    props.resources.vmCommonTemplates?.data ?? [],
    !!namespace,
  );
  const dataVolumes = React.useMemo(
    () => [...props.resources.dataVolumes.data, ...(baseImageDVs || [])],
    [props.resources.dataVolumes.data, baseImageDVs],
  );
  const pvcs = React.useMemo(() => [...props.resources.pvcs.data, ...(baseImages || [])], [
    props.resources.pvcs.data,
    baseImages,
  ]);
  const pods = React.useMemo(() => [...props.resources.pods.data, ...(baseImagePods || [])], [
    props.resources.pods.data,
    baseImagePods,
  ]);

  const row = React.useCallback<RowFunction<VirtualMachineTemplateBundle>>(
    (rowProps) =>
      rowProps.obj.template ? (
        <VMTemplateRow {...rowProps} obj={rowProps.obj.template} />
      ) : (
        <VMCustomizeRow {...rowProps} obj={rowProps.obj.customizeTemplate} />
      ),
    [],
  );
  return (
    <Stack hasGutter className="kubevirt-vm-template-list">
      <StackItem className="kv-vm-template__support">
        <VMTemplateSupport />
      </StackItem>
      <StackItem>
        <Table
          {...props}
          aria-label={t('kubevirt-plugin~Virtual Machine Templates')}
          Header={() => vmTemplateTableHeader(!namespace, t)}
          Row={row}
          virtualize
          customData={{
            dataVolumes,
            pvcs,
            pods,
            loaded: imagesLoaded,
            namespace,
            togglePin,
            isPinned,
            sourceLoadError: error,
            vmis: props.resources.vmis,
          }}
          isPinned={(obj: VirtualMachineTemplateBundle) =>
            obj.template ? isPinned(obj.template) : true
          }
          defaultSortFunc="vmTemplateName"
          customSorts={{
            vmTemplateName: (obj: VirtualMachineTemplateBundle) => {
              return obj.template
                ? getTemplateName(obj.template.variants[0])
                : `0${obj.customizeTemplate.template.metadata.name}`; // customize templates are sorted on top
            },
            vmTemplateProvider: (obj: VirtualMachineTemplateBundle) =>
              getTemplateProvider(
                t,
                obj.template ? obj.template.variants[0] : obj.customizeTemplate.template,
              ),
          }}
        />
      </StackItem>
    </Stack>
  );
};

type VMTemplateTableProps = React.ComponentProps<typeof Table> & {
  data: VirtualMachineTemplateBundle[];
  resources: {
    vmCommonTemplates: FirehoseResult<TemplateKind[]>;
    dataVolumes: FirehoseResult<V1alpha1DataVolume[]>;
    pvcs: FirehoseResult<PersistentVolumeClaimKind[]>;
    pods: FirehoseResult<PodKind[]>;
    vmis: FirehoseResult<VMIKind[]>;
  };
};

export default VMTemplateTable;
