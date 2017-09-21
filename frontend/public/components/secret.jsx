import * as React from 'react';
import * as moment from 'moment';
import * as classNames from'classnames';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import ConfigMapAndSecretData from './configmap-and-secret-data';
import { Cog, Firehose, Heading, ResourceCog, ResourceLink, ResourceSummary, detailsPage, navFactory } from './utils';
import { registerTemplate } from '../yaml-templates';

registerTemplate('v1.Secret', `apiVersion: v1
kind: Secret
metadata:
  name: example
type: Opaque
data:
  username: YWRtaW4=
  password: MWYyZDFlMmU2N2Rm`);

const menuActions = Cog.factory.common;

const SecretHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Secret Name</ColHead>
  <ColHead {...props} className="col-xs-4" sortFunc="dataSize">Secret Data</ColHead>
  <ColHead {...props} className="col-xs-4" sortField="metadata.creationTimestamp">Secret Age</ColHead>
</ListHeader>;

const SecretRow = ({obj: secret}) => {
  const data = _.size(secret.data);
  const age = moment(secret.metadata.creationTimestamp).fromNow();

  return <ResourceRow obj={secret}>
    <div className="col-xs-4">
      <ResourceCog actions={menuActions} kind="Secret" resource={secret} />
      <ResourceLink kind="Secret" name={secret.metadata.name} namespace={secret.metadata.namespace} title={secret.metadata.uid} />
    </div>
    <div className="col-xs-4">{data}</div>
    <div className="col-xs-4">{age}</div>
  </ResourceRow>;
};

const SecretDetails = ({obj: secret}) => {
  return <div className="col-md-12">
    <div className="co-m-pane">
      <div className="co-m-pane__body">
        <ResourceSummary resource={secret} showPodSelector={false} showNodeSelector={false} />
      </div>

      <Heading text="Data" />
      <div className="co-m-pane__body">
        <ConfigMapAndSecretData data={secret.data} decode={window.atob} />
      </div>
    </div>
  </div>;
};

const withSecretsList = (Row) => {
  return class WithSecretsList extends React.Component {
    constructor (props) {
      super(props);
      this.state = {open: false};
      this.onClick_ = this.onClick_.bind(this);
    }

    onClick_ (e) {
      e.preventDefault();
      this.setState({open: !this.state.open});
    }

    render () {
      const {obj: {metadata: {namespace}, secrets}} = this.props;
      const filters = {selector: {field: 'metadata.name', values: new Set(_.map(secrets, 'name'))}};

      return (
        <div onClick={this.onClick_} className={classNames({clickable: !!secrets})} >
          <Row {...this.props} />
          {
            this.state.open && secrets &&
            <SecretsList namespace={namespace} filters={filters} />
          }
        </div>
      );
    }
  };
};

const SecretsList = props => <Firehose {...props} kind="Secret" isList={true}>
  <List {...props} Header={SecretHeader} Row={SecretRow} />
</Firehose>;

const SecretsPage = props => <ListPage ListComponent={SecretsList} canCreate={true} {...props} />;
const SecretsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(detailsPage(SecretDetails)), navFactory.editYaml()]}
/>;

export {SecretsList, SecretsPage, SecretsDetailsPage, withSecretsList};
