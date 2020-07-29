import { RowFunction } from '../factory';
import { RowFilter } from '../filter-toolbar';
import { PrometheusLabels } from '../graphs';

export const enum AlertSeverity {
  Critical = 'critical',
  Info = 'info',
  None = 'none',
  Warning = 'warning',
}

export const enum AlertSource {
  Platform = 'platform',
  User = 'user',
}

export const enum AlertStates {
  Firing = 'firing',
  Pending = 'pending',
  Silenced = 'silenced',
}

export const enum RuleStates {
  Firing = 'firing',
  Inactive = 'inactive',
  Pending = 'pending',
  Silenced = 'silenced',
}

export const enum SilenceStates {
  Active = 'active',
  Expired = 'expired',
  Pending = 'pending',
}

export type MonitoringResource = {
  abbr: string;
  kind: string;
  label: string;
  plural: string;
};

export type Silence = {
  comment: string;
  createdBy: string;
  endsAt: string;
  // eslint-disable-next-line no-use-before-define
  firingAlerts: Alert[];
  id?: string;
  matchers: { name: string; value: string; isRegex: boolean }[];
  name?: string;
  startsAt: string;
  status?: { state: SilenceStates };
  updatedAt?: string;
};

export type Silences = {
  data: Silence[];
  loaded: boolean;
  loadError?: string;
};

export type PrometheusAlert = {
  activeAt?: string;
  annotations: PrometheusLabels;
  labels: PrometheusLabels & {
    alertname: string;
    severity?: AlertSeverity | string;
  };
  state: AlertStates;
  value?: number | string;
};

export type Alert = PrometheusAlert & {
  rule: Rule;
  silencedBy?: Silence[];
};

export type Alerts = {
  data: Alert[];
  loaded: boolean;
  loadError?: string;
};

export type PrometheusRule = {
  alerts: PrometheusAlert[];
  annotations: PrometheusLabels;
  duration: number;
  labels: PrometheusLabels & {
    severity?: AlertSeverity | string;
  };
  name: string;
  query: string;
  state: RuleStates;
  type: string;
};

export type Rule = PrometheusRule & {
  id: string;
  silencedBy?: Silence[];
};

export type Rules = {
  data: Rule[];
  loaded: boolean;
  loadError?: string;
};

type Group = {
  rules: PrometheusRule[];
  file: string;
  name: string;
};

export type PrometheusRulesResponse = {
  data: {
    groups: Group[];
  };
  status: string;
};

export type ListPageProps = {
  CreateButton?: React.ComponentType<{}>;
  data: Alert[] | Rule[] | Silence[];
  filters: { [key: string]: any };
  Header: (...args) => any[];
  hideLabelFilter?: boolean;
  kindPlural: string;
  labelFilter?: string;
  labelPath?: string;
  loaded: boolean;
  loadError?: string;
  nameFilterID: string;
  reduxID: string;
  Row: RowFunction;
  rowFilters: RowFilter[];
  showTitle?: boolean;
};
