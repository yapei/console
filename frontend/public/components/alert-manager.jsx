import * as React from 'react';

import { k8sKinds } from '../module/k8s';
import { SafetyFirst } from './safety-first';
import { ColHead, List, ListHeader, ListPage, ResourceRow, DetailsPage } from './factory';
import { LabelList, navFactory, ResourceLink, Selector, Firehose, LoadingInline, pluralize } from './utils';
import { SettingsRow, SettingsLabel, SettingsContent } from './cluster-settings/cluster-settings';
import { configureReplicaCountModal } from './modals';

class Details extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      desiredCountOutdated: false
    };
    this._openReplicaCountModal = this._openReplicaCountModal.bind(this);
  }

  componentWillReceiveProps() {
    this.setState({
      desiredCountOutdated: false
    });
  }

  _openReplicaCountModal(event) {
    event.preventDefault();
    event.target.blur();
    configureReplicaCountModal({
      resourceKind: k8sKinds.Alertmanager,
      resource: this.props.obj,
      invalidateState: (isInvalid) => {
        this.setState({
          desiredCountOutdated: isInvalid
        });
      }
    });
  }

  render() {
    const alertManager = this.props.obj;
    const {metadata, spec} = alertManager;
    return <div>
      <div className="co-m-pane__body">
        <div className="co-m-pane__body-section--bordered">
          <h1 className="co-section-title">Alert Manager Overview</h1>

          <div className="row no-gutter">
            <div className="col-sm-12 col-xs-12">
              <div className="row">
                <div className="col-sm-6 col-xs-12">
                  <dl>
                    <dt>Name</dt>
                    <dd>{metadata.name}</dd>
                    <dt>Labels</dt>
                    <dd><LabelList kind="Alertmanager" labels={metadata.labels} /></dd>
                    {spec.nodeSelector && <dt>Alert Manager Node Selector</dt>}
                    {spec.nodeSelector && <dd><Selector selector={spec.nodeSelector} kind="Node" /></dd>}
                  </dl>
                </div>
                <div className="col-sm-6 col-xs-12">
                  <dl>
                    <dt>Version</dt>
                    <dd>{spec.version}</dd>
                    <dt>Replicas</dt>
                    <dd>{this.state.desiredCountOutdated ? <LoadingInline /> : <a className="co-m-modal-link" href="#"
                      onClick={this._openReplicaCountModal}>{pluralize(spec.replicas, 'pod')}</a>}</dd>
                    <dt>Resource Request</dt>
                    <dd><span className="text-muted">Memory:</span> {spec.resources.requests.memory}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>;
  }
}

const {details, editYaml} = navFactory;

export const AlertManagersDetailsPage = props => <DetailsPage
  {...props}
  pages={[
    details(Details),
    editYaml(),
  ]}
/>;

const AlertManagersNameList = (props) => {
  if (props.loadError) {
    return null;
  }
  return <div className="alert-manager-wrapper">
    <SettingsRow>
      <SettingsLabel>AlertManager:</SettingsLabel>
      <SettingsContent>
        <div className="alert-manager-list">
          {props.loaded ? _.map(props.alertmanagers.data, (alertManager, i) => <div className="alert-manager-row" key={i}><ResourceLink kind="Alertmanager" name={alertManager.metadata.name} namespace={alertManager.metadata.namespace} title={alertManager.metadata.uid}/></div>) : <LoadingInline />}
        </div>
      </SettingsContent>
    </SettingsRow>
  </div>;
};


export const AlertManagersListContainer = props => <Firehose resources={[{
  kind: 'Alertmanager',
  isList: true,
  prop: 'alertmanagers',
}]}>
  <AlertManagersNameList {...props} />
</Firehose>;

const AlertManagerRow = ({obj: alertManager}) => {
  const {metadata, spec} = alertManager;
  const kind = 'Alertmanager';

  return <ResourceRow obj={alertManager}>
    <div className="col-md-3 col-sm-3 col-xs-6">
      <ResourceLink kind={kind} name={metadata.name} namespace={metadata.namespace} title={metadata.uid} />
    </div>
    <div className="col-md-4 col-sm-5 hidden-xs">
      <LabelList kind={kind} labels={metadata.labels} />
    </div>
    <div className="col-md-2 hidden-sm hidden-xs">{spec.version}</div>
    <div className="col-md-3 col-sm-4 col-xs-6">
      <Selector selector={spec.nodeSelector} kind="Node" />
    </div>
  </ResourceRow>;
};

const AlertManagerHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-3 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-4 col-sm-5 hidden-xs" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortField="spec.version">Version</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="spec.nodeSelector">
    Node Selector
  </ColHead>
</ListHeader>;

export const AlertManagersList = props => <List {...props} Header={AlertManagerHeader} Row={AlertManagerRow} />;
export const AlertManagersPage = props => <ListPage {...props} ListComponent={AlertManagersList} canCreate={false} {...props} />;
