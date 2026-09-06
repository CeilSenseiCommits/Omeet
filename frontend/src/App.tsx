import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import OrgWorkspaceLayout from "./components/organization/OrgWorkspaceLayout";
import Dashboard from "./pages/Dashboard";
import CreateOrganization from "./pages/CreateOrganization";
import PublicProfilePage from "./pages/PublicProfilePage";
import InvitationPage from "./pages/InvitationPage";
import InvitationPreviewPage from "./pages/InvitationPreviewPage";
import InviteToOrganization from "./pages/InviteToOrganization";
import MeetingRoomPage from "./pages/MeetingRoomPage";
import LoginPage from "./pages/LoginPage";
import OrgPublicProfilePage from "./pages/OrgPublicProfilePage";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "849392532717-c4p20o7rriomk82nvjmvd7rqjvqqf3th.apps.googleusercontent.com";

/**
 * App is the composition root:
 * - GoogleOAuthProvider enables real Google OAuth login popups.
 * - AuthProvider supplies the session state to the application.
 * - Every page is wrapped in ProtectedRoute to verify the user is logged in.
 * - If unauthenticated, users are redirected to /login.
 * - Once authenticated with Google, users are directed to the home page or intended destination.
 */
function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Route */}
            <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-organization"
            element={
              <ProtectedRoute>
                <CreateOrganization />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/:organizationId"
            element={
              <ProtectedRoute>
                <OrgWorkspaceLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization/:organizationId/invite"
            element={
              <ProtectedRoute>
                <InviteToOrganization />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute>
                <PublicProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invitation/:userId"
            element={
              <ProtectedRoute>
                <InvitationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invitation-preview/:invitationId"
            element={
              <ProtectedRoute>
                <InvitationPreviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meeting/:meetingCode"
            element={
              <ProtectedRoute>
                <MeetingRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org-profile/:id"
            element={
              <ProtectedRoute>
                <OrgPublicProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization-profile/:id"
            element={
              <ProtectedRoute>
                <OrgPublicProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </GoogleOAuthProvider>
);
}

export default App;
