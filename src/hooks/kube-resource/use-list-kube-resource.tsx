import { useQuery } from '@tanstack/react-query';
import { kubernetesApi } from '../../lib/api-client';
import { ListKubeResourceProps } from '../../lib/types';

export const useListKubeResource = <T extends object>({
  kubeconfigPath,
  context,
  namespace,
  resourceType,
}: ListKubeResourceProps) => {
  return useQuery({
    queryKey: ['resources', resourceType, kubeconfigPath, context, namespace],
    queryFn: async () => {
      if (!kubeconfigPath || !context) {
        throw new Error('Missing required parameters');
      }

      return kubernetesApi.listResource({
        kubeconfigPath,
        context,
        namespace,
        resourceType,
      }) as Promise<T[]>;
    },
    enabled: Boolean(kubeconfigPath && context),
    retry: 1,
    retryDelay: 500,
  });
};
