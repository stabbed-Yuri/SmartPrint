@echo off
echo Starting SmartPrint Development Environment...
echo.

echo Starting Spring Boot Backend...
start "Spring Boot Backend" cmd /k "cd src && mvn spring-boot:run"

echo Waiting for backend to start...
timeout /t 10 /nobreak > nul

echo Starting React Frontend...
start "React Frontend" cmd /k "cd project && npm run dev"

echo.
echo Development servers are starting...
echo Backend: http://localhost:8080
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause > nul 