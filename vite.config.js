import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Para GitHub Pages el sitio se sirve desde /nivel20-cards/
export default defineConfig({
    base: "/nivel20-cards/",
    plugins: [react()],
});
