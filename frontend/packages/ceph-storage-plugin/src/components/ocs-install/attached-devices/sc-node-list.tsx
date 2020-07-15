import * as React from 'react';
import * as _ from 'lodash';
import {
  getName,
  getNodeRoles,
  getNodeCPUCapacity,
  getNodeAllocatableMemory,
} from '@console/shared';
import { humanizeCpuCores, ResourceLink } from '@console/internal/components/utils/';
import { Table } from '@console/internal/components/factory';
import { IRow } from '@patternfly/react-table';
import { getConvertedUnits } from '../../../utils/install';
import { getColumns } from '../node-list';
import { GetRows, NodeTableProps } from '../types';
import '../ocs-install.scss';

const getRows: GetRows = ({ componentProps, customData }) => {
  const { data } = componentProps;
  const { nodes, setNodes, filteredNodes } = customData;

  const nodeList = filteredNodes?.length ? filteredNodes : data.map(getName);
  const filteredData = data.filter((node) => nodeList.includes(getName(node)));

  const rows = filteredData.map((node) => {
    const roles = getNodeRoles(node).sort();
    const cpuSpec: string = getNodeCPUCapacity(node);
    const memSpec: string = getNodeAllocatableMemory(node);
    const cells: IRow['cells'] = [
      {
        title: <ResourceLink kind="Node" name={getName(node)} title={node.metadata.uid} />,
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

  if (!_.isEqual(filteredData, nodes)) {
    setNodes(filteredData);
  }

  return rows;
};

const AttachedDevicesNodeTable: React.FC<NodeTableProps> = (props) => (
  <div className="ceph-node-list__max-height">
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
