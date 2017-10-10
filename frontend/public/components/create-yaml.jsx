import * as React from 'react';

import { safeLoad } from 'js-yaml';
import { TEMPLATES } from '../yaml-templates';
import { kindFromPlural } from '../kinds';
import { AsyncComponent } from './utils/async';

export class CreateYAML extends React.PureComponent {
  render () {
    const {match} = this.props;
    const {params} = match;

    const kind = kindFromPlural(params.plural);
    if (!kind) {
      // <base href=...> makes this OK
      window.location = '404';
    }

    const apiVersion = kind.apiVersion || 'v1';
    const namespace = params.ns || 'default';
    const kindStr = `${apiVersion}.${kind.kind}`;
    let template = _.get(TEMPLATES, [kindStr, 'default']);
    if (!template) {
      // eslint-disable-next-line no-console
      console.warn(`No template found for ${kindStr}. Falling back to default template.`);
      template = TEMPLATES.DEFAULT.default;
    }

    const obj = safeLoad(template);
    obj.kind = kind.kind;

    // The code below strips the basePath (etcd.coreos.com, etc.) from the apiVersion that is being set in the template
    // and causes creation to fail for some resource kinds, hence adding a check here to skip for those kinds.
    if (!['EtcdCluster', 'Role', 'RoleBinding', 'Prometheus', 'ServiceMonitor', 'AlertManager', 'NetworkPolicy'].includes(obj.kind)) {
      obj.apiVersion = `${kind.isExtension ? 'extensions/' : ''}${apiVersion}`;
    }
    obj.metadata = obj.metadata || {};
    if (kind.namespaced) {
      obj.metadata.namespace = namespace;
    }

    return <AsyncComponent loader={() => System.import('./edit-yaml').then(c => c.EditYAML)} obj={obj} create={true} kind={kind.kind} />;
  }
}
