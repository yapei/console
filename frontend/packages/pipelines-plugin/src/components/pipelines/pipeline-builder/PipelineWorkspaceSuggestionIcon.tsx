import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Popover } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';

import './PipelineWorkspaceSuggestionIcon.scss';

const PipelineWorkspaceSuggestionIcon: React.FC = () => {
  const { t } = useTranslation();

  const content = t(
    "pipelines-plugin~Resources aren't in beta, so it is recommended to use workspaces instead.",
  );

  return (
    <Popover aria-label={content} bodyContent={content}>
      <OutlinedQuestionCircleIcon className="opp-pipeline-workspace-suggestion-icon" />
    </Popover>
  );
};

export default PipelineWorkspaceSuggestionIcon;
