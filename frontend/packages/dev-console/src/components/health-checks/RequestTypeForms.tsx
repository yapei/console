import * as React from 'react';
import * as _ from 'lodash';
import { FormikValues, useFormikContext } from 'formik';
import { TextInputTypes, FormGroup } from '@patternfly/react-core';
import { InputField, CheckboxField, getFieldId, TextColumnField } from '@console/shared';
import { NameValueEditor } from '@console/internal/components/utils/name-value-editor';
import { Resources } from '../import/import-types';
import { HealthCheckContext } from './health-checks-utils';

interface RequestTypeFormProps {
  probeType?: string;
}

export const renderPortField = (fieldName: string, resourceType: Resources, viewOnly: boolean) => {
  if (resourceType === Resources.KnativeService) {
    return (
      <InputField
        type={TextInputTypes.text}
        name="knative-port"
        label="Port"
        placeholder="0"
        isDisabled
      />
    );
  }
  return (
    <InputField
      type={TextInputTypes.text}
      name={fieldName}
      label="Port"
      isDisabled={viewOnly}
      required
    />
  );
};

export const HTTPRequestTypeForm: React.FC<RequestTypeFormProps> = ({ probeType }) => {
  const {
    values: { healthChecks, resources },
    setFieldValue,
  } = useFormikContext<FormikValues>();
  const { viewOnly } = React.useContext(HealthCheckContext);
  const httpHeaders = healthChecks?.[probeType]?.data?.httpGet?.httpHeaders;
  const initialNameValuePairs = !_.isEmpty(httpHeaders)
    ? httpHeaders.map((val) => _.values(val))
    : [['', '']];
  const [nameValue, setNameValue] = React.useState(initialNameValuePairs);
  const portFieldName = `healthChecks.${probeType}.data.httpGet.port`;

  const handleNameValuePairs = React.useCallback(
    ({ nameValuePairs }) => {
      const updatedNameValuePairs = _.compact(
        nameValuePairs.map(([name, value]) => {
          if (_.isObject(value)) {
            return { name, valueFrom: value };
          }
          if (value.length) {
            return { name, value };
          }
          return null;
        }),
      );
      setNameValue(nameValuePairs);
      setFieldValue(`healthChecks.${probeType}.data.httpGet.httpHeaders`, updatedNameValuePairs);
    },
    [setFieldValue, probeType],
  );
  return (
    <>
      <CheckboxField
        name={`healthChecks.${probeType}.data.httpGet.scheme`}
        label="Use HTTPS"
        value="HTTPS"
        isDisabled={viewOnly}
      />
      <FormGroup
        fieldId={getFieldId(`healthChecks.${probeType}.data.httpGet.httpHeaders`, 'name-value')}
        name={`healthChecks.${probeType}.data.httpGet.httpHeaders`}
        label="HTTP Headers"
      >
        <NameValueEditor
          nameValuePairs={nameValue}
          valueString="Value"
          nameString="Header Name"
          addString="Add Header"
          readOnly={viewOnly}
          allowSorting={false}
          updateParentData={handleNameValuePairs}
        />
      </FormGroup>
      <InputField
        type={TextInputTypes.text}
        name={`healthChecks.${probeType}.data.httpGet.path`}
        label="Path"
        placeholder="/"
        isDisabled={viewOnly}
      />
      {renderPortField(portFieldName, resources, viewOnly)}
    </>
  );
};

export const TCPRequestTypeForm: React.FC<RequestTypeFormProps> = ({ probeType }) => {
  const {
    values: { resources },
  } = useFormikContext<FormikValues>();
  const { viewOnly } = React.useContext(HealthCheckContext);
  const portFieldName = `healthChecks.${probeType}.data.tcpSocket.port`;
  return renderPortField(portFieldName, resources, viewOnly);
};

export const CommandRequestTypeForm: React.FC<RequestTypeFormProps> = ({ probeType }) => {
  const {
    values: { healthChecks },
  } = useFormikContext<FormikValues>();
  const { viewOnly } = React.useContext(HealthCheckContext);
  const commands = healthChecks?.[probeType]?.data?.exec?.command || [''];
  return (
    <TextColumnField
      name={`healthChecks.${probeType}.data.exec.command`}
      label="Command"
      addLabel="Add command"
      placeholder="argument"
      helpText="The command to run inside the container."
      required
      disableDeleteRow={commands.length === 1}
      isReadOnly={viewOnly}
    />
  );
};
