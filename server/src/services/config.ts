import { createError } from '../middleware/errorHandler';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

const execAsync = promisify(exec);
const readFile = promisify(fs.readFile);

export class ConfigService {
  async readKubeconfig(kubeconfigPath: string): Promise<any> {
    try {
      const content = await readFile(kubeconfigPath, 'utf8');
      return yaml.load(content);
    } catch (error: any) {
      throw createError(`Failed to read kubeconfig: ${error.message}`, 500);
    }
  }

  async getClusterInfo(kubeconfigPath: string, context: string): Promise<any> {
    try {
      const cmd = `kubectl --kubeconfig="${kubeconfigPath}" --context="${context}" cluster-info --output=json`;
      const { stdout } = await execAsync(cmd);
      return JSON.parse(stdout);
    } catch (error: any) {
      throw createError(`Failed to get cluster info: ${error.message}`, 500);
    }
  }

  async isKubectlInstalled(): Promise<boolean> {
    try {
      await execAsync('kubectl version --client');
      return true;
    } catch {
      return false;
    }
  }
}