import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import UserLogin from './pages/user-login';
import HomeDashboard from './pages/home-dashboard';
import TransactionComplete from './pages/transaction-complete';
import WaterDispensingControl from './pages/water-dispensing-control';
import TransactionHistory from './pages/transaction-history';
import BalanceRecharge from './pages/balance-recharge';
import QRScannerLanding from './pages/qr-scanner-landing';
import UserProfileSettings from './pages/user-profile-settings';
import UserRegistration from './pages/user-registration';
import FillingProgress from './pages/filling-progress';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<BalanceRecharge />} />
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/home-dashboard" element={<HomeDashboard />} />
        <Route path="/transaction-complete" element={<TransactionComplete />} />
        <Route path="/water-dispensing-control" element={<WaterDispensingControl />} />
        <Route path="/transaction-history" element={<TransactionHistory />} />
        <Route path="/balance-recharge" element={<BalanceRecharge />} />
        <Route path="/qr-scanner-landing" element={<QRScannerLanding />} />
        <Route path="/user-profile-settings" element={<UserProfileSettings />} />
        <Route path="/user-registration" element={<UserRegistration />} />
        <Route path="/filling-progress" element={<FillingProgress />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
