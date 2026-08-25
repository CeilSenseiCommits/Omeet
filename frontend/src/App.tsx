import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import OrgWorkspaceLayout from "./components/organization/OrgWorkspaceLayout";
import Dashboard from "./pages/Dashboard";
import PublicProfilePage from "./pages/PublicProfilePage";
import InvitationPage from "./pages/InvitationPage";

/**
 * App is the composition root: it decides which top-level page React should render.
 * When we add routing, this is where a router will select Dashboard, an organization
 * workspace, or a meeting screen without changing the components themselves.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/organization/:organizationId" element={<OrgWorkspaceLayout />} />
        <Route path="/profile/:userId" element={<PublicProfilePage />} />
        <Route path="/invitation/:userId" element={<InvitationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
