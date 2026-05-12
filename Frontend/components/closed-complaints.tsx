"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, Check, FileText, LayoutDashboard } from "lucide-react";
import type { CyberComplaint } from "@/lib/api-service";

interface ClosedComplaintsProps {
  complaints: CyberComplaint[];
  onBack: () => void;
}

export function ClosedComplaints({ complaints, onBack }: ClosedComplaintsProps) {
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
            <CheckCircle className="w-4 h-4 text-green-400" />
            Closed Cyber Complaints
          </span>
        </div>
      </nav>

      {/* Welcome Section */}
      <div className="bg-white border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Closed Cyber Complaints</h1>
          <p className="text-sm text-gray-500">Dashboard &gt; Closed Complaints</p>
        </div>
      </div>

      <div className="p-6">
        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #27ae60" }}>
            <p className="text-xs text-gray-500 mb-1">Total Closed</p>
            <p className="text-2xl font-bold text-green-600">{complaints.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #3498db" }}>
            <p className="text-xs text-gray-500 mb-1">Total TXN Amount</p>
            <p className="text-2xl font-bold text-gray-800">
              ₹{complaints.reduce((sum, c) => sum + Number(c.txn_amount), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #9b59b6" }}>
            <p className="text-xs text-gray-500 mb-1">Total Dispute Amount</p>
            <p className="text-2xl font-bold text-gray-800">
              ₹{complaints.reduce((sum, c) => sum + Number(c.dispute_amount), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4" style={{ borderLeft: "4px solid #e74c3c" }}>
            <p className="text-xs text-gray-500 mb-1">With NOC File</p>
            <p className="text-2xl font-bold text-[#e74c3c]">
              {complaints.filter((c) => c.noc_file).length}
            </p>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {[
                    "Bank Name",
                    "ACK Number",
                    "IFSC Code",
                    "State",
                    "District",
                    "Layer",
                    "TXN Amount",
                    "Dispute Amount",
                    "UTR Number",
                    "Police Station",
                    "Vendor Name",
                    "NOC File",
                    "Completed At",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {complaints.map((complaint, index) => {
                    const rowId = complaint.id || (complaint as any)._id;
                    return (
                    <motion.tr
                      key={rowId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {complaint.bank_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap font-mono">
                        {complaint.ack_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap font-mono">
                        {complaint.ifsc_code}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {complaint.state_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {complaint.district}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {complaint.layer}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        ₹{Number(complaint.txn_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        ₹{Number(complaint.dispute_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap font-mono">
                        {complaint.utr_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {complaint.police_station}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {complaint.vendor_name}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {complaint.noc_file ? (
                          <a href={complaint.noc_file} target="_blank" rel="noopener noreferrer" className="text-green-600 flex items-center gap-1 hover:underline">
                            <Check className="w-3 h-3" />
                            <FileText className="w-3 h-3" />
                            View NOC
                          </a>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {complaint.completed_at
                          ? new Date(complaint.completed_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
            {complaints.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No closed complaints found</p>
                <p className="text-sm">
                  Complaints will appear here once they are fully completed
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
