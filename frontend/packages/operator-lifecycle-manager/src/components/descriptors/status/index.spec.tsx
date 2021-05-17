import * as React from 'react';
import store from '@console/internal/redux';
import { Router } from 'react-router';
import { Provider } from 'react-redux';
import { mount, ReactWrapper } from 'enzyme';
import { Descriptor, StatusCapability, SpecCapability, DescriptorType } from '../types';
import { testModel, testResourceInstance } from '../../../../mocks';
import { ResourceLink, history } from '@console/internal/components/utils';
import { DescriptorDetailsItem, DescriptorDetailsItemProps } from '..';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

const OBJ = {
  ...testResourceInstance,
  status: {
    link: 'https://example.com',
    service: 'someservice',
  },
};

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('Status descriptor details items', () => {
  let wrapper: ReactWrapper<DescriptorDetailsItemProps>;
  let descriptor: Descriptor;

  beforeEach(() => {
    descriptor = {
      path: 'test',
      displayName: 'Some Thing',
      description: '',
      'x-descriptors': [],
    };
    wrapper = mount(
      <DescriptorDetailsItem
        descriptor={descriptor}
        obj={OBJ}
        model={testModel}
        schema={{}}
        type={DescriptorType.status}
      />,
      {
        wrappingComponent: (props) => (
          <Router history={history}>
            <Provider store={store} {...props} />,
          </Router>
        ),
      },
    );
  });

  it('renders status value as text if no matching capability component', () => {
    expect(wrapper.find('dt').text()).toEqual(descriptor.displayName);
    expect(wrapper.find('dd .text-muted').text()).toEqual('public~None');
  });

  it('renders a link status', () => {
    descriptor['x-descriptors'] = [StatusCapability.w3Link];
    descriptor.path = 'link';
    wrapper = wrapper.setProps({ descriptor });

    expect(wrapper.find('dd').text()).toEqual('example.com');
  });

  it('renders a resource status', () => {
    descriptor['x-descriptors'] = [
      `${StatusCapability.k8sResourcePrefix}Service`,
    ] as SpecCapability[];
    descriptor.path = 'service';
    wrapper = wrapper.setProps({ descriptor });
    const resourceLink = wrapper.find(ResourceLink);

    expect(resourceLink.prop('kind')).toEqual('Service');
    expect(resourceLink.prop('namespace')).toEqual('default');
  });
});
