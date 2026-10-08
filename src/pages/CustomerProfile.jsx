import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useCustomer } from '../context/CustomerContext';
import { User, Mail, Phone, MapPin, Home, LogOut, CheckCircle, Loader2 } from 'lucide-react';

export default function CustomerProfile({ onLogout }) {
  const { customer, setCustomer, logoutCustomer } = useCustomer();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    area_id: customer?.area_id || '',
    address: customer?.address || ''
  });

  useEffect(() => {
    API.get('/delivery-areas').then((res) => {
      setAreas(Array.isArray(res.data) ? res.data : []);
    });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await API.put(`/customer/profile/${customer.id}`, formData);
      if (res.data.success) {
        setCustomer(res.data.user);
        localStorage.setItem('cf_customer', JSON.stringify(res.data.user));
        setMessage('Profile updated successfully!');
      }
    } catch (err) {
      alert('Update failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-xl mx-auto space-y-4 font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-gray-900">My Profile</h2>
        <button
          onClick={() => { logoutCustomer(); if (onLogout) onLogout(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleUpdate} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3.5 text-xs font-bold">
        <div>
          <label className="text-gray-500 uppercase text-[10px]">Full Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2.5 border rounded-xl font-semibold mt-1 outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-gray-500 uppercase text-[10px]">Gmail</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 border rounded-xl font-semibold mt-1 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-gray-500 uppercase text-[10px]">Phone Number</label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 border rounded-xl font-semibold mt-1 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="text-gray-500 uppercase text-[10px]">Default Location Area</label>
          <select
            value={formData.area_id}
            onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
            className="w-full px-3.5 py-2.5 border rounded-xl font-semibold mt-1 outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
          >
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-gray-500 uppercase text-[10px]">Street / Home Address</label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3.5 py-2.5 border rounded-xl font-semibold mt-1 outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-md mt-2 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
}