import * as React from 'react';
import * as _ from 'lodash';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField, SelectInputField, SelectInputOption } from '@console/shared';
import { TextInputTypes } from '@patternfly/react-core';
import KafkaSourceNetSection from './KafkaSourceNetSection';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { getBootstrapServers } from '../../../utils/create-eventsources-utils';
import { strimziResourcesWatcher } from '../../../utils/get-knative-resources';
import { EventSources } from '../import-types';

interface KafkaSourceSectionProps {
  title: string;
}

const KafkaSourceSection: React.FC<KafkaSourceSectionProps> = ({ title }) => {
  const memoResources = React.useMemo(() => strimziResourcesWatcher(), []);
  const { kafkas, kafkatopics } = useK8sWatchResources<{
    [key: string]: K8sResourceKind[];
  }>(memoResources);

  const [bootstrapServers, bsPlaceholder] = React.useMemo(() => {
    let bootstrapServersOptions: SelectInputOption[] = [];
    let placeholder: React.ReactNode = '';
    if (kafkas.loaded && !kafkas.loadError) {
      bootstrapServersOptions = !_.isEmpty(kafkas.data)
        ? _.map(getBootstrapServers(kafkas.data), (bs) => ({
            value: bs,
            disabled: false,
          }))
        : [
            {
              value: 'No Bootstrap Servers found',
              disabled: true,
            },
          ];
      placeholder = 'Add Bootstrap Servers';
    } else if (kafkas.loadError) {
      placeholder = `${kafkas.loadError?.message}. Try adding Bootstrap Servers manually.`;
    } else {
      bootstrapServersOptions = [{ value: 'Loading Bootstrap Servers...', disabled: true }];
      placeholder = '...';
    }
    return [bootstrapServersOptions, placeholder];
  }, [kafkas.data, kafkas.loaded, kafkas.loadError]);

  const [kafkaTopics, ktPlaceholder] = React.useMemo(() => {
    let topicsOptions: SelectInputOption[] = [];
    let placeholder: React.ReactNode = '';
    if (kafkatopics.loaded && !kafkatopics.loadError) {
      topicsOptions = !_.isEmpty(kafkatopics.data)
        ? _.map(kafkatopics.data, (kt) => ({
            value: kt?.metadata.name,
            disabled: false,
          }))
        : [
            {
              value: 'No Topics found',
              disabled: true,
            },
          ];
      placeholder = 'Add Topics';
    } else if (kafkatopics.loadError) {
      placeholder = `${kafkatopics.loadError?.message}. Try adding Topics manually.`;
    } else {
      topicsOptions = [{ value: 'Loading Topics...', disabled: true }];
      placeholder = '...';
    }
    return [topicsOptions, placeholder];
  }, [kafkatopics.data, kafkatopics.loaded, kafkatopics.loadError]);

  return (
    <FormSection title={title} extraMargin>
      <SelectInputField
        data-test-id="kafkasource-bootstrapservers-field"
        name={`data.${EventSources.KafkaSource}.bootstrapServers`}
        label="Bootstrap Servers"
        options={bootstrapServers}
        placeholderText={bsPlaceholder}
        helpText="The address of the Kafka broker"
        isCreatable
        hasOnCreateOption
        required
      />
      <SelectInputField
        data-test-id="kafkasource-topics-field"
        name={`data.${EventSources.KafkaSource}.topics`}
        label="Topics"
        options={kafkaTopics}
        placeholderText={ktPlaceholder}
        helpText="Virtual groups across Kafka brokers"
        isCreatable
        hasOnCreateOption
        required
      />
      <InputField
        data-test-id="kafkasource-consumergroup-field"
        type={TextInputTypes.text}
        name={`data.${EventSources.KafkaSource}.consumerGroup`}
        label="Consumer Group"
        helpText="A group that tracks maximum offset consumed"
        required
      />
      <KafkaSourceNetSection />
    </FormSection>
  );
};

export default KafkaSourceSection;
