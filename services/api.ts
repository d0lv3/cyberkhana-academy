/* ─── API client ───
 * Sessions ride in an httpOnly cookie set by the backend (immune to XSS token
 * theft), so every request just needs credentials: 'include'. No tokens are
 * ever stored in localStorage.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

export class ApiError extends Error {
  status: number;
  /** The JSON the server answered with, for a `code` or anything else it sent
   *  alongside the message. Empty when the body was not JSON. */
  body: Record<string, unknown>;

  constructor(message: string, status: number, body: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        throw new ApiError(
          (typeof body.error === 'string' && body.error) || `HTTP ${response.status}`,
          response.status,
          body
        );
      }

      return await response.json();
    } catch (error) {
      if (controller.signal.aborted) throw new Error('The connection timed out. Please try again.');
      throw error;
    } finally {
      clearTimeout(timer);
    }
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

  delete<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'DELETE',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
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
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      throw new ApiError(
        (typeof body.error === 'string' && body.error) || `HTTP ${response.status}`,
        response.status,
        body
      );
    }
    return response.json();
  }
}

export const api = new ApiService(API_BASE);
