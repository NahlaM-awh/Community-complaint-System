@echo off
echo ========================================
echo Preparing Public Directory for Hosting
echo ========================================
echo.

REM Create public directory if it doesn't exist
if not exist public (
    echo Creating public directory...
    mkdir public
)

REM Create subdirectories
if not exist public\static (
    mkdir public\static
)
if not exist public\templates (
    mkdir public\templates
)

echo.
echo Copying static files...
xcopy /E /I /Y static\* public\static\ >nul 2>nul

echo Copying templates...
xcopy /E /I /Y templates\* public\templates\ >nul 2>nul

echo.
echo Creating index.html redirect...
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

echo.
echo ========================================
echo Public directory prepared!
echo ========================================
echo.
echo Note: For a Flask app, you may need to:
echo 1. Use Firebase Functions to serve Flask (recommended)
echo 2. Or deploy Flask separately and update API endpoints
echo.
pause

