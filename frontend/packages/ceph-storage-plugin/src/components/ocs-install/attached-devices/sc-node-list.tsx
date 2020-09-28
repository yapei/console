import * as React from 'react';
import * as _ from 'lodash';
import { IRow } from '@patternfly/react-table';
import {
  getName,
  getNodeRoles,
  getNodeCPUCapacity,
  getNodeAllocatableMemory,
} from '@console/shared';
import { humanizeCpuCores, ResourceLink } from '@console/internal/components/utils/';
import { Table } from '@console/internal/components/factory';
import { NodeKind } from '@console/internal/module/k8s';
import { getConvertedUnits } from '../../../utils/install';
import { getColumns } from '../node-list';
import { GetRows, NodeTableProps } from '../types';
import '../ocs-install.scss';

const getRows: GetRows = ({ componentProps, customData }) => {
  const { data } = componentProps;
  const { nodes, setNodes, filteredNodes } = customData;
  let filteredData: NodeKind[] = data;

  if (filteredNodes) {
    filteredData = data.filter(
      (node: NodeKind) =>
        filteredNodes.includes(getName(node)) ||
        filteredNodes.includes(node.metadata.labels?.['kubernetes.io/hostname']),
    );
  }

  const rows = filteredData.map((node) => {
    const roles = getNodeRoles(node).sort();
    const cpuSpec: string = getNodeCPUCapacity(node);
    const memSpec: string = getNodeAllocatableMemory(node);
    const cells: IRow['cells'] = [
      {
        title: <ResourceLink kind="Node" name={getName(node)} title={getName(node)} />,
      },
      {
        title: roles.join(', ') || '-',
      },
      {
        title: node.metadata.labels?.['failure-domain.beta.kubernetes.io/zone'] || '-',
      },
      {
        title: `${humanizeCpuCores(cpuSpec).string || '-'}`,
      },
      {
        title: `${getConvertedUnits(memSpec)}`,
      },
    ];
    return {
      cells,
      props: {
        id: node.metadata.uid,
      },
    };
  });

  if (setNodes && !_.isEqual(filteredData, nodes)) {
    setNodes(filteredData);
  }

  return rows;
};

const AttachedDevicesNodeTable: React.FC<NodeTableProps> = (props) => (
  <div className="ceph-node-list__max-height ceph-ocs-install__node-list">
    <Table
      aria-label="Node Table"
      data-test-id="attached-devices-nodes-table"
      {...props}
      Rows={getRows}
      Header={getColumns}
      virtualize={false}
    />
  </div>
);

export default AttachedDevicesNodeTable;
