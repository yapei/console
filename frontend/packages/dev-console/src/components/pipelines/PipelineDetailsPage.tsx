import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { viewYamlComponent } from '@console/internal/components//utils/horizontal-nav';
import { k8sGet, k8sList } from '@console/internal/module/k8s';
import { DevPreviewBadge } from '@console/shared';
import { ErrorPage404 } from '@console/internal/components/error';
import {
  rerunPipeline,
  startPipeline,
  handlePipelineRunSubmit,
} from '../../utils/pipeline-actions';
import { getLatestRun } from '../../utils/pipeline-augment';
import { PipelineRunModel, PipelineModel } from '../../models';
import PipelineDetails from './PipelineDetails';
import PipelineResources from './PipelineResources';
import PipelineParameters from './PipelineParameters';
import PipelineRuns from './PipelineRuns';
import PipelineForm from './pipeline-form/PipelineForm';

interface PipelineDetailsPageStates {
  menuActions: Function[];
  errorCode?: number;
}

class PipelineDetailsPage extends React.Component<DetailsPageProps, PipelineDetailsPageStates> {
  constructor(props) {
    super(props);
    this.state = { menuActions: [], errorCode: null };
  }

  componentDidMount() {
    k8sGet(PipelineModel, this.props.name, this.props.namespace)
      .then((res) => {
        // eslint-disable-next-line promise/no-nesting
        k8sList(PipelineRunModel, {
          labelSelector: { 'tekton.dev/pipeline': res.metadata.name },
        })
          .then((listres) => {
            this.setState({
              menuActions: [
                startPipeline(res, handlePipelineRunSubmit),
                rerunPipeline(
                  res,
                  getLatestRun({ data: listres }, 'creationTimestamp'),
                  handlePipelineRunSubmit,
                ),
                Kebab.factory.Delete,
              ],
            });
          })
          .catch((error) => this.setState({ errorCode: error.response.status }));
      })
      .catch((error) => this.setState({ errorCode: error.response.status }));
  }

  render() {
    if (this.state.errorCode === 404) {
      return <ErrorPage404 />;
    }
    return (
      <DetailsPage
        {...this.props}
        menuActions={this.state.menuActions}
        pages={[
          navFactory.details(PipelineDetails),
          navFactory.editYaml(viewYamlComponent),
          {
            href: 'Runs',
            name: 'Pipeline Runs',
            component: PipelineRuns,
          },
          {
            href: 'parameters',
            name: 'Parameters',
            component: (props) => (
              <PipelineForm
                PipelineFormComponent={PipelineParameters}
                formName="parameters"
                {...props}
              />
            ),
          },
          {
            href: 'resources',
            name: 'Resources',
            component: (props) => (
              <PipelineForm
                PipelineFormComponent={PipelineResources}
                formName="resources"
                {...props}
              />
            ),
          },
        ]}
        badge={<DevPreviewBadge />}
      />
    );
  }
}

export default PipelineDetailsPage;
