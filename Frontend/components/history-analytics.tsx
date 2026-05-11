"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  History,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  DollarSign,
  BarChart3,
} from "lucide-react";
import type { CyberComplaint, AdvEntry, CyberEntry, TimeFilter } from "@/lib/store";
import { filterByTime } from "@/lib/store";

interface HistoryAnalyticsProps {
  activeComplaints: CyberComplaint[];
  closedComplaints: CyberComplaint[];
  advEntries: AdvEntry[];
  cyberEntries: CyberEntry[];
  onBack: () => void;
}

export function HistoryAnalytics({
  activeComplaints,
  closedComplaints,
  advEntries,
  cyberEntries,
  onBack,
}: HistoryAnalyticsProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("monthly");

  const allComplaints = [...activeComplaints, ...closedComplaints];
  const filteredActive = filterByTime(activeComplaints, timeFilter);
  const filteredClosed = filterByTime(closedComplaints, timeFilter);
  const filteredAdv = filterByTime(advEntries, timeFilter);
  const filteredCyber = filterByTime(cyberEntries, timeFilter);

  const timeFilters: { label: string; value: TimeFilter }[] = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
  ];

  const getFilterLabel = () => {
    switch (timeFilter) {
      case "daily":
        return "Today";
      case "weekly":
        return "This Week";
      case "monthly":
        return "This Month";
      case "yearly":
        return "This Year";
    }
  };

  const totalFiltered = filteredActive.length + filteredClosed.length;
  const completionRate = totalFiltered > 0 
    ? Math.round((filteredClosed.length / totalFiltered) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Red Header */}
      <header 
        className="text-white px-6 py-3"
        style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center overflow-hidden">
              <img src="/Logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold">CYBER SYSTEM</span>
          </div>
        </div>
      </header>

      {/* Dark Navigation */}
      <nav className="bg-[#2c3e50] text-white px-6 py-3">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <span className="text-white/50">|</span>
          <span className="flex items-center gap-2">
            <History className="w-4 h-4 text-green-400" />
            History & Analytics
          </span>
        </div>
      </nav>

      {/* Welcome Section */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">History & Analytics</h1>
            <p className="text-sm text-gray-500">Dashboard &gt; History</p>
          </div>
          {/* Time Filter */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {timeFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setTimeFilter(filter.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  timeFilter === filter.value
                    ? "bg-[#e74c3c] text-white"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #3498db" }}>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">Total ({getFilterLabel()})</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalFiltered}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #f39c12" }}>
            <div className="flex items-center gap-2 text-yellow-600 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs">Active ({getFilterLabel()})</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{filteredActive.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #27ae60" }}>
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Closed ({getFilterLabel()})</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{filteredClosed.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #e74c3c" }}>
            <div className="flex items-center gap-2 text-[#e74c3c] mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Completion Rate</span>
            </div>
            <p className="text-2xl font-bold text-[#e74c3c]">{completionRate}%</p>
          </div>
        </motion.div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm"
          >
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-500" />
                Fee Collections ({getFilterLabel()})
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">ADV Fees</p>
                  <p className="text-xl font-bold text-blue-600">
                    ₹{filteredAdv.reduce((sum, e) => sum + e.advFees, 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Entries</p>
                  <p className="text-lg font-semibold text-gray-800">{filteredAdv.length}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Cyber Fees</p>
                  <p className="text-xl font-bold text-[#e74c3c]">
                    ₹{filteredCyber.reduce((sum, e) => sum + e.cyberFees, 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Entries</p>
                  <p className="text-lg font-semibold text-gray-800">{filteredCyber.length}</p>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg" style={{ borderLeft: "4px solid #27ae60" }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Total Collections</p>
                  <p className="text-xl font-bold text-green-600">
                    ₹{(
                      filteredAdv.reduce((sum, e) => sum + e.advFees, 0) +
                      filteredCyber.reduce((sum, e) => sum + e.cyberFees, 0)
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm"
          >
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                Complaint Summary ({getFilterLabel()})
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Transaction Amount</p>
                  <p className="text-xl font-bold text-gray-800">
                    ₹{[...filteredActive, ...filteredClosed]
                      .reduce((sum, c) => sum + c.txnAmount, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Dispute Amount</p>
                  <p className="text-xl font-bold text-gray-800">
                    ₹{[...filteredActive, ...filteredClosed]
                      .reduce((sum, c) => sum + c.disputeAmount, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Completion Progress</p>
                  <p className="text-sm font-semibold text-[#e74c3c]">{completionRate}%</p>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full"
                    style={{ background: "linear-gradient(90deg, #e74c3c, #27ae60)" }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>{filteredClosed.length} closed</span>
                  <span>{filteredActive.length} active</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm"
        >
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <History className="w-5 h-5 text-[#e74c3c]" />
              Recent Activity ({getFilterLabel()})
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-[400px] overflow-auto">
              {[...filteredActive, ...filteredClosed]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 10)
                .map((complaint, index) => (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          complaint.isComplete
                            ? "bg-green-100 text-green-600"
                            : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {complaint.isComplete ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {complaint.bankName}
                        </p>
                        <p className="text-xs text-gray-500">
                          ACK: {complaint.ackNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">
                        ₹{complaint.txnAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              {[...filteredActive, ...filteredClosed].length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No activity for this period</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* All-time Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-sm"
        >
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">All-Time Statistics</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg" style={{ borderLeft: "4px solid #3498db" }}>
                <p className="text-3xl font-bold text-gray-800">{allComplaints.length}</p>
                <p className="text-sm text-gray-500">Total Complaints</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg" style={{ borderLeft: "4px solid #27ae60" }}>
                <p className="text-3xl font-bold text-green-600">{closedComplaints.length}</p>
                <p className="text-sm text-gray-500">Resolved</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg" style={{ borderLeft: "4px solid #9b59b6" }}>
                <p className="text-3xl font-bold text-purple-600">
                  ₹{advEntries.reduce((sum, e) => sum + e.advFees, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Total ADV Fees</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg" style={{ borderLeft: "4px solid #e74c3c" }}>
                <p className="text-3xl font-bold text-[#e74c3c]">
                  ₹{cyberEntries.reduce((sum, e) => sum + e.cyberFees, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Total Cyber Fees</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
