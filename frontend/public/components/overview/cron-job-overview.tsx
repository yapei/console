import * as React from 'react';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import {
  OverviewItem,
  usePluginsOverviewTabSection,
  useBuildConfigsWatcher,
  useJobsForCronJobWatcher,
} from '@console/shared';
import { CronJobModel } from '../../models';
import { CronJobKind } from '../../module/k8s';
import { menuActions } from '../cron-job';
import { DetailsItem, KebabAction, pluralize, ResourceSummary, Timestamp } from '../utils';
import { ResourceOverviewDetails } from './resource-overview-details';
import { PodsOverviewMultiple } from './pods-overview';
import { BuildOverview } from './build-overview';
import { JobsOverview } from './jobs-overview';

const CronJobOverviewDetails: React.SFC<CronJobOverviewDetailsProps> = ({
  item: { obj: cronjob },
}) => (
  <div className="overview__sidebar-pane-body resource-overview__body">
    <div className="resource-overview__pod-counts">
      <PodRingSet key={cronjob.metadata.uid} obj={cronjob} path="" />
    </div>
    <ResourceSummary resource={cronjob} showPodSelector>
      <DetailsItem label="Schedule" obj={cronjob} path="spec.schedule" />
      <DetailsItem label="Concurrency Policy" obj={cronjob} path="spec.concurrencyPolicy" />
      <DetailsItem
        label="Starting Deadline Seconds"
        obj={cronjob}
        path="spec.startingDeadlineSeconds"
      >
        {cronjob.spec.startingDeadlineSeconds
          ? pluralize(cronjob.spec.startingDeadlineSeconds, 'second')
          : 'Not Configured'}
      </DetailsItem>
      <DetailsItem label="Last Schedule Time" obj={cronjob} path="status.lastScheduleTime">
        <Timestamp timestamp={cronjob.status.lastScheduleTime} />
      </DetailsItem>
    </ResourceSummary>
  </div>
);

const CronJobResourcesTab: React.SFC<CronJobResourcesTabProps> = ({ item }) => {
  const { obj } = item;
  const pluginComponents = usePluginsOverviewTabSection(item);
  const { buildConfigs } = useBuildConfigsWatcher(obj);
  const { jobs } = useJobsForCronJobWatcher(obj);
  return (
    <div className="overview__sidebar-pane-body">
      <PodsOverviewMultiple obj={obj} podResources={jobs} />
      <JobsOverview jobs={jobs} obj={obj} />
      <BuildOverview buildConfigs={buildConfigs} />
      {pluginComponents.map(({ Component, key }) => (
        <Component key={key} item={item} />
      ))}
    </div>
  );
};

const tabs = [
  {
    name: 'Details',
    component: CronJobOverviewDetails,
  },
  {
    name: 'Resources',
    component: CronJobResourcesTab,
  },
];

export const CronJobOverview: React.SFC<CronJobOverviewProps> = ({ item, customActions }) => (
  <ResourceOverviewDetails
    item={item}
    kindObj={CronJobModel}
    menuActions={customActions ? [...customActions, ...menuActions] : menuActions}
    tabs={tabs}
  />
);

type CronJobOverviewDetailsProps = {
  item: OverviewItem<CronJobKind>;
};

type CronJobResourcesTabProps = {
  item: OverviewItem;
};

type CronJobOverviewProps = {
  item: OverviewItem;
  customActions?: KebabAction[];
};
