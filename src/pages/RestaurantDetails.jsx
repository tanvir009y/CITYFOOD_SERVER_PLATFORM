import React, { useState } from 'react';
import { useCustomer } from '../context/CustomerContext';
import { ArrowLeft, Bike, Clock, Star, Plus, Check, ShoppingBag } from 'lucide-react';

export default function RestaurantDetails({ restaurant, onBack, onGoCart }) {
  const { addToCart, cart, favorites, toggleFavorite } = useCustomer();
  const [addedItemAnimation, setAddedItemAnimation] = useState(null);

  const products = restaurant.products || [];
  const isFav = favorites.includes(restaurant.id);

  const handleAdd = (item) => {
    addToCart(item, restaurant);
    setAddedItemAnimation(item.id);
    setTimeout(() => setAddedItemAnimation(null), 800);
  };

  const totalCartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="pb-28 pt-4 px-4 max-w-xl mx-auto space-y-4 font-sans relative">
      {/* Back & Fav Bar */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="p-2 bg-white rounded-full border border-gray-200 text-gray-700 shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => toggleFavorite(restaurant.id)}
          className="p-2 bg-white rounded-full border border-gray-200 text-gray-700 shadow-sm cursor-pointer"
        >
          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Header Info */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
        {restaurant.image_url ? (
          <img src={restaurant.image_url} alt={restaurant.name} className="w-16 h-16 rounded-2xl object-cover border" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl">
            {restaurant.name.substring(0, 2).toUpperCase()}
          </div>
        )}
        <div className="space-y-1">
          <h2 className="text-lg font-black text-gray-900 leading-tight">{restaurant.name}</h2>
          <p className="text-xs text-gray-500 font-semibold">Phone: {restaurant.phone}</p>
          <div className="flex gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Delivery Fee: ৳{restaurant.delivery_fee || 40}
            </span>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Menu Items ({products.length})</h3>

        <div className="space-y-2.5">
          {products.map((item) => (
            <div
              key={item.id}
              className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3 hover:border-emerald-200 transition-all"
            >
              <div className="flex items-center gap-3">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-xl object-cover border" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs uppercase">
                    Food
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{item.name}</h4>
                  <span className="text-[10px] text-gray-400 font-medium block">Category: {item.category || 'General'}</span>
                  <span className="text-xs font-black text-emerald-700">৳ {item.price}</span>
                </div>
              </div>

              <button
                disabled={!item.in_stock}
                onClick={() => handleAdd(item)}
                className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-transform cursor-pointer ${
                  !item.in_stock
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : addedItemAnimation === item.id
                    ? 'bg-emerald-700 text-white scale-110'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-600/20'
                }`}
              >
                {addedItemAnimation === item.id ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Animated Cart Bar */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 max-w-xl mx-auto z-40 animate-bounce">
          <div
            onClick={onGoCart}
            className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer border border-emerald-500/30"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-900 flex items-center justify-center font-black text-xs">
                {totalCartCount}
              </div>
              <span className="text-xs font-bold">View Cart & Checkout</span>
            </div>
            <span className="text-xs font-black text-emerald-400">Proceed ➔</span>
          </div>
        </div>
      )}
    </div>
  );
}