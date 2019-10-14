import { ONE_HR, SIX_HR, TWENTY_FOUR_HR } from './index';

export enum StorageDashboardQuery {
  CEPH_STATUS_QUERY = 'CEPH_STATUS_QUERY',
  CEPH_PG_CLEAN_AND_ACTIVE_QUERY = 'CEPH_PG_CLEAN_AND_ACTIVE_QUERY',
  CEPH_PG_TOTAL_QUERY = 'CEPH_PG_TOTAL_QUERY',
  UTILIZATION_IOPS_QUERY = 'UTILIZATION_IOPS_QUERY',
  UTILIZATION_LATENCY_QUERY = 'UTILIZATION_LATENCY_QUERY',
  UTILIZATION_THROUGHPUT_QUERY = 'UTILIZATION_THROUGHPUT_QUERY',
  UTILIZATION_RECOVERY_RATE_QUERY = 'UTILIZATION_RECOVERY_RATE_QUERY',
  CEPH_CAPACITY_TOTAL = 'CAPACITY_TOTAL',
  CEPH_CAPACITY_USED = 'CAPACITY_USED',
  PODS_BY_REQUESTED = 'PODS_BY_REQUESTED',
  PODS_BY_USED = 'PODS_BY_USED',
  PROJECTS_BY_REQUESTED = 'PROJECTS_BY_REQUESTED',
  PROJECTS_BY_USED = 'PROJECTS_BY_USED',
  STORAGE_CLASSES_BY_REQUESTED = 'STORAGE_CLASSES_BY_REQUESTED',
  STORAGE_CLASSES_BY_USED = 'STORAGE_CLASSES_BY_USED',
  STORAGE_CEPH_CAPACITY_REQUESTED_QUERY = 'STORAGE_CEPH_CAPACITY_REQUESTED_QUERY',
  STORAGE_CEPH_CAPACITY_USED_QUERY = 'STORAGE_CEPH_CAPACITY_USED_QUERY',
  RESILIENCY_PROGRESS = 'RESILIENCY_PROGRESS',
}

export const STORAGE_HEALTH_QUERIES = {
  [StorageDashboardQuery.CEPH_STATUS_QUERY]: 'ceph_health_status',
};

export const DATA_RESILIENCY_QUERY = {
  [StorageDashboardQuery.RESILIENCY_PROGRESS]: '(ceph_pg_clean and ceph_pg_active)/ceph_pg_total',
};

export const UTILIZATION_QUERY = {
  [StorageDashboardQuery.CEPH_CAPACITY_TOTAL]: 'ceph_cluster_total_bytes',
  [StorageDashboardQuery.CEPH_CAPACITY_USED]: 'ceph_cluster_total_used_bytes',
  [StorageDashboardQuery.UTILIZATION_IOPS_QUERY]:
    '(sum(rate(ceph_pool_wr[1m])) + sum(rate(ceph_pool_rd[1m])))',
  [StorageDashboardQuery.UTILIZATION_LATENCY_QUERY]:
    '(quantile(.95,(cluster:ceph_disk_latency:join_ceph_node_disk_irate1m)))',
  [StorageDashboardQuery.UTILIZATION_THROUGHPUT_QUERY]:
    '(sum(rate(ceph_pool_wr_bytes[1m]) + rate(ceph_pool_rd_bytes[1m])))',
  [StorageDashboardQuery.UTILIZATION_RECOVERY_RATE_QUERY]:
    '(sum(ceph_pool_recovering_bytes_per_sec))',
};

export const UTILIZATION_QUERY_HOUR_MAP = {
  [ONE_HR]: '[1h:10m]',
  [SIX_HR]: '[6h:1h]',
  [TWENTY_FOUR_HR]: '[24h:4h]',
};

export const CAPACITY_USAGE_QUERIES = {
  [StorageDashboardQuery.CEPH_CAPACITY_TOTAL]: 'ceph_cluster_total_bytes',
  [StorageDashboardQuery.CEPH_CAPACITY_USED]: 'ceph_cluster_total_used_bytes',
  [StorageDashboardQuery.STORAGE_CEPH_CAPACITY_REQUESTED_QUERY]:
    'sum((kube_persistentvolumeclaim_resource_requests_storage_bytes * on (namespace,persistentvolumeclaim) group_right() kube_pod_spec_volumes_persistentvolumeclaims_info) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"}))',
  [StorageDashboardQuery.STORAGE_CEPH_CAPACITY_USED_QUERY]:
    'sum((kubelet_volume_stats_used_bytes * on (namespace,persistentvolumeclaim) group_right() kube_pod_spec_volumes_persistentvolumeclaims_info) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"}))',
};

export const TOP_CONSUMER_QUERIES = {
  [StorageDashboardQuery.PODS_BY_REQUESTED]:
    '(sort(topk(5, (sum((avg_over_time(kube_persistentvolumeclaim_resource_requests_storage_bytes[1h]) * on (namespace,persistentvolumeclaim) group_right() kube_pod_spec_volumes_persistentvolumeclaims_info) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"})) by (pod,namespace)))))[60m:10m]',
  [StorageDashboardQuery.PODS_BY_USED]:
    '(sort(topk(5, (sum((avg_over_time(kubelet_volume_stats_used_bytes[1h]) * on (namespace,persistentvolumeclaim) group_right() kube_pod_spec_volumes_persistentvolumeclaims_info) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"})) by (pod,namespace)))))[60m:10m]',
  [StorageDashboardQuery.PROJECTS_BY_REQUESTED]:
    '(sort(topk(5, sum(avg_over_time(kube_persistentvolumeclaim_resource_requests_storage_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"})) by (namespace))))[60m:10m]',
  [StorageDashboardQuery.PROJECTS_BY_USED]:
    '(sort(topk(5, sum(avg_over_time(kubelet_volume_stats_used_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"})) by (namespace))))[60m:10m]',
  [StorageDashboardQuery.STORAGE_CLASSES_BY_REQUESTED]:
    '(sort(topk(5, sum(avg_over_time(kube_persistentvolumeclaim_resource_requests_storage_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"})) by (storageclass, provisioner))))[60m:10m]',
  [StorageDashboardQuery.STORAGE_CLASSES_BY_USED]:
    '(sort(topk(5, sum(avg_over_time(kubelet_volume_stats_used_bytes[1h]) * on (namespace,persistentvolumeclaim) group_left(storageclass, provisioner) (kube_persistentvolumeclaim_info * on (storageclass)  group_left(provisioner) kube_storageclass_info {provisioner=~"(.*rbd.csi.ceph.com)|(.*cephfs.csi.ceph.com)|(ceph.rook.io/block)"})) by (storageclass, provisioner))))[60m:10m]',
};
