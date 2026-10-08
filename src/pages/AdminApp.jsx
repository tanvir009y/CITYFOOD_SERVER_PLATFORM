import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Orders from './Orders';
import OnlineTrx from './OnlineTrx';
import AreasAndCoupons from './AreasAndCoupons';
import MasterEdit from './MasterEdit';
import Restaurants from './Restaurants';
import Riders from './Riders';
import Finance from './Finance';
import Customers from './Customers';
import AdminRoles from './AdminRoles';

export default function AdminApp() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/online-trx" element={<OnlineTrx />} />
            <Route path="/areas-coupons" element={<AreasAndCoupons />} />
            <Route path="/master-edit" element={<MasterEdit />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/riders" element={<Riders />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/roles" element={<AdminRoles />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}