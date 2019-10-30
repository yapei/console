import * as _ from 'lodash';
import { Alert } from '@console/internal/components/monitoring';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const filterNooBaaAlerts = (alerts: Alert[]): Alert[] =>
  alerts.filter((alert) => _.get(alert, 'annotations.storage_type') === 'NooBaa');

export const getGaugeValue = (data) => _.get(data, 'data.result[0].value[1]');

export const getMetric = (result: PrometheusResponse, metric: string): string =>
  _.get(result, ['data', 'result', '0', 'metric', metric], null);

export type PrometheusMetricResult = {
  metric: { [key: string]: any };
  value?: [number, string | number];
};

export const getPhase = (obj: K8sResourceKind): string => {
  return _.get(obj, 'status.phase', 'Lost');
};

export const isBound = (obj: K8sResourceKind): boolean => getPhase(obj) === 'Bound';

export const getResiliencyProgress = (response: PrometheusResponse): number => {
  const progress = getGaugeValue(response);
  return Number(Number(progress).toFixed(1));
};
