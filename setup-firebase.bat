@echo off
echo ========================================
echo Firebase Setup Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo After installation, run this script again.
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo.

REM Check if npm is available
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not available!
    pause
    exit /b 1
)

echo npm found:
npm --version
echo.

REM Install Firebase CLI globally
echo Installing Firebase CLI globally...
call npm install -g firebase-tools
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install Firebase CLI
    pause
    exit /b 1
)

echo.
echo Firebase CLI installed successfully!
echo.

REM Check if Firebase CLI is now available
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Firebase CLI may not be in PATH
    echo You may need to restart your command prompt
    echo.
)

echo.
echo Step 2: Login to Firebase
echo.
echo You will be redirected to your browser to login.
echo After login, return to this window.
echo.
pause

firebase login
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Firebase login failed
    pause
    exit /b 1
)

echo.
echo Step 3: Installing project dependencies...
echo.

REM Install Node.js dependencies
if not exist node_modules (
    echo Installing Node.js packages...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install Node.js dependencies
        pause
        exit /b 1
    )
) else (
    echo Node.js dependencies already installed.
)

echo.
echo Step 4: Installing Python dependencies...
echo.

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    where py >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo WARNING: Python is not installed!
        echo Functions may not work without Python.
        echo.
    ) else (
        set PYTHON_CMD=py
    )
) else (
    set PYTHON_CMD=python
)

if exist functions\requirements.txt (
    if defined PYTHON_CMD (
        echo Installing Python packages for Functions...
        cd functions
        %PYTHON_CMD% -m pip install -r requirements.txt
        cd ..
        if %ERRORLEVEL% NEQ 0 (
            echo WARNING: Failed to install Python dependencies
            echo You may need to install them manually later.
        )
    )
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run deploy.bat to deploy your application
echo 2. Or use: firebase deploy
echo.
pause

