import { AffinityCondition, AffinityType } from '../affinity-modal/types';
import { pluralize } from '@console/internal/components/utils';

// Node Checker
const pluralNode = (size) => pluralize(size, 'node', 'nodes', false);
export const SCHEDULING_NODES_MATCH_TEXT = (nodeAmount) =>
  `${nodeAmount} matching ${pluralNode(nodeAmount)} found`;
export const SCHEDULING_WITH_PREFERRED_NODES_MATCH_TEXT = (nodeAmount, preferredNodeAmount) =>
  `${nodeAmount} matching ${pluralNode(
    nodeAmount,
  )} found, ${preferredNodeAmount} matching preferred ${pluralNode(preferredNodeAmount)} found`;
export const SCHEDULING_NODES_MATCH_BUTTON_TEXT = (nodeAmount) =>
  `View ${nodeAmount} matching ${pluralNode(nodeAmount)}`;
export const SCHEDULING_NO_NODES_MATCH_BUTTON_TEXT =
  'Scheduling will not be possible at this state';
export const SCHEDULING_NO_NODES_TAINTED_MATCH_BUTTON_TEXT =
  'No new nodes will be added to scheduler';
export const SCHEDULING_NO_NODES_MATCH_TEXT = 'No matching nodes found for the labels';
export const SCHEDULING_NO_NODES_TAINTED_MATCH_TEXT = 'No matching tainted nodes found';

// Dedicated Resources
export const DEDICATED_RESOURCES_LABELS = [{ id: null, key: 'cpumanager', value: 'true' }];

// Tolerations Modal
export const TOLERATIONS_EFFECTS = ['NoSchedule', 'PreferNoSchedule', 'NoExecute'];

export const AFFINITY_CONDITION_LABELS = {
  [AffinityCondition.preferred]: 'Preferred during scheduling',
  [AffinityCondition.required]: 'Required during scheduling',
};

export const AFFINITY_TYPE_LABLES = {
  [AffinityType.node]: 'Node Affinity',
  [AffinityType.pod]: 'Workload (pod) Affinity',
  [AffinityType.podAnti]: 'Workload (pod) Anti-Affinity',
};

export const EXPRESSION_OPERATORS = ['In', 'NotIn', 'Exists', 'DoesNotExist'];
