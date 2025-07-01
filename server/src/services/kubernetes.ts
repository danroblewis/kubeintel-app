import * as k8s from '@kubernetes/client-node';
import { createError } from '../middleware/errorHandler';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface KubeConfig {
  kubeconfigPath: string;
  context: string;
  namespace?: string;
}

export interface ResourceParams extends KubeConfig {
  resourceType: string;
  name?: string;
}

export interface ScaleParams extends ResourceParams {
  replicas: number;
}

export interface NodeParams extends KubeConfig {
  nodeName: string;
}

export class KubernetesService {
  private getKubeConfig(kubeconfigPath: string, context: string): k8s.KubeConfig {
    const kc = new k8s.KubeConfig();
    kc.loadFromFile(kubeconfigPath);
    kc.setCurrentContext(context);
    return kc;
  }

  async listResource(params: ResourceParams) {
    try {
      const { kubeconfigPath, context, namespace, resourceType } = params;
      const kc = this.getKubeConfig(kubeconfigPath, context);
      
      // Use kubectl for complex resource listing as it's more reliable
      const namespaceFlag = namespace ? `-n ${namespace}` : '--all-namespaces';
      const cmd = `kubectl --kubeconfig="${kubeconfigPath}" --context="${context}" get ${resourceType} ${namespaceFlag} -o json`;
      
      const { stdout } = await execAsync(cmd);
      return JSON.parse(stdout);
    } catch (error: any) {
      throw createError(`Failed to list ${params.resourceType}: ${error.message}`, 500);
    }
  }

  async getResource(params: ResourceParams) {
    try {
      const { kubeconfigPath, context, namespace, resourceType, name } = params;
      
      if (!name) {
        throw createError('Resource name is required', 400);
      }

      const namespaceFlag = namespace ? `-n ${namespace}` : '';
      const cmd = `kubectl --kubeconfig="${kubeconfigPath}" --context="${context}" get ${resourceType} ${name} ${namespaceFlag} -o json`;
      
      const { stdout } = await execAsync(cmd);
      return JSON.parse(stdout);
    } catch (error: any) {
      throw createError(`Failed to get ${params.resourceType} ${params.name}: ${error.message}`, 500);
    }
  }

  async deleteResource(params: ResourceParams) {
    try {
      const { kubeconfigPath, context, namespace, resourceType, name } = params;
      
      if (!name) {
        throw createError('Resource name is required', 400);
      }

      const namespaceFlag = namespace ? `-n ${namespace}` : '';
      const cmd = `kubectl --kubeconfig="${kubeconfigPath}" --context="${context}" delete ${resourceType} ${name} ${namespaceFlag}`;
      
      await execAsync(cmd);
      return { success: true };
    } catch (error: any) {
      throw createError(`Failed to delete ${params.resourceType} ${params.name}: ${error.message}`, 500);
    }
  }

  async scaleResource(params: ScaleParams) {
    try {
      const { kubeconfigPath, context, namespace, resourceType, name, replicas } = params;
      
      if (!name) {
        throw createError('Resource name is required', 400);
      }

      const namespaceFlag = namespace ? `-n ${namespace}` : '';
      const cmd = `kubectl --kubeconfig="${kubeconfigPath}" --context="${context}" scale ${resourceType} ${name} --replicas=${replicas} ${namespaceFlag}`;
      
      await execAsync(cmd);
      return { success: true };
    } catch (error: any) {
      throw createError(`Failed to scale ${params.resourceType} ${params.name}: ${error.message}`, 500);
    }
  }

  async restartResource(params: ResourceParams) {
    try {
      const { kubeconfigPath, context, namespace, resourceType, name } = params;
      
      if (!name) {
        throw createError('Resource name is required', 400);
      }

      const namespaceFlag = namespace ? `-n ${namespace}` : '';
      const cmd = `kubectl --kubeconfig="${kubeconfigPath}" --context="${context}" rollout restart ${resourceType} ${name} ${namespaceFlag}`;
      
      await execAsync(cmd);
      return { success: true };
    } catch (error: any) {
      throw createError(`Failed to restart ${params.resourceType} ${params.name}: ${error.message}`, 500);
    }
  }

