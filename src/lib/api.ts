const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Same origin in production
  : 'http://localhost:3001'; // Development server

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async invoke<T = any>(command: string, args?: any): Promise<T> {
    const url = `${this.baseUrl}/api/${command.replace('_', '/')}`;
    
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    };

    if (args) {
      options.body = JSON.stringify(args);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  }

  async get<T = any>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}/api/${endpoint}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}/api/${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();

// For backward compatibility with Tauri invoke pattern
export const invoke = <T = any>(command: string, args?: any): Promise<T> => {
  return apiClient.invoke<T>(command, args);
};