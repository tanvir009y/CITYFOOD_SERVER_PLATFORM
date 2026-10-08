import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import {
  Key,
  Power,
  Search,
  Plus,
  Layers,
  X,
  Trash2,
  Edit2,
  Upload,
  CheckCircle,
  AlertTriangle,
  Truck,
  Tag,
  FolderPlus
} from 'lucide-react';

export default function Restaurants() {
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & States
  const [selectedRest, setSelectedRest] = useState(null);
  const [isAddRestOpen, setIsAddRestOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editModal, setEditModal] = useState({ open: false, data: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
  const [passwordModal, setPasswordModal] = useState({ open: false, id: null, name: '', newPassword: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Add Form State
  const [newRest, setNewRest] = useState({
    name: '',
    phone: '',
    password: '',
    image_url: '',
    category: 'General',
    delivery_fee: '40',
    priority: 1,
    orderType: 'both'
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    id: null,
    name: '',
    phone: '',
    image_url: '',
    category: 'General',
    delivery_fee: '40',
    priority: 1,
    order_type: 'both'
  });

  // Product Add Form State (Category soho)
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    priority: 1,
    image_url: '',
    category: 'General'
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3200);
  };

  useEffect(() => {
    fetchRestaurants();
    fetchCategories();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await API.get('/restaurants');
      setRestaurants(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast('Database theke data load kora jai ni', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories');
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await API.post('/categories', { name: newCategoryName.trim() });
      if (res.data) {
        setCategories([...categories, res.data]);
        setNewCategoryName('');
        showToast('New category added successfully!');
      }
    } catch (err) {
      showToast('Failed to add category!', 'error');
    }
  };

  const handleDeleteCategory = async (catId) => {
    try {
      await API.delete(`/categories/${catId}`);
      setCategories(categories.filter(c => c.id !== catId));
      showToast('Category deleted!');
    } catch (err) {
      showToast('Failed to delete category!', 'error');
    }
  };

  const handleFileUpload = (e, targetSetter) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size maximum 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        targetSetter(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Restaurant
  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    if (!newRest.name || !newRest.phone || !newRest.password) {
      showToast('Name, phone, and password are required', 'error');
      return;
    }
    try {
      const res = await API.post('/restaurants', {
        ...newRest,
        delivery_fee: Number(newRest.delivery_fee) || 40,
        priority: Number(newRest.priority) || 1,
        order_type: newRest.orderType
      });
      if (res.data) {
        setRestaurants([res.data, ...restaurants]);
        setIsAddRestOpen(false);
        setNewRest({
          name: '',
          phone: '',
          password: '',
          image_url: '',
          category: 'General',
          delivery_fee: '40',
          priority: 1,
          orderType: 'both'
        });
        showToast('Restaurant created successfully!');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create restaurant', 'error');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (res) => {
    setEditFormData({
      id: res.id,
      name: res.name || '',
      phone: res.phone || '',
      image_url: res.image_url || '',
      category: res.category || 'General',
      delivery_fee: String(res.delivery_fee !== undefined ? res.delivery_fee : 40),
      priority: res.priority || 1,
      order_type: res.order_type || res.orderType || 'both'
    });
    setEditModal({ open: true, data: res });
  };

  // Submit Edit Form
  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    if (!editFormData.name || !editFormData.phone) {
      showToast('Name and phone required!', 'error');
      return;
    }

    try {
      const res = await API.put(`/restaurants/${editFormData.id}`, {
        name: editFormData.name,
        phone: editFormData.phone,
        category: editFormData.category,
        delivery_fee: Number(editFormData.delivery_fee) || 40,
        priority: Number(editFormData.priority) || 1,
        order_type: editFormData.order_type,
        image_url: editFormData.image_url
      });

      if (res.data) {
        setRestaurants(restaurants.map(r => r.id === editFormData.id ? { ...r, ...res.data } : r));
        setEditModal({ open: false, data: null });
        showToast('Restaurant updated successfully!');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Update failed', 'error');
    }
  };

  // Delete Restaurant
  const confirmDeleteRestaurant = async () => {
    if (!deleteConfirm.id) return;
    try {
      await API.delete(`/restaurants/${deleteConfirm.id}`);
      setRestaurants(restaurants.filter(r => r.id !== deleteConfirm.id));
      setDeleteConfirm({ open: false, id: null, name: '' });
      showToast('Restaurant deleted!');
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  // Toggle Restaurant Open/Close
  const toggleStatus = async (id) => {
    try {
      const res = await API.patch(`/restaurants/${id}/toggle`);
      setRestaurants(restaurants.map(r => r.id === id ? { ...r, is_open: res.data.is_open } : r));
      showToast('Status updated!');
    } catch (err) {
      showToast('Status update failed', 'error');
    }
  };

  // Priority Update On-Screen
  const handlePriorityChange = async (id, newPriority) => {
    const pValue = Number(newPriority) || 1;
    setRestaurants(restaurants.map(r => r.id === id ? { ...r, priority: pValue } : r));
    try {
      await API.patch(`/restaurants/${id}/priority`, { priority: pValue });
    } catch (err) {
      console.error(err);
    }
  };

  // Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordModal.newPassword) return;
    try {
      await API.patch(`/restaurants/${passwordModal.id}/password`, { password: passwordModal.newPassword });
      setPasswordModal({ open: false, id: null, name: '', newPassword: '' });
      showToast('Password updated successfully!');
    } catch (err) {
      showToast('Password change failed', 'error');
    }
  };

  // Add Product (Selected Category Soho)
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    try {
      const payload = {
        restaurant_id: selectedRest.id,
        name: newProduct.name,
        price: Number(newProduct.price),
        priority: Number(newProduct.priority) || 1,
        image_url: newProduct.image_url || '',
        category: newProduct.category || 'General'
      };
      const res = await API.post('/products', payload);
      const updatedRest = {
        ...selectedRest,
        products: [...(selectedRest.products || []), res.data]
      };
      setRestaurants(restaurants.map(r => r.id === selectedRest.id ? updatedRest : r));
      setSelectedRest(updatedRest);
      setNewProduct({ name: '', price: '', priority: 1, image_url: '', category: categories[0]?.name || 'General' });
      showToast('Product added with category!');
    } catch (err) {
      showToast('Failed to save product', 'error');
    }
  };

  const handleProductPriorityChange = async (prodId, newPriority) => {
    const val = Number(newPriority) || 1;
    const updatedProducts = selectedRest.products.map(p =>
      p.id === prodId ? { ...p, priority: val } : p
    );
    const updatedRest = { ...selectedRest, products: updatedProducts };
    setSelectedRest(updatedRest);
    setRestaurants(restaurants.map(r => r.id === selectedRest.id ? updatedRest : r));

    try {
      await API.patch(`/products/${prodId}/priority`, { priority: val });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleProductStock = async (prodId) => {
    try {
      const res = await API.patch(`/products/${prodId}/toggle-stock`);
      const updatedProducts = selectedRest.products.map(p =>
        p.id === prodId ? { ...p, in_stock: res.data.in_stock } : p
      );
      const updatedRest = { ...selectedRest, products: updatedProducts };
      setSelectedRest(updatedRest);
      setRestaurants(restaurants.map(r => r.id === selectedRest.id ? updatedRest : r));
      showToast('Stock status updated!');
    } catch (err) {
      showToast('Stock update failed', 'error');
    }
  };

  const handleDeleteProduct = async (prodId) => {
    try {
      await API.delete(`/products/${prodId}`);
      const updatedProducts = selectedRest.products.filter(p => p.id !== prodId);
      const updatedRest = { ...selectedRest, products: updatedProducts };
      setSelectedRest(updatedRest);
      setRestaurants(restaurants.map(r => r.id === selectedRest.id ? updatedRest : r));
      showToast('Product deleted!');
    } catch (err) {
      showToast('Failed to delete product', 'error');
    }
  };

  const filteredRestaurants = restaurants.filter(r =>
    (r.name && r.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.phone && r.phone.includes(searchQuery)) ||
    (r.category && r.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen relative font-sans">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 transition-all duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold backdrop-blur-md ${
            toast.type === 'error'
              ? 'bg-red-500/90 text-white border-red-600 shadow-red-500/20'
              : 'bg-emerald-600/95 text-white border-emerald-700 shadow-emerald-600/20'
          }`}>
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header with Category Manager */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Restaurant Management</h1>
          <p className="text-sm text-gray-500">Configure restaurants, menus, categories, and delivery fees</p>
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Admin Category Creator Button */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold hover:bg-indigo-100 text-sm transition-transform active:scale-95 cursor-pointer shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-indigo-600" /> Categories ({categories.length})
          </button>

          <button
            onClick={() => setIsAddRestOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 text-sm transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Restaurant
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 font-bold">Loading restaurants...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRestaurants.map((res) => (
            <div key={res.id} className="bg-white p-5 rounded-2xl border border-emerald-100/70 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                {res.image_url ? (
                  <img
                    src={res.image_url}
                    alt={res.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-gray-200 shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex flex-col items-center justify-center font-black shadow-inner flex-shrink-0 p-1 text-center">
                    <span className="text-xl uppercase leading-none tracking-wider">
                      {res.name ? res.name.substring(0, 2) : 'CF'}
                    </span>
                    <span className="text-[9px] font-bold opacity-80 mt-1 uppercase truncate max-w-full">
                      {res.name}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">{res.name}</h3>
                    <span className="text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md uppercase">
                      {res.category || 'General'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Phone: {res.phone}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <Truck className="w-3 h-3 text-emerald-600" /> Fee: ৳ {res.delivery_fee !== undefined ? res.delivery_fee : 40}
                    </span>
                    <span className="text-xs text-gray-400">
                      Menu Items: <strong className="text-gray-700">{res.products?.length || 0}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 font-bold">Priority:</span>
                  <input
                    type="number"
                    value={res.priority}
                    onChange={(e) => handlePriorityChange(res.id, e.target.value)}
                    className="w-12 bg-white text-center font-bold text-sm border rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  onClick={() => setSelectedRest(res)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" /> Manage Menu
                </button>

                <button
                  onClick={() => toggleStatus(res.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    res.is_open ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {res.is_open ? 'OPEN' : 'CLOSED'}
                </button>

                <button
                  onClick={() => handleOpenEdit(res)}
                  className="p-2 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Edit Restaurant"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setPasswordModal({ open: true, id: res.id, name: res.name, newPassword: '' })}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer"
                  title="Change Password"
                >
                  <Key className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDeleteConfirm({ open: true, id: res.id, name: res.name })}
                  className="p-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                  title="Delete Restaurant"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===================== CATEGORY MANAGER MODAL (Admin Add/Delete) ===================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-base">Category Management</h3>
              </div>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="flex gap-2">
              <input
                type="text"
                placeholder="New Category Name (e.g. Burger, Drinks)..."
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
              >
                + Add
              </button>
            </form>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {categories.map((cat) => (
                <div key={cat.id} className="flex justify-between items-center px-3 py-2 bg-gray-50 border rounded-xl text-xs font-bold text-gray-700">
                  <span>{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MENU MANAGEMENT MODAL (Add Product with Category) ===================== */}
      {selectedRest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{selectedRest.name} - Menu Management</h3>
                <p className="text-xs text-gray-500">Products, prices, categories, and stock control</p>
              </div>
              <button onClick={() => setSelectedRest(null)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Add Form with Category Select */}
            <form onSubmit={handleAddProduct} className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Food Name"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
                />
                <input
                  type="number"
                  placeholder="Price (৳)"
                  required
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
                />
                {/* Product Category Dropdown */}
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="px-2 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 bg-white font-bold cursor-pointer"
                >
                  <option value="General">Category: General</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="number"
                  placeholder="Priority (1-10)"
                  value={newProduct.priority}
                  onChange={(e) => setNewProduct({ ...newProduct, priority: e.target.value })}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-center font-bold"
                />

                <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 bg-white hover:bg-gray-100 cursor-pointer flex-1 w-full justify-center">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>{newProduct.image_url ? 'Change Photo' : 'Upload Food Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, (base64) => setNewProduct({ ...newProduct, image_url: base64 }))}
                  />
                </label>

                {newProduct.image_url && (
                  <img src={newProduct.image_url} alt="Preview" className="w-9 h-9 rounded-lg object-cover border" />
                )}

                <button type="submit" className="w-full sm:w-auto bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 px-6 py-2 shadow-md shadow-emerald-600/20 cursor-pointer">
                  + Add Item
                </button>
              </div>
            </form>

            {/* Product List */}
            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {selectedRest.products?.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-2xl bg-white text-xs shadow-sm hover:border-emerald-100 transition-colors">
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-11 h-11 rounded-xl object-cover border flex-shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 font-black flex items-center justify-center text-xs flex-shrink-0 border uppercase">
                        {item.name ? item.name.substring(0, 2) : 'IT'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-sm block">{item.name}</span>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-black">
                          {item.category || 'General'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 mt-0.5">
                        <span>Priority:</span>
                        <input
                          type="number"
                          value={item.priority || 1}
                          onChange={(e) => handleProductPriorityChange(item.id, e.target.value)}
                          className="w-12 text-center border rounded py-0.5 text-xs text-gray-700 font-bold bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-emerald-700 text-sm">৳ {item.price}</span>
                    <button
                      onClick={() => toggleProductStock(item.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                        item.in_stock ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.in_stock ? 'In Stock' : 'Out of Stock'}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(item.id)}
                      className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== EDIT RESTAURANT MODAL ===================== */}
      {editModal.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" /> Edit Restaurant
              </h3>
              <button onClick={() => setEditModal({ open: false, data: null })} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRestaurant} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block mb-1 text-gray-600 font-bold">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-600 font-bold">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-gray-600 font-bold">Category</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-2 py-2 border rounded-xl bg-white cursor-pointer"
                  >
                    <option value="General">General</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-gray-600 font-bold">Delivery Fee (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.delivery_fee}
                    onChange={(e) => setEditFormData({ ...editFormData, delivery_fee: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-1 focus:ring-emerald-500 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-gray-600 font-bold">Priority Rank</label>
                  <input
                    type="number"
                    value={editFormData.priority}
                    onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-600 font-bold">Order Type</label>
                  <select
                    value={editFormData.order_type}
                    onChange={(e) => setEditFormData({ ...editFormData, order_type: e.target.value })}
                    className="w-full px-2 py-2 border rounded-xl bg-white cursor-pointer"
                  >
                    <option value="both">Both (Normal & Pre-Order)</option>
                    <option value="normal">Normal Only</option>
                    <option value="preorder">Pre-Order Only</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 mt-2 text-sm shadow-md shadow-blue-600/20 active:scale-95 transition-transform cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Delete Confirm</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete "{deleteConfirm.name}"?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRestaurant}
                className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 shadow-md shadow-red-600/30 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {passwordModal.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-base">Change Password</h3>
              </div>
              <button onClick={() => setPasswordModal({ open: false, id: null, name: '', newPassword: '' })}>
                <X className="w-5 h-5 text-gray-400 hover:text-black cursor-pointer" />
              </button>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Set new password for <strong>{passwordModal.name}</strong>:
            </p>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <input
                type="text"
                required
                placeholder="New password..."
                value={passwordModal.newPassword}
                onChange={(e) => setPasswordModal({ ...passwordModal, newPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 font-bold"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Restaurant Modal */}
      {isAddRestOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base">Add New Restaurant</h3>
              <button onClick={() => setIsAddRestOpen(false)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRestaurant} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block mb-1 text-gray-600 font-bold">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  value={newRest.name}
                  onChange={(e) => setNewRest({ ...newRest, name: e.target.value })}
                  placeholder="e.g. Sultan's Dine"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-600 font-bold">Restaurant Logo / Image</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-500 bg-gray-50/50 transition-colors">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span className="text-gray-600 font-bold">Choose File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (base64) => setNewRest({ ...newRest, image_url: base64 }))}
                    />
                  </label>
                  {newRest.image_url ? (
                    <img src={newRest.image_url} alt="Logo" className="w-10 h-10 rounded-xl object-cover border" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-400 border text-xs">
                      No Img
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-gray-600 font-bold">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newRest.phone}
                    onChange={(e) => setNewRest({ ...newRest, phone: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-600 font-bold">Panel Password *</label>
                  <input
                    type="password"
                    required
                    value={newRest.password}
                    onChange={(e) => setNewRest({ ...newRest, password: e.target.value })}
                    placeholder="Secret password"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-gray-600 font-bold">Category</label>
                  <select
                    value={newRest.category}
                    onChange={(e) => setNewRest({ ...newRest, category: e.target.value })}
                    className="w-full px-2 py-2 border rounded-xl bg-white cursor-pointer"
                  >
                    <option value="General">General</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-gray-600 font-bold">Delivery Fee (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={newRest.delivery_fee}
                    onChange={(e) => setNewRest({ ...newRest, delivery_fee: e.target.value })}
                    placeholder="40"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-1 focus:ring-emerald-500 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 mt-2 text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-transform cursor-pointer"
              >
                Save Restaurant
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}