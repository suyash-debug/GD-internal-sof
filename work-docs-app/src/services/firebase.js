import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB55oCrR7ZOfEBvwDFzxbnaZRn0ondZ8A4",
  authDomain: "gd-internal-sof.firebaseapp.com",
  projectId: "gd-internal-sof",
  storageBucket: "gd-internal-sof.firebasestorage.app",
  messagingSenderId: "450456616278",
  appId: "1:450456616278:web:6df2884aa352e8c395aaf7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Optional: Configure Google provider to select account every time
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
