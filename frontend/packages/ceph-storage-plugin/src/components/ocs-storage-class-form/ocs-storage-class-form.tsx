import * as React from 'react';
import * as _ from 'lodash';
import {
  Alert,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  DropdownSeparator,
} from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';

import { LoadingInline } from '@console/internal/components/utils/status-box';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ProvisionerProps } from '@console/plugin-sdk';

import { CEPH_INTERNAL_CR_NAME, CEPH_EXTERNAL_CR_NAME, CLUSTER_STATUS } from '../../constants';
import { cephBlockPoolResource, cephClusterResource } from '../../constants/resources';
import { CephClusterKind, StoragePoolKind } from '../../types';
import { storagePoolModal } from '../modals/storage-pool-modal/storage-pool-modal';
import { POOL_STATE } from '../../constants/storage-pool-const';

import './ocs-storage-class-form.scss';

export const PoolResourceComponent: React.FC<ProvisionerProps> = ({ onParamChange }) => {
  const [poolData, poolDataLoaded, poolDataLoadError] = useK8sWatchResource<StoragePoolKind[]>(
    cephBlockPoolResource,
  );

  const [cephClusterObj, loaded, loadError] = useK8sWatchResource<CephClusterKind[]>(
    cephClusterResource,
  );

  const [isOpen, setOpen] = React.useState(false);
  const [poolName, setPoolName] = React.useState('');

  const handleDropdownChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const name = e.currentTarget.id;
    setPoolName(name);
    onParamChange(name);
  };

  const onPoolCreation = (name: string) => {
    setPoolName(name);
    onParamChange(name);
  };

  const onPoolInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPoolName(e.currentTarget.value);
    onParamChange(e.currentTarget.value);
  };

  const poolDropdownItems = _.reduce(
    poolData,
    (res, pool: StoragePoolKind) => {
      if (
        pool?.status?.phase === POOL_STATE.READY &&
        cephClusterObj[0]?.status?.phase === CLUSTER_STATUS.READY
      ) {
        res.push(
          <DropdownItem
            key={pool.metadata.uid}
            component="button"
            id={pool?.metadata?.name}
            onClick={handleDropdownChange}
            description={`Replica ${pool?.spec?.replicated?.size}, ${
              pool?.spec?.compressionMode === 'none' || pool?.spec?.compressionMode === ''
                ? 'no compression'
                : 'with compression'
            }`}
          >
            {pool?.metadata?.name}
          </DropdownItem>,
        );
      }
      return res;
    },
    [
      <DropdownItem
        key="first-item"
        component="button"
        onClick={() =>
          storagePoolModal({
            cephClusterObj,
            onPoolCreation,
          })
        }
      >
        Create New Pool
      </DropdownItem>,
      <DropdownSeparator key="separator" />,
    ],
  );

  if (cephClusterObj[0]?.metadata.name === CEPH_INTERNAL_CR_NAME) {
    return (
      <>
        {!poolDataLoadError && cephClusterObj && (
          <div className="form-group">
            <label className="co-required" htmlFor="ocs-storage-pool">
              Storage Pool
            </label>
            <Dropdown
              className="dropdown dropdown--full-width"
              toggle={
                <DropdownToggle
                  id="pool-dropdown-id"
                  onToggle={() => setOpen(!isOpen)}
                  toggleIndicator={CaretDownIcon}
                >
                  {poolName || 'Select a Pool'}
                </DropdownToggle>
              }
              isOpen={isOpen}
              dropdownItems={poolDropdownItems}
              onSelect={() => setOpen(false)}
              id="ocs-storage-pool"
            />
            <span className="help-block">Storage pool into which volume data shall be stored</span>
          </div>
        )}
        {(poolDataLoadError || loadError) && (
          <Alert
            className="co-alert"
            variant="danger"
            title="Error retrieving Parameters"
            isInline
          />
        )}
      </>
    );
  }
  if (cephClusterObj[0]?.metadata.name === CEPH_EXTERNAL_CR_NAME) {
    return (
      <div className="form-group">
        <label className="co-required" htmlFor="ocs-storage-pool">
          Storage Pool
        </label>
        <input
          className="pf-c-form-control"
          type="text"
          onChange={onPoolInput}
          placeholder="my-storage-pool"
          aria-describedby="pool-name-help"
          id="pool-name"
          name="newPoolName"
          required
        />
        <span className="help-block">Storage pool into which volume data shall be stored</span>
      </div>
    );
  }
  return <>{(!loaded || !poolDataLoaded) && <LoadingInline />}</>;
};
