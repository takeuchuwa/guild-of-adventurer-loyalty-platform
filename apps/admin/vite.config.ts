import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
    server: {
        // Bind every interface so the panel is reachable from other devices on the
        // LAN (phones, a second laptop) — the default is loopback only.
        host: true,
        port: 5173,
        // Fail loudly instead of drifting to 5174, which the LAN firewall rule
        // would not cover.
        strictPort: true,
    },
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
