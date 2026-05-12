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
  FileX,
  FileCheck,
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
  onDelete: (id: string, passwordConfirm: string) => Promise<void>;
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
  const [pendingAction, setPendingAction] = useState<"add" | "edit" | "complete" | "delete" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRowId = (complaint: any): string => {
    if (!complaint) return "";
    const id = complaint.id ?? complaint._id ?? complaint.pk;
    if (typeof id === 'object' && id !== null) {
      return String(id.$oid || id.id || JSON.stringify(id)).trim();
    }
    return String(id || "").trim();
  };

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
          data.append(key, value);
        } else {
          if (value === '' && ['utr_number', 'police_station', 'vendor_name'].includes(key)) return;
          data.append(key, value as any);
        }
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
      const rowId = getRowId(selectedComplaint);
      if (pendingAction === "add") {
        await onAdd(createFormData(password));
        setShowAddModal(false);
        setFormData(emptyComplaint);
      } else if (pendingAction === "edit" && selectedComplaint) {
        await onUpdate(rowId, createFormData(password));
        setShowEditModal(false);
        setSelectedComplaint(null);
        setFormData(emptyComplaint);
      } else if (pendingAction === "complete" && selectedComplaint) {
        await onMoveToClose(rowId, password);
        setSelectedComplaint(null);
      } else if (pendingAction === "delete" && selectedComplaint) {
        await onDelete(rowId, password);
        setSelectedComplaint(null);
      }
      setShowPasswordModal(false);
      setPassword("");
      setPendingAction(null);
    } catch (err: any) {
      setPasswordError(err?.message || "Action failed. Check password.");
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
      utr_number: complaint.utr_number || "",
      police_station: complaint.police_station || "",
      vendor_name: complaint.vendor_name || "",
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

  const handleDeleteClick = (complaint: CyberComplaint) => {
    setSelectedComplaint(complaint);
    setPendingAction("delete");
    setShowPasswordModal(true);
  };

  const renderFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Bank Name *</label>
        <Input
          id="f1"
          autoFocus
          value={formData.bank_name}
          onChange={(e) => handleInputChange("bank_name", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f2")}
          placeholder="Enter bank name"
          className="bg-gray-50 border-gray-200 text-gray-800 focus:bg-white transition-colors"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">ACK Number *</label>
        <Input
          id="f2"
          value={formData.ack_number}
          onChange={(e) => handleInputChange("ack_number", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f3")}
          placeholder="Enter ACK number"
          className="bg-gray-50 border-gray-200 text-gray-800 focus:bg-white transition-colors"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">IFSC Code *</label>
        <Input
          id="f3"
          value={formData.ifsc_code}
          onChange={(e) => handleInputChange("ifsc_code", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f4")}
          placeholder="Enter IFSC code"
          className="bg-gray-50 border-gray-200 text-gray-800 focus:bg-white transition-colors"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">State Name *</label>
        <Input
          id="f4"
          value={formData.state_name}
          onChange={(e) => handleInputChange("state_name", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f5")}
          placeholder="Enter state"
          className="bg-gray-50 border-gray-200 text-gray-800 focus:bg-white transition-colors"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">District *</label>
        <Input
          id="f5"
          value={formData.district}
          onChange={(e) => handleInputChange("district", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f6")}
          placeholder="Enter district"
          className="bg-gray-50 border-gray-200 text-gray-800 focus:bg-white transition-colors"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Layer *</label>
        <Input
          id="f6"
          value={formData.layer}
          onChange={(e) => handleInputChange("layer", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f7")}
          placeholder="Enter layer"
          className="bg-gray-50 border-gray-200 text-gray-800 focus:bg-white transition-colors"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">TXN Amount *</label>
        <Input
          id="f7"
          type="number"
          value={formData.txn_amount || ""}
          onChange={(e) => handleInputChange("txn_amount", parseFloat(e.target.value) || 0)}
          onKeyDown={(e) => handleKeyDown(e, "f8")}
          placeholder="Enter amount"
          className="bg-gray-50 border-gray-200 text-gray-800 focus:bg-white transition-colors"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Dispute Amount *</label>
        <Input
          id="f8"
          type="number"
          value={formData.dispute_amount || ""}
          onChange={(e) => handleInputChange("dispute_amount", parseFloat(e.target.value) || 0)}
          onKeyDown={(e) => handleKeyDown(e, "f9")}
          placeholder="Enter amount"
          className="bg-gray-50 border-gray-200 text-gray-800 focus:bg-white transition-colors"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">UTR Number</label>
        <Input
          id="f9"
          value={formData.utr_number}
          onChange={(e) => handleInputChange("utr_number", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f10")}
          placeholder="N/A"
          className="bg-gray-50 border-gray-200 text-gray-800 focus:bg-white transition-colors"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Police Station</label>
        <Input
          id="f10"
          value={formData.police_station}
          onChange={(e) => handleInputChange("police_station", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f11")}
          placeholder="N/A"
          className="bg-gray-50 border-gray-200 text-gray-800 focus:bg-white transition-colors"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Vendor Name</label>
        <Input
          id="f11"
          value={formData.vendor_name}
          onChange={(e) => handleInputChange("vendor_name", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "f12")}
          placeholder="N/A"
          className="bg-gray-50 border-gray-200 text-gray-800 focus:bg-white transition-colors"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">NOC File (Upload to Close)</label>
        <div className="flex items-center gap-2">
          <Input
            id="f12"
            type="file"
            onChange={handleFileChange}
            className="bg-gray-50 border-gray-200 text-gray-800 cursor-pointer"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </div>
        {formData.noc_file && (
          <p className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-1">
            <FileCheck className="w-3 h-3" /> READY: {formData.noc_file.name}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <header
        className="text-white px-6 py-3"
        style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shadow-inner">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">CYBER SYSTEM</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium bg-black/10 px-3 py-1.5 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            LIVE DATABASE
          </div>
        </div>
      </header>

      <nav className="bg-[#2c3e50] text-white px-6 py-3 shadow-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-all hover:translate-x-[-2px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <span className="text-white/20">|</span>
          <span className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            Active Complaints
          </span>
        </div>
      </nav>

      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Cyber Complaints Tracker</h1>
            <p className="text-xs text-gray-500">Managing {complaints.length} pending investigation cases</p>
          </div>
          <Button
            onClick={() => {
              setFormData(emptyComplaint);
              setShowAddModal(true);
            }}
            className="text-white font-bold px-6 shadow-lg transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center justify-between overflow-hidden relative group">
             <div className="z-10">
                <p className="text-xs font-bold text-gray-400 uppercase">Total Active</p>
                <p className="text-3xl font-black text-gray-800">{complaints.length}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-yellow-500/10 absolute right-[-4px] bottom-[-4px] group-hover:scale-110 transition-transform" />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center justify-between overflow-hidden relative group">
             <div className="z-10">
                <p className="text-xs font-bold text-gray-400 uppercase">Processing</p>
                <p className="text-3xl font-black text-blue-600">
                  {complaints.filter(c => !c.noc_file).length}
                </p>
              </div>
              <Upload className="w-12 h-12 text-blue-500/10 absolute right-[-4px] bottom-[-4px] group-hover:scale-110 transition-transform" />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center justify-between overflow-hidden relative group">
             <div className="z-10">
                <p className="text-xs font-bold text-gray-400 uppercase">Ready to Close</p>
                <p className="text-3xl font-black text-green-600">
                  {complaints.filter(c => c.noc_file).length}
                </p>
              </div>
              <Check className="w-12 h-12 text-green-500/10 absolute right-[-4px] bottom-[-4px] group-hover:scale-110 transition-transform" />
          </div>
        </div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#2c3e50] text-white">
                <tr>
                  {[
                    "Client / Bank",
                    "ACK / IFSC",
                    "State / District",
                    "Amount (TXN/DISP)",
                    "UTR / Station / Vendor",
                    "NOC Status",
                    "Manage",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-white/70"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence mode="popLayout">
                  {complaints.map((complaint, index) => {
                    const rowId = getRowId(complaint);
                    return (
                    <motion.tr
                      key={rowId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group hover:bg-gray-50/80 transition-all border-l-4 border-l-transparent hover:border-l-[#e74c3c]"
                    >
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-gray-800">{complaint.bank_name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">LAYER: {complaint.layer}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit">{complaint.ack_number}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{complaint.ifsc_code}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-gray-700 font-semibold">{complaint.state_name}</p>
                        <p className="text-[10px] text-gray-400">{complaint.district}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-bold text-gray-800">₹{Number(complaint.txn_amount).toLocaleString()}</p>
                        <p className="text-[10px] text-red-500 font-medium">₹{Number(complaint.dispute_amount).toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-700 font-medium"><span className="text-gray-400">UTR:</span> {complaint.utr_number || "-"}</p>
                          <p className="text-[10px] text-gray-700 font-medium"><span className="text-gray-400">PS:</span> {complaint.police_station || "-"}</p>
                          <p className="text-[10px] text-gray-700 font-medium"><span className="text-gray-400">VN:</span> {complaint.vendor_name || "-"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {complaint.noc_file ? (
                          <a
                            href={complaint.noc_file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-200 hover:bg-green-100 transition-colors"
                          >
                            <FileCheck className="w-3 h-3" /> ATTACHED
                          </a>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-full border border-red-100">
                            <FileX className="w-3 h-3" /> NO FILE
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(complaint)}
                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCompleteClick(complaint)}
                            className="h-8 w-8 text-green-500 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(complaint)}
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
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
              <div className="text-center py-20 bg-gray-50/50">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <h3 className="text-lg font-bold text-gray-400">Clear Records</h3>
                <p className="text-sm text-gray-400">No active complaints found in this view.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-3xl bg-white border-0 shadow-2xl rounded-2xl overflow-hidden p-0">
          <div className="h-2 w-full bg-[#e74c3c]"></div>
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-gray-800 uppercase tracking-tight">
                New Complaint Entry
              </DialogTitle>
              <DialogDescription className="text-gray-500 font-medium">
                Add a new record to the tracking system. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            {renderFormFields()}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="font-bold border-gray-200 px-6"
              >
                Discard
              </Button>
              <Button
                onClick={handleAddClick}
                className="text-white font-bold px-8 shadow-md"
                style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" }}
              >
                <Lock className="w-4 h-4 mr-2" />
                Proceed to Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-3xl bg-white border-0 shadow-2xl rounded-2xl overflow-hidden p-0">
          <div className="h-2 w-full bg-blue-500"></div>
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-gray-800 uppercase tracking-tight">
                Update Record
              </DialogTitle>
              <DialogDescription className="text-gray-500 font-medium">
                Modify existing complaint details. Uploading an NOC file will close this case.
              </DialogDescription>
            </DialogHeader>
            {renderFormFields()}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="font-bold border-gray-200 px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
                className="text-white font-bold px-8 shadow-md bg-blue-600 hover:bg-blue-700"
              >
                <Lock className="w-4 h-4 mr-2" />
                Update Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-sm bg-white border-0 shadow-2xl rounded-2xl p-0 overflow-hidden">
          <div className="bg-[#2c3e50] p-6 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-white mb-1">
              Verify Action
            </DialogTitle>
            <DialogDescription className="text-white/60 text-xs font-medium">
              Please enter your employee password to continue
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4">
            <Input
              id="pass-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-50 border-gray-200 text-gray-800 text-center text-lg h-12 focus:bg-white transition-all"
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              autoFocus
            />
            {passwordError && (
              <p className="text-red-600 text-[10px] font-bold text-center animate-bounce uppercase tracking-wider">
                <AlertCircle className="w-3 h-3 inline mr-1" /> {passwordError}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button
                disabled={isSubmitting}
                onClick={handlePasswordSubmit}
                className="text-white font-black h-12 rounded-xl"
                style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" }}
              >
                {isSubmitting ? "AUTHORIZING..." : (pendingAction === "delete" ? "CONFIRM DELETE" : "CONFIRM ACTION")}
              </Button>
              <Button
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword("");
                  setPasswordError("");
                }}
                className="text-gray-400 font-bold hover:text-gray-600"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
