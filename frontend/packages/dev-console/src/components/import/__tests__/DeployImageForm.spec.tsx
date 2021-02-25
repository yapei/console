import * as React from 'react';
import { shallow } from 'enzyme';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { FormFooter } from '@console/shared/src/components/form-utils';
import DeployImageForm from '../DeployImageForm';
import ImageSearchSection from '../image-search/ImageSearchSection';
import IconSection from '../section/IconSection';
import AppSection from '../app/AppSection';
import ResourceSection from '../section/ResourceSection';
import AdvancedSection from '../advanced/AdvancedSection';

let deployImageFormProps: React.ComponentProps<typeof DeployImageForm>;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('DeployImageForm', () => {
  beforeEach(() => {
    deployImageFormProps = {
      ...formikFormProps,
      projects: {
        loaded: true,
        data: [],
      },
    };
  });

  it('should render ImageSearchSection, IconSection, AppSection, ResourceSection, AdvancedSection and FormFooter', () => {
    const wrapper = shallow(<DeployImageForm {...deployImageFormProps} />);
    expect(wrapper.find(ImageSearchSection).exists()).toBe(true);
    expect(wrapper.find(IconSection).exists()).toBe(true);
    expect(wrapper.find(AppSection).exists()).toBe(true);
    expect(wrapper.find(ResourceSection).exists()).toBe(true);
    expect(wrapper.find(AdvancedSection).exists()).toBe(true);
    expect(wrapper.find(FormFooter).exists()).toBe(true);
  });

  it('should render ImageSearchSection, IconSection, AppSection, AdvancedSection and FormFooter', () => {
    const deployImageFormKnProps = {
      ...deployImageFormProps,
      values: { formType: 'knatify' },
    };
    const wrapper = shallow(<DeployImageForm {...deployImageFormKnProps} />);
    expect(wrapper.find(ImageSearchSection).exists()).toBe(true);
    expect(wrapper.find(IconSection).exists()).toBe(true);
    expect(wrapper.find(AppSection).exists()).toBe(true);
    expect(wrapper.find(ResourceSection).exists()).toBe(false);
    expect(wrapper.find(AdvancedSection).exists()).toBe(true);
    expect(wrapper.find(FormFooter).exists()).toBe(true);
  });
});
