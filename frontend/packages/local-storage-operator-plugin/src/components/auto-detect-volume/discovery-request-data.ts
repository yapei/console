import { apiVersionForModel, K8sResourceCommon } from '@console/internal/module/k8s';
import { LocalVolumeDiscovery as AutoDetectVolumeModel } from '../../models';
import { DISCOVERY_CR_NAME, HOSTNAME_LABEL_KEY, LABEL_OPERATOR } from '../../constants';
import { getNodes, getHostNames } from '../../utils';
import { HostNamesMap } from './types';

export const getDiscoveryRequestData = ({
  nodeNamesForLVS,
  allNodeNamesOnADV,
  showNodesListOnADV,
  hostNamesMapForADV,
  ns,
}: {
  nodeNamesForLVS: string[];
  allNodeNamesOnADV: string[];
  showNodesListOnADV: boolean;
  hostNamesMapForADV: HostNamesMap;
  ns: string;
}): AutoDetectVolumeKind => {
  const nodes = getNodes(showNodesListOnADV, allNodeNamesOnADV, nodeNamesForLVS);
  return {
    apiVersion: apiVersionForModel(AutoDetectVolumeModel),
    kind: AutoDetectVolumeModel.kind,
    metadata: { name: DISCOVERY_CR_NAME, namespace: ns },
    spec: {
      nodeSelector: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: HOSTNAME_LABEL_KEY,
                operator: LABEL_OPERATOR,
                values: getHostNames(nodes, hostNamesMapForADV),
              },
            ],
          },
        ],
      },
    },
  };
};

type AutoDetectVolumeKind = K8sResourceCommon & {
  spec: {
    nodeSelector?: {
      nodeSelectorTerms: [
        {
          matchExpressions: [{ key: string; operator: string; values: string[] }];
        },
      ];
    };
  };
};
