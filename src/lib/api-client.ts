// API client to replace Tauri invoke calls
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new ApiError(response.status, error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Kubernetes API calls
export const kubernetesApi = {
  listResource: (params: {
    kubeconfigPath: string;
    context: string;
    namespace?: string;
    resourceType: string;
  }) => apiRequest('/kubernetes/resources/list', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  getResource: (params: {
    kubeconfigPath: string;
    context: string;
    namespace?: string;
    resourceType: string;
    name: string;
  }) => apiRequest('/kubernetes/resources/get', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  deleteResource: (params: {
    kubeconfigPath: string;
    context: string;
    namespace?: string;
    resourceType: string;
    name: string;
  }) => apiRequest('/kubernetes/resources/delete', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  scaleResource: (params: {
    kubeconfigPath: string;
    context: string;
    namespace?: string;
    resourceType: string;
    name: string;
    replicas: number;
  }) => apiRequest('/kubernetes/resources/scale', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  restartResource: (params: {
    kubeconfigPath: string;
    context: string;
    namespace?: string;
    resourceType: string;
    name: string;
  }) => apiRequest('/kubernetes/resources/restart', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  listResourceEvents: (params: {
    kubeconfigPath: string;
    context: string;
    namespace?: string;
    resourceType: string;
    name: string;
  }) => apiRequest('/kubernetes/resources/events', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  listNamespaces: (params: {
    kubeconfigPath: string;
    context: string;
  }) => apiRequest('/kubernetes/namespaces', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  // Node operations
  cordonNode: (params: {
    kubeconfigPath: string;
    context: string;
    nodeName: string;
  }) => apiRequest('/kubernetes/nodes/cordon', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  uncordonNode: (params: {
    kubeconfigPath: string;
    context: string;
    nodeName: string;
  }) => apiRequest('/kubernetes/nodes/uncordon', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  drainNode: (params: {
    kubeconfigPath: string;
    context: string;
    nodeName: string;
  }) => apiRequest('/kubernetes/nodes/drain', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  listPodsOnNode: (params: {
    kubeconfigPath: string;
    context: string;
    nodeName: string;
  }) => apiRequest('/kubernetes/nodes/pods', {
    method: 'POST',
    body: JSON.stringify(params),
  }),
};

// Credentials API calls
export const credentialsApi = {
  setSecret: (key: string, value: string) => apiRequest('/credentials/set', {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  }),

  getSecret: (key: string) => apiRequest<{ value: string | null }>('/credentials/get', {
    method: 'POST',
    body: JSON.stringify({ key }),
  }),

  removeSecret: (key: string) => apiRequest('/credentials/remove', {
    method: 'POST',
    body: JSON.stringify({ key }),
  }),
};

// Config API calls
export const configApi = {
  readKubeconfig: (kubeconfigPath: string) => apiRequest('/config/kubeconfig/read', {
    method: 'POST',
    body: JSON.stringify({ kubeconfigPath }),
  }),

  getClusterInfo: (kubeconfigPath: string, context: string) => apiRequest('/config/cluster/info', {
    method: 'POST',
    body: JSON.stringify({ kubeconfigPath, context }),
  }),

  isKubectlInstalled: () => apiRequest<{ installed: boolean }>('/config/kubectl/check'),
};

// WebSocket connection for real-time features
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;

  constructor() {
    const wsUrl = import.meta.env.VITE_WS_URL || 
      (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + 
      '//' + window.location.host + '/ws';
    this.url = wsUrl;
  }

  connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        resolve(this.ws!);
      };
      
      this.ws.onerror = (error) => {
        reject(error);
      };
    });
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onMessage(callback: (data: any) => void) {
    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    }
  }
}

// Clipboard functionality replacement
export const clipboardApi = {
  writeText: async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  },
};

export { ApiError };