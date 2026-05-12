"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoginPage } from "@/components/login-page";
import { Dashboard, type DashboardView } from "@/components/dashboard";
import { ActiveComplaints } from "@/components/active-complaints";
import { ClosedComplaints } from "@/components/closed-complaints";
import { EmployeeData } from "@/components/employee-data";
import { FeesManagement } from "@/components/fees-management";
import { HistoryAnalytics } from "@/components/history-analytics";
import { apiService, type CyberComplaint, type AdvEntry, type CyberEntry, type DashboardStats } from "@/lib/api-service";
import { toast } from "sonner";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>("dashboard");
  const [activeComplaints, setActiveComplaints] = useState<CyberComplaint[]>([]);
  const [closedComplaints, setClosedComplaints] = useState<CyberComplaint[]>([]);
  const [advEntries, setAdvEntries] = useState<AdvEntry[]>([]);
  const [cyberEntries, setCyberEntries] = useState<CyberEntry[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    active_count: 0,
    closed_count: 0,
    adv_fee_total: 0,
    cyber_fee_total: 0,
    grand_total_fees: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
      refreshData();
    }
  }, []);

  const refreshData = async () => {
    try {
      const results = await Promise.allSettled([
        apiService.getComplaints('active'),
        apiService.getComplaints('closed'),
        apiService.getAdvEntries(),
        apiService.getCyberEntries(),
        apiService.getStats(),
      ]);

      const extractData = (res: any) => {
        if (res.status !== 'fulfilled') return [];
        return Array.isArray(res.value) ? res.value : res.value?.results || res.value?.data || [];
      };

      setActiveComplaints(extractData(results[0]));
      setClosedComplaints(extractData(results[1]));
      setAdvEntries(extractData(results[2]));
      setCyberEntries(extractData(results[3]));
      if (results[4].status === 'fulfilled' && results[4].value) {
        setStats(results[4].value);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  const handleLogin = async (phoneNumber: string, passwordConfirm: string) => {
    try {
      const data = await apiService.login(phoneNumber, passwordConfirm);
      if (data.access) {
        setIsLoggedIn(true);
        refreshData();
        toast.success("Logged in successfully");
      } else {
        toast.error(data.detail || "Login failed");
        throw new Error(data.detail || "Login failed");
      }
    } catch (error: any) {
      toast.error("Login failed. Please check your credentials.");
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setCurrentView("dashboard");
    toast.info("Logged out");
  };

  const handleAddComplaint = async (formData: FormData) => {
    try {
      await apiService.addComplaint(formData);
      refreshData();
      toast.success("Complaint added successfully");
    } catch (error: any) {
      console.error("Add complaint error:", error);
      const message = error?.response?.data?.detail || error?.response?.data?.error || error?.message || "Unknown error";
      toast.error(`Failed to add: ${message}`);
      throw new Error(message);
    }
  };

  const handleUpdateComplaint = async (id: string, formData: FormData) => {
    try {
      const nocFile = formData.get("noc_file");
      const hasNocFile = !!(nocFile && typeof nocFile !== 'string' && nocFile.size > 0);

      if (hasNocFile) {
        const nonFileFormData = new FormData();
        formData.forEach((value, key) => {
          if (key === "noc_file" || key === "is_complete") return;
          nonFileFormData.append(key, value);
        });

        await apiService.updateComplaint(id, nonFileFormData);
        await apiService.uploadNoc(id, formData);
      } else {
        await apiService.updateComplaint(id, formData);
      }

      refreshData();
      if (hasNocFile) {
        toast.success("NOC file uploaded: Complaint moved to Closed");
      } else {
        toast.success("Complaint updated successfully");
      }
    } catch (error: any) {
      console.error("Update complaint error:", error);
      const message = error?.response?.data?.detail || error?.response?.data?.error || error?.message || "Unknown error";
      toast.error(`Failed to update: ${message}`);
      throw new Error(message);
    }
  };

  const handleMoveToClose = async (id: string, passwordConfirm: string) => {
    try {
      await apiService.closeComplaint(id, passwordConfirm);
      refreshData();
      toast.success("Complaint closed successfully");
    } catch (error: any) {
      console.error("Close complaint error:", error);
      const message = error?.response?.data?.detail || error?.response?.data?.error || error?.message || "Unknown error";
      toast.error(`Failed to close: ${message}`);
      throw new Error(message);
    }
  };

  const handleDeleteComplaint = async (id: string, passwordConfirm?: string) => {
    try {
      await apiService.deleteComplaint(id, passwordConfirm);
      refreshData();
      toast.success("Complaint deleted");
    } catch (error: any) {
      console.error("Delete complaint error:", error);
      const message = error?.response?.data?.detail || error?.response?.data?.error || error?.message || "Unknown error";
      if (String(message).toLowerCase().includes("not found")) {
        await refreshData();
        toast.info("Complaint was already deleted");
        return;
      }
      toast.error(`Failed to delete: ${message}`);
      throw new Error(message);
    }
  };

  const handleAddAdv = async (data: { name: string, fees: number, password_confirm: string }) => {
    try {
      await apiService.addAdvEntry(data);
      refreshData();
      toast.success("ADV fee entry added");
    } catch (error) {
      toast.error("Failed to add ADV entry");
    }
  };

  const handleAddCyber = async (data: { name: string, fees: number, password_confirm: string }) => {
    try {
      await apiService.addCyberEntry(data);
      refreshData();
      toast.success("Cyber fee entry added");
    } catch (error) {
      toast.error("Failed to add Cyber entry");
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={(phone) => {/* Handle logic in LoginPage component or pass a function that accepts both phone and pass */}}
                      onLoginSubmit={handleLogin} />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        {currentView === "dashboard" && (
          <Dashboard
            onNavigate={setCurrentView}
            onLogout={handleLogout}
            stats={{
              activeCount: activeComplaints.length,
              closedCount: closedComplaints.length,
              advTotal: advEntries.reduce((sum, e) => sum + Number(e.fees), 0),
              cyberTotal: cyberEntries.reduce((sum, e) => sum + Number(e.fees), 0)
            }}
          />
        )}

        {currentView === "active-complaints" && (
          <ActiveComplaints
            complaints={activeComplaints}
            onBack={() => setCurrentView("dashboard")}
            onAdd={handleAddComplaint}
            onUpdate={handleUpdateComplaint}
            onMoveToClose={handleMoveToClose}
            onDelete={handleDeleteComplaint}
          />
        )}

        {currentView === "closed-complaints" && (
          <ClosedComplaints
            complaints={closedComplaints}
            onBack={() => setCurrentView("dashboard")}
          />
        )}

        {currentView === "employee-data" && (
          <EmployeeData
            activeComplaints={activeComplaints}
            closedComplaints={closedComplaints}
            onBack={() => setCurrentView("dashboard")}
          />
        )}

        {currentView === "fees" && (
          <FeesManagement
            advEntries={advEntries}
            cyberEntries={cyberEntries}
            onAddAdv={handleAddAdv}
            onAddCyber={handleAddCyber}
            onBack={() => setCurrentView("dashboard")}
          />
        )}

        {currentView === "history" && (
          <HistoryAnalytics
            activeComplaints={activeComplaints}
            closedComplaints={closedComplaints}
            advEntries={advEntries}
            cyberEntries={cyberEntries}
            onBack={() => setCurrentView("dashboard")}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
