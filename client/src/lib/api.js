const BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || res.statusText);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export const endpoints = {
  me: () => api('/auth/me'),
  login: () => { window.location.href = `${BASE}/auth/google`; },
  logout: () => api('/auth/logout'),
  tasks: {
    list: (date) => api(`/api/tasks?date=${encodeURIComponent(date)}`),
  create: (date, text, opts={}) => api('/api/tasks', { method: 'POST', body: JSON.stringify({ date, text, ...opts }) }),
    update: (id, data) => api(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => api(`/api/tasks/${id}`, { method: 'DELETE' }),
  },
  diary: {
    get: (date) => api(`/api/diary?date=${encodeURIComponent(date)}`),
    put: (date, text) => api('/api/diary', { method: 'PUT', body: JSON.stringify({ date, text }) }),
  },
  stats: (period) => api(`/api/stats?period=${period}`),
  meExport: () => fetch(`${BASE}/api/me/export`, { credentials: 'include' }),
  meDelete: () => api('/api/me', { method: 'DELETE' }),
  theme: (theme) => api('/api/me/theme', { method: 'PATCH', body: JSON.stringify({ theme }) }),
};
