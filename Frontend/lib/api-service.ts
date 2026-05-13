import { api, API_BASE_URL, setSessionTokens } from './api-client';

export interface CyberComplaint {
  id: string;
  bank_name: string;
  ack_number: string;
  ifsc_code: string;
  state_name: string;
  district: string;
  layer: string;
  txn_amount: number;
  dispute_amount: number;
  utr_number: string;
  police_station: string;
  vendor_name: string;
  noc_file: string | null;
  noc_file_url?: string | null;
  noc_file_name?: string | null;
  is_complete: boolean;
  created_at: string;
  completed_at: string | null;
  employee: string;
}

export interface AdvEntry {
  id: string;
  name: string;
  fees: number;
  created_at: string;
  employee: string;
}

export interface CyberEntry {
  id: string;
  name: string;
  fees: number;
  created_at: string;
  employee: string;
}

export interface DashboardStats {
  active_count: number;
  closed_count: number;
  adv_fee_total: number;
  cyber_fee_total: number;
  grand_total_fees: number;
}

const resolveFileUrl = (value: string | null): string | null => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  let normalizedPath = value.startsWith('/') ? value : `/${value}`;
  if (normalizedPath.startsWith('/noc/')) {
    normalizedPath = `/media${normalizedPath}`;
  }
  return `${API_BASE_URL}${normalizedPath}`;
};

const normalizeIdValue = (raw: any): string => {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return "";
    if (s.startsWith("{") && s.endsWith("}")) {
      try {
        const parsed = JSON.parse(s);
        return normalizeIdValue(parsed);
      } catch {
        return s;
      }
    }
    return s;
  }
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "object") {
    return String(
      raw.$oid ??
      raw.oid ??
      raw.id ??
      raw.pk ??
      raw._id?.$oid ??
      raw._id ??
      ""
    ).trim();
  }
  return String(raw).trim();
};

const encodeEntityId = (id: any): string => encodeURIComponent(normalizeIdValue(id));

const normalizeComplaint = (item: CyberComplaint): CyberComplaint => ({
  ...item,
  id: normalizeIdValue((item as any).id ?? (item as any)._id ?? (item as any).pk),
  noc_file: resolveFileUrl(item.noc_file || item.noc_file_url || null),
});

export const apiService = {
  login: async (phoneNumber: string, password: string) => {
    const data = await api.post('/api/auth/login/', { phone_number: phoneNumber, password });
    if (data.access) {
      setSessionTokens(data.access, data.refresh || null);
    }
    return data;
  },

  getStats: (): Promise<DashboardStats> => api.get('/api/dashboard/stats/'),

  getComplaints: async (type: 'active' | 'closed' | 'all' = 'all'): Promise<CyberComplaint[]> => {
    const endpoint =
      type === 'active'
        ? '/api/complaints/active/'
        : type === 'closed'
          ? '/api/complaints/closed/'
          : '/api/complaints/';

    const data = await api.get(endpoint);
    const rows = Array.isArray(data) ? data : data?.results || [];
    return rows.map(normalizeComplaint);
  },

  addComplaint: (formData: FormData) => api.post('/api/complaints/', formData),

  updateComplaint: (id: string, formData: FormData) => api.patch(`/api/complaints/${encodeEntityId(id)}/`, formData),
  uploadNoc: (id: string, formData: FormData) => api.post(`/api/complaints/${encodeEntityId(id)}/upload-noc/`, formData),

  closeComplaint: (id: string, passwordConfirm: string) =>
    api.post(`/api/complaints/${encodeEntityId(id)}/close/`, { password_confirm: passwordConfirm }),

  deleteComplaint: (id: string, passwordConfirm?: string) => api.delete(`/api/complaints/${encodeEntityId(id)}/`, { password_confirm: passwordConfirm }),

  getAdvEntries: (): Promise<AdvEntry[]> => api.get('/api/fees/adv/'),

  addAdvEntry: (data: { name: string, fees: number, password_confirm: string }) =>
    api.post('/api/fees/adv/', data),

  getCyberEntries: (): Promise<CyberEntry[]> => api.get('/api/fees/cyber/'),

  addCyberEntry: (data: { name: string, fees: number, password_confirm: string }) =>
    api.post('/api/fees/cyber/', data),
};
