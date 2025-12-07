import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useLocation } from "wouter";
import { apiUrl } from "@/lib/api";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, collegeId?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for redirect result (if user was redirected from Google Sign-In)
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          // User signed in via redirect
          const handleRedirectSignIn = async () => {
            try {
              const token = await result.user.getIdToken();
              const response = await fetch(apiUrl("/api/auth/firebase"), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  firebaseUid: result.user.uid,
                  email: result.user.email,
                  displayName: result.user.displayName,
                  token,
                }),
                credentials: "include",
              });

              if (response.ok) {
                setLocation("/");
              }
            } catch (error) {
              console.error("Error handling redirect sign-in:", error);
            }
          };
          handleRedirectSignIn();
        }
      })
      .catch((error) => {
        console.error("Error getting redirect result:", error);
      });

    // Firebase auth state listener - only update state, don't trigger navigation
    // This prevents constant page refreshes while still tracking auth state
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Only update user state, don't trigger any side effects that cause refreshes
      setUser(firebaseUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [setLocation]);

  const signUp = useCallback(async (email: string, password: string, username: string, collegeId?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      // Create user record in backend
      const response = await fetch(apiUrl("/api/auth/signup"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid: userCredential.user.uid,
          email,
          username,
          collegeId,
          token,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Signup failed");
      }

      setLocation("/");
    } catch (error: any) {
      throw error;
    }
  }, [setLocation]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      // Verify with backend
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      setLocation("/");
    } catch (error: any) {
      throw error;
    }
  }, [setLocation]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Set additional OAuth parameters for better popup support
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Try popup first, fallback to redirect if popup fails
      let userCredential;
      try {
        userCredential = await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        // If popup fails (e.g., blocked by browser or COOP policy), use redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.message?.includes('Cross-Origin-Opener-Policy')) {
          console.log("Popup blocked or COOP issue, using redirect instead...");
          // Use redirect as fallback
          await signInWithRedirect(auth, provider);
          // Don't throw error - redirect will happen
          return;
        }
        // For other errors, throw them
        throw popupError;
      }
      
      // If we got here, popup worked
      const token = await userCredential.user.getIdToken();

      // Sync with backend
      const response = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          token,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Google sign-in failed");
      }

      setLocation("/");
    } catch (error: any) {
      // Only throw if it's not a redirect (redirect doesn't throw)
      if (error.code !== 'auth/popup-blocked' && 
          error.code !== 'auth/popup-closed-by-user') {
        throw error;
      }
    }
  }, [setLocation]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      await fetch(apiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
      setLocation("/start");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [setLocation]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    isAuthenticated: !!user,
  }), [user, loading, signUp, signIn, signInWithGoogle, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

