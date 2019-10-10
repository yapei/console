import * as React from 'react';
import * as _ from 'lodash-es';
import { withDashboardResources, DashboardItemProps } from '../with-dashboard-resources';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import UtilizationItem from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
import { humanizeCpuCores, humanizeDecimalBytes, humanizeNumber } from '../../utils';
import { getRangeVectorStats } from '../../graphs/utils';
import { PrometheusResponse } from '../../graphs';
import { ProjectDashboardContext } from './project-dashboard-context';
import { getName } from '@console/shared';
import { getUtilizationQueries, ProjectQueries } from './queries';

export const UtilizationCard = withDashboardResources(
  ({ watchPrometheus, stopWatchPrometheusQuery, prometheusResults }: DashboardItemProps) => {
    const { obj } = React.useContext(ProjectDashboardContext);
    const projectName = getName(obj);
    const queries = React.useMemo(() => getUtilizationQueries(projectName), [projectName]);
    React.useEffect(() => {
      if (projectName) {
        _.values(queries).forEach((query) => watchPrometheus(query, projectName));
        return () => {
          _.values(queries).forEach((query) => stopWatchPrometheusQuery(query));
        };
      }
    }, [watchPrometheus, stopWatchPrometheusQuery, queries, projectName]);

    const cpuUtilization = prometheusResults.getIn([
      queries[ProjectQueries.CPU_USAGE],
      'data',
    ]) as PrometheusResponse;
    const cpuError = prometheusResults.getIn([queries[ProjectQueries.CPU_USAGE], 'loadError']);
    const memoryUtilization = prometheusResults.getIn([
      queries[ProjectQueries.MEMORY_USAGE],
      'data',
    ]) as PrometheusResponse;
    const memoryError = prometheusResults.getIn([
      queries[ProjectQueries.MEMORY_USAGE],
      'loadError',
    ]);
    const podCount = prometheusResults.getIn([
      queries[ProjectQueries.POD_COUNT],
      'data',
    ]) as PrometheusResponse;
    const podCountError = prometheusResults.getIn([queries[ProjectQueries.POD_COUNT], 'loadError']);

    const cpuStats = getRangeVectorStats(cpuUtilization);
    const memoryStats = getRangeVectorStats(memoryUtilization);
    const podCountStats = getRangeVectorStats(podCount);

    return (
      <DashboardCard>
        <DashboardCardHeader>
          <DashboardCardTitle>Utilization Card</DashboardCardTitle>
        </DashboardCardHeader>
        <DashboardCardBody>
          <UtilizationBody timestamps={cpuStats.map((stat) => stat.x as Date)}>
            <UtilizationItem
              title="CPU"
              data={cpuStats}
              isLoading={!projectName || !cpuUtilization}
              humanizeValue={humanizeCpuCores}
              query={queries[ProjectQueries.CPU_USAGE]}
              error={cpuError}
            />
            <UtilizationItem
              title="Memory"
              data={memoryStats}
              isLoading={!projectName || !memoryUtilization}
              humanizeValue={humanizeDecimalBytes}
              query={queries[ProjectQueries.MEMORY_USAGE]}
              error={memoryError}
            />
            <UtilizationItem
              title="Pod count"
              data={podCountStats}
              isLoading={!projectName || !podCount}
              humanizeValue={humanizeNumber}
              query={queries[ProjectQueries.POD_COUNT]}
              error={podCountError}
            />
          </UtilizationBody>
        </DashboardCardBody>
      </DashboardCard>
    );
  },
);
