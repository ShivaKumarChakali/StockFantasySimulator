import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App | null = null;
let auth: Auth | null = null;

// Initialize Firebase Admin (for server-side token verification)
if (getApps().length === 0) {
  // For production, use service account from environment variable
  // For development, you can use the project ID directly
  const projectId = process.env.FIREBASE_PROJECT_ID || "stockfantasysimulator";
  
  try {
    // Try to initialize with service account (if available)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        app = initializeApp({
          credential: cert(serviceAccount),
          projectId,
        });
        console.log("✅ Firebase Admin initialized with service account");
      } catch (parseError) {
        console.warn("⚠️  Failed to parse FIREBASE_SERVICE_ACCOUNT, using project ID only");
        app = initializeApp({
          projectId,
        });
      }
    } else {
      // Fallback: Initialize without service account (for development)
      // This will use Application Default Credentials or project ID
      app = initializeApp({
        projectId,
      });
      console.log("✅ Firebase Admin initialized with project ID (development mode)");
    }
    
    auth = getAuth(app);
  } catch (error: any) {
    console.error("❌ Firebase Admin initialization failed:", error.message || error);
    console.warn("⚠️  Firebase token verification will not work. Authentication may fail.");
    // Set to null so we can check later
    app = null;
    auth = null;
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  console.log("✅ Firebase Admin already initialized");
}

export { auth, app };

