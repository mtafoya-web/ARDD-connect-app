import { API_BASE_URL } from '@/constants/Config';
import { useAuthStore } from '@/store/auth-store';

class ApiClient {
  private baseUrl = API_BASE_URL;

  private getHeaders(contentType = 'application/json'): HeadersInit {
    const headers: HeadersInit = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    const token = useAuthStore.getState().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }
    return res.json();
  }

  async post<T>(path: string, body?: unknown, isFormEncoded = false): Promise<T> {
    let headers: HeadersInit;
    let bodyStr: string | undefined;

    if (isFormEncoded && body && typeof body === 'object') {
      headers = this.getHeaders('application/x-www-form-urlencoded');
      bodyStr = new URLSearchParams(body as Record<string, string>).toString();
    } else {
      headers = this.getHeaders('application/json');
      bodyStr = body ? JSON.stringify(body) : undefined;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: bodyStr,
    });
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(errBody || `API Error: ${res.status}`);
    }
    return res.json();
  }

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }
    return res.json();
  }
}

export const apiClient = new ApiClient();
