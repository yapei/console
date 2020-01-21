import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Alert } from '@patternfly/react-core';
import { safeLoad } from 'js-yaml';

import { K8sResourceKind } from '../../module/k8s';
import { AsyncComponent, StatusBox } from '../utils';
import { patchAlertmanagerConfig, getAlertmanagerYAML } from './alert-manager-utils';

const EditAlertmanagerYAML = (props) => (
  <AsyncComponent
    {...props}
    loader={() => import('../edit-yaml').then((c) => c.EditYAML)}
    create={false}
    genericYAML
  />
);

const AlertmanagerYAMLEditor: React.FC<AlertmanagerYAMLEditorProps> = ({ obj }) => {
  const secret: K8sResourceKind = obj;
  const [errorMsg, setErrorMsg] = React.useState<string>();
  const [loadErrorMsg, setloadErrorMsg] = React.useState<string>();
  const [successMsg, setSuccessMsg] = React.useState<string>();

  const save = (yaml: string) => {
    if (_.isEmpty(yaml)) {
      setErrorMsg('Alertmanager configuration cannot be empty.');
      setSuccessMsg('');
      return;
    }
    try {
      safeLoad(yaml);
    } catch (e) {
      setErrorMsg(`Error parsing Alertmanager YAML: ${e}`);
      setSuccessMsg('');
      return;
    }
    patchAlertmanagerConfig(secret, yaml).then(
      (newSecret) => {
        setSuccessMsg(
          `${newSecret.metadata.name} has been updated to version ${newSecret.metadata.resourceVersion}`,
        );
        setErrorMsg('');
      },
      (err) => {
        setErrorMsg(err.message);
        setSuccessMsg('');
      },
    );
  };

  if (loadErrorMsg) {
    return (
      <Alert
        isInline
        className="co-alert co-alert--scrollable"
        variant="danger"
        title="An error occurred"
      >
        <div className="co-pre-line">{loadErrorMsg}</div>
      </Alert>
    );
  }

  const alertmanagerYAML = getAlertmanagerYAML(secret, setloadErrorMsg);

  return (
    <>
      <div className="co-m-nav-title">
        <p className="help-block">
          Update this YAML to configure Routes, Receivers, Groupings and other Alertmanager
          settings.
        </p>
      </div>
      <EditAlertmanagerYAML onSave={save} obj={alertmanagerYAML}>
        {errorMsg && (
          <Alert
            isInline
            className="co-alert co-alert--scrollable"
            variant="danger"
            title="An error occurred"
          >
            <div className="co-pre-line">{errorMsg}</div>
          </Alert>
        )}
        {successMsg && <Alert isInline className="co-alert" variant="success" title={successMsg} />}
      </EditAlertmanagerYAML>
    </>
  );
};

export const AlertmanagerYAMLEditorWrapper: React.FC<AlertmanagerYAMLEditorWrapperProps> = React.memo(
  ({ obj, ...props }) => {
    return (
      <>
        <Helmet>
          <title>Alerting</title>
        </Helmet>
        <StatusBox {...obj}>
          <AlertmanagerYAMLEditor {...props} obj={obj.data} />
        </StatusBox>
      </>
    );
  },
);

type AlertmanagerYAMLEditorWrapperProps = {
  obj?: {
    data?: K8sResourceKind;
    [key: string]: any;
  };
};

type AlertmanagerYAMLEditorProps = {
  obj?: K8sResourceKind;
  onCancel?: () => void;
};
