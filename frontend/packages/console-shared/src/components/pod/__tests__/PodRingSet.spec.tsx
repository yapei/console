import * as React from 'react';
import { shallow } from 'enzyme';
import { PodKind } from '@console/internal/module/k8s';
import { samplePods } from '@console/shared/src/utils/__tests__/test-resource-data';
import { DeploymentConfigModel } from '@console/internal/models';
import { LongArrowAltRightIcon } from '@patternfly/react-icons';
import PodRingSet from '../PodRingSet';
import { PodRCData } from '../../../types';
import * as hooks from '../../../hooks';
import PodRing from '../PodRing';

describe(PodRingSet.displayName, () => {
  let podData: PodRCData;
  let obj;

  beforeEach(() => {
    const rc = {
      pods: [],
      alerts: {},
      revision: 0,
      obj: {},
      phase: 'Complete',
    };
    podData = {
      current: { ...rc },
      previous: { ...rc },
      pods: [] as PodKind[],
      isRollingOut: false,
    };
    obj = { kind: DeploymentConfigModel.kind };
    jest.spyOn(hooks, 'usePodsWatcher').mockImplementation(() => {
      return { loaded: true, loadError: '', podData };
    });
  });

  it('should component exists', () => {
    const wrapper = shallow(<PodRingSet obj={obj} path="" />);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should PodRing with key `notDeploy` exists', () => {
    podData.pods = [samplePods.data[0] as PodKind];
    const wrapper = shallow(<PodRingSet obj={obj} path="" />);
    expect(wrapper.find(PodRing)).toHaveLength(1);
    expect(wrapper.find(PodRing).get(0).key).toEqual('notDeploy');
    expect(wrapper.find(LongArrowAltRightIcon)).toHaveLength(0);
    expect(wrapper.find(PodRing).get(0).props.pods).toEqual([samplePods.data[0] as PodKind]);
  });

  it('should PodRing with key `deploy` exists', () => {
    const rc = {
      pods: [samplePods.data[0] as PodKind],
      alerts: {},
      revision: 0,
      obj: {},
      phase: 'Pending',
    };
    podData.current = { ...rc };
    podData.isRollingOut = true;
    const rollingObj = { ...obj, spec: { strategy: { type: 'Rolling' } } };
    const wrapper = shallow(<PodRingSet obj={rollingObj} path="" />);
    expect(wrapper.find(PodRing)).toHaveLength(2);
    expect(wrapper.find(PodRing).get(0).key).toEqual('deploy');
    expect(wrapper.find(PodRing).get(0).props.pods).toEqual([]);
    expect(wrapper.find(LongArrowAltRightIcon)).toHaveLength(1);
    expect(wrapper.find(PodRing).get(1).props.pods).toEqual([samplePods.data[0] as PodKind]);
  });

  it('should PodRing with key `notDeploy` exists when there is no strategy mentioned', () => {
    const rollingObj = { ...obj, spec: { strategy: { type: 'Rolling' } } };
    const wrapper = shallow(<PodRingSet obj={rollingObj} path="" />);
    expect(wrapper.find(PodRing)).toHaveLength(1);
    expect(wrapper.find(PodRing).get(0).key).toEqual('notDeploy');
    expect(wrapper.find(LongArrowAltRightIcon)).toHaveLength(0);
    expect(wrapper.find(PodRing).get(0).props.pods).toEqual([]);
  });
});
