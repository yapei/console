import * as React from 'react';
import * as _ from 'lodash';
import { history } from '@console/internal/components/utils';
import { FormikProps } from 'formik';
import { Form, TextInputTypes } from '@patternfly/react-core';
import { InputField, TextAreaField, SwitchField, FormFooter } from '@console/shared/src';
import { AddBareMetalHostFormValues } from './types';

type AddBareMetalHostFormProps = FormikProps<AddBareMetalHostFormValues> & {
  isEditing: boolean;
  showUpdated: boolean;
};

const AddBareMetalHostForm: React.FC<AddBareMetalHostFormProps> = ({
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
  isEditing,
  showUpdated,
}) => (
  <Form onSubmit={handleSubmit}>
    <InputField
      type={TextInputTypes.text}
      data-test-id="add-baremetal-host-form-name-input"
      name="name"
      label="Name"
      placeholder="openshift-worker"
      helpText="Provide unique name for the new Bare Metal Host."
      required
      isDisabled={isEditing}
    />
    <TextAreaField
      data-test-id="add-baremetal-host-form-description-input"
      name="description"
      label="Description"
    />
    <InputField
      type={TextInputTypes.text}
      data-test-id="add-baremetal-host-form-bmc-address-input"
      name="BMCAddress"
      label="BMC Address"
      helpText="The URL for communicating with the BMC (Baseboard Management Controller) on the host, based on the provider being used."
      required
    />
    <InputField
      type={TextInputTypes.text}
      data-test-id="add-baremetal-host-form-username-input"
      name="username"
      label="BMC Username"
      required
    />
    <InputField
      type={TextInputTypes.password}
      data-test-id="add-baremetal-host-form-password-input"
      name="password"
      label="BMC Password"
      required
    />
    <InputField
      type={TextInputTypes.text}
      data-test-id="add-baremetal-host-form-boot-mac-address-input"
      name="bootMACAddress"
      label="Boot MAC Address"
      helpText="The MAC address of the NIC connected to the network that will be used to provision the host."
      required
    />
    {!isEditing && (
      <SwitchField
        name="online"
        data-test-id="add-baremetal-host-form-online-switch"
        label="Power host on after creation"
      />
    )}
    <FormFooter
      isSubmitting={isSubmitting}
      handleReset={showUpdated && handleReset}
      handleCancel={history.goBack}
      submitLabel={isEditing ? 'Save' : 'Create'}
      errorMessage={status && status.submitError}
      disableSubmit={isSubmitting || !dirty || !_.isEmpty(errors)}
      infoTitle={'Bare Metal Host has been updated'}
      infoMessage={'Click reload to see the recent changes'}
      showAlert={showUpdated}
    />
  </Form>
);

export default AddBareMetalHostForm;
