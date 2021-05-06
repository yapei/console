import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormikValues, useFormikContext } from 'formik';
import { CheckboxField, InputField } from '@console/shared/src';
import ImageStream from '../../import/image-search/ImageStream';

const ContainerImageField: React.FC = () => {
  const { t } = useTranslation();
  const {
    values: {
      formData: { fromImageStreamTag },
    },
  } = useFormikContext<FormikValues>();
  return (
    <>
      <CheckboxField
        name="formData.fromImageStreamTag"
        label={t('devconsole~Deploy image from an image stream tag')}
      />
      {fromImageStreamTag ? (
        <ImageStream
          label={t('devconsole~Image stream tag')}
          formContextField="formData"
          required
        />
      ) : (
        <InputField
          name="formData.imageName"
          label={t('devconsole~Image Name')}
          helpText={t('devconsole~Container image name')}
          required
        />
      )}
    </>
  );
};

export default ContainerImageField;
