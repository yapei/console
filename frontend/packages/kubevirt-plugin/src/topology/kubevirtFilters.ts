import { Model } from '@patternfly/react-topology';
import {
  DisplayFilters,
  isShown,
  TopologyDisplayFilterType,
} from '@console/dev-console/src/components/topology';
import { TYPE_VIRTUAL_MACHINE } from './components/const';

export const SHOW_VMS_FILTER_ID = 'virtualMachines';

export const getTopologyFilters = () => {
  return [
    {
      type: TopologyDisplayFilterType.show,
      id: SHOW_VMS_FILTER_ID,
      label: 'Virtual Machines',
      priority: 300,
      value: true,
    },
  ];
};

export const applyKubevirtDisplayOptions = (model: Model, filters: DisplayFilters): string[] => {
  const showVMs = isShown(SHOW_VMS_FILTER_ID, filters);
  const appliedFilters = [];
  let found = false;
  model.nodes.forEach((d) => {
    if (d.type === TYPE_VIRTUAL_MACHINE) {
      if (!found) {
        found = true;
        appliedFilters.push(SHOW_VMS_FILTER_ID);
      }
      d.visible = showVMs;
    }
  });
  return appliedFilters;
};

export const applyDisplayOptions = () => applyKubevirtDisplayOptions;
