import { createError } from '../middleware/errorHandler';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const access = promisify(fs.access);

export class CredentialsService {
  private getCredentialsDir(): string {
    return path.join(os.homedir(), '.kubeintel', 'credentials');
  }

  private getCredentialPath(key: string): string {
    return path.join(this.getCredentialsDir(), `${key}.json`);
  }

  private async ensureCredentialsDir(): Promise<void> {
    const dir = this.getCredentialsDir();
    try {
      await access(dir);
    } catch {
      await mkdir(dir, { recursive: true });
    }
  }

  async setSecret(key: string, value: string): Promise<void> {
    try {
      await this.ensureCredentialsDir();
      const credentialPath = this.getCredentialPath(key);
      
      // Simple encryption would be better in production
      const data = {
        value: Buffer.from(value).toString('base64'),
        timestamp: new Date().toISOString(),
      };
      
      await writeFile(credentialPath, JSON.stringify(data), { mode: 0o600 });
    } catch (error: any) {
      throw createError(`Failed to set secret: ${error.message}`, 500);
    }
  }

  async getSecret(key: string): Promise<string | null> {
    try {
      const credentialPath = this.getCredentialPath(key);
      
      try {
        const data = await readFile(credentialPath, 'utf8');
        const parsed = JSON.parse(data);
        return Buffer.from(parsed.value, 'base64').toString('utf8');
      } catch {
        return null;
      }
    } catch (error: any) {
      throw createError(`Failed to get secret: ${error.message}`, 500);
    }
  }

  async removeSecret(key: string): Promise<void> {
    try {
      const credentialPath = this.getCredentialPath(key);
      
      try {
        await unlink(credentialPath);
      } catch {
        // File doesn't exist, which is fine
      }
    } catch (error: any) {
      throw createError(`Failed to remove secret: ${error.message}`, 500);
    }
  }
}