import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useCustomer } from '../context/CustomerContext';
import {
  Trash2,
  Plus,
  Minus,
  Copy,
  CheckCircle,
  Truck,
  CreditCard,
  MapPin,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function CustomerCart({ onOrderSuccess, onGoHome }) {
  const { cart, updateCartQty, clearCart, customer, selectedArea } = useCustomer();
  const [settings, setSettings] = useState({ bkash_number: '01XXXXXXXXX', nagad_number: '01XXXXXXXXX' });
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD, BKASH, NAGAD
  const [trxId, setTrxId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Editable delivery info during checkout
  const [customerAddress, setCustomerAddress] = useState(customer?.address || '');

  useEffect(() => {
    API.get('/settings').then((res) => {
      if (res.data) setSettings(res.data);
    });
  }, []);

  const subTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);

  // সর্বোচ্চ ডেলিভারি চার্জ অথবা এরিয়া ডেলিভারি চার্জ
  const deliveryCharge = Math.max(
    Number(selectedArea?.delivery_fee || 40),
    ...cart.map((c) => Number(c.delivery_fee || 40))
  );

  const grandTotal = Math.max(0, subTotal + deliveryCharge - discountAmount);

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
          const discount =
            found.discount_type === 'percentage'
              ? (subTotal * Number(found.discount_value)) / 100
              : Number(found.discount_value);
          setDiscountAmount(discount);
        } else {
          setError(`Min order ৳${found.min_order_amount} required for this coupon!`);
        }
      } else {
        setError('Invalid coupon code!');
      }
    } catch (err) {
      setError('Coupon check failed');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!customer) {
      setError('Please login to place an order!');
      return;
    }
    if (cart.length === 0) return;

    if ((paymentMethod === 'BKASH' || paymentMethod === 'NAGAD') && !trxId.trim()) {
      setError('Please provide the transaction ID after sending money!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        customer_name: customer.name,
        customer_phone: customer.phone,
        address: customerAddress || customer.address,
        area_id: selectedArea?.id || customer.area_id,
        street_house: customerAddress,
        delivery_fee: deliveryCharge,
        discount_amount: discountAmount,
        coupon_code: couponCode,
        restaurant_id: cart[0]?.restaurant_id,
        total_amount: grandTotal,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'COD' ? 'pending' : 'paid_pending_verify',
        transaction_id: trxId
      };

      const res = await API.post('/orders', payload);
      if (res.data) {
        clearCart();
        if (onOrderSuccess) onOrderSuccess(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Order placement failed!');
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
        <p className="text-xs text-gray-400">Add dishes from restaurants to checkout.</p>
        <button
          onClick={onGoHome}
          className="mt-3 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="pb-28 pt-4 px-4 max-w-xl mx-auto space-y-4 font-sans">
      <h2 className="text-lg font-black text-gray-900">Checkout & Order Summary</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Cart Items List */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-3">
        {cart.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-xs pb-2 border-b border-gray-50 last:border-none last:pb-0">
            <div>
              <h4 className="font-bold text-gray-800">{item.name}</h4>
              <span className="text-[10px] text-gray-400">{item.restaurant_name}</span>
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

      {/* Delivery Address Details */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-2">
        <span className="text-[10px] font-black uppercase text-gray-400">Delivery Address</span>
        <div className="text-xs font-semibold space-y-1">
          <p className="font-bold text-gray-800">{customer?.name} ({customer?.phone})</p>
          <p className="text-gray-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Area: {selectedArea?.name || 'Selected Area'}
          </p>
          <input
            type="text"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="Edit street or house address..."
            className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 mt-1 outline-none"
          />
        </div>
      </div>

      {/* Coupon Slot */}
      <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
        <input
          type="text"
          placeholder="Promo / Coupon code"
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

      {/* Payment Selection */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-3">
        <span className="text-[10px] font-black uppercase text-gray-400">Select Payment Method</span>
        <div className="grid grid-cols-3 gap-2">
          {['COD', 'BKASH', 'NAGAD'].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => { setPaymentMethod(method); setError(''); }}
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

        {/* bKash / Nagad Custom Payment Drawer */}
        {(paymentMethod === 'BKASH' || paymentMethod === 'NAGAD') && (
          <div className="bg-pink-50/70 border border-pink-200 rounded-2xl p-4 space-y-2.5 text-xs text-gray-800 animate-in fade-in">
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
              উপরের নাম্বারে <strong>৳{grandTotal}</strong> টাকা Send Money করে নিচের বক্সে Transaction ID লিখুন:
            </p>
            <input
              type="text"
              required
              placeholder="Enter TrxID (e.g. 9K2L1P0)"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-pink-300 rounded-xl text-xs font-bold uppercase focus:ring-1 focus:ring-pink-500 outline-none"
            />
          </div>
        )}
      </div>

      {/* Bill Breakdown */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-1.5 text-xs font-semibold">
        <div className="flex justify-between text-gray-500">
          <span>Items Total:</span>
          <span>৳{subTotal}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Delivery Charge:</span>
          <span>৳{deliveryCharge}</span>
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

      <button
        type="button"
        disabled={loading}
        onClick={handlePlaceOrder}
        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Place Order (৳${grandTotal})`}
      </button>
    </div>
  );
}