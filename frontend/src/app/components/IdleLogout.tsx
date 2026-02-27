"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// Configuramos 15 minutos de inactividad (900,000 ms)
const IDLE_TIME = 15 * 60 * 1000; 

export default function IdleLogout() {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(() => {
    console.log("🔒 Sesión cerrada por inactividad");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, IDLE_TIME);
  }, [logout]);

  useEffect(() => {
    // Eventos que cuentan como "Actividad"
    const events = [
      "mousedown", "mousemove", "keypress", 
      "scroll", "touchstart", "click"
    ];

    // Iniciar el temporizador
    resetTimer();

    // Agregar escuchas a cada evento
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Limpieza al desmontar el componente
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer]);

  return null; // Este componente no renderiza nada visualmente
}