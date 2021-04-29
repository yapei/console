import * as React from 'react';
import * as classNames from 'classnames';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ResourceIcon } from './resource-icon';
import {
  groupVersionFor,
  K8sResourceCommon,
  referenceForGroupVersionKind,
  referenceForModel,
  referenceForOwnerRef,
  OwnerReference,
  modelFor,
} from '../../module/k8s';
import { findOwner, matchOwnerAndCSV } from '../../module/k8s/managed-by';
import { k8sList } from '../../module/k8s/resource';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import { ResourceLink } from '.';

export const ManagedByOperatorResourceLink: React.SFC<ManagerLinkProps> = (props) => {
  const { csvName, namespace, owner, className } = props;
  const name = owner.name;
  const { group, version } = groupVersionFor(owner.apiVersion);
  const kind = owner.kind;

  const reference = referenceForGroupVersionKind(group)(version)(kind);
  const { namespaced } = modelFor(reference);

  const link = `/k8s/ns/${namespace}/${referenceForModel(
    ClusterServiceVersionModel,
  )}/${csvName}/${reference}/${name}`;

  return (
    <span className={className}>
      {namespaced ? (
        <>
          <ResourceIcon kind={referenceForOwnerRef(owner)} />
          <Link to={link} className="co-resource-item__resource-name" data-test-operand-link={name}>
            {name}
          </Link>
        </>
      ) : (
        <ResourceLink kind={reference} name={name} />
      )}
    </span>
  );
};

export const ManagedByOperatorLink: React.SFC<ManagedByLinkProps> = (props) => {
  const { t } = useTranslation();
  const { obj, className } = props;
  const [data, setData] = React.useState<ClusterServiceVersionKind[] | undefined>();
  const namespace = obj.metadata.namespace;
  React.useEffect(() => {
    if (!namespace) {
      return;
    }
    k8sList(ClusterServiceVersionModel, { ns: namespace })
      .then(setData)
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Could not fetch CSVs', e);
      });
  }, [namespace]);
  const owner = findOwner(obj, data);
  const csv = data && owner ? matchOwnerAndCSV(owner, data) : undefined;

  if (owner && csv) {
    return (
      <div className={classNames('co-m-pane__heading-owner', className)}>
        {t('public~Managed by')}{' '}
        <ManagedByOperatorResourceLink
          className="co-resource-item"
          namespace={namespace}
          csvName={csv.metadata.name}
          owner={owner}
        />
      </div>
    );
  }
  return null;
};

type ManagedByLinkProps = {
  className?: string;
  obj: K8sResourceCommon;
};

type ManagerLinkProps = {
  csvName: string;
  namespace: string;
  owner: OwnerReference;
  className?: string;
};
