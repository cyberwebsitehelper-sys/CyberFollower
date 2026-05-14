"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiService, type AdvEntry, type CyberComplaint, type CyberEntry, type DashboardStats } from "@/lib/api-service";

type DataStoreContextType = {
  activeComplaints: CyberComplaint[];
  closedComplaints: CyberComplaint[];
  advEntries: AdvEntry[];
  cyberEntries: CyberEntry[];
  stats: DashboardStats;
  isLoading: boolean;
  reloadAll: () => Promise<void>;
  addComplaint: (formData: FormData) => Promise<void>;
  updateComplaint: (id: string, formData: FormData) => Promise<void>;
  closeComplaint: (id: string, passwordConfirm: string, nocFile?: File | null, comment?: string | null) => Promise<void>;
  deleteComplaint: (id: string, passwordConfirm?: string) => Promise<void>;
  addAdvEntry: (data: { name: string; fees: number; password_confirm: string }) => Promise<void>;
  addCyberEntry: (data: { name: string; fees: number; password_confirm: string }) => Promise<void>;
};

const DataStoreContext = createContext<DataStoreContextType | null>(null);
const COMPLAINTS_CACHE_KEY = "cf_complaints_cache_v1";

const defaultStats: DashboardStats = {
  active_count: 0,
  closed_count: 0,
  adv_fee_total: 0,
  cyber_fee_total: 0,
  grand_total_fees: 0,
};

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [activeComplaints, setActiveComplaints] = useState<CyberComplaint[]>([]);
  const [closedComplaints, setClosedComplaints] = useState<CyberComplaint[]>([]);
  const [advEntries, setAdvEntries] = useState<AdvEntry[]>([]);
  const [cyberEntries, setCyberEntries] = useState<CyberEntry[]>([]);
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(false);

  const setComplaintBuckets = useCallback((rows: CyberComplaint[]) => {
    const sorted = [...rows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setActiveComplaints(sorted.filter((c) => !c.is_complete));
    setClosedComplaints(sorted.filter((c) => c.is_complete));
  }, []);

  const saveComplaintCache = useCallback((rows: CyberComplaint[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COMPLAINTS_CACHE_KEY, JSON.stringify(rows));
  }, []);

  const hydrateComplaintCache = useCallback(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(COMPLAINTS_CACHE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as CyberComplaint[];
      if (Array.isArray(parsed)) setComplaintBuckets(parsed);
    } catch {}
  }, [setComplaintBuckets]);

  const extractData = (res: any) => {
    if (res.status !== "fulfilled") return [];
    return Array.isArray(res.value) ? res.value : res.value?.results || res.value?.data || [];
  };

  const reloadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled([
        apiService.getComplaints("all"),
        apiService.getAdvEntries(),
        apiService.getCyberEntries(),
        apiService.getStats(),
      ]);

      const allComplaints = extractData(results[0]) as CyberComplaint[];
      setComplaintBuckets(allComplaints);
      saveComplaintCache(allComplaints);
      setAdvEntries(extractData(results[1]) as AdvEntry[]);
      setCyberEntries(extractData(results[2]) as CyberEntry[]);
      if (results[3].status === "fulfilled" && results[3].value) {
        setStats(results[3].value);
      }
    } catch {
      hydrateComplaintCache();
    } finally {
      setIsLoading(false);
    }
  }, [hydrateComplaintCache, saveComplaintCache, setComplaintBuckets]);

  const addComplaint = useCallback(async (formData: FormData) => {
    await apiService.addComplaint(formData);
    await reloadAll();
  }, [reloadAll]);

  const updateComplaint = useCallback(async (id: string, formData: FormData) => {
    await apiService.updateComplaint(id, formData);
    await reloadAll();
  }, [reloadAll]);

  const closeComplaint = useCallback(async (id: string, passwordConfirm: string, nocFile?: File | null, comment?: string | null) => {
    if (nocFile) {
      const formData = new FormData();
      formData.append("noc_file", nocFile);
      formData.append("password_confirm", passwordConfirm);
      formData.append("comment", comment?.trim() ? comment.trim() : "");
      await apiService.uploadNoc(id, formData);
    } else {
      await apiService.closeComplaint(id, passwordConfirm, comment);
    }
    await reloadAll();
  }, [reloadAll]);

  const deleteComplaint = useCallback(async (id: string, passwordConfirm?: string) => {
    await apiService.deleteComplaint(id, passwordConfirm);
    await reloadAll();
  }, [reloadAll]);

  const addAdvEntry = useCallback(async (data: { name: string; fees: number; password_confirm: string }) => {
    await apiService.addAdvEntry(data);
    await reloadAll();
  }, [reloadAll]);

  const addCyberEntry = useCallback(async (data: { name: string; fees: number; password_confirm: string }) => {
    await apiService.addCyberEntry(data);
    await reloadAll();
  }, [reloadAll]);

  useEffect(() => {
    hydrateComplaintCache();
  }, [hydrateComplaintCache]);

  const value = useMemo(
    () => ({
      activeComplaints,
      closedComplaints,
      advEntries,
      cyberEntries,
      stats,
      isLoading,
      reloadAll,
      addComplaint,
      updateComplaint,
      closeComplaint,
      deleteComplaint,
      addAdvEntry,
      addCyberEntry,
    }),
    [
      activeComplaints,
      closedComplaints,
      advEntries,
      cyberEntries,
      stats,
      isLoading,
      reloadAll,
      addComplaint,
      updateComplaint,
      closeComplaint,
      deleteComplaint,
      addAdvEntry,
      addCyberEntry,
    ]
  );

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext);
  if (!ctx) throw new Error("useDataStore must be used within DataStoreProvider");
  return ctx;
}
