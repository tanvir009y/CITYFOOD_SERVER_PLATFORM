import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import {
  CreditCard,
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  Upload,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function MasterEdit() {
  const [settings, setSettings] = useState({
    bkash_number: '',
    nagad_number: '',
    support_number: ''
  });
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal & Toast States
  const [isAddBannerOpen, setIsAddBannerOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, title: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // New Banner Form State
  const [newBanner, setNewBanner] = useState({
    title: '',
    priority: 1,
    image_url: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, bannersRes] = await Promise.all([
        API.get('/settings').catch(() => ({ data: {} })),
        API.get('/banners').catch(() => ({ data: [] }))
      ]);

      if (settingsRes?.data) {
        setSettings({
          bkash_number: settingsRes.data.bkash_number || '',
          nagad_number: settingsRes.data.nagad_number || '',
          support_number: settingsRes.data.support_number || ''
        });
      }
      setBanners(Array.isArray(bannersRes?.data) ? bannersRes.data : []);
    } catch (err) {
      showToast('ডাটা লোড করা যায়নি!', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Settings Save Handler
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await API.post('/settings', settings);
      showToast('সেটিংস সফলভাবে সেভ হয়েছে!');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      showToast(`সেটিংস সেভ হয়নি: ${errMsg}`, 'error');
    }
  };

  // Device theke image file read ebong Canvas auto-compress kora
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('অনুগ্রহ করে একটি ছবি ফাইল সিলেক্ট করুন!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG 0.72 quality-te lightweight Base64 convert
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.72);
        setNewBanner((prev) => ({ ...prev, image_url: compressedBase64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Banner Add Handler
  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!newBanner.image_url) {
      showToast('অনুগ্রহ করে ব্যানারের ছবি সিলেক্ট করুন!', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await API.post('/banners', {
        title: newBanner.title || 'Special Promotion',
        priority: Number(newBanner.priority) || 1,
        image_url: newBanner.image_url
      });

      if (res.data) {
        setBanners((prev) => [...prev, res.data]);
        setIsAddBannerOpen(false);
        setNewBanner({ title: '', priority: 1, image_url: '' });
        showToast('ব্যানার সফলভাবে অ্যাড হয়েছে!');
      }
    } catch (err) {
      console.error('Banner upload fail:', err);
      const errMsg = err.response?.data?.error || err.message;
      showToast(`ব্যানার যুক্ত করা যায়নি (${errMsg})`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Banner Priority Update Handler
  const handlePriorityChange = async (id, newPriority) => {
    const pVal = Number(newPriority) || 1;
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, priority: pVal } : b))
    );
    try {
      await API.patch(`/banners/${id}/priority`, { priority: pVal });
    } catch (err) {
      console.error(err);
    }
  };

  // Banner Delete Confirm Handler
  const confirmDeleteBanner = async () => {
    if (!deleteConfirm.id) return;
    try {
      await API.delete(`/banners/${deleteConfirm.id}`);
      setBanners((prev) => prev.filter((b) => b.id !== deleteConfirm.id));
      setDeleteConfirm({ open: false, id: null, title: '' });
      showToast('ব্যানার সফলভাবে ডিলিট হয়েছে!');
    } catch (err) {
      showToast('ব্যানার ডিলিট করা যায়নি!', 'error');
    }
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen relative font-sans">

      {/* On-Screen Animated Toast Notification */}
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

      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Master Edit & Control</h1>
        <p className="text-sm text-gray-500">ব্যানার, প্রায়োরিটি এবং কোর পেমেন্ট নম্বর ম্যানেজ করুন</p>
      </div>

      {/* 1. Payment Settings Section */}
      <div className="bg-white p-6 rounded-2xl border border-emerald-100/70 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b pb-3 text-emerald-800">
          <CreditCard className="w-5 h-5" />
          <h2 className="text-lg font-bold">পেমেন্ট ও কাস্টমার কেয়ার সেটিংস</h2>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">BKASH NUMBER</label>
              <input
                type="text"
                value={settings.bkash_number}
                onChange={(e) => setSettings({ ...settings, bkash_number: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                placeholder="01609764336"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">NAGAD NUMBER</label>
              <input
                type="text"
                value={settings.nagad_number}
                onChange={(e) => setSettings({ ...settings, nagad_number: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                placeholder="01609764336"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">SUPPORT HELPLINE</label>
              <input
                type="text"
                value={settings.support_number}
                onChange={(e) => setSettings({ ...settings, support_number: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                placeholder="01609764336"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 text-sm transition-transform active:scale-95"
            >
              <Save className="w-4 h-4" /> Save Settings
            </button>
          </div>
        </form>
      </div>

      {/* 2. Banner Management Section */}
      <div className="bg-white p-6 rounded-2xl border border-emerald-100/70 shadow-sm space-y-5">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2 text-emerald-800">
            <ImageIcon className="w-5 h-5" />
            <h2 className="text-lg font-bold">হোম ব্যানার ও স্লাইডার প্রায়োরিটি</h2>
          </div>
          <button
            onClick={() => setIsAddBannerOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Banner
          </button>
        </div>

        {/* Banner Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {banners.length === 0 ? (
            <div className="col-span-full py-10 text-center text-gray-400 text-sm font-bold">
              কোনো ব্যানার যুক্ত করা নেই। "+ Add Banner" বাটনে ক্লিক করে ডিভাইস থেকে ব্যানার আপলোড করুন।
            </div>
          ) : (
            banners.map((b) => (
              <div
                key={b.id}
                className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden p-3 space-y-3 relative group hover:shadow-md transition-shadow"
              >
                {/* Banner Image Display */}
                <div className="h-32 w-full rounded-xl bg-gray-200 overflow-hidden relative">
                  {b.image_url ? (
                    <img
                      src={b.image_url}
                      alt={b.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center font-bold text-gray-400 text-xs">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span>{b.title}</span>
                    </div>
                  )}

                  {/* On-screen Delete Trigger */}
                  <button
                    onClick={() => setDeleteConfirm({ open: true, id: b.id, title: b.title })}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Banner Title & Priority Input */}
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{b.title || 'Promo Banner'}</h4>
                    <span className="text-[11px] text-gray-400 block font-semibold">
                      Order Priority: #{b.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-500">Priority:</span>
                    <input
                      type="number"
                      value={b.priority || 1}
                      onChange={(e) => handlePriorityChange(b.id, e.target.value)}
                      className="w-12 bg-white text-center font-bold text-sm border rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===================== On-Screen Add Banner Modal ===================== */}
      {isAddBannerOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base">Add New Banner</h3>
              <button onClick={() => setIsAddBannerOpen(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-black" />
              </button>
            </div>

            <form onSubmit={handleAddBanner} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block mb-1 text-gray-600 font-bold">Banner Title / Caption</label>
                <input
                  type="text"
                  value={newBanner.title}
                  onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                  placeholder="e.g. Mega Discount 50%"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-1 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-600 font-bold">Priority Order</label>
                <input
                  type="number"
                  value={newBanner.priority}
                  onChange={(e) => setNewBanner({ ...newBanner, priority: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-1 focus:ring-emerald-500 font-semibold"
                />
              </div>

              {/* Device theke Image Upload Field */}
              <div>
                <label className="block mb-1 text-gray-600 font-bold">Banner Image</label>
                <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-emerald-500 bg-gray-50/50 transition-colors">
                  <Upload className="w-6 h-6 text-emerald-600 mb-1" />
                  <span className="text-gray-700 font-bold text-xs">ডিভাইস থেকে ব্যানার ফাইল সিলেক্ট করুন</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">অটো অপ্টিমাইজড হয়ে সেভ হবে</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>

                {newBanner.image_url && (
                  <div className="mt-3 rounded-xl overflow-hidden h-28 border border-gray-200 shadow-sm relative">
                    <img
                      src={newBanner.image_url}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 text-sm active:scale-95 transition-transform disabled:opacity-50"
              >
                {isSubmitting ? 'সেভ হচ্ছে...' : 'Upload & Save Banner'}
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
              <h3 className="text-lg font-black text-gray-900">ব্যানার ডিলিট নিশ্চিত করুন</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                আপনি কি নিশ্চিত <strong>"{deleteConfirm.title || 'এই ব্যানারটি'}"</strong> ডিলিট করতে চান?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm({ open: false, id: null, title: '' })}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={confirmDeleteBanner}
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