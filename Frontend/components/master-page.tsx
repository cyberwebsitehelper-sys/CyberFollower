"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Edit, Trash2, User, Phone, Lock,
  Shield, Check, X, LayoutDashboard
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
import { apiService, type Employee } from "@/lib/api-service";
import { toast } from "sonner";

export function MasterPage({ onBack }: { onBack: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    password: "",
    is_super_role: false,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await apiService.getEmployees();
      setEmployees(data);
    } catch (error) {
      toast.error("Failed to load employees. Admin access required.");
    }
  };

  const handleCreate = async () => {
    if (!formData.full_name || !formData.phone_number || !formData.password) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsLoading(true);
    try {
      await apiService.createEmployee(formData);
      toast.success("Employee created successfully");
      setShowAddModal(false);
      setFormData({ full_name: "", phone_number: "", password: "", is_super_role: false });
      fetchEmployees();
    } catch (error) {
      toast.error("Failed to create employee");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedId) return;
    setIsLoading(true);
    try {
      // Password is optional on update in backend usually, but let's check
      const updateData = { ...formData };
      if (!updateData.password) delete (updateData as any).password;

      await apiService.updateEmployee(selectedId, updateData);
      toast.success("Employee updated successfully");
      setShowEditModal(false);
      fetchEmployees();
    } catch (error) {
      toast.error("Failed to update employee");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      await apiService.deleteEmployee(id);
      toast.success("Employee deleted");
      fetchEmployees();
    } catch (error) {
      toast.error("Failed to delete employee");
    }
  };

  const openEdit = (emp: Employee) => {
    setSelectedId(emp.id);
    setFormData({
      full_name: emp.full_name,
      phone_number: emp.phone_number,
      password: "", // Don't show password
      is_super_role: emp.is_super_role,
    });
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-red-700 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <LayoutDashboard onClick={onBack} className="cursor-pointer hover:scale-110 transition-transform" />
          <span className="font-bold text-lg tracking-tight">MASTER CONTROL</span>
        </div>
        <Button
          onClick={() => {
            setFormData({ full_name: "", phone_number: "", password: "", is_super_role: false });
            setShowAddModal(true);
          }}
          className="bg-white text-red-700 hover:bg-gray-100 font-bold"
        >
          <Plus className="mr-2 h-4 w-4" /> ADD EMPLOYEE
        </Button>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
          <p className="text-gray-500 text-sm">Create and manage access for all employees</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {employees.map((emp) => (
              <motion.div
                key={emp.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {emp.is_super_role && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                    Admin
                  </div>
                )}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="text-red-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 leading-tight">{emp.full_name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {emp.phone_number}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(emp)} className="text-blue-600 hover:bg-blue-50">
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(emp.id)} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">New Employee</DialogTitle>
            <DialogDescription>Create a unique login for a new team member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Full Name</label>
              <Input
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Phone Number (Login ID)</label>
              <Input
                placeholder="9876543210"
                value={formData.phone_number}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <Input
                type="password"
                placeholder="Minimum 4 characters"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="super_role"
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                checked={formData.is_super_role}
                onChange={(e) => setFormData({...formData, is_super_role: e.target.checked})}
              />
              <label htmlFor="super_role" className="text-sm font-medium text-gray-700">
                Give Administrative Access
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white font-bold px-8">
              {isLoading ? "Saving..." : "CREATE"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Edit Employee</DialogTitle>
            <DialogDescription>Update details or reset password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Full Name</label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Phone Number</label>
              <Input
                value={formData.phone_number}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">New Password (Leave blank to keep current)</label>
              <Input
                type="password"
                placeholder="Type only to change"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="super_role_edit"
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                checked={formData.is_super_role}
                onChange={(e) => setFormData({...formData, is_super_role: e.target.checked})}
              />
              <label htmlFor="super_role_edit" className="text-sm font-medium text-gray-700">
                Give Administrative Access
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white font-bold px-8">
              {isLoading ? "Saving..." : "UPDATE"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
