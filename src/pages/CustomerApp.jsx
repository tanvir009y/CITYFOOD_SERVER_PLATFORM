import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import API from '../api/axios';
import {
  Home,
  ShoppingBag,
  PackageCheck,
  User,
  MessageCircle,
  MapPin,
  Search,
  Star,
  Bike,
  ChevronDown,
  Plus,
  Minus,
  Check,
  Trash2,
  Copy,
  ArrowLeft,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  RefreshCw,
  LogOut,
  Sparkles,
  Store,
  Phone,
  RotateCcw,
  X,
  ShieldCheck
} from 'lucide-react';

// =================== CONTEXT SETUP =================== //
const CustomerContext = createContext();

function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('cf_customer');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [selectedArea, setSelectedArea] = useState(() => {
    try {
      const savedArea = localStorage.getItem('cf_selected_area');
      return savedArea ? JSON.parse(savedArea) : null;
    } catch { return null; }
  });

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cf_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch { return []; }
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      const savedFav = localStorage.getItem('cf_favorites');
      return savedFav ? JSON.parse(savedFav) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('cf_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('cf_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const loginCustomer = (userData, token) => {
    localStorage.setItem('cf_cust_token', token);
    localStorage.setItem('cf_customer', JSON.stringify(userData));
    setCustomer(userData);
  };

  const logoutCustomer = () => {
    localStorage.removeItem('cf_cust_token');
    localStorage.removeItem('cf_customer');
    setCustomer(null);
  };

  const addToCart = (product, restaurant) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          qty: 1,
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name,
          delivery_fee: Number(restaurant.delivery_fee !== undefined ? restaurant.delivery_fee : 40)
        }
      ];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const clearCart = () => setCart([]);

  const toggleFavorite = (restaurantId) => {
    setFavorites((prev) =>
      prev.includes(restaurantId) ? prev.filter((id) => id !== restaurantId) : [...prev, restaurantId]
    );
  };

  // CHECK IF CUSTOMER IS BLOCKED PERIODICALLY TO AUTO-LOGOUT
  useEffect(() => {
    if (!customer?.phone) return;
    const checkCustomerStatus = async () => {
      try {
        const res = await API.get(`/customer/orders/${customer.phone}`);
        // If needed, check user status via a profile endpoint or handle in place order.
      } catch (err) {
        if (err.response?.status === 403) {
          logoutCustomer();
        }
      }
    };
    const interval = setInterval(checkCustomerStatus, 6000);
    return () => clearInterval(interval);
  }, [customer?.phone]);

  return (
    <CustomerContext.Provider
      value={{
        customer,
        setCustomer,
        loginCustomer,
        logoutCustomer,
        selectedArea,
        setSelectedArea,
        cart,
        setCart,
        addToCart,
        updateCartQty,
        clearCart,
        favorites,
        toggleFavorite
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

const useCustomer = () => useContext(CustomerContext);

// =================== AUTH COMPONENT =================== //
function CustomerAuth({ onAuthSuccess }) {
  const { loginCustomer, setSelectedArea } = useCustomer();
  const [isLogin, setIsLogin] = useState(true);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    area_id: '',
    address: ''
  });

  useEffect(() => {
    API.get('/delivery-areas').then((res) => {
      const data = Array.isArray(res.data) ? res.data : [];
      setAreas(data);
      if (data.length > 0) {
        setRegisterData((prev) => ({ ...prev, area_id: data[0].id }));
      }
    }).catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/customer/login', { identifier, password });
      if (res.data.success) {
        loginCustomer(res.data.user, res.data.token);
        if (res.data.user.area_id) {
          const areaObj = areas.find((a) => a.id === res.data.user.area_id);
          if (areaObj) setSelectedArea(areaObj);
        }
        if (onAuthSuccess) onAuthSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed! Check Gmail/Phone and Password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/customer/register', registerData);
      if (res.data.success) {
        loginCustomer(res.data.user, res.data.token);
        const areaObj = areas.find((a) => a.id === Number(registerData.area_id));
        if (areaObj) setSelectedArea(areaObj);
        if (onAuthSuccess) onAuthSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-black shadow-lg shadow-emerald-500/20">
            CF
          </div>
          <h2 className="text-2xl font-black text-gray-900">CityFood</h2>
          <p className="text-xs text-gray-500 font-semibold">
            {isLogin ? 'Sign in to order your food' : 'Create an account with delivery area'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Phone or Gmail</label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="017xxxxxxxx or name@gmail.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Password</label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Shuvo"
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase">Gmail</label>
                <input
                  type="email"
                  required
                  placeholder="you@gmail.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase">Phone</label>
                <input
                  type="text"
                  required
                  placeholder="017xxxxxxxx"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Location Area</label>
              <select
                value={registerData.area_id}
                onChange={(e) => setRegisterData({ ...registerData, area_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none mt-1 bg-white"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Fee: ৳{a.delivery_fee})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Street / Home Address</label>
              <input
                type="text"
                required
                placeholder="House, Road, Area"
                value={registerData.address}
                onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none mt-1"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Password</label>
              <input
                type="password"
                required
                placeholder="Set secret password"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none mt-1"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
            </button>
          </form>
        )}

        <div className="text-center pt-1 border-t border-gray-100">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =================== HOME COMPONENT =================== //
function CustomerHome({ onSelectRestaurant, triggerFlyingDot }) {
  const { selectedArea, setSelectedArea, favorites, toggleFavorite, addToCart } = useCustomer();
  const [areas, setAreas] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isAreaPickerOpen, setIsAreaPickerOpen] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [areaRes, bannerRes, catRes, restRes] = await Promise.all([
        API.get('/delivery-areas'),
        API.get('/banners'),
        API.get('/categories'),
        API.get('/restaurants')
      ]);

      const areaData = Array.isArray(areaRes.data) ? areaRes.data : [];
      setAreas(areaData);
      if (!selectedArea && areaData.length > 0) {
        setSelectedArea(areaData[0]);
      }

      setBanners(Array.isArray(bannerRes.data) ? bannerRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setRestaurants(Array.isArray(restRes.data) ? restRes.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  const allProducts = [];
  restaurants.forEach((r) => {
    (r.products || []).forEach((p) => {
      allProducts.push({
        ...p,
        restaurant_id: r.id,
        restaurant_name: r.name,
        restaurant_delivery_fee: r.delivery_fee,
        restaurant_category: r.category
      });
    });
  });

  const filteredProducts = allProducts.filter((p) => {
    const pCat = String(p.category || 'General').toLowerCase().trim();
    const rCat = String(p.restaurant_category || 'General').toLowerCase().trim();
    const sCat = selectedCategory.toLowerCase().trim();
    const matchCategory = selectedCategory === 'All' || pCat === sCat || rCat === sCat;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const filteredRestaurants = restaurants.filter((r) => {
    const rCat = String(r.category || 'General').toLowerCase().trim();
    const sCat = selectedCategory.toLowerCase().trim();
    const matchCategory = selectedCategory === 'All' || rCat === sCat || (r.products || []).some(p => String(p.category || '').toLowerCase().trim() === sCat);
    const matchSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || (r.products || []).some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const handleProductAddWithAnimation = (e, prod) => {
    e.stopPropagation();
    const rest = restaurants.find((r) => r.id === prod.restaurant_id) || {
      id: prod.restaurant_id,
      name: prod.restaurant_name,
      delivery_fee: prod.restaurant_delivery_fee
    };
    addToCart(prod, rest);
    triggerFlyingDot(e.clientX, e.clientY);
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-xl mx-auto space-y-5 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">DELIVER TO</span>
          <button
            onClick={() => setIsAreaPickerOpen(!isAreaPickerOpen)}
            className="flex items-center gap-1.5 text-sm font-black text-gray-900 hover:text-emerald-600 transition-colors cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="truncate max-w-[200px]">{selectedArea ? selectedArea.name : 'Select Delivery Area'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs border border-emerald-200">
          CF
        </div>
      </div>

      {isAreaPickerOpen && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-xl space-y-2 animate-in fade-in">
          <p className="text-xs font-bold text-gray-700">Choose your area:</p>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {areas.map((a) => (
              <button
                key={a.id}
                onClick={() => { setSelectedArea(a); setIsAreaPickerOpen(false); }}
                className={`p-2 rounded-xl text-xs font-bold text-left border cursor-pointer ${
                  selectedArea?.id === a.id ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-gray-50 border-gray-100'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search restaurant or food items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
        />
      </div>

      {banners.length > 0 && (
        <div
          className="relative overflow-hidden rounded-3xl shadow-md h-36 sm:h-44 bg-slate-900 cursor-grab"
          onTouchStart={(e) => { touchStartX.current = e.targetTouches[0].clientX; }}
          onTouchMove={(e) => { touchEndX.current = e.targetTouches[0].clientX; }}
          onTouchEnd={() => {
            if (touchStartX.current - touchEndX.current > 50) setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
            if (touchStartX.current - touchEndX.current < -50) setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
          }}
        >
          {banners.map((b, idx) => (
            <div
              key={b.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                <p className="text-white font-bold text-xs sm:text-sm drop-shadow">{b.title}</p>
              </div>
            </div>
          ))}
          <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1.5">
            {banners.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentBannerIndex ? 'w-4 bg-emerald-500' : 'w-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Top Categories</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer uppercase ${
                selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white border border-gray-200 text-gray-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {selectedCategory !== 'All' && (
        <div className="space-y-3 pt-1">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-emerald-700 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              {selectedCategory} Food Items ({filteredProducts.length})
            </h3>
            <button onClick={() => setSelectedCategory('All')} className="text-[11px] font-bold text-gray-400 hover:text-emerald-600">
              Show All
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white p-6 text-center rounded-2xl border border-dashed text-xs text-gray-400 font-bold">
              No products found under "{selectedCategory}"
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.map((prod) => (
                <div key={prod.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3 hover:border-emerald-200">
                  <div className="flex items-center gap-3">
                    {prod.image_url ? (
                      <img src={prod.image_url} alt={prod.name} className="w-14 h-14 rounded-xl object-cover border flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        Food
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-1">{prod.name}</h4>
                      <p className="text-[10px] text-gray-400 truncate max-w-[130px]">{prod.restaurant_name}</p>
                      <span className="text-xs font-black text-emerald-700">৳{prod.price}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleProductAddWithAnimation(e, prod)}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white rounded-xl shadow-md cursor-pointer flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">
            Available Restaurants ({filteredRestaurants.length})
          </h3>
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl border border-dashed text-xs text-gray-400 font-bold">
            No restaurants found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRestaurants.map((res) => {
              const isFav = favorites.includes(res.id);
              return (
                <div
                  key={res.id}
                  onClick={() => onSelectRestaurant(res)}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer relative"
                >
                  <div className="relative h-44 sm:h-52 w-full bg-slate-100">
                    {res.image_url ? (
                      <img src={res.image_url} alt={res.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-emerald-600 to-teal-800 flex items-center justify-center text-white font-black text-4xl">
                        {res.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(res.id); }}
                      className="absolute top-3.5 right-3.5 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-400 hover:text-amber-500 shadow-md cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase shadow ${
                        res.is_open ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {res.is_open ? 'OPEN NOW' : 'CLOSED'}
                      </span>
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase bg-black/60 text-white backdrop-blur-md">
                        {res.order_type === 'preorder' ? 'Pre-Order' : res.order_type === 'normal' ? 'Normal' : 'Both Mode'}
                      </span>
                    </div>

                    <div className="absolute bottom-3.5 left-4 right-4 text-white">
                      <h4 className="font-black text-lg sm:text-xl leading-tight drop-shadow">{res.name}</h4>
                      <p className="text-xs text-gray-200 drop-shadow">Category: {res.category || 'General'}</p>
                    </div>
                  </div>

                  <div className="p-3.5 flex items-center justify-between text-xs font-bold text-gray-600 bg-white">
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <Bike className="w-4 h-4" /> Rest. Delivery: ৳{res.delivery_fee || 40}
                    </span>
                    <span className="text-gray-400 text-[11px]">
                      Menu: {res.products?.length || 0} items
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// =================== RESTAURANT DETAILS =================== //
function RestaurantDetails({ restaurant, onBack, triggerFlyingDot }) {
  const { addToCart, favorites, toggleFavorite } = useCustomer();
  const [addedItemAnimation, setAddedItemAnimation] = useState(null);

  const products = restaurant.products || [];
  const isFav = favorites.includes(restaurant.id);

  const handleAdd = (e, item) => {
    addToCart(item, restaurant);
    setAddedItemAnimation(item.id);
    triggerFlyingDot(e.clientX, e.clientY);
    setTimeout(() => setAddedItemAnimation(null), 700);
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-xl mx-auto space-y-4 font-sans relative">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="p-2 bg-white rounded-full border border-gray-200 text-gray-700 shadow-sm cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={() => toggleFavorite(restaurant.id)} className="p-2 bg-white rounded-full border border-gray-200 text-gray-700 shadow-sm cursor-pointer">
          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
        </button>
      </div>

      <div className="relative h-48 w-full rounded-3xl overflow-hidden shadow-md">
        {restaurant.image_url ? (
          <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white font-black text-4xl">
            {restaurant.name.substring(0, 2).toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-5 text-white">
          <div>
            <h2 className="text-xl font-black">{restaurant.name}</h2>
            <p className="text-xs text-gray-300">Delivery Fee: ৳{restaurant.delivery_fee || 40}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Menu Items ({products.length})</h3>
        <div className="space-y-2.5">
          {products.map((item) => (
            <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3 hover:border-emerald-200">
              <div className="flex items-center gap-3">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-xl object-cover border flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                    Food
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{item.name}</h4>
                  <span className="text-[10px] text-gray-400 font-medium block">Category: {item.category || 'General'}</span>
                  <span className="text-xs font-black text-emerald-700">৳ {item.price}</span>
                </div>
              </div>

              <button
                disabled={!item.in_stock}
                onClick={(e) => handleAdd(e, item)}
                className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-transform cursor-pointer ${
                  !item.in_stock
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : addedItemAnimation === item.id
                    ? 'bg-emerald-700 text-white scale-110'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-md'
                }`}
              >
                {addedItemAnimation === item.id ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =================== CART & CHECKOUT =================== //
function CustomerCart({ onOrderSuccess, onGoHome, showCustomAlert }) {
  const { cart, updateCartQty, clearCart, customer, logoutCustomer, selectedArea, setSelectedArea } = useCustomer();
  const [areas, setAreas] = useState([]);
  const [settings, setSettings] = useState({ bkash_number: '01XXXXXXXXX', nagad_number: '01XXXXXXXXX' });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [trxId, setTrxId] = useState('');
  const [isTrxSubmitted, setIsTrxSubmitted] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [orderNote, setOrderNote] = useState(''); // ORDER NOTE STATE
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [customerAddress, setCustomerAddress] = useState(customer?.address || '');

  useEffect(() => {
    API.get('/delivery-areas').then((res) => {
      const data = Array.isArray(res.data) ? res.data : [];
      setAreas(data);
      if (!selectedArea && data.length > 0) setSelectedArea(data[0]);
    }).catch(() => {});

    API.get('/settings').then((res) => {
      if (res.data) setSettings(res.data);
    }).catch(() => {});
  }, []);

  const groupedCart = {};
  cart.forEach((item) => {
    const restId = item.restaurant_id || 'default';
    if (!groupedCart[restId]) {
      groupedCart[restId] = {
        name: item.restaurant_name || 'Restaurant',
        delivery_fee: Number(item.delivery_fee !== undefined ? item.delivery_fee : 40),
        items: []
      };
    }
    groupedCart[restId].items.push(item);
  });

  const subTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
  const areaDeliveryFee = Number(selectedArea?.delivery_fee || 0);
  const totalRestaurantDeliveryFee = Object.values(groupedCart).reduce((sum, g) => sum + Number(g.delivery_fee), 0);
  const totalDeliveryCharge = areaDeliveryFee + totalRestaurantDeliveryFee;
  const grandTotal = Math.max(0, subTotal + totalDeliveryCharge - discountAmount);

  const handleCopyNumber = (num) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await API.get('/coupons');
      const found = res.data?.find((c) => c.code === couponCode.toUpperCase());
      if (found) {
        if (subTotal >= Number(found.min_order_amount)) {
          const discount = found.discount_type === 'percentage'
            ? (subTotal * Number(found.discount_value)) / 100
            : Number(found.discount_value);
          setDiscountAmount(discount);
          showCustomAlert('Coupon Applied!', `You saved ৳${discount}`);
        } else {
          setError(`Min order ৳${found.min_order_amount} required!`);
        }
      } else {
        setError('Invalid coupon code!');
      }
    } catch {
      setError('Coupon check failed');
    }
  };

  const handleSubmitTrx = (e) => {
    e.preventDefault();
    if (!trxId.trim()) {
      setError('Please enter a valid Transaction ID before submitting!');
      return;
    }
    setError('');
    setIsTrxSubmitted(true);
    showCustomAlert('TrxID Submitted!', 'Transaction ID recorded. Now you can confirm your order below.');
  };

  const handlePlaceOrder = async (e) => {
      e.preventDefault();
      if (!customer) {
        setError('Please login to place an order!');
        return;
      }
      if (cart.length === 0) return;

      if ((paymentMethod === 'BKASH' || paymentMethod === 'NAGAD') && !isTrxSubmitted) {
        setError('Please click "Submit Trx" first before confirming your order!');
        return;
      }

      setLoading(true);
      setError('');

      try {
        // FRONTEND PRE-CHECK: Verify status from server profile or orders first
        try {
          const checkStatusRes = await API.get(`/customer/orders/${customer.phone}`);
          // If needed, we can pass correct parameters
        } catch (err) {
          if (err.response?.status === 403) {
            logoutCustomer();
            return;
          }
        }

        const payload = {
          customer_id: customer.id, // CUSTOMER ID INCLUDED
          customer_name: customer.name,
          customer_phone: customer.phone,
          address: customerAddress || customer.address,
          area_id: selectedArea?.id || customer.area_id,
          street_house: customerAddress,
          delivery_fee: totalDeliveryCharge,
          discount_amount: discountAmount,
          coupon_code: couponCode,
          restaurant_id: cart[0]?.restaurant_id,
          total_amount: grandTotal,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'COD' ? 'pending' : 'paid_pending_verify',
          transaction_id: trxId,
          note: orderNote,
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            qty: Number(item.qty),
            restaurant_id: item.restaurant_id,
            restaurant_name: item.restaurant_name
          }))
        };

        const res = await API.post('/orders', payload);
        if (res.data) {
          clearCart();
          showCustomAlert('Order Confirmed!', `ORD-#${res.data.id} has been placed successfully.`);
          if (onOrderSuccess) onOrderSuccess(res.data);
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Order placement failed!';
        setError(errorMsg);
        if (errorMsg.includes('blocked') || err.response?.status === 403) {
          setTimeout(() => {
            logoutCustomer();
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

  if (cart.length === 0) {
    return (
      <div className="p-8 text-center max-w-sm mx-auto space-y-3 pt-24 font-sans">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
          <Trash2 className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-gray-800">Your cart is empty</h3>
        <p className="text-xs text-gray-400">Add food items from restaurants to checkout.</p>
        <button onClick={onGoHome} className="mt-3 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="pb-36 pt-4 px-4 max-w-xl mx-auto space-y-4 font-sans">
      <h2 className="text-lg font-black text-gray-900">Checkout & Order Summary</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ORDER NOTE INPUT FIELD */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-2">
        <span className="text-[10px] font-black uppercase text-gray-400">Order Note / Special Instructions</span>
        <textarea
          rows="2"
          placeholder="Write special instruction here (e.g. extra spicy, ring bell)..."
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          className="w-full px-3 py-2 border rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50 text-gray-800"
        />
      </div>

      <div className="space-y-3">
        {Object.entries(groupedCart).map(([restId, group]) => (
          <div key={restId} className="bg-white rounded-3xl p-4 border border-emerald-100/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-black text-xs text-emerald-800 flex items-center gap-1.5 uppercase">
                <Store className="w-4 h-4 text-emerald-600" /> {group.name}
              </span>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg border">
                Rest. Delivery: ৳{group.delivery_fee}
              </span>
            </div>

            <div className="space-y-2">
              {group.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-gray-800">{item.name}</h4>
                    <p className="font-black text-emerald-600 mt-0.5">৳{item.price * item.qty}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                    <button onClick={() => updateCartQty(item.id, -1)} className="p-1 hover:text-red-600 cursor-pointer">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateCartQty(item.id, 1)} className="p-1 hover:text-emerald-600 cursor-pointer">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-2.5">
        <span className="text-[10px] font-black uppercase text-gray-400">Delivery Address</span>
        <div className="text-xs font-semibold space-y-2">
          <p className="font-bold text-gray-800">{customer?.name} ({customer?.phone})</p>

          <div>
            <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Change Delivery Area</label>
            <select
              value={selectedArea?.id || ''}
              onChange={(e) => {
                const a = areas.find((ar) => ar.id === Number(e.target.value));
                if (a) setSelectedArea(a);
              }}
              className="w-full px-3 py-2 border rounded-xl bg-white text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (Area Fee: ৳{a.delivery_fee})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Street / Home Address</label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Edit street or house address..."
              className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
        <input
          type="text"
          placeholder="Promo code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          className="flex-1 px-3 py-1.5 text-xs font-bold uppercase rounded-xl outline-none"
        />
        <button
          type="button"
          onClick={handleApplyCoupon}
          className="px-4 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Apply
        </button>
      </div>

      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-3">
        <span className="text-[10px] font-black uppercase text-gray-400">Payment Method</span>
        <div className="grid grid-cols-3 gap-2">
          {['COD', 'BKASH', 'NAGAD'].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => {
                setPaymentMethod(method);
                setIsTrxSubmitted(false);
                setTrxId('');
                setError('');
              }}
              className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                paymentMethod === method
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              {method === 'COD' ? 'Cash on Delivery' : method}
            </button>
          ))}
        </div>

        {(paymentMethod === 'BKASH' || paymentMethod === 'NAGAD') && (
          <div className="bg-pink-50/70 border border-pink-200 rounded-2xl p-4 space-y-3 text-xs text-gray-800">
            <p className="font-bold text-pink-900">
              {paymentMethod} Personal Send Money:
            </p>
            <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-pink-200 font-mono font-bold">
              <span>{paymentMethod === 'BKASH' ? settings.bkash_number : settings.nagad_number}</span>
              <button
                type="button"
                onClick={() => handleCopyNumber(paymentMethod === 'BKASH' ? settings.bkash_number : settings.nagad_number)}
                className="text-pink-600 hover:text-pink-800 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Send Money <strong>৳{grandTotal}</strong>, then enter Transaction ID below and click <strong>Submit Trx</strong> first:
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                disabled={isTrxSubmitted}
                placeholder="ENTER TRXID (E.G. 9K2L1P0)"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                className={`flex-1 px-3 py-2 bg-white border rounded-xl text-xs font-bold uppercase outline-none ${
                  isTrxSubmitted ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-black' : 'border-pink-300'
                }`}
              />
              <button
                type="button"
                onClick={handleSubmitTrx}
                className={`px-4 py-2 rounded-xl font-bold text-xs shadow-sm cursor-pointer transition-all whitespace-nowrap ${
                  isTrxSubmitted ? 'bg-emerald-600 text-white' : 'bg-pink-600 hover:bg-pink-700 text-white'
                }`}
              >
                {isTrxSubmitted ? '✓ Trx Submitted' : 'Submit Trx'}
              </button>
            </div>

            {isTrxSubmitted && (
              <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> TrxID successfully recorded! Now press Confirm Order below.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-1.5 text-xs font-semibold">
        <div className="flex justify-between text-gray-500">
          <span>Items Total:</span>
          <span>৳{subTotal}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Restaurant Delivery:</span>
          <span>৳{totalRestaurantDeliveryFee}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Area Delivery ({selectedArea?.name || 'Area'}):</span>
          <span>৳{areaDeliveryFee}</span>
        </div>
        <div className="flex justify-between text-emerald-700 font-bold">
          <span>Total Delivery Charge:</span>
          <span>৳{totalDeliveryCharge}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Discount:</span>
            <span>-৳{discountAmount}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t">
          <span>Total Payable:</span>
          <span className="text-emerald-700">৳{grandTotal}</span>
        </div>
      </div>

      {(paymentMethod === 'COD' || isTrxSubmitted) && (
        <button
          type="button"
          disabled={loading}
          onClick={handlePlaceOrder}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all animate-in fade-in"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Confirm Order (৳{grandTotal})`}
        </button>
      )}
    </div>
  );
}

// =================== ORDERS, LIVE TRACKING & REORDER =================== //
function CustomerOrders({ onGoToCart, triggerConfirmModal, showCustomAlert }) {
  const { customer, setCart } = useCustomer();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customer?.phone) fetchOrders();
  }, [customer]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/customer/orders/${customer.phone}`);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = (orderId) => {
    triggerConfirmModal(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      async () => {
        try {
          const res = await API.patch(`/customer/orders/${orderId}/cancel`);
          if (res.data.success) {
            setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
            showCustomAlert('Order Cancelled', 'Your order was successfully cancelled.');
          }
        } catch (err) {
          showCustomAlert('Cancel Error', err.response?.data?.error || 'Order cannot be cancelled!');
        }
      }
    );
  };

  const handleReorder = (order) => {
    let parsedItems = [];
    try {
      parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    } catch { parsedItems = []; }

    if (parsedItems.length === 0) {
      showCustomAlert('Reorder Info', 'No previous items saved for this order.');
      return;
    }

    setCart(parsedItems.map(item => ({
      ...item,
      qty: Number(item.qty) || 1,
      delivery_fee: Number(item.delivery_fee) || 40
    })));

    showCustomAlert('Items Reordered!', 'Previous items added to your cart.');
    if (onGoToCart) onGoToCart();
  };

  const getStepProgress = (current) => {
    const st = String(current || '').toLowerCase().trim();
    if (st === 'pending' || st === 'accepted') return 1;
    if (st === 'cooking') return 2;
    if (st === 'picked' || st === 'on_way') return 3;
    if (st === 'delivered') return 4;
    return 1;
  };

  return (
    <div className="pb-36 pt-4 px-4 max-w-xl mx-auto space-y-4 font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-gray-900">My Orders & Live Tracking</h2>
        <button onClick={fetchOrders} className="p-2 border rounded-xl hover:bg-gray-50 cursor-pointer">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400 font-bold">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 space-y-2">
          <PackageCheck className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-xs font-bold text-gray-500">No past orders found</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {orders.map((order) => {
            const isCancelable = String(order.status).toLowerCase() === 'pending' && !order.rider_id;
            let parsedItems = [];
            try {
              parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
            } catch { parsedItems = []; }

            return (
              <div key={order.id} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-black text-gray-900 block">ORD-#{order.id}</span>
                    <span className="text-[10px] text-gray-400">{order.restaurant_name || 'Restaurant'}</span>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                      order.status === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* SHOW NOTE IN CUSTOMER ORDERS */}
                {order.note && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
                    <span className="uppercase text-[10px] block">⚠️ Note:</span>
                    <p className="font-black text-red-700">{order.note}</p>
                  </div>
                )}

                {parsedItems.length > 0 && (
                  <div className="bg-gray-50 p-2.5 rounded-2xl space-y-1 text-xs">
                    {parsedItems.map((it, i) => (
                      <div key={i} className="flex justify-between text-gray-700 font-medium text-[11px]">
                        <span>{it.qty}x {it.name} ({it.restaurant_name})</span>
                        <span className="font-bold">৳{it.price * it.qty}</span>
                      </div>
                    ))}
                  </div>
                )}

                {order.status !== 'cancelled' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400">
                      <span>Placed</span>
                      <span>Cooking</span>
                      <span>On The Way</span>
                      <span>Delivered</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${(getStepProgress(order.status) / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {order.rider_name ? (
                  <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
                        <Bike className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-emerald-950 block">{order.rider_name} (Rider)</span>
                        <span className="text-[11px] text-gray-500 font-medium">{order.rider_phone}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${order.rider_phone}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                        title="Call Rider"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                      <a
                        href={`https://wa.me/88${order.rider_phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                        title="WhatsApp Rider"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </div>
                  </div>
                ) : null}

                <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-50">
                  <span className="font-black text-gray-900">Total: ৳{order.total_amount}</span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleReorder(order)}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold hover:bg-emerald-100 cursor-pointer active:scale-95 transition-all"
                    >
                      <RotateCcw className="w-3 h-3" /> Reorder
                    </button>

                    {isCancelable ? (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-xl text-[11px] font-bold hover:bg-red-100 cursor-pointer active:scale-95 transition-all"
                      >
                        Cancel Order
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400">
                        {order.status === 'delivered' ? 'Delivered' : order.status === 'cancelled' ? 'Cancelled' : 'Accepted (Locked)'}
                      </span>
                    )}
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

// =================== PROFILE COMPONENT =================== //
function CustomerProfile({ onLogout }) {
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
    }).catch(() => {});
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
    } catch {
      alert('Update failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-36 pt-4 px-4 max-w-xl mx-auto space-y-4 font-sans">
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
          <Check className="w-4 h-4 text-emerald-600" />
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

// =================== MAIN CONTROLLER =================== //
function CustomerAppContent() {
  const { customer, cart } = useCustomer();
  const [activeTab, setActiveTab] = useState('home');
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  const [supportPhone, setSupportPhone] = useState('01XXXXXXXXX');

  const [flyingDots, setFlyingDots] = useState([]);
  const [cartPulse, setCartPulse] = useState(false);
  const cartIconRef = useRef(null);

  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [alertToast, setAlertToast] = useState({ open: false, title: '', message: '' });

  const triggerConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({ open: true, title, message, onConfirm });
  };

  const showCustomAlert = (title, message) => {
    setAlertToast({ open: true, title, message });
    setTimeout(() => {
      setAlertToast({ open: false, title: '', message: '' });
    }, 3500);
  };

  useEffect(() => {
    API.get('/settings').then((res) => {
      if (res.data?.support_number) setSupportPhone(res.data.support_number);
    }).catch(() => {});
  }, []);

  const triggerFlyingDot = (startX, startY) => {
    let targetX = window.innerWidth * 0.38;
    let targetY = window.innerHeight - 30;

    if (cartIconRef.current) {
      const rect = cartIconRef.current.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    }

    const dotId = Date.now() + Math.random();
    const newDot = { id: dotId, startX, startY, targetX, targetY };
    setFlyingDots((prev) => [...prev, newDot]);

    setTimeout(() => {
      setCartPulse(true);
      setTimeout(() => setCartPulse(false), 300);
      setFlyingDots((prev) => prev.filter((d) => d.id !== dotId));
    }, 750);
  };

  if (!customer) {
    return <CustomerAuth onAuthSuccess={() => setActiveTab('home')} showCustomAlert={showCustomAlert} />;
  }

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans relative overflow-x-hidden">
      {flyingDots.map((dot) => (
        <span
          key={dot.id}
          className="fixed pointer-events-none z-[9999] w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/80"
          style={{
            left: `${dot.startX}px`,
            top: `${dot.startY}px`,
            transform: 'translate(-50%, -50%)',
            animation: 'flyToCart 0.75s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            '--target-x': `${dot.targetX - dot.startX}px`,
            '--target-y': `${dot.targetY - dot.startY}px`
          }}
        />
      ))}

      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 scale-100">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base">{confirmModal.title}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                No, Keep
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {alertToast.open && (
        <div className="fixed top-5 left-4 right-4 max-w-md mx-auto z-[9999] transition-all">
          <div className="bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500/40 backdrop-blur-md">
            <div>
              <span className="font-bold text-xs text-emerald-400 block">{alertToast.title}</span>
              <span className="text-[11px] text-gray-200">{alertToast.message}</span>
            </div>
            <button
              onClick={() => setAlertToast({ open: false, title: '', message: '' })}
              className="p-1 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeRestaurant ? (
        <RestaurantDetails
          restaurant={activeRestaurant}
          onBack={() => setActiveRestaurant(null)}
          triggerFlyingDot={triggerFlyingDot}
        />
      ) : activeTab === 'home' ? (
        <CustomerHome
          onSelectRestaurant={(res) => setActiveRestaurant(res)}
          triggerFlyingDot={triggerFlyingDot}
        />
      ) : activeTab === 'cart' ? (
        <CustomerCart
          onOrderSuccess={() => setActiveTab('orders')}
          onGoHome={() => setActiveTab('home')}
          showCustomAlert={showCustomAlert}
        />
      ) : activeTab === 'orders' ? (
        <CustomerOrders
          onGoToCart={() => { setActiveRestaurant(null); setActiveTab('cart'); }}
          triggerConfirmModal={triggerConfirmModal}
          showCustomAlert={showCustomAlert}
        />
      ) : (
        <CustomerProfile onLogout={() => setActiveTab('home')} />
      )}

      <a
        href={`https://wa.me/88${supportPhone}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-24 right-4 z-40 w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/40 transition-transform active:scale-95 cursor-pointer"
        title="Chat with WhatsApp Support"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {cartCount > 0 && activeTab !== 'cart' && (
        <div className="fixed bottom-16 left-4 right-4 max-w-xl mx-auto z-40 transition-transform">
          <div
            onClick={() => { setActiveRestaurant(null); setActiveTab('cart'); }}
            className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer border border-emerald-500/40 active:scale-95 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-900 flex items-center justify-center font-black text-xs shadow">
                {cartCount}
              </div>
              <div>
                <span className="text-xs font-bold block leading-none">View Cart</span>
                <span className="text-[10px] text-gray-300">Tap to review & checkout</span>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-400">Checkout ➔</span>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 py-2.5 px-6 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <button
            onClick={() => { setActiveRestaurant(null); setActiveTab('home'); }}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'home' && !activeRestaurant ? 'text-emerald-600 font-bold' : 'text-gray-400'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            ref={cartIconRef}
            onClick={() => { setActiveRestaurant(null); setActiveTab('cart'); }}
            className={`flex flex-col items-center gap-1 relative cursor-pointer transition-transform ${
              cartPulse ? 'scale-125 text-emerald-600' : ''
            } ${activeTab === 'cart' ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px]">Cart</span>
            {cartCount > 0 && (
              <span className={`absolute -top-1 -right-2 bg-emerald-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center transition-transform ${cartPulse ? 'scale-150 bg-emerald-400' : ''}`}>
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveRestaurant(null); setActiveTab('orders'); }}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'orders' ? 'text-emerald-600 font-bold' : 'text-gray-400'
            }`}
          >
            <PackageCheck className="w-5 h-5" />
            <span className="text-[10px]">Orders</span>
          </button>

          <button
            onClick={() => { setActiveRestaurant(null); setActiveTab('profile'); }}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'profile' ? 'text-emerald-600 font-bold' : 'text-gray-400'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">Profile</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes flyToCart {
          0% {
            transform: translate(-50%, -50%) scale(1.4);
            opacity: 1;
          }
          40% {
            transform: translate(calc(var(--target-x) * 0.4), calc(var(--target-y) * 0.2 - 60px)) scale(1.6);
            opacity: 0.95;
          }
          80% {
            transform: translate(calc(var(--target-x) * 0.85), calc(var(--target-y) * 0.85)) scale(0.9);
            opacity: 0.8;
          }
          100% {
            transform: translate(var(--target-x), var(--target-y)) scale(0.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function CustomerApp() {
  return (
    <CustomerProvider>
      <CustomerAppContent />
    </CustomerProvider>
  );
}