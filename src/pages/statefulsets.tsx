import { useConfigStore } from '@/stores/use-config-store';
import { Spinner } from '@/components/spinner';
import { StatefulSetsTable } from '@/components/statefulsets/statefulsets-table';
import { ErrorAlert } from '@/components/error-alert';
import { V1StatefulSet } from '@kubernetes/client-node';
import { useListKubeResource } from '@/hooks/kube-resource/use-list-kube-resource';
import { ResourceTypes } from '@/lib/strings';

export const StatefulSets = () => {
  const { selectedKubeconfig, currentContext, currentNamespace } =
    useConfigStore();

  const {
    data: statefulsets,
    isLoading,
    error,
  } = useListKubeResource<V1StatefulSet>({
    kubeconfigPath: selectedKubeconfig,
    context: currentContext,
    namespace: currentNamespace,
    resourceType: ResourceTypes.StatefulSet,
  });

  return (
    <div className="space-y-4">
      {isLoading && <Spinner />}
      {error && <ErrorAlert error={error} />}
      {!isLoading && !error && (
        <StatefulSetsTable statefulsets={statefulsets ?? []} />
      )}
    </div>
  );
};
