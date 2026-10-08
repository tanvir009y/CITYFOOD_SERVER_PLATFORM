import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useCustomer } from '../context/CustomerContext';
import {
  Package,
  Bike,
  Clock,
  Phone,
  MessageCircle,
  XCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function CustomerOrders() {
  const { customer } = useCustomer();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(null);

  useEffect(() => {
    if (customer?.phone) {
      fetchOrders();
    }
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

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await API.patch(`/customer/orders/${orderId}/cancel`);
      if (res.data.success) {
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
        alert('Order cancelled successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Order cannot be cancelled!');
    }
  };

  const statusSteps = ['pending', 'accepted', 'cooking', 'picked', 'delivered'];

  const getStepProgress = (current) => {
    const idx = statusSteps.indexOf(String(current).toLowerCase());
    return idx >= 0 ? idx + 1 : 1;
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-xl mx-auto space-y-4 font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-gray-900">My Orders & Tracking</h2>
        <button onClick={fetchOrders} className="p-2 border rounded-xl hover:bg-gray-50 cursor-pointer">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400 font-bold">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 space-y-2">
          <Package className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-xs font-bold text-gray-500">No past orders found</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {orders.map((order) => {
            const isCancelable = String(order.status).toLowerCase() === 'pending' && !order.rider_id;

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

                {/* Live Progress Bar */}
                {order.status !== 'cancelled' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400">
                      <span>Order Placed</span>
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

                {/* Rider Details if assigned */}
                {order.rider_name && (
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <Bike className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-800 block">{order.rider_name} (Rider)</span>
                        <span className="text-[10px] text-gray-400">{order.rider_phone}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${order.rider_phone}`}
                        className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`https://wa.me/88${order.rider_phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-50">
                  <span className="font-black text-gray-900">Total: ৳{order.total_amount}</span>

                  {isCancelable ? (
                    <button
                      type="button"
                      onClick={() => handleCancelOrder(order.id)}
                      className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-xl text-[11px] font-bold hover:bg-red-100 cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400">
                      {order.status === 'delivered' ? 'Completed' : order.status === 'cancelled' ? 'Cancelled' : 'Accepted (Lock)'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}