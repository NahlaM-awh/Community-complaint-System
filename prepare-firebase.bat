@echo off
echo ========================================
echo Preparing Site for Firebase Hosting
echo ========================================
echo.

echo Step 1: Cleaning public directory...
if exist public (
    rmdir /S /Q public
)
mkdir public
mkdir public\static
mkdir public\templates

echo Step 2: Copying static files...
xcopy /E /I /Y static\* public\static\ >nul 2>nul
echo ✓ Static files copied

echo Step 3: Converting and copying templates...
echo.

REM Copy templates and convert Flask syntax
for %%f in (templates\*.html) do (
    echo Processing %%f...
    python -c "import sys; content = open('%%f', 'r', encoding='utf-8').read(); content = content.replace('{{ url_for(\"static\", filename=\"', '/static/'); content = content.replace('{{ url_for(\"', '/'); content = content.replace('{{ username }}', ''); content = content.replace('{{ worker_info.', ''); content = content.replace('}}', ''); open('public\%%~nxf', 'w', encoding='utf-8').write(content)" 2>nul
    if errorlevel 1 (
        REM If Python fails, just copy the file
        copy "%%f" "public\templates\%%~nxf" >nul
    )
)

echo ✓ Templates processed

echo Step 4: Creating index.html...
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
echo ^<body style="text-align: center; padding: 50px; font-family: Arial;"^>
echo     ^<h1^>Community Complaint System^</h1^>
echo     ^<p^>Redirecting...^</p^>
echo     ^<p^>^<a href="/templates/home.html"^>Click here^</a^>^</p^>
echo ^</body^>
echo ^</html^>
) > public\index.html

echo ✓ Index.html created

echo.
echo Step 5: Fixing template paths...
REM Fix common Flask template syntax in copied files
powershell -Command "(Get-Content 'public\templates\*.html') -replace '{{ url_for\(''static'', filename=''', '/static/' -replace '{{ url_for\(''', '/' -replace '{{ username }}', '' -replace '{{ worker_info\.', '' -replace '}}', '' | Set-Content 'public\templates\*.html'" 2>nul

echo.
echo ========================================
echo Files prepared for Firebase Hosting!
echo ========================================
echo.
echo Next step: firebase deploy --only hosting
echo.
pause

