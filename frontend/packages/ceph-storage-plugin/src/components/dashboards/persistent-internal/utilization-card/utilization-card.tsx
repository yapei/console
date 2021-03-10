import * as React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { Dropdown } from '@console/internal/components/utils/dropdown';
import {
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
} from '@console/internal/components/utils';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import { PrometheusUtilizationItem } from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';
import {
  useMetricDuration,
  Duration,
} from '@console/shared/src/components/dashboard/duration-hook';
import {
  StorageDashboardQuery,
  UTILIZATION_QUERY,
  utilizationPopoverQueryMap,
} from '../../../../queries';
import { humanizeIOPS, humanizeLatency } from './utils';

const UtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  const [duration, setDuration] = useMetricDuration();
  const [timestamps, setTimestamps] = React.useState<Date[]>();

  const storagePopover = React.useCallback(
    ({ current }) => (
      <ConsumerPopover
        title={t('ceph-storage-plugin~Used Capacity')}
        current={current}
        consumers={utilizationPopoverQueryMap}
        humanize={humanizeBinaryBytes}
      />
    ),
    [t],
  );

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Utilization')}</DashboardCardTitle>
        <Dropdown items={Duration} onChange={setDuration} selectedKey={duration} title={duration} />
      </DashboardCardHeader>
      <UtilizationBody timestamps={timestamps}>
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Used Capacity')}
          utilizationQuery={UTILIZATION_QUERY[StorageDashboardQuery.CEPH_CAPACITY_USED]}
          duration={duration}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          setTimestamps={setTimestamps}
          TopConsumerPopover={storagePopover}
        />
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~IOPS')}
          utilizationQuery={UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_IOPS_QUERY]}
          duration={duration}
          humanizeValue={humanizeIOPS}
        />
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Latency')}
          utilizationQuery={UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_LATENCY_QUERY]}
          duration={duration}
          humanizeValue={humanizeLatency}
        />
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Throughput')}
          utilizationQuery={UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_THROUGHPUT_QUERY]}
          duration={duration}
          humanizeValue={humanizeDecimalBytesPerSec}
        />
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Recovery')}
          utilizationQuery={
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_RECOVERY_RATE_QUERY]
          }
          duration={duration}
          humanizeValue={humanizeDecimalBytesPerSec}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};

export default UtilizationCard;
