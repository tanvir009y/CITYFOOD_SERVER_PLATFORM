import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { Users, Ban, Search, Phone, MessageSquare, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/customers');
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const toggleBlock = async (customer) => {
    const newStatus = String(customer.status).toLowerCase() === 'blocked' ? 'active' : 'blocked';
    try {
      const res = await API.patch(`/customers/${customer.id}/status`, { status: newStatus });
      if (res.data.success) {
        setCustomers(customers.map(c => c.id === customer.id ? { ...c, status: newStatus } : c));
      }
    } catch (err) {
      console.error('Failed to update customer status:', err);
      alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে!');
    }
  };

  const filteredCustomers = customers.filter(c => {
    const name = String(c.name || '').toLowerCase();
    const phone = String(c.phone || '');
    const q = searchQuery.toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Customer Control & Fraud Check</h1>
          <p className="text-sm text-gray-500">লাইভ ডাটাবেজ থেকে কাস্টমারদের অর্ডার হিস্ট্রি এবং ফ্রড মনিটরিং</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Name or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
            />
          </div>
          <button
            onClick={fetchCustomers}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:text-emerald-600 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 font-bold">কাস্টমার ডাটা লোড হচ্ছে...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400 font-semibold">
          কোনো কাস্টমার পাওয়া যায়নি
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCustomers.map((c) => {
            const isBlocked = String(c.status || '').toLowerCase() === 'blocked';
            const totalOrders = Number(c.total_orders || 0);
            const delivered = Number(c.delivered_orders || 0);
            const cancelled = Number(c.cancelled_orders || 0);
            const isSuspicious = cancelled > 2 && cancelled >= delivered;

            return (
              <div
                key={c.id || c.phone}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 text-base">{c.name || 'Anonymous User'}</h4>
                      {isBlocked ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded uppercase">
                          BANNED
                        </span>
                      ) : isSuspicious ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Suspicious
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                          Regular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">{c.phone}</p>
                  </div>

                  <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    ৳ {Number(c.total_spent || 0).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-center text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] font-bold">TOTAL</span>
                    <span className="font-black text-gray-800">{totalOrders}</span>
                  </div>
                  <div>
                    <span className="text-emerald-600 block text-[10px] font-bold">DELIVERED</span>
                    <span className="font-black text-emerald-700">{delivered}</span>
                  </div>
                  <div>
                    <span className="text-red-500 block text-[10px] font-bold">CANCELLED</span>
                    <span className="font-black text-red-600">{cancelled}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${c.phone}`}
                      className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs"
                      title="Call Customer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/88${c.phone?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs"
                      title="WhatsApp Customer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <button
                    onClick={() => toggleBlock(c)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isBlocked
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bgy-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {isBlocked ? 'Unblock Customer' : 'Block / Ban User'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}