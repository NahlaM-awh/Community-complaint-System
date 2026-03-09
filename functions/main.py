"""
Firebase Functions entry point for Flask application
Note: This is a simplified setup. For production, consider deploying Flask separately
or using a more robust Firebase Functions setup.
"""
from firebase_functions import https_fn
from firebase_admin import initialize_app
import sys
import os

# Initialize Firebase Admin
initialize_app()

# Add parent directory to path to import app
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

# Import Flask app after path is set
try:
    from app import app
    
    @https_fn.on_request(
        cors=https_fn.CorsOptions(
            cors_origins=["*"],
            cors_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            cors_allow_headers=["Content-Type", "Authorization", "Cookie"]
        )
    )
    def community_system(req: https_fn.Request) -> https_fn.Response:
        """
        Firebase Cloud Function that handles all Flask routes
        """
        # Create WSGI environment from request
        environ = {
            'REQUEST_METHOD': req.method,
            'PATH_INFO': req.path,
            'QUERY_STRING': req.query_string.decode('utf-8') if req.query_string else '',
            'CONTENT_TYPE': req.headers.get('Content-Type', ''),
            'CONTENT_LENGTH': req.headers.get('Content-Length', '0'),
            'SERVER_NAME': req.headers.get('Host', 'localhost'),
            'SERVER_PORT': '443',
            'wsgi.version': (1, 0),
            'wsgi.url_scheme': 'https',
            'wsgi.input': req,
            'wsgi.errors': sys.stderr,
            'wsgi.multithread': False,
            'wsgi.multiprocess': True,
            'wsgi.run_once': False,
        }
        
        # Add headers
        for key, value in req.headers.items():
            key = 'HTTP_' + key.upper().replace('-', '_')
            environ[key] = value
        
        # Handle Flask request
        with app.request_context(environ):
            return app.full_dispatch_request()
            
except ImportError as e:
    # Fallback if app import fails
    @https_fn.on_request()
    def community_system(req: https_fn.Request) -> https_fn.Response:
        from firebase_functions import Response
        return Response(
            f"Error importing Flask app: {str(e)}. Please check your app.py file.",
            status=500,
            headers={"Content-Type": "text/plain"}
        )

