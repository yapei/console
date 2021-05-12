import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FormikProps, FormikValues } from 'formik';
import { Alert, TextInputTypes } from '@patternfly/react-core';
import { InputField, FormFooter, FormBody } from '@console/shared';
import { DevfileImportFormProps } from '../import-types';
import GitSection from '../git/GitSection';
import AppSection from '../app/AppSection';
import {
  useDevfileServer,
  useDevfileDirectoryWatcher,
  useDevfileSource,
  useSelectedDevfileSample,
} from './devfileHooks';
import FormSection from '../section/FormSection';
import DevfileSampleInfo from './DevfileSampleInfo';

const DevfileImportForm: React.FC<FormikProps<FormikValues> & DevfileImportFormProps> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  status,
  builderImages,
  isSubmitting,
  dirty,
  projects,
  setFieldValue,
}) => {
  const { t } = useTranslation();
  const [, devfileParseError] = useDevfileServer(values, setFieldValue);
  const searchParams = new URLSearchParams(window.location.search);
  const gitRepoUrl = searchParams.get('gitRepo');
  const formType = searchParams.get('formType');
  useDevfileDirectoryWatcher(values, setFieldValue);
  useDevfileSource();
  const selectedSample = useSelectedDevfileSample();

  return (
    <form onSubmit={handleSubmit} data-test-id="import-devfile-form">
      <FormBody>
        {devfileParseError && (
          <Alert isInline variant="danger" title={t('devconsole~Import is not possible.')}>
            {devfileParseError}
          </Alert>
        )}
        <FormSection>
          {formType === 'sample' ? (
            <InputField
              type={TextInputTypes.text}
              name="git.url"
              label={t('devconsole~Git repo URL')}
              data-test-id="git-form-input-url"
              isDisabled
            />
          ) : (
            <GitSection
              buildStrategy="Devfile"
              builderImages={builderImages}
              defaultSample={{
                url: gitRepoUrl || 'https://github.com/redhat-developer/devfile-sample',
              }}
            />
          )}
          {selectedSample && <DevfileSampleInfo devfileSample={selectedSample} />}
        </FormSection>
        <AppSection
          project={values.project}
          noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
        />
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('devconsole~Create')}
        sticky
        disableSubmit={!dirty || !_.isEmpty(errors) || isSubmitting}
        resetLabel={t('devconsole~Cancel')}
      />
    </form>
  );
};

export default DevfileImportForm;
