import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";

import HomeDashboard from './pages/home-dashboard';
import TransactionComplete from './pages/transaction-complete';
import WaterDispensingControl from './pages/water-dispensing-control';
import TransactionHistory from './pages/transaction-history';
import BalanceRecharge from './pages/balance-recharge';
import QRScannerLanding from './pages/qr-scanner-landing';
import UserProfileSettings from './pages/user-profile-settings';
import FillingProgress from './pages/filling-progress';

import UserLogin from './pages/user-login';
import UserRegistration from './pages/user-registration';

const Protected = ({ children }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut><Navigate to="/user-login" replace /></SignedOut>
  </>
);

function LayoutHeader() {
  const { pathname } = useLocation();
  const isAuthRoute =
    pathname.startsWith('/user-login') || pathname.startsWith('/user-registration');
  if (isAuthRoute) return null;               // 👈 no mostramos header en auth
  return (
    <header className="p-3 flex justify-end">
      <SignedIn><UserButton /></SignedIn>
    </header>
  );
}

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />

        <LayoutHeader /> {/* 👈 header condicionado */}

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

          {/* Auth con TU layout (OJO al /*) */}
          <Route path="/user-login/*" element={<UserLogin />} />
          <Route path="/user-registration/*" element={<UserRegistration />} />

          {/* PROTEGIDAS */}
          <Route path="/home-dashboard" element={<Protected><HomeDashboard /></Protected>} />
          <Route path="/transaction-complete" element={<Protected><TransactionComplete /></Protected>} />
          <Route path="/water-dispensing-control" element={<Protected><WaterDispensingControl /></Protected>} />
          <Route path="/transaction-history" element={<Protected><TransactionHistory /></Protected>} />
          <Route path="/balance-recharge" element={<Protected><BalanceRecharge /></Protected>} />
          <Route path="/user-profile-settings" element={<Protected><UserProfileSettings /></Protected>} />
          <Route path="/filling-progress" element={<Protected><FillingProgress /></Protected>} />

          {/* Públicas */}
          <Route path="/qr-scanner-landing" element={<QRScannerLanding />} />
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
