"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Users,
  DollarSign,
  History,
  LogOut,
  LayoutDashboard,
  FileText,
  CreditCard,
  BarChart3,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export type DashboardView =
  | "dashboard"
  | "active-complaints"
  | "closed-complaints"
  | "employee-data"
  | "fees"
  | "history";

interface DashboardProps {
  onNavigate: (view: DashboardView) => void;
  onLogout: () => void;
  stats: {
    activeCount: number;
    closedCount: number;
    advTotal: number;
    cyberTotal: number;
  };
}

export function Dashboard({ onNavigate, onLogout, stats }: DashboardProps) {
  const balanceCards = [
    {
      title: "Active Complaints",
      value: stats.activeCount,
      subtitle: "Pending Cases",
      icon: AlertCircle,
      color: "#ff6b6b",
      onClick: () => onNavigate("active-complaints"),
    },
    {
      title: "Closed Complaints",
      value: stats.closedCount,
      subtitle: "Resolved Cases",
      icon: CheckCircle,
      color: "#51cf66",
      onClick: () => onNavigate("closed-complaints"),
    },
    {
      title: "Total Entries",
      value: stats.activeCount + stats.closedCount,
      subtitle: "All Records",
      icon: Users,
      color: "#339af0",
      onClick: () => onNavigate("employee-data"),
    },
    {
      title: "Total Fees",
      value: `₹${(stats.advTotal + stats.cyberTotal).toLocaleString()}`,
      subtitle: "ADV + Cyber",
      icon: Wallet,
      color: "#f59f00",
      onClick: () => onNavigate("fees"),
    },
  ];

  const serviceItems = [
    { name: "ADV Fees", success: stats.advTotal, icon: FileText, color: "#e74c3c" },
    { name: "Cyber Fees", success: stats.cyberTotal, icon: CreditCard, color: "#3498db" },
    { name: "Active Cases", success: stats.activeCount, icon: AlertCircle, color: "#f39c12" },
    { name: "Closed Cases", success: stats.closedCount, icon: CheckCircle, color: "#27ae60" },
    { name: "Analytics", success: "View", icon: BarChart3, color: "#9b59b6" },
    { name: "History", success: "View", icon: History, color: "#1abc9c" },
  ];

  const summaryItems = [
    { label: "Success", value: stats.closedCount, color: "#27ae60" },
    { label: "Pending", value: stats.activeCount, color: "#f39c12" },
    { label: "ADV Total", value: `₹${stats.advTotal.toLocaleString()}`, color: "#3498db" },
    { label: "Cyber Total", value: `₹${stats.cyberTotal.toLocaleString()}`, color: "#9b59b6" },
    { label: "Grand Total", value: `₹${(stats.advTotal + stats.cyberTotal).toLocaleString()}`, color: "#e74c3c" },
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Red Header */}
      <header 
        className="text-white px-6 py-3"
        style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">CYBER SYSTEM</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 text-sm">
              <button className="hover:text-white/80 transition-colors">Master</button>
              <button className="hover:text-white/80 transition-colors">Api Master</button>
              <button className="hover:text-white/80 transition-colors">Settings</button>
            </div>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Dark Navigation */}
      <nav className="bg-[#2c3e50] text-white px-6 py-3">
        <div className="flex items-center gap-6 text-sm overflow-x-auto">
          <button 
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors whitespace-nowrap"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button 
            onClick={() => onNavigate("active-complaints")}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors whitespace-nowrap"
          >
            <AlertCircle className="w-4 h-4" />
            Active Complaints
          </button>
          <button 
            onClick={() => onNavigate("closed-complaints")}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors whitespace-nowrap"
          >
            <CheckCircle className="w-4 h-4" />
            Closed Complaints
          </button>
          <button 
            onClick={() => onNavigate("fees")}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors whitespace-nowrap"
          >
            <CreditCard className="w-4 h-4" />
            Fees
          </button>
          <button 
            onClick={() => onNavigate("history")}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors whitespace-nowrap"
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>
      </nav>

      {/* Welcome Section */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Hi, Super welcome back!</h1>
            <p className="text-sm text-gray-500">Dashboard &gt; Dashboard</p>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-400">Today</p>
              <p className="text-sm font-semibold text-[#e74c3c]">{stats.activeCount}</p>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Total Closed</p>
              <p className="text-sm font-semibold text-green-500">{stats.closedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Balance Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {balanceCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={card.onClick}
              className="bg-white rounded-lg shadow-sm cursor-pointer stat-card overflow-hidden"
              style={{ borderLeft: `4px solid ${card.color}` }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${card.color}20` }}
                  >
                    <card.icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today Sales / Services */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">TODAY SUMMARY</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {serviceItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  onClick={() => {
                    if (item.name === "Analytics" || item.name === "History") {
                      onNavigate("history");
                    } else if (item.name === "ADV Fees" || item.name === "Cyber Fees") {
                      onNavigate("fees");
                    } else if (item.name === "Active Cases") {
                      onNavigate("active-complaints");
                    } else {
                      onNavigate("closed-complaints");
                    }
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.name}</p>
                    <p className="text-xs text-green-600">
                      {typeof item.success === "number" ? `₹${item.success.toLocaleString()}` : item.success}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Admin Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">ADMIN SUMMARY</h2>
            <div className="space-y-4">
              {summaryItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span 
                    className="text-sm font-semibold"
                    style={{ color: item.color }}
                  >
                    {item.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Stats Row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
        >
          <div className="bg-gradient-to-r from-pink-100 to-pink-50 rounded-lg p-4 border-l-4 border-pink-400">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-pink-500" />
              <span className="text-xs text-pink-600">This Month</span>
            </div>
            <p className="text-xl font-bold text-pink-700">{stats.activeCount + stats.closedCount}</p>
            <p className="text-xs text-pink-500">Total Complaints</p>
          </div>
          <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-600">Collection</span>
            </div>
            <p className="text-xl font-bold text-blue-700">₹{(stats.advTotal + stats.cyberTotal).toLocaleString()}</p>
            <p className="text-xs text-blue-500">Total Collected</p>
          </div>
          <div className="bg-gradient-to-r from-green-100 to-green-50 rounded-lg p-4 border-l-4 border-green-400">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600">Success Rate</span>
            </div>
            <p className="text-xl font-bold text-green-700">
              {stats.activeCount + stats.closedCount > 0 
                ? Math.round((stats.closedCount / (stats.activeCount + stats.closedCount)) * 100) 
                : 0}%
            </p>
            <p className="text-xs text-green-500">Completion</p>
          </div>
          <div className="bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg p-4 border-l-4 border-orange-400">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-orange-600">Pending</span>
            </div>
            <p className="text-xl font-bold text-orange-700">{stats.activeCount}</p>
            <p className="text-xs text-orange-500">Active Cases</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
