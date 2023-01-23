import * as React from 'react';
import { ValidatedOptions, AlertVariant } from '@patternfly/react-core';
import { Formik, FormikProps } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { GitProvider, ImportStrategy } from '@console/git-service/src';
import {
  history,
  AsyncComponent,
  StatusBox,
  resourcePathFromModel,
} from '@console/internal/components/utils';
import { DeploymentConfigModel, DeploymentModel, RouteModel } from '@console/internal/models';
import { RouteKind } from '@console/internal/module/k8s';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { ServiceModel as knSvcModel } from '@console/knative-plugin/src';
import { defaultRepositoryFormValues } from '@console/pipelines-plugin/src/components/repository/consts';
import { RepositoryModel } from '@console/pipelines-plugin/src/models';
import {
  ALL_APPLICATIONS_KEY,
  usePerspectives,
  usePostFormSubmitAction,
  useTelemetry,
} from '@console/shared';
import { useToast } from '@console/shared/src/components/toast';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import { sanitizeApplicationValue } from '@console/topology/src/utils/application-utils';
import { NormalizedBuilderImages, normalizeBuilderImages } from '../../utils/imagestream-utils';
import { getBaseInitialValues } from './form-initial-values';
import { createOrUpdateResources, getTelemetryImport, handleRedirect } from './import-submit-utils';
import {
  GitImportFormData,
  FirehoseList,
  ImportData,
  Resources,
  BaseFormData,
  ImportTypes,
} from './import-types';
import { validationSchema } from './import-validation-utils';
import { useUpdateKnScalingDefaultValues } from './serverless/useUpdateKnScalingDefaultValues';
import ImportToastContent from './toast/ImportToastContent';

export interface ImportFormProps {
  namespace: string;
  importData: ImportData;
  contextualSource?: string;
  imageStreams?: FirehoseList;
  projects?: {
    loaded: boolean;
    data: [];
  };
}

export interface StateProps {
  activeApplication: string;
}

const ImportForm: React.FC<ImportFormProps & StateProps> = ({
  namespace,
  imageStreams,
  importData,
  contextualSource,
  activeApplication,
  projects,
}) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const [perspective] = useActivePerspective();
  const perspectiveExtensions = usePerspectives();
  const postFormCallback = usePostFormSubmitAction();
  const toastContext = useToast();

  const initialBaseValues: BaseFormData = getBaseInitialValues(namespace, activeApplication);
  const initialValues: GitImportFormData = {
    ...initialBaseValues,
    application: {
      ...initialBaseValues.application,
      selectedKey:
        activeApplication === t('devconsole~No application group')
          ? UNASSIGNED_KEY
          : activeApplication,
      isInContext: !!sanitizeApplicationValue(activeApplication),
    },
    resourceTypesNotValid: contextualSource ? [Resources.KnativeService] : [],
    pipeline: {
      enabled: false,
    },
    git: {
      url: '',
      type: GitProvider.INVALID,
      ref: '',
      dir: '/',
      showGitType: false,
      secret: '',
      isUrlValidating: false,
      validated: ValidatedOptions.default,
    },
    docker: {
      dockerfilePath: '',
      dockerfileHasError: true,
    },
    devfile: {
      devfilePath: '',
      devfileHasError: false,
    },
    pac: {
      pacHasError: false,
      repository: {
        ...defaultRepositoryFormValues,
      },
    },
    build: {
      ...initialBaseValues.build,
      triggers: {
        webhook: true,
        image: true,
        config: true,
      },
      strategy: importData.buildStrategy || 'Devfile',
    },
    import: {
      loaded: false,
      loadError: null,
      strategies: [],
      selectedStrategy: {
        name: 'Builder Image',
        type: ImportStrategy.S2I,
        priority: 0,
        detectedFiles: [],
      },
      recommendedStrategy: null,
      showEditImportStrategy: importData.type !== ImportTypes.git,
      strategyChanged: false,
    },
  };

  const initialVals = useUpdateKnScalingDefaultValues(initialValues);
  const builderImages: NormalizedBuilderImages =
    imageStreams && imageStreams.loaded && normalizeBuilderImages(imageStreams.data);

  const handleSubmit = (values, actions) => {
    const imageStream = builderImages && builderImages[values.image.selected]?.obj;
    const createNewProject = projects.loaded && _.isEmpty(projects.data);
    const {
      project: { name: projectName },
      import: { selectedStrategy },
    } = values;

    const resourceActions = createOrUpdateResources(
      t,
      values,
      imageStream,
      createNewProject,
      true,
    ).then(() => createOrUpdateResources(t, values, imageStream));

    resourceActions
      .then((resources) => {
        postFormCallback(resources);
      })
      .catch(() => {});

    return resourceActions
      .then((resources) => {
        const deployedResources = resources.filter(
          (resource) =>
            resource.kind === DeploymentModel.kind ||
            resource.kind === DeploymentConfigModel.kind ||
            (resource.kind === knSvcModel.kind &&
              resource.apiVersion === `${knSvcModel.apiGroup}/${knSvcModel.apiVersion}`),
        );
        const route = resources.find((resource) => resource.kind === RouteModel.kind) as RouteKind;
        if (deployedResources.length > 0) {
          toastContext.addToast({
            variant: AlertVariant.info,
            title:
              deployedResources.length > 1
                ? t('devconsole~Resources added')
                : t('devconsole~Resource added'),
            content: <ImportToastContent deployedResources={deployedResources} route={route} />,
            timeout: true,
            dismissible: true,
          });
        }

        fireTelemetryEvent('Git Import', getTelemetryImport(values));

        if (selectedStrategy.type === ImportStrategy.PAC)
          history.push(resourcePathFromModel(RepositoryModel, values.name, namespace));
        else handleRedirect(projectName, perspective, perspectiveExtensions);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('Error while submitting import form:', err);
        actions.setStatus({ submitError: err.message });
      });
  };

  const renderForm = (formikProps: FormikProps<any>) => {
    return (
      <AsyncComponent
        {...formikProps}
        projects={projects}
        builderImages={builderImages}
        loader={importData.loader}
      />
    );
  };

  return (
    <StatusBox
      data={imageStreams?.data}
      loaded={imageStreams?.loaded}
      loadError={imageStreams?.loadError}
    >
      <Formik
        initialValues={initialVals}
        onSubmit={handleSubmit}
        onReset={history.goBack}
        validationSchema={validationSchema(t)}
      >
        {renderForm}
      </Formik>
    </StatusBox>
  );
};

type OwnProps = ImportFormProps & { forApplication?: string };
const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const activeApplication = ownProps.forApplication || getActiveApplication(state);
  return {
    activeApplication: activeApplication !== ALL_APPLICATIONS_KEY ? activeApplication : '',
  };
};

export default connect(mapStateToProps)(ImportForm);
