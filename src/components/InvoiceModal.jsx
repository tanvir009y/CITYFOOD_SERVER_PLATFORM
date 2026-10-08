import React from 'react';
import { X, Printer } from 'lucide-react';

export default function InvoiceModal({ order, onClose }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h4 className="font-black text-emerald-800">CITYFOOD OFFICIAL RECEIPT</h4>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="text-xs space-y-1 text-gray-600">
          <p><span className="font-bold text-gray-900">Order ID:</span> {order.id}</p>
          <p><span className="font-bold text-gray-900">Customer:</span> {order.customer_name} ({order.customer_phone})</p>
          <p><span className="font-bold text-gray-900">Address:</span> {order.address}</p>
          <p><span className="font-bold text-gray-900">Restaurant:</span> {order.restaurant_name}</p>
        </div>

        <div className="border-t border-b py-2 space-y-1 text-xs">
          {order.items?.map((it, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{it.name} × {it.qty}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center font-bold text-sm">
          <span>Total Amount:</span>
          <span className="text-emerald-700 text-base">৳ {order.total_amount}</span>
        </div>

        <button
          onClick={() => window.print()}
          className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700"
        >
          <Printer className="w-4 h-4" /> Print Cash Memo
        </button>
      </div>
    </div>
  );
}