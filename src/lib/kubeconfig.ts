import { configApi } from './api-client';
import { AuthInfo, Kubeconfig } from './types';

type loadKubeconfigReturnType = {
  contexts: string[];
  currentContext?: string;
  authConfig?: AuthInfo;
  error: Error | null;
};

export const loadKubeconfig = async (
  path: string
): Promise<loadKubeconfigReturnType> => {
  try {
    const config = await configApi.readKubeconfig(path) as Kubeconfig;
    const currentContextName =
      config['current-context'] || config.contexts[0]?.name;
    const contexts = config.contexts.map((ctx: { name: string }) => ctx.name);

    // For web version, we'll return a simplified auth config
    // The actual authentication will be handled by the server
    const authConfig: AuthInfo = {
      token: '', // Will be handled by the server
    };

    return {
      contexts,
      currentContext: currentContextName,
      authConfig,
      error: null,
    };
  } catch (error) {
    return {
      contexts: [],
      currentContext: undefined,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const loadContextAuthConfig = async (
  path: string,
  context: string
): Promise<AuthInfo> => {
  try {
    // For web version, return simplified auth config
    // The server will handle the actual authentication
    return {
      token: '', // Will be determined by the server
    };
  } catch (error) {
    console.error('Error loading context auth config:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
};
