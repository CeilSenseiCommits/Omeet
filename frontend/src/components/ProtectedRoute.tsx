import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="text-xs text-zinc-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user && !user.isOnboarded)) {
    // Redirect to login (which will present the OnboardingCard if authenticated but not onboarded)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
