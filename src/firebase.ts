import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  Firestore,
  serverTimestamp
} from "firebase/firestore";

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
}

// Global cached instances
let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

// Try to load initial config from environment variables
const getEnvConfig = (): FirebaseConfig | null => {
  try {
    const metaEnv = (import.meta as any).env || {};
    const apiKey = metaEnv.VITE_FIREBASE_API_KEY;
    const projectId = metaEnv.VITE_FIREBASE_PROJECT_ID;
    const appId = metaEnv.VITE_FIREBASE_APP_ID;

    if (apiKey && projectId && appId) {
      return {
        apiKey,
        authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
        projectId,
        storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
        messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId,
        measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID
      };
    }

    // Try to parse an entire config JSON if provided
    const jsonConfig = metaEnv.VITE_FIREBASE_CONFIG;
    if (jsonConfig) {
      return JSON.parse(jsonConfig) as FirebaseConfig;
    }
  } catch (e) {
    console.warn("Failed to check environment Firebase configuration:", e);
  }
  return null;
};

// Internal initializer
export const initFirebase = (customConfig?: FirebaseConfig): { app: FirebaseApp; db: Firestore } | null => {
  try {
    const config = customConfig || getEnvConfig();
    if (!config || !config.apiKey || !config.projectId) {
      return null;
    }

    if (getApps().length > 0 && !customConfig) {
      appInstance = getApp();
    } else {
      // If we are re-initializing with a new custom config, we re-initialize
      appInstance = initializeApp(config, "ApexCapitalGame");
    }

    dbInstance = getFirestore(appInstance);
    return { app: appInstance, db: dbInstance };
  } catch (e) {
    console.error("Firebase dynamic initialization failed:", e);
    return null;
  }
};

// Check connection status
export const isFirebaseConnected = (): boolean => {
  return dbInstance !== null;
};

// Get Firestore instance
export const getDB = (): Firestore | null => {
  if (!dbInstance) {
    initFirebase();
  }
  return dbInstance;
};

// Save game state
export const saveGameToCloud = async (userName: string, gameState: any): Promise<boolean> => {
  const db = getDB();
  if (!db) return false;

  try {
    const sanitizedName = userName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (!sanitizedName) return false;

    const docRef = doc(db, "apex_saves", sanitizedName);
    await setDoc(docRef, {
      userName: userName.trim(),
      gameState: JSON.stringify(gameState),
      updatedAt: serverTimestamp(),
      netWorth: gameState.cash + (gameState.stocks || []).reduce((sum: number, s: any) => sum + (s.sharesOwned * s.currentPrice), 0)
    });
    return true;
  } catch (err) {
    console.error("Error saving game to Firestore:", err);
    return false;
  }
};

// Load game state
export const loadGameFromCloud = async (userName: string): Promise<any | null> => {
  const db = getDB();
  if (!db) return null;

  try {
    const sanitizedName = userName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (!sanitizedName) return null;

    const docRef = doc(db, "apex_saves", sanitizedName);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.gameState) {
        return JSON.parse(data.gameState);
      }
    }
  } catch (err) {
    console.error("Error loading game from Firestore:", err);
  }
  return null;
};
