import Dashboard from "./pages/Dashboard";

/**
 * App is the composition root: it decides which top-level page React should render.
 * When we add routing, this is where a router will select Dashboard, an organization
 * workspace, or a meeting screen without changing the components themselves.
 */
function App() {
  return <Dashboard />;
}

export default App;
