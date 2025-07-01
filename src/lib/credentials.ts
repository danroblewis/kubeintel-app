import { credentialsApi } from './api-client';

export const credentials = {
  setSecret: async ({
    key,
    value,
  }: {
    key: string;
    value: string;
  }): Promise<void> => {
    await credentialsApi.setSecret(key, value);
  },

  getSecret: async (key: string): Promise<string> => {
    const result = await credentialsApi.getSecret(key);
    return result.value || '';
  },

  removeSecret: async (key: string): Promise<void> => {
    await credentialsApi.removeSecret(key);
  },
};
