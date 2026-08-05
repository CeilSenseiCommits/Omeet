import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// `main.tsx` is the bridge from the static HTML page to React.
// StrictMode adds useful development-only checks; it does not change the production UI.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
