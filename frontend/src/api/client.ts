const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.details?.join('; ') || 'Request failed');
  }
  return data as T;
}

export function testConnection(connectionString: string) {
  return request<{ ok: boolean; connectionId: string }>('/connections/test', {
    method: 'POST',
    body: JSON.stringify({ connectionString }),
  });
}

export function listTables(connectionId: string) {
  return request<{ tables: string[] }>(`/connections/${connectionId}/tables`);
}

export function listColumns(connectionId: string, table: string) {
  return request<{ columns: { name: string; type: string }[] }>(
    `/connections/${connectionId}/tables/${table}/columns`
  );
}

export function previewData(
  connectionId: string,
  table: string,
  limit: number,
  mapping: { sourceColumn: string; targetPath: string }[]
) {
  return request<{ rows: Record<string, unknown>[] }>(
    `/connections/${connectionId}/preview`,
    {
      method: 'POST',
      body: JSON.stringify({ table, limit, mapping }),
    }
  );
}
