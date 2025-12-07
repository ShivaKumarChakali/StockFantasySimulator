import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App";
import "./index.css";

// Initialize Capacitor (only in mobile app, not in browser)
if (Capacitor.isNativePlatform()) {
  // Import platform-specific code if needed
  import("@capacitor/splash-screen").then(({ SplashScreen }) => {
    SplashScreen.hide();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
