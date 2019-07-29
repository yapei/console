import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { ResourceName } from '@console/internal/components/utils';
import { getPorts } from '@console/internal/components/source-to-image';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ImageStreamTagModel } from '@console/internal/models';
import { BuilderImage, getTagDataWithDisplayName } from '../../../utils/imagestream-utils';
import { DropdownField } from '../../formik-fields';
import { useSafeK8s } from '../../../utils/safe-k8s-hook';
import ImageStreamInfo from './ImageStreamInfo';

export interface BuilderImageTagSelectorProps {
  selectedBuilderImage: BuilderImage;
  selectedImageTag: string;
}

const BuilderImageTagSelector: React.FC<BuilderImageTagSelectorProps> = ({
  selectedBuilderImage,
  selectedImageTag,
}) => {
  const { setFieldValue, setFieldError } = useFormikContext<FormikValues>();
  const {
    name: imageName,
    tags: imageTags,
    displayName: imageDisplayName,
    imageStreamNamespace,
  } = selectedBuilderImage;

  const tagItems = {};
  _.each(
    imageTags,
    ({ name }) => (tagItems[name] = <ResourceName kind="ImageStreamTag" name={name} />),
  );

  const [imageTag, displayName] = getTagDataWithDisplayName(
    imageTags,
    selectedImageTag,
    imageDisplayName,
  );

  const k8sGet = useSafeK8s();

  React.useEffect(() => {
    setFieldValue('image.tagObj', imageTag);
    k8sGet(ImageStreamTagModel, `${imageName}:${selectedImageTag}`, imageStreamNamespace)
      .then((imageStreamTag: K8sResourceKind) => {
        const ports = getPorts(imageStreamTag);
        setFieldValue('image.ports', ports);
      })
      .catch((err) => setFieldError('image.ports', err.message));
  }, [
    selectedImageTag,
    setFieldValue,
    setFieldError,
    imageName,
    imageStreamNamespace,
    imageTag,
    k8sGet,
  ]);

  return (
    <React.Fragment>
      <DropdownField
        name="image.tag"
        label="Builder Image Version"
        items={tagItems}
        selectedKey={selectedImageTag}
        title={tagItems[selectedImageTag]}
        fullWidth
        required
      />
      {imageTag && <ImageStreamInfo displayName={displayName} tag={imageTag} />}
    </React.Fragment>
  );
};

export default BuilderImageTagSelector;
