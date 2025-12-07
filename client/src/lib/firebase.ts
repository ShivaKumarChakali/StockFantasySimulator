import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARhao1l-P-Z4crtMZ7MUrhD7_IrOQhcIE",
  authDomain: "stockfantasysimulator.firebaseapp.com",
  projectId: "stockfantasysimulator",
  storageBucket: "stockfantasysimulator.firebasestorage.app",
  messagingSenderId: "357315531066",
  appId: "1:357315531066:web:49b1e0f8d793ab46eec003",
  measurementId: "G-5490B4ZM12"
};

// Initialize Firebase (only if not already initialized)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const auth: Auth = getAuth(app);

// Configure auth settings for better popup support
if (typeof window !== "undefined") {
  // Set auth domain to allow popups
  auth.settings.appVerificationDisabledForTesting = false;
}

// Initialize Analytics (only in browser, not SSR)
export let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export default app;

