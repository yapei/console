import * as React from 'react';
import { NavItemSeparator, NavGroup, Button } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import {
  useExtensions,
  NavSection as PluginNavSection,
  NavItem,
  SeparatorNavItem,
  isNavSection,
  isNavItem,
  isSeparatorNavItem,
} from '@console/plugin-sdk';
import { useActivePerspective, usePinnedResources } from '@console/shared';
import { modelFor, referenceForModel } from '../../module/k8s';
import { getSortedNavItems } from './navSortUtils';
import confirmNavUnpinModal from './confirmNavUnpinModal';
import { NavSection } from './section';
import AdminNav from './admin-nav';
import {
  createLink,
  NavLinkComponent,
  ResourceClusterLink,
  ResourceNSLink,
  RootNavLink,
} from './items';

import './_perspective-nav.scss';

const getLabelForResource = (resource: string): string => {
  const model = modelFor(resource);
  return model ? model.labelPlural : '';
};

const PerspectiveNav: React.FC<{}> = () => {
  const [perspective] = useActivePerspective();
  const allItems = useExtensions<PluginNavSection | NavItem | SeparatorNavItem>(
    isNavSection,
    isNavItem,
  );
  const [pinnedResources, setPinnedResources, pinnedResourcesLoaded] = usePinnedResources();
  const orderedNavItems = React.useMemo(() => {
    const topLevelItems = allItems.filter(
      (s) => s.properties.perspective === perspective && !(s as NavItem).properties.section,
    );
    return getSortedNavItems(topLevelItems);
  }, [allItems, perspective]);

  const unPin = (e: React.MouseEvent<HTMLButtonElement>, resource: string) => {
    e.preventDefault();
    e.stopPropagation();
    confirmNavUnpinModal(resource, pinnedResources, setPinnedResources);
  };

  // Until admin perspective is contributed through extensions, simply render static `AdminNav`
  if (perspective === 'admin') {
    return <AdminNav />;
  }

  const getPinnedItems = (rootNavLink: boolean = false): React.ReactElement[] =>
    pinnedResourcesLoaded
      ? pinnedResources
          .map((resource) => {
            const model = modelFor(resource);
            if (!model) {
              return null;
            }
            const { labelPlural, apiVersion, apiGroup, namespaced, crd, plural } = model;
            const duplicates =
              pinnedResources.filter((res) => getLabelForResource(res) === labelPlural).length > 1;
            const props = {
              key: `pinned-${resource}`,
              name: labelPlural,
              resource: crd ? referenceForModel(model) : plural,
              tipText: duplicates ? `${labelPlural}: ${apiGroup || 'core'}/${apiVersion}` : null,
              id: resource,
            };
            const Component: NavLinkComponent = namespaced ? ResourceNSLink : ResourceClusterLink;
            const removeButton = (
              <Button
                className="oc-nav-pinned-item__unpin-button"
                variant="link"
                aria-label="Unpin"
                onClick={(e) => unPin(e, resource)}
              >
                <MinusCircleIcon className="oc-nav-pinned-item__icon" />
              </Button>
            );

            return rootNavLink ? (
              <RootNavLink
                key={resource}
                className="oc-nav-pinned-item"
                component={Component}
                {...props}
              >
                {removeButton}
              </RootNavLink>
            ) : (
              <Component key={resource} className="oc-nav-pinned-item" {...props}>
                {removeButton}
              </Component>
            );
          })
          .filter((p) => p !== null)
      : [];

  return (
    <>
      {orderedNavItems.map((item, index) => {
        if (isNavSection(item)) {
          const { id, name } = item.properties;
          return <NavSection id={id} title={name} key={id} isGrouped={!name} />;
        }
        if (isNavItem(item)) {
          return createLink(item, true);
        }
        if (isSeparatorNavItem(item)) {
          return <NavItemSeparator key={`separator-${index}`} />;
        }
      })}
      {pinnedResourcesLoaded && pinnedResources?.length ? (
        <NavGroup className="oc-nav-group" title="" key="group-pins">
          {getPinnedItems(true)}
        </NavGroup>
      ) : null}
    </>
  );
};

export default PerspectiveNav;
