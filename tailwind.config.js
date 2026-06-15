module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 500: "#3a5fec", 600: "#2542d4", 700: "#1e33b0", 400: "#5e84f7", 300: "#93b0ff" },
        surface: { DEFAULT: "#0f1117", 1: "#161b27", 2: "#1d2335", 3: "#242b40", 4: "#2d3652" },
        ink: { DEFAULT: "#f0f2f8", muted: "#8b93a8", faint: "#4a5368" }
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"], mono: ["JetBrains Mono", "monospace"] }
    }
  },
  plugins: []
};
