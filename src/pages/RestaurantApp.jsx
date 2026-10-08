import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import io from 'socket.io-client';
import {
  UtensilsCrossed,
  Package,
  History,
  Settings,
  Plus,
  Trash2,
  Phone,
  MessageCircle,
  RefreshCw,
  LogOut,
  CheckCircle,
  Clock,
  X,
  Upload,
  Bell
} from 'lucide-react';

export default function RestaurantApp() {
  const [restaurant, setRestaurant] = useState(() => {
    try {
      const saved = localStorage.getItem('cf_restaurant');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [tab, setTab] = useState('orders');
  const [toast, setToast] = useState({ open: false, title: '', message: '' });

  const showToast = (title, message) => {
    setToast({ open: true, title, message });
    setTimeout(() => setToast({ open: false, title: '', message: '' }), 3000);
  };

  const logoutRestaurant = () => {
    localStorage.removeItem('cf_restaurant_token');
    localStorage.removeItem('cf_restaurant');
    setRestaurant(null);
  };

  if (!restaurant) return <RestaurantLogin onLogin={(rest, token) => {
    localStorage.setItem('cf_restaurant_token', token);
    localStorage.setItem('cf_restaurant', JSON.stringify(rest));
    setRestaurant(rest);
    showToast('Login Success', 'Welcome to Restaurant Partner Portal');
  }} showToast={showToast} />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24 relative">
      {toast.open && (
        <div className="fixed top-4 left-4 right-4 max-w-sm mx-auto z-[9999]">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500/40">
            <div>
              <span className="font-bold text-xs text-emerald-400 block">{toast.title}</span>
              <span className="text-[11px] text-gray-200">{toast.message}</span>
            </div>
            <button onClick={() => setToast({ open: false, title: '', message: '' })} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <img src={restaurant.image_url || 'https://via.placeholder.com/150'} alt="Logo" className="w-10 h-10 rounded-xl object-cover border" />
          <div>
            <h1 className="text-sm font-black text-gray-900">{restaurant.name}</h1>
            <span className="text-[10px] text-emerald-600 font-bold uppercase">Restaurant Partner Portal</span>
          </div>
        </div>
        <button onClick={logoutRestaurant} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {tab === 'orders' && <RestaurantOrders restaurant={restaurant} showToast={showToast} />}
        {tab === 'history' && <RestaurantHistory restaurant={restaurant} />}
        {tab === 'products' && <RestaurantProducts restaurantId={restaurant.id} showToast={showToast} />}
        {tab === 'settings' && <RestaurantSettings restaurant={restaurant} setRestaurant={setRestaurant} showToast={showToast} />}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t py-2.5 px-6 z-50 shadow-lg">
        <div className="max-w-md mx-auto flex justify-between items-center text-xs font-bold">
          {[
            { id: 'orders', label: 'Live Orders', icon: Package },
            { id: 'history', label: 'History & Sales', icon: History },
            { id: 'products', label: 'Products', icon: UtensilsCrossed },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${tab === item.id ? 'text-emerald-600 font-black' : 'text-gray-400 hover:text-gray-600'}`}
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

function RestaurantLogin({ onLogin, showToast }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestId, setSelectedRestId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/restaurants').then((res) => {
      setRestaurants(Array.isArray(res.data) ? res.data : []);
    });
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRestId) {
      showToast('Error', 'Please select a restaurant!');
      return;
    }
    setLoading(true);
    try {
      const res = await API.post('/restaurant/login', {
        restaurant_id: selectedRestId,
        password: password.trim()
      });
      if (res.data.success) {
        onLogin(res.data.restaurant, res.data.token);
      }
    } catch (err) {
      showToast('Login Failed', err.response?.data?.error || 'Incorrect password!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-5">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
            🍔
          </div>
          <h2 className="text-2xl font-black text-gray-900">Restaurant Partner</h2>
          <p className="text-xs text-gray-500 font-semibold">Select your restaurant and enter password</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-bold">
          <div>
            <label className="text-gray-600 uppercase">Select Restaurant</label>
            <select
              value={selectedRestId}
              onChange={(e) => setSelectedRestId(e.target.value)}
              className="w-full px-3.5 py-3 border rounded-xl mt-1 bg-white font-semibold outline-none"
              required
            >
              <option value="">-- Choose Restaurant --</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.phone})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-600 uppercase">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-3 border rounded-xl mt-1 font-semibold outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-md cursor-pointer"
          >
            {loading ? 'Logging in...' : 'Login to Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}

function RestaurantOrders({ restaurant, showToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOrderPopup, setNewOrderPopup] = useState(null);
  const audioRef = useRef(null);

  const fetchOrders = async () => {
    try {
      const res = await API.get(`/restaurant/${restaurant.id}/orders`);
      const fetchedOrders = Array.isArray(res.data) ? res.data : [];
      setOrders(fetchedOrders);

      const pendingOrder = fetchedOrders.find(o => {
        let itemsArr = [];
        try { itemsArr = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); } catch { itemsArr = []; }
        return itemsArr.some(it => (Number(it.restaurant_id) === Number(restaurant.id) || String(it.restaurant_name || '').toLowerCase().trim() === String(restaurant.name).toLowerCase().trim()) && (!it.status || it.status === 'pending'));
      });

      if (pendingOrder) {
        setNewOrderPopup(pendingOrder);
      } else {
        setNewOrderPopup(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);

    const socket = io('https://cityfood-server-platform.onrender.com');
    socket.on('new_order', (orderData) => {
      let itemsArr = [];
      try { itemsArr = typeof orderData.items === 'string' ? JSON.parse(orderData.items) : (orderData.items || []); } catch { itemsArr = []; }

      const isForMe = Number(orderData.restaurant_id) === Number(restaurant.id) || itemsArr.some(it => Number(it.restaurant_id) === Number(restaurant.id) || String(it.restaurant_name || '').toLowerCase().trim() === String(restaurant.name).toLowerCase().trim());

      if (isForMe) {
        setNewOrderPopup(orderData);
        fetchOrders();
      }
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [restaurant.id]);

  useEffect(() => {
    const hasPending = orders.some(o => {
      let itemsArr = [];
      try { itemsArr = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); } catch { itemsArr = []; }
      return itemsArr.some(it => (Number(it.restaurant_id) === Number(restaurant.id) || String(it.restaurant_name || '').toLowerCase().trim() === String(restaurant.name).toLowerCase().trim()) && (!it.status || it.status === 'pending'));
    });

    if (hasPending || newOrderPopup) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(e => console.log('Audio autoplay prevented:', e));
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [orders, newOrderPopup]);

  const updateItemStatus = async (orderId, newStatus) => {
    try {
      await API.patch(`/restaurant/orders/${orderId}/item-status`, {
        restaurant_id: restaurant.id,
        status: newStatus
      });
      showToast('Status Updated', `Items marked as ${newStatus}`);
      setNewOrderPopup(null);
      fetchOrders();
    } catch (err) {
      showToast('Error', 'Failed to update item status');
    }
  };

  return (
    <div className="space-y-4 relative">
      {newOrderPopup && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Bell className="w-8 h-8 animate-ping" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">🚨 New Order Received!</h3>
              <p className="text-xs text-gray-500 mt-1">Order #ORD-{newOrderPopup.id} requires your action.</p>
              {newOrderPopup.note && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 mt-2">
                  <span>Note: {newOrderPopup.note}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => updateItemStatus(newOrderPopup.id, 'accepted')}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 cursor-pointer shadow-md"
              >
                Accept Order (Close Notification)
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-gray-900">Ongoing Orders ({orders.length})</h2>
        <button onClick={fetchOrders} className="p-2 border rounded-xl bg-white shadow-xs cursor-pointer">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="p-12 text-center text-gray-400 font-bold">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border text-gray-400 font-bold">No ongoing orders right now.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            let itemsArr = [];
            try { itemsArr = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch { itemsArr = []; }

            const myRestaurantItems = itemsArr.filter(it =>
              Number(it.restaurant_id) === Number(restaurant.id) ||
              String(it.restaurant_name || '').toLowerCase().trim() === String(restaurant.name).toLowerCase().trim()
            );
            const myRestaurantTotal = myRestaurantItems.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.qty || 1)), 0);

            return (
              <div key={order.id} className="bg-white rounded-3xl p-5 border shadow-sm space-y-3">
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <span className="text-sm font-black text-gray-900">#ORD-{order.id}</span>
                    <span className="text-xs text-gray-400 block">{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {order.note && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 space-y-0.5 shadow-xs">
                    <span className="uppercase text-[10px] tracking-wider block">⚠️ Customer Note:</span>
                    <p className="font-black text-red-700 text-sm">{order.note}</p>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-2xl text-xs space-y-1">
                  <p className="font-bold text-gray-900">Customer: {order.customer_name} ({order.customer_phone})</p>
                  <p className="text-gray-600">Address: {order.address}</p>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="font-black text-gray-400 uppercase text-[10px]">Your Ordered Items & Status:</span>
                  {myRestaurantItems.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border">
                      <div>
                        <span className="font-bold text-gray-800">{it.qty}x {it.name}</span>
                        <span className="block text-[10px] text-emerald-600 font-black uppercase">Status: {it.status || 'pending'}</span>
                      </div>
                      <span className="font-black">৳{it.price * it.qty}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-black text-sm text-emerald-700">Total: ৳{myRestaurantTotal}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateItemStatus(order.id, 'accepted')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Accept Items
                    </button>
                    <button
                      onClick={() => updateItemStatus(order.id, 'ready')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Mark Ready
                    </button>
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

function RestaurantHistory({ restaurant }) {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    API.get(`/restaurant/${restaurant.id}/history`).then((res) => {
      setHistory(Array.isArray(res.data) ? res.data : []);
    });
  }, [restaurant.id]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-gray-900">Order History & Sales</h2>
      <div className="space-y-3">
        {history.map((item) => {
          let itemsArr = [];
          try { itemsArr = typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []); } catch { itemsArr = []; }
          const myRestaurantItems = itemsArr.filter(it =>
            Number(it.restaurant_id) === Number(restaurant.id) ||
            String(it.restaurant_name || '').toLowerCase().trim() === String(restaurant.name).toLowerCase().trim()
          );
          const myRestaurantTotal = myRestaurantItems.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.qty || 1)), 0);

          return (
            <div key={item.id} className="bg-white rounded-3xl p-4 border shadow-sm space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-sm font-black text-gray-900">#ORD-{item.id}</span>
                <span className="uppercase font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {item.status}
                </span>
              </div>
              <div className="space-y-1 pt-1">
                {myRestaurantItems.map((it, i) => (
                  <div key={i} className="flex justify-between font-semibold text-gray-800">
                    <span>{it.qty}x {it.name} ({it.status || 'completed'})</span>
                    <span>৳{it.price * it.qty}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2 border-t font-black">
                <span>Total: ৳{myRestaurantTotal}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RestaurantProducts({ restaurantId, showToast }) {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [priority, setPriority] = useState('1');

  const fetchProducts = async () => {
    try {
      const res = await API.get(`/restaurant/${restaurantId}/products`);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchProducts(); }, [restaurantId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageFile(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await API.post('/restaurant/products', {
        restaurant_id: restaurantId,
        name,
        price: Number(price),
        category: category || 'General',
        image_url: imageFile || '',
        priority: Number(priority) || 1
      });
      showToast('Success', 'Product added!');
      setName(''); setPrice(''); setCategory(''); setImageFile(null); setPriority('1');
      fetchProducts();
    } catch (err) { showToast('Error', 'Failed to add'); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black text-gray-900">Manage Products</h2>
      <form onSubmit={handleAddProduct} className="bg-white rounded-3xl p-5 border shadow-sm space-y-3 text-xs font-bold">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Product Name" className="p-2.5 border rounded-xl" />
          <input type="number" required value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" className="p-2.5 border rounded-xl" />
          <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Category" className="p-2.5 border rounded-xl" />
          <input type="file" accept="image/*" onChange={handleImageChange} className="p-2 border rounded-xl bg-gray-50" />
          <input type="number" min="1" value={priority} onChange={e => setPriority(e.target.value)} placeholder="Priority (1,2,3...)" className="p-2.5 border rounded-xl" />
        </div>
        <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl">Add Product</button>
      </form>
    </div>
  );
}

function RestaurantSettings({ restaurant, setRestaurant, showToast }) {
  const [logoFile, setLogoFile] = useState(restaurant.image_url || '');

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoFile(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateLogo = async (e) => {
    e.preventDefault();
    try {
      const res = await API.put(`/restaurant/${restaurant.id}/logo`, { image_url: logoFile });
      if (res.data.success) {
        setRestaurant(res.data.restaurant);
        localStorage.setItem('cf_restaurant', JSON.stringify(res.data.restaurant));
        showToast('Success', 'Logo updated successfully!');
      }
    } catch (err) { showToast('Error', 'Failed to update logo'); }
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto bg-white p-6 rounded-3xl border">
      <h2 className="text-lg font-black">Settings</h2>
      <form onSubmit={handleUpdateLogo} className="space-y-4 text-xs font-bold">
        <img src={logoFile || 'https://via.placeholder.com/150'} className="w-24 h-24 mx-auto rounded-2xl object-cover" />
        <input type="file" accept="image/*" onChange={handleLogoFileChange} className="w-full p-2 border rounded-xl" />
        <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl">Update Logo</button>
      </form>
    </div>
  );
}