import * as React from 'react';
import { connectToFlags } from '@console/internal/reducers/features';
import { FLAG_KNATIVE_SERVING } from '@console/knative-plugin';
import { TechPreviewBadge } from '@console/shared';
import { Split, SplitItem } from '@patternfly/react-core';
import { CheckboxField } from '../../formik-fields';
import FormSection from '../section/FormSection';

type ServerlessSectionProps = {
  flags: { [key: string]: boolean };
};

const ServerlessSection: React.FC<ServerlessSectionProps> = ({ flags }) => {
  if (flags[FLAG_KNATIVE_SERVING]) {
    const title = (
      <Split gutter="md">
        <SplitItem>Serverless</SplitItem>
        <SplitItem>
          <TechPreviewBadge />
        </SplitItem>
      </Split>
    );
    return (
      <FormSection title={title}>
        <CheckboxField label="Enable scaling to zero when idle" name="serverless.enabled" />
      </FormSection>
    );
  }

  return null;
};

export default connectToFlags(FLAG_KNATIVE_SERVING)(ServerlessSection);
