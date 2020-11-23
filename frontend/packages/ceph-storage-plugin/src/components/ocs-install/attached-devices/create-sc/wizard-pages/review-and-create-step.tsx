import * as React from 'react';
import { pluralize, TextContent, Text, TextVariants } from '@patternfly/react-core';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { getName } from '@console/shared';
import { VALIDATIONS, ValidationMessage } from '../../../../../utils/common-ocs-install-el';
import { getNodeInfo } from '../../../../../utils/install';
import { MINIMUM_NODES, NetworkTypeLabels } from '../../../../../constants';
import { State } from '../state';
import {
  ReviewListTitle,
  ReviewListBody,
  NodesCard,
  RequestErrors,
} from '../../../install-wizard/review-and-create';
import { NetworkType } from '../../../types';

export const ReviewAndCreate: React.FC<ReviewAndCreateProps> = ({
  state,
  errorMessage,
  inProgress,
}) => {
  const { nodes, encryption, enableMinimal, storageClass, kms, networkType, publicNetwork } = state;
  const { cpu, memory, zones } = getNodeInfo(state.nodes);
  const scName = getName(storageClass);
  const emptyRequiredField = nodes.length < MINIMUM_NODES && !scName && !memory && !cpu;

  return (
    <>
      <TextContent className="ocs-install-wizard__text-content">
        <Text component={TextVariants.h2}>Review storage cluster</Text>
      </TextContent>
      <dl>
        <ReviewListTitle text="Storage and nodes" />
        <ReviewListBody noValue={nodes.length < MINIMUM_NODES || !scName}>
          <div>
            <p>
              {pluralize(nodes.length, 'node')} selected based on the created storage class:&nbsp;
              <span className="text-muted">{scName ?? 'None'}</span>
            </p>
            <NodesCard nodes={nodes} />
          </div>
        </ReviewListBody>
        <ReviewListBody
          validation={enableMinimal && !emptyRequiredField && VALIDATIONS.MINIMAL}
          noValue={!cpu || !memory}
        >
          <p>
            Total CPU and memory of {cpu} CPU and {humanizeBinaryBytes(memory).string}
          </p>
        </ReviewListBody>
        <ReviewListBody noValue={!zones.size}>
          <p>{pluralize(zones.size, 'zone')}</p>
        </ReviewListBody>
        <ReviewListTitle text="Configure" />
        {(encryption.clusterWide || encryption.storageClass) && (
          <ReviewListBody>
            <p className="ocs-install-wizard__review-encryption">Enable Encryption</p>
            {encryption.advanced && kms.hasHandled && (
              <p>Connected to external key management service: {kms.name}</p>
            )}
          </ReviewListBody>
        )}
        <ReviewListBody
          validation={networkType === NetworkType.MULTUS && !publicNetwork && VALIDATIONS.NETWORK}
        >
          <p>Using {NetworkTypeLabels[networkType]}</p>
        </ReviewListBody>
      </dl>
      {emptyRequiredField && (
        <ValidationMessage
          className="ocs-install-wizard__review-alert"
          validation={VALIDATIONS.ALLREQUIREDFIELDS}
        />
      )}
      <RequestErrors errorMessage={errorMessage} inProgress={inProgress} />
    </>
  );
};

type ReviewAndCreateProps = {
  errorMessage: string;
  inProgress: boolean;
  state: State;
};
