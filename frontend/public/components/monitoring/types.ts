import { AlertStates, SilenceStates } from '../../reducers/monitoring';
import { RowFunction } from '../factory';
import { PrometheusLabels } from '../graphs';

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
  };
  state: AlertStates;
  value?: number;
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
  labels: PrometheusLabels;
  name: string;
  query: string;
};

export type Rule = PrometheusRule & {
  id: string;
};

export type Rules = {
  data: Rule[];
  loaded: boolean;
  loadError?: string;
};

type Group = {
  rules: PrometheusRule[];
  file: string;
  inverval: number;
  name: string;
};

export type PrometheusRulesResponse = {
  data: {
    groups: Group[];
  };
  status: string;
};

export type ListPageProps = {
  alertmanagerLinkPath: string;
  CreateButton: React.ComponentType<{}>;
  data: Rule[] | Silence[];
  filters: { [key: string]: any };
  Header: (...args) => any[];
  itemCount: number;
  kindPlural: string;
  loaded: boolean;
  loadError?: string;
  match: { path: string };
  nameFilterID: string;
  reduxID: string;
  Row: RowFunction;
  rowFilter: {
    type: string;
    selected: string[];
    reducer: (monitoringResource: Alert | Rule | Silence) => string;
    items: { id: string; title: string }[];
  };
  showTitle?: boolean;
};
