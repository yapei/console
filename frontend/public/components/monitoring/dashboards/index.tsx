import * as _ from 'lodash-es';
import { Dropdown, DropdownToggle, DropdownItem } from '@patternfly/react-core';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

import { RedExclamationCircleIcon } from '@console/shared';
import ErrorAlert from '@console/shared/src/components/alerts/error';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';

import * as UIActions from '../../../actions/ui';
import { k8sBasePath } from '../../../module/k8s';
import { ErrorBoundaryFallback } from '../../error';
import { RootState } from '../../../redux';
import { getPrometheusURL, PrometheusEndpoint } from '../../graphs/helpers';
import { history, LoadingInline, useSafeFetch } from '../../utils';
import { formatPrometheusDuration, parsePrometheusDuration } from '../../utils/datetime';
import { withFallback } from '../../utils/error-boundary';
import BarChart from './bar-chart';
import Graph from './graph';
import SingleStat from './single-stat';
import Table from './table';
import { Panel } from './types';

const evaluateTemplate = (s: string, variables: VariablesMap): string => {
  if (_.isEmpty(s)) {
    return undefined;
  }
  let result = s;
  _.each(variables, (v, k) => {
    const re = new RegExp(`\\$${k}`, 'g');
    if (result.match(re)) {
      if (v.isLoading) {
        result = undefined;
        return false;
      }
      result = result.replace(re, v.value || '');
    }
  });
  return result;
};

const useBoolean = (initialValue: boolean): [boolean, () => void, () => void, () => void] => {
  const [value, setValue] = React.useState(initialValue);
  const toggle = React.useCallback(() => setValue((v) => !v), []);
  const setTrue = React.useCallback(() => setValue(true), []);
  const setFalse = React.useCallback(() => setValue(false), []);
  return [value, toggle, setTrue, setFalse];
};

const VariableDropdown: React.FC<VariableDropdownProps> = ({
  isError = false,
  items,
  label,
  onChange,
  selectedKey,
}) => {
  const [isOpen, toggleIsOpen, , setClosed] = useBoolean(false);

  return (
    <div className="form-group monitoring-dashboards__dropdown-wrap">
      <label className="monitoring-dashboards__dropdown-title">{label}</label>
      {isError ? (
        <Dropdown
          toggle={
            <DropdownToggle className="monitoring-dashboards__dropdown-button" isDisabled={true}>
              <RedExclamationCircleIcon /> Error loading options
            </DropdownToggle>
          }
        />
      ) : (
        <Dropdown
          dropdownItems={_.map(items, (name, key) => (
            <DropdownItem component="button" key={key} onClick={() => onChange(key)}>
              {name}
            </DropdownItem>
          ))}
          isOpen={isOpen}
          onSelect={setClosed}
          toggle={
            <DropdownToggle
              className="monitoring-dashboards__dropdown-button"
              onToggle={toggleIsOpen}
            >
              {items[selectedKey]}
            </DropdownToggle>
          }
        />
      )}
    </div>
  );
};

const SingleVariableDropdown_: React.FC<SingleVariableDropdownProps> = ({
  isHidden,
  name,
  options,
  optionsLoaded,
  patchVariable,
  query,
  timespan,
  value,
}) => {
  const safeFetch = React.useCallback(useSafeFetch(), []);

  const [isError, setIsError] = React.useState(false);

  React.useEffect(() => {
    if (query) {
      // Convert label_values queries to something Prometheus can handle
      // TODO: Once the Prometheus /series endpoint is available through the API proxy, this should
      // be converted to use that instead
      const prometheusQuery = query.replace(/label_values\((.*), (.*)\)/, 'count($1) by ($2)');

      const url = getPrometheusURL({
        endpoint: PrometheusEndpoint.QUERY_RANGE,
        query: prometheusQuery,
        samples: 30,
        timeout: '5s',
        timespan,
      });

      patchVariable(name, { isLoading: true });

      safeFetch(url)
        .then(({ data }) => {
          setIsError(false);
          const newOptions = _.flatMap(data?.result, ({ metric }) => _.values(metric)).sort();
          optionsLoaded(name, newOptions);
        })
        .catch((err) => {
          patchVariable(name, { isLoading: false });
          if (err.name !== 'AbortError') {
            setIsError(true);
          }
        });
    }
  }, [name, patchVariable, query, safeFetch, optionsLoaded, timespan]);

  const onChange = React.useCallback((v: string) => patchVariable(name, { value: v }), [
    name,
    patchVariable,
  ]);

  if (isHidden || (!isError && _.isEmpty(options))) {
    return null;
  }

  return (
    <VariableDropdown
      isError={isError}
      items={_.zipObject(options, options)}
      label={name}
      onChange={onChange}
      selectedKey={value}
    />
  );
};
const SingleVariableDropdown = connect(
  ({ UI }: RootState, { name }: { name: string }) => {
    const variables = UI.getIn(['monitoringDashboards', 'variables']).toJS();
    const { isHidden, options, query, value } = variables[name] ?? {};
    return {
      isHidden,
      options,
      query: evaluateTemplate(query, variables),
      timespan: UI.getIn(['monitoringDashboards', 'timespan']),
      value,
    };
  },
  {
    optionsLoaded: UIActions.monitoringDashboardsVariableOptionsLoaded,
    patchVariable: UIActions.monitoringDashboardsPatchVariable,
  },
)(SingleVariableDropdown_);

