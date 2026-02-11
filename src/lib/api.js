import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Envia o token em toda requisição se existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Em 401, limpa token e redireciona para login (opcional; pode tratar no componente)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('storage'));
    }
    return Promise.reject(error);
  }
);

export default api;
