import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as classNames from'classnames';
import * as _ from 'lodash';

import { FLAGS, areStatesEqual, mergeProps, stateToProps as featuresStateToProps } from '../features';
import { formatNamespaceRoute } from '../ui/ui-actions';
import { authSvc } from '../module/auth';

import { ClusterPicker } from './federation/cluster-picker';

import * as tectonicLogoImg from '../imgs/tectonic-bycoreos-whitegrn.svg';
import * as operatorLogoImg from '../imgs/operator-logo.svg';
import * as routingImg from '../imgs/routing.svg';

const stripNS = href => href.replace(/^\/?(all-namespaces|ns\/[^/]*)/, '').replace(/^\//, '');

const navLinkStateToProps = (state, {required, resource, href, isActive}) => {
  const activeNamespace = state.UI.get('activeNamespace');
  const pathname = state.UI.get('location');
  const resourcePath = pathname ? stripNS(pathname) : '';
  href = resource ? formatNamespaceRoute(activeNamespace, resource) : href;
  const noNSHref = stripNS(href);

  let canRender = true;
  if (required) {
    const flags = featuresStateToProps([required], state).flags;
    canRender = !!flags[required];
  }
  const props = {
    canRender, href,
    isActive: isActive ? isActive(resourcePath) : (resourcePath === noNSHref || _.startsWith(resourcePath, `${noNSHref}/`)),
  };
  return props;
};

const NavLink = connect(navLinkStateToProps, null, mergeProps, {pure: true, areStatesEqual})(
  class NavLink extends React.PureComponent {
    componentDidMount () {
      const {isActive, openSection, sectionId} = this.props;
      if (isActive) {
        openSection(sectionId);
      }
    }

    componentWillReceiveProps (nextProps) {
      const {isActive, openSection, sectionId} = nextProps;
      if (isActive && !this.props.isActive) {
        openSection(sectionId);
      }
    }

    render () {
      if (!this.props.canRender) {
        return null;
      }

      const {isActive, href, name, onClick = undefined, target= undefined} = this.props;
      const klass = classNames('co-m-nav-link', {active: isActive});

      return <li className={klass} key={href}>
        <Link to={href} onClick={onClick} target={target}>{name}</Link>
      </li>;
    }
  });

const logout = e => {
  e.preventDefault();
  authSvc.logout();
};

const navSectionStateToProps = (state, {required}) => ({
  canRender: required ? _.some(required, r => featuresStateToProps(Object.keys(FLAGS), state).flags[r]) : true
});

const NavSection = connect(navSectionStateToProps)(
  class NavSection extends React.PureComponent {
    constructor(props) {
      super(props);
      this.state = {isOpen: false};
      this.openSection = () => this.setState({isOpen: true});
      this.toggle = () => this.setState({isOpen: !this.state.isOpen});
    }

    render () {
      if (!this.props.canRender) {
        return null;
      }
      const { icon, img, text, children } = this.props;
      const Children = React.Children.map(children, c => React.cloneElement(c, {sectionId: text, key: c.props.name, openSection: this.openSection}));

      // WARNING:
      // we transition on max-height because you can't transition to height 'inherit'
      // however, the transition animiation is calculated on the actual max-height, so it must be roughly equal to the actual height
      // we could use scaleY, but that literally scales along the Y axis, ie shrinks
      // we could use flexbox or the equivalent to get an actual height, but this is the easiest solution :-/
      const maxHeight = this.state.isOpen ? ((this.props.children.length || 1) * 29) : 0;

      return <div className="navigation-container__section">
        <div className="navigation-container__section__title" onClick={this.toggle}>
          {icon && <i className={`fa ${icon} navigation-container__section__title__icon`}></i>}
          {img && <img src={img} />}
          {text}
        </div>
        <ul className="navigation-container__list" style={{maxHeight}}>{Children}</ul>
      </div>;
    }
  });

const isRolesActive = path => _.startsWith(path, 'roles') || _.startsWith(path, 'clusterroles');
const isRoleBindingsActive = path => _.startsWith(path, 'rolebindings') || _.startsWith(path, 'clusterrolebindings');
const isClusterSettingsActive = path => _.startsWith(path, 'settings/cluster') || _.startsWith(path, 'settings/ldap');

const Sep = () => <div className="navigation-container__section__separator" />;

export const Nav = () => <div id="sidebar" className="co-img-bg-cells">
  <div className="navigation-container">
    <div className="navigation-container__section navigation-container__section--logo">
      <Link to="/"><img src={tectonicLogoImg} id="logo" /></Link>
      <ClusterPicker />
    </div>

    {false && <NavSection required={[FLAGS.CLOUD_SERVICES]} text="Applications" icon="ci-appcube">
      <NavLink required={FLAGS.CLOUD_CATALOGS} href="/catalog" name="Open Cloud Catalog" />
      <Sep />
      <NavLink resource="clusterserviceversion-v1s" name="Installed Applications" />
    </NavSection>}

    <NavSection text="Workloads" icon="fa-folder-open-o">
      <NavLink resource="daemonsets" name="Daemon Sets" />
      <NavLink resource="deployments" name="Deployments" />
      <NavLink resource="replicasets" name="Replica Sets" />
      <NavLink resource="replicationcontrollers" name="Replication Controllers" />
      <NavLink resource="persistentvolumeclaims" name="Persistent Volume Claims" />
      <NavLink resource="statefulsets" name="Stateful Sets" />
      <Sep />
      <NavLink resource="jobs" name="Jobs" />
      <NavLink resource="pods" name="Pods" />
      <NavLink resource="configmaps" name="Config Maps" />
      <NavLink resource="secrets" name="Secrets" />
      <NavLink resource="resourcequotas" name="Resource Quotas" />
    </NavSection>

    <NavSection required={[FLAGS.ETCD_OPERATOR, FLAGS.PROMETHEUS]} text="Open Cloud Services" img={operatorLogoImg}>
      <NavLink resource="etcdclusters" name="etcd" required={FLAGS.ETCD_OPERATOR} />
      <NavLink resource="prometheuses" name="Prometheus" required={FLAGS.PROMETHEUS} />
    </NavSection>

    <NavSection text="Routing" img={routingImg}>
      <NavLink resource="ingresses" name="Ingress" />
      <NavLink resource="networkpolicies" name="Network Policies" required={FLAGS.CALICO} />
      <NavLink resource="services" name="Services" />
    </NavSection>

    <NavSection text="Troubleshooting" icon="fa-life-ring">
      <NavLink resource="search" name="Search" />
      <NavLink resource="events" name="Events" />
      <NavLink href="/prometheus" target="_blank" name="Prometheus" required={FLAGS.PROMETHEUS} />
      <NavLink href="/alertmanager" target="_blank" name="Prometheus Alerts" required={FLAGS.PROMETHEUS} />
    </NavSection>

    <NavSection text="Administration" icon="fa-cog">
      <NavLink href="/namespaces" name="Namespaces" />
      <NavLink href="/nodes" name="Nodes" />
      <NavLink href="/persistentvolumes" name="Persistent Volumes" />
      <NavLink href="/settings/cluster" name="Cluster Settings" isActive={isClusterSettingsActive} />
      <NavLink resource="serviceaccounts" name="Service Accounts" />
      <NavLink resource="roles" name="Roles" isActive={isRolesActive} />
      <NavLink resource="rolebindings" name="Role Bindings" isActive={isRoleBindingsActive} />
      <NavLink resource="podvulns" name="Security Report" required={FLAGS.SECURITY_LABELLER} />
      <NavLink href="/crds" name="CRDs" />
    </NavSection>

    {authSvc.userID() && <NavSection text={authSvc.name()} icon="fa-user">
      <NavLink href="/settings/profile" name="My Account" />
      <NavLink href="#" name="Log Out" required={FLAGS.AUTH_ENABLED} onClick={logout} />
    </NavSection>}
  </div>
</div>;
