import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { TextInputTypes, FormGroup } from '@patternfly/react-core';
import { InputField, TextColumnField } from '@console/shared';
import { AsyncComponent } from '@console/internal/components/utils';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { getSuggestedName } from '@console/dev-console/src/utils/imagestream-utils';
import { EventSources } from '../import-types';

const templateSpec = `data.${EventSources.ContainerSource}.template.spec.containers[0]`;
const containerPaths = {
  Image: `${templateSpec}.image`,
  Name: `${templateSpec}.name`,
  Env: `${templateSpec}.env`,
  Args: `${templateSpec}.args`,
};

interface ContainerSourceSectionProps {
  title: string;
}

const ContainerSourceSection: React.FC<ContainerSourceSectionProps> = ({ title }) => {
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const {
    data: {
      [EventSources.ContainerSource]: {
        template: {
          spec: {
            containers: [{ env: envs, args }],
          },
        },
      },
    },
  } = values;
  const initialEnvValues = !_.isEmpty(envs) ? _.map(envs, (env) => _.values(env)) : [['', '']];
  const [nameValue, setNameValue] = React.useState(initialEnvValues);
  const handleNameValuePairs = React.useCallback(
    ({ nameValuePairs }) => {
      const updatedNameValuePairs = _.compact(
        nameValuePairs.map(([name, value]) => (value.length ? { name, value } : null)),
      );
      setNameValue(nameValuePairs);
      setFieldValue(containerPaths.Env, updatedNameValuePairs);
    },
    [setFieldValue],
  );
  return (
    <FormSection title={title} extraMargin>
      <h3 className="co-section-heading-tertiary">Container</h3>
      <InputField
        data-test-id="container-image-field"
        type={TextInputTypes.text}
        name={containerPaths.Image}
        label="Image"
        helpText="The image to run inside of the container"
        required
        onChange={(e) => {
          setFieldValue(containerPaths.Name, getSuggestedName(e.target.value));
        }}
      />
      <InputField
        data-test-id="container-name-field"
        type={TextInputTypes.text}
        name={containerPaths.Name}
        label="Name"
        helpText="The name of the image"
      />
      <TextColumnField
        data-test-id="container-arg-field"
        name={containerPaths.Args}
        label="Arguments"
        addLabel="Add args"
        placeholder="argument"
        helpText="Arguments passed to the container"
        disableDeleteRow={args?.length === 1}
      />
      <FormGroup
        fieldId="containersource-env"
        label="Environment variables"
        helperText="The list of variables to set in the container"
      >
        <AsyncComponent
          loader={() =>
            import('@console/internal/components/utils/name-value-editor').then(
              (c) => c.NameValueEditor,
            )
          }
          data-test-id="container-env-field"
          nameValuePairs={nameValue}
          valueString="Value"
          nameString="Name"
          readOnly={false}
          allowSorting={false}
          updateParentData={handleNameValuePairs}
        />
      </FormGroup>
    </FormSection>
  );
};

export default ContainerSourceSection;
