import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Mail,
  Lock,
  Phone,
  UserCheck,
  UserX,
  X,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

const MAIN_SUPER_ADMIN_EMAIL = 'tanvir.it009@gmail.com';

export default function AdminRoles() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'sub_admin',
    permissions: ['orders', 'restaurants']
  });

  const availablePermissions = [
    { id: 'orders', label: 'Live Orders Manage' },
    { id: 'restaurants', label: 'Restaurants Control' },
    { id: 'riders', label: 'Riders & Cash' },
    { id: 'master_edit', label: 'Master Edit (Banners/Settings)' },
    { id: 'finance', label: 'Finance & Payouts' },
    { id: 'customers', label: 'Customer Control' }
  ];

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3200);
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admins');
      setAdmins(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast('Failed to load admin list!', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handlePermissionToggle = (permId) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permId)
          : [...prev.permissions, permId]
      };
    });
  };

  const handleAddSubAdmin = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      showToast('Name, Gmail, and Password are all required!', 'error');
      return;
    }

    try {
      const res = await API.post('/admins', formData);
      if (res.data) {
        setAdmins((prev) => [res.data, ...prev]);
        setIsModalOpen(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          role: 'sub_admin',
          permissions: ['orders', 'restaurants']
        });
        showToast('Sub-Admin added successfully!');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      showToast(`Creation failed: ${errMsg}`, 'error');
    }
  };

  const handleToggleStatus = async (id, name) => {
    try {
      const res = await API.patch(`/admins/${id}/toggle-status`);
      if (res.data) {
        setAdmins((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: res.data.status } : a))
        );
        showToast(`Status updated for ${name}!`);
      }
    } catch (err) {
      showToast('Failed to update status!', 'error');
    }
  };

  const confirmDeleteAdmin = async () => {
    if (!deleteConfirm.id) return;
    try {
      await API.delete(`/admins/${deleteConfirm.id}`);
      setAdmins((prev) => prev.filter((a) => a.id !== deleteConfirm.id));
      setDeleteConfirm({ open: false, id: null, name: '' });
      showToast('Admin deleted successfully!');
    } catch (err) {
      showToast('Failed to delete admin!', 'error');
    }
  };

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen relative font-sans">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[9999] transition-all duration-300">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
            }`}
          >
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Roles & Permissions</h1>
          <p className="text-sm text-gray-500">Manage Sub-Admin credentials, permissions, and status</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdmins}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:text-emerald-600 transition-colors shadow-sm cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 text-sm transition-transform active:scale-95 cursor-pointer z-10"
          >
            <Plus className="w-4 h-4" /> Add Sub Admin
          </button>
        </div>
      </div>

      {/* Admin Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 font-bold">Loading accounts...</div>
      ) : admins.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
          <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-semibold text-sm">No accounts found. Click "+ Add Sub Admin" to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {admins.map((a) => {
            const isActive = a.status === 'active';
            const isPrimaryMaster = String(a.email).toLowerCase().trim() === MAIN_SUPER_ADMIN_EMAIL.toLowerCase();

            return (
              <div
                key={a.id}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-shadow relative"
              >
                {/* Delete button: Visible for any account EXCEPT tanvir.it009@gmail.com */}
                {!isPrimaryMaster && (
                  <button
                    onClick={() => setDeleteConfirm({ open: true, id: a.id, name: a.name || a.email })}
                    className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="flex items-center gap-3.5 pr-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                    isPrimaryMaster ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-base">{a.name}</h3>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isPrimaryMaster ? 'bg-purple-100 text-purple-700' : isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isPrimaryMaster ? 'SUPER ADMIN' : isActive ? 'ACTIVE' : 'BLOCKED'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-gray-400" /> {a.email}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Access Permissions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {a.permissions?.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-700 rounded-md text-[11px] font-bold">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {!isPrimaryMaster && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400 font-semibold">Account Status:</span>
                    <button
                      onClick={() => handleToggleStatus(a.id, a.name || a.email)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isActive
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {isActive ? 'Block Access' : 'Activate Access'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Sub Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Add New Sub-Admin
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-black rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubAdmin} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block mb-1 text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Mahmud"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:ring-1 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-700">Sub-Admin Gmail</label>
                <input
                  type="email"
                  required
                  placeholder="subadmin@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:ring-1 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-700">Login Password</label>
                <input
                  type="password"
                  required
                  placeholder="Set secret password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:ring-1 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-700">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="017xxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:ring-1 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>

              <div className="pt-1">
                <label className="block mb-2 text-gray-700 font-bold">Permissions:</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  {availablePermissions.map((perm) => (
                    <label
                      key={perm.id}
                      className={`flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                        formData.permissions.includes(perm.id)
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-white border-gray-200 text-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => handlePermissionToggle(perm.id)}
                        className="text-emerald-600 rounded"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 text-sm cursor-pointer mt-2 active:scale-95 transition-transform"
              >
                Save Sub-Admin Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <Trash2 className="w-10 h-10 text-red-600 mx-auto" />
            <div>
              <h3 className="text-base font-black text-gray-900">Confirm Deletion</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to permanently delete "{deleteConfirm.name}"?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAdmin}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}