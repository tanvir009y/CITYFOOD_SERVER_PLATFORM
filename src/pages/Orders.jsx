import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import {
  Phone,
  MessageSquare,
  Search,
  Calendar,
  Bike,
  RefreshCw,
  Filter,
  Store,
  Receipt,
  MapPin
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function Orders() {
  const { newOrderAlert } = useSocket();
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');

  const fetchOrdersAndRiders = async () => {
    try {
      setLoading(true);
      const [ordRes, ridRes] = await Promise.all([
        API.get('/orders'),
        API.get('/riders')
      ]);
      setOrders(Array.isArray(ordRes.data) ? ordRes.data : []);
      setRiders(Array.isArray(ridRes.data) ? ridRes.data : []);
    } catch (err) {
      console.error('Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndRiders();
  }, []);

  useEffect(() => {
    if (newOrderAlert) {
      setOrders((prev) => [newOrderAlert, ...prev]);
    }
  }, [newOrderAlert]);

  const handleStatusChange = async (orderId, newStatus) => {
    const cleanId = String(orderId).replace('ORD-', '');
    try {
      await API.patch(`/orders/${cleanId}/status`, { status: newStatus });
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (err) {
      alert('Status update failed');
    }
  };

  const handleAssignRider = async (orderId, riderId) => {
    const cleanId = String(orderId).replace('ORD-', '');
    try {
      await API.patch(`/orders/${cleanId}/assign-rider`, { rider_id: riderId });
      const assignedRider = riders.find((r) => r.id === Number(riderId));
      setOrders(
        orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                rider_id: riderId,
                rider_name: assignedRider?.name,
                rider_phone: assignedRider?.phone,
                status: 'accepted'
              }
            : o
        )
      );
    } catch (err) {
      alert('Rider assignment failed');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const id = String(order.id || '');
    const phone = String(order.customer_phone || '');
    const name = String(order.customer_name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = id.includes(query) || phone.includes(query) || name.includes(query);

    const currentStatus = String(order.status || 'pending').toLowerCase();
    const matchesStatus = statusFilter === 'all' || currentStatus === statusFilter.toLowerCase();

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = order.created_at ? new Date(order.created_at) : new Date();
      const now = new Date();

      if (dateFilter === 'today') {
        matchesDate = orderDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        matchesDate = orderDate.toDateString() === yesterday.toDateString();
      } else if (dateFilter === 'last7days') {
        const last7 = new Date();
        last7.setDate(now.getDate() - 7);
        matchesDate = orderDate >= last7;
      } else if (dateFilter === 'custom' && customDate) {
        const selected = new Date(customDate);
        matchesDate = orderDate.toDateString() === selected.toDateString();
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const cardThemes = [
    { border: 'border-l-indigo-600', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { border: 'border-l-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { border: 'border-l-teal-600', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
    { border: 'border-l-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    { border: 'border-l-rose-600', badge: 'bg-rose-50 text-rose-700 border-rose-200' }
  ];

  return (
    <div className="p-8 space-y-6 bg-slate-100/70 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Live Orders & Kitchen Console</h1>
            <span className="flex items-center gap-1.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Customer items, multi-restaurant breakdown & payment verification overview</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search order ID, phone, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 w-64 shadow-sm"
            />
          </div>
          <button
            onClick={fetchOrdersAndRiders}
            className="p-2.5 bg-white border border-slate-200 rounded-2xl hover:text-emerald-600 transition-colors shadow-sm cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
          <span className="text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: '⏳ Pending' },
            { id: 'accepted', label: '✅ Accepted' },
            { id: 'cooking', label: '🍳 Cooking' },
            { id: 'picked', label: '🛵 On The Way' },
            { id: 'delivered', label: '🎉 Delivered' },
            { id: 'cancelled', label: '❌ Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 font-bold">Loading live orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-300 text-slate-400 font-bold">
          No orders found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order, orderIdx) => {
            let parsedItems = [];
            try {
              parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
            } catch { parsedItems = []; }

            const groupedByRest = {};
            parsedItems.forEach((it) => {
              const rName = it.restaurant_name || order.restaurant_name || 'Restaurant';
              if (!groupedByRest[rName]) groupedByRest[rName] = [];
              groupedByRest[rName].push(it);
            });

            const theme = cardThemes[orderIdx % cardThemes.length];
            const payMethod = String(order.payment_method || 'COD').toUpperCase();
            const payStatus = String(order.payment_status || 'PENDING').toUpperCase();

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl p-5 border-2 border-slate-200/90 shadow-sm space-y-4 hover:shadow-xl transition-all border-l-8 ${theme.border} relative flex flex-col justify-between`}
              >
                <div>
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-slate-900 text-white font-black text-xs rounded-xl inline-block shadow-sm">
                          {String(order.id).startsWith('ORD-') ? order.id : `ORD-${order.id}`}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase ${
                          payMethod === 'BKASH'
                            ? 'bg-pink-50 text-pink-700 border-pink-200'
                            : payMethod === 'NAGAD'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {payMethod} {payStatus.includes('PAID') || payStatus.includes('VERIFY') ? '• PAID' : '• COD'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                        {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider block ${
                        order.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : order.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs pt-2">
                    <h4 className="font-black text-slate-900 text-base">{order.customer_name}</h4>
                    <p className="text-slate-500 font-medium text-[11px] leading-relaxed flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{order.address || order.street_house}</span>
                    </p>
                    {order.area_name && (
                      <p className="text-emerald-700 font-bold text-[11px]">Area: {order.area_name}</p>
                    )}

                    {/* ADMIN ORDER NOTE IN RED COLOR */}
                    {order.note && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 space-y-0.5 mt-2 shadow-2xs">
                        <span className="uppercase text-[10px] tracking-wider block">⚠️ Customer Note:</span>
                        <p className="font-black text-red-700 text-sm">{order.note}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1.5">
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" /> {order.customer_phone}
                      </a>
                      <a
                        href={`https://wa.me/88${order.customer_phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </div>
                  </div>

                  <div className="bg-slate-50/90 p-3.5 rounded-2xl space-y-2.5 border border-slate-200/70 mt-3">
                    <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1 tracking-wider">
                      <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                      Multi-Restaurant Cart & Items:
                    </span>

                    {Object.keys(groupedByRest).length === 0 ? (
                      <div className="p-2.5 bg-white rounded-xl border text-xs font-bold text-slate-700">
                        <p className="font-black">{order.restaurant_name || 'General Order'}</p>
                        <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Total Bill: ৳{order.total_amount}</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {Object.entries(groupedByRest).map(([restName, itemsList]) => (
                          <div key={restName} className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                            <span className="font-black text-[11px] text-emerald-800 flex items-center gap-1 uppercase">
                              <Store className="w-3.5 h-3.5 text-emerald-600" /> {restName}
                            </span>
                            <div className="space-y-1.5 pl-1">
                              {itemsList.map((it, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs border-b pb-1">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-700 font-black text-[10px] flex items-center justify-center border border-emerald-200">
                                        {it.qty}x
                                      </span>
                                      <span className="font-bold text-slate-800 text-xs">{it.name}</span>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase ml-6 px-1.5 py-0.5 rounded ${it.status === 'ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                      {it.status || 'pending'}
                                    </span>
                                  </div>
                                  <span className="font-black text-slate-900 text-xs">
                                    ৳{Number(it.price) * Number(it.qty)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {order.transaction_id && (
                      <div className="pt-2 border-t border-slate-200 text-[11px] font-bold text-pink-700 flex items-center justify-between">
                        <span>TrxID ({payMethod}):</span>
                        <span className="font-mono bg-pink-100 text-pink-900 px-2.5 py-0.5 rounded-lg border border-pink-200 font-black">
                          {order.transaction_id}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-xs pt-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      Delivery Rider:
                    </span>
                    {order.rider_name ? (
                      <div className="flex items-center justify-between bg-emerald-50/70 p-2.5 rounded-2xl border border-emerald-200">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                            <Bike className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-black text-emerald-950 block text-xs">{order.rider_name}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{order.rider_phone}</span>
                          </div>
                        </div>
                        <a href={`tel:${order.rider_phone}`} className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : (
                      <select
                        onChange={(e) => handleAssignRider(order.id, e.target.value)}
                        defaultValue=""
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="" disabled>Assign Rider to Dispatch...</option>
                        {riders.map((r) => (
                          <option key={r.id} value={r.id}>{r.name} ({r.phone})</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80 space-y-2 mt-2">
                  <div className="flex justify-between items-center text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-bold">Delivery Fee: ৳{order.delivery_fee}</span>
                    <span className="text-base font-black text-emerald-600">Total: ৳{order.total_amount}</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Change Order Status:
                    </label>
                    <select
                      value={order.status || 'pending'}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="w-full px-3 py-2 border-2 border-emerald-400 rounded-xl text-xs font-black bg-white outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="accepted">✅ Accepted</option>
                      <option value="cooking">🍳 Cooking / Preparing</option>
                      <option value="picked">🛵 Picked Up / On The Way</option>
                      <option value="delivered">🎉 Delivered</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}