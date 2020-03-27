import * as React from 'react';
import { Formik } from 'formik';
import { connect } from 'react-redux';
import { history } from '@console/internal/components/utils';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import { K8sResourceKind, modelFor, referenceFor, k8sCreate } from '@console/internal/module/k8s';
import { FirehoseList } from '@console/dev-console/src/components/import/import-types';
import { eventSourceValidationSchema } from './eventSource-validation-utils';
import EventSourceForm from './EventSourceForm';
import { EventSources, EventSourceFormData } from './import-types';
import {
  getEventSourcesDepResource,
  getEventSourceData,
} from '../../utils/create-eventsources-utils';

interface EventSourceProps {
  namespace: string;
  projects?: FirehoseList;
}

interface StateProps {
  activeApplication: string;
}

type Props = EventSourceProps & StateProps;

const EventSource: React.FC<Props> = ({ namespace, projects, activeApplication }) => {
  const typeEventSource = EventSources.CronJobSource;
  const initialValues: EventSourceFormData = {
    project: {
      name: namespace || '',
      displayName: '',
      description: '',
    },
    application: {
      initial: activeApplication,
      name: activeApplication,
      selectedKey: activeApplication,
    },
    name: '',
    sink: {
      knativeService: '',
    },
    type: typeEventSource,
    data: {
      [typeEventSource.toLowerCase()]: getEventSourceData(typeEventSource.toLowerCase()),
    },
  };

  const createResources = (rawFormData: any): Promise<K8sResourceKind> => {
    const knEventSourceResource = getEventSourcesDepResource(rawFormData);
    return k8sCreate(modelFor(referenceFor(knEventSourceResource)), knEventSourceResource);
  };

  const handleSubmit = (values, actions) => {
    const {
      project: { name: projectName },
    } = values;
    const eventSrcRequest: Promise<K8sResourceKind> = createResources(values);
    eventSrcRequest
      .then(() => {
        actions.setSubmitting(false);
        history.push(`/topology/ns/${projectName}`);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={eventSourceValidationSchema}
    >
      {(props) => <EventSourceForm {...props} namespace={namespace} projects={projects} />}
    </Formik>
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  const activeApplication = getActiveApplication(state);
  return {
    activeApplication: activeApplication !== ALL_APPLICATIONS_KEY ? activeApplication : '',
  };
};

export default connect(mapStateToProps)(EventSource);
