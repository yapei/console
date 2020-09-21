import * as React from 'react';
import { Table, RowFunction } from '@console/internal/components/factory';
import { sortable } from '@patternfly/react-table';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { createBasicLookup, dimensifyHeader } from '@console/shared';
import { EmptyBox } from '@console/internal/components/utils';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { isVMI, isVM } from '../../selectors/check-type';
import { VMTabProps } from '../vms/types';
import { NetworkInterfaceWrapper } from '../../k8s/wrapper/vm/network-interface-wrapper';
import { nicModalEnhanced } from '../modals/nic-modal/nic-modal-enhanced';
import { getSimpleName } from '../../selectors/utils';
import { NetworkWrapper } from '../../k8s/wrapper/vm/network-wrapper';
import { wrapWithProgress } from '../../utils/utils';
import { NicRow } from './nic-row';
import { NetworkBundle } from './types';
import { nicTableColumnClasses } from './utils';
import { asVMILikeWrapper } from '../../k8s/wrapper/utils/convert';
import { ADD_NETWORK_INTERFACE } from '../../utils/strings';
import { isVMRunningOrExpectedRunning } from '../../selectors/vm/selectors';
import { asVM } from '../../selectors/vm';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import { changedNics } from '../../selectors/vm-like/next-run-changes';

const getNicsData = (vmLikeEntity: VMGenericLikeEntityKind): NetworkBundle[] => {
  const vmiLikeWrapper = asVMILikeWrapper(vmLikeEntity);

  const networks = vmiLikeWrapper?.getNetworks() || [];
  const interfaces = vmiLikeWrapper?.getNetworkInterfaces() || [];

  const networkLookup = createBasicLookup(networks, getSimpleName);

  return interfaces.map((nic) => {
    const network = networkLookup[nic.name];
    const interfaceWrapper = new NetworkInterfaceWrapper(nic);
    const networkWrapper = new NetworkWrapper(network);
    return {
      nic,
      network,
      // for sorting
      name: interfaceWrapper.getName(),
      model: interfaceWrapper.getReadableModel(),
      networkName: networkWrapper.getReadableName(),
      interfaceType: interfaceWrapper.getTypeValue(),
      macAddress: interfaceWrapper.getMACAddress(),
    };
  });
};

export type VMNicsTableProps = {
  data?: any[];
  customData?: object;
  row: RowFunction;
  columnClasses: string[];
};

const NoDataEmptyMsg = () => <EmptyBox label="Network Interfaces" />;

export const VMNicsTable: React.FC<VMNicsTableProps> = ({
  data,
  customData,
  row: Row,
  columnClasses,
}) => {
  return (
    <Table
      aria-label="VM Nics List"
      data={data}
      NoDataEmptyMsg={NoDataEmptyMsg}
      Header={() =>
        dimensifyHeader(
          [
            {
              title: 'Name',
              sortField: 'name',
              transforms: [sortable],
            },
            {
              title: 'Model',
              sortField: 'model',
              transforms: [sortable],
            },
            {
              title: 'Network',
              sortField: 'networkName',
              transforms: [sortable],
            },
            {
              title: 'Type',
              sortField: 'interfaceType',
              transforms: [sortable],
            },
            {
              title: 'MAC Address',
              sortField: 'macAddress',
              transforms: [sortable],
            },
            {
              title: '',
            },
          ],
          columnClasses,
        )
      }
      Row={Row}
      customData={{ ...customData, columnClasses }}
      virtualize
      loaded
    />
  );
};

export const VMNics: React.FC<VMTabProps> = ({ obj: vmLikeEntity, vmis: vmisProp }) => {
  const [isLocked, setIsLocked] = useSafetyFirst(false);
  const withProgress = wrapWithProgress(setIsLocked);
  const isVMRunning = isVM(vmLikeEntity) && isVMRunningOrExpectedRunning(asVM(vmLikeEntity));
  const pendingChangesNICs: Set<string> =
    vmisProp?.length > 0 && isVMI(vmisProp[0])
      ? new Set(changedNics(new VMWrapper(asVM(vmLikeEntity)), new VMIWrapper(vmisProp[0])))
      : null;

  return (
    <div className="co-m-list">
      {!isVMI(vmLikeEntity) && (
        <div className="co-m-pane__filter-bar">
          <div className="co-m-pane__filter-bar-group">
            <Button
              variant={ButtonVariant.primary}
              id="add-nic"
              onClick={() =>
                withProgress(
                  nicModalEnhanced({
                    blocking: true,
                    vmLikeEntity,
                    isVMRunning,
                  }).result,
                )
              }
              isDisabled={isLocked}
            >
              {ADD_NETWORK_INTERFACE}
            </Button>
          </div>
        </div>
      )}
      <div className="co-m-pane__body">
        <VMNicsTable
          data={getNicsData(vmLikeEntity)}
          customData={{
            vmLikeEntity,
            withProgress,
            isDisabled: isLocked,
            pendingChangesNICs,
          }}
          row={NicRow}
          columnClasses={nicTableColumnClasses}
        />
      </div>
    </div>
  );
};
