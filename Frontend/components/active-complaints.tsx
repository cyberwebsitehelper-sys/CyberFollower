"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Upload,
  Lock,
  AlertCircle,
  LayoutDashboard,
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
import type { CyberComplaint } from "@/lib/api-service";

interface ActiveComplaintsProps {
  complaints: CyberComplaint[];
  onBack: () => void;
  onAdd: (formData: FormData) => Promise<void>;
  onUpdate: (id: string, formData: FormData) => Promise<void>;
  onMoveToClose: (id: string, passwordConfirm: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const emptyComplaint = {
  bank_name: "",
  ack_number: "",
  ifsc_code: "",
  state_name: "",
  district: "",
  layer: "",
  txn_amount: 0,
  dispute_amount: 0,
  utr_number: "",
  police_station: "",
  vendor_name: "",
  noc_file: null as File | null,
};

export function ActiveComplaints({
  complaints,
  onBack,
  onAdd,
  onUpdate,
  onMoveToClose,
  onDelete,
}: ActiveComplaintsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<CyberComplaint | null>(null);
  const [formData, setFormData] = useState(emptyComplaint);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingAction, setPendingAction] = useState<"add" | "edit" | "complete" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    if (passwordError) setPasswordError("");
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, noc_file: file }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextElement = document.getElementById(nextId);
      if (nextElement) {
        nextElement.focus();
      } else {
        // Last field, trigger submit
        if (showAddModal) handleAddClick();
        if (showEditModal) handleEditSubmit();
      }
    }
  };

  const createFormData = (passwordConfirm: string) => {
    const data = new FormData();
    let hasFile = false;

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) {
        if (key === 'noc_file' && typeof value === 'string') return;
        
        if (key === 'noc_file' && value instanceof File) {
          hasFile = true;
        }
        // Don't append empty strings for optional fields so the backend doesn't trigger invalid validations
        if (value === '' && ['utr_number', 'police_station', 'vendor_name'].includes(key)) return;

        data.append(key, value as any);
      }
    });
    data.append('password_confirm', passwordConfirm);
    if (hasFile) {
      data.append('is_complete', 'true');
    }
    return data;
  };

  const handlePasswordSubmit = async () => {
    setIsSubmitting(true);
    setPasswordError("");
    try {
      if (pendingAction === "add") {
        await onAdd(createFormData(password));
        setShowAddModal(false);
        setFormData(emptyComplaint);
      } else if (pendingAction === "edit" && selectedComplaint) {
        const rowId = selectedComplaint.id || (selectedComplaint as any)._id;
        await onUpdate(rowId, createFormData(password));
        setShowEditModal(false);
        setSelectedComplaint(null);
        setFormData(emptyComplaint);
      } else if (pendingAction === "complete" && selectedComplaint) {
        const rowId = selectedComplaint.id || (selectedComplaint as any)._id;
        await onMoveToClose(rowId, password);
        setSelectedComplaint(null);
      }
      setShowPasswordModal(false);
      setPassword("");
      setPendingAction(null);
    } catch (err: any) {
      setPasswordError("Action failed. Check password or connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddClick = () => {
    setPendingAction("add");
    setShowPasswordModal(true);
  };

  const handleEditClick = (complaint: CyberComplaint) => {
    setSelectedComplaint(complaint);
    setFormData({
      bank_name: complaint.bank_name,
      ack_number: complaint.ack_number,
      ifsc_code: complaint.ifsc_code,
      state_name: complaint.state_name,
      district: complaint.district,
      layer: complaint.layer,
      txn_amount: complaint.txn_amount,
      dispute_amount: complaint.dispute_amount,
      utr_number: complaint.utr_number,
      police_station: complaint.police_station,
      vendor_name: complaint.vendor_name,
      noc_file: null,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    setPendingAction("edit");
    setShowPasswordModal(true);
  };

  const handleCompleteClick = (complaint: CyberComplaint) => {
    setSelectedComplaint(complaint);
    setPendingAction("complete");
    setShowPasswordModal(true);
  };

  const renderFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Bank Name *</label>
        <Input
          id="f1"
          autoFocus
          value={formData.bank_name}
          onChange={(e) => handleInputChange("bank_name", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f2")}
          placeholder="Enter bank name"
          className="bg-gray-50 border-gray-200 text-gray-800"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">ACK Number *</label>
        <Input
          id="f2"
          value={formData.ack_number}
          onChange={(e) => handleInputChange("ack_number", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f3")}
          placeholder="Enter ACK number"
          className="bg-gray-50 border-gray-200 text-gray-800"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">IFSC Code *</label>
        <Input
          id="f3"
          value={formData.ifsc_code}
          onChange={(e) => handleInputChange("ifsc_code", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f4")}
          placeholder="Enter IFSC code"
          className="bg-gray-50 border-gray-200 text-gray-800"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">State Name *</label>
        <Input
          id="f4"
          value={formData.state_name}
          onChange={(e) => handleInputChange("state_name", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f5")}
          placeholder="Enter state"
          className="bg-gray-50 border-gray-200 text-gray-800"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">District *</label>
        <Input
          id="f5"
          value={formData.district}
          onChange={(e) => handleInputChange("district", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f6")}
          placeholder="Enter district"
          className="bg-gray-50 border-gray-200 text-gray-800"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Layer *</label>
        <Input
          id="f6"
          value={formData.layer}
          onChange={(e) => handleInputChange("layer", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f7")}
          placeholder="Enter layer"
          className="bg-gray-50 border-gray-200 text-gray-800"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">TXN Amount *</label>
        <Input
          id="f7"
          type="number"
          value={formData.txn_amount || ""}
          onChange={(e) => handleInputChange("txn_amount", parseFloat(e.target.value) || 0)}
          onKeyDown={(e) => handleKeyDown(e, "f8")}
          placeholder="Enter transaction amount"
          className="bg-gray-50 border-gray-200 text-gray-800"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Dispute Amount *</label>
        <Input
          id="f8"
          type="number"
          value={formData.dispute_amount || ""}
          onChange={(e) => handleInputChange("dispute_amount", parseFloat(e.target.value) || 0)}
          onKeyDown={(e) => handleKeyDown(e, "f9")}
          placeholder="Enter dispute amount"
          className="bg-gray-50 border-gray-200 text-gray-800"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">UTR Number</label>
        <Input
          id="f9"
          value={formData.utr_number}
          onChange={(e) => handleInputChange("utr_number", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f10")}
          placeholder="Enter UTR number"
          className="bg-gray-50 border-gray-200 text-gray-800"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Police Station</label>
        <Input
          id="f10"
          value={formData.police_station}
          onChange={(e) => handleInputChange("police_station", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f11")}
          placeholder="Enter police station"
          className="bg-gray-50 border-gray-200 text-gray-800"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Vendor Name</label>
        <Input
          id="f11"
          value={formData.vendor_name}
          onChange={(e) => handleInputChange("vendor_name", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f12")}
          placeholder="Enter vendor name"
          className="bg-gray-50 border-gray-200 text-gray-800"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">NOC File Upload (Auto-closes if provided)</label>
        <div className="flex items-center gap-2">
          <Input
            id="f12"
            type="file"
            onChange={handleFileChange}
            className="bg-gray-50 border-gray-200 text-gray-800"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </div>
        {formData.noc_file && (
          <p className="text-xs text-[#e74c3c] flex items-center gap-1">
            <Upload className="w-3 h-3" /> {formData.noc_file.name}
          </p>
        )}
      </div>
    </div>
  );

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
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            Active Cyber Complaints
          </span>
        </div>
      </nav>

      {/* Welcome Section */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Active Cyber Complaints</h1>
            <p className="text-sm text-gray-500">Dashboard &gt; Active Complaints</p>
          </div>
          <Button
            onClick={() => {
              setFormData(emptyComplaint);
              setShowAddModal(true);
            }}
            className="text-white"
            style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Complaint
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-4"
            style={{ borderLeft: "4px solid #f39c12" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Active</p>
                <p className="text-2xl font-bold text-gray-800">{complaints.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-50">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-4"
            style={{ borderLeft: "4px solid #27ae60" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Complete</p>
                <p className="text-2xl font-bold text-gray-800">
                  {complaints.filter(c => c.is_complete).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-50">
                <Check className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-4"
            style={{ borderLeft: "4px solid #e74c3c" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Incomplete</p>
                <p className="text-2xl font-bold text-gray-800">
                  {complaints.filter(c => !c.is_complete).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50">
                <X className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
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
                    "Actions",
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
                          <a href={complaint.noc_file} target="_blank" rel="noopener noreferrer" className="text-blue-600 flex items-center gap-1 hover:underline">
                            <Check className="w-3 h-3" /> View NOC
                          </a>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <X className="w-3 h-3" /> Missing
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(complaint)}
                            className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!complaint.is_complete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCompleteClick(complaint)}
                              className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(rowId)}
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
            {complaints.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active complaints found</p>
                <p className="text-sm">Click &quot;Add New Complaint&quot; to create one</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              Add New Complaint
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Fill in all the details. Password confirmation required.
            </DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddClick}
              className="text-white"
              style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" }}
            >
              <Lock className="w-4 h-4 mr-2" />
              Submit with Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              Edit Complaint
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Update the complaint details. Password confirmation required.
            </DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              className="border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              className="text-white"
              style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" }}
            >
              <Lock className="w-4 h-4 mr-2" />
              Update with Password
            </Button>
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
              id="pass-input"
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
