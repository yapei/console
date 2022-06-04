import * as React from 'react';
import { Checkbox, Skeleton } from '@patternfly/react-core';
import {
  UserPreferenceCheckboxField as CheckboxFieldType,
  UserPreferenceCheckboxFieldValue,
} from '@console/dynamic-plugin-sdk/src';
import { useTelemetry, useUserSettings } from '@console/shared';
import { UserPreferenceFieldProps } from './types';

type UserPreferenceCheckboxFieldProps = UserPreferenceFieldProps<CheckboxFieldType>;

const UserPreferenceCheckboxField: React.FC<UserPreferenceCheckboxFieldProps> = ({
  id,
  label,
  userSettingsKey,
  trueValue,
  falseValue,
  defaultValue,
}) => {
  // resources and calls to hooks
  const [
    currentUserPreferenceValue,
    setCurrentUserPreferenceValue,
    currentUserPreferenceValueLoaded,
  ] = useUserSettings<UserPreferenceCheckboxFieldValue>(userSettingsKey);
  const fireTelemetryEvent = useTelemetry();

  const loaded: boolean = currentUserPreferenceValueLoaded;

  if (defaultValue && loaded && !currentUserPreferenceValue) {
    setCurrentUserPreferenceValue(defaultValue);
  }

  // utils and callbacks
  const onChange = (checked: boolean) => {
    const checkedValue: UserPreferenceCheckboxFieldValue = checked ? trueValue : falseValue;
    checkedValue !== currentUserPreferenceValue && setCurrentUserPreferenceValue(checkedValue);
    fireTelemetryEvent('User Preference Changed', {
      property: userSettingsKey,
      value: checkedValue,
    });
  };

  return loaded ? (
    <Checkbox
      id={id}
      label={label}
      isChecked={currentUserPreferenceValue === trueValue}
      data-checked-state={currentUserPreferenceValue === trueValue}
      onChange={onChange}
      data-test={`checkbox ${id}`}
    />
  ) : (
    <Skeleton height="30px" width="100%" data-test={`dropdown skeleton ${id}`} />
  );
};
export default UserPreferenceCheckboxField;
