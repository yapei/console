import { ProjectModel } from '@console/internal/models';
import { CapacityBreakdown, ServiceType, Metrics, Breakdown } from './constants';
import { NooBaaBucketClassModel } from './models';

export enum ObjectServiceDashboardQuery {
  ACCOUNTS_BY_IOPS = 'ACCOUNTS_BY_IOPS',
  ACCOUNTS_BY_LOGICAL_USAGE = 'ACCOUNTS_BY_LOGICAL_USAGE',
  BUCKETS_BY_OTHERS = 'BUCKETS_BY_OTHERS',
  BUCKETS_BY_USED = 'BUCKETS_BY_USED',
  BUCKETS_QUERY = 'BUCKETS_QUERY',
  BUCKETS_TOTAL_USED = 'BUCKETS_TOTAL_USED',
  BUCKET_CLASS_CAPACITY_USAGE_QUERY = 'BUCKET_CLASS_CAPACITY_USAGE_QUERY',
  CAPACITY_USAGE_BUCKET_CLASS_QUERY = 'CAPACITY_USAGE_BUCKET_CLASS_QUERY',
  CAPACITY_USAGE_PROJECT_QUERY = 'CAPACITY_USAGE_PROJECT_QUERY',
  NOOBAA_TOTAL_USED = 'NOOBAA_TOTAL_USED',
  NOOBAA_USED = 'NOOBAA_USED',
  OBJECT_STORAGE_TOTAL_USED = 'OBJECT_STORAGE_TOTAL_USED',
  PROJECTS_BY_USED = 'PROJECTS_BY_USED',
  PROJECTS_OTHERS = 'PROJECTS_OTHERS',
  PROJECTS_QUERY = 'PROJECTS_QUERY',
  PROJECTS_TOTAL_USED = 'PROJECTS_TOTAL_USED',
  PROJECT_CAPACITY_USAGE_QUERY = 'PROJECT_CAPACITY_USAGE_QUERY',
  PROVIDERS_BY_EGRESS = 'PROVIDERS_BY_EGRESS',
  PROVIDERS_BY_IOPS = 'PROVIDERS_BY_IOPS',
  PROVIDERS_BY_PHYSICAL_VS_LOGICAL_USAGE = 'PROVIDERS_BY_PHYSICAL_VS_LOGICAL_USAGE',
  RGW_TOTAL_USED = 'RGW_TOTAL_USED',
  RGW_USED = 'RGW_USED',
}

export enum DATA_RESILIENCE_QUERIES {
  REBUILD_PROGRESS_QUERY = 'NooBaa_rebuild_progress/100',
  REBUILD_TIME_QUERY = 'NooBaa_rebuild_time',
}

export enum ObjectDataReductionQueries {
  EFFICIENCY_QUERY = 'NooBaa_reduction_ratio',
  SAVINGS_QUERY = '(NooBaa_object_savings_logical_size - NooBaa_object_savings_physical_size)',
  LOGICAL_SAVINGS_QUERY = 'NooBaa_object_savings_logical_size',
}

export enum StatusCardQueries {
  HEALTH_QUERY = 'NooBaa_health_status',
  MCG_REBUILD_PROGRESS_QUERY = 'NooBaa_rebuild_progress',
  RGW_RESILIENCY_QUERY = '(sum(ceph_pool_metadata{name=~".*rgw.*"} *on (job, namesapce, pool_id) group_right(name) ceph_pg_clean) / sum(ceph_pool_metadata{name=~".*rgw.*"} *on (job, namesapce, pool_id) group_right(name) ceph_pg_total)) * 100 ',
}

export const CAPACITY_BREAKDOWN_QUERIES = {
  [ObjectServiceDashboardQuery.PROJECTS_BY_USED]: 'NooBaa_projects_capacity_usage',
  [ObjectServiceDashboardQuery.BUCKETS_BY_USED]: 'NooBaa_bucket_class_capacity_usage',
  [ObjectServiceDashboardQuery.NOOBAA_TOTAL_USED]: 'NooBaa_total_usage',
  [ObjectServiceDashboardQuery.RGW_TOTAL_USED]:
    'sum(ceph_pool_metadata{name=~".*rgw.*"} *on (job, namesapce, pool_id) group_right(name) ceph_pool_stored_raw) - sum(NooBaa_projects_capacity_usage)',
  [ObjectServiceDashboardQuery.OBJECT_STORAGE_TOTAL_USED]:
    'sum(ceph_pool_metadata{name=~".*rgw.*"} *on (job, namesapce, pool_id) group_right(name) ceph_pool_stored_raw)',
};

