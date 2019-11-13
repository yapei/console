import * as _ from 'lodash-es';

export enum ProjectQueries {
  CPU_USAGE = 'CPU_USAGE',
  MEMORY_USAGE = 'MEMORY_USAGE',
  POD_COUNT = 'POD_COUNT',
  PODS_BY_CPU = 'PODS_BY_CPU',
  PODS_BY_MEMORY = 'PODS_BY_MEMORY',
  PODS_BY_FILESYSTEM = 'PODS_BY_FILESYSTEM',
  PODS_BY_NETWORK = 'PODS_BY_NETWORK',
  FILESYSTEM_USAGE = 'FILESYSTEM_USAGE',
  NETWORK_IN_OUT_USAGE = 'NETWORK_IN_OUT_USAGE',
}

const queries = {
  [ProjectQueries.CPU_USAGE]: _.template(
    `namespace:container_cpu_usage:sum{namespace='<%= project %>'}`,
  ),
  [ProjectQueries.MEMORY_USAGE]: _.template(
    `sum(container_memory_working_set_bytes{namespace='<%= project %>',container="",pod!=""}) BY (namespace)`,
  ),
  [ProjectQueries.POD_COUNT]: _.template(
    `count(kube_pod_info{namespace='<%= project %>'}) BY (namespace)`,
  ),
  [ProjectQueries.FILESYSTEM_USAGE]: _.template(
    `sum(pod:container_fs_usage_bytes:sum{container="",pod!="",namespace='<%= project %>'}) BY (namespace)`,
  ),
  [ProjectQueries.NETWORK_IN_OUT_USAGE]: _.template(
    `sum(rate(container_network_receive_bytes_total{container="POD",pod!="",namespace='<%= project %>'}[5m]) + rate(container_network_transmit_bytes_total{container="POD",pod!="",namespace='<%= project %>'}[5m])) BY (namespace)`,
  ),
};

const top25Queries = {
  [ProjectQueries.PODS_BY_CPU]: _.template(
    `topk(25, sort_desc(sum(avg_over_time(pod:container_cpu_usage:sum{container="",pod!="",namespace='<%= project %>'}[5m])) BY (pod, namespace)))`,
  ),
  [ProjectQueries.PODS_BY_MEMORY]: _.template(
    `topk(25, sort_desc(sum(avg_over_time(container_memory_working_set_bytes{container="",pod!="",namespace='<%= project %>'}[5m])) BY (pod, namespace)))`,
  ),
  [ProjectQueries.PODS_BY_FILESYSTEM]: _.template(
    `topk(25, sort_desc(sum(pod:container_fs_usage_bytes:sum{container="",pod!="",namespace='<%= project %>'}) BY (pod, namespace)))`,
  ),
  [ProjectQueries.PODS_BY_NETWORK]: _.template(
    `topk(25, sort_desc(sum(rate(container_network_receive_bytes_total{ container="POD", pod!= "", namespace = '<%= project %>'}[5m]) + rate(container_network_transmit_bytes_total{ container="POD", pod!= "", namespace = '<%= project %>'}[5m])) BY (namespace, pod)))`,
  ),
};

export const getUtilizationQueries = (project: string) => ({
  [ProjectQueries.CPU_USAGE]: queries[ProjectQueries.CPU_USAGE]({ project }),
  [ProjectQueries.MEMORY_USAGE]: queries[ProjectQueries.MEMORY_USAGE]({ project }),
  [ProjectQueries.POD_COUNT]: queries[ProjectQueries.POD_COUNT]({ project }),
  [ProjectQueries.FILESYSTEM_USAGE]: queries[ProjectQueries.FILESYSTEM_USAGE]({
    project,
  }),
  [ProjectQueries.NETWORK_IN_OUT_USAGE]: queries[ProjectQueries.NETWORK_IN_OUT_USAGE]({
    project,
  }),
});

export const getTopConsumerQueries = (project: string) => ({
  [ProjectQueries.PODS_BY_CPU]: top25Queries[ProjectQueries.PODS_BY_CPU]({ project }),
  [ProjectQueries.PODS_BY_MEMORY]: top25Queries[ProjectQueries.PODS_BY_MEMORY]({ project }),
  [ProjectQueries.PODS_BY_FILESYSTEM]: top25Queries[ProjectQueries.PODS_BY_FILESYSTEM]({ project }),
  [ProjectQueries.PODS_BY_NETWORK]: top25Queries[ProjectQueries.PODS_BY_NETWORK]({ project }),
});
