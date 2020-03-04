import * as React from 'react';
import * as _ from 'lodash';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { Button, Tooltip } from '@patternfly/react-core';
import {
  NodeAffinity as NodeAffinityType,
  MatchExpression,
  PodAffinity as PodAffinityType,
} from '@console/internal/module/k8s';
import { MatchExpressions } from './match-expressions';

const requiredTooltip = 'Required rules must be met before a pod can be scheduled on a node.';
const preferredTooltip =
  'Preferred rules specify that, if the rule is met, the scheduler tries to enforce the rules, but does not guarantee enforcement.';
const defaultMatchExpression: MatchExpression = { key: '', operator: 'Exists' };

export const defaultNodeAffinity: NodeAffinityType = {
  requiredDuringSchedulingIgnoredDuringExecution: {
    nodeSelectorTerms: [{ matchExpressions: [_.cloneDeep(defaultMatchExpression)] }],
  },
  preferredDuringSchedulingIgnoredDuringExecution: [
    {
      weight: 1,
      preference: { matchExpressions: [_.cloneDeep(defaultMatchExpression)] },
    },
  ],
};

export const NodeAffinity: React.FC<NodeAffinityProps> = ({ affinity, onChangeAffinity, uid }) => {
  const updateAffinity = (path, value) => _.set(_.cloneDeep(affinity), path, value);
  const addRequired = () =>
    updateAffinity(
      'requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms',
      affinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms.concat([
        { matchExpressions: [] },
      ]),
    );
  const removeRequired = (at: number) =>
    updateAffinity(
      'requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms',
      affinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms.filter(
        (v, i) => at !== i,
      ),
    );
  const addPreference = () =>
    updateAffinity(
      'preferredDuringSchedulingIgnoredDuringExecution',
      affinity.preferredDuringSchedulingIgnoredDuringExecution.concat([
        { weight: 1, preference: { matchExpressions: [] } },
      ]),
    );
  const removePreferred = (at: number) =>
    updateAffinity(
      'preferredDuringSchedulingIgnoredDuringExecution',
      affinity.preferredDuringSchedulingIgnoredDuringExecution.filter((v, i) => at !== i),
    );

  return affinity ? (
    <dl>
      <Tooltip content={requiredTooltip}>
        <dt>Required During Scheduling Ignored During Execution</dt>
      </Tooltip>
      <dd>
        {affinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms.map(
          (nodeSelector, i) => (
            // Have to use array index in the key bc any other unique id whould have to use editable fields.
            // eslint-disable-next-line react/no-array-index-key
            <div key={`${uid}-node-affinity-required-${i}`} className="co-affinity-term">
              {i > 0 && (
                <Button
                  type="button"
                  className="co-affinity-term__remove"
                  onClick={() => onChangeAffinity(removeRequired(i))}
                  variant="link"
                >
                  <MinusCircleIcon className="co-icon-space-r" />
                  Remove Required
                </Button>
              )}
              <MatchExpressions
                matchExpressions={nodeSelector.matchExpressions || ([] as MatchExpression[])}
                onChangeMatchExpressions={(matchExpressions) =>
                  onChangeAffinity(
                    updateAffinity(
                      `requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[${i}].matchExpressions`,
                      matchExpressions,
                    ),
                  )
                }
                allowedOperators={['In', 'NotIn', 'Exists', 'DoesNotExist']}
                uid={`${uid}-node-affinity-required-${i}`}
              />
            </div>
          ),
        )}
        <div className="row">
          <Button type="button" onClick={() => onChangeAffinity(addRequired())} variant="link">
            <PlusCircleIcon className="co-icon-space-r" />
            Add Required
          </Button>
        </div>
      </dd>
      <Tooltip content={preferredTooltip}>
        <dt>Preferred During Scheduling Ignored During Execution</dt>
      </Tooltip>
      <dd>
        {affinity.preferredDuringSchedulingIgnoredDuringExecution.map(
          ({ weight, preference }, i) => (
            // Have to use array index in the key bc any other unique id whould have to use editable fields.
            // eslint-disable-next-line react/no-array-index-key
            <div key={`${uid}-node-affinity-preferred-${i}`} className="co-affinity-term">
              {i > 0 && (
                <Button
                  type="button"
                  className="co-affinity-term__remove"
                  onClick={() => onChangeAffinity(removePreferred(i))}
                  variant="link"
                >
                  <MinusCircleIcon className="co-icon-space-r" />
                  Remove Preferred
                </Button>
              )}
              <div className="co-affinity-term__weight-input">
                <label className="control-label co-required" htmlFor={`preference-${i}`}>
                  Weight
                </label>
                <input
                  className="pf-c-form-control"
                  type="number"
                  value={
                    weight ||
                    affinity.preferredDuringSchedulingIgnoredDuringExecution[i - 1].weight + 1
                  }
                  onChange={(e) =>
                    onChangeAffinity(
                      updateAffinity(
                        `preferredDuringSchedulingIgnoredDuringExecution[${i}].weight`,
                        _.toInteger(e.target.value),
                      ),
                    )
                  }
                  required
                />
              </div>
              <MatchExpressions
                matchExpressions={preference.matchExpressions || ([] as MatchExpression[])}
                onChangeMatchExpressions={(matchExpressions) =>
                  onChangeAffinity(
                    updateAffinity(
                      `preferredDuringSchedulingIgnoredDuringExecution[${i}].preference.matchExpressions`,
                      matchExpressions,
                    ),
                  )
                }
                allowedOperators={['In', 'NotIn', 'Exists', 'DoesNotExist']}
                uid={`${uid}-node-affinity-preferred-${i}`}
              />
            </div>
          ),
        )}
        <div className="row">
          <Button type="button" onClick={() => onChangeAffinity(addPreference())} variant="link">
            <PlusCircleIcon className="co-icon-space-r" />
            Add Preferred
          </Button>
        </div>
      </dd>
    </dl>
  ) : null;
};

