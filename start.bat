@echo off
echo Iniciando GuasapApp...
echo.
echo Iniciando Backend...
start cmd /k "cd backend && npm start"
echo Iniciando Frontend...
start cmd /k "cd frontend && npm run dev"
echo.
echo La aplicacion se abrira en tu navegador.
timeout /t 3
start http://localhost:5173/dashboard
