import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { ShieldAlert, Mail, Lock, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanMail = String(email).trim().toLowerCase();
    const cleanPass = String(password).trim();

    if (!cleanMail || !cleanPass) {
      setError('Please enter both Gmail and Password!');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await API.post('/auth/login', {
        email: cleanMail,
        password: cleanPass
      });

      if (res.data && res.data.success) {
        localStorage.setItem('admin_token', res.data.token);
        localStorage.setItem('admin_user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      } else {
        setError(res.data?.error || 'Login verification failed!');
      }
    } catch (err) {
      // Direct Super Admin Fallback: Backend Response না পাওয়া গেলেও ড্যাশবোর্ডে প্রবেশ করাবে
      if (cleanMail === 'tanvir.it009@gmail.com' && cleanPass === 'casio100') {
        localStorage.setItem('admin_token', `cityfood_jwt_super_${Date.now()}`);
        localStorage.setItem(
          'admin_user',
          JSON.stringify({
            id: 1,
            name: 'Tanvir (Super Admin)',
            email: 'tanvir.it009@gmail.com',
            role: 'super_admin',
            permissions: ['orders', 'restaurants', 'riders', 'finance', 'master_edit', 'customers']
          })
        );
        navigate('/dashboard');
        return;
      }

      setError(
        err.response?.data?.error || 'Invalid Gmail or Password! Access Denied.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6 text-center">
        <div>
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-3 font-black text-2xl shadow-inner">
            CF
          </div>
          <h2 className="text-2xl font-black text-gray-900">CityFood Control</h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Admin & Sub-Admin Login</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-bold text-left leading-relaxed">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 pt-1">
          <div className="text-left">
            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">
              Gmail Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="Enter your Gmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
              />
            </div>
          </div>

          <div className="text-left">
            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Panel</span>
              </>
            )}
          </button>
        </form>

        <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-[10px] text-gray-500 font-medium leading-relaxed text-left space-y-1">
          <p className="flex items-center gap-1.5 font-bold text-gray-700">
            <Lock className="w-3 h-3 text-emerald-600" /> Security Notice:
          </p>
          <p>
            Only primary Super Admin (<strong>tanvir.it009@gmail.com</strong>) and authorized Sub-Admins in the database can access this control panel.
          </p>
        </div>
      </div>
    </div>
  );
}