import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Bike,
  Sliders,
  DollarSign,
  Users,
  ShieldAlert,
  MapPin,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Live Orders', path: '/orders', icon: ShoppingBag },
  { name: 'Online Trx', path: '/online-trx', icon: CreditCard },
  { name: 'Areas & Coupons', path: '/areas-coupons', icon: MapPin },
  { name: 'Master Edit', path: '/master-edit', icon: Sliders },
  { name: 'Restaurants', path: '/restaurants', icon: UtensilsCrossed },
  { name: 'Riders & Cash', path: '/riders', icon: Bike },
  { name: 'Finance & Payout', path: '/finance', icon: DollarSign },
  { name: 'Customer Control', path: '/customers', icon: Users },
  { name: 'Admin Roles', path: '/roles', icon: ShieldAlert },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`bg-emerald-950 text-white min-h-screen flex flex-col shadow-2xl border-r border-emerald-900 transition-all duration-300 fixed md:static inset-y-0 left-0 z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64`}>
        <div className="p-4 border-b border-emerald-800 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-wide text-emerald-400">CITYFOOD</h1>
                <p className="text-[10px] text-emerald-300/70 font-semibold tracking-wider">ADMIN</p>
              </div>
            </div>
          )}

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:block p-1.5 bg-emerald-900 hover:bg-emerald-800 rounded-xl text-emerald-200 cursor-pointer mx-auto transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1.5 bg-emerald-900 hover:bg-emerald-800 rounded-xl text-emerald-200 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)} // Close sidebar on mobile when navigating
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-semibold'
                      : 'text-emerald-100/70 hover:bg-emerald-900/60 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {(!isCollapsed || window.innerWidth < 768) && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {(!isCollapsed || window.innerWidth < 768) && (
          <div className="p-3 border-t border-emerald-900/60 bg-emerald-950/40">
            <div className="flex items-center gap-2.5 bg-emerald-900/40 p-2.5 rounded-lg border border-emerald-800/40">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <p className="text-xs text-emerald-200">Server: <span className="font-semibold text-emerald-400">Live</span></p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}