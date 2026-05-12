"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  DollarSign,
  Plus,
  Briefcase,
  Shield,
  Calendar,
  TrendingUp,
  LayoutDashboard,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { AdvEntry, CyberEntry } from "@/lib/api-service";

interface FeesManagementProps {
  advEntries: AdvEntry[];
  cyberEntries: CyberEntry[];
  onAddAdv: (data: { name: string, fees: number, password_confirm: string }) => Promise<void>;
  onAddCyber: (data: { name: string, fees: number, password_confirm: string }) => Promise<void>;
  onBack: () => void;
}

export type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function filterByTime<T extends { created_at: string }>(items: T[], filter: TimeFilter): T[] {
  if (!Array.isArray(items)) return [];

  const now = new Date();
  const startDate = new Date();

  switch (filter) {
    case 'daily':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'yearly':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return items.filter(item => {
    const dateStr = item.created_at || (item as any).createdAt;
    if (!dateStr) return true; // Include if date is missing to avoid hiding entries
    return new Date(dateStr) >= startDate;
  });
}

export function FeesManagement({
  advEntries,
  cyberEntries,
  onAddAdv,
  onAddCyber,
  onBack,
}: FeesManagementProps) {
  const [showAdvModal, setShowAdvModal] = useState(false);
  const [showCyberModal, setShowCyberModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [name, setName] = useState("");
  const [fees, setFees] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingType, setPendingType] = useState<"adv" | "cyber" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("monthly");

  const filteredAdvEntries = filterByTime(advEntries, timeFilter);
  const filteredCyberEntries = filterByTime(cyberEntries, timeFilter);

  const advTotal = filteredAdvEntries.reduce((sum, e) => sum + Number(e.fees), 0);
  const cyberTotal = filteredCyberEntries.reduce((sum, e) => sum + Number(e.fees), 0);

  const handleOpenPasswordModal = (type: "adv" | "cyber") => {
    if (type === "adv" && (!name || !fees)) return;
    if (type === "cyber" && (!name || !fees)) return;
    setPendingType(type);
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    setIsSubmitting(true);
    setPasswordError("");
    try {
      const payload = { name, fees: parseFloat(fees), password_confirm: password };
      if (pendingType === "adv") {
        await onAddAdv(payload);
        setShowAdvModal(false);
      } else {
        await onAddCyber(payload);
        setShowCyberModal(false);
      }
      setName("");
      setFees("");
      setPassword("");
      setShowPasswordModal(false);
      setPendingType(null);
    } catch (err) {
      setPasswordError("Action failed. Check password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeFilters: { label: string; value: TimeFilter }[] = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
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
            <DollarSign className="w-4 h-4 text-yellow-400" />
            ADV & Cyber Fees
          </span>
        </div>
      </nav>

      {/* Welcome Section */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">ADV & Cyber Fees Management</h1>
            <p className="text-sm text-gray-500">Dashboard &gt; Fees</p>
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
        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
        >
          <div
            onClick={() => { setName(""); setFees(""); setShowAdvModal(true); }}
            className="bg-white rounded-lg shadow-sm p-6 cursor-pointer stat-card flex items-center justify-between"
            style={{ borderLeft: "4px solid #3498db" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">ADV Fees</h3>
                <p className="text-sm text-gray-500">Add new ADV fee entry</p>
              </div>
            </div>
            <Plus className="w-6 h-6 text-blue-500" />
          </div>

          <div
            onClick={() => { setName(""); setFees(""); setShowCyberModal(true); }}
            className="bg-white rounded-lg shadow-sm p-6 cursor-pointer stat-card flex items-center justify-between"
            style={{ borderLeft: "4px solid #e74c3c" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Cyber Fees</h3>
                <p className="text-sm text-gray-500">Add new Cyber fee entry</p>
              </div>
            </div>
            <Plus className="w-6 h-6 text-red-500" />
          </div>
        </motion.div>

        {/* Totals */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6" style={{ borderLeft: "4px solid #3498db" }}>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Briefcase className="w-5 h-5" />
              <span className="text-sm font-medium">ADV Total</span>
            </div>
            <p className="text-3xl font-bold text-blue-700">
              ₹{advTotal.toLocaleString()}
            </p>
            <p className="text-xs text-blue-500 mt-1">
              {filteredAdvEntries.length} entries ({timeFilter})
            </p>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-6" style={{ borderLeft: "4px solid #e74c3c" }}>
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Cyber Total</span>
            </div>
            <p className="text-3xl font-bold text-red-700">
              ₹{cyberTotal.toLocaleString()}
            </p>
            <p className="text-xs text-red-500 mt-1">
              {filteredCyberEntries.length} entries ({timeFilter})
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6" style={{ borderLeft: "4px solid #27ae60" }}>
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Combined Total</span>
            </div>
            <p className="text-3xl font-bold text-green-700">
              ₹{(advTotal + cyberTotal).toLocaleString()}
            </p>
            <p className="text-xs text-green-500 mt-1">
              {filteredAdvEntries.length + filteredCyberEntries.length} total entries
            </p>
          </div>
        </motion.div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ADV Entries Table */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-500" />
                ADV Entries
              </h2>
            </div>
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      ADV Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Fees
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {filteredAdvEntries.map((entry, index) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {entry.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 font-semibold">
                          ₹{Number(entry.fees).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(entry.created_at || (entry as any).createdAt).toLocaleDateString()}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filteredAdvEntries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No ADV entries for this period</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Cyber Entries Table */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Cyber Entries
              </h2>
            </div>
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Cyber Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Fees
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {filteredCyberEntries.map((entry, index) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {entry.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                          ₹{Number(entry.fees).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(entry.created_at || (entry as any).createdAt).toLocaleDateString()}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filteredCyberEntries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No Cyber entries for this period</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ADV Modal */}
      <Dialog open={showAdvModal} onOpenChange={setShowAdvModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-500" />
              Add ADV Fee Entry
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Enter the ADV name and fee amount
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ADV Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter ADV name"
                className="bg-gray-50 border-gray-200 text-gray-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">ADV Fees</label>
              <Input
                type="number"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                placeholder="Enter fee amount"
                className="bg-gray-50 border-gray-200 text-gray-800"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAdvModal(false)}
                className="border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleOpenPasswordModal("adv")}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Add Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cyber Modal */}
      <Dialog open={showCyberModal} onOpenChange={setShowCyberModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              Add Cyber Fee Entry
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Enter the Cyber name and fee amount
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Cyber Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Cyber name"
                className="bg-gray-50 border-gray-200 text-gray-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Cyber Fees</label>
              <Input
                type="number"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                placeholder="Enter fee amount"
                className="bg-gray-50 border-gray-200 text-gray-800"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCyberModal(false)}
                className="border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleOpenPasswordModal("cyber")}
                className="text-white"
                style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" }}
              >
                Add Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#e74c3c]" />
              Password Confirmation
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Enter password to confirm this action
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-50 border-gray-200 text-gray-800"
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
            />
            {passwordError && (
              <p className="text-red-600 text-sm">{passwordError}</p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword("");
                  setPasswordError("");
                }}
                className="border-gray-200"
              >
                Cancel
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={handlePasswordSubmit}
                className="text-white"
                style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" }}
              >
                {isSubmitting ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
