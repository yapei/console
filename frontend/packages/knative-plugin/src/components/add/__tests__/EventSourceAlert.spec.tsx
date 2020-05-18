import * as React from 'react';
import { shallow } from 'enzyme';
import { Alert } from '@patternfly/react-core';
import { referenceForModel } from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import EventSourceAlert from '../EventSourceAlert';
import { knativeServiceObj } from '../../../topology/__tests__/topology-knative-test-data';
import { getKnativeEventSourceIcon } from '../../../utils/get-knative-icon';
import { EventSourceContainerModel } from '../../../models';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

describe('EventSourceAlert', () => {
  const namespaceName = 'myApp';
  const eventSourceStatusData = {
    loaded: true,
    eventSourceList: {
      [EventSourceContainerModel.kind]: {
        name: EventSourceContainerModel.kind,
        title: EventSourceContainerModel.kind,
        iconUrl: getKnativeEventSourceIcon(referenceForModel(EventSourceContainerModel)),
        displayName: EventSourceContainerModel.kind,
      },
    },
  };
  it('should not display alert if service data not loaded and eventSources are there', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([null, false]);
    const wrapper = shallow(
      <EventSourceAlert namespace={namespaceName} eventSourceStatus={eventSourceStatusData} />,
    );
    expect(wrapper.find(Alert).exists()).toBe(false);
  });

  it('should display alert if service loaded with empty data and eventSources are there', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    const wrapper = shallow(
      <EventSourceAlert namespace={namespaceName} eventSourceStatus={eventSourceStatusData} />,
    );
    expect(wrapper.find(Alert).exists()).toBe(true);
    expect(wrapper.find(Alert)).toHaveLength(1);
  });

  it('should not alert if service loaded with data and eventSources are there', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[knativeServiceObj], true]);
    const wrapper = shallow(
      <EventSourceAlert namespace={namespaceName} eventSourceStatus={eventSourceStatusData} />,
    );
    expect(wrapper.find(Alert).exists()).toBe(false);
  });

  it('should show alert if service loaded with data and eventSources is null', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[knativeServiceObj], true]);
    const wrapper = shallow(
      <EventSourceAlert namespace={namespaceName} eventSourceStatus={null} />,
    );
    expect(wrapper.find(Alert).exists()).toBe(true);
  });

  it('should show alert if service loaded with data and eventSources has loaded with no data', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[knativeServiceObj], true]);
    const eventSourceStatus = { loaded: true, eventSourceList: {} };
    const wrapper = shallow(
      <EventSourceAlert namespace={namespaceName} eventSourceStatus={eventSourceStatus} />,
    );
    expect(wrapper.find(Alert).exists()).toBe(true);
  });

  it('should not alert if service loaded with data and eventSources has not loaded', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[knativeServiceObj], true]);
    const eventSourceStatus = { loaded: false, eventSourceList: {} };
    const wrapper = shallow(
      <EventSourceAlert namespace={namespaceName} eventSourceStatus={eventSourceStatus} />,
    );
    expect(wrapper.find(Alert).exists()).toBe(false);
  });
});
