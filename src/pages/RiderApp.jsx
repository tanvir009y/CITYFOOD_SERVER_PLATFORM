import React, { useState, useEffect, createContext, useContext } from 'react';
import API from '../api/axios';
import io from 'socket.io-client';
import {
  Bike,
  Package,
  ClipboardList,
  History,
  User,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogOut,
  Search,
  Calendar,
  Check,
  RefreshCw,
  Edit3,
  X,
  Power
} from 'lucide-react';

const RiderContext = createContext();

const requestNotificationPermission = () => {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
};

function RiderProvider({ children }) {
  const [rider, setRider] = useState(() => {
    try {
      const saved = localStorage.getItem('cf_rider');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const loginRider = (riderData, token) => {
    localStorage.setItem('cf_rider_token', token);
    localStorage.setItem('cf_rider', JSON.stringify(riderData));
    setRider(riderData);
  };

  const logoutRider = () => {
    localStorage.removeItem('cf_rider_token');
    localStorage.removeItem('cf_rider');
    setRider(null);
  };

  useEffect(() => {
    if (!rider?.id) return;
    const checkRiderExists = async () => {
      try {
        const res = await API.get('/riders');
        const ridersList = Array.isArray(res.data) ? res.data : [];
        const exists = ridersList.some((r) => Number(r.id) === Number(rider.id));
        if (!exists) {
          logoutRider();
        }
      } catch (err) {
        console.error('Rider status check error:', err);
      }
    };
    checkRiderExists();
    const interval = setInterval(checkRiderExists, 5000);
    return () => clearInterval(interval);
  }, [rider?.id]);

  return (
    <RiderContext.Provider value={{ rider, setRider, loginRider, logoutRider }}>
      {children}
    </RiderContext.Provider>
  );
}

const useRider = () => useContext(RiderContext);

function RiderAuth({ onLoginSuccess, showToast }) {
  const { loginRider } = useRider();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/rider/login', {
        phone: phone.trim(),
        password: password.trim()
      });
      if (res.data.success) {
        loginRider(res.data.rider, res.data.token);
        requestNotificationPermission();
        showToast('Login Successful!', 'Welcome to Rider Portal');
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed! Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-5">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
            🚴‍♂️
          </div>
          <h2 className="text-2xl font-black text-gray-900">Rider Portal</h2>
          <p className="text-xs text-gray-500 font-semibold">Login with number & password set by admin</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5 text-xs font-bold">
          <div>
            <label className="text-gray-600 uppercase">Phone Number</label>
            <input
              type="text"
              required
              placeholder="017xxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl mt-1 outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
            />
          </div>
          <div>
            <label className="text-gray-600 uppercase">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl mt-1 outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login Rider'}
          </button>
        </form>
      </div>
    </div>
  );
}

function RiderProfileSetup({ onSetupComplete, showToast }) {
  const { rider, setRider } = useRider();
  const [areas, setAreas] = useState([]);
  const [name, setName] = useState(rider?.name || '');
  const [phone, setPhone] = useState(rider?.phone || '');
  const [vehicle, setVehicle] = useState(rider?.vehicle_type || 'Bike');
  const [selectedAreas, setSelectedAreas] = useState(rider?.areas || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/delivery-areas').then((res) => {
      setAreas(Array.isArray(res.data) ? res.data : []);
    });
  }, []);

  const handleAreaToggle = (areaName) => {
    setSelectedAreas((prev) =>
      prev.includes(areaName) ? prev.filter((a) => a !== areaName) : [...prev, areaName]
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (selectedAreas.length === 0) {
      showToast('Warning', 'Please select at least one delivery area!');
      return;
    }
    setLoading(true);
    try {
      const res = await API.put(`/rider/profile/${rider.id}`, {
        name,
        phone,
        vehicle_type: vehicle,
        areas: selectedAreas
      });
      if (res.data.success) {
        setRider(res.data.rider);
        localStorage.setItem('cf_rider', JSON.stringify(res.data.rider));
        showToast('Success', 'Profile saved successfully!');
        if (onSetupComplete) onSetupComplete();
      }
    } catch (err) {
      showToast('Error', 'Profile update failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-gray-900">One-Time Profile Setup</h2>
          <p className="text-xs text-gray-500 font-semibold">Select your working areas & vehicle details</p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3 text-xs font-bold">
          <div>
            <label className="text-gray-600 uppercase">Rider Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl mt-1 font-semibold"
            />
          </div>

          <div>
            <label className="text-gray-600 uppercase">Phone Number</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl mt-1 font-semibold"
            />
          </div>

          <div>
            <label className="text-gray-600 uppercase">Vehicle Type</label>
            <select
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl mt-1 font-semibold bg-white"
            >
              <option value="Bike">Motorcycle / Bike</option>
              <option value="Cycle">Bicycle / Cycle</option>
              <option value="Scooter">Scooter</option>
            </select>
          </div>

          <div>
            <label className="text-gray-600 uppercase block mb-1">Select Delivery Areas (Multi-Select)</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-3 rounded-2xl bg-gray-50">
              {areas.map((a) => (
                <label key={a.id} className="flex items-center gap-2 cursor-pointer p-1.5 bg-white rounded-xl border">
                  <input
                    type="checkbox"
                    checked={selectedAreas.includes(a.name)}
                    onChange={() => handleAreaToggle(a.name)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-800 font-bold">{a.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-md cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

function RiderOrders({ showToast }) {
  const { rider } = useRider();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (String(rider.status).toLowerCase() === 'offline') {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await API.get(`/rider/orders?rider_id=${rider.id}`);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);

    const socket = io('http://localhost:5000');
    socket.on('new_order', () => {
      fetchOrders();
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [rider.status]);

  const handleAcceptOrder = async (orderId) => {
    try {
      const res = await API.patch(`/rider/orders/${orderId}/accept`, { rider_id: rider.id });
      if (res.data.success) {
        showToast('Order Accepted!', 'Moved to your Task list.');
        fetchOrders();
      }
    } catch (err) {
      showToast('Error', err.response?.data?.error || 'Failed to accept order');
    }
  };

  const isOffline = String(rider.status).toLowerCase() === 'offline';

  const filteredOrders = orders.filter(
    (o) => !o.rider_id && ['pending', 'confirmed', 'cooking', 'accepted', 'ready'].includes(String(o.status).toLowerCase()) && (String(o.id).includes(search) || o.customer_phone?.includes(search) || o.customer_name?.toLowerCase().includes(search.toLowerCase()))
  );

  const cardColors = [
    'border-l-8 border-l-indigo-600 bg-gradient-to-br from-white to-indigo-50/20',
    'border-l-8 border-l-emerald-600 bg-gradient-to-br from-white to-emerald-50/20',
    'border-l-8 border-l-amber-600 bg-gradient-to-br from-white to-amber-50/20',
    'border-l-8 border-l-rose-600 bg-gradient-to-br from-white to-rose-50/20',
    'border-l-8 border-l-purple-600 bg-gradient-to-br from-white to-purple-50/20'
  ];

  return (
    <div className="pb-28 pt-4 px-4 max-w-xl mx-auto space-y-4 font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-gray-900">Available Orders ({filteredOrders.length})</h2>
        <button
          onClick={fetchOrders}
          className="p-2 border rounded-xl hover:bg-gray-100 bg-white shadow-xs cursor-pointer active:scale-95 transition-transform"
          title="Refresh Orders"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isOffline ? (
        <div className="bg-amber-50 border border-amber-200 p-8 text-center rounded-3xl space-y-2">
          <p className="text-base font-black text-amber-800">You are currently Offline</p>
          <p className="text-xs text-amber-600">Turn on your online status from top toggle to view and accept available orders.</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search order by number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-xs font-semibold outline-none shadow-sm"
            />
          </div>

          {loading && orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 font-bold">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border text-xs text-gray-400 font-bold">
              No available orders right now.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, idx) => {
                let parsedItems = [];
                try { parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch { parsedItems = []; }

                const payMethod = String(order.payment_method || 'COD').toUpperCase();
                const colorClass = cardColors[idx % cardColors.length];

                return (
                  <div key={order.id} className={`rounded-3xl p-4 border shadow-md space-y-3 ${colorClass}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-black text-gray-900">ORD-#{order.id}</span>
                        <span className="text-[11px] font-bold text-emerald-700 block">Restaurant: {order.restaurant_name}</span>
                      </div>
                      <span className={`text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-xs ${
                        payMethod === 'COD' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-purple-100 text-purple-900 border border-purple-300'
                      }`}>
                        {payMethod}
                      </span>
                    </div>

                    {order.note && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 space-y-0.5 shadow-xs">
                        <span className="uppercase text-[10px] tracking-wider block">⚠️ Customer Note:</span>
                        <p className="font-black text-red-700 text-sm">{order.note}</p>
                      </div>
                    )}

                    <div className="space-y-1.5 text-xs bg-white/80 p-3 rounded-2xl border backdrop-blur-xs">
                      <p className="font-bold text-gray-900">Customer: {order.customer_name} ({order.customer_phone})</p>
                      <p className="text-gray-600 font-medium">Full Address: {order.address}</p>
                      <p className="text-emerald-800 font-bold text-[11px]">Area / Location: {order.area_name || 'General'}</p>
                      <div className="flex gap-2 pt-1.5">
                        <a href={`tel:${order.customer_phone}`} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-xs">
                          <Phone className="w-3.5 h-3.5" /> Call
                        </a>
                        <a href={`https://wa.me/88${order.customer_phone}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1 shadow-xs">
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      </div>
                    </div>

                    {parsedItems.length > 0 && (
                      <div className="bg-white/90 p-3 rounded-2xl text-xs space-y-1.5 border shadow-xs">
                        <span className="text-[10px] font-black uppercase text-gray-400">Ordered Items & Status:</span>
                        {parsedItems.map((it, i) => (
                          <div key={i} className="flex justify-between items-center text-gray-800 font-semibold text-xs border-b pb-1">
                            <div>
                              <span>{it.qty}x {it.name} ({it.restaurant_name})</span>
                              <span className={`block text-[9px] font-bold uppercase ${it.status === 'ready' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                Status: {it.status || 'pending'}
                              </span>
                            </div>
                            <span className="font-black">৳{it.price * it.qty}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs pt-2 border-t">
                      <span className="font-black text-emerald-700 text-sm">Order Full Amount: ৳{order.total_amount}</span>
                      <button
                        onClick={() => handleAcceptOrder(order.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
                      >
                        Accept Order
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RiderTask({ showToast }) {
  const { rider } = useRider();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await API.get(`/rider/orders?rider_id=${rider.id}`);
      setTasks(res.data.filter((o) => {
        const isMyOrder = Number(o.rider_id) === Number(rider.id);
        const st = String(o.status || '').toLowerCase().trim();
        return isMyOrder && st !== 'delivered' && st !== 'cancelled' && st !== 'pending';
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus, totalAmount, payMethod) => {
    try {
      await API.patch(`/rider/orders/${orderId}/action`, {
        status: newStatus,
        rider_id: rider.id,
        total_amount: totalAmount,
        payment_method: payMethod
      });
      showToast('Status Updated', `Order marked as ${newStatus}!`);
      fetchTasks();
    } catch (err) {
      showToast('Error', 'Action failed');
    }
  };

  const cardColors = [
    'border-l-8 border-l-blue-600 bg-gradient-to-br from-white to-blue-50/20',
    'border-l-8 border-l-teal-600 bg-gradient-to-br from-white to-teal-50/20',
    'border-l-8 border-l-amber-600 bg-gradient-to-br from-white to-amber-50/20',
    'border-l-8 border-l-indigo-600 bg-gradient-to-br from-white to-indigo-50/20'
  ];

  return (
    <div className="pb-28 pt-4 px-4 max-w-xl mx-auto space-y-4 font-sans">
      <h2 className="text-lg font-black text-gray-900">My Active Tasks ({tasks.length})</h2>

      {loading && tasks.length === 0 ? (
        <div className="p-12 text-center text-xs text-gray-400 font-bold">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border text-xs text-gray-400 font-bold">
          No active tasks right now.
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task, idx) => {
            let parsedItems = [];
            try {
              parsedItems = typeof task.items === 'string' ? JSON.parse(task.items) : (task.items || []);
            } catch { parsedItems = []; }

            const payMethod = String(task.payment_method || 'COD').toUpperCase();
            const colorClass = cardColors[idx % cardColors.length];

            return (
              <div key={task.id} className={`rounded-3xl p-4 border shadow-md space-y-3 ${colorClass}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-black text-gray-900">ORD-#{task.id}</span>
                    <span className="text-[11px] font-bold text-emerald-700 block">Restaurant: {task.restaurant_name}</span>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                    Status: {task.status}
                  </span>
                </div>

                {task.note && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 space-y-0.5 shadow-xs">
                    <span className="uppercase text-[10px] tracking-wider block">⚠️ Customer Note:</span>
                    <p className="font-black text-red-700 text-sm">{task.note}</p>
                  </div>
                )}

                <div className="space-y-2 text-xs bg-white/80 p-3.5 rounded-2xl border backdrop-blur-xs">
                  <p className="font-bold text-gray-900">Customer: {task.customer_name} ({task.customer_phone})</p>
                  <p className="text-gray-600 font-medium">Full Address: {task.address}</p>
                  <p className="text-emerald-800 font-bold text-[11px]">Area / Location: {task.area_name || 'General'}</p>

                  <div className="flex items-center justify-between pt-1 pb-1 border-t border-b border-gray-200">
                    <span className="text-gray-500 font-bold uppercase text-[10px]">Payment Type:</span>
                    <span className={`text-xs font-black px-3 py-1 rounded-xl uppercase tracking-wider ${
                      payMethod === 'COD' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-purple-100 text-purple-900 border border-purple-300'
                    }`}>
                      {payMethod}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <a href={`tel:${task.customer_phone}`} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-xs">
                      <Phone className="w-3.5 h-3.5" /> Call Customer
                    </a>
                    <a href={`https://wa.me/88${task.customer_phone}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1 shadow-xs">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  </div>
                </div>

                {parsedItems.length > 0 && (
                  <div className="bg-white/90 p-3 rounded-2xl text-xs space-y-1.5 border shadow-xs">
                    <span className="text-[10px] font-black uppercase text-gray-400">Ordered Items & Status:</span>
                    {parsedItems.map((it, i) => (
                      <div key={i} className="flex justify-between items-center text-gray-800 font-semibold text-xs border-b pb-1">
                        <div>
                          <span>{it.qty}x {it.name} ({it.restaurant_name})</span>
                          <span className={`block text-[9px] font-bold uppercase ${it.status === 'ready' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            Status: {it.status || 'pending'}
                          </span>
                        </div>
                        <span className="font-black">৳{it.price * it.qty}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center text-xs pt-1 font-black">
                  <span>Total Amount:</span>
                  <span className="text-emerald-700 text-sm">৳{task.total_amount}</span>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  {task.status === 'accepted' && (
                    <button
                      onClick={() => handleUpdateStatus(task.id, 'cooking', task.total_amount, task.payment_method)}
                      className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm"
                    >
                      Set Cooking
                    </button>
                  )}
                  {task.status !== 'picked' && (
                    <button
                      onClick={() => handleUpdateStatus(task.id, 'picked', task.total_amount, task.payment_method)}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm"
                    >
                      Set Picked Up
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateStatus(task.id, 'delivered', task.total_amount, task.payment_method)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Mark Delivered
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

function RiderHistory() {
  const { rider } = useRider();
  const [history, setHistory] = useState([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');

  useEffect(() => {
    API.get(`/rider/history/${rider.id}`).then((res) => {
      setHistory(Array.isArray(res.data) ? res.data : []);
    });
  }, []);

  const filteredHistory = history.filter((h) => {
    if (dateFilter === 'all') return true;
    const hDate = new Date(h.created_at);
    const now = new Date();
    if (dateFilter === 'today') return hDate.toDateString() === now.toDateString();
    if (dateFilter === 'month') return hDate.getMonth() === now.getMonth() && hDate.getFullYear() === now.getFullYear();
    if (dateFilter === 'custom' && customDate) return hDate.toDateString() === new Date(customDate).toDateString();
    return true;
  });

  const totalDeliveredOrdersCount = filteredHistory.filter((h) => h.status === 'delivered').length;

  const totalCollectedCOD = filteredHistory
    .filter((h) => String(h.payment_method).toUpperCase() === 'COD' && h.status === 'delivered')
    .reduce((sum, h) => sum + Number(h.total_amount || 0), 0);

  const totalOnlinePaid = filteredHistory
    .filter((h) => String(h.payment_method).toUpperCase() !== 'COD' && h.status === 'delivered')
    .reduce((sum, h) => sum + Number(h.total_amount || 0), 0);

  const totalEarningsAll = totalCollectedCOD + totalOnlinePaid;

  const cardColors = [
    'border-l-8 border-l-emerald-600 bg-gradient-to-br from-white to-emerald-50/20',
    'border-l-8 border-l-slate-600 bg-gradient-to-br from-white to-slate-50/20',
    'border-l-8 border-l-teal-600 bg-gradient-to-br from-white to-teal-50/20'
  ];

  return (
    <div className="pb-28 pt-4 px-4 max-w-xl mx-auto space-y-4 font-sans">
      <h2 className="text-lg font-black text-gray-900">Delivery History & Earnings</h2>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3 rounded-2xl border shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase block">COD Collected</span>
          <p className="text-sm font-black text-emerald-600 mt-0.5">৳{totalCollectedCOD}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase block">Online Paid</span>
          <p className="text-sm font-black text-blue-600 mt-0.5">৳{totalOnlinePaid}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Delivered</span>
          <p className="text-sm font-black text-gray-900 mt-0.5">{totalDeliveredOrdersCount} orders (৳{totalEarningsAll})</p>
        </div>
      </div>

      <div className="flex gap-2 text-xs font-bold">
        {['all', 'today', 'month', 'custom'].map((f) => (
          <button
            key={f}
            onClick={() => setDateFilter(f)}
            className={`px-3 py-1.5 rounded-xl border uppercase cursor-pointer ${dateFilter === f ? 'bg-slate-900 text-white' : 'bg-white text-gray-700'}`}
          >
            {f}
          </button>
        ))}
        {dateFilter === 'custom' && (
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="px-2 border rounded-xl text-xs font-bold"
          />
        )}
      </div>

      <div className="space-y-3">
        {filteredHistory.map((item, idx) => {
          let parsedItems = [];
          try { parsedItems = typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []); } catch { parsedItems = []; }
          const colorClass = cardColors[idx % cardColors.length];

          return (
            <div key={item.id} className={`rounded-3xl p-4 border shadow-md space-y-2.5 text-xs ${colorClass}`}>
              <div className="flex justify-between font-bold">
                <span className="text-sm font-black text-gray-900">ORD-#{item.id}</span>
                <span className={item.status === 'delivered' ? 'text-emerald-600 uppercase font-black' : 'text-red-600 uppercase font-black'}>{item.status}</span>
              </div>
              <p className="text-gray-500 font-semibold">Restaurant: {item.restaurant_name}</p>
              <p className="text-gray-700 font-bold">Customer: {item.customer_name} ({item.customer_phone})</p>

              {item.note && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 space-y-0.5 shadow-xs">
                  <span className="uppercase text-[10px] tracking-wider block">⚠️ Customer Note:</span>
                  <p className="font-black text-red-700">{item.note}</p>
                </div>
              )}

              {parsedItems.length > 0 && (
                <div className="bg-white/90 p-2.5 rounded-xl space-y-1 border shadow-xs">
                  <span className="text-[10px] font-black uppercase text-gray-400 block">Ordered Items:</span>
                  {parsedItems.map((it, i) => (
                    <div key={i} className="flex justify-between text-[11px] text-gray-700 font-semibold">
                      <span>{it.qty}x {it.name} ({it.restaurant_name || ''})</span>
                      <span className="font-black">৳{it.price * it.qty}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-2 border-t font-black">
                <span>Payment: {item.payment_method}</span>
                <span className="text-emerald-700 text-sm">Total: ৳{item.total_amount}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RiderProfile({ onLogout, showToast }) {
  const { rider, setRider } = useRider();
  const [isEditing, setIsEditing] = useState(false);
  const [areas, setAreas] = useState([]);
  const [name, setName] = useState(rider?.name || '');
  const [phone, setPhone] = useState(rider?.phone || '');
  const [vehicle, setVehicle] = useState(rider?.vehicle_type || 'Bike');
  const [selectedAreas, setSelectedAreas] = useState(rider?.areas || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/delivery-areas').then((res) => {
      setAreas(Array.isArray(res.data) ? res.data : []);
    });
  }, []);

  const handleAreaToggle = (areaName) => {
    setSelectedAreas((prev) =>
      prev.includes(areaName) ? prev.filter((a) => a !== areaName) : [...prev, areaName]
    );
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (selectedAreas.length === 0) {
      showToast('Warning', 'Please select at least one delivery area!');
      return;
    }
    setLoading(true);
    try {
      const res = await API.put(`/rider/profile/${rider.id}`, {
        name,
        phone,
        vehicle_type: vehicle,
        areas: selectedAreas
      });
      if (res.data.success) {
        setRider(res.data.rider);
        localStorage.setItem('cf_rider', JSON.stringify(res.data.rider));
        setIsEditing(false);
        showToast('Success', 'Profile updated successfully!');
      }
    } catch (err) {
      showToast('Error', 'Profile update failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-xl mx-auto space-y-4 font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-gray-900">Rider Profile</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
          <button onClick={onLogout} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdateProfile} className="bg-white rounded-3xl p-5 border shadow-sm space-y-3 text-xs font-bold">
          <div>
            <label className="text-gray-600 uppercase">Rider Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl mt-1 font-semibold"
            />
          </div>
          <div>
            <label className="text-gray-600 uppercase">Phone Number</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl mt-1 font-semibold"
            />
          </div>
          <div>
            <label className="text-gray-600 uppercase">Vehicle Type</label>
            <select
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl mt-1 font-semibold bg-white"
            >
              <option value="Bike">Motorcycle / Bike</option>
              <option value="Cycle">Bicycle / Cycle</option>
              <option value="Scooter">Scooter</option>
            </select>
          </div>
          <div>
            <label className="text-gray-600 uppercase block mb-1">Working Areas (Multi-Select)</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-3 rounded-2xl bg-gray-50">
              {areas.map((a) => (
                <label key={a.id} className="flex items-center gap-2 cursor-pointer p-1.5 bg-white rounded-xl border">
                  <input
                    type="checkbox"
                    checked={selectedAreas.includes(a.name)}
                    onChange={() => handleAreaToggle(a.name)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-800 font-bold">{a.name}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-md mt-2 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
          </button>
        </form>
      ) : (
        <div className="bg-white rounded-3xl p-5 border shadow-sm space-y-3 text-xs font-bold">
          <p className="text-sm font-black text-gray-900">{rider?.name}</p>
          <p className="text-gray-500">Phone: {rider?.phone}</p>
          <p className="text-gray-500">Vehicle: {rider?.vehicle_type}</p>
          <div>
            <span className="text-gray-400 uppercase text-[10px] block mb-1">Working Areas:</span>
            <div className="flex flex-wrap gap-1">
              {(rider?.areas || []).map((a, i) => (
                <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border text-[10px] font-bold">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RiderAppContent() {
  const { rider, setRider, logoutRider } = useRider();
  const [tab, setTab] = useState('orders');
  const [toast, setToast] = useState({ open: false, title: '', message: '' });

  const showToast = (title, message) => {
    setToast({ open: true, title, message });
    setTimeout(() => {
      setToast({ open: false, title: '', message: '' });
    }, 3000);
  };

  const toggleOnlineStatus = async () => {
    const currentStatus = String(rider.status || 'active').toLowerCase();
    const newStatus = currentStatus === 'offline' ? 'active' : 'offline';
    try {
      const updatedRider = { ...rider, status: newStatus };
      setRider(updatedRider);
      localStorage.setItem('cf_rider', JSON.stringify(updatedRider));
      showToast('Status Updated', `You are now ${newStatus === 'active' ? 'Online' : 'Offline'}`);
    } catch (err) {
      showToast('Error', 'Failed to update status');
    }
  };

  useEffect(() => {
    if (!rider) return;

    requestNotificationPermission();

    const socket = io('http://localhost:5000');

    socket.on('new_order', (orderData) => {
      const currentStatus = String(rider.status || 'active').toLowerCase();
      if (currentStatus === 'offline') return;

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 নতুন ডেলিভারি অর্ডার এসেছে!', {
          body: `রেস্টুরেন্ট: ${orderData.restaurant_name || 'CityFood'}\nঅ্যামাউন্ট: ৳${orderData.total_amount}`,
          icon: '/favicon.ico',
          tag: 'rider-new-order'
        });
      }

      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch((e) => console.log('Audio autoplay restricted:', e));
      } catch (err) {
        console.error(err);
      }

      showToast('New Order!', `ORD-#${orderData.id} is available for delivery.`);
    });

    return () => {
      socket.disconnect();
    };
  }, [rider]);

  if (!rider) return <RiderAuth onLoginSuccess={() => setTab('orders')} showToast={showToast} />;
  if (!rider.profile_completed) return <RiderProfileSetup onSetupComplete={() => setTab('orders')} showToast={showToast} />;

  const isOnline = String(rider.status || 'active').toLowerCase() !== 'offline';

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans relative pb-20">
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">🚴‍♂️</div>
          <div>
            <h1 className="text-xs font-black text-gray-900">{rider.name}</h1>
            <span className={`text-[10px] font-bold ${isOnline ? 'text-emerald-600' : 'text-red-500'}`}>
              ● {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <button
          onClick={toggleOnlineStatus}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            isOnline ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-600 text-white shadow-sm'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {toast.open && (
        <div className="fixed top-16 left-4 right-4 max-w-sm mx-auto z-[9999] transition-all">
          <div className="bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500/40 backdrop-blur-md">
            <div>
              <span className="font-bold text-xs text-emerald-400 block">{toast.title}</span>
              <span className="text-[11px] text-gray-200">{toast.message}</span>
            </div>
            <button onClick={() => setToast({ open: false, title: '', message: '' })} className="p-1 text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {tab === 'orders' && <RiderOrders showToast={showToast} />}
      {tab === 'task' && <RiderTask showToast={showToast} />}
      {tab === 'history' && <RiderHistory />}
      {tab === 'profile' && <RiderProfile onLogout={logoutRider} showToast={showToast} />}

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t py-2.5 px-6 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center text-xs font-bold">
          {[
            { id: 'orders', label: 'Orders', icon: Package },
            { id: 'task', label: 'Task', icon: ClipboardList },
            { id: 'history', label: 'History', icon: History },
            { id: 'profile', label: 'Profile', icon: User }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex flex-col items-center gap-1 cursor-pointer ${tab === item.id ? 'text-emerald-600' : 'text-gray-400'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function RiderApp() {
  return (
    <RiderProvider>
      <RiderAppContent />
    </RiderProvider>
  );
}