import { api } from './api-client';

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

export const apiService = {
  login: async (phoneNumber: string, password: string) => {
    const data = await api.post('/api/auth/login/', { phone_number: phoneNumber, password });
    if (data.access) {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  getStats: (): Promise<DashboardStats> => api.get('/api/dashboard/stats/'),

  getComplaints: (type: 'active' | 'closed' | 'all' = 'all'): Promise<CyberComplaint[]> => {
    if (type === 'active') return api.get('/api/complaints/active/');
    if (type === 'closed') return api.get('/api/complaints/closed/');
    return api.get('/api/complaints/');
  },

  addComplaint: (formData: FormData) => api.post('/api/complaints/', formData),

  updateComplaint: (id: string, formData: FormData) => api.patch(`/api/complaints/${id}/`, formData),

  closeComplaint: (id: string, passwordConfirm: string) =>
    api.post(`/api/complaints/${id}/close/`, { password_confirm: passwordConfirm }),

  deleteComplaint: (id: string) => api.delete(`/api/complaints/${id}/`),

  getAdvEntries: (): Promise<AdvEntry[]> => api.get('/api/fees/adv/'),

  addAdvEntry: (data: { name: string, fees: number, password_confirm: string }) =>
    api.post('/api/fees/adv/', data),

  getCyberEntries: (): Promise<CyberEntry[]> => api.get('/api/fees/cyber/'),

  addCyberEntry: (data: { name: string, fees: number, password_confirm: string }) =>
    api.post('/api/fees/cyber/', data),
};
