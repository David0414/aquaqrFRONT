import React from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider, ClerkLoaded, ClerkLoading, ClerkFailed } from "@clerk/clerk-react";
import { esES } from "@clerk/localizations";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import StartupStatus from "./components/StartupStatus";
import "./styles/tailwind.css";
import "./styles/index.css";

const root = createRoot(document.getElementById("root"));
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) console.error("Falta VITE_CLERK_PUBLISHABLE_KEY");

root.render(
  <React.StrictMode>
    <ErrorBoundary>
    {publishableKey ? (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={esES}
      signInUrl="/user-login"
      signUpUrl="/user-registration"
      signInForceRedirectUrl="/account-redirect"
      signUpForceRedirectUrl="/account-redirect"
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
      <ClerkLoading><StartupStatus /></ClerkLoading>
      <ClerkFailed><StartupStatus failed /></ClerkFailed>
      <ClerkLoaded><App /></ClerkLoaded>
    </ClerkProvider>
    ) : <StartupStatus failed />}
    </ErrorBoundary>
  </React.StrictMode>
);
