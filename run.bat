@echo off
echo Starting SmartPrint application...
echo.

REM Check for JAVA_HOME
if "%JAVA_HOME%" == "" (
    echo Error: JAVA_HOME environment variable is not set.
    echo Please install Java and set JAVA_HOME before running this application.
    exit /b 1
)

REM Check if Maven is in PATH
where mvn >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Maven is not found in PATH. Trying to use Maven wrapper...
    
    if exist mvnw.cmd (
        echo Using Maven wrapper to start the application
        call mvnw.cmd spring-boot:run
    ) else (
        echo Error: Neither Maven nor Maven wrapper found.
        echo Please install Maven or make sure it's in your PATH.
        exit /b 1
    )
) else (
    echo Using Maven to start the application
    mvn spring-boot:run
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo Error: Failed to start the application.
    echo Please check the logs above for details.
    exit /b 1
)

echo.
echo Application started successfully! 