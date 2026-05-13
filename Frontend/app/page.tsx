"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoginPage } from "@/components/login-page";
import { Dashboard, type DashboardView } from "@/components/dashboard";
import { ActiveComplaints } from "@/components/active-complaints";
import { ClosedComplaints } from "@/components/closed-complaints";
import { EmployeeData } from "@/components/employee-data";
import { FeesManagement } from "@/components/fees-management";
import { HistoryAnalytics } from "@/components/history-analytics";
import { apiService } from "@/lib/api-service";
import { initSessionFromStorage, setSessionTokens } from "@/lib/api-client";
import { DataStoreProvider, useDataStore } from "@/lib/data-store";
import { toast } from "sonner";

function HomeContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>("dashboard");
  const {
    activeComplaints,
    closedComplaints,
    advEntries,
    cyberEntries,
    reloadAll,
    addComplaint,
    updateComplaint,
    closeComplaint,
    deleteComplaint,
    addAdvEntry,
    addCyberEntry,
  } = useDataStore();

  useEffect(() => {
    initSessionFromStorage();
    const hasAccessToken = typeof window !== "undefined" && !!window.localStorage.getItem("cf_access_token");
    if (!hasAccessToken) return;
    setIsLoggedIn(true);
    void reloadAll();
  }, [reloadAll]);

  const handleLogin = async (phoneNumber: string, passwordConfirm: string) => {
    try {
      const data = await apiService.login(phoneNumber, passwordConfirm);
      if (!data.access) {
        toast.error(data.detail || "Login failed");
        throw new Error(data.detail || "Login failed");
      }
      setIsLoggedIn(true);
      if (data.user && typeof window !== "undefined") {
        window.localStorage.setItem("cf_user", JSON.stringify(data.user));
      }
      await reloadAll();
      toast.success("Logged in successfully");
    } catch (error: any) {
      toast.error("Login failed. Please check your credentials.");
      throw error;
    }
  };

  const handleLogout = () => {
    setSessionTokens(null, null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("cf_user");
    }
    setIsLoggedIn(false);
    setCurrentView("dashboard");
    toast.info("Logged out");
  };

  const handleNavigate = (view: DashboardView) => {
    setCurrentView(view);
    if (view === "active-complaints" || view === "closed-complaints" || view === "employee-data") {
      void reloadAll();
    }
  };

  const handleAddComplaint = async (formData: FormData) => {
    try {
      await addComplaint(formData);
      toast.success("Complaint added successfully");
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.response?.data?.error || error?.message || "Unknown error";
      toast.error(`Failed to add: ${message}`);
      throw new Error(message);
    }
  };

  const handleUpdateComplaint = async (id: string, formData: FormData) => {
    try {
      const nocFile = formData.get("noc_file");
      const hasNocFile = !!(nocFile && typeof nocFile !== "string" && nocFile.size > 0);
      await updateComplaint(id, formData);
      toast.success(hasNocFile ? "NOC file uploaded: Complaint moved to Closed" : "Complaint updated successfully");
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.response?.data?.error || error?.message || "Unknown error";
      toast.error(`Failed to update: ${message}`);
      throw new Error(message);
    }
  };

  const handleMoveToClose = async (id: string, passwordConfirm: string, nocFile?: File | null) => {
    try {
      await closeComplaint(id, passwordConfirm, nocFile);
      toast.success(nocFile ? "NOC uploaded and complaint closed successfully" : "Complaint closed successfully");
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.response?.data?.error || error?.message || "Unknown error";
      toast.error(`Failed to close: ${message}`);
      throw new Error(message);
    }
  };

  const handleDeleteComplaint = async (id: string, passwordConfirm?: string) => {
    try {
      await deleteComplaint(id, passwordConfirm);
      toast.success("Complaint deleted");
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.response?.data?.error || error?.message || "Unknown error";
      if (String(message).toLowerCase().includes("not found")) {
        await reloadAll();
        toast.info("Complaint was already deleted");
        return;
      }
      toast.error(`Failed to delete: ${message}`);
      throw new Error(message);
    }
  };

  const handleAddAdv = async (data: { name: string; fees: number; password_confirm: string }) => {
    try {
      await addAdvEntry(data);
      toast.success("ADV fee entry added");
    } catch {
      toast.error("Failed to add ADV entry");
    }
  };

  const handleAddCyber = async (data: { name: string; fees: number; password_confirm: string }) => {
    try {
      await addCyberEntry(data);
      toast.success("Cyber fee entry added");
    } catch {
      toast.error("Failed to add Cyber entry");
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => {}} onLoginSubmit={handleLogin} />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={currentView} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
        {currentView === "dashboard" && (
          <Dashboard
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            stats={{
              activeCount: activeComplaints.length,
              closedCount: closedComplaints.length,
              advTotal: advEntries.reduce((sum, e) => sum + Number(e.fees), 0),
              cyberTotal: cyberEntries.reduce((sum, e) => sum + Number(e.fees), 0),
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

        {currentView === "closed-complaints" && <ClosedComplaints complaints={closedComplaints} onBack={() => setCurrentView("dashboard")} />}

        {currentView === "employee-data" && (
          <EmployeeData activeComplaints={activeComplaints} closedComplaints={closedComplaints} onBack={() => setCurrentView("dashboard")} />
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

export default function Home() {
  return (
    <DataStoreProvider>
      <HomeContent />
    </DataStoreProvider>
  );
}

