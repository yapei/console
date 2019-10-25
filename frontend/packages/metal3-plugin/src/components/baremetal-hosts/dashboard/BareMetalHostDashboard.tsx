import * as React from 'react';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { MachineKind, NodeKind } from '@console/internal/module/k8s';
import { BareMetalHostKind } from '../../../types';
import { getHostMachine } from '../../../selectors';
import HealthCard from './HealthCard';
import UtilizationCard from './UtilizationCard';
import EventsCard from './EventsCard';
import InventoryCard from './InventoryCard';
import DetailsCard from './DetailsCard';

const BareMetalHostDashboard: React.FC<BareMetalHostDashboardProps> = ({
  obj,
  machines,
  nodes,
}) => {
  const machine = getHostMachine(obj, machines);

  const mainCards = [
    { Card: () => <HealthCard obj={obj} /> },
    { Card: () => <UtilizationCard obj={obj} machine={machine} /> },
  ];
  const leftCards = [
    {
      Card: () => <DetailsCard obj={obj} machines={machines} nodes={nodes} />,
    },
    { Card: () => <InventoryCard obj={obj} /> },
  ];
  const rightCards = [{ Card: () => <EventsCard obj={obj} /> }];

  return (
    <Dashboard>
      <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
    </Dashboard>
  );
};

type BareMetalHostDashboardProps = {
  obj: BareMetalHostKind;
  machines: MachineKind[];
  nodes: NodeKind[];
};

export default BareMetalHostDashboard;
