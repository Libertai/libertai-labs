import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://labs.libertai.io",
  vite: {
    plugins: [tailwindcss()],
  },
});