const AllVariableDropdowns_: React.FC<AllVariableDropdownsProps> = ({ variables }) => (
  <>
    {_.map(_.keys(variables.toJS()), (name) => (
      <SingleVariableDropdown key={name} name={name} />
    ))}
  </>
);
const AllVariableDropdowns = connect(({ UI }: RootState) => ({
  variables: UI.getIn(['monitoringDashboards', 'variables']),
}))(AllVariableDropdowns_);

const timespanOptions = {
  '5m': '5 minutes',
  '15m': '15 minutes',
  '30m': '30 minutes',
  '1h': '1 hour',
  '2h': '2 hours',
  '6h': '6 hours',
  '12h': '12 hours',
  '1d': '1 day',
  '2d': '2 days',
  '1w': '1 week',
  '2w': '2 weeks',
};

const TimespanDropdown_: React.FC<TimespanDropdownProps> = ({ timespan, setTimespan }) => {
  const onChange = React.useCallback((v: string) => setTimespan(parsePrometheusDuration(v)), [
    setTimespan,
  ]);

  return (
    <VariableDropdown
      items={timespanOptions}
      label="Time Range"
      onChange={onChange}
      selectedKey={formatPrometheusDuration(timespan)}
    />
  );
};
const TimespanDropdown = connect(
  ({ UI }: RootState) => ({
    timespan: UI.getIn(['monitoringDashboards', 'timespan']),
  }),
  {
    setTimespan: UIActions.monitoringDashboardsSetTimespan,
  },
)(TimespanDropdown_);

const pollOffText = 'Off';
const pollIntervalOptions = {
  [pollOffText]: pollOffText,
  '15s': '15 seconds',
  '30s': '30 seconds',
  '1m': '1 minute',
  '5m': '5 minutes',
  '15m': '15 minutes',
  '30m': '30 minutes',
  '1h': '1 hour',
  '2h': '2 hours',
  '1d': '1 day',
};

const PollIntervalDropdown_: React.FC<PollIntervalDropdownProps> = ({
  pollInterval,
  setPollInterval,
}) => {
  const onChange = React.useCallback(
    (v: string) => setPollInterval(v === pollOffText ? null : parsePrometheusDuration(v)),
    [setPollInterval],
  );

  return (
    <VariableDropdown
      items={pollIntervalOptions}
      label="Refresh Interval"
      onChange={onChange}
      selectedKey={formatPrometheusDuration(pollInterval)}
    />
  );
};
const PollIntervalDropdown = connect(
  ({ UI }: RootState) => ({
    pollInterval: UI.getIn(['monitoringDashboards', 'pollInterval']),
  }),
  {
    setPollInterval: UIActions.monitoringDashboardsSetPollInterval,
  },
)(PollIntervalDropdown_);

// TODO: Dynamically load the list of dashboards
const boards = [
  'etcd',
  'k8s-resources-cluster',
  'k8s-resources-namespace',
  'k8s-resources-workloads-namespace',
  'k8s-resources-node',
  'k8s-resources-pod',
  'k8s-resources-workload',
  'cluster-total',
  'prometheus',
  'node-cluster-rsrc-use',
  'node-rsrc-use',
];
const boardItems = _.zipObject(boards, boards);

