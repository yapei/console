import * as React from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { FirehoseResult, ExternalLink } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Action, State } from '../state';
import BackingStoreSelection from '../backingstore-table';

const BackingStorePage: React.FC<BackingStorePageProps> = React.memo(
  ({ dispatcher, state, namespace }) => {
    // CR data
    // CR data clones to maintain order and selection state for table rows
    const { tier2Policy, tier1Policy, tier1BackingStore, tier2BackingStore } = state;
    const [showHelp, setShowHelp] = React.useState(true);

    return (
      <div className="nb-create-bc-step-page">
        {showHelp && (
          <Alert
            className="nb-create-bc-step-page__info"
            isInline
            variant="info"
            title="What is a Backing Store?"
            actionClose={<AlertActionCloseButton onClose={() => setShowHelp(false)} />}
          >
            <p>
              Backing Store represents a storage target to be used as the underlying storage for the
              data in MCG buckets.
            </p>
            <p>
              Multiple types of backing-stores are supported: asws-s3, s3-compatible,
              google-cloud-storage, azure-blob, obc, PVC.
            </p>
            <ExternalLink
              href="https://github.com/noobaa/noobaa-operator/blob/master/doc/backing-store-crd.md"
              text="Learn More"
            />
          </Alert>
        )}
        <BackingStoreSelection
          namespace={namespace}
          tier1Policy={tier1Policy}
          tier2Policy={tier2Policy}
          selectedTierA={tier1BackingStore}
          selectedTierB={tier2BackingStore}
          setSelectedTierA={(bs) => dispatcher({ type: 'setBackingStoreTier1', value: [...bs] })}
          setSelectedTierB={(bs) => dispatcher({ type: 'setBackingStoreTier2', value: [...bs] })}
        />
      </div>
    );
  },
);

export default BackingStorePage;

type BackingStorePageProps = {
  backingStores?: FirehoseResult<K8sResourceKind[]>;
  dispatcher: React.Dispatch<Action>;
  state: State;
  namespace: string;
};
