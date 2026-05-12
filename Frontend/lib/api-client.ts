const envUrl = process.env.NEXT_PUBLIC_API_URL;
const BASE_URL = (envUrl && envUrl.trim() !== "")
  ? envUrl.trim().replace(/\/+$/, '')
  : 'http://127.0.0.1:8000';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers: HeadersInit = {
    ...options.headers,
    'Authorization': token ? `Bearer ${token}` : '',
  };

  // Prevent double slashes
  const subPath = url.replace(/^\/+/, '');
  const finalUrl = `${BASE_URL}/${subPath}`;

  console.log('Fetching:', finalUrl);

  const response = await fetch(finalUrl, { ...options, headers });

  // Handle Authentication Errors
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    throw new Error("Session expired. Please login again.");
  }

  // Check if response is actually JSON
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error("Non-JSON Response:", text.substring(0, 200));
    throw new Error(`Server returned ${response.status} (HTML/Text). Check if Backend is running.`);
  }

  return response;
}

export const api = {
  get: (url: string) => fetchWithAuth(url).then(res => res.json()),
  post: (url: string, data: any) => {
    const isFormData = data instanceof FormData;
    return fetchWithAuth(url, {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data),
    }).then(res => res.json());
  },
  put: (url: string, data: any) => {
    const isFormData = data instanceof FormData;
    return fetchWithAuth(url, {
      method: 'PUT',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data),
    }).then(res => res.json());
  },
  patch: (url: string, data: any) => {
    const isFormData = data instanceof FormData;
    return fetchWithAuth(url, {
      method: 'PATCH',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data),
    }).then(res => res.json());
  },
  delete: (url: string) => fetchWithAuth(url, { method: 'DELETE' }).then(res => {
    if (res.status === 204) return null;
    return res.json();
  }),
};
