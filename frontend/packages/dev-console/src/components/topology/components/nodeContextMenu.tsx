import * as React from 'react';
import { ContextMenuItem, ContextSubMenuItem, Node, Graph } from '@patternfly/react-topology';
import {
  history,
  KebabItem,
  KebabOption,
  KebabMenuOption,
  kebabOptionsToMenu,
  isKebabSubMenu,
  // useAccessReview,
} from '@console/internal/components/utils';
import { workloadActions } from '../actions/workloadActions';
import { groupActions } from '../actions/groupActions';
import { graphActions } from '../actions/graphActions';
import { TopologyApplicationObject } from '../topology-types';
import { getResource } from '../topology-utils';

const onKebabOptionClick = (option: KebabOption) => {
  if (option.callback) {
    option.callback();
  }
  if (option.href) {
    history.push(option.href);
  }
};

// const Item: React.FC<{ option: KebabOption }> = ({ option }) => {
//   const isAllowed = useAccessReview(option?.accessReview ?? {});
//   return isAllowed ? (
//     <KebabItem option={option} onClick={() => onKebabOptionClick(option)} />
//   ) : null;
// };

export const createMenuItems = (actions: KebabMenuOption[]) =>
  actions.map((option: KebabMenuOption, index) =>
    isKebabSubMenu(option) ? (
      <ContextSubMenuItem label={option.label} key={option.label}>
        {createMenuItems(option.children)}
      </ContextSubMenuItem>
    ) : (
      <ContextMenuItem
        key={index} // eslint-disable-line react/no-array-index-key
        component={<KebabItem option={option} onClick={() => onKebabOptionClick(option)} />}
      />
    ),
  );

export const workloadContextMenu = (element: Node) =>
  createMenuItems(kebabOptionsToMenu(workloadActions(getResource(element))));

export const noRegroupWorkloadContextMenu = (element: Node) =>
  createMenuItems(kebabOptionsToMenu(workloadActions(getResource(element), false)));

export const groupContextMenu = (element: Node, connectorSource?: Node) => {
  const applicationData: TopologyApplicationObject = {
    id: element.getId(),
    name: element.getLabel(),
    resources: element.getData().groupResources,
  };

  const graphData = element.getGraph().getData();
  return createMenuItems(
    kebabOptionsToMenu(groupActions(graphData, applicationData, connectorSource)),
  );
};

export const graphContextMenu = (graph: Graph, connectorSource?: Node) =>
  createMenuItems(kebabOptionsToMenu(graphActions(graph.getData(), connectorSource)));
