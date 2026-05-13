const envUrl = process.env.NEXT_PUBLIC_API_URL;
const API_BASE_URL = (envUrl && envUrl.trim() !== "")
  ? envUrl.trim().replace(/\/+$/, '')
  : (
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:8000`
        : "http://127.0.0.1:8000"
    );

let refreshPromise: Promise<string | null> | null = null;
let accessToken: string | null = null;
let refreshTokenValue: string | null = null;

function setSessionTokens(access: string | null, refresh: string | null) {
  accessToken = access || null;
  refreshTokenValue = refresh || null;
}

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!refreshTokenValue) return null;

  const subPath = 'api/auth/refresh/';
  const finalUrl = `${API_BASE_URL}/${subPath}`;
  const response = await fetch(finalUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshTokenValue }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  if (data?.access) {
    accessToken = data.access;
    return data.access;
  }
  return null;
}

function clearSessionAndRedirect() {
  if (typeof window === 'undefined') return;
  setSessionTokens(null, null);
  window.location.href = '/';
}

async function fetchWithAuth(url: string, options: RequestInit = {}, isRetry = false) {
  const token = typeof window !== 'undefined' ? accessToken : null;

  const headers: HeadersInit = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const subPath = url.replace(/^\/+/, '');
  const finalUrl = `${API_BASE_URL}/${subPath}`;

  console.log(`[API] ${options.method || 'GET'} ${finalUrl}`);

  const response = await fetch(finalUrl, { ...options, headers });

  if (response.status === 401 && !isRetry) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      return fetchWithAuth(url, options, true);
    }
    clearSessionAndRedirect();
    throw new Error("Session expired. Please login again.");
  }

  if (response.status === 401) {
    clearSessionAndRedirect();
    throw new Error("Session expired. Please login again.");
  }
  
  if (!response.ok) {
    let errorMsg = `Error ${response.status}: ${response.statusText}`;
    let errorData = null;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json();
        if (errorData?.detail) {
          errorMsg = errorData.detail;
        } else if (errorData?.error) {
          errorMsg = errorData.error;
        } else if (typeof errorData === "object" && errorData !== null) {
          const firstKey = Object.keys(errorData)[0];
          const firstVal = firstKey ? errorData[firstKey] : null;
          if (Array.isArray(firstVal) && firstVal.length > 0) {
            errorMsg = String(firstVal[0]);
          } else if (typeof firstVal === "string" && firstVal.trim() !== "") {
            errorMsg = firstVal;
          } else {
            errorMsg = JSON.stringify(errorData);
          }
        }
      }
    } catch (e) {}

    const error: any = new Error(errorMsg);
    error.response = { data: errorData };
    throw error;
  }

  return response;
}

export const api = {
  get: (url: string) => fetchWithAuth(url, { method: 'GET' }).then(res => res.json()),
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
  delete: (url: string, data?: any) => {
    return fetchWithAuth(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    }).then(res => {
      if (res.status === 204) return null;
      return res.json();
    });
  },
};

export { API_BASE_URL };
export { setSessionTokens };
