import React, { createContext, useContext, useState, useEffect } from 'react';

const CustomerContext = createContext();

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem('cf_customer');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedArea, setSelectedArea] = useState(() => {
    const savedArea = localStorage.getItem('cf_selected_area');
    return savedArea ? JSON.parse(savedArea) : null;
  });

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cf_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [favorites, setFavorites] = useState(() => {
    const savedFav = localStorage.getItem('cf_favorites');
    return savedFav ? JSON.parse(savedFav) : [];
  });

  useEffect(() => {
    localStorage.setItem('cf_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('cf_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const loginCustomer = (userData, token) => {
    localStorage.setItem('cf_cust_token', token);
    localStorage.setItem('cf_customer', JSON.stringify(userData));
    setCustomer(userData);
  };

  const logoutCustomer = () => {
    localStorage.removeItem('cf_cust_token');
    localStorage.removeItem('cf_customer');
    setCustomer(null);
  };

  const addToCart = (product, restaurant) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          qty: 1,
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name,
          delivery_fee: Number(restaurant.delivery_fee || 40)
        }
      ];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const clearCart = () => setCart([]);

  const toggleFavorite = (restaurantId) => {
    setFavorites((prev) =>
      prev.includes(restaurantId) ? prev.filter((id) => id !== restaurantId) : [...prev, restaurantId]
    );
  };

  return (
    <CustomerContext.Provider
      value={{
        customer,
        setCustomer,
        loginCustomer,
        logoutCustomer,
        selectedArea,
        setSelectedArea,
        cart,
        addToCart,
        updateCartQty,
        clearCart,
        favorites,
        toggleFavorite
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export const useCustomer = () => useContext(CustomerContext);