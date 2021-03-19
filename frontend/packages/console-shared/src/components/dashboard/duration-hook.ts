import * as React from 'react';
import { TFunction } from 'i18next';

export const Duration = (t: TFunction) => {
  return {
    ONE_HR: t('public~1 hour'),
    SIX_HR: t('public~6 hours'),
    TWENTY_FOUR_HR: t('public~24 hours'),
  };
};

export const TranslatedDuration = (duration, t: TFunction): string => {
  switch (duration) {
    case 'ONE_HR':
      return t('public~1 hour');
    case 'SIX_HR':
      return t('public~6 hours');
    default:
      return t('public~24 hours');
  }
};

export const useMetricDuration = (t: TFunction): MetricDuration => {
  const [duration, setDuration] = React.useState(TranslatedDuration('ONE_HR', t));
  const setMetricDuration = React.useCallback(
    (d: string) => setDuration(TranslatedDuration(d, t)),
    [t],
  );
  return [duration, setMetricDuration];
};

type MetricDuration = [string, (duration: string, t: TFunction) => void];
