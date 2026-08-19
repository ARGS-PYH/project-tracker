import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAczm4IqEjv5qWREvD_mBLhqBjTXz8DBmY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pltk-e38ef.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pltk-e38ef",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pltk-e38ef.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "957279619280",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:957279619280:web:853bba4c69cc53a0cd36d5",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-E9K0MKYPTM"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
export const db = getFirestore(app)
export const isFirebaseConfigured = true
