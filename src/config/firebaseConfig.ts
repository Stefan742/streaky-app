// src/config/firebaseConfig.ts
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCEpdeQIZjttEJ3dfXnkvINVwhJce_Nwzs",
  authDomain: "streaky-app-1afc4.firebaseapp.com",
  projectId: "streaky-app-1afc4",
  storageBucket: "streaky-app-1afc4.firebasestorage.app",
  messagingSenderId: "158177558372",
  appId: "1:158177558372:web:abf2dab71cad965c578471"
};
// Initialize Firebase (avoid re-initialization)
const app: FirebaseApp = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApps()[0];

// Initialize services
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Log initialization (remove in production)
console.log('🔥 Firebase initialized');
console.log('📱 Project ID:', firebaseConfig.projectId);

export { app, auth, db };
export default app;
