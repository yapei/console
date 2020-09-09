import * as React from 'react';
import * as _ from 'lodash';
import { match } from 'react-router';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import { ActionGroup, Button, Form, FormGroup } from '@patternfly/react-core';
import {
  NodeKind,
  k8sPatch,
  k8sCreate,
  referenceForModel,
  StorageClassResourceKind,
} from '@console/internal/module/k8s';
import { NodeModel } from '@console/internal/models';
import { getName, hasLabel } from '@console/shared';
import {
  withHandlePromise,
  HandlePromiseProps,
  history,
  FieldLevelHelp,
  ButtonBar,
} from '@console/internal/components/utils';
import { setFlag } from '@console/internal/actions/features';
import { labelTooltip, minSelectedNode, defaultRequestSize } from '../../constants/ocs-install';
import { OCSServiceModel } from '../../models';
import { OSDSizeDropdown } from '../../utils/osd-size-dropdown';
import { cephStorageLabel } from '../../selectors';
import NodeTable from './node-list';
import { OCS_FLAG, OCS_CONVERGED_FLAG, OCS_INDEPENDENT_FLAG } from '../../features';
import { getOCSRequestData } from './ocs-request-data';
import {
  OCSAlert,
  SelectNodesSection,
  StorageClassSection,
  EncryptSection,
  MinimalDeploymentAlert,
} from '../../utils/common-ocs-install-el';
import { filterSCWithoutNoProv, shouldDeployInternalAsMinimal } from '../../utils/install';
import { OCS_INTERNAL_CR_NAME } from '../../constants';
import './ocs-install.scss';

export const makeLabelNodesRequest = (selectedNodes: NodeKind[]): Promise<NodeKind>[] => {
  const patch = [
    {
      op: 'add',
      path: '/metadata/labels/cluster.ocs.openshift.io~1openshift-storage',
      value: '',
    },
  ];
  return _.reduce(
    selectedNodes,
    (accumulator, node) => {
      return hasLabel(node, cephStorageLabel)
        ? accumulator
        : [...accumulator, k8sPatch(NodeModel, node, patch)];
    },
    [],
  );
};

const makeOCSRequest = (
  selectedData: NodeKind[],
  storageClass: StorageClassResourceKind,
  osdSize: string,
  isEncrypted: boolean,
  isMinimal?: boolean,
): Promise<any> => {
  const promises = makeLabelNodesRequest(selectedData);
  const scName = getName(storageClass);
  const ocsObj = getOCSRequestData(scName, osdSize, isEncrypted, null, isMinimal);

  return Promise.all(promises).then(() => {
    if (!scName) {
      throw new Error('No StorageClass selected');
    }
    return k8sCreate(OCSServiceModel, ocsObj);
  });
};

export const CreateInternalCluster = withHandlePromise<
  CreateInternalClusterProps & HandlePromiseProps
>((props) => {
  const {
    handlePromise,
    errorMessage,
    inProgress,
    match: {
      params: { appName, ns },
    },
  } = props;
  const [osdSize, setOSDSize] = React.useState(defaultRequestSize.NON_BAREMETAL);
  const [storageClass, setStorageClass] = React.useState<StorageClassResourceKind>(null);
  const [isEncrypted, setEncrypted] = React.useState(true);
  const dispatch = useDispatch();
  const [nodes, setNodes] = React.useState<NodeKind[]>([]);

  const isMinimal = shouldDeployInternalAsMinimal(nodes);
  const [showMessage, setShowMessage] = React.useState(false);

  const timeoutID = React.useRef(null);

  React.useEffect(() => {
    if (timeoutID.current !== null) {
      clearTimeout(timeoutID.current);
    }
    if (nodes.length >= minSelectedNode) {
      timeoutID.current = setTimeout(() => {
        setShowMessage(true);
      }, 1000);
    } else {
      setShowMessage(false);
    }
  }, [nodes, setShowMessage]);

  const submit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // eslint-disable-next-line promise/catch-or-return
    handlePromise(makeOCSRequest(nodes, storageClass, osdSize, isEncrypted, isMinimal), () => {
      dispatch(setFlag(OCS_CONVERGED_FLAG, true));
      dispatch(setFlag(OCS_INDEPENDENT_FLAG, false));
      dispatch(setFlag(OCS_FLAG, true));
      history.push(
        `/k8s/ns/${ns}/clusterserviceversions/${appName}/${referenceForModel(
          OCSServiceModel,
        )}/${OCS_INTERNAL_CR_NAME}`,
      );
    });
  };

  const handleStorageClass = (sc: StorageClassResourceKind) => {
    setStorageClass(sc);
    setOSDSize(defaultRequestSize.NON_BAREMETAL);
  };

  const filterSC = React.useCallback(filterSCWithoutNoProv, []);

  return (
    <div className="co-m-pane__body">
      <OCSAlert />
      <Form className="co-m-pane__body-group">
        <StorageClassSection handleStorageClass={handleStorageClass} filterSC={filterSC} />
        <FormGroup
          fieldId="select-osd-size"
          label={
            <>
              OCS Service Capacity
              <FieldLevelHelp>{labelTooltip}</FieldLevelHelp>
            </>
          }
        >
          <OSDSizeDropdown
            className="ceph-ocs-install__ocs-service-capacity--dropdown"
            selectedKey={osdSize}
            onChange={setOSDSize}
            data-test-id="osd-dropdown"
          />
        </FormGroup>
        <EncryptSection onToggle={setEncrypted} isChecked={isEncrypted} />
        <h3 className="co-m-pane__heading co-m-pane__heading--baseline ceph-ocs-install__pane--margin">
          <div className="co-m-pane__name">Nodes</div>
        </h3>
        <SelectNodesSection
          table={NodeTable}
          customData={{
            onRowSelected: setNodes,
          }}
        >
          <>
            <div>
              Select at least 3 nodes in different zones you wish to use with a recommended
              requirement of 14 CPUs and 34GiB RAM per node.
            </div>
            <div className="text-muted ceph-ocs-install__minimal-msg">
              A minimal deployment is also available if needed with the requirements of 8 CPUs and
              32 GiB RAM.
            </div>
          </>
        </SelectNodesSection>
        <>{isMinimal && showMessage && <MinimalDeploymentAlert isInternalMode />}</>
        <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
          <ActionGroup className="pf-c-form">
            <Button
              type="button"
              variant="primary"
              onClick={submit}
              isDisabled={(nodes?.length ?? 0) < minSelectedNode}
            >
              Create
            </Button>
            <Button type="button" variant="secondary" onClick={history.goBack}>
              Cancel
            </Button>
          </ActionGroup>
        </ButtonBar>
      </Form>
    </div>
  );
});

type CreateInternalClusterProps = {
  match: match<{ appName: string; ns: string }>;
};
