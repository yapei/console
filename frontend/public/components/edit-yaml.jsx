import * as React from 'react';
import { safeLoad, safeDump } from 'js-yaml';
import { saveAs } from 'file-saver';

import * as ace from 'brace';
import 'brace/ext/searchbox';
import 'brace/mode/yaml';
import 'brace/theme/clouds';

import { k8sCreate, k8sUpdate, k8sKinds } from '../module/k8s';
import { kindObj, history, Loading, resourcePath } from './utils';
import { SafetyFirst } from './safety-first';

import { ResourceSidebar } from './sidebars/resource-sidebar';
import { TEMPLATES } from '../yaml-templates';

let id = 0;

const generateObjToLoad = (kind, templateName) => {
  const kindObj = _.get(k8sKinds, kind, {});
  const kindStr = `${kindObj.apiVersion}.${kind}`;
  return safeLoad(TEMPLATES[kindStr][templateName]);
};

/**
 * This component loads the entire Ace editor library (~100kB) with it.
 * Consider using `AsyncComponent` to dynamically load this component when needed.
 */
export class EditYAML extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      success: null,
      height: 500,
      initialized: false,
      stale: false,
      sampleObj: props.sampleObj,
    };
    this.id = `edit-yaml-${++id}`;
    this.ace = null;
    this.doc = null;
    this.resize_ = () => this.setState({height: this.height});
    // k8s uses strings for resource versions
    this.displayedVersion = '0';
    // Default cancel action is browser back navigation
    this.onCancel = 'onCancel' in props ? props.onCancel : history.goBack;
    this.loadSampleYaml_ = this.loadSampleYaml_.bind(this);
    this.downloadSampleYaml_ = this.downloadSampleYaml_.bind(this);
  }

  handleError(error) {
    this.setState({error, success: null}, () => {
      if (!this.ace) {
        return;
      }
      this.ace.focus();
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (_.isEqual(prevState, this.state) || !this.ace) {
      return;
    }
    // trigger a resize of ace if any state changed...
    this.ace.resize(true);
  }

  componentDidMount() {
    super.componentDidMount();
    this.loadYaml();
    window.addEventListener('resize', this.resize_);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    if (this.ace) {
      this.ace.destroy();
      this.ace.container.remove();
      this.ace = null;
    }
    window.removeEventListener('resize', this.resize_);
    this.doc = null;
  }

  componentWillReceiveProps(nextProps) {
    const newVersion = _.get(nextProps.obj, 'metadata.resourceVersion');
    const stale = this.displayedVersion !== newVersion;
    this.setState({stale: stale });
    if (nextProps.sampleObj) {
      this.loadYaml(!_.isEqual(this.state.sampleObj, nextProps.sampleObj), nextProps.sampleObj);
    } else {
      this.loadYaml();
    }
  }

  get height () {
    return Math.floor(
      document.body.getBoundingClientRect().bottom - this.editor.getBoundingClientRect().top
    );
  }

  reload() {
    this.loadYaml(true);
    this.setState({ sampleObj: null });
  }

  loadYaml(reload=false, obj=this.props.obj) {
    if (_.isEmpty(obj)) {
      return;
    }

    if (this.state.initialized && !reload) {
      return;
    }

    if (!this.ace) {
      this.ace = ace.edit(this.id);
      // Squelch warning from Ace
      this.ace.$blockScrolling = Infinity;
      const es = this.ace.getSession();
      es.setMode('ace/mode/yaml');
      this.ace.setTheme('ace/theme/clouds');
      es.setUseWrapMode(true);
      this.doc = es.getDocument();
    }
    let yaml;

    try {
      yaml = safeDump(obj);
    } catch (e) {
      yaml = `Error dumping YAML: ${e}`;
    }
    this.doc.setValue(yaml);
    this.ace.moveCursorTo(0, 0);
    this.ace.clearSelection();
    this.ace.setOption('scrollPastEnd', 0.1);
    this.ace.setOption('tabSize', 2);
    this.ace.setOption('showPrintMargin', false);
    // Allow undo after saving but not after first loading the document
    if (!this.state.initialized) {
      this.ace.getSession().setUndoManager(new ace.UndoManager());
    }
    this.ace.focus();
    this.displayedVersion = _.get(obj, 'metadata.resourceVersion');
    this.setState({initialized: true, stale: false});
    this.resize_();
  }

  save() {
    let obj;
    try {
      obj = safeLoad(this.doc.getValue());
    } catch (e) {
      this.handleError(`Error parsing YAML: ${e}`);
      return;
    }

    if (!obj.kind) {
      this.handleError('No "kind" field found in YAML.');
      return;
    }

    const ko = kindObj(obj.kind);

    if (!ko) {
      this.handleError(`"${obj.kind}" is not a valid kind.`);
      return;
    }
    const { namespace, name } = this.props.obj.metadata;
    const { namespace: newNamespace, name: newName } = obj.metadata;
    this.setState({success: null, error: null}, () => {
      let action = k8sUpdate;
      let redirect = false;
      if (this.props.create || newNamespace !== namespace || newName !== name) {
        action = k8sCreate;
        delete obj.metadata.resourceVersion;
        redirect = true;
      }
      action(ko, obj, namespace, name)
        .then(o => {
          if (redirect) {
            history.push(`${resourcePath(ko.kind, newName, newNamespace)}/details`);
            // TODO: (ggreer). show message on new page. maybe delete old obj?
            return;
          }
          const success = `${newName} has been updated to version ${o.metadata.resourceVersion}`;
          this.setState({success, error: null});
          this.loadYaml(true, o);
        })
        .catch(e => this.handleError(e.message));
    });
  }

  download (data = this.doc.getValue()) {
    const blob = new Blob([data], { type: 'text/yaml;charset=utf-8' });
    let filename = 'k8s-object.yaml';
    try {
      const obj = safeLoad(data);
      if (obj.kind) {
        filename = `${obj.kind.toLowerCase()}-${obj.metadata.name}.yaml`;
      }
    } catch (unused) {
      // unused
    }
    saveAs(blob, filename);
  }

  loadSampleYaml_(templateName = 'default', kind = this.props.obj.kind) {
    const sampleObj = generateObjToLoad(kind, templateName);
    this.setState({ sampleObj: sampleObj });
    this.loadYaml(true, sampleObj);
  }

  downloadSampleYaml_ (templateName = 'default') {
    const data = safeDump(generateObjToLoad(this.props.obj.kind, templateName));
    this.download(data);
  }

  render () {
    if (_.isEmpty(this.props.obj)) {
      return <Loading/>;
    }
    /*
      Rendering:
      Our parent divs are meta objects created by third parties... but we need 100% height in all parents for flexbox :-/
      The current solution uses divs that are relative -> absolute -> flexbox pinning the button row with margin-top: auto
    */

    const {error, success, stale} = this.state;
    const {create, obj, showHeader=true} = this.props;
    const kind = obj.kind;
    const kindObj = _.get(k8sKinds, kind, {});

    return <div>
      {create && showHeader && <div className="yaml-editor-header">
        Create {_.get(kindObj, 'label', kind)}
      </div>}
      <div className="co-p-cluster">
        <div className="co-p-cluster__body">
          <div className="yaml-editor" ref={r => this.editor = r} style={{height: this.state.height}}>
            <div className="absolute-zero">
              <div className="full-width-and-height yaml-editor--flexbox">
                <div id={this.id} key={this.id} className="yaml-editor--acebox" />
                <div className="yaml-editor--buttons">
                  {error && <p style={{fontSize: '100%'}} className="co-m-message co-m-message--error">{error}</p>}
                  {success && <p style={{fontSize: '100%'}} className="co-m-message co-m-message--success">{success}</p>}
                  {stale && <p style={{fontSize: '100%'}} className="co-m-message co-m-message--info">
                    <i className="fa fa-fw fa-exclamation-triangle"></i> This object has been updated. Click reload to see the new version.
                  </p>}
                  {create && <button type="submit" className="btn btn-primary" id="save-changes" onClick={() => this.save()}>Create</button>}
                  {!create && <button type="submit" className="btn btn-primary" onClick={() => this.save()}>Save Changes</button>}
                  {!create && <button type="submit" className="btn btn-default" onClick={() => this.reload()}>Reload</button>}
                  <button className="btn btn-default" onClick={() => this.onCancel()}>Cancel</button>
                  <button type="submit" className="btn btn-default pull-right hidden-sm" onClick={() => this.download()}><i className="fa fa-download"></i>&nbsp;Download</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ResourceSidebar isCreateMode={create} kindObj={kindObj} height={this.state.height} loadSampleYaml={this.loadSampleYaml_} downloadSampleYaml={this.downloadSampleYaml_} />
      </div>
    </div>;
  }
}
