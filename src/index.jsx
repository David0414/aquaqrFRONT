import React from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { esES } from "@clerk/localizations";
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";

const root = createRoot(document.getElementById("root"));
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) throw new Error("Falta VITE_CLERK_PUBLISHABLE_KEY");

root.render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      localization={esES}
      signInUrl="/user-login"
      signUpUrl="/user-registration"
      afterSignInUrl="/home-dashboard"
      afterSignUpUrl="/home-dashboard"
      appearance={{
        variables: {
          colorPrimary: "#06b6d4",
          colorText: "#0f172a",
          colorBackground: "transparent",
          borderRadius: "14px",
          fontSize: "14px",
        },
        elements: {
          card: "bg-white/95 backdrop-blur-sm shadow-xl border border-black/5 !p-0",
          header: "hidden",
          formButtonPrimary: "bg-black text-white rounded-xl h-11 hover:bg-black/90",
          formFieldInput: "h-11 rounded-xl border-border focus:ring-2 focus:ring-cyan-500/30",
          footer: "hidden",
          socialButtonsBlockButton: "rounded-xl h-11 border-border hover:bg-muted/50",
          socialButtonsBlockButtonText: "text-text-primary",
          dividerRow: "text-text-secondary",
          identityPreview: "rounded-xl bg-muted/40 border-border",
        },
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
