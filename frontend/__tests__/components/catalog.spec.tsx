import * as React from 'react';
import * as _ from 'lodash-es';
import { mount, ReactWrapper } from 'enzyme';
import { Provider } from 'react-redux';

import {
  FilterSidePanelCategoryItem,
  VerticalTabsTab,
} from '@patternfly/react-catalog-view-extension';

import store from '@console/internal/redux';
import {
  CatalogListPage,
  CatalogListPageProps,
  CatalogListPageState,
} from '../../public/components/catalog/catalog-page';
import {
  catalogCategories as initCatalogCategories,
  groupItems,
  CatalogTileViewPage,
} from '../../public/components/catalog/catalog-items';
import {
  catalogListPageProps,
  catalogItems,
  catalogCategories,
} from '../../__mocks__/catalogItemsMocks';
import { developerCatalogItems, groupedByOperator } from './catalog-data';
import { categorizeItems } from '../../public/components/utils/tile-view-page';
import { Dropdown } from '../../public/components/utils';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('react-router-dom', () => ({
  ...require.requireActual('react-router-dom'),
  useLocation: () => ({ location: 'https://abcd.com', search: 'foo=bar&a=b' }),
}));

describe(CatalogTileViewPage.displayName, () => {
  let wrapper: ReactWrapper<CatalogListPageProps, CatalogListPageState>;

  beforeEach(() => {
    wrapper = mount(<CatalogListPage {...catalogListPageProps} />, {
      wrappingComponent: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  });

  it('renders main and sub category tabs', () => {
    const tabs = wrapper.find(VerticalTabsTab);

    expect(tabs.exists()).toBe(true);
    expect(tabs.length).toEqual(20); // 'All' through 'Other', plus subcategories
  });

  it('renders category filter controls', () => {
    const filterItems = wrapper.find<any>(FilterSidePanelCategoryItem);
    expect(filterItems.exists()).toBe(true);
    expect(filterItems.length).toEqual(5); // Filter by Types
    expect(filterItems.at(0).props().count).toBe(0); // total count for Operator Backed
    expect(filterItems.at(0).props().checked).toBe(true); // Check operator backed filter is true by default
    expect(filterItems.at(1).props().count).toBe(2); // total count for Helm Charts
    expect(filterItems.at(1).props().checked).toBe(false); // Check Helm Charts filter is true by default
    expect(filterItems.at(2).props().count).toBe(9); // total count for templates
    expect(filterItems.at(2).props().checked).toBe(false); // filter templates should be false by default
    expect(filterItems.at(3).props().count).toBe(2); // total count for imagestreams
    expect(filterItems.at(3).props().checked).toBe(false); // filter imagestreams should be false by default
    expect(filterItems.at(4).props().count).toBe(12); // total count for clusterServiceClasses
    expect(filterItems.at(4).props().checked).toBe(false); // filter clusterServiceClasses should be false by default
  });

  it('categorizes catalog items', () => {
    const categories = categorizeItems(
      catalogItems,
      (itemsToSort) => _.sortBy(itemsToSort, 'tileName'),
      initCatalogCategories,
    );
    expect(_.keys(categories).length).toEqual(_.keys(catalogCategories).length);
    _.each(_.keys(categories), (key) => {
      const category = categories[key];
      expect(category.numItems).toEqual(catalogCategories[key].numItems);
      if (category.subcategories) {
        expect(category.subcategories.length).toEqual(catalogCategories[key].subcategories.length);
      }
      _.each(_.keys(category.subcategories), (subKey) => {
        const subcategory = category.subcategories[subKey];
        expect(subcategory.numItems).toEqual(catalogCategories[key].subcategories[subKey].numItems);
      });
    });
  });

  it('should render the group-by dropdown', () => {
    expect(wrapper.find(Dropdown).exists()).toBe(true);
    expect(wrapper.find(Dropdown).props().titlePrefix).toBe('Group By');
    expect(wrapper.find(Dropdown).props().items).toEqual({ Operator: 'Operator', None: 'None' });
  });

  it('should group catalog items by Operator', () => {
    const groupedByOperatorResult = groupItems(developerCatalogItems, 'Operator');
    expect(groupedByOperatorResult).toEqual(groupedByOperator);
  });

  it('should not group the items when None is selected in the Group By Dropdown', () => {
    const groupedByTypeResult = groupItems(developerCatalogItems, 'None');
    expect(groupedByTypeResult).toEqual(developerCatalogItems);
  });
});
