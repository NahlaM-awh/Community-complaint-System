@echo off
echo ========================================
echo Deploy to Firebase Hosting
echo ========================================
echo.

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    where py >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Python not found!
        echo Please install Python or use manual method
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=py
    )
) else (
    set PYTHON_CMD=python
)

echo Step 1: Converting templates for static hosting...
%PYTHON_CMD% convert-templates.py
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Template conversion failed
    echo Trying manual method...
    goto manual
)

echo.
echo Step 2: Checking Firebase login...
firebase login:list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Please login to Firebase...
    firebase login
)

echo.
echo Step 3: Deploying to Firebase Hosting...
firebase deploy --only hosting

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ Deployment Successful!
    echo ========================================
    echo.
    echo Your site is live at:
    echo https://community-complaint-syst-73dc7.web.app
    echo.
    echo ⚠️  NOTE: Backend API won't work without Flask server.
    echo    Deploy Flask to Render/Railway for full functionality.
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ Deployment Failed
    echo ========================================
)

goto end

:manual
echo.
echo Using manual file copy method...
if not exist public (
    mkdir public
    mkdir public\static
    mkdir public\templates
)

xcopy /E /I /Y static\* public\static\ >nul
xcopy /E /I /Y templates\* public\templates\ >nul

echo Files copied. Please manually fix template paths.
echo Then run: firebase deploy --only hosting

:end
pause

