import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormikContext, FormikValues } from 'formik';
import { connectToFlags, FlagsObject } from '@console/internal/reducers/features';
import { Alert, Split, SplitItem } from '@patternfly/react-core';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { useAccessReview } from '@console/internal/components/utils';
import { TechPreviewBadge } from '@console/shared';
import { NormalizedBuilderImages } from '@console/dev-console/src/utils/imagestream-utils';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { PipelineModel, PipelineResourceModel } from '../../../models';
import { FLAG_OPENSHIFT_PIPELINE, CLUSTER_PIPELINE_NS } from '../../../const';
import PipelineTemplate from './PipelineTemplate';

type PipelineSectionProps = {
  flags: FlagsObject;
  builderImages: NormalizedBuilderImages;
};

const usePipelineAccessReview = (): boolean => {
  const canListPipelines = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    namespace: CLUSTER_PIPELINE_NS,
    verb: 'list',
  });

  const canCreatePipelines = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    namespace: getActiveNamespace(),
    verb: 'create',
  });

  const canCreatePipelineResource = useAccessReview({
    group: PipelineResourceModel.apiGroup,
    resource: PipelineResourceModel.plural,
    namespace: getActiveNamespace(),
    verb: 'create',
  });

  return canListPipelines && canCreatePipelines && canCreatePipelineResource;
};

const PipelineSection: React.FC<PipelineSectionProps> = ({ flags, builderImages }) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<FormikValues>();

  const hasCreatePipelineAccess = usePipelineAccessReview();

  if (flags[FLAG_OPENSHIFT_PIPELINE] && hasCreatePipelineAccess) {
    const title = (
      <Split hasGutter>
        <SplitItem className="odc-form-section__heading">
          {t('pipelines-plugin~Pipelines')}
        </SplitItem>
        <SplitItem>
          <TechPreviewBadge />
        </SplitItem>
      </Split>
    );
    return (
      <FormSection title={title}>
        {values.image.selected || values.build.strategy === 'Docker' ? (
          <PipelineTemplate builderImages={builderImages} />
        ) : (
          <Alert
            isInline
            variant="info"
            title={t(
              'pipelines-plugin~Select a builder image and resource to see if there is a pipeline template available for this runtime.',
            )}
          />
        )}
      </FormSection>
    );
  }

  return null;
};

export default connectToFlags<PipelineSectionProps>(FLAG_OPENSHIFT_PIPELINE)(PipelineSection);
