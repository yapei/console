import * as React from 'react';
import { shallow } from 'enzyme';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import PipelineSection from '@console/pipelines-plugin/src/components/import/pipeline/PipelineSection';
import GitSection from '../../import/git/GitSection';
import BuilderSection from '../../import/builder/BuilderSection';
import DockerSection from '../../import/git/DockerSection';
import ImageSearchSection from '../../import/image-search/ImageSearchSection';
import IconSection from '../../import/section/IconSection';
import AppSection from '../../import/app/AppSection';
import AdvancedSection from '../../import/advanced/AdvancedSection';
import { CreateApplicationFlow } from '../edit-application-utils';
import EditApplicationForm from '../EditApplicationForm';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('EditApplicationForm', () => {
  const componentProps = {
    ...formikFormProps,
    appResources: {},
  };

  it('should hide git & pipeline sections for container edit form', () => {
    const wrapper = shallow(
      <EditApplicationForm {...componentProps} createFlowType={CreateApplicationFlow.Container} />,
    );
    expect(wrapper.find(GitSection).exists()).toBe(false);
    expect(wrapper.find(PipelineSection).exists()).toBe(false);
  });

  it('should show git & pipeline sections for docker and git edit forms', () => {
    let wrapper = shallow(
      <EditApplicationForm
        {...componentProps}
        createFlowType={CreateApplicationFlow.Dockerfile}
        values={{ build: { strategy: 'Docker' } }}
      />,
    );
    expect(wrapper.find(GitSection).exists()).toBe(true);
    expect(wrapper.find(PipelineSection).exists()).toBe(true);

    wrapper = shallow(
      <EditApplicationForm {...componentProps} createFlowType={CreateApplicationFlow.Git} />,
    );
    expect(wrapper.find(GitSection).exists()).toBe(true);
    expect(wrapper.find(PipelineSection).exists()).toBe(true);
  });

  it('should show image search & icon sections only for container edit form', () => {
    const wrapper = shallow(
      <EditApplicationForm {...componentProps} createFlowType={CreateApplicationFlow.Container} />,
    );
    expect(wrapper.find(ImageSearchSection).exists()).toBe(true);
    expect(wrapper.find(IconSection).exists()).toBe(true);
  });

  it('should hide image search & icon sections for git and docker edit forms', () => {
    let wrapper = shallow(
      <EditApplicationForm {...componentProps} createFlowType={CreateApplicationFlow.Git} />,
    );
    expect(wrapper.find(ImageSearchSection).exists()).toBe(false);
    expect(wrapper.find(IconSection).exists()).toBe(false);

    wrapper = shallow(
      <EditApplicationForm
        {...componentProps}
        createFlowType={CreateApplicationFlow.Dockerfile}
        values={{ build: { strategy: 'Docker' } }}
      />,
    );
    expect(wrapper.find(ImageSearchSection).exists()).toBe(false);
    expect(wrapper.find(IconSection).exists()).toBe(false);
  });

  it('should show builder section only for git edit form', () => {
    const wrapper = shallow(
      <EditApplicationForm {...componentProps} createFlowType={CreateApplicationFlow.Git} />,
    );
    expect(wrapper.find(BuilderSection).exists()).toBe(true);
  });

  it('should hide builder section for container docker edit forms', () => {
    let wrapper = shallow(
      <EditApplicationForm {...componentProps} createFlowType={CreateApplicationFlow.Container} />,
    );
    expect(wrapper.find(BuilderSection).exists()).toBe(false);

    wrapper = shallow(
      <EditApplicationForm
        {...componentProps}
        createFlowType={CreateApplicationFlow.Dockerfile}
        values={{ build: { strategy: 'Docker' } }}
      />,
    );
    expect(wrapper.find(BuilderSection).exists()).toBe(false);
  });

  it('should show docker section only for dockerfile edit form', () => {
    const wrapper = shallow(
      <EditApplicationForm
        {...componentProps}
        createFlowType={CreateApplicationFlow.Dockerfile}
        values={{ build: { strategy: 'Docker' } }}
      />,
    );
    expect(wrapper.find(DockerSection).exists()).toBe(true);
  });

  it('should hide docker section for git and container edit forms', () => {
    let wrapper = shallow(
      <EditApplicationForm {...componentProps} createFlowType={CreateApplicationFlow.Git} />,
    );
    expect(wrapper.find(DockerSection).exists()).toBe(false);

    wrapper = shallow(
      <EditApplicationForm {...componentProps} createFlowType={CreateApplicationFlow.Container} />,
    );
    expect(wrapper.find(DockerSection).exists()).toBe(false);
  });

  it('should show app section and advanced section for all forms', () => {
    let wrapper = shallow(
      <EditApplicationForm
        {...componentProps}
        createFlowType={CreateApplicationFlow.Dockerfile}
        values={{ build: { strategy: 'Docker' } }}
      />,
    );
    expect(wrapper.find(AppSection).exists()).toBe(true);
    expect(wrapper.find(AdvancedSection).exists()).toBe(true);

    wrapper = shallow(
      <EditApplicationForm {...componentProps} createFlowType={CreateApplicationFlow.Git} />,
    );
    expect(wrapper.find(AppSection).exists()).toBe(true);
    expect(wrapper.find(AdvancedSection).exists()).toBe(true);

    wrapper = shallow(
      <EditApplicationForm {...componentProps} createFlowType={CreateApplicationFlow.Container} />,
    );
    expect(wrapper.find(AppSection).exists()).toBe(true);
    expect(wrapper.find(AdvancedSection).exists()).toBe(true);
  });
});
