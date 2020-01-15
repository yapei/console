import * as React from 'react';
import { Modal } from 'patternfly-react';
import { Button } from '@patternfly/react-core';
import {
  CatalogItemHeader,
  PropertiesSidePanel,
  PropertyItem,
} from '@patternfly/react-catalog-view-extension';
import { Link } from 'react-router-dom';
import { history, ExternalLink, HintBlock } from '@console/internal/components/utils';
import { RH_OPERATOR_SUPPORT_POLICY_LINK } from '@console/shared';
import { MarkdownView } from '../clusterserviceversion';
import { SubscriptionModel } from '../../models';
import { OperatorHubItem } from './index';

export const OperatorHubItemDetails: React.SFC<OperatorHubItemDetailsProps> = ({
  item,
  closeOverlay,
  namespace,
}) => {
  if (!item) {
    return null;
  }
  const {
    name,
    installed,
    iconClass,
    imgUrl,
    provider,
    providerType,
    longDescription,
    description,
    version,
    repository,
    containerImage,
    createdAt,
    support,
    catalogSource,
    catalogSourceNamespace,
  } = item;
  const notAvailable = <span className="properties-side-panel-pf-property-label">N/A</span>;

  const getHintBlock = () => {
    if (installed) {
      return (
        <HintBlock title="Installed Operator">
          <p>
            This Operator has been installed on the cluster.{' '}
            <Link
              to={`/k8s/${namespace ? `ns/${namespace}` : 'all-namespaces'}/clusterserviceversions`}
            >
              View it here.
            </Link>
          </p>
        </HintBlock>
      );
    }

    if (providerType === 'Community') {
      return (
        <HintBlock title="Community Operator">
          <p>
            This is a community provided operator. These are operators which have not been vetted or
            verified by Red Hat. Community Operators should be used with caution because their
            stability is unknown. Red Hat provides no support for Community Operators.
          </p>
          {RH_OPERATOR_SUPPORT_POLICY_LINK && (
            <span className="co-modal-ignore-warning__link">
              <ExternalLink
                href={RH_OPERATOR_SUPPORT_POLICY_LINK}
                text="Learn more about Red Hat’s third party software support policy"
              />
            </span>
          )}
        </HintBlock>
      );
    }

    return null;
  };

  const createLink = `/operatorhub/subscribe?pkg=${
    item.obj.metadata.name
  }&catalog=${catalogSource}&catalogNamespace=${catalogSourceNamespace}&targetNamespace=${namespace}`;
  const uninstallLink = () =>
    `/k8s/ns/${item.subscription.metadata.namespace}/${SubscriptionModel.plural}/${
      item.subscription.metadata.name
    }?showDelete=true`;

  return (
    <>
      <Modal.Header>
        <Modal.CloseButton onClick={closeOverlay} />
        <CatalogItemHeader
          iconClass={iconClass}
          iconImg={imgUrl}
          title={name}
          vendor={`${version} provided by ${provider}`}
        />
      </Modal.Header>
      <Modal.Body>
        <div className="modal-body-content">
          <div className="modal-body-inner-shadow-covers">
            <div className="co-catalog-page__overlay-body">
              <PropertiesSidePanel>
                {!installed ? (
                  <Link
                    className="pf-c-button pf-m-primary co-catalog-page__overlay-create"
                    to={createLink}
                  >
                    Install
                  </Link>
                ) : (
                  <Button
                    className="co-catalog-page__overlay-create"
                    isDisabled={!installed}
                    onClick={() => history.push(uninstallLink())}
                    variant="secondary"
                  >
                    Uninstall
                  </Button>
                )}
                <PropertyItem label="Operator Version" value={version || notAvailable} />
                <PropertyItem label="Provider Type" value={providerType || notAvailable} />
                <PropertyItem label="Provider" value={provider || notAvailable} />
                <PropertyItem label="Repository" value={repository || notAvailable} />
                <PropertyItem label="Container Image" value={containerImage || notAvailable} />
                <PropertyItem label="Created At" value={createdAt || notAvailable} />
                <PropertyItem label="Support" value={support || notAvailable} />
              </PropertiesSidePanel>
              <div className="co-catalog-page__overlay-description">
                {getHintBlock()}
                {longDescription ? <MarkdownView content={longDescription} /> : description}
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
    </>
  );
};

OperatorHubItemDetails.defaultProps = {
  item: null,
};

export type OperatorHubItemDetailsProps = {
  namespace?: string;
  item: OperatorHubItem;
  closeOverlay: () => void;
};

OperatorHubItemDetails.displayName = 'OperatorHubItemDetails';
