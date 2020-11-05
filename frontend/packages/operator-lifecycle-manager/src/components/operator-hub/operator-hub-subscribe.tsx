import * as React from 'react';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { match } from 'react-router';
import { ActionGroup, Alert, Button, Checkbox, Popover } from '@patternfly/react-core';
import {
  Dropdown,
  ExternalLink,
  Firehose,
  history,
  NsDropdown,
  openshiftHelpBase,
  BreadCrumbs,
  MsgBox,
  StatusBox,
  ResourceIcon,
  ResourceName,
} from '@console/internal/components/utils';
import {
  K8sResourceCommon,
  apiVersionForModel,
  apiVersionForReference,
  k8sCreate,
  k8sGet,
  k8sListPartialMetadata,
  kindForReference,
  referenceFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { RadioGroup, RadioInput } from '@console/internal/components/radio';
import { fromRequirements } from '@console/internal/module/k8s/selector';
import { SubscriptionModel, OperatorGroupModel, PackageManifestModel } from '../../models';
import { NamespaceModel, RoleBindingModel, RoleModel } from '@console/internal/models';
import {
  OperatorGroupKind,
  PackageManifestKind,
  SubscriptionKind,
  InstallPlanApproval,
  InstallModeType,
} from '../../types';
import {
  defaultChannelFor,
  supportedInstallModesFor,
  ClusterServiceVersionLogo,
  providedAPIsForChannel,
  referenceForProvidedAPI,
  iconFor,
} from '../index';
import { installedFor, supports, providedAPIsFor, isGlobal } from '../operator-group';
import { CRDCard } from '../clusterserviceversion';
import { getInternalObjects, isInternalObject } from '../../utils';
import { OperatorInstallStatusPage } from '../operator-install-page';

export const OperatorHubSubscribeForm: React.FC<OperatorHubSubscribeFormProps> = (props) => {
  const [targetNamespace, setTargetNamespace] = React.useState(null);
  const [installMode, setInstallMode] = React.useState(null);
  const [showInstallStatusPage, setShowInstallStatusPage] = React.useState(false);
  const [updateChannel, setUpdateChannel] = React.useState(null);
  const [approval, setApproval] = React.useState(InstallPlanApproval.Automatic);
  const [cannotResolve, setCannotResolve] = React.useState(false);
  const [suggestedNamespaceExists, setSuggestedNamespaceExists] = React.useState(false);
  const [
    useSuggestedNSForSingleInstallMode,
    setUseSuggestedNSForSingleInstallMode,
  ] = React.useState(true);
  const [enableMonitoring, setEnableMonitoring] = React.useState(false);
  const [error, setError] = React.useState('');

  const { name: pkgName } = props.packageManifest.data[0].metadata;
  const {
    provider,
    channels = [],
    packageName,
    catalogSource,
    catalogSourceNamespace,
  } = props.packageManifest.data[0].status;

  const search = new URLSearchParams({
    'details-item': `${new URLSearchParams(window.location.search).get(
      'pkg',
    )}-${new URLSearchParams(window.location.search).get('catalogNamespace')}`,
  });

  const selectedUpdateChannel = updateChannel || defaultChannelFor(props.packageManifest.data[0]);
  const selectedInstallMode =
    installMode ||
    supportedInstallModesFor(props.packageManifest.data[0])(selectedUpdateChannel).reduce(
      (preferredInstallMode, mode) =>
        mode.type === InstallModeType.InstallModeTypeAllNamespaces
          ? InstallModeType.InstallModeTypeAllNamespaces
          : preferredInstallMode,
      InstallModeType.InstallModeTypeOwnNamespace,
    );

  const { currentCSVDesc } = channels.find((ch) => ch.name === selectedUpdateChannel);
  const { installModes = [] } = currentCSVDesc;
  const suggestedNamespace =
    currentCSVDesc.annotations?.['operatorframework.io/suggested-namespace'];
  const operatorRequestsMonitoring =
    currentCSVDesc.annotations?.['operatorframework.io/cluster-monitoring'] === 'true';
  const initializationResourceJSON =
    currentCSVDesc.annotations?.['operatorframework.io/initialization-resource'];

  let initializationResourceReference = null;
  if (initializationResourceJSON) {
    let initializationResource = null;
    try {
      initializationResource = JSON.parse(initializationResourceJSON);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        err.message || 'Operator Hub Subscribe: Could not get initialization resource.',
      );
    }

    initializationResourceReference = initializationResource
      ? referenceFor(initializationResource)
      : null;
  }

  const internalObjects = getInternalObjects(currentCSVDesc, 'annotations');

  const globalNS =
    (props.operatorGroup?.data || ([] as OperatorGroupKind[])).find(
      (og) => og.metadata.name === 'global-operators',
    )?.metadata?.namespace || 'openshift-operators';
  const items = {
    [globalNS]: <ResourceName kind="Project" name={globalNS} />,
  };

  let selectedTargetNamespace = targetNamespace || props.targetNamespace;
  if (selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces) {
    if (suggestedNamespace) {
      items[suggestedNamespace] = (
        <ResourceName kind="Project" name={`${suggestedNamespace} (Operator recommended)`} />
      );
      selectedTargetNamespace = targetNamespace || suggestedNamespace;
    } else {
      selectedTargetNamespace = globalNS;
    }
  }
  if (
    selectedInstallMode === InstallModeType.InstallModeTypeOwnNamespace &&
    props.targetNamespace === globalNS
  ) {
    selectedTargetNamespace = targetNamespace || '';
  }

  const isSuggestedNamespaceSelected =
    suggestedNamespace && suggestedNamespace === selectedTargetNamespace;
  const selectedApproval = approval || InstallPlanApproval.Automatic;

  React.useEffect(() => {
    if (!suggestedNamespace) {
      return;
    }
    setTargetNamespace(suggestedNamespace);
    k8sGet(NamespaceModel, suggestedNamespace)
      .then(() => setSuggestedNamespaceExists(true))
      .catch(() => setSuggestedNamespaceExists(false));
  }, [suggestedNamespace]);

  React.useEffect(() => {
    k8sListPartialMetadata(PackageManifestModel, {
      ns: selectedTargetNamespace,
      fieldSelector: `metadata.name=${pkgName}`,
      labelSelector: fromRequirements([
        { key: 'catalog', operator: 'Equals', values: [catalogSource] },
        { key: 'catalog-namespace', operator: 'Equals', values: [catalogSourceNamespace] },
      ]),
    })
      .then((list) => setCannotResolve(_.isEmpty(list)))
      .catch(() => setCannotResolve(true));
  }, [
    catalogSource,
    catalogSourceNamespace,
    pkgName,
    props.packageManifest.data,
    selectedTargetNamespace,
  ]);

  const singleInstallMode = installModes.find(
    (m) => m.type === InstallModeType.InstallModeTypeOwnNamespace,
  );
  const supportsSingle = singleInstallMode && singleInstallMode.supported;
  const globalInstallMode = installModes.find(
    (m) => m.type === InstallModeType.InstallModeTypeAllNamespaces,
  );
  const supportsGlobal = globalInstallMode && globalInstallMode.supported;

  if (!supportsSingle && !supportsGlobal) {
    return (
      <MsgBox
        title={`${_.get(channels, '[0].currentCSVDesc.displayName')} can't be installed`}
        detail="The operator does not support single namespace or global installation modes."
      />
    );
  }

  const descFor = (mode: InstallModeType) => {
    if (mode === InstallModeType.InstallModeTypeAllNamespaces && supportsGlobal) {
      return 'Operator will be available in all namespaces.';
    }
    if (mode === InstallModeType.InstallModeTypeOwnNamespace && supportsSingle) {
      return 'Operator will be available in a single namespace only.';
    }
    return 'This mode is not supported by this Operator';
  };
  const subscriptionExists = (ns: string) =>
    installedFor(props.subscription.data)(props.operatorGroup.data)(
      props.packageManifest.data[0].status.packageName,
    )(ns);
  const namespaceSupports = (ns: string) => (mode: InstallModeType) => {
    const operatorGroup = props.operatorGroup.data.find((og) => og.metadata.namespace === ns);
    if (!operatorGroup || !ns) {
      return true;
    }
    return supports([{ type: mode, supported: true }])(operatorGroup);
  };
  const conflictingProvidedAPIs = (ns: string) => {
    const operatorGroups = props.operatorGroup.data.filter(
      (og) => og.status.namespaces.includes(ns) || isGlobal(og),
    );
    if (_.isEmpty(operatorGroups)) {
      return [];
    }
    const existingAPIs = _.flatMap(operatorGroups, providedAPIsFor);
    const providedAPIs = providedAPIsForChannel(props.packageManifest.data[0])(
      selectedUpdateChannel,
    ).map((desc) => referenceForProvidedAPI(desc));

    return _.intersection(existingAPIs, providedAPIs);
  };

  const submit = async () => {
    // Clear any previous errors.
    setError('');

    const ns: K8sResourceCommon = {
      metadata: {
        name: selectedTargetNamespace,
        labels:
          operatorRequestsMonitoring && enableMonitoring
            ? {
                'openshift.io/cluster-monitoring': 'true',
              }
            : {},
      },
    };

    const rbacName = `${selectedTargetNamespace}-prometheus`;
    const prometheusRole = {
      kind: RoleModel.kind,
      apiVersion: `${RoleModel.apiGroup}/${RoleModel.apiVersion}`,
      metadata: {
        name: rbacName,
        namespace: selectedTargetNamespace,
      },
      rules: [
        {
          apiGroups: [''],
          resources: ['services', 'endpoints', 'pods'],
          verbs: ['get', 'list', 'watch'],
        },
      ],
    };

    const prometheusRoleBinding = {
      kind: RoleBindingModel.kind,
      apiVersion: `${RoleBindingModel.apiGroup}/${RoleBindingModel.apiVersion}`,
      metadata: {
        name: rbacName,
        namespace: selectedTargetNamespace,
      },
      roleRef: {
        kind: 'Role',
        name: rbacName,
        apiGroup: RoleBindingModel.apiGroup,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: 'prometheus-k8s',
          namespace: 'openshift-monitoring',
        },
      ],
    };

    const operatorGroup: OperatorGroupKind = {
      apiVersion: apiVersionForModel(OperatorGroupModel) as OperatorGroupKind['apiVersion'],
      kind: 'OperatorGroup',
      metadata: {
        generateName: `${selectedTargetNamespace}-`,
        namespace: selectedTargetNamespace,
      },
      ...(selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces
        ? {}
        : {
            spec: {
              targetNamespaces: [selectedTargetNamespace],
            },
          }),
    };

    const subscription: SubscriptionKind = {
      apiVersion: apiVersionForModel(SubscriptionModel) as SubscriptionKind['apiVersion'],
      kind: 'Subscription',
      metadata: {
        name: packageName,
        namespace: selectedTargetNamespace,
      },
      spec: {
        source: catalogSource,
        sourceNamespace: catalogSourceNamespace,
        name: packageName,
        startingCSV: channels.find((ch) => ch.name === selectedUpdateChannel).currentCSV,
        channel: selectedUpdateChannel,
        installPlanApproval: selectedApproval,
      },
    };

    try {
      if (isSuggestedNamespaceSelected && !suggestedNamespaceExists) {
        await k8sCreate(NamespaceModel, ns);
        if (operatorRequestsMonitoring && enableMonitoring) {
          await k8sCreate(RoleModel, prometheusRole);
          await k8sCreate(RoleBindingModel, prometheusRoleBinding);
        }
      }
      if (
        !props.operatorGroup.data.some(
          (group) => group.metadata.namespace === selectedTargetNamespace,
        )
      ) {
        await k8sCreate(OperatorGroupModel, operatorGroup);
      }
      await k8sCreate(SubscriptionModel, subscription);
      setShowInstallStatusPage(true);
    } catch (err) {
      setError(err.message || 'Could not create operator subscription.');
    }
  };

  const formValid = () =>
    [selectedUpdateChannel, selectedInstallMode, selectedTargetNamespace, selectedApproval].some(
      (v) => _.isNil(v) || _.isEmpty(v),
    ) ||
    subscriptionExists(selectedTargetNamespace) ||
    !namespaceSupports(selectedTargetNamespace)(selectedInstallMode) ||
    (selectedTargetNamespace && cannotResolve) ||
    !_.isEmpty(conflictingProvidedAPIs(selectedTargetNamespace));

  const formError = () => {
    return (
      (error && (
        <Alert
          isInline
          className="co-alert co-alert--scrollable"
          variant="danger"
          title="An error occurred"
        >
          <div className="co-pre-line">{error}</div>
        </Alert>
      )) ||
      (!namespaceSupports(selectedTargetNamespace)(selectedInstallMode) && (
        <Alert
          isInline
          className="co-alert"
          variant="danger"
          title="Namespace does not support installation mode"
        >
          {selectedInstallMode === InstallModeType.InstallModeTypeOwnNamespace &&
          selectedTargetNamespace === globalNS ? (
            <>
              The {selectedTargetNamespace} namespace is reserved for global operators that watch
              all namespaces. To install an operator in a single namespace, select a different
              namespace where the operand should run.
            </>
          ) : (
            <>
              The operator group in the {selectedTargetNamespace} namespace does not support the
              {selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces
                ? ' global '
                : ' single namespace '}
              installation mode. Select a different installation namespace that supports this mode.
            </>
          )}
        </Alert>
      )) ||
      (subscriptionExists(selectedTargetNamespace) && (
        <Alert
          isInline
          className="co-alert"
          variant="danger"
          title={`Operator subscription for namespace '${selectedTargetNamespace}' already exists`}
        />
      )) ||
      (!_.isEmpty(conflictingProvidedAPIs(selectedTargetNamespace)) && (
        <Alert isInline className="co-alert" variant="danger" title="Operator conflicts exist">
          Installing Operator in selected namespace would cause conflicts with another Operator
          providing these APIs:
          <ul>
            {conflictingProvidedAPIs(selectedTargetNamespace).map((gvk) => (
              <li key={gvk}>
                <strong>{kindForReference(gvk)}</strong> <i>({apiVersionForReference(gvk)})</i>
              </li>
            ))}
          </ul>
        </Alert>
      )) ||
      (selectedTargetNamespace && cannotResolve && (
        <Alert
          isInline
          className="co-alert"
          variant="danger"
          title="Operator not available for selected namespaces"
        />
      ))
    );
  };

  const showMonitoringCheckbox =
    operatorRequestsMonitoring && _.startsWith(selectedTargetNamespace, 'openshift-');

  const suggestedNamespaceDetails = isSuggestedNamespaceSelected && (
    <>
      <Alert
        isInline
        className="co-alert co-alert--scrollable"
        variant={suggestedNamespaceExists ? 'warning' : 'info'}
        title={suggestedNamespaceExists ? 'Namespace already exists' : 'Namespace creation'}
      >
        {suggestedNamespaceExists ? (
          <>
            Namespace <b>{suggestedNamespace}</b> already exists and will be used. Other users can
            already have access to this namespace.
          </>
        ) : (
          <>
            Namespace <b>{suggestedNamespace}</b> does not exist and will be created.
          </>
        )}
      </Alert>
      {showMonitoringCheckbox && !suggestedNamespaceExists && (
        <div className="co-form-subsection">
          <Checkbox
            id="enable-monitoring-checkbox"
            label="Enable operator recommended cluster monitoring on this namespace"
            onChange={setEnableMonitoring}
            isChecked={enableMonitoring}
          />
          {props.packageManifest.data[0].metadata.labels['opsrc-provider'] !== 'redhat' && (
            <Alert
              isInline
              className="co-alert pf-c-alert--top-margin"
              variant="warning"
              title="Namespace monitoring"
            >
              Please note that installing non Red Hat operators into openshift namespaces and
              enabling monitoring voids user support. Enabling cluster monitoring for non Red Hat
              operators can lead to malicious metrics data overriding existing cluster metrics. For
              more information, see the{' '}
              <ExternalLink
                href={`${openshiftHelpBase}monitoring/cluster_monitoring/configuring-the-monitoring-stack.html#maintenance-and-support_configuring-monitoring`}
                text="cluster monitoring documentation"
              />{' '}
              .
            </Alert>
          )}
        </div>
      )}
    </>
  );

  const globalNamespaceInstallMode = (
    <>
      <div className="form-group">
        <Dropdown
          id="dropdown-selectbox"
          dropDownClassName="dropdown--full-width"
          menuClassName="dropdown-menu--text-wrap"
          items={items}
          title={
            <ResourceName
              kind="Project"
              name={
                isSuggestedNamespaceSelected
                  ? `${selectedTargetNamespace} (Operator recommended)`
                  : selectedTargetNamespace
              }
            />
          }
          disabled={_.size(items) === 1}
          selectedKey={selectedTargetNamespace}
          onChange={(ns: string) => {
            setTargetNamespace(ns);
            setCannotResolve(false);
          }}
        />
      </div>
      {suggestedNamespaceDetails}
    </>
  );

  const singleNamespaceInstallMode = !suggestedNamespace ? (
    <NsDropdown
      id="dropdown-selectbox"
      selectedKey={selectedTargetNamespace}
      onChange={setTargetNamespace}
    />
  ) : (
    <div className="form-group">
      <RadioInput
        onChange={() => {
          setUseSuggestedNSForSingleInstallMode(true);
          setTargetNamespace(suggestedNamespace);
        }}
        value={suggestedNamespace}
        checked={useSuggestedNSForSingleInstallMode}
        title="Operator recommended namespace:"
      >
        {' '}
        <ResourceIcon kind="Project" />
        <b>{suggestedNamespace}</b>
      </RadioInput>
      {useSuggestedNSForSingleInstallMode && suggestedNamespaceDetails}
      <RadioInput
        onChange={() => {
          setUseSuggestedNSForSingleInstallMode(false);
          setTargetNamespace(null);
        }}
        value={suggestedNamespace}
        checked={!useSuggestedNSForSingleInstallMode}
        title="Pick an existing namespace"
      />
      {!useSuggestedNSForSingleInstallMode && (
        <NsDropdown
          id="dropdown-selectbox"
          selectedKey={selectedTargetNamespace}
          onChange={setTargetNamespace}
        />
      )}
    </div>
  );

  const providedAPIs = providedAPIsForChannel(props.packageManifest.data[0])(
    selectedUpdateChannel,
  ).filter((item) => !isInternalObject(internalObjects, item.name));

  if (showInstallStatusPage) {
    return (
      <OperatorInstallStatusPage
        targetNamespace={selectedTargetNamespace}
        pkgNameWithVersion={channels.find((ch) => ch.name === selectedUpdateChannel).currentCSV}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>Operator Installation</title>
      </Helmet>
      <div className="co-m-nav-title co-m-nav-title--breadcrumbs">
        <BreadCrumbs
          breadcrumbs={[
            { name: 'OperatorHub', path: `/operatorhub?${search.toString()}` },
            { name: 'Operator Installation', path: props.match.url },
          ]}
        />
        <h1 className="co-m-pane__heading">Install Operator</h1>
        <p className="co-help-text">
          Install your Operator by subscribing to one of the update channels to keep the Operator up
          to date. The strategy determines either manual or automatic updates.
        </p>
      </div>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-xs-6">
            <>
              <div className="form-group">
                <fieldset>
                  <Popover
                    headerContent={<div>Update Channel</div>}
                    bodyContent={<div>The channel to track and receive the updates from.</div>}
                  >
                    <h5 className="co-required co-form-heading__popover">
                      <Button variant="plain" className="co-form-heading__popover-button">
                        Update Channel
                      </Button>
                    </h5>
                  </Popover>
                  <RadioGroup
                    currentValue={selectedUpdateChannel}
                    items={channels.map((ch) => ({ value: ch.name, title: ch.name }))}
                    onChange={(e) => {
                      setUpdateChannel(e.currentTarget.value);
                      setInstallMode(null);
                    }}
                  />
                </fieldset>
              </div>
              <div className="form-group">
                <fieldset>
                  <h5 className="co-required">Installation Mode</h5>
                  <RadioInput
                    onChange={(e) => {
                      setInstallMode(e.target.value);
                      setTargetNamespace(null);
                      setCannotResolve(false);
                    }}
                    value={InstallModeType.InstallModeTypeAllNamespaces}
                    checked={selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces}
                    disabled={!supportsGlobal}
                    title="All namespaces on the cluster"
                    subTitle="(default)"
                  >
                    <div className="co-m-radio-desc">
                      <p className="text-muted">
                        {descFor(InstallModeType.InstallModeTypeAllNamespaces)}
                      </p>
                    </div>
                  </RadioInput>
                  <RadioInput
                    onChange={(e) => {
                      setInstallMode(e.target.value);
                      setTargetNamespace(
                        useSuggestedNSForSingleInstallMode ? suggestedNamespace : null,
                      );
                      setCannotResolve(false);
                    }}
                    value={InstallModeType.InstallModeTypeOwnNamespace}
                    checked={selectedInstallMode === InstallModeType.InstallModeTypeOwnNamespace}
                    disabled={!supportsSingle}
                    title="A specific namespace on the cluster"
                  >
                    <div className="co-m-radio-desc">
                      <p className="text-muted">
                        {descFor(InstallModeType.InstallModeTypeOwnNamespace)}
                      </p>
                    </div>
                  </RadioInput>
                </fieldset>
              </div>
              <div className="form-group">
                <h5 className="co-required">Installed Namespace</h5>
                {selectedInstallMode === InstallModeType.InstallModeTypeAllNamespaces &&
                  globalNamespaceInstallMode}
                {selectedInstallMode === InstallModeType.InstallModeTypeOwnNamespace &&
                  singleNamespaceInstallMode}
              </div>
              <div className="form-group">
                <fieldset>
                  <Popover
                    headerContent={<div>Approval Strategy</div>}
                    bodyContent={
                      <div>The strategy to determine either manual or automatic updates.</div>
                    }
                  >
                    <h5 className="co-required co-form-heading__popover">
                      <Button variant="plain" className="co-form-heading__popover-button">
                        Approval Strategy
                      </Button>
                    </h5>
                  </Popover>
                  <RadioGroup
                    currentValue={selectedApproval}
                    items={[
                      { value: InstallPlanApproval.Automatic, title: 'Automatic' },
                      { value: InstallPlanApproval.Manual, title: 'Manual' },
                    ]}
                    onChange={(e) => setApproval(e.currentTarget.value)}
                  />
                </fieldset>
              </div>
            </>
            <div className="co-form-section__separator" />
            {formError()}
            <ActionGroup className="pf-c-form">
              <Button onClick={() => submit()} isDisabled={formValid()} variant="primary">
                Install
              </Button>
              <Button variant="secondary" onClick={() => history.push('/operatorhub')}>
                Cancel
              </Button>
            </ActionGroup>
          </div>
          <div className="col-xs-6">
            <ClusterServiceVersionLogo
              displayName={
                currentCSVDesc?.displayName || channels?.[0]?.currentCSVDesc?.displayName
              }
              icon={iconFor(props.packageManifest.data[0])}
              provider={provider}
            />
            <h4>Provided APIs</h4>
            <div className="co-crd-card-row">
              {!providedAPIs.length ? (
                <span className="text-muted">
                  No Kubernetes APIs are provided by this Operator.
                </span>
              ) : (
                providedAPIs.map((api) => (
                  <CRDCard
                    key={referenceForProvidedAPI(api)}
                    canCreate={false}
                    crd={api}
                    csv={null}
                    required={referenceForProvidedAPI(api) === initializationResourceReference}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const OperatorHubSubscribe: React.FC<OperatorHubSubscribeFormProps> = (props) => (
  <StatusBox data={props.packageManifest.data[0]} loaded={props.loaded} loadError={props.loadError}>
    <OperatorHubSubscribeForm {...props} />
  </StatusBox>
);

export const OperatorHubSubscribePage: React.SFC<OperatorHubSubscribePageProps> = (props) => {
  return (
    <Firehose
      resources={[
        {
          isList: true,
          kind: referenceForModel(OperatorGroupModel),
          prop: 'operatorGroup',
        },
        {
          isList: true,
          kind: referenceForModel(PackageManifestModel),
          namespace: new URLSearchParams(window.location.search).get('catalogNamespace'),
          fieldSelector: `metadata.name=${new URLSearchParams(window.location.search).get('pkg')}`,
          selector: {
            matchLabels: {
              catalog: new URLSearchParams(window.location.search).get('catalog'),
            },
          },
          prop: 'packageManifest',
        },
        {
          isList: true,
          kind: referenceForModel(SubscriptionModel),
          prop: 'subscription',
        },
      ]}
    >
      {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
      <OperatorHubSubscribe
        {...(props as any)}
        targetNamespace={new URLSearchParams(window.location.search).get('targetNamespace') || null}
      />
    </Firehose>
  );
};

export type OperatorHubSubscribeFormProps = {
  loaded: boolean;
  loadError?: any;
  namespace: string;
  targetNamespace?: string;
  operatorGroup: { loaded: boolean; data: OperatorGroupKind[] };
  packageManifest: { loaded: boolean; data: PackageManifestKind[] };
  match: match;
  subscription: { loaded: boolean; data: SubscriptionKind[] };
};

export type OperatorHubSubscribePageProps = {
  match: match;
};

OperatorHubSubscribe.displayName = 'OperatorHubSubscribe';
OperatorHubSubscribeForm.displayName = 'OperatorHubSubscribeForm';
OperatorHubSubscribePage.displayName = 'OperatorHubSubscribePage';
