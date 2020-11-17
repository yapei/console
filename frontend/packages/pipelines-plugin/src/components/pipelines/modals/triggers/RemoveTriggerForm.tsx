import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Split, SplitItem } from '@patternfly/react-core';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { Pipeline } from '../../../../utils/pipeline-augment';
import TriggerTemplateSelector from './TriggerTemplateSelector';

type RemoveTriggerFormProps = {
  pipeline: Pipeline;
};

const RemoveTriggerForm: React.FC<RemoveTriggerFormProps> = (props) => {
  const { t } = useTranslation();
  const { pipeline } = props;

  return (
    <Split className="odc-modal-content" hasGutter>
      <SplitItem>
        <ExclamationTriangleIcon size="md" color={warningColor.value} />
      </SplitItem>
      <SplitItem isFilled>
        <p className="co-break-word">
          <Trans t={t} ns="pipelines-plugin">
            Select the trigger to remove from pipeline <b>{pipeline.metadata.name}</b>.
          </Trans>
        </p>
        <TriggerTemplateSelector
          name="selectedTrigger"
          placeholder={t('pipelines-plugin~Select Trigger Template')}
          pipeline={pipeline}
        />
      </SplitItem>
    </Split>
  );
};

export default RemoveTriggerForm;
