import * as React from 'react';
import * as PropTypes from 'prop-types';

import { Link } from 'react-router';
import { containerLinuxUpdateOperator } from '../utils';
import { SafetyFirst } from '../safety-first';

const Status = ({status, upgradeCount}) => {
  return <div className="co-cluster-updates__details">
    <dl className="co-cluster-updates__detail">
      <dt>Status</dt>
      <dd>
        {upgradeCount > 0 && <span className="co-cluster-updates__text-icon fa fa-circle-o-notch fa-spin co-cluster-updates__operator-icon--updating"></span>}
        <span className={upgradeCount > 0 ? 'co-cluster-updates--updating' : 'co-cluster-updates--up-to-date'}>{status}</span>
      </dd>
    </dl>
  </div>;
};

const getProgressIconsClass = (dependentCount, total, nodes) => {
  if (dependentCount === total) {
    return 'fa fa-circle-o co-cl-operator--pending';
  }
  return _.isEmpty(nodes) ? 'fa fa-check-circle co-cl-operator--downloaded' : 'fa fa-spin fa-circle-o-notch co-cl-operator-spinner--downloading';
};

const Breakdown = ({iconClass, text, count, total, style}) => {
  return <div className="co-cluster-updates__operator-ts-component" style={style}>
    <div className="co-cluster-updates__operator-ts-step">
      <div className="co-cluster-updates__operator-icon"><span className={iconClass}></span></div>
      <div className="co-cluster-updates__operator-text">
        {text} {count > 0 && <span className="text-muted">({count} of {total})</span>}
      </div>
    </div>
  </div>;
};

class UpToDateState extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDetails: false
    };
  }

  render() {
    const {iconClass, text, total, textClass, versions} = this.props;

    return <div className="co-cluster-updates__operator-ts-component">
      <div className="co-cluster-updates__operator-ts-step">
        <div className="co-cluster-updates__operator-icon"><span className={iconClass}></span></div>
        <div className="co-cluster-updates__operator-text">
          <div className={textClass}>
            {text}
          </div>
          <button className="btn btn-link" onClick={() => this.setState({showDetails: !this.state.showDetails})}>
            {this.state.showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          {this.state.showDetails && <ul className="co-cluster-updates__operator-list">
            {_.map(_.countBy(versions.sort()), (count, version) => <li key={version}>
              <span>{version} ({count} of {total})</span>
            </li>)}
          </ul>}
        </div>
      </div>
    </div>;
  }
}
UpToDateState.propTypes = {
  iconClass: PropTypes.string,
  textClass: PropTypes.string,
  total: PropTypes.number,
  text: PropTypes.string,
  versions: PropTypes.array,
};

class UpdateProgress extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDetails: false
    };
  }

  render() {
    const {nodeListUpdateStatus} = this.props;
    const {downloading, verifying, finalizing, upgradeCount, count, updatedNeedsReboot, rebooting} = nodeListUpdateStatus;
    const headerCountText = upgradeCount === count ? count : `${upgradeCount} out of ${count}`;
    const style = {padding: '0 0 10px 20px'};

    return <div>
      <div className="co-cluster-updates__operator-step">
        <div className="co-cluster-updates__operator-text">
          <span className="co-cluster-updates__operator-subheader">
            Updates are available for {headerCountText}
          </span>
        </div>
      </div>
      <button className="btn btn-link" onClick={() => this.setState({showDetails: !this.state.showDetails})}>
        {this.state.showDetails ? 'Hide Details' : 'Show Details'}
      </button>
      {this.state.showDetails && <div>
        <div className="co-cluster-updates__operator-logs">
          <Link to="nodes" className="co-cluster-updates__breakdown-button btn btn-default" target="_blank">View Logs</Link>
        </div>
        <div className="co-cluster-updates__operator-ts-component">
          <Breakdown text="Download and finalize updates"
            style={{paddingBottom: '10px'}}
            iconClass={containerLinuxUpdateOperator.getDownloadCompletedIconClass(nodeListUpdateStatus)} />
          {(downloading.length > 0 || verifying.length > 0 || finalizing.length > 0) && <div>
            <Breakdown text="Downloading..."
              style={style}
              iconClass={getProgressIconsClass(0, upgradeCount, downloading)}
              count={downloading.length}
              total={upgradeCount} />
            <Breakdown text="Verifying..."
              iconClass={getProgressIconsClass(downloading.length, upgradeCount, verifying)}
              style={style}
              count={verifying.length}
              total={upgradeCount} />
            <Breakdown text="Finalizing..."
              style={style}
              iconClass={getProgressIconsClass(downloading.length + verifying.length, upgradeCount, finalizing)}
              count={finalizing.length}
              total={upgradeCount} />
          </div>}
          <Breakdown text="Apply Container Linux updates"
            style={{paddingBottom: '10px'}}
            iconClass={containerLinuxUpdateOperator.getUpdateCompletedIconClass(nodeListUpdateStatus)}
            textClass={nodeListUpdateStatus.downloading.length ? 'co-cl-operator--pending' : ''}
            total={upgradeCount} />
          {(updatedNeedsReboot.length > 0 || rebooting.length > 0) && <div>
            <Breakdown text="Updated need reboot"
              iconClass={getProgressIconsClass(0, upgradeCount, updatedNeedsReboot)}
              style={style}
              count={updatedNeedsReboot.length}
              total={upgradeCount} />
            <Breakdown text="Reboot Success"
              iconClass={getProgressIconsClass(updatedNeedsReboot, upgradeCount, rebooting)}
              style={style}
              count={rebooting.length}
              total={upgradeCount} />
          </div>}
        </div>
      </div>}
    </div>;
  }
}
UpdateProgress.propTypes = {
  nodeListUpdateStatus: PropTypes.object,
};


export class ContainerLinuxUpdateDetails extends SafetyFirst {
  constructor(props) {
    super(props);
    this._toggleExpand = this._toggleExpand.bind(this);
    this.state = {
      expanded: false
    };
  }

  _toggleExpand(event) {
    event.preventDefault();
    this.setState({
      expanded: !this.state.expanded
    });
    event.target.blur();
  }

  render() {
    const {nodeListUpdateStatus, isOperatorInstalled} = this.props;
    const {count, overallState, upgradeCount} = nodeListUpdateStatus;

    return <div>
      { isOperatorInstalled && <div className="co-cluster-updates__component">
        <div className="co-cluster-updates__heading">
          <div className="co-cluster-updates__heading--name-wrapper">
            <span className="co-cluster-updates__heading--name">Container Linux</span>
          </div>
          { !this.state.expanded &&
            <div className="co-cluster-updates__heading--updates">
              <div className="co-cluster-updates__heading--updates">{overallState}</div>
            </div>
          }
          <a className="co-cluster-updates__toggle" onClick={this._toggleExpand}>{this.state.expanded ? 'Collapse' : 'Expand'}</a>
        </div>
        { this.state.expanded && <div>
          <Status status={overallState} upgradeCount={upgradeCount}/>
          <div className="co-cluster-updates__operator">
            {nodeListUpdateStatus.upToDate.length !== count &&
              <UpdateProgress nodeListUpdateStatus={nodeListUpdateStatus} />
            }
            {nodeListUpdateStatus.upToDate.length === count &&
              <UpToDateState text="Container Linux is up to date"
                iconClass="fa fa-check-circle co-cl-operator--up-to-date"
                count={nodeListUpdateStatus.upToDate.length}
                versions={nodeListUpdateStatus.versions}
                total={count} />
            }
          </div>
        </div> }
      </div> }
    </div>;
  }
}
