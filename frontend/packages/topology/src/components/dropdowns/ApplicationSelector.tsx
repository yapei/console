import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useFormikContext, FormikValues, useField } from 'formik';
import { FormGroup, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import { InputField, getFieldId, useFormikValidationFix } from '@console/shared';
import {
  CREATE_APPLICATION_KEY,
  CREATE_APPLICATION_LABEL,
  UNASSIGNED_KEY,
  UNASSIGNED_LABEL,
} from '../../const';
import { sanitizeApplicationValue } from '../../utils/application-utils';
import ApplicationDropdown from './ApplicationDropdown';

interface ApplicationSelectorProps {
  namespace?: string;
  noProjectsAvailable?: boolean;
  subPath?: string;
}

const ApplicationSelector: React.FC<ApplicationSelectorProps> = ({
  namespace,
  noProjectsAvailable,
  subPath,
}) => {
  const { t } = useTranslation();
  const [applicationsAvailable, setApplicationsAvailable] = React.useState(true);
  const availableApplications = React.useRef<string[]>([]);
  const projectsAvailable = !noProjectsAvailable;

  const [selectedKey, { touched, error }] = useField(
    subPath ? `${subPath}.application.selectedKey` : 'application.selectedKey',
  );
  const [nameField] = useField(subPath ? `${subPath}.application.name` : 'application.name');
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const [applicationExists, setApplicationExists] = React.useState<boolean>(false);
  const fieldId = getFieldId('application-name', 'dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  useFormikValidationFix(selectedKey.value);

  const onDropdownChange = (key: string, application: string) => {
    setFieldValue(selectedKey.name, key);
    setFieldTouched(selectedKey.name, true);
    setFieldValue(nameField.name, sanitizeApplicationValue(application, key));
    setFieldTouched(nameField.name, true);
    setApplicationExists(false);
  };

  const handleOnLoad = (applicationList: { [key: string]: string }) => {
    const noApplicationsAvailable = _.isEmpty(applicationList);
    setApplicationsAvailable(!noApplicationsAvailable);
    availableApplications.current = _.keys(applicationList);
    if (noApplicationsAvailable) {
      setFieldValue(selectedKey.name, '');
      setFieldValue(
        nameField.name,
        (selectedKey.value !== UNASSIGNED_KEY && nameField.value) ?? '',
      );
    }
  };

  const actionItems = [
    {
      actionTitle: CREATE_APPLICATION_LABEL,
      actionKey: CREATE_APPLICATION_KEY,
    },
    {
      actionTitle: UNASSIGNED_LABEL,
      actionKey: UNASSIGNED_KEY,
    },
  ];

  const handleAppChange = (event) => {
    setApplicationExists(availableApplications.current.includes(event.target.value));
  };

  const inputHelpText = applicationExists
    ? t('topology~Warning: the application grouping already exists.')
    : t('topology~A unique name given to the application grouping to label your resources.');

  return (
    <>
      {projectsAvailable && applicationsAvailable && (
        <FormGroup
          fieldId={fieldId}
          label={t('topology~Application')}
          helperTextInvalid={errorMessage}
          validated={isValid ? 'default' : 'error'}
          helperText={t(
            'topology~Select an application for your grouping or {{UNASSIGNED_LABEL}} to not use an application grouping.',
            { UNASSIGNED_LABEL },
          )}
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
          name={nameField.name}
          label={t('topology~Application Name')}
          data-test-id="application-form-app-input"
          helpText={inputHelpText}
          validated={applicationExists ? ValidatedOptions.warning : ValidatedOptions.default}
          onChange={handleAppChange}
        />
      )}
    </>
  );
};

export default ApplicationSelector;