export const defaultPodAffinity: PodAffinityType = {
  requiredDuringSchedulingIgnoredDuringExecution: [
    {
      topologyKey: 'failure-domain.beta.kubernetes.io/zone',
      labelSelector: { matchExpressions: [_.cloneDeep(defaultMatchExpression)] },
    },
  ],
  preferredDuringSchedulingIgnoredDuringExecution: [
    {
      weight: 1,
      podAffinityTerm: {
        topologyKey: 'failure-domain.beta.kubernetes.io/zone',
        labelSelector: { matchExpressions: [_.cloneDeep(defaultMatchExpression)] },
      },
    },
  ],
};

export const PodAffinity: React.FC<PodAffinityProps> = ({
  affinity,
  onChangeAffinity,
  uid = '',
}) => {
  const updateAffinity = (path, value) => _.set(_.cloneDeep(affinity), path, value);

  const addRequired = () =>
    updateAffinity(
      'requiredDuringSchedulingIgnoredDuringExecution',
      affinity.requiredDuringSchedulingIgnoredDuringExecution.concat([
        { topologyKey: '', labelSelector: { matchExpressions: [] } },
      ]),
    );
  const removeRequired = (at: number) =>
    updateAffinity(
      'requiredDuringSchedulingIgnoredDuringExecution',
      affinity.requiredDuringSchedulingIgnoredDuringExecution.filter((v, i) => at !== i),
    );
  const addPreference = () =>
    updateAffinity(
      'preferredDuringSchedulingIgnoredDuringExecution',
      affinity.preferredDuringSchedulingIgnoredDuringExecution.concat([
        {
          weight: 1,
          podAffinityTerm: { topologyKey: '', labelSelector: { matchExpressions: [] } },
        },
      ]),
    );
  const removePreferred = (at: number) =>
    updateAffinity(
      'preferredDuringSchedulingIgnoredDuringExecution',
      affinity.preferredDuringSchedulingIgnoredDuringExecution.filter((v, i) => at !== i),
    );

  return affinity ? (
    <dl>
      <Tooltip content={requiredTooltip}>
        <dt>Required During Scheduling Ignored During Execution</dt>
      </Tooltip>
      <dd>
        {_.map(
          affinity?.requiredDuringSchedulingIgnoredDuringExecution || [],
          (podAffinityTerm, i) => (
            // Have to use array index in the key bc any other unique id whould have to use editable fields.
            // eslint-disable-next-line react/no-array-index-key
            <div key={`${uid}-pod-affinity-required-${i}`} className="co-affinity-term">
              {i > 0 && (
                <Button
                  type="button"
                  className="co-affinity-term__remove"
                  onClick={() => onChangeAffinity(removeRequired(i))}
                  variant="link"
                >
                  <MinusCircleIcon className="co-icon-space-r" />
                  Remove Required
                </Button>
              )}
              <div className="co-affinity-term__topology">
                <div className="co-affinity-term__topology-input">
                  <label className="control-label co-required" htmlFor={`topology-${i}`}>
                    Topology Key
                  </label>
                  <input
                    className="pf-c-form-control"
                    type="text"
                    value={
                      affinity?.requiredDuringSchedulingIgnoredDuringExecution?.[i]?.topologyKey ||
                      ''
                    }
                    onChange={(e) =>
                      onChangeAffinity(
                        updateAffinity(
                          `requiredDuringSchedulingIgnoredDuringExecution[${i}].topologyKey`,
                          e.target.value,
                        ),
                      )
                    }
                    required
                  />
                </div>
              </div>
              <MatchExpressions
                matchExpressions={
                  podAffinityTerm.labelSelector.matchExpressions || ([] as MatchExpression[])
                }
                onChangeMatchExpressions={(matchExpressions) =>
                  onChangeAffinity(
                    updateAffinity(
                      `requiredDuringSchedulingIgnoredDuringExecution[${i}].labelSelector.matchExpressions`,
                      matchExpressions,
                    ),
                  )
                }
                allowedOperators={['In', 'NotIn', 'Exists', 'DoesNotExist']}
                uid={`${uid}-pod-affinity-required-${i}`}
              />
            </div>
          ),
        )}
        <div className="row">
          <Button type="button" onClick={() => onChangeAffinity(addRequired())} variant="link">
            <PlusCircleIcon className="co-icon-space-r" />
            Add Required
          </Button>
        </div>
      </dd>
      <Tooltip content={preferredTooltip}>
        <dt>Preferred During Scheduling Ignored During Execution</dt>
      </Tooltip>
      <dd>
        {affinity.preferredDuringSchedulingIgnoredDuringExecution.map(
          ({ weight, podAffinityTerm }, i) => (
            // Have to use array index in the key bc any other unique id whould have to use editable fields.
            // eslint-disable-next-line react/no-array-index-key
            <div key={`${uid}-pod-affinity-preferred-${i}`} className="co-affinity-term">
              {i > 0 && (
                <Button
                  type="button"
                  className="co-affinity-term__remove"
                  onClick={() => onChangeAffinity(removePreferred(i))}
                  variant="link"
                >
                  <MinusCircleIcon className="co-icon-space-r" />
                  Remove Preferred
                </Button>
              )}
              <div className="co-affinity-term__topology">
                <div className="co-affinity-term__weight-input">
                  <label className="control-label co-required" htmlFor={`preference-${i}`}>
                    Weight
                  </label>
                  <input
                    className="pf-c-form-control"
                    type="number"
                    value={
                      weight ||
                      affinity?.preferredDuringSchedulingIgnoredDuringExecution?.[i - 1]?.weight +
                        1 ||
                      1
                    }
                    onChange={(e) =>
                      onChangeAffinity(
                        updateAffinity(
                          `preferredDuringSchedulingIgnoredDuringExecution[${i}].weight`,
                          _.toInteger(e.target.value),
                        ),
                      )
                    }
                    required
                  />
                </div>
                <div className="co-affinity-term__topology-input">
                  <label className="control-label co-required" htmlFor={`topology-${i}`}>
                    Topology Key
                  </label>
                  <input
                    className="pf-c-form-control"
                    type="text"
                    value={
                      affinity?.preferredDuringSchedulingIgnoredDuringExecution?.[i]
                        ?.podAffinityTerm.topologyKey || ''
                    }
                    onChange={(e) =>
                      onChangeAffinity(
                        updateAffinity(
                          `preferredDuringSchedulingIgnoredDuringExecution[${i}].podAffinityTerm.topologyKey`,
                          e.target.value,
                        ),
                      )
                    }
                    required
                  />
                </div>
              </div>
              <MatchExpressions
                matchExpressions={
                  podAffinityTerm.labelSelector.matchExpressions || ([] as MatchExpression[])
                }
                onChangeMatchExpressions={(matchExpressions) =>
                  onChangeAffinity(
                    updateAffinity(
                      `preferredDuringSchedulingIgnoredDuringExecution[${i}].podAffinityTerm.labelSelector.matchExpressions`,
                      matchExpressions,
                    ),
                  )
                }
                allowedOperators={['In', 'NotIn', 'Exists', 'DoesNotExist']}
                uid={`${uid}-pod-affinity-preferred-${i}`}
              />
            </div>
          ),
        )}
        <div className="row">
          <Button type="button" onClick={() => onChangeAffinity(addPreference())} variant="link">
            <PlusCircleIcon className="co-icon-space-r" />
            Add Preferred
          </Button>
        </div>
      </dd>
    </dl>
  ) : null;
};

export type NodeAffinityProps = {
  uid?: string;
  affinity: NodeAffinityType;
  onChangeAffinity: (affinity: NodeAffinityType) => void;
};

export type PodAffinityProps = {
  uid?: string;
  affinity: PodAffinityType;
  onChangeAffinity: (affinity: PodAffinityType) => void;
};

NodeAffinity.displayName = 'NodeAffinity';
PodAffinity.displayName = 'PodAffinity';
