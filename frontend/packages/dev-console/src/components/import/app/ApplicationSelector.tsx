import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues, useField } from 'formik';
import { FormGroup, TextInputTypes } from '@patternfly/react-core';
import { InputField, getFieldId } from '@console/shared';
import { CREATE_APPLICATION_KEY, UNASSIGNED_KEY } from '../../../const';
import { sanitizeApplicationValue } from '../../../utils/application-utils';
import ApplicationDropdown from '../../dropdown/ApplicationDropdown';

export interface ApplicationSelectorProps {
  namespace?: string;
  noProjectsAvailable?: boolean;
}

const ApplicationSelector: React.FC<ApplicationSelectorProps> = ({
  namespace,
  noProjectsAvailable,
}) => {
  const [applicationsAvailable, setApplicationsAvailable] = React.useState(true);
  const projectsAvailable = !noProjectsAvailable;

  const [selectedKey, { touched, error }] = useField('application.selectedKey');
  const { setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const fieldId = getFieldId('application-name', 'dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  const onDropdownChange = (key: string, application: string) => {
    setFieldTouched('application.selectedKey', true);
    setFieldValue('application.name', sanitizeApplicationValue(application, key));
    setFieldValue('application.selectedKey', key);
    validateForm();
  };

  const handleOnLoad = (applicationList: { [key: string]: string }) => {
    const noApplicationsAvailable = _.isEmpty(applicationList);
    setApplicationsAvailable(!noApplicationsAvailable);
    if (noApplicationsAvailable) {
      setFieldValue('application.selectedKey', '');
      setFieldValue('application.name', '');
    }
  };

  const actionItems = [
    {
      actionTitle: 'Create Application',
      actionKey: CREATE_APPLICATION_KEY,
    },
    {
      actionTitle: 'Unassigned',
      actionKey: UNASSIGNED_KEY,
    },
  ];

  return (
    <>
      {projectsAvailable && applicationsAvailable && (
        <FormGroup
          fieldId={fieldId}
          label="Application"
          helperTextInvalid={errorMessage}
          isValid={isValid}
          helperText="Select an application for your grouping or Unassigned to not use an application grouping."
        >
          <ApplicationDropdown
            dropDownClassName="dropdown--full-width"
            menuClassName="dropdown-menu--text-wrap"
            id={fieldId}
            namespace={namespace}
            actionItems={actionItems}
            autoSelect
            selectedKey={selectedKey.value}
            onChange={onDropdownChange}
            onLoad={handleOnLoad}
          />
        </FormGroup>
      )}
      {(!applicationsAvailable || selectedKey.value === CREATE_APPLICATION_KEY) && (
        <InputField
          type={TextInputTypes.text}
          required={selectedKey.value === CREATE_APPLICATION_KEY}
          name="application.name"
          label="Application Name"
          data-test-id="application-form-app-input"
          helpText="A unique name given to the application grouping to label your resources."
        />
      )}
    </>
  );
};

export default ApplicationSelector;
