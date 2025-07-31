// --- FILE: src/firebase/config.js ---
// This file initializes Firebase and exports the necessary services.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// IMPORTANT: Replace with your actual Firebase project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyDb9_Hjszrz1-1F9lm-1CV1xzm_pCx-rf4",
  authDomain: "library-wiras.firebaseapp.com",
  projectId: "library-wiras",
  storageBucket: "library-wiras.firebasestorage.app",
  messagingSenderId: "185438919314",
  appId: "1:185438919314:web:e63d050be2c81678c1244b"
};

// Initialize Firebase
let app, db, auth;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase initialized successfully.");
} catch (e) {
    console.error("Firebase config is invalid. App will run in offline mode only.", e);
    // App will continue to run with db and auth as undefined.
    // The DataContext and AuthContext will handle this gracefully.
}

export { db, auth };
