import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as cx from 'classnames';
import { ActionGroup, Alert, Button, ButtonVariant } from '@patternfly/react-core';
import { ButtonBar } from '@console/internal/components/utils';
import { FormFooterProps } from './form-utils-types';
import './FormFooter.scss';

const FormFooter: React.FC<FormFooterProps> = ({
  handleSubmit,
  handleReset,
  handleCancel,
  submitLabel,
  resetLabel,
  cancelLabel,
  infoTitle,
  infoMessage,
  isSubmitting,
  errorMessage,
  successMessage,
  disableSubmit,
  hideSubmit = false,
  showAlert,
  sticky,
}) => {
  const { t } = useTranslation();
  return (
    <ButtonBar
      className={cx('ocs-form-footer', {
        'ocs-form-footer__sticky': sticky,
      })}
      inProgress={isSubmitting}
      errorMessage={errorMessage}
      successMessage={successMessage}
    >
      {showAlert && (
        <Alert
          isInline
          className="co-alert"
          variant="info"
          title={infoTitle || t('console-shared~You made changes to this page.')}
        >
          {infoMessage ||
            t('console-shared~Click {{submit}} to save changes or {{reset}} to cancel changes.', {
              submit: submitLabel,
              reset: resetLabel,
            })}
        </Alert>
      )}
      <ActionGroup className="pf-c-form pf-c-form__group--no-top-margin">
        {!hideSubmit && (
          <Button
            type={handleSubmit ? 'button' : 'submit'}
            {...(handleSubmit && { onClick: handleSubmit })}
            variant={ButtonVariant.primary}
            isDisabled={disableSubmit}
            data-test-id="submit-button"
          >
            {submitLabel || t('console-shared~Save')}
          </Button>
        )}
        {handleReset && (
          <Button
            type="button"
            data-test-id="reset-button"
            variant={ButtonVariant.secondary}
            onClick={handleReset}
          >
            {resetLabel || t('console-shared~Reload')}
          </Button>
        )}
        {handleCancel && (
          <Button
            type="button"
            data-test-id="cancel-button"
            variant={ButtonVariant.secondary}
            onClick={handleCancel}
          >
            {cancelLabel || t('console-shared~Cancel')}
          </Button>
        )}
      </ActionGroup>
    </ButtonBar>
  );
};
export default FormFooter;
