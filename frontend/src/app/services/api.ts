import axios from 'axios';

// ✅ Usa la variable de entorno o localhost por defecto si falla
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 60000, // 🔥 Aumentamos a 60s porque la Auditoría puede ser pesada
});

// --- INTERCEPTOR DE REQUEST (Enviar Token) ---
api.interceptors.request.use(
  (config) => {
    // Verificación de window para evitar errores en Server Side Rendering
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

    // 1. Manejo de 401 (Token Vencido o Inválido)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // 2. 🔥 ESTRATEGIA ANTI-CRASH PARA ERROR 500
    // Si el servidor muere, devolvemos un objeto seguro en lugar de lanzar una excepción
    if (error.response?.status >= 500) {
        console.error("🔥 Error Crítico del Backend:", error.message);
        
        // Devolvemos una respuesta falsa válida. 
        // Esto permite que el frontend diga: if (!res.data.success) { mostrarAlerta() }
        return Promise.resolve({
            data: {
                success: false,
                message: "Error interno del servidor. Intente más tarde.",
                stats: { total: 0, pacientes: 0, sin_eps: 0, sin_cups: 0, fechas_malas: 0 }, // Defaults seguros
                duplicates: []
            },
            status: 500,
            statusText: 'Internal Server Error (Handled)'
        });
    }

    // Para errores 400, 404, etc., dejamos que el componente decida qué hacer
    return Promise.reject(error);
  }
);

export default api;