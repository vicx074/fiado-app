import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});
// Adiciona o token JWT automaticamente em todas as requisições, se existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;