import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import { useCustomer } from '../context/CustomerContext';
import {
  MapPin,
  Search,
  Star,
  Clock,
  Bike,
  ChevronDown,
  Sparkles,
  ShoppingBag,
  Flame,
  Info
} from 'lucide-react';

export default function CustomerHome({ onSelectRestaurant }) {
  const { selectedArea, setSelectedArea, favorites, toggleFavorite, cart } = useCustomer();
  const [areas, setAreas] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isAreaPickerOpen, setIsAreaPickerOpen] = useState(false);

  // Touch Swipe for Banners
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [areaRes, bannerRes, catRes, restRes] = await Promise.all([
        API.get('/delivery-areas'),
        API.get('/banners'),
        API.get('/categories'),
        API.get('/restaurants')
      ]);

      const areaData = Array.isArray(areaRes.data) ? areaRes.data : [];
      setAreas(areaData);
      if (!selectedArea && areaData.length > 0) {
        setSelectedArea(areaData[0]);
      }

      setBanners(Array.isArray(bannerRes.data) ? bannerRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setRestaurants(Array.isArray(restRes.data) ? restRes.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  // 4s Auto Slide
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      // Swipe Left
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }
    if (touchStartX.current - touchEndX.current < -50) {
      // Swipe Right
      setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }
  };

  const filteredRestaurants = restaurants.filter((r) => {
    const matchCategory =
      selectedCategory === 'All' ||
      (r.category && r.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.products?.some((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <div className="pb-24 pt-4 px-4 max-w-xl mx-auto space-y-5 font-sans">
      {/* 1. Header Location with Selector */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">DELIVER TO</span>
          <button
            onClick={() => setIsAreaPickerOpen(!isAreaPickerOpen)}
            className="flex items-center gap-1.5 text-sm font-black text-gray-900 hover:text-emerald-600 transition-colors cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="truncate max-w-[200px]">{selectedArea ? selectedArea.name : 'Select Delivery Area'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs border border-emerald-200">
          CF
        </div>
      </div>

      {/* Location Area Picker Popup */}
      {isAreaPickerOpen && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-xl space-y-2 animate-in fade-in">
          <p className="text-xs font-bold text-gray-700">Choose your area:</p>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {areas.map((a) => (
              <button
                key={a.id}
                onClick={() => { setSelectedArea(a); setIsAreaPickerOpen(false); }}
                className={`p-2 rounded-xl text-xs font-bold text-left border cursor-pointer ${
                  selectedArea?.id === a.id ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-gray-50 border-gray-100'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search restaurant or dishes (e.g. Biryani, Burger)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
        />
      </div>

      {/* 3. Promotional Banners (Auto-slide 4s & Touch Swipe) */}
      {banners.length > 0 && (
        <div
          className="relative overflow-hidden rounded-3xl shadow-md h-36 sm:h-44 bg-slate-900 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {banners.map((b, idx) => (
            <div
              key={b.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                <p className="text-white font-bold text-xs sm:text-sm drop-shadow">{b.title}</p>
              </div>
            </div>
          ))}

          {/* Dots Indicator */}
          <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1.5">
            {banners.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentBannerIndex ? 'w-4 bg-emerald-500' : 'w-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. Categories Carousel */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Top Categories</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.name
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white border border-gray-200 text-gray-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Restaurants List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Available Restaurants</h3>
          <span className="text-xs text-gray-400 font-semibold">{filteredRestaurants.length} found</span>
        </div>

        <div className="space-y-3">
          {filteredRestaurants.map((res) => {
            const isFav = favorites.includes(res.id);
            return (
              <div
                key={res.id}
                onClick={() => onSelectRestaurant(res)}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative flex gap-3.5 items-center"
              >
                {/* Favorite Button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(res.id); }}
                  className="absolute top-3 right-3 p-1 text-gray-300 hover:text-amber-500 transition-colors"
                >
                  <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>

                {/* Logo */}
                {res.image_url ? (
                  <img src={res.image_url} alt={res.name} className="w-16 h-16 rounded-2xl object-cover border flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-xl flex-shrink-0">
                    {res.name.substring(0, 2).toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-sm leading-tight">{res.name}</h4>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
                        res.is_open ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {res.is_open ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-400 font-medium">Category: {res.category || 'General'}</p>

                  <div className="flex items-center gap-3 text-[11px] text-gray-500 font-bold">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Bike className="w-3 h-3" /> ৳{res.delivery_fee || 40}
                    </span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-600 uppercase">
                      {res.order_type === 'preorder' ? 'Pre-Order' : res.order_type === 'normal' ? 'Normal' : 'Both Mode'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}