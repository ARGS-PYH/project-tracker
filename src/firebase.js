import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_demo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "homeostracker.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "homeostracker",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "homeostracker.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
export const db = getFirestore(app)
export const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_PROJECT_ID || true
