"""
Convert Flask templates to static HTML for Firebase Hosting
"""
import os
import re
import shutil

def convert_template(input_file, output_file):
    """Convert Flask template to static HTML"""
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace url_for('static', filename='...') with /static/...
    content = re.sub(
        r'\{\{\s*url_for\([\'"]static[\'"],\s*filename=[\'"]([^\'"]+)[\'"]\)\s*\}\}',
        r'/static/\1',
        content
    )
    
    # Replace url_for('...') with /...
    content = re.sub(
        r'\{\{\s*url_for\([\'"]([^\'"]+)[\'"]\)\s*\}\}',
        r'/\1',
        content
    )
    
    # Remove Jinja2 variables (they won't work in static HTML)
    content = re.sub(r'\{\{\s*username\s*\}\}', '', content)
    content = re.sub(r'\{\{\s*worker_info\.([^\}]+)\s*\}\}', r'\1', content)
    
    # Remove Jinja2 blocks that won't work in static HTML
    content = re.sub(r'\{\%\s*for\s+.*?\s*\%\}.*?\{\%\s*endfor\s*\%\}', '', content, flags=re.DOTALL)
    content = re.sub(r'\{\%\s*if\s+.*?\s*\%\}.*?\{\%\s*endif\s*\%\}', '', content, flags=re.DOTALL)
    
    # Clean up any remaining {{ }} or {% %} syntax
    content = re.sub(r'\{\{[^}]*\}\}', '', content)
    content = re.sub(r'\{\%[^%]*\%\}', '', content)
    
    # Write converted file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Converted: {os.path.basename(input_file)}")

def main():
    # Create directories
    os.makedirs('public/static', exist_ok=True)
    os.makedirs('public/templates', exist_ok=True)
    
    # Copy static files
    if os.path.exists('static'):
        shutil.copytree('static', 'public/static', dirs_exist_ok=True)
        print("✓ Copied static files")
    
    # Convert templates
    if os.path.exists('templates'):
        for filename in os.listdir('templates'):
            if filename.endswith('.html'):
                input_path = os.path.join('templates', filename)
                output_path = os.path.join('public/templates', filename)
                convert_template(input_path, output_path)
    
    # Create index.html
    index_content = '''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Community Complaint System</title>
    <script>
        window.location.href = '/templates/home.html';
    </script>
</head>
<body style="text-align: center; padding: 50px; font-family: Arial;">
    <h1>Community Complaint System</h1>
    <p>Redirecting to home page...</p>
    <p><a href="/templates/home.html">Click here if not redirected</a></p>
</body>
</html>'''
    
    with open('public/index.html', 'w', encoding='utf-8') as f:
        f.write(index_content)
    
    print("✓ Created index.html")
    print("\n✅ All files prepared for Firebase Hosting!")
    print("\nNext: Run 'firebase deploy --only hosting'")

if __name__ == '__main__':
    main()

