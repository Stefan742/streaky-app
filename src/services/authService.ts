// src/services/authService.ts
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { User } from '../types';

// Generate unique friend code
function generateFriendCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'STRK-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check if friend code is unique (in production, use Firestore query)
async function isUniqueFriendCode(code: string): Promise<boolean> {
  try {
    const friendCodeDoc = await getDoc(doc(db, 'friendCodes', code));
    return !friendCodeDoc.exists();
  } catch (error) {
    console.error('Error checking friend code:', error);
    return true; // Fail open for now
  }
}

/**
 * Register a new user with Firebase Auth and create Firestore profile
 */
export async function registerWithFirebase(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    console.log('🔐 Starting Firebase registration...');
    console.log('📧 Email:', email);
    console.log('🔥 Auth instance:', !!auth);
    console.log('🔥 Auth app:', auth.app.name);
    
    // Validate inputs
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Name must be at least 2 characters' };
    }

    if (!email || !email.includes('@')) {
      return { success: false, error: 'Invalid email address' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    console.log('✅ Creating Firebase Auth user...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    console.log('✅ Auth user created:', firebaseUser.uid);

    // Update display name
    await updateProfile(firebaseUser, { displayName: name });
    console.log('✅ Display name updated');

    // Skip email verification for testing
    // await sendEmailVerification(firebaseUser);
    console.log('⏭️ Skipping email verification for testing');

    // Generate unique friend code
    console.log('🔑 Generating friend code...');
    let friendCode = generateFriendCode();
    let attempts = 0;
    while (!(await isUniqueFriendCode(friendCode)) && attempts < 10) {
      friendCode = generateFriendCode();
      attempts++;
    }

    if (attempts >= 10) {
      throw new Error('Failed to generate unique friend code');
    }
    console.log('✅ Friend code generated:', friendCode);

    // Create user document in Firestore
    const userData: User = {
      id: firebaseUser.uid,
      name: name.trim(),
      email,
      avatar: 'AvatarNormal',
      xp: 0,
      level: 1,
      streak: 1,
      friendCode,
      friends: [],
    };

    console.log('📝 Creating Firestore documents...');
    
    // Create user document
    console.log('  → Creating users document...');
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('  ✅ Users document created');

    // Create friend code lookup document
    console.log('  → Creating friendCodes document...');
    await setDoc(doc(db, 'friendCodes', friendCode), {
      userId: firebaseUser.uid,
      createdAt: serverTimestamp(),
    });
    console.log('  ✅ FriendCodes document created');

    // Initialize empty collections
    console.log('  → Creating quests document...');
    await setDoc(doc(db, 'quests', firebaseUser.uid), {
      quests: [],
      totalCompletedQuests: 0,
      todayCompletedCount: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      updatedAt: serverTimestamp(),
    });
    console.log('  ✅ Quests document created');

    console.log('  → Creating medals document...');
    await setDoc(doc(db, 'medals', firebaseUser.uid), {
      medals: [],
      unviewedCount: 0,
      updatedAt: serverTimestamp(),
    });
    console.log('  ✅ Medals document created');

    console.log('  → Creating activity document...');
    await setDoc(doc(db, 'activity', firebaseUser.uid), {
      activeDays: [],
      lastActiveDate: '',
      updatedAt: serverTimestamp(),
    });
    console.log('  ✅ Activity document created');

    console.log('🎉 Registration successful!');
    return { success: true, user: userData };
  } catch (error: any) {
    console.error('❌ Firebase registration error:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);

    let errorMessage = 'Registration failed';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email already exists';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.code === 'permission-denied' || error.message.includes('permission')) {
      errorMessage = 'Permission denied. Please check Firestore rules.';
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Login user with Firebase Auth
 */
export async function loginWithFirebase(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Fetch user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data() as User;

    return { success: true, user: { ...userData, id: firebaseUser.uid } };
  } catch (error: any) {
    console.error('Firebase login error:', error);

    let errorMessage = 'Login failed';
    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/invalid-credential'
    ) {
      errorMessage = 'Invalid email or password';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many attempts. Try again later.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your connection.';
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Logout user from Firebase
 */
export async function logoutFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase logout error:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);

    let errorMessage = 'Failed to send reset email';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Set up auth state listener
 * ИСПРАВЕНО: Креира Firestore документ ако не постои
 */
export function setupAuthListener(
  onUserChanged: (user: User | null, isGuest: boolean) => void
): () => void {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // User is signed in
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (userDoc.exists()) {
          // User document exists
          const userData = userDoc.data() as User;
          onUserChanged({ ...userData, id: firebaseUser.uid }, false);
        } else {
          // User document doesn't exist - create it (for old users)
          console.warn('⚠️ User document not found, creating one...');
          
          // Generate friend code
          let friendCode = generateFriendCode();
          let attempts = 0;
          while (!(await isUniqueFriendCode(friendCode)) && attempts < 10) {
            friendCode = generateFriendCode();
            attempts++;
          }

          const newUserData: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            avatar: 'AvatarNormal',
            xp: 0,
            level: 1,
            streak: 1,
            friendCode,
            friends: [],
          };

          // Create missing documents
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...newUserData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          await setDoc(doc(db, 'friendCodes', friendCode), {
            userId: firebaseUser.uid,
            createdAt: serverTimestamp(),
          });

          await setDoc(doc(db, 'quests', firebaseUser.uid), {
            quests: [],
            totalCompletedQuests: 0,
            todayCompletedCount: 0,
            lastResetDate: new Date().toISOString().split('T')[0],
            updatedAt: serverTimestamp(),
          });

          await setDoc(doc(db, 'medals', firebaseUser.uid), {
            medals: [],
            unviewedCount: 0,
            updatedAt: serverTimestamp(),
          });

          await setDoc(doc(db, 'activity', firebaseUser.uid), {
            activeDays: [],
            lastActiveDate: '',
            updatedAt: serverTimestamp(),
          });

          console.log('✅ User documents created');
          onUserChanged(newUserData, false);
        }
      } catch (error) {
        console.error('❌ Error in auth state listener:', error);
        onUserChanged(null, true);
      }
    } else {
      // User is signed out
      onUserChanged(null, true);
    }
  });

  return unsubscribe;
}