import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Vite reads this file when it starts the development server or creates a production build.
// Plugins teach Vite how to transform React JSX and Tailwind utility classes.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
