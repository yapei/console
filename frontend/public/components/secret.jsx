import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import { SecretData } from './configmap-and-secret-data';
import {
  Kebab,
  SectionHeading,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  Timestamp,
  detailsPage,
  navFactory,
  resourceObjPath,
} from './utils';
import { SecretType } from './secrets/create-secret';
import { configureAddSecretToWorkloadModal } from './modals/add-secret-to-workload';

export const WebHookSecretKey = 'WebHookSecretKey';

export const addSecretToWorkload = (kindObj, secret) => {
  const { name: secretName, namespace } = secret.metadata;

  return {
    callback: () => configureAddSecretToWorkloadModal({ secretName, namespace, blocking: true }),
    label: i18next.t('workload~Add Secret to workload'),
  };
};

const actionButtons = [addSecretToWorkload];

const menuActions = [
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  (kind, obj) => {
    return {
      // t('workload~Edit Secret')
      labelKey: 'workload~Edit Secret',
      href: `${resourceObjPath(obj, kind.kind)}/edit`,
      accessReview: {
        group: kind.apiGroup,
        resource: kind.plural,
        name: obj.metadata.name,
        namespace: obj.metadata.namespace,
        verb: 'update',
      },
    };
  },
  Kebab.factory.Delete,
];

const kind = 'Secret';

const tableColumnClasses = [
  classNames('col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-md-3', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-1', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  classNames('col-md-3', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const SecretTableRow = ({ obj: secret, index, key, style }) => {
  const data = _.size(secret.data);
  return (
    <TableRow id={secret.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind="Secret"
          name={secret.metadata.name}
          namespace={secret.metadata.namespace}
          title={secret.metadata.uid}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink
          kind="Namespace"
          name={secret.metadata.namespace}
          title={secret.metadata.namespace}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[2], 'co-break-word')}>
        {secret.type}
      </TableData>
      <TableData className={tableColumnClasses[3]}>{data}</TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={secret.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={secret} />
      </TableData>
    </TableRow>
  );
};

const SecretDetails = ({ obj: secret }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('workload~Secret details')} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={secret} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SecretData data={secret.data} type={secret.type} />
      </div>
    </>
  );
};

const SecretsList = (props) => {
  const { t } = useTranslation();
  const SecretTableHeader = () => [
    {
      title: t('workload~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('workload~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: t('workload~Type'),
      sortField: 'type',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('workload~Size'),
      sortFunc: 'dataSize',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('workload~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];

  return (
    <Table
      {...props}
      aria-label="Secrets"
      Header={SecretTableHeader}
      Row={SecretTableRow}
      virtualize
    />
  );
};
SecretsList.displayName = 'SecretsList';

const IMAGE_FILTER_VALUE = 'Image';
const SOURCE_FILTER_VALUE = 'Source';
const TLS_FILTER_VALUE = 'TLS';
const SA_TOKEN_FILTER_VALUE = 'Service Account Token';
const OPAQUE_FILTER_VALUE = 'Opaque';

const secretTypeFilterValues = [
  IMAGE_FILTER_VALUE,
  SOURCE_FILTER_VALUE,
  TLS_FILTER_VALUE,
  SA_TOKEN_FILTER_VALUE,
  OPAQUE_FILTER_VALUE,
];

export const secretTypeFilterReducer = (secret) => {
  switch (secret.type) {
    case SecretType.dockercfg:
    case SecretType.dockerconfigjson:
      return IMAGE_FILTER_VALUE;

    case SecretType.basicAuth:
    case SecretType.sshAuth:
      return SOURCE_FILTER_VALUE;

    case SecretType.tls:
      return TLS_FILTER_VALUE;

    case SecretType.serviceAccountToken:
      return SA_TOKEN_FILTER_VALUE;

    default:
      // This puts all unrecognized types under "Opaque". Since unrecognized types should be uncommon,
      // it avoids an "Other" category that is usually empty.
      return OPAQUE_FILTER_VALUE;
  }
};

const filters = [
  {
    filterGroupName: 'Type',
    type: 'secret-type',
    reducer: secretTypeFilterReducer,
    items: secretTypeFilterValues.map((filterValue) => ({ id: filterValue, title: filterValue })),
  },
];

const SecretsPage = (props) => {
  const { t } = useTranslation();
  const createItems = {
    generic: t('workload~Key/value secret'),
    image: t('workload~Image pull secret'),
    source: t('workload~Source secret'),
    webhook: t('workload~Webhook secret'),
    yaml: t('workload~From YAML'),
  };

  const createProps = {
    items: createItems,
    createLink: (type) =>
      `/k8s/ns/${props.namespace || 'default'}/secrets/~new/${type !== 'yaml' ? type : ''}`,
  };

  return (
    <ListPage
      ListComponent={SecretsList}
      canCreate={true}
      rowFilters={filters}
      createButtonText={t('workload~Create')}
      createProps={createProps}
      {...props}
    />
  );
};

const SecretsDetailsPage = (props) => (
  <DetailsPage
    {...props}
    buttonActions={actionButtons}
    menuActions={menuActions}
    pages={[navFactory.details(detailsPage(SecretDetails)), navFactory.editYaml()]}
  />
);

export { SecretsList, SecretsPage, SecretsDetailsPage };
