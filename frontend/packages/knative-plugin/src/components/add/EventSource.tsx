import * as React from 'react';
import { Formik } from 'formik';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { history } from '@console/internal/components/utils';
import { getActiveApplication, getActivePerspective } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import {
  K8sResourceKind,
  modelFor,
  referenceFor,
  k8sCreate,
  getGroupVersionKind,
} from '@console/internal/module/k8s';
import { sanitizeApplicationValue } from '@console/dev-console/src/utils/application-utils';
import { isPerspective, Perspective, useExtensions } from '@console/plugin-sdk';
import { eventSourceValidationSchema } from './eventSource-validation-utils';
import EventSourceForm from './EventSourceForm';
import { getEventSourceResource, handleRedirect } from '../../utils/create-eventsources-utils';
import {
  EventSourceFormData,
  EventSourceListData,
  SinkType,
  EVENT_SOURCES_APP,
} from './import-types';

interface EventSourceProps {
  namespace: string;
  eventSourceStatus: EventSourceListData | null;
  contextSource?: string;
  selectedApplication?: string;
}

interface StateProps {
  activeApplication: string;
  perspective: string;
}

type Props = EventSourceProps & StateProps;

export const EventSource: React.FC<Props> = ({
  namespace,
  eventSourceStatus,
  activeApplication,
  contextSource,
  perspective,
}) => {
  const perpectiveExtension = useExtensions<Perspective>(isPerspective);
  const { t } = useTranslation();
  const [sinkGroupVersionKind = '', sinkName = ''] = contextSource?.split('/') ?? [];
  const [sinkGroup = '', sinkVersion = '', sinkKind = ''] =
    getGroupVersionKind(sinkGroupVersionKind) ?? [];
  const sinkKey = sinkName && sinkKind ? `${sinkKind}-${sinkName}` : '';
  const sinkApiVersion = sinkGroup ? `${sinkGroup}/${sinkVersion}` : '';
  const initialValues: EventSourceFormData = {
    project: {
      name: namespace || '',
      displayName: '',
      description: '',
    },
    application: {
      initial: sanitizeApplicationValue(activeApplication),
      name: sanitizeApplicationValue(activeApplication) || EVENT_SOURCES_APP,
      selectedKey: activeApplication,
    },
    name: '',
    apiVersion: '',
    sinkType: SinkType.Resource,
    sink: {
      apiVersion: sinkApiVersion,
      kind: sinkKind,
      name: sinkName,
      key: sinkKey,
      uri: '',
    },
    type: '',
    data: {},
    yamlData: '',
  };

  const createResources = (rawFormData: any): Promise<K8sResourceKind> => {
    const knEventSourceResource = getEventSourceResource(rawFormData);
    if (knEventSourceResource?.kind && modelFor(referenceFor(knEventSourceResource))) {
      return k8sCreate(modelFor(referenceFor(knEventSourceResource)), knEventSourceResource);
    }
    const errMessage =
      knEventSourceResource?.kind && knEventSourceResource?.apiVersion
        ? t('knative-plugin~No model registered for {{referenceForKnEventSource}}', {
            referenceForKnEventSource: referenceFor(knEventSourceResource),
          })
        : t('knative-plugin~Invalid YAML');
    return Promise.reject(new Error(errMessage));
  };

  const handleSubmit = (values, actions) => {
    const {
      project: { name: projectName },
    } = values;
    const eventSrcRequest: Promise<K8sResourceKind> = createResources(values);
    eventSrcRequest
      .then(() => {
        actions.setSubmitting(false);
        handleRedirect(projectName, perspective, perpectiveExtension);
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
      validateOnBlur={false}
      validateOnChange={false}
      validationSchema={eventSourceValidationSchema(t)}
    >
      {(formikProps) => (
        <EventSourceForm
          {...formikProps}
          namespace={namespace}
          eventSourceStatus={eventSourceStatus}
        />
      )}
    </Formik>
  );
};

const mapStateToProps = (state: RootState, ownProps: EventSourceProps): StateProps => {
  const perspective = getActivePerspective(state);
  const activeApplication = ownProps.selectedApplication || getActiveApplication(state);
  return {
    activeApplication: activeApplication !== ALL_APPLICATIONS_KEY ? activeApplication : '',
    perspective,
  };
};

export default connect(mapStateToProps)(EventSource);
