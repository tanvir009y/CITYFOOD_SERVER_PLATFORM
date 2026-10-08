import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Bike, 
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function Dashboard() {
  const { newOrderAlert } = useSocket();
  const [filter, setFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    activeOrders: 0,
    totalOrders: 0,
    commission: 0,
    onlineRiders: '0 / 0',
    payments: { cod: 0, bkash: 0, nagad: 0 },
    recentActivity: []
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/dashboard/stats?filter=${filter}`);
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filter]);

  useEffect(() => {
    if (newOrderAlert) {
      fetchStats();
    }
  }, [newOrderAlert]);

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Overview & Analytics</h1>
          <p className="text-sm text-gray-500">রিয়েল-টাইম প্ল্যাটফর্ম সেলস, অর্ডার ও রাইডার অ্যাক্টিভিটি</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 p-1.5 rounded-2xl shadow-sm">
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'today'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter('weekly')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'weekly'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setFilter('monthly')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
          </div>

          <button
            onClick={fetchStats}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:text-emerald-600 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Sales</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">৳ {Number(stats.totalSales || 0).toLocaleString()}</h3>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" /> Live Synced
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Orders</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.activeOrders || 0}</h3>
            <span className="text-[11px] font-bold text-gray-400 mt-1 block">In Kitchen / On Delivery</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Platform Cut (10%)</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">৳ {Number(stats.commission || 0).toLocaleString()}</h3>
            <span className="text-[11px] font-bold text-indigo-500 mt-1 block">Net Profit Share</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Riders</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.onlineRiders || '0 / 0'}</h3>
            <span className="text-[11px] font-bold text-emerald-600 mt-1 block">Online for Delivery</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Bike className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900">Payment Methods Breakdown</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl">
              <span className="text-sm font-semibold text-gray-700">Cash On Delivery (COD)</span>
              <span className="text-sm font-bold text-gray-900">৳ {stats.payments?.cod || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3.5 bg-pink-50/50 rounded-xl border border-pink-100">
              <span className="text-sm font-semibold text-pink-700">bKash Payment</span>
              <span className="text-sm font-bold text-pink-800">৳ {stats.payments?.bkash || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3.5 bg-orange-50/50 rounded-xl border border-orange-100">
              <span className="text-sm font-semibold text-orange-700">Nagad Payment</span>
              <span className="text-sm font-bold text-orange-800">৳ {stats.payments?.nagad || 0}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900">Recent Live Activity</h2>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full animate-pulse">
              Live Stream
            </span>
          </div>

          <div className="overflow-x-auto">
            {(!stats.recentActivity || stats.recentActivity.length === 0) ? (
              <p className="text-xs text-gray-400 py-6 text-center">এখনো কোনো সাম্প্রতিক অর্ডার নেই</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-gray-400 font-semibold uppercase">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {stats.recentActivity.map((ord) => (
                    <tr key={ord.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-bold text-emerald-800">ORD-{ord.id}</td>
                      <td className="py-3 text-gray-900">{ord.customer_name}</td>
                      <td className="py-3 text-gray-400 text-xs">{ord.time}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 uppercase">
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-black text-gray-900">৳ {ord.total_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
