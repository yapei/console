import * as _ from 'lodash';
import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { CloseIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

import { definitionFor } from '../../module/k8s';
import { ResourceSidebarSnippets, ResourceSidebarSamples } from './resource-sidebar-samples';
import { ExploreType } from './explore-type-sidebar';
import { SimpleTabNav, Tab } from '../utils';

const sidebarScrollTop = () => {
  document.getElementsByClassName('co-p-has-sidebar__sidebar')[0].scrollTop = 0;
};

const ResourceSidebarWrapper = (props) => {
  const { t } = useTranslation();
  const { label, children, toggleSidebar } = props;

  return (
    <div
      className="co-p-has-sidebar__sidebar co-p-has-sidebar__sidebar--bordered hidden-sm hidden-xs"
      data-test="resource-sidebar"
    >
      {/* tabIndex is necessary to restore keyboard scrolling as a result of PatternFly's <Page> having a hard-coded tabIndex.  See https://github.com/patternfly/patternfly-react/issues/4180 */}
      <div className="co-m-pane__body co-p-has-sidebar__sidebar-body" tabIndex={-1}>
        <Button
          type="button"
          className="co-p-has-sidebar__sidebar-close"
          variant="plain"
          aria-label={t('public~Close')}
          onClick={toggleSidebar}
        >
          <CloseIcon />
        </Button>
        <h2 className="co-p-has-sidebar__sidebar-heading text-capitalize">{label}</h2>
        {children}
      </div>
    </div>
  );
};

const ResourceSchema = ({ kindObj, schema }) => (
  <ExploreType kindObj={kindObj} schema={schema} scrollTop={sidebarScrollTop} />
);

const ResourceSamples = ({ samples, kindObj, downloadSampleYaml, loadSampleYaml }) => (
  <ResourceSidebarSamples
    samples={samples}
    kindObj={kindObj}
    downloadSampleYaml={downloadSampleYaml}
    loadSampleYaml={loadSampleYaml}
  />
);

const ResourceSnippets = ({ snippets, insertSnippetYaml }) => (
  <ResourceSidebarSnippets snippets={snippets} insertSnippetYaml={insertSnippetYaml} />
);

export const ResourceSidebar = (props) => {
  const { t } = useTranslation();
  const {
    downloadSampleYaml,
    kindObj,
    schema,
    sidebarLabel,
    loadSampleYaml,
    insertSnippetYaml,
    toggleSidebar,
    samples,
    snippets,
  } = props;
  if (!kindObj && !schema) {
    return null;
  }

  const kindLabel = kindObj?.labelKey ? t(kindObj.labelKey) : kindObj?.label;
  const label = sidebarLabel ? sidebarLabel : kindLabel;

  const showSamples = !_.isEmpty(samples);
  const showSnippets = !_.isEmpty(snippets);

  const definition = kindObj ? definitionFor(kindObj) : { properties: [] };
  const showSchema = schema || (definition && !_.isEmpty(definition.properties));

  let tabs: Tab[] = [];
  if (showSamples) {
    tabs.push({
      name: t('public~Samples'),
      component: ResourceSamples,
    });
  }
  if (showSnippets) {
    tabs.push({
      name: t('public~Snippets'),
      component: ResourceSnippets,
    });
  }
  if (showSchema) {
    tabs = [
      {
        name: t('public~Schema'),
        component: ResourceSchema,
      },
      ...tabs,
    ];
  }

  return (
    <ResourceSidebarWrapper label={label} toggleSidebar={toggleSidebar}>
      {tabs.length > 0 ? (
        <SimpleTabNav
          tabs={tabs}
          tabProps={{
            downloadSampleYaml,
            kindObj,
            schema,
            loadSampleYaml,
            insertSnippetYaml,
            samples,
            snippets,
          }}
          additionalClassNames="co-m-horizontal-nav__menu--within-sidebar"
        />
      ) : (
        <ResourceSchema schema={schema} kindObj={kindObj} />
      )}
    </ResourceSidebarWrapper>
  );
};
