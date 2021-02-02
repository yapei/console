import * as React from 'react';
import { match } from 'react-router-dom';
import * as _ from 'lodash-es';

import { getBadgeFromType } from '@console/shared';
import {
  useExtensions,
  ResourceTabPage,
  isResourceTabPage,
  isDetailPageBreadCrumbs,
  DetailPageBreadCrumbs,
} from '@console/plugin-sdk';
import {
  ResolvedExtension,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import {
  Firehose,
  HorizontalNav,
  PageHeading,
  FirehoseResource,
  KebabOptionsCreator,
  Page,
  AsyncComponent,
  PageComponentProps,
} from '../utils';
import {
  K8sResourceKindReference,
  K8sResourceKind,
  K8sKind,
  referenceForModel,
  referenceFor,
  modelFor,
} from '../../module/k8s';
import { ErrorBoundaryFallback } from '../error';
import { breadcrumbsForDetailsPage } from '../utils/breadcrumbs';
import DetailsBreadcrumbResolver from './details-breadcrumb-resolver';

const useBreadCrumbsForDetailPage = (kind: string): ResolvedExtension<DetailPageBreadCrumbs> => {
  const [breadCrumbsExtension, breadCrumbsResolved] = useResolvedExtensions<DetailPageBreadCrumbs>(
    isDetailPageBreadCrumbs,
  );
  return React.useMemo(
    () =>
      breadCrumbsResolved
        ? breadCrumbsExtension.find(({ properties: { getModels } }) => {
            const models = getModels();
            return Array.isArray(models)
              ? models.findIndex((model: K8sKind) => referenceForModel(model) === kind) !== -1
              : referenceForModel(models) === kind;
          })
        : undefined,
    [breadCrumbsResolved, breadCrumbsExtension, kind],
  );
};

export const DetailsPage = withFallback<DetailsPageProps>(({ pages = [], ...props }) => {
  const resourceKeys = _.map(props.resources, 'prop');
  const [pluginBreadcrumbs, setPluginBreadcrumbs] = React.useState(undefined);
  const renderAsyncComponent = (page: ResourceTabPage, cProps: PageComponentProps) => (
    <AsyncComponent loader={page.properties.loader} {...cProps} />
  );

  const resourcePageExtensions = useExtensions<ResourceTabPage>(isResourceTabPage);

  const pluginPages = React.useMemo(
    () =>
      resourcePageExtensions
        .filter(
          (p) =>
            referenceForModel(p.properties.model) ===
            (props.kindObj ? referenceFor(props.kindObj) : props.kind),
        )
        .map((p) => ({
          href: p.properties.href,
          name: p.properties.name,
          component: (cProps) => renderAsyncComponent(p, cProps),
        })),
    [resourcePageExtensions, props],
  );
  const kind = props.kindObj
    ? referenceForModel(props.kindObj)
    : referenceForModel(modelFor(props.kind));
  const resolvedBreadcrumbExtension = useBreadCrumbsForDetailPage(kind);
  const onBreadcrumbsResolved = React.useCallback((breadcrumbs) => {
    setPluginBreadcrumbs(breadcrumbs ? () => breadcrumbs : undefined);
  }, []);
  let allPages = [...pages, ...pluginPages];
  allPages = allPages.length ? allPages : null;

  return (
    <>
      {resolvedBreadcrumbExtension && (
        <DetailsBreadcrumbResolver
          useBreadcrumbs={resolvedBreadcrumbExtension.properties.breadcrumbsProvider}
          onBreadcrumbsResolved={onBreadcrumbsResolved}
          urlMatch={props.match}
          kind={kind}
        />
      )}
      <Firehose
        resources={[
          {
            kind: props.kind,
            kindObj: props.kindObj,
            name: props.name,
            namespace: props.namespace,
            isList: false,
            prop: 'obj',
          } as FirehoseResource,
        ].concat(props.resources || [])}
      >
        <PageHeading
          detail={true}
          title={props.title || props.name}
          titleFunc={props.titleFunc}
          menuActions={props.menuActions}
          buttonActions={props.buttonActions}
          kind={props.customKind || props.kind}
          breadcrumbs={pluginBreadcrumbs}
          breadcrumbsFor={
            props.breadcrumbsFor
              ? props.breadcrumbsFor
              : !pluginBreadcrumbs
              ? breadcrumbsForDetailsPage(props.kindObj, props.match)
              : undefined
          }
          resourceKeys={resourceKeys}
          getResourceStatus={props.getResourceStatus}
          customData={props.customData}
          badge={props.badge || getBadgeFromType(props.kindObj && props.kindObj.badge)}
          icon={props.icon}
        >
          {props.children}
        </PageHeading>
        <HorizontalNav
          pages={allPages}
          pagesFor={props.pagesFor}
          className={`co-m-${_.get(props.kind, 'kind', props.kind)}`}
          match={props.match}
          label={props.label || (props.kind as any).label}
          resourceKeys={resourceKeys}
          customData={props.customData}
        />
      </Firehose>
    </>
  );
}, ErrorBoundaryFallback);

export type DetailsPageProps = {
  match: match<any>;
  title?: string | JSX.Element;
  titleFunc?: (obj: K8sResourceKind) => string | JSX.Element;
  menuActions?: Function[] | KebabOptionsCreator; // FIXME should be "KebabAction[] |" refactor pipeline-actions.tsx, etc.
  buttonActions?: any[];
  pages?: Page[];
  pagesFor?: (obj: K8sResourceKind) => Page[];
  kind: K8sResourceKindReference;
  kindObj?: K8sKind;
  label?: string;
  name?: string;
  namespace?: string;
  resources?: FirehoseResource[];
  breadcrumbsFor?: (obj: K8sResourceKind) => { name: string; path: string }[];
  customData?: any;
  badge?: React.ReactNode;
  icon?: React.ComponentType<{ obj: K8sResourceKind }>;
  getResourceStatus?: (resource: K8sResourceKind) => string;
  children?: React.ReactNode;
  customKind?: string;
};

DetailsPage.displayName = 'DetailsPage';
