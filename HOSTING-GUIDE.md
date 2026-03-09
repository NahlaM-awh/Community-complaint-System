# Firebase Hosting Guide - Windows CMD

This guide will help you deploy your Community Complaint System to Firebase Hosting using Windows Command Prompt (CMD).

## Prerequisites

Before starting, make sure you have:

1. **Node.js** installed (Download from https://nodejs.org/)
2. **Python 3.11** installed (for Firebase Functions)
3. **Git** (optional, for version control)

## Quick Start (3 Steps)

### Step 1: Initial Setup

Open **Command Prompt (CMD)** and navigate to your project folder:

```cmd
cd C:\Users\misri\OneDrive\Desktop\community-system
```

Run the setup script:

```cmd
setup-firebase.bat
```

This will:
- Install Firebase CLI
- Login to Firebase
- Install all dependencies

### Step 2: Deploy

Run the deployment script:

```cmd
deploy.bat
```

Or deploy manually:

```cmd
firebase deploy
```

### Step 3: Access Your Site

After deployment, your site will be available at:
- https://community-complaint-syst-73dc7.web.app
- https://community-complaint-syst-73dc7.firebaseapp.com

## Manual Setup (If Scripts Don't Work)

### 1. Install Firebase CLI

```cmd
npm install -g firebase-tools
```

### 2. Login to Firebase

```cmd
firebase login
```

This will open your browser. Login with your Google account.

### 3. Install Dependencies

```cmd
npm install
```

### 4. Install Python Dependencies (for Functions)

```cmd
cd functions
pip install -r requirements.txt
cd ..
```

### 5. Deploy

```cmd
firebase deploy
```

## Deployment Options

### Deploy Everything

```cmd
firebase deploy
```

### Deploy Only Hosting (Static Files)

```cmd
firebase deploy --only hosting
```

### Deploy Only Functions (Backend)

```cmd
firebase deploy --only functions
```

## Troubleshooting

### Error: 'firebase' is not recognized

**Solution:**
```cmd
npm install -g firebase-tools
```
Then close and reopen CMD.

### Error: 'node' is not recognized

**Solution:**
1. Install Node.js from https://nodejs.org/
2. Restart CMD after installation
3. Verify: `node --version`

### Error: 'python' is not recognized

**Solution:**
1. Install Python 3.11 from https://www.python.org/
2. Make sure to check "Add Python to PATH" during installation
3. Restart CMD
4. Verify: `python --version`

### Error: Firebase login failed

**Solution:**
```cmd
firebase logout
firebase login
```

### Error: Permission denied

**Solution:**
- Make sure you're logged in with the correct Google account
- Check Firebase Console: https://console.firebase.google.com/
- Verify project access

### Functions deployment fails

**Solution:**
1. Check Python version: `python --version` (should be 3.11)
2. Install dependencies: `cd functions && pip install -r requirements.txt`
3. Check `functions/main.py` for errors

## Common Commands

### Check Firebase Status

```cmd
firebase projects:list
```

### View Deployment History

```cmd
firebase hosting:channel:list
```

### View Logs

```cmd
firebase functions:log
```

### Open Firebase Console

```cmd
firebase open
```

## Project Structure

```
community-system/
├── app.py                    # Flask backend
├── static/                    # Static files (CSS, JS)
├── templates/                 # HTML templates
├── functions/                 # Firebase Functions
│   ├── main.py              # Function entry point
│   └── requirements.txt     # Python dependencies
├── firebase.json             # Firebase config
├── .firebaserc              # Project config
├── package.json             # Node.js dependencies
├── setup-firebase.bat       # Setup script
└── deploy.bat               # Deployment script
```

## After Deployment

1. **Test your site** - Visit the URLs provided
2. **Check Firebase Console** - https://console.firebase.google.com/
3. **Monitor usage** - Check Firebase Console for analytics
4. **Update if needed** - Make changes and run `firebase deploy` again

## Important Notes

- **Free Tier Limits:**
  - Hosting: 10 GB storage, 360 MB/day transfer
  - Functions: 2 million invocations/month
  
- **Security:**
  - Update `FLASK_SECRET_KEY` in production
  - Set `SESSION_COOKIE_SECURE = True` for HTTPS

- **Custom Domain:**
  - Add custom domain in Firebase Console
  - Follow DNS setup instructions

## Need Help?

- Firebase Docs: https://firebase.google.com/docs
- Firebase Support: https://firebase.google.com/support
- Check deployment logs in Firebase Console

