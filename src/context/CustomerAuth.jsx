import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useCustomer } from '../context/CustomerContext';
import { Mail, Phone, Lock, User, MapPin, Home, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function CustomerAuth({ onAuthSuccess }) {
  const { loginCustomer, setSelectedArea } = useCustomer();
  const [isLogin, setIsLogin] = useState(true);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [identifier, setIdentifier] = useState(''); // phone or email
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
      setAreas(Array.isArray(res.data) ? res.data : []);
      if (res.data?.length > 0) {
        setRegisterData((prev) => ({ ...prev, area_id: res.data[0].id }));
      }
    });
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
      setError(err.response?.data?.error || 'Login failed! Check credentials.');
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-black shadow-lg shadow-emerald-500/20">
            CF
          </div>
          <h2 className="text-2xl font-black text-gray-900">CityFood</h2>
          <p className="text-xs text-gray-500 font-semibold">
            {isLogin ? 'Sign in to order your favorite meal' : 'Create an account with your address'}
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
              <label className="text-[11px] font-bold text-gray-600 uppercase">Gmail or Phone Number</label>
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
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Full Name</label>
              <div className="relative mt-1">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Mahmud"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
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
                <label className="text-[11px] font-bold text-gray-600 uppercase">Phone Number</label>
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
              <label className="text-[11px] font-bold text-gray-600 uppercase">Delivery Location Area</label>
              <div className="relative mt-1">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
                <select
                  value={registerData.area_id}
                  onChange={(e) => setRegisterData({ ...registerData, area_id: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Delivery Fee: ৳{a.delivery_fee})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Street / House Address</label>
              <div className="relative mt-1">
                <Home className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="House #12, Road #4, Block B"
                  value={registerData.address}
                  onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Password</label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="Set secret password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
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