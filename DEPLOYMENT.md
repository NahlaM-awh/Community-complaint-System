# Firebase Hosting Deployment Guide

This guide explains how to deploy the Community Complaint System to Firebase Hosting.

## Prerequisites

1. Install Node.js and npm
2. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
3. Login to Firebase:
   ```bash
   firebase login
   ```

## Project Structure

```
community-system/
├── app.py                 # Flask backend
├── static/                # Static files (CSS, JS, images)
├── templates/             # HTML templates
├── functions/             # Firebase Functions (Flask backend)
├── public/                # Public directory for static hosting
├── firebase.json          # Firebase configuration
├── .firebaserc           # Firebase project configuration
└── package.json          # Node.js dependencies
```

## Deployment Options

### Option 1: Firebase Hosting + Firebase Functions (Recommended)

This setup uses Firebase Hosting for static files and Firebase Functions for the Flask backend.

#### Step 1: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies for Firebase Functions
cd functions
pip install -r requirements.txt
cd ..
```

#### Step 2: Build Static Files

Since Flask serves templates dynamically, you'll need to either:
- Keep using Flask for templates (via Functions)
- Or pre-render static HTML files

For now, we'll use Firebase Functions to serve the Flask app.

#### Step 3: Deploy

```bash
# Deploy everything
firebase deploy

# Or deploy only hosting
firebase deploy --only hosting

# Or deploy only functions
firebase deploy --only functions
```

### Option 2: Firebase Hosting (Static) + Separate Backend

If you prefer to host the Flask backend separately (e.g., on Heroku, Railway, or Render):

1. Deploy Flask backend separately
2. Update API endpoints in `static/script.js` to point to your backend URL
3. Deploy static files to Firebase Hosting

#### Update API Endpoints

In `static/script.js`, update fetch URLs:
```javascript
// Change from:
fetch('/api/endpoint')

// To:
fetch('https://your-backend-url.com/api/endpoint')
```

## Configuration

### Firebase Project

The project is configured to use:
- **Project ID**: `community-complaint-syst-73dc7`
- **Hosting**: Static files served from `public/` directory
- **Functions**: Python 3.11 runtime

### Environment Variables

For production, update these in Firebase Functions:
- `FLASK_SECRET_KEY`: Change from default
- `SESSION_COOKIE_SECURE`: Set to `True` for HTTPS

## Local Development

### Run Flask Locally

```bash
python app.py
```

### Run Firebase Emulators

```bash
# Install emulator suite
firebase init emulators

# Start emulators
firebase emulators:start
```

## Post-Deployment

After deployment:

1. **Update CORS settings** if needed
2. **Configure custom domain** in Firebase Console
3. **Set up SSL certificate** (automatic with Firebase)
4. **Update session security** settings for production

## Troubleshooting

### Functions Not Deploying

- Check Python version (requires 3.11)
- Verify `requirements.txt` is correct
- Check Firebase Functions logs: `firebase functions:log`

### Hosting Issues

- Verify `public/` directory exists
- Check `firebase.json` configuration
- Review Firebase Hosting logs in console

### CORS Errors

- Update CORS settings in `functions/main.py`
- Add your domain to allowed origins

## Notes

- Firebase Hosting is free tier: 10 GB storage, 360 MB/day transfer
- Firebase Functions free tier: 2 million invocations/month
- Consider upgrading for production use

