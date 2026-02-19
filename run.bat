@echo off
title VidaNova Launcher

:: 1. Ir a la carpeta Backend e iniciarlo en ventana aparte
start "BACKEND" cmd /k "cd backend && npm run dev"

:: 2. Ir a la carpeta Frontend e iniciarlo aquí mismo
cd frontend && npm run dev