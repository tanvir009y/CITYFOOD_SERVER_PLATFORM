import React from 'react';
import { ShieldCheck, Plus, Lock } from 'lucide-react';

export default function Roles() {
  const admins = [
    { id: 1, name: 'Super Owner', email: 'owner@cityfood.com', role: 'Super Admin', access: 'All Modules' },
    { id: 2, name: 'Shift Manager', email: 'manager@cityfood.com', role: 'Manager', access: 'Orders & Calling Only' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Admin Roles & Permissions</h1>
          <p className="text-sm text-gray-500">মালিক ও কর্মচারীদের জন্য আলাদা অ্যাক্সেস কন্ট্রোল</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700">
          <Plus className="w-4 h-4" /> Add Sub-Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {admins.map((adm) => (
          <div key={adm.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{adm.name}</h4>
                <p className="text-xs text-gray-500">{adm.email}</p>
                <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">Permission: {adm.access}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-bold">{adm.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}