@echo off
echo ========================================
echo Firebase Hosting Deployment (FREE PLAN)
echo ========================================
echo.
echo This will deploy ONLY static files (FREE)
echo Flask backend needs separate hosting (see FREE-HOSTING-OPTIONS.txt)
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Firebase CLI not found. Installing...
    call npm install -g firebase-tools
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install Firebase CLI
        pause
        exit /b 1
    )
)

echo.
echo Step 1: Checking Firebase login...
firebase login:list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Please login to Firebase...
    firebase login
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Firebase login failed
        pause
        exit /b 1
    )
)

echo.
echo Step 2: Preparing public directory...
if not exist public (
    echo Creating public directory...
    mkdir public
    mkdir public\static
    mkdir public\templates
)

echo Copying static files...
if exist static (
    xcopy /E /I /Y static\* public\static\ >nul 2>nul
    echo Static files copied.
)
if exist templates (
    xcopy /E /I /Y templates\* public\templates\ >nul 2>nul
    echo Templates copied.
)

REM Create index.html
if not exist public\index.html (
    (
        echo ^<!DOCTYPE html^>
        echo ^<html^>
        echo ^<head^>
        echo     ^<title^>Community Complaint System^</title^>
        echo     ^<meta http-equiv="refresh" content="0; url=/templates/home.html"^>
        echo ^</head^>
        echo ^<body^>
        echo     ^<p^>Redirecting... ^<a href="/templates/home.html"^>Click here if not redirected^</a^>^</p^>
        echo ^</body^>
        echo ^</html^>
    ) > public\index.html
    echo Index.html created.
)

echo.
echo Step 3: Deploying to Firebase Hosting (FREE)...
echo.
firebase deploy --only hosting

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Deployment Successful!
    echo ========================================
    echo.
    echo Your static site is live at:
    echo https://community-complaint-syst-73dc7.web.app
    echo.
    echo IMPORTANT: This is only static files.
    echo For Flask backend, see: FREE-HOSTING-OPTIONS.txt
    echo.
) else (
    echo.
    echo ========================================
    echo Deployment Failed!
    echo ========================================
    echo Please check the error messages above.
    echo.
)

pause

