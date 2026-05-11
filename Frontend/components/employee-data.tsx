"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Users, TrendingUp, FileText, CheckCircle, AlertCircle } from "lucide-react";
import type { CyberComplaint } from "@/lib/store";

interface EmployeeDataProps {
  activeComplaints: CyberComplaint[];
  closedComplaints: CyberComplaint[];
  onBack: () => void;
}

export function EmployeeData({
  activeComplaints,
  closedComplaints,
  onBack,
}: EmployeeDataProps) {
  const allComplaints = [...activeComplaints, ...closedComplaints];
  const totalTxnAmount = allComplaints.reduce((sum, c) => sum + c.txnAmount, 0);
  const totalDisputeAmount = allComplaints.reduce((sum, c) => sum + c.disputeAmount, 0);

  // Group by employee
  const employeeStats = allComplaints.reduce((acc, complaint) => {
    const empId = complaint.employeeId;
    if (!acc[empId]) {
      acc[empId] = { active: 0, closed: 0, total: 0 };
    }
    if (complaint.isComplete) {
      acc[empId].closed++;
    } else {
      acc[empId].active++;
    }
    acc[empId].total++;
    return acc;
  }, {} as Record<string, { active: number; closed: number; total: number }>);

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
            <Users className="w-4 h-4 text-blue-400" />
            Employee Total Entry Data
          </span>
        </div>
      </nav>

      {/* Welcome Section */}
      <div className="bg-white border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Employee Total Entry Data</h1>
          <p className="text-sm text-gray-500">Dashboard &gt; Employee Data</p>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #3498db" }}>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs">Total Entries</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {allComplaints.length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #f39c12" }}>
            <div className="flex items-center gap-2 text-yellow-600 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs">Active</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {activeComplaints.length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #27ae60" }}>
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Closed</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {closedComplaints.length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #e74c3c" }}>
            <div className="flex items-center gap-2 text-[#e74c3c] mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Completion Rate</span>
            </div>
            <p className="text-2xl font-bold text-[#e74c3c]">
              {allComplaints.length > 0
                ? Math.round((closedComplaints.length / allComplaints.length) * 100)
                : 0}%
            </p>
          </div>
        </motion.div>

        {/* Employee Performance */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm mb-6"
        >
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">Employee Performance</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(employeeStats).map(([empId, stats]) => (
                <div
                  key={empId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e74c3c]/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#e74c3c]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Employee {empId}</p>
                      <p className="text-xs text-gray-500">
                        {stats.total} total entries
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-yellow-600">{stats.active}</p>
                      <p className="text-xs text-gray-500">Active</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-green-600">{stats.closed}</p>
                      <p className="text-xs text-gray-500">Closed</p>
                    </div>
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${stats.total > 0 ? (stats.closed / stats.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(employeeStats).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No employee data entries found</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Financial Summary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm"
        >
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">Financial Summary</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl" style={{ borderLeft: "4px solid #3498db" }}>
                <p className="text-sm text-blue-600 mb-2">Total Transaction Amount</p>
                <p className="text-3xl font-bold text-blue-700">
                  ₹{totalTxnAmount.toLocaleString()}
                </p>
              </div>
              <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl" style={{ borderLeft: "4px solid #9b59b6" }}>
                <p className="text-sm text-purple-600 mb-2">Total Dispute Amount</p>
                <p className="text-3xl font-bold text-purple-700">
                  ₹{totalDisputeAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
