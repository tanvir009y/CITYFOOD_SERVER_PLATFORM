import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { MapPin, Tag, Plus, Trash2, RefreshCw, AlertTriangle, X } from 'lucide-react';

export default function AreasAndCoupons() {
  const [areas, setAreas] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);

  // Popup Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Form States
  const [newArea, setNewArea] = useState({ name: '', delivery_fee: '', estimated_time: '30-45 mins' });
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [areasRes, couponsRes] = await Promise.all([
        API.get('/delivery-areas').catch(() => ({ data: [] })),
        API.get('/coupons').catch(() => ({ data: [] }))
      ]);
      setAreas(Array.isArray(areasRes?.data) ? areasRes.data : []);
      setCoupons(Array.isArray(couponsRes?.data) ? couponsRes.data : []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ডেলিভারি এরিয়া তৈরি
  const handleAddArea = async (e) => {
    e.preventDefault();
    if (!newArea.name || !newArea.delivery_fee) return;
    try {
      const res = await API.post('/delivery-areas', newArea);
      if (res?.data) {
        setAreas((prev) => [res.data, ...prev]);
        setNewArea({ name: '', delivery_fee: '', estimated_time: '30-45 mins' });
      }
    } catch (err) {
      alert('এরিয়া যোগ করা যায়নি!');
    }
  };

  // ডেলিভারি এরিয়া ডিলিট কনফার্মেশন পপআপ
  const confirmDeleteArea = (id) => {
    setModalConfig({
      isOpen: true,
      title: 'এরিয়া ডিলিট নিশ্চিত করুন',
      message: 'আপনি কি নিশ্চিতভাবে এই ডেলিভারি এরিয়াটি ডিলিট করতে চান?',
      onConfirm: async () => {
        try {
          await API.delete(`/delivery-areas/${id}`);
          setAreas((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
          alert('ডিলিট ব্যর্থ হয়েছে');
        } finally {
          setModalConfig({ isOpen: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  // কুপন তৈরি
  const handleAddCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount_value) return;
    try {
      const res = await API.post('/coupons', newCoupon);
      if (res?.data) {
        setCoupons((prev) => [res.data, ...prev]);
        setNewCoupon({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '' });
      }
    } catch (err) {
      alert('কুপন তৈরি করা যায়নি!');
    }
  };

  // কুপন ডিলিট কনফার্মেশন পপআপ
  const confirmDeleteCoupon = (id) => {
    setModalConfig({
      isOpen: true,
      title: 'কুপন ডিলিট নিশ্চিত করুন',
      message: 'আপনি কি নিশ্চিতভাবে এই কুপনটি ডিলিট করতে চান?',
      onConfirm: async () => {
        try {
          await API.delete(`/coupons/${id}`);
          setCoupons((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
          alert('ডিলিট ব্যর্থ হয়েছে');
        } finally {
          setModalConfig({ isOpen: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen relative font-sans">
      {/* Custom Confirmation Popup Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">{modalConfig.title}</h3>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">{modalConfig.message}</p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setModalConfig({ isOpen: false, title: '', message: '', onConfirm: null })}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                বাতিল (Cancel)
              </button>
              <button
                onClick={modalConfig.onConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md shadow-rose-600/20 transition-all"
              >
                হ্যাঁ, ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Delivery Areas & Promo Coupons</h1>
          <p className="text-sm text-gray-500">কাস্টমার ডেলিভারি চার্জ এবং ডিসকাউন্ট কুপন পরিচালনা করুন[cite: 29]</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:text-emerald-600 transition-colors shadow-sm cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ডেলিভারি এরিয়া সেকশন */}
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b pb-3">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">ডেলিভারি এরিয়া সেটিংস</h2>
          </div>

          <form onSubmit={handleAddArea} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
            <div className="sm:col-span-3">
              <label className="text-xs font-bold text-gray-600 block mb-1">এরিয়ার নাম (যেমন: Sector 10, Uttara)</label>
              <input
                type="text"
                required
                placeholder="Sector 10, Uttara"
                value={newArea.name}
                onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">ডেলিভারি চার্জ (৳)</label>
              <input
                type="number"
                required
                placeholder="40"
                value={newArea.delivery_fee}
                onChange={(e) => setNewArea({ ...newArea, delivery_fee: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">আনুমানিক সময়</label>
              <input
                type="text"
                placeholder="30-45 mins"
                value={newArea.estimated_time}
                onChange={(e) => setNewArea({ ...newArea, estimated_time: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> এরিয়া যোগ করুন
              </button>
            </div>
          </form>

          {/* এরিয়া লিস্ট */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-xs text-gray-400 text-center py-4">লোড হচ্ছে...</p>
            ) : areas.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">কোনো এরিয়া যুক্ত করা নেই</p>
            ) : (
              areas.map((a) => (
                <div key={a.id} className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{a.name}</h4>
                    <p className="text-xs text-gray-500">
                      ডেলিভারি ফি: <strong className="text-emerald-700">৳{a.delivery_fee}</strong> | সময়: {a.estimated_time}
                    </p>
                  </div>
                  <button onClick={() => confirmDeleteArea(a.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* কুপন সেকশন */}
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b pb-3">
            <Tag className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">ডিসকাউন্ট কুপন</h2>
          </div>

          <form onSubmit={handleAddCoupon} className="space-y-3 bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">কুপন কোড</label>
                <input
                  type="text"
                  required
                  placeholder="EID50"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm uppercase font-bold bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">ডিসকাউন্ট টাইপ</label>
                <select
                  value={newCoupon.discount_type}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="percentage">শতাংশ (%)</option>
                  <option value="fixed">ফিক্সড টাকা (৳)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">ছাড় ({newCoupon.discount_type === 'percentage' ? '%' : '৳'})</label>
                <input
                  type="number"
                  required
                  placeholder="10"
                  value={newCoupon.discount_value}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">মিনিমাম অর্ডার (৳)</label>
                <input
                  type="number"
                  placeholder="300"
                  value={newCoupon.min_order_amount}
                  onChange={(e) => setNewCoupon({ ...newCoupon, min_order_amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> কুপন তৈরি করুন
            </button>
          </form>

          {/* কুপন লিস্ট */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-xs text-gray-400 text-center py-4">লোড হচ্ছে...</p>
            ) : coupons.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">কোনো কুপন তৈরি করা নেই</p>
            ) : (
              coupons.map((c) => (
                <div key={c.id} className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-xs tracking-wider">
                      {c.code}
                    </span>
                    <p className="text-xs text-gray-600 mt-1 font-semibold">
                      ছাড়: {c.discount_type === 'percentage' ? `${c.discount_value}%` : `৳${c.discount_value}`} | মিনিমাম অর্ডার: ৳{c.min_order_amount}
                    </p>
                  </div>
                  <button onClick={() => confirmDeleteCoupon(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}