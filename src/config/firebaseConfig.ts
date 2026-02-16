// src/config/firebaseConfig.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyCEpdeQIZjttEJ3dfXnkvINVwhJce_Nwzs",
  authDomain: "streaky-app-1afc4.firebaseapp.com",
  projectId: "streaky-app-1afc4",
  storageBucket: "streaky-app-1afc4.firebasestorage.app",
  messagingSenderId: "158177558372",
  appId: "1:158177558372:web:abf2dab71cad965c578471"
};

const app: FirebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

let auth: Auth;

if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    // firebase/auth exports getReactNativePersistence at runtime in v12,
    // but the TypeScript declarations are missing it.
    // We cast the module to `any` to bypass the TS check without subpath imports.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firebaseAuth = require('firebase/auth') as any;
    const persistence = firebaseAuth.getReactNativePersistence(AsyncStorage);

    auth = initializeAuth(app, { persistence });
    console.log('🔐 Auth initialized with AsyncStorage persistence');
  } catch (error: any) {
    console.log('⚠️ Auth already initialized, using existing instance');
    auth = getAuth(app);
  }
}

const db: Firestore = getFirestore(app);

console.log('🔥 Firebase initialized');
console.log('📱 Project ID:', firebaseConfig.projectId);
console.log('🔐 Auth configured:', !!auth);

export { app, auth, db };
export default app;