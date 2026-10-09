import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import {
  DollarSign,
  Printer,
  Calendar,
  X,
  Store,
  Bike,
  CheckCircle,
  XCircle,
  TrendingUp,
  RefreshCw,
  Eye,
  Filter
} from 'lucide-react';

export default function Finance() {
  const [activeTab, setActiveTab] = useState('restaurants');
  const [overview, setOverview] = useState({
    grossSales: 0,
    platformCommission: 0,
    netPayableToRestaurants: 0,
    totalRiderCash: 0,
    deliveredCount: 0,
    cancelledCount: 0
  });

  const [restaurants, setRestaurants] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEntity, setSelectedEntity] = useState(null);
  const [drilldownData, setDrilldownData] = useState(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [modalDateFilter, setModalDateFilter] = useState('all');
  const [modalCustomDate, setModalCustomDate] = useState('');

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [overRes, restRes, riderRes] = await Promise.all([
        API.get('/finance/overview').catch(() => ({ data: {} })),
        API.get('/finance/restaurants').catch(() => ({ data: [] })),
        API.get('/finance/riders').catch(() => ({ data: [] }))
      ]);

      setOverview(overRes.data);
      setRestaurants(Array.isArray(restRes.data) ? restRes.data : []);
      setRiders(Array.isArray(riderRes.data) ? riderRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchDrilldown = async (type, id, dateF = modalDateFilter, customD = modalCustomDate) => {
    try {
      setDrilldownLoading(true);
      const url =
        type === 'restaurant'
          ? `/finance/restaurants/${id}/details?dateFilter=${dateF}&customDate=${customD}`
          : `/finance/riders/${id}/details?dateFilter=${dateF}&customDate=${customD}`;

      const res = await API.get(url);
      setDrilldownData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDrilldownLoading(false);
    }
  };

  const handleOpenDrilldown = (type, entity) => {
    setSelectedEntity({ type, id: entity.id, name: entity.name });
    setModalDateFilter('all');
    setModalCustomDate('');
    fetchDrilldown(type, entity.id, 'all', '');
  };

  const handleDateFilterChange = (filterType) => {
    setModalDateFilter(filterType);
    if (selectedEntity) {
      fetchDrilldown(selectedEntity.type, selectedEntity.id, filterType, modalCustomDate);
    }
  };

  const handleCustomDateChange = (val) => {
    setModalCustomDate(val);
    if (selectedEntity) {
      fetchDrilldown(selectedEntity.type, selectedEntity.id, 'custom', val);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Finance & Accounts Hub</h1>
          <p className="text-xs sm:text-sm text-gray-500">রেস্টুরেন্ট ও রাইডারদের সম্পূর্ণ সেলস, কমিশন ও ডেট-ওয়াইজ ড্রিলডাউন রিপোর্ট</p>
        </div>

        <button
          onClick={fetchFinanceData}
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:text-emerald-600 transition-colors shadow-sm self-start cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Total Delivered Sales</span>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900">৳ {Number(overview.grossSales || 0).toLocaleString()}</h3>
          <span className="text-xs text-emerald-600 font-bold block">{overview.deliveredCount} orders delivered</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Platform Commission (10%)</span>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-600">৳ {Number(overview.platformCommission || 0).toLocaleString()}</h3>
          <span className="text-xs text-gray-400 font-semibold block">Company Revenue</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Net Payable to Partners</span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800">৳ {Number(overview.netPayableToRestaurants || 0).toLocaleString()}</h3>
          <span className="text-xs text-blue-600 font-bold block">For Restaurants</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Riders COD in Hand</span>
          <h3 className="text-xl sm:text-2xl font-black text-amber-600">৳ {Number(overview.totalRiderCash || 0).toLocaleString()}</h3>
          <span className="text-xs text-red-500 font-bold block">Unsettled Cash</span>
        </div>
      </div>

      <div className="flex border-b border-gray-200 gap-4 text-sm font-bold">
        <button
          onClick={() => setActiveTab('restaurants')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'restaurants'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Store className="w-4 h-4" /> Restaurant Accounts ({restaurants.length})
        </button>

        <button
          onClick={() => setActiveTab('riders')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'riders'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Bike className="w-4 h-4" /> Rider Accounts ({riders.length})
        </button>
      </div>

      {/* Horizontal Scroll Wrapper Added */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {activeTab === 'restaurants' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 min-w-[750px]">
              <thead className="bg-gray-50 text-gray-700 font-bold text-xs uppercase border-b">
                <tr>
                  <th className="p-4">Restaurant</th>
                  <th className="p-4">Delivered Sales</th>
                  <th className="p-4">Commission (10%)</th>
                  <th className="p-4">Net Payable</th>
                  <th className="p-4">Orders (Del / Can)</th>
                  <th className="p-4 text-right">Drilldown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {restaurants.map((r) => {
                  const gross = Number(r.gross_sales || 0);
                  const commission = gross * 0.10;
                  const net = gross - commission;

                  return (
                    <tr key={r.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="p-4 font-bold text-gray-900">
                        <div>{r.name}</div>
                        <span className="text-xs text-gray-400 font-normal">{r.phone}</span>
                      </td>
                      <td className="p-4 font-bold text-gray-900">৳ {gross.toLocaleString()}</td>
                      <td className="p-4 text-emerald-700 font-semibold">৳ {commission.toLocaleString()}</td>
                      <td className="p-4 font-black text-emerald-600">৳ {net.toLocaleString()}</td>
                      <td className="p-4 text-xs font-semibold">
                        <span className="text-emerald-700">{r.delivered_orders} Del</span> /{' '}
                        <span className="text-red-500">{r.cancelled_orders} Can</span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenDrilldown('restaurant', r)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Full Sell Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 min-w-[750px]">
              <thead className="bg-gray-50 text-gray-700 font-bold text-xs uppercase border-b">
                <tr>
                  <th className="p-4">Rider</th>
                  <th className="p-4">Cash In Hand (COD)</th>
                  <th className="p-4">Cash Limit</th>
                  <th className="p-4">Order Breakdown</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Drilldown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {riders.map((rd) => (
                  <tr key={rd.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="p-4 font-bold text-gray-900">
                      <div>{rd.name}</div>
                      <span className="text-xs text-gray-400 font-normal">{rd.phone}</span>
                    </td>
                    <td className="p-4 font-black text-amber-600">৳ {Number(rd.cash_in_hand || 0).toLocaleString()}</td>
                    <td className="p-4 text-xs text-gray-500">৳ {Number(rd.cash_limit || 2000).toLocaleString()}</td>
                    <td className="p-4 text-xs font-bold space-y-0.5">
                      <p className="text-blue-700">Accepted: {rd.accepted_deliveries || 0}</p>
                      <p className="text-emerald-700">Delivered: {rd.delivered_deliveries || 0}</p>
                      <p className="text-red-500">Cancelled: {rd.cancelled_deliveries || 0}</p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          rd.status === 'locked' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {rd.status || 'active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenDrilldown('rider', rd)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Full Delivery Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedEntity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                  {selectedEntity.type === 'restaurant' ? <Store className="w-5 h-5 text-emerald-600" /> : <Bike className="w-5 h-5 text-emerald-600" />}
                  {selectedEntity.name} — Full Statement
                </h3>
                <p className="text-xs text-gray-400">প্রতিটি দিনের সেল, ডেলিভার্ড ও ক্যানসেল হওয়া অর্ডারের পুঙ্খানুপুঙ্খ বিবরণ</p>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
              <span className="text-gray-400 flex items-center gap-1 font-bold mr-1">
                <Calendar className="w-3.5 h-3.5" /> Date Filter:
              </span>
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'last7days', label: 'Last 7 Days' },
                { id: 'custom', label: 'Custom Date' }
              ].map((df) => (
                <button
                  key={df.id}
                  onClick={() => handleDateFilterChange(df.id)}
                  className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    modalDateFilter === df.id
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {df.label}
                </button>
              ))}

              {modalDateFilter === 'custom' && (
                <input
                  type="date"
                  value={modalCustomDate}
                  onChange={(e) => handleCustomDateChange(e.target.value)}
                  className="px-2 py-1 border border-emerald-500 rounded-lg text-xs bg-white text-emerald-950 font-bold focus:outline-none"
                />
              )}
            </div>

            {drilldownData?.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100 text-center">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block">Delivered Sales</span>
                  <span className="text-base font-black text-gray-900">
                    ৳ {Number(drilldownData.stats.deliveredAmount || 0).toLocaleString()}
                  </span>
                </div>
                {selectedEntity.type === 'restaurant' && (
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold block">Net Payout (90%)</span>
                    <span className="text-base font-black text-emerald-700">
                      ৳ {Number(drilldownData.stats.netPayout || 0).toLocaleString()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-blue-600 font-bold block">Online Paid</span>
                  <span className="text-base font-black text-blue-800">
                    ৳ {Number(drilldownData.stats.onlinePaidTotal || drilldownData.stats.onlineDeliveredAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-600 font-bold block">Cash Collect (COD)</span>
                  <span className="text-base font-black text-amber-800">
                    ৳ {Number(drilldownData.stats.cashCollectTotal || drilldownData.stats.codDeliveredAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block">Delivered Orders</span>
                  <span className="text-base font-black text-emerald-600">
                    {drilldownData.stats.deliveredCount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-red-500 font-bold block">Cancelled Orders</span>
                  <span className="text-base font-black text-red-600">
                    {drilldownData.stats.cancelledCount}
                  </span>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {drilldownLoading ? (
                <div className="p-8 text-center text-gray-400 font-bold">ডাটা লোড হচ্ছে...</div>
              ) : drilldownData?.orders?.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-semibold border rounded-2xl">
                  এই তারিখের মধ্যে কোনো অর্ডার রেকর্ড নেই
                </div>
              ) : (
                drilldownData?.orders?.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">#ORD-{ord.id}</span>
                        <span className="text-gray-500 font-medium">{ord.customer_name}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(ord.created_at).toLocaleDateString()} at{' '}
                          {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        {ord.payment_method} • {ord.area_name || ord.restaurant_name || ''}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-gray-900 block text-sm">৳ {ord.total_amount}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center border-t pt-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Statement
              </button>

              <button
                onClick={() => setSelectedEntity(null)}
                className="px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}