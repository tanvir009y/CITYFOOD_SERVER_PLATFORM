import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { CreditCard, Calendar, RefreshCw, Search } from 'lucide-react';

export default function OnlineTrx() {
  const [trxList, setTrxList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTrxData = async (filter = dateFilter, custom = customDate) => {
    try {
      setLoading(true);
      const res = await API.get(`/online-trx?dateFilter=${filter}&customDate=${custom}`);
      setTrxList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrxData('all', '');
  }, []);

  const handleFilterChange = (filterType) => {
    setDateFilter(filterType);
    fetchTrxData(filterType, customDate);
  };

  const handleCustomDate = (val) => {
    setCustomDate(val);
    fetchTrxData('custom', val);
  };

  const filteredTrx = trxList.filter(t => {
    const trxId = String(t.transaction_id || '').toLowerCase();
    const phone = String(t.customer_phone || '');
    const name = String(t.customer_name || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return trxId.includes(q) || phone.includes(q) || name.includes(q);
  });

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-600" /> Online Transactions (Bkash & Nagad)
          </h1>
          <p className="text-sm text-gray-500">কাস্টমারদের সাবমিট করা বিকাশ ও নগদ ট্রানজেকশন আইডি এবং ডেট-ওয়াইজ মনিটরিং</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search Trx ID, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
            />
          </div>
          <button
            onClick={() => fetchTrxData(dateFilter, customDate)}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:text-emerald-600 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
        <span className="text-gray-400 flex items-center gap-1 font-bold mr-1">
          <Calendar className="w-3.5 h-3.5" /> Date Filter:
        </span>
        {[
          { id: 'all', label: 'All Time' },
          { id: 'today', label: 'Today' },
          { id: 'yesterday', label: 'Yesterday' },
          { id: 'last7days', label: 'Last 7 Days' },
          { id: 'custom', label: 'Custom Date' }
        ].map((df) => (
          <button
            key={df.id}
            onClick={() => handleFilterChange(df.id)}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              dateFilter === df.id
                ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {df.label}
          </button>
        ))}

        {dateFilter === 'custom' && (
          <input
            type="date"
            value={customDate}
            onChange={(e) => handleCustomDate(e.target.value)}
            className="px-2.5 py-1.5 border border-emerald-500 rounded-xl text-xs bg-white text-emerald-950 font-bold focus:outline-none"
          />
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-bold text-xs uppercase border-b">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Date & Time</th>
              <th className="p-4">Customer Info</th>
              <th className="p-4">Payment Method</th>
              <th className="p-4">Transaction ID (Trx ID)</th>
              <th className="p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-12 text-center text-gray-400 font-bold">ডাটা লোড হচ্ছে...</td>
              </tr>
            ) : filteredTrx.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-12 text-center text-gray-400 font-semibold">কোনো অনলাইন ট্রানজেকশন পাওয়া যায়নি</td>
              </tr>
            ) : (
              filteredTrx.map((item) => (
                <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="p-4 font-bold text-gray-900">#ORD-{item.id}</td>
                  <td className="p-4 text-xs text-gray-500 font-semibold">
                    {new Date(item.created_at).toLocaleDateString()} <br />
                    <span className="text-[11px] text-emerald-700 font-bold">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{item.customer_name}</div>
                    <span className="text-xs text-gray-400">{item.customer_phone}</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-pink-50 text-pink-700 rounded-lg text-xs font-black uppercase">
                      {item.payment_method}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-black text-emerald-600 text-base">
                    {item.transaction_id}
                  </td>
                  <td className="p-4 text-right font-black text-gray-900 text-base">
                    ৳ {Number(item.total_amount || 0).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}