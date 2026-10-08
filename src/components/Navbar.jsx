import React from 'react';
import { Bell, LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-400">Panel Access:</span>
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-xs font-extrabold uppercase">
          {user.role === 'super_admin' ? 'Super Admin' : 'Sub Admin'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <h4 className="text-xs font-black text-gray-900">{user.name || 'Admin'}</h4>
          <p className="text-[10px] text-gray-400 font-medium">{user.email || 'tanvir.it009@gmail.com'}</p>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}