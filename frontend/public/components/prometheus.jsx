import React from 'react';

import { k8sKinds } from '../module/k8s';
import { SafetyFirst } from './safety-first';
import { configureReplicaCountModal } from './modals';
import { ColHead, List, ListHeader, ListPage, ResourceRow, DetailsPage } from './factory';
import { Cog, LabelList, navFactory, ResourceCog, ResourceLink, Selector, pluralize, LoadingInline } from './utils';
import { registerTemplate } from '../yaml-templates';
import { ServiceMonitorsPage } from './service-monitor';

registerTemplate('v1alpha1.Prometheus', `apiVersion: monitoring.coreos.com/v1alpha1
kind: Prometheus
metadata:
  name: k8s
  labels:
    prometheus: k8s
spec:
  replicas: 2
  version: v1.7.0
  serviceAccountName: prometheus-k8s
  serviceMonitorSelector:
    matchExpressions:
    - {key: k8s-app, operator: Exists}
  ruleSelector:
    matchLabels:
      role: prometheus-rulefiles
      prometheus: k8s
  resources:
    requests:
      # 2Gi is default, but won't schedule if you don't have a node with >2Gi
      # memory. Modify based on your target and time-series count for
      # production use. This value is mainly meant for demonstration/testing
      # purposes.
      memory: 400Mi
  alerting:
    alertmanagers:
    - namespace: monitoring
      name: alertmanager-main
      port: web`);

const {Edit, Delete, ModifyCount} = Cog.factory;
const menuActions = [ModifyCount, Edit, Delete];

const PrometheusRow = ({obj: instance}) => {
  const {metadata, spec} = instance;
  const kind = 'Prometheus';

  return <ResourceRow obj={instance}>
    <div className="col-md-3 col-sm-3 col-xs-6">
      <ResourceCog actions={menuActions} kind={kind} resource={instance} />
      <ResourceLink kind={kind} name={metadata.name} namespace={metadata.namespace} title={metadata.uid} />
    </div>
    <div className="col-md-4 col-sm-5 hidden-xs">
      <LabelList kind={kind} labels={metadata.labels} />
    </div>
    <div className="col-md-2 hidden-sm hidden-xs">{spec.version}</div>
    <div className="col-md-3 col-sm-4 col-xs-6">
      <Selector selector={spec.serviceMonitorSelector} kind="ServiceMonitor"/>
    </div>
  </ResourceRow>;
};

const PrometheusHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-3 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-4 col-sm-5 hidden-xs" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortField="spec.version">Version</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="spec.serviceMonitorSelector">
    Service Monitor Selector
  </ColHead>
</ListHeader>;

class InstanceDetails extends SafetyFirst {
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
      resourceKind: k8sKinds.Prometheus,
      resource: this.props,
      invalidateState: (isInvalid) => {
        this.setState({
          desiredCountOutdated: isInvalid
        });
      }
    });
  }

  render() {
    const instance = this.props;
    const {metadata, spec} = instance;
    return <div>
      <div className="co-m-pane__body">
        <div className="co-m-pane__body-section--bordered">
          <h1 className="co-section-title">Prometheus Instance Overview</h1>

          <div className="row no-gutter">
            <div className="col-sm-12 col-xs-12">
              <div className="row">
                <div className="col-sm-6 col-xs-12">
                  <dl>
                    <dt>Name</dt>
                    <dd>{metadata.name}</dd>
                    <dt>Labels</dt>
                    <dd><LabelList kind="Prometheus" labels={metadata.labels} /></dd>
                    <dt>Service Monitor Selector</dt>
                    <dd><Selector selector={spec.serviceMonitorSelector}  kind="ServiceMonitor" /></dd>
                    <dt>Rule Config Map Selector</dt>
                    <dd><Selector selector={spec.ruleSelector} kind="ConfigMap" /></dd>
                  </dl>
                </div>
                <div className="col-sm-6 col-xs-12">
                  <dl>
                    <dt>Version</dt>
                    <dd>{spec.version}</dd>
                    <dt>Replicas</dt>
                    <dd>{this.state.desiredCountOutdated ? <LoadingInline /> : <a className="co-m-modal-link" href="#"
                      onClick={this._openReplicaCountModal}>{pluralize(spec.replicas, 'pod')}</a>}</dd>
                    <dt>Service Account Name</dt>
                    <dd><ResourceLink kind="ServiceAccount" name={spec.serviceAccountName} namespace={metadata.namespace} /></dd>
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

const {details, editYaml, serviceMonitors} = navFactory;
export const PrometheusInstancesDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[
    details(InstanceDetails),
    editYaml(),
    serviceMonitors(({spec: {serviceMonitorSelector}, metadata: {namespace}}) => <ServiceMonitorsPage
      namespace={namespace}
      selector={_.isEmpty(serviceMonitorSelector) ? { matchExpressions:[{ key:'undefined', operator:'Exists' }]} : serviceMonitorSelector}/>)
  ]}
/>;

export const PrometheusInstancesList = props => <List {...props} Header={PrometheusHeader} Row={PrometheusRow} />;
export const PrometheusInstancesPage = props => <ListPage ListComponent={PrometheusInstancesList} canCreate={true} {...props} />;
