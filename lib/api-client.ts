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
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[ApiClient] GET ${url} failed:`, res.status, body);
      throw new Error(`API Error ${res.status}: ${body || res.statusText}`);
    }
    return res.json();
  }

  async post<T>(path: string, body?: unknown, isFormEncoded = false): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let headers: HeadersInit;
    let bodyStr: string | undefined;

    if (isFormEncoded && body && typeof body === 'object') {
      headers = this.getHeaders('application/x-www-form-urlencoded');
      bodyStr = new URLSearchParams(body as Record<string, string>).toString();
    } else {
      headers = this.getHeaders('application/json');
      bodyStr = body ? JSON.stringify(body) : undefined;
    }

    const res = await fetch(url, {
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
      console.error(`[ApiClient] POST ${url} failed:`, res.status, errBody);
      throw new Error(errBody || `API Error ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  async delete<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[ApiClient] DELETE ${url} failed:`, res.status, body);
      throw new Error(`API Error ${res.status}: ${body || res.statusText}`);
    }
    return res.json();
  }
}

export const apiClient = new ApiClient();
