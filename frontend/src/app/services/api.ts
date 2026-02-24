import axios from 'axios';

// ✅ Forzamos el puerto 4000 que es el que configuramos en el Backend
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'https://vidanovadocker.onrender.com'}/api`;
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 0, // 60 segundos para procesos pesados de auditoría
});

// --- INTERCEPTOR DE REQUEST (Enviar Token) ---
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- INTERCEPTOR DE RESPONSE (Manejo de Errores) ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Manejo de 401 (Sesión expirada)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // 2. Estrategia Anti-Crash para Error 500 o Errores de Red
    if (!error.response || error.response.status >= 500) {
        console.error("❌ Error de Conexión o Servidor:", error.message);
        
        return Promise.resolve({
            data: {
                success: false,
                message: "No se pudo establecer conexión con el servidor (Puerto 4000).",
                stats: { total: 0, pacientes: 0, sin_eps: 0, sin_cups: 0, fechas_malas: 0 },
                duplicates: []
            },
            status: error.response?.status || 500,
            statusText: 'Network Error / Server Error'
        });
    }

    return Promise.reject(error);
  }
);

export default api;