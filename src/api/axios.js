import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', // আপনার ব্যাকএন্ড পোর্ট অনুযায়ী দিন
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;