// Matches Prometheus labels surrounded by {{ }} in the graph legend label templates
const legendTemplateOptions = { interpolate: /{{([a-zA-Z_][a-zA-Z0-9_]*)}}/g };

const CardBody_: React.FC<CardBodyProps> = ({ panel, pollInterval, variables }) => {
  const formatLegendLabel = React.useCallback(
    (labels, i) => {
      const compiled = _.template(panel.targets?.[i]?.legendFormat, legendTemplateOptions);
      return compiled(labels);
    },
    [panel],
  );

  const variablesJS: VariablesMap = variables.toJS();

  const rawQueries = _.map(panel.targets, 'expr');
  if (!rawQueries.length) {
    return null;
  }
  const queries = rawQueries.map((expr) => evaluateTemplate(expr, variablesJS));

  if (_.some(queries, _.isUndefined)) {
    return <LoadingInline />;
  }

  return (
    <>
      {panel.type === 'grafana-piechart-panel' && (
        <BarChart pollInterval={pollInterval} query={queries[0]} />
      )}
      {panel.type === 'graph' && (
        <Graph
          formatLegendLabel={panel.legend?.show ? formatLegendLabel : undefined}
          isStack={panel.stack}
          pollInterval={pollInterval}
          queries={queries}
        />
      )}
      {panel.type === 'singlestat' && (
        <SingleStat panel={panel} pollInterval={pollInterval} query={queries[0]} />
      )}
      {panel.type === 'table' && (
        <Table panel={panel} pollInterval={pollInterval} queries={queries} />
      )}
    </>
  );
};
const CardBody = connect(({ UI }: RootState) => ({
  pollInterval: UI.getIn(['monitoringDashboards', 'pollInterval']),
  variables: UI.getIn(['monitoringDashboards', 'variables']),
}))(CardBody_);

const Card: React.FC<CardProps> = ({ panel }) => {
  if (panel.type === 'row') {
    return (
      <>
        {_.map(panel.panels, (p) => (
          <Card key={p.id} panel={p} />
        ))}
      </>
    );
  }

  // If panel doesn't specify a span, default to 12
  const panelSpan: number = _.get(panel, 'span', 12);
  // If panel.span is greater than 12, default colSpan to 12
  const colSpan: number = panelSpan > 12 ? 12 : panelSpan;
  // If colSpan is less than 7, double it for small
  const colSpanSm: number = colSpan < 7 ? colSpan * 2 : colSpan;

  return (
    <div className={`col-xs-12 col-sm-${colSpanSm} col-lg-${colSpan}`}>
      <DashboardCard
        className="monitoring-dashboards__panel"
        gradient={panel.type === 'grafana-piechart-panel'}
      >
        <DashboardCardHeader className="monitoring-dashboards__card-header">
          <DashboardCardTitle>{panel.title}</DashboardCardTitle>
        </DashboardCardHeader>
        <DashboardCardBody className="co-dashboard-card__body--dashboard-graph">
          <CardBody panel={panel} />
        </DashboardCardBody>
      </DashboardCard>
    </div>
  );
};

const Board: React.FC<BoardProps> = ({ board, patchVariable }) => {
  const [data, setData] = React.useState();
  const [error, setError] = React.useState<string>();

  const safeFetch = React.useCallback(useSafeFetch(), []);

  React.useEffect(() => {
    if (!board) {
      return;
    }
    setData(undefined);
    setError(undefined);
    const path = `${k8sBasePath}/api/v1/namespaces/openshift-monitoring/configmaps/grafana-dashboard-${board}`;
    safeFetch(path)
      .then((response) => {
        const json = _.get(response, ['data', `${board}.json`]);
        if (!json) {
          setError('Dashboard definition JSON not found');
        } else {
          const newData = JSON.parse(json);

          _.each(newData?.templating?.list as TemplateVariable[], (v) => {
            if (v.type === 'query' || v.type === 'interval') {
              patchVariable(v.name, {
                isHidden: v.hide !== 0,
                options: _.map(v.options, 'value'),
                query: v.type === 'query' ? v.query : undefined,
                value: _.find(v.options, { selected: true })?.value || v.options?.[0]?.value,
              });
            }
          });

          // Call this after creating the board's variables so we don't trigger a component update
          // that will fail due to missing variables
          setData(newData);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(_.get(err, 'json.error', err.message));
        }
      });
  }, [board, patchVariable, safeFetch]);

  if (!board) {
    return null;
  }
  if (error) {
    return <ErrorAlert message={error} />;
  }
  if (!data) {
    return <LoadingInline />;
  }

  const rows = _.isEmpty(data.rows) ? [{ panels: data.panels }] : data.rows;

  return (
    <>
      {_.map(rows, (row, i) => (
        <div className="row monitoring-dashboards__row" key={i}>
          {_.map(row.panels, (panel, j) => (
            <Card key={j} panel={panel} />
          ))}
        </div>
      ))}
    </>
  );
};

