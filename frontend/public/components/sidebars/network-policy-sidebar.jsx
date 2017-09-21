import * as React from 'react';
import { registerTemplate } from '../../yaml-templates';

import * as denyOtherNamespacesImg from '../../imgs/network-policy-samples/1-deny-other-namespaces.svg';
import * as limitCertainAppImg from '../../imgs/network-policy-samples/2-limit-certain-apps.svg';
import * as allowIngressImg from '../../imgs/network-policy-samples/3-allow-ingress.svg';
import * as defaultDenyAllImg from '../../imgs/network-policy-samples/4-default-deny-all.svg';
import * as webAllowExternalImg from '../../imgs/network-policy-samples/5-web-allow-external.svg';
import * as webDbAllowAllNsImg from '../../imgs/network-policy-samples/6-web-db-allow-all-ns.svg';
import * as webAllowProductionImg from '../../imgs/network-policy-samples/7-web-allow-production.svg';

registerTemplate('v1.NetworkPolicy', `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-other-namespaces
  namespace: target-ns
spec:
  podSelector:
  ingress:
  - from:
    - podSelector: {}
`, 'deny-other-namespaces');

registerTemplate('v1.NetworkPolicy', `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-or-api-allow-app
  namespace: target-ns
spec:
  podSelector:
    matchLabels:
      role: db
  ingress:
    - from:
      - podSelector:
          matchLabels:
            app: mail
`, 'db-or-api-allow-app');

registerTemplate('v1.NetworkPolicy', `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-allow-http-and-https
  namespace: target-ns
spec:
  podSelector:
    matchLabels:
      app: api
  ingress:
  - from:
    - podSelector:
          matchLabels:
            role: monitoring
  - ports:
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 443
`, 'api-allow-http-and-https');

registerTemplate('v1.NetworkPolicy', `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: target-ns
spec:
  podSelector:
`, 'default-deny-all');

registerTemplate('v1.NetworkPolicy', `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: web-allow-external
  namespace: target-ns
spec:
  podSelector:
    matchLabels:
      app: web
  ingress:
  - {}
`, 'web-allow-external');

registerTemplate('v1.NetworkPolicy', `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: web-db-allow-all-ns
  namespace: target-ns
spec:
  podSelector:
    matchLabels:
      role: web-db
  ingress:
    - from:
      - namespaceSelector: {}
`, 'web-db-allow-all-ns');

registerTemplate('v1.NetworkPolicy', `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: web-allow-production
  namespace: target-ns
spec:
  podSelector:
    matchLabels:
      app: web
  ingress:
    - from:
      - namespaceSelector:
        matchLabels:
        env: production
`, 'web-allow-production');

const samples = [
  {
    highlightText: 'Limit',
    subheader: 'access to the current namespace',
    img: denyOtherNamespacesImg,
    details: 'Deny traffic from other namespaces while allowing all traffic from the namespaces the Pod is living in.',
    templateName: 'deny-other-namespaces',
  },
  {
    highlightText: 'Limit',
    subheader: 'traffic to an application within the same namespace',
    img: limitCertainAppImg,
    details: 'Allow inbound traffic from only certain Pods. One typical use case is to restrict the connections to a database only to the specific applications.',
    templateName: 'db-or-api-allow-app',
  },
  {
    highlightText: 'Allow',
    subheader: 'http and https ingress within the same namespace',
    img: allowIngressImg,
    details: 'Define ingress rules for specific port numbers of an application. The rule applies to all port numbers if not specified.',
    templateName: 'api-allow-http-and-https',
  },
  {
    highlightText: 'Deny',
    subheader: 'all non-whitelisted traffic in the current namespace',
    img: defaultDenyAllImg,
    details: 'A fundamental policy by blocking all cross-pod traffics expect whitelisted ones through the other Network Policies being deployed.',
    templateName: 'default-deny-all',
  },
  {
    highlightText: 'Allow',
    subheader: 'traffic from external clients',
    img: webAllowExternalImg,
    details: 'Allow external service from public Internet directly or through a Load Balancer to access the pod.',
    templateName: 'web-allow-external',
  },
  {
    highlightText: 'Allow',
    subheader: 'traffic to an application from all namespaces',
    img: webDbAllowAllNsImg,
    details: 'One typical use case is for a common database which is used by deployments in different namespaces.',
    templateName: 'web-db-allow-all-ns',
  },
  {
    highlightText: 'Allow',
    subheader: 'traffic from all pods in a particular namespace',
    img: webAllowProductionImg,
    details: 'Typical use case should be "only allow deployments in production namespaces to access the database" or "allow monitoring tools (in another namespace) to scrape metrics from current namespace."',
    templateName: 'web-allow-production',
  },

];

const SampleYaml = ({sample, loadSampleYaml, downloadSampleYaml}) => {
  const {highlightText, subheader, img, details, templateName} = sample;
  return <li className="co-resource-sidebar-item">
    <h5 className="co-resource-item__header">
      <span className="text-uppercase">{highlightText}</span> {subheader}
    </h5>
    <img src={img} />
    <p className="co-resource-item__details">
      {details}
    </p>
    <button className="btn btn-link" onClick={() => loadSampleYaml(templateName)}>
      <span className="fa fa-fw fa-paste"></span> Try this policy
    </button>
    <button className="btn btn-link pull-right" onClick={() => downloadSampleYaml(templateName)}>
      <span className="fa fa-fw fa-download"></span> Download this yaml
    </button>
  </li>;
};

export const NetworkPolicySidebar = ({loadSampleYaml, downloadSampleYaml}) => <ol className="co-resource-sidebar-list">
  {_.map(samples, (sample) => <SampleYaml
    key={sample.templateName}
    sample={sample}
    loadSampleYaml={loadSampleYaml}
    downloadSampleYaml={downloadSampleYaml} />)}
</ol>;
