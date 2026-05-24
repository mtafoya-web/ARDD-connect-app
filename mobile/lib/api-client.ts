import { API_BASE_URL } from '@/constants/Config';
import { useAuthStore } from '@/store/auth-store';

class ApiClient {
  private baseUrl = API_BASE_URL;

  private getHeaders(contentType?: string): HeadersInit {
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
      headers: this.getHeaders('application/json'),
    });
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[ApiClient] GET ${url} → ${res.status}`, body);
      throw new Error(`API Error ${res.status}: ${body || res.statusText}`);
    }
    return res.json();
  }

  async post<T>(path: string, body?: unknown, isFormEncoded = false): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let headers: HeadersInit;
    let bodyPayload: string | FormData | undefined;

    if (isFormEncoded && body && typeof body === 'object') {
      // x-www-form-urlencoded — required for /auth/login
      headers = this.getHeaders('application/x-www-form-urlencoded');
      bodyPayload = new URLSearchParams(body as Record<string, string>).toString();
    } else if (body instanceof FormData) {
      // Multipart — do NOT set Content-Type, let fetch set the boundary
      headers = this.getHeaders(undefined);
      bodyPayload = body;
    } else {
      headers = this.getHeaders('application/json');
      bodyPayload = body ? JSON.stringify(body) : undefined;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: bodyPayload,
    });
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`[ApiClient] POST ${url} → ${res.status}`, errBody);
      throw new Error(errBody || `API Error ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  async delete<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders('application/json'),
    });
    if (res.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[ApiClient] DELETE ${url} → ${res.status}`, body);
      throw new Error(`API Error ${res.status}: ${body || res.statusText}`);
    }
    return res.json();
  }
}

export const apiClient = new ApiClient();
