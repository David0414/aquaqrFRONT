// src/Routes.jsx
import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate, useLocation } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";

import HomeDashboard from "./pages/home-dashboard";
import TransactionComplete from "./pages/transaction-complete";
import TransactionHistory from "./pages/transaction-history";
import BalanceRecharge from "./pages/balance-recharge";
import QRScannerLanding from "./pages/qr-scanner-landing";
import UserProfileSettings from "./pages/user-profile-settings";
import FillingProgress from "./pages/filling-progress";

// Flujo por pantallas
import FlowProvider from "./pages/water-dispensing-control/FlowProvider";
import WaterFlowLayout from "./pages/water-dispensing-control/WaterFlowLayout";
import SelectAmount from "./pages/water-dispensing-control/screens/SelectAmount";
import PlaceBottleDown from "./pages/water-dispensing-control/screens/PlaceBottleDown";
import PlaceBottleUp from "./pages/water-dispensing-control/screens/PlaceBottleUp";

// Auth
import UserLogin from "./pages/user-login";
import UserRegistration from "./pages/user-registration";

const Protected = ({ children }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut><Navigate to="/user-login" replace /></SignedOut>
  </>
);

function LayoutHeader() {
  const { pathname } = useLocation();
  const isAuthRoute = pathname.startsWith("/user-login") || pathname.startsWith("/user-registration");
  if (isAuthRoute) return null;
  return null;
}

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <LayoutHeader />
        <RouterRoutes>
          <Route
            path="/"
            element={
              <>
                <SignedIn><Navigate to="/home-dashboard" replace /></SignedIn>
                <SignedOut><Navigate to="/user-login" replace /></SignedOut>
              </>
            }
          />

          {/* Auth */}
          <Route path="/user-login/*" element={<UserLogin />} />
          <Route path="/user-registration/*" element={<UserRegistration />} />

          {/* Flujo por pantallas */}
          <Route
            path="/water"
            element={
              <Protected>
                <FlowProvider>
                  <WaterFlowLayout />
                </FlowProvider>
              </Protected>
            }
          >
            <Route index element={<Navigate to="choose" replace />} />
            <Route path="choose" element={<SelectAmount />} />
            <Route path="position-down" element={<PlaceBottleDown />} />
            <Route path="position-up" element={<PlaceBottleUp />} />
            {/* compat de rutas antiguas */}
            <Route path="payment" element={<Navigate to="position-up" replace />} />
          </Route>

          {/* Compatibilidad: ruta antigua */}
          <Route path="/water-dispensing-control" element={<Navigate to="/water/choose" replace />} />

          {/* Protegidas */}
          <Route path="/home-dashboard" element={<Protected><HomeDashboard /></Protected>} />
          <Route path="/transaction-complete" element={
            <Protected>
              <FlowProvider>{/* opcional, por si quieres leer lastTx */}
                <TransactionComplete />
              </FlowProvider>
            </Protected>
          } />
          <Route path="/transaction-history" element={<Protected><TransactionHistory /></Protected>} />
          <Route path="/balance-recharge" element={<Protected><BalanceRecharge /></Protected>} />
          <Route path="/user-profile-settings" element={<Protected><UserProfileSettings /></Protected>} />

          {/* Envuelve filling-progress con Provider para no perder contexto */}
          <Route path="/filling-progress" element={
            <Protected>
              <FlowProvider>
                <FillingProgress />
              </FlowProvider>
            </Protected>
          } />

          {/* Pública */}
          <Route path="/qr-scanner-landing" element={<QRScannerLanding />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
