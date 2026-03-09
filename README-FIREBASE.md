# Firebase Hosting Setup

This project is configured for Firebase Hosting deployment.

## Quick Start

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies for Functions (if using)
cd functions
pip install -r requirements.txt
cd ..
```

### 4. Deploy

```bash
# Deploy everything
firebase deploy

# Or deploy only hosting
firebase deploy --only hosting
```

## Project Configuration

- **Project ID**: `community-complaint-syst-73dc7`
- **Firebase Config**: Located in `static/firebase-config.js`

## Important Notes

### For Flask Applications

Firebase Hosting is primarily for static files. Your Flask backend has two deployment options:

#### Option A: Firebase Functions (Current Setup)
- Flask app runs in Firebase Functions
- All routes handled by `functions/main.py`
- API routes under `/api/**` are proxied to Functions

#### Option B: Separate Backend (Recommended for Production)
1. Deploy Flask backend separately (Heroku, Railway, Render, etc.)
2. Update API endpoints in `static/script.js` to point to your backend URL
3. Deploy only static files to Firebase Hosting

### Updating API Endpoints

If deploying backend separately, update `static/script.js`:

```javascript
// Change from relative paths:
fetch('/api/endpoint')

// To absolute URLs:
fetch('https://your-backend-url.com/api/endpoint')
```

## Firebase Services

The Firebase configuration includes:
- **Hosting**: Static file hosting
- **Analytics**: Web analytics (configured in `static/firebase-config.js`)
- **Functions**: Serverless functions for backend (optional)

## Local Development

### Run Flask Locally

```bash
python app.py
```

### Test Firebase Locally

```bash
# Start Firebase emulators
firebase emulators:start
```

## Deployment Checklist

- [ ] Update `FLASK_SECRET_KEY` in production
- [ ] Set `SESSION_COOKIE_SECURE = True` for HTTPS
- [ ] Configure CORS if using separate backend
- [ ] Update environment variables
- [ ] Test all routes after deployment
- [ ] Set up custom domain (optional)

## Troubleshooting

### Functions Deployment Issues

- Ensure Python 3.11 is available
- Check `functions/requirements.txt` is correct
- Verify `functions/main.py` imports correctly

### Hosting Issues

- Ensure `public/` directory exists
- Check `firebase.json` configuration
- Review Firebase Console logs

## Support

For Firebase-specific issues, check:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [Firebase Functions Guide](https://firebase.google.com/docs/functions)