export const breakdownQueryMap = {
  [ServiceType.ALL]: {
    [CapacityBreakdown.Metrics.TOTAL]: {
      model: null,
      metric: '',
      queries: {
        [ObjectServiceDashboardQuery.NOOBAA_TOTAL_USED]: `sum(${
          CAPACITY_BREAKDOWN_QUERIES[ObjectServiceDashboardQuery.NOOBAA_TOTAL_USED]
        })`,
        [ObjectServiceDashboardQuery.RGW_TOTAL_USED]:
          CAPACITY_BREAKDOWN_QUERIES[ObjectServiceDashboardQuery.RGW_TOTAL_USED],
        [ObjectServiceDashboardQuery.OBJECT_STORAGE_TOTAL_USED]:
          CAPACITY_BREAKDOWN_QUERIES[ObjectServiceDashboardQuery.OBJECT_STORAGE_TOTAL_USED],
      },
    },
  },
  [ServiceType.MCG]: {
    [CapacityBreakdown.Metrics.TOTAL]: {
      model: null,
      metric: '',
      queries: {
        [ObjectServiceDashboardQuery.NOOBAA_USED]: `sum(${
          CAPACITY_BREAKDOWN_QUERIES[ObjectServiceDashboardQuery.NOOBAA_TOTAL_USED]
        })`,
        [ObjectServiceDashboardQuery.NOOBAA_TOTAL_USED]: `sum(${
          CAPACITY_BREAKDOWN_QUERIES[ObjectServiceDashboardQuery.NOOBAA_TOTAL_USED]
        })`,
      },
    },
    [CapacityBreakdown.Metrics.PROJECTS]: {
      model: ProjectModel,
      metric: 'project',
      queries: {
        [ObjectServiceDashboardQuery.PROJECTS_BY_USED]: `sort_desc(topk(5, ${
          CAPACITY_BREAKDOWN_QUERIES[ObjectServiceDashboardQuery.PROJECTS_BY_USED]
        }))`,
        [ObjectServiceDashboardQuery.PROJECTS_TOTAL_USED]: `sum(${
          CAPACITY_BREAKDOWN_QUERIES[ObjectServiceDashboardQuery.PROJECTS_BY_USED]
        })`,
      },
    },
    [CapacityBreakdown.Metrics.BC]: {
      model: NooBaaBucketClassModel,
      metric: 'bucket_class',
      queries: {
        [ObjectServiceDashboardQuery.BUCKETS_BY_USED]: `sort_desc(topk(5, ${
          CAPACITY_BREAKDOWN_QUERIES[ObjectServiceDashboardQuery.BUCKETS_BY_USED]
        }))`,
        [ObjectServiceDashboardQuery.BUCKETS_TOTAL_USED]: `sum(${
          CAPACITY_BREAKDOWN_QUERIES[ObjectServiceDashboardQuery.BUCKETS_BY_USED]
        })`,
      },
    },
  },
  // Todo: Change these with RGW Metrics
  [ServiceType.RGW]: {
    [CapacityBreakdown.Metrics.TOTAL]: {
      model: null,
      metric: '',
      queries: {
        [ObjectServiceDashboardQuery.RGW_TOTAL_USED]: `sum(${
          CAPACITY_BREAKDOWN_QUERIES[ObjectServiceDashboardQuery.RGW_TOTAL_USED]
        })`,
        [ObjectServiceDashboardQuery.RGW_USED]: `sum(${
          CAPACITY_BREAKDOWN_QUERIES[ObjectServiceDashboardQuery.RGW_TOTAL_USED]
        })`,
      },
    },
  },
};

export const DATA_CONSUMPTION_QUERIES = {
  [ServiceType.MCG]: {
    [Breakdown.ACCOUNTS]: {
      [Metrics.IOPS]: {
        read: 'topk(5,NooBaa_accounts_usage_read_count)',
        write: 'topk(5,NooBaa_accounts_usage_write_count)',
        totalRead: 'sum(topk(5,NooBaa_accounts_usage_read_count))',
        totalWrite: 'sum(topk(5,NooBaa_accounts_usage_write_count))',
      },
      [Metrics.LOGICAL]: {
        logicalUsage: 'topk(5,NooBaa_accounts_usage_logical)',
        totalLogicalUsage: 'sum(topk(5,NooBaa_accounts_usage_logical))',
      },
    },
    [Breakdown.PROVIDERS]: {
      [Metrics.IOPS]: {
        read: 'topk(5,NooBaa_providers_ops_read_num)',
        write: 'topk(5,NooBaa_providers_ops_write_num)',
        totalRead: 'sum(topk(5,NooBaa_providers_ops_read_num))',
        totalWrite: 'sum(topk(5,NooBaa_providers_ops_write_num))',
      },
      [Metrics.PHY_VS_LOG]: {
        physicalUsage: 'topk(5,NooBaa_providers_physical_size)',
        logicalUsage: 'topk(5,NooBaa_providers_logical_size)',
        totalPhysicalUsage: 'sum(topk(5,NooBaa_providers_physical_size))',
        totalLogicalUsage: 'sum(topk(5,NooBaa_providers_logical_size))',
      },
      [Metrics.EGRESS]: {
        egress:
          'topk(5,NooBaa_providers_bandwidth_read_size + NooBaa_providers_bandwidth_write_size)',
      },
    },
  },
  [ServiceType.RGW]: {
    [Metrics.LATENCY]: {
      latencyGet:
        'ceph_rgw_get_initial_lat_sum{ceph_daemon="rgw.ocs.storagecluster.cephobjectstore.a"}',
      latencyPut:
        'ceph_rgw_put_initial_lat_sum{ceph_daemon="rgw.ocs.storagecluster.cephobjectstore.a"}',
    },
    [Metrics.BANDWIDTH]: {
      bandwidthGet: 'ceph_rgw_get_b{ceph_daemon="rgw.ocs.storagecluster.cephobjectstore.a"}',
      bandwidthPut: 'ceph_rgw_put_b{ceph_daemon="rgw.ocs.storagecluster.cephobjectstore.a"}',
    },
  },
};