const MonitoringDashboardsPage_: React.FC<MonitoringDashboardsPageProps> = ({
  clearVariables,
  deleteAll,
  match,
  patchVariable,
}) => {
  const { board } = match.params;

  // Clear queries on unmount
  React.useEffect(() => deleteAll, [deleteAll]);

  const setBoard = (newBoard: string) => {
    if (newBoard !== board) {
      clearVariables();
      history.replace(`/monitoring/dashboards/${newBoard}`);
    }
  };

  if (!board && boards?.[0]) {
    setBoard(boards[0]);
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Metrics Dashboards</title>
      </Helmet>
      <div className="co-m-nav-title co-m-nav-title--detail">
        <div className="monitoring-dashboards__header">
          <h1 className="co-m-pane__heading">Dashboards</h1>
          <div className="monitoring-dashboards__options">
            <TimespanDropdown />
            <PollIntervalDropdown />
          </div>
        </div>
        <div className="monitoring-dashboards__variables">
          <VariableDropdown
            items={boardItems}
            label="Dashboard"
            onChange={setBoard}
            selectedKey={board}
          />
          <AllVariableDropdowns />
        </div>
      </div>
      <Dashboard>
        <Board board={board} patchVariable={patchVariable} />
      </Dashboard>
    </>
  );
};
const MonitoringDashboardsPage = connect(null, {
  clearVariables: UIActions.monitoringDashboardsClearVariables,
  deleteAll: UIActions.queryBrowserDeleteAllQueries,
  patchVariable: UIActions.monitoringDashboardsPatchVariable,
})(MonitoringDashboardsPage_);

type TemplateVariable = {
  hide: number;
  name: string;
  options: { selected: boolean; value: string }[];
  query: string;
  type: string;
};

type Variable = {
  isHidden?: boolean;
  isLoading?: boolean;
  options?: string[];
  query?: string;
  value?: string;
};

type VariablesMap = { [key: string]: Variable };

type VariableDropdownProps = {
  isError?: boolean;
  items: { [key: string]: string };
  label: string;
  onChange: (v: string) => void;
  selectedKey: string;
};

type SingleVariableDropdownProps = {
  isHidden: boolean;
  name: string;
  options?: string[];
  patchVariable: (key: string, patch: Variable) => undefined;
  query?: string;
  optionsLoaded: (key: string, newOptions: string[]) => undefined;
  timespan: number;
  value?: string;
};

type BoardProps = {
  board: string;
  patchVariable: (key: string, patch: Variable) => undefined;
};

type AllVariableDropdownsProps = {
  variables: ImmutableMap<string, Variable>;
};

type TimespanDropdownProps = {
  timespan: number;
  setTimespan: (v: number) => never;
};

type PollIntervalDropdownProps = {
  pollInterval: number;
  setPollInterval: (v: number) => never;
};

type CardBodyProps = {
  panel: Panel;
  pollInterval: null | number;
  variables: ImmutableMap<string, Variable>;
};

type CardProps = {
  panel: Panel;
};

type MonitoringDashboardsPageProps = {
  clearVariables: () => undefined;
  deleteAll: () => undefined;
  match: {
    params: { board: string };
  };
  patchVariable: (key: string, patch: Variable) => undefined;
};

export default withFallback(MonitoringDashboardsPage, ErrorBoundaryFallback);
