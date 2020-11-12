import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { getBuildConfigsForResource } from '../utils';
import { BuildConfigOverviewItem } from '../types';

export const useBuildConfigsWatcher = (
  resource: K8sResourceKind,
): { loaded: boolean; loadError: string; buildConfigs: BuildConfigOverviewItem[] } => {
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>(null);
  const [buildConfigs, setBuildConfigs] = React.useState<BuildConfigOverviewItem[]>();
  const { namespace } = resource.metadata;
  const watchedResources = React.useMemo(
    () => ({
      buildConfigs: {
        isList: true,
        kind: 'BuildConfig',
        namespace,
      },
      builds: {
        isList: true,
        kind: 'Build',
        namespace,
      },
    }),
    [namespace],
  );

  const resources = useK8sWatchResources(watchedResources);

  React.useEffect(() => {
    const resourceWithLoadError = Object.values(resources).find((r) => r.loadError);
    if (resourceWithLoadError) {
      setLoadError(resourceWithLoadError.loadError);
      return;
    }
    setLoadError(null);
    if (
      Object.keys(resources).length > 0 &&
      Object.keys(resources).every((key) => resources[key].loaded)
    ) {
      const resourceBuildConfigs = getBuildConfigsForResource(resource, resources);
      setBuildConfigs(resourceBuildConfigs);
      setLoaded(true);
    }
  }, [resource, resources]);

  return { loaded, loadError, buildConfigs };
};
