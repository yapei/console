import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Cog, Heading, LabelList, ResourceCog, ResourceIcon, detailsPage, EmptyBox, navFactory, ResourceLink, ResourceSummary } from './utils';
import { registerTemplate } from '../yaml-templates';

const menuActions = Cog.factory.common;

registerTemplate('v1beta1.Ingress', `apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: example
spec:
  rules:
  - http:
      paths:
      - path: /testpath
        backend:
          serviceName: test
          servicePort: 80`);

export const ingressValidHosts = ingress => _.chain(ingress).get('spec.rules').map('host').filter(_.isString).value();

const getHosts = (ingress) => {
  const hosts = ingressValidHosts(ingress);

  if (hosts.length) {
    return <div>{hosts.join(', ')}</div>;
  }

  return <div className="text-muted">No hosts</div>;
};

const getTLSCert = (ingress) => {
  if (!_.has(ingress.spec, 'tls')) {
    return <div><span>Not configured</span></div>;
  }

  const certs = _.map(ingress.spec.tls, 'secretName');

  return <div>
    <ResourceIcon kind="Secret" className="co-m-resource-icon--align-left" />
    <span>{certs.join(', ')}</span>
  </div>;
};

const IngressListHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-3" sortField="metadata.name">Ingress Name</ColHead>
  <ColHead {...props} className="col-xs-4" sortField="metadata.labels">Ingress Labels</ColHead>
  <ColHead {...props} className="col-xs-5" sortFunc="ingressValidHosts">Hosts</ColHead>
</ListHeader>;

const IngressListRow = ({obj: ingress}) => <ResourceRow obj={ingress}>
  <div className="col-xs-3">
    <ResourceCog actions={menuActions} kind="Ingress" resource={ingress} />
    <ResourceLink kind="Ingress" name={ingress.metadata.name}
      namespace={ingress.metadata.namespace} title={ingress.metadata.uid} />
  </div>
  <div className="col-xs-4">
    <LabelList kind="Ingress" labels={ingress.metadata.labels} />
  </div>
  <div className="col-xs-5">{getHosts(ingress)}</div>
</ResourceRow>;

const RulesHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-3">Host</div>
  <div className="col-xs-3">Path</div>
  <div className="col-xs-3">Service</div>
  <div className="col-xs-2">Service Port</div>
</div>;

const RulesRow = ({rule}) => {

  return <div className="row co-resource-list__item">
    <div className="col-xs-3">
      <div>{rule.host}</div>
    </div>
    <div className="col-xs-3">
      <div>{rule.path}</div>
    </div>
    <div className="col-xs-3">
      <div><ResourceIcon kind="Service" className="co-m-resource-icon--align-left" />{rule.serviceName}</div>
    </div>
    <div className="col-xs-2">
      <div>{rule.servicePort}</div>
    </div>
  </div>;
};

const RulesRows = (props) => {
  const rules = [];

  if (_.has(props.spec, 'rules')) {
    _.forEach(props.spec.rules, rule => {
      _.forEach(rule.http.paths, path => {
        rules.push({
          host: rule.host || '',
          path: path.path || '',
          serviceName: path.backend.serviceName,
          servicePort: path.backend.servicePort,
        });
      });
    });

    const rows = _.map(rules, rule => {
      return <RulesRow rule={rule} key={rule.serviceName} />;
    });

    return <div className="co-m-table-grid__body"> {rows} </div>;
  }

  return <EmptyBox label="Rule" />;
};

const Details = ({obj: ingress}) => <div className="col-md-12">
  <div className="co-m-pane">
    <div className="co-m-pane__body">
      <ResourceSummary resource={ingress} showPodSelector={false} showNodeSelector={false}>
        <dt>Tls Certificate</dt>
        <dd>{getTLSCert(ingress)}</dd>
      </ResourceSummary>
    </div>

    <Heading text="Ingress Rules" />
    <div className="co-m-pane__body">
      <div className="row co-m-form-row">
        <div className="col-md-12">
          These rules are handled by a routing layer (Ingress Controller) which is updated as the rules are modified. The Ingress controller implementation defines how headers and other metadata are forwarded or manipulated.
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
          <div className="co-m-table-grid co-m-table-grid--bordered">
            <RulesHeader />
            <RulesRows spec={ingress.spec} />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>;

const IngressesDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(detailsPage(Details)), navFactory.editYaml()]}
/>;
const IngressesList = props => <List {...props} Header={IngressListHeader} Row={IngressListRow} />;
const IngressesPage = props => <ListPage ListComponent={IngressesList} canCreate={true} {...props} />;

export {IngressesList, IngressesPage, IngressesDetailsPage};
