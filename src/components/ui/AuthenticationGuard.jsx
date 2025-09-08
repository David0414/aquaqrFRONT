import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';

const AuthenticationGuard = ({ 
  children, 
  redirectPath = '/user-login',
  checkAuthentication = () => {
    // Default authentication check - replace with your auth logic
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('userData');
    return !!(token && user);
  }
}) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Public routes that don't require authentication
  const publicRoutes = [
    '/qr-scanner-landing',
    '/user-registration', 
    '/user-login'
  ];

  const isPublicRoute = publicRoutes?.includes(location?.pathname);

  useEffect(() => {
    const validateAuth = async () => {
      try {
        const authStatus = await checkAuthentication();
        setIsAuthenticated(authStatus);
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateAuth();
  }, [location?.pathname, checkAuthentication]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary text-body-sm">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Allow access to public routes regardless of auth status
  if (isPublicRoute) {
    // If user is already authenticated and tries to access login/register, redirect to dashboard
    if (isAuthenticated && (location?.pathname === '/user-login' || location?.pathname === '/user-registration')) {
      return <Navigate to="/home-dashboard" replace />;
    }
    return children;
  }

  // Redirect to login if not authenticated and trying to access protected route
  if (!isAuthenticated) {
    // Preserve the intended destination for post-login redirect
    const redirectTo = location?.pathname !== '/' ? location?.pathname : '/home-dashboard';
    localStorage.setItem('redirectAfterLogin', redirectTo);
    
    return <Navigate to={redirectPath} replace />;
  }

  // User is authenticated and accessing protected route
  return children;
};

export default AuthenticationGuard;