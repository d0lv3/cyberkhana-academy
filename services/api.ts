/* ─── API client ───
 * Sessions ride in an httpOnly cookie set by the backend (immune to XSS token
 * theft), so every request just needs credentials: 'include'. No tokens are
 * ever stored in localStorage.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new ApiError(
        (body as { error?: string }).error || `HTTP ${response.status}`,
        response.status
      );
    }

    return response.json();
  }

  get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  /** Multipart upload — the browser sets the Content-Type boundary itself. */
  async upload<T>(path: string, field: string, file: File): Promise<T> {
    const form = new FormData();
    form.append(field, file);
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new ApiError(
        (body as { error?: string }).error || `HTTP ${response.status}`,
        response.status
      );
    }
    return response.json();
  }
}

export const api = new ApiService(API_BASE);
