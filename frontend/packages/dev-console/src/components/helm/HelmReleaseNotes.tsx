import * as React from 'react';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { HelmRelease } from './helm-types';

export interface HelmReleaseNotesProps {
  customData: HelmRelease;
}

const HelmReleaseNotes: React.FC<HelmReleaseNotesProps> = ({ customData }) => {
  const helmReleaseNotes = customData?.info?.notes ?? '';
  return (
    <div className="co-m-pane__body">
      <SyncMarkdownView content={helmReleaseNotes} />
    </div>
  );
};

export default HelmReleaseNotes;
