import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import AppSection from '@console/dev-console/src/components/import/app/AppSection';
import { FirehoseList } from '@console/dev-console/src/components/import/import-types';
import CronJobSection from './CronJobSection';
import SinkBindingSection from './SinkBindingSection';
import ApiServerSection from './ApiServerSection';
import ContainerSourceSection from './ContainerSourceSection';
import PingSourceSection from './PingSourceSection';
import KafkaSourceSection from './KafkaSourceSection';
import YAMLEditorSection from './YAMLEditorSection';
import { EventSources } from '../import-types';
import SinkSection from './SinkSection';
import AdvancedSection from '../AdvancedSection';
import { isKnownEventSource } from '../../../utils/create-eventsources-utils';

interface EventSourceSectionProps {
  projects: FirehoseList;
  namespace: string;
}

const EventSourceSection: React.FC<EventSourceSectionProps> = ({ projects, namespace }) => {
  const { values } = useFormikContext<FormikValues>();

  if (!values.type) {
    return null;
  }

  let EventSource: React.ReactElement;
  switch (values.type) {
    case EventSources.CronJobSource:
      EventSource = <CronJobSection />;
      break;
    case EventSources.SinkBinding:
      EventSource = <SinkBindingSection />;
      break;
    case EventSources.ApiServerSource:
      EventSource = <ApiServerSection />;
      break;
    case EventSources.KafkaSource:
      EventSource = <KafkaSourceSection />;
      break;
    case EventSources.ContainerSource:
      EventSource = <ContainerSourceSection />;
      break;
    case EventSources.PingSource:
      EventSource = <PingSourceSection />;
      break;
    default:
      EventSource = <YAMLEditorSection />;
  }
  return (
    <>
      {EventSource}
      {isKnownEventSource(values.type) && (
        <>
          <SinkSection namespace={namespace} />
          <AppSection
            project={values.project}
            noProjectsAvailable={projects?.loaded && _.isEmpty(projects.data)}
            extraMargin
          />
        </>
      )}
      {values.type === EventSources.KafkaSource && <AdvancedSection />}
    </>
  );
};

export default EventSourceSection;
