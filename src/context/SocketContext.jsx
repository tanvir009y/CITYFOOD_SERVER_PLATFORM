import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  useEffect(() => {
    // ব্যাকএন্ড সকেট সার্ভারের পোর্ট (যেমন: 5000)
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // লাইভ নতুন অর্ডার শোনার ইভেন্ট
    newSocket.on('new_order', (orderData) => {
      setNewOrderAlert(orderData);

      // অডিও সাউন্ড অ্যালার্ট
      const audio = new Audio('/sounds/order-alert.mp3');
      audio.play().catch((err) => console.log('Audio playback prevented:', err));
    });

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, newOrderAlert, setNewOrderAlert }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);