  async listResourceEvents(params: ResourceParams) {
    try {
      const { kubeconfigPath, context, namespace, resourceType, name } = params;
      
      if (!name) {
        throw createError('Resource name is required', 400);
      }

      const namespaceFlag = namespace ? `-n ${namespace}` : '';
      const cmd = `kubectl --kubeconfig="${kubeconfigPath}" --context="${context}" get events --field-selector involvedObject.name=${name} ${namespaceFlag} -o json`;
      
      const { stdout } = await execAsync(cmd);
      return JSON.parse(stdout);
    } catch (error: any) {
      throw createError(`Failed to get events for ${params.resourceType} ${params.name}: ${error.message}`, 500);
    }
  }

  async listNamespaces(params: KubeConfig) {
    try {
      const { kubeconfigPath, context } = params;
      const cmd = `kubectl --kubeconfig="${kubeconfigPath}" --context="${context}" get namespaces -o json`;
      
      const { stdout } = await execAsync(cmd);
      return JSON.parse(stdout);
    } catch (error: any) {
      throw createError(`Failed to list namespaces: ${error.message}`, 500);
    }
  }

  async cordonNode(params: NodeParams) {
    try {
      const { kubeconfigPath, context, nodeName } = params;
      const cmd = `kubectl --kubeconfig="${kubeconfigPath}" --context="${context}" cordon ${nodeName}`;
      
      await execAsync(cmd);
      return { success: true };
    } catch (error: any) {
      throw createError(`Failed to cordon node ${params.nodeName}: ${error.message}`, 500);
    }
  }

  async uncordonNode(params: NodeParams) {
    try {
      const { kubeconfigPath, context, nodeName } = params;
      const cmd = `kubectl --kubeconfig="${kubeconfigPath}" --context="${context}" uncordon ${nodeName}`;
      
      await execAsync(cmd);
      return { success: true };
    } catch (error: any) {
      throw createError(`Failed to uncordon node ${params.nodeName}: ${error.message}`, 500);
    }
  }

  async drainNode(params: NodeParams) {
    try {
      const { kubeconfigPath, context, nodeName } = params;
      const cmd = `kubectl --kubeconfig="${kubeconfigPath}" --context="${context}" drain ${nodeName} --ignore-daemonsets --delete-emptydir-data --force`;
      
      await execAsync(cmd);
      return { success: true };
    } catch (error: any) {
      throw createError(`Failed to drain node ${params.nodeName}: ${error.message}`, 500);
    }
  }

  async listPodsOnNode(params: NodeParams) {
    try {
      const { kubeconfigPath, context, nodeName } = params;
      const cmd = `kubectl --kubeconfig="${kubeconfigPath}" --context="${context}" get pods --all-namespaces --field-selector spec.nodeName=${nodeName} -o json`;
      
      const { stdout } = await execAsync(cmd);
      return JSON.parse(stdout);
    } catch (error: any) {
      throw createError(`Failed to list pods on node ${params.nodeName}: ${error.message}`, 500);
    }
  }

  async getPodLogs(params: ResourceParams & { container?: string; follow?: boolean }) {
    try {
      const { kubeconfigPath, context, namespace, name, container } = params;
      
      if (!name) {
        throw createError('Pod name is required', 400);
      }

      const namespaceFlag = namespace ? `-n ${namespace}` : '';
      const containerFlag = container ? `-c ${container}` : '';
      const cmd = `kubectl --kubeconfig="${kubeconfigPath}" --context="${context}" logs ${name} ${containerFlag} ${namespaceFlag}`;
      
      const { stdout } = await execAsync(cmd);
      return { logs: stdout };
    } catch (error: any) {
      throw createError(`Failed to get logs for pod ${params.name}: ${error.message}`, 500);
    }
  }
}