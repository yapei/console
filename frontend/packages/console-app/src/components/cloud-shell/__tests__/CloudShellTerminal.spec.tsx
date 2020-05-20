import * as React from 'react';
import { shallow, mount } from 'enzyme';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import { InternalCloudShellTerminal } from '../CloudShellTerminal';
import CloudShellSetup from '../setup/CloudShellSetup';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

describe('CloudShellTerminal', () => {
  it('should display loading box', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([null, false]);
    const wrapper = mount(<InternalCloudShellTerminal username="user" />);
    expect(wrapper.find(LoadingBox)).toHaveLength(1);
  });

  it('should display form if loaded and no workspace', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    const wrapper = shallow(<InternalCloudShellTerminal username="user" />);
    expect(wrapper.find(CloudShellSetup)).toHaveLength(1);
  });
});
