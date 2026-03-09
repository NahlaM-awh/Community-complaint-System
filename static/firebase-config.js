// Firebase Configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB2vBHrariUmPhCXF2Z-Wo8m4t1XJp2gf8",
  authDomain: "community-complaint-syst-73dc7.firebaseapp.com",
  projectId: "community-complaint-syst-73dc7",
  storageBucket: "community-complaint-syst-73dc7.firebasestorage.app",
  messagingSenderId: "567806840126",
  appId: "1:567806840126:web:c49df7c8437da06b48706f",
  measurementId: "G-3XHDY5P6XN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export for use in other files
export { app, analytics };

