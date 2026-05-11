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
import {
  type CyberComplaint,
  type AdvEntry,
  type CyberEntry,
  initializeSampleData,
  getActiveComplaints,
  getClosedComplaints,
  getAdvEntries,
  getCyberEntries,
  addComplaint,
  updateComplaint,
  moveToClosedComplaints,
  deleteActiveComplaint,
  addAdvEntry,
  addCyberEntry,
} from "@/lib/store";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>("dashboard");
  const [activeComplaints, setActiveComplaints] = useState<CyberComplaint[]>([]);
  const [closedComplaints, setClosedComplaints] = useState<CyberComplaint[]>([]);
  const [advEntries, setAdvEntries] = useState<AdvEntry[]>([]);
  const [cyberEntries, setCyberEntries] = useState<CyberEntry[]>([]);

  // Initialize sample data and load state
  useEffect(() => {
    initializeSampleData();
    refreshData();
  }, []);

  const refreshData = () => {
    setActiveComplaints(getActiveComplaints());
    setClosedComplaints(getClosedComplaints());
    setAdvEntries(getAdvEntries());
    setCyberEntries(getCyberEntries());
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView("dashboard");
  };

  const handleAddComplaint = (
    complaint: Omit<CyberComplaint, "id" | "createdAt" | "completedAt">
  ) => {
    addComplaint(complaint);
    refreshData();
  };

  const handleUpdateComplaint = (id: string, updates: Partial<CyberComplaint>) => {
    updateComplaint(id, updates);
    refreshData();
  };

  const handleMoveToClose = (id: string) => {
    moveToClosedComplaints(id);
    refreshData();
  };

  const handleDeleteComplaint = (id: string) => {
    deleteActiveComplaint(id);
    refreshData();
  };

  const handleAddAdv = (entry: Omit<AdvEntry, "id" | "createdAt">) => {
    addAdvEntry(entry);
    refreshData();
  };

  const handleAddCyber = (entry: Omit<CyberEntry, "id" | "createdAt">) => {
    addCyberEntry(entry);
    refreshData();
  };

  const stats = {
    activeCount: activeComplaints.length,
    closedCount: closedComplaints.length,
    advTotal: advEntries.reduce((sum, e) => sum + e.advFees, 0),
    cyberTotal: cyberEntries.reduce((sum, e) => sum + e.cyberFees, 0),
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
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
            stats={stats}
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
