import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip, Flex, FlexItem, Button } from '@patternfly/react-core';
import { CloseIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';
import Drawer from '@console/shared/src/components/drawer/Drawer';
import MinimizeRestoreButton from './MinimizeRestoreButton';

import './CloudShellDrawer.scss';

type CloudShellDrawerProps = {
  onClose: () => void;
};

const getMastheadHeight = (): number => {
  const masthead = document.getElementById('page-main-header');
  if (!masthead) return 0;
  const { height } = masthead.getBoundingClientRect();
  return height;
};

const CloudShellDrawer: React.FC<CloudShellDrawerProps> = ({ children, onClose }) => {
  const [expanded, setExpanded] = React.useState<boolean>(true);
  const { t } = useTranslation();
  const onMRButtonClick = (expandedState: boolean) => {
    setExpanded(!expandedState);
  };
  const handleChange = (openState: boolean) => {
    setExpanded(openState);
  };
  const header = (
    <Flex style={{ flexGrow: 1 }}>
      <FlexItem className="co-cloud-shell-drawer__heading">
        {t('cloudshell~Command line terminal')}
      </FlexItem>
      <FlexItem align={{ default: 'alignRight' }}>
        <Tooltip content={t('cloudshell~Open terminal in new tab')}>
          <Button
            variant="plain"
            component="a"
            href="/terminal"
            target="_blank"
            aria-label={t('cloudshell~Open terminal in new tab')}
          >
            <ExternalLinkAltIcon />
          </Button>
        </Tooltip>
        <MinimizeRestoreButton
          minimize={expanded}
          minimizeText={t('cloudshell~Minimize terminal')}
          restoreText={t('cloudshell~Restore terminal')}
          onClick={onMRButtonClick}
        />
        <Tooltip content={t('cloudshell~Close terminal')}>
          <Button
            variant="plain"
            data-test-id="cloudshell-terminal-close"
            type="button"
            onClick={onClose}
            aria-label={t('cloudshell~Close terminal')}
          >
            <CloseIcon />
          </Button>
        </Tooltip>
      </FlexItem>
    </Flex>
  );
  return (
    <Drawer
      open={expanded}
      defaultHeight={365}
      header={header}
      maxHeight={`calc(100vh - ${getMastheadHeight()}px)`}
      onChange={handleChange}
      resizable
    >
      {children}
    </Drawer>
  );
};

export default CloudShellDrawer;
