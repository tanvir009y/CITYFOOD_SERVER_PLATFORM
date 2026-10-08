import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import {
  Bike,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  RefreshCw,
  Phone,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddRiderOpen, setIsAddRiderOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });

  // অন-স্ক্রিন টোস্ট নোটিফিকেশন স্টেট
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // নতুন রাইডার ফর্ম স্টেট
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    cash_limit: 2000
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3200);
  };

  // ডাটাবেজ থেকে লাইভ রাইডার ফেচ
  const fetchRiders = async () => {
    try {
      setLoading(true);
      const res = await API.get('/riders');
      setRiders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast('রাইডার ডাটা লোড করা যায়নি!', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  // নতুন রাইডার সেভ করার হ্যান্ডলার
  const handleAddRider = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.password) {
      showToast('নাম, ফোন নম্বর এবং পাসওয়ার্ড পূরণ করুন!', 'error');
      return;
    }

    try {
      const res = await API.post('/riders', formData);
      if (res.data) {
        setRiders((prev) => [res.data, ...prev]);
        setIsAddRiderOpen(false);
        setFormData({ name: '', phone: '', password: '', cash_limit: 2000 });
        showToast('নতুন রাইডার সফলভাবে যুক্ত হয়েছে!');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      showToast(`রাইডার সেভ করা যায়নি: ${errMsg}`, 'error');
    }
  };

  // ক্যাশ সেটেলমেন্ট (Clear / Settle Cash)
  const handleSettleCash = async (riderId, name) => {
    try {
      const res = await API.patch(`/riders/${riderId}/settle`);
      if (res.data) {
        setRiders((prev) =>
          prev.map((r) => (r.id === riderId ? { ...r, cash_in_hand: 0, status: 'active' } : r))
        );
        showToast(`${name} এর ক্যাশ সফলভাবে সেটেল করা হয়েছে!`);
      }
    } catch (err) {
      showToast('ক্যাশ সেটেলমেন্ট ব্যর্থ হয়েছে!', 'error');
    }
  };

  // রাইডার ডিলিট
  const confirmDeleteRider = async () => {
    if (!deleteConfirm.id) return;
    try {
      await API.delete(`/riders/${deleteConfirm.id}`);
      setRiders((prev) => prev.filter((r) => r.id !== deleteConfirm.id));
      setDeleteConfirm({ open: false, id: null, name: '' });
      showToast('রাইডার সফলভাবে ডিলিট হয়েছে!');
    } catch (err) {
      showToast('রাইডার ডিলিট করা যায়নি!', 'error');
    }
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen relative font-sans">

      {/* অন-স্ক্রিন অ্যানিমেটেড টোস্ট নোটিফিকেশন */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 transition-all duration-300 transform translate-y-0 opacity-100">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-red-500/90 text-white border-red-600 shadow-red-500/20'
                : 'bg-emerald-600/95 text-white border-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* হেডার সেকশন */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Riders & Cash Handover</h1>
          <p className="text-sm text-gray-500">হাতে নগদ টাকা (COD), অনলাইন কালেকশন এবং সেটেলমেন্ট</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRiders}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:text-emerald-600 transition-colors shadow-sm"
            title="Refresh Riders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAddRiderOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 text-sm transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Rider
          </button>
        </div>
      </div>

      {/* রাইডার কার্ড গ্রিড */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 font-bold">রাইডার ডাটা লোড হচ্ছে...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {riders.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
              <Bike className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm font-semibold">কোনো রাইডার যুক্ত করা নেই। "+ Add Rider" বাটনে ক্লিক করে রাইডার যোগ করুন।</p>
            </div>
          ) : (
            riders.map((r) => {
              const cashInHand = Number(r.cash_in_hand || 0);
              const limit = Number(r.cash_limit || 2000);
              const isExceeded = cashInHand > limit;
              const isLocked = r.status === 'locked' || isExceeded;

              return (
                <div
                  key={r.id}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5 hover:shadow-md transition-shadow relative"
                >
                  {/* ডিলিট বাটন */}
                  <button
                    onClick={() => setDeleteConfirm({ open: true, id: r.id, name: r.name })}
                    className="absolute top-5 right-5 text-gray-300 hover:text-red-600 transition-colors"
                    title="Delete Rider"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3.5 pr-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Bike className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base">{r.name}</h3>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            isLocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isLocked ? 'LOCKED' : 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-gray-400" /> {r.phone}
                      </p>
                    </div>
                  </div>

                  {/* ক্যাশ স্ট্যাটাস বিবরণ */}
                  <div className="bg-gray-50 p-4 rounded-xl grid grid-cols-2 gap-4 border border-gray-100">
                    <div>
                      <span className="text-[11px] font-bold text-gray-500 block uppercase">Cash in Hand (COD)</span>
                      <h4 className={`text-xl font-black mt-0.5 ${isExceeded ? 'text-red-600' : 'text-gray-900'}`}>
                        ৳ {cashInHand.toLocaleString()}
                      </h4>
                      <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                        Limit: ৳{limit.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-gray-500 block uppercase">Online Paid Delivery</span>
                      <h4 className="text-xl font-black text-emerald-600 mt-0.5">
                        ৳ {Number(r.online_total || 0).toLocaleString()}
                      </h4>
                    </div>
                  </div>

                  {/* ফুটার অ্যাকশন */}
                  <div className="flex items-center justify-between pt-1">
                    {isExceeded ? (
                      <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Limit Exceeded
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Safe Zone
                      </span>
                    )}

                    <button
                      onClick={() => handleSettleCash(r.id, r.name)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Clear / Settle Cash
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===================== On-Screen Add Rider Modal ===================== */}
      {isAddRiderOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base">Add New Rider</h3>
              <button onClick={() => setIsAddRiderOpen(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-black" />
              </button>
            </div>

            <form onSubmit={handleAddRider} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block mb-1 text-gray-600 font-bold">Rider Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rakib Hasan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-1 focus:ring-emerald-500 font-semibold text-sm"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-600 font-bold">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="018xxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-1 focus:ring-emerald-500 font-semibold text-sm"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-600 font-bold">Panel Password</label>
                <input
                  type="password"
                  required
                  placeholder="Secret password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-1 focus:ring-emerald-500 font-semibold text-sm"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-600 font-bold">COD Cash Limit (৳)</label>
                <input
                  type="number"
                  placeholder="2000"
                  value={formData.cash_limit}
                  onChange={(e) => setFormData({ ...formData, cash_limit: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-1 focus:ring-emerald-500 font-semibold text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 text-sm active:scale-95 transition-transform mt-2"
              >
                Save Rider
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================== On-Screen Delete Confirmation Modal ===================== */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">রাইডার ডিলিট নিশ্চিত করুন</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                আপনি কি নিশ্চিত <strong>"{deleteConfirm.name}"</strong> রাইডারকে ডিলিট করতে চান?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={confirmDeleteRider}
                className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 shadow-md shadow-red-600/30 transition-colors"
              >
                হ্যাঁ, ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}