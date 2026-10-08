import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OnlineTrx from './pages/OnlineTrx';
import AreasAndCoupons from './pages/AreasAndCoupons';
import MasterEdit from './pages/MasterEdit';
import Restaurants from './pages/Restaurants';
import Riders from './pages/Riders';
import Finance from './pages/Finance';
import Customers from './pages/Customers';
import AdminRoles from './pages/AdminRoles';
import Login from './pages/Login';
import CustomerApp from './pages/CustomerApp';
import RiderApp from './pages/RiderApp';
import RestaurantApp from './pages/RestaurantApp';
import { SocketProvider } from './context/SocketContext';

// Admin Protected Layout (Sidebar & Navbar shudhu Admin panel-e thakbe)
function ProtectedLayout() {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/online-trx" element={<OnlineTrx />} />
            <Route path="/areas-coupons" element={<AreasAndCoupons />} />
            <Route path="/master-edit" element={<MasterEdit />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/riders" element={<Riders />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/roles" element={<AdminRoles />} />
            <Route path="/admin-roles" element={<AdminRoles />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          {/* ১. সম্পূর্ণ আলাদা Customer App */}
          <Route path="/customer" element={<CustomerApp />} />
          <Route path="/app" element={<CustomerApp />} />

          {/* ২. সম্পূর্ণ আলাদা Rider App */}
          <Route path="/rider" element={<RiderApp />} />

          {/* ৩. সম্পূর্ণ আলাদা Restaurant App */}
          <Route path="/restaurant" element={<RestaurantApp />} />

          {/* ৪. Admin Login */}
          <Route path="/login" element={<Login />} />

          {/* ৫. Admin Protected Panel */}
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}