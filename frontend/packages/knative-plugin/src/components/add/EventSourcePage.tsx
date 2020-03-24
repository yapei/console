import * as React from 'react';
import { Helmet } from 'react-helmet';
import { PageHeading, Firehose } from '@console/internal/components/utils';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import EventSource from './EventSource';
import { knativeServingResourcesServices } from '../../utils/create-knative-utils';

const EventSourcePage: React.FC<any> = ({ match }) => {
  const namespace = match.params.ns;
  const resources = [
    { kind: 'Project', prop: 'projects', isList: true },
    ...knativeServingResourcesServices(namespace),
  ];
  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title> Event Sources</title>
      </Helmet>
      <PageHeading title="Event Sources" />
      <div />
      <div className="co-m-pane__body">
        <Firehose resources={resources}>
          <EventSource namespace={namespace} />
        </Firehose>
      </div>
    </NamespacedPage>
  );
};

export default EventSourcePage;
