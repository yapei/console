import * as React from 'react';
import { CheckboxField, EnvironmentField } from '@console/shared';
import FormSection from '../section/FormSection';

export interface BuildConfigSectionProps {
  namespace: string;
}

const BuildConfigSection: React.FC<BuildConfigSectionProps> = ({ namespace }) => {
  const buildConfigObj = {
    kind: 'BuildConfig',
    metadata: {
      namespace,
    },
  };

  return (
    <FormSection title="Build Configuration" fullWidth>
      <CheckboxField name="build.triggers.webhook" label="Configure a webhook build trigger" />
      <CheckboxField
        name="build.triggers.image"
        label="Automatically build a new image when the builder image changes"
      />
      <CheckboxField
        name="build.triggers.config"
        label="Launch the first build when the build configuration is created"
      />
      <EnvironmentField
        name="build.env"
        label="Environment Variables (Build and Runtime)"
        obj={buildConfigObj}
        envPath={['spec', 'strategy']}
      />
    </FormSection>
  );
};

export default BuildConfigSection;
