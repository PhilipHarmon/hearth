async function req(path, { method = 'GET', body } = {}) {
  const headers = {};
  const isForm = body instanceof FormData;
  if (body && !isForm) headers['Content-Type'] = 'application/json';
  if (localStorage.token) headers.Authorization = 'Bearer ' + localStorage.token;
  const res = await fetch('/api' + path, { method, headers, body: body && !isForm ? JSON.stringify(body) : body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}

export const api = {
  get: (p) => req(p),
  post: (p, body = {}) => req(p, { method: 'POST', body }),
  put: (p, body) => req(p, { method: 'PUT', body }),
  patch: (p) => req(p, { method: 'PATCH' }),
  del: (p) => req(p, { method: 'DELETE' }),
};

export const upload = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return req('/media', { method: 'POST', body: fd });
};

export const mediaUrl = (id) => (id ? `/api/media/${id}` : null);

// Tells the nav bar to re-check its unread badges right away
export const refreshCounts = () => window.dispatchEvent(new Event('hearth:counts'));
