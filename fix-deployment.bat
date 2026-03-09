@echo off
echo ========================================
echo Fixing Firebase Hosting - Copying Your Files
echo ========================================
echo.

echo Step 1: Cleaning and recreating public directory...
if exist public (
    rmdir /S /Q public
)
mkdir public
mkdir public\static
mkdir public\templates

echo Step 2: Copying static files (CSS, JS, images)...
xcopy /E /I /Y static\* public\static\ >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Static files copied successfully
) else (
    echo ✗ Error copying static files
)

echo Step 3: Copying HTML templates...
xcopy /E /I /Y templates\* public\templates\ >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Templates copied successfully
) else (
    echo ✗ Error copying templates
)

echo Step 4: Creating proper index.html...
(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>Community Complaint System^</title^>
echo     ^<script^>
echo         window.location.href = '/templates/home.html';
echo     ^</script^>
echo ^</head^>
echo ^<body style="text-align: center; padding: 50px; font-family: Arial, sans-serif;"^>
echo     ^<h1^>Community Complaint System^</h1^>
echo     ^<p^>Redirecting to home page...^</p^>
echo     ^<p^>^<a href="/templates/home.html" style="color: #667eea; text-decoration: none;"^>Click here if not redirected^</a^>^</p^>
echo ^</body^>
echo ^</html^>
) > public\index.html

echo ✓ Index.html created

echo.
echo Step 5: Verifying files...
if exist public\static\style.css (
    echo ✓ style.css found
) else (
    echo ✗ style.css missing!
)

if exist public\static\script.js (
    echo ✓ script.js found
) else (
    echo ✗ script.js missing!
)

if exist public\templates\home.html (
    echo ✓ home.html found
) else (
    echo ✗ home.html missing!
)

echo.
echo ========================================
echo Files prepared successfully!
echo ========================================
echo.
echo Now run: firebase deploy --only hosting
echo.
echo This will upload your actual website files.
echo.
pause
