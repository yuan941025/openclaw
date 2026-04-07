/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lobster: {
          ink: "#050816",
          surface: "#0b1125",
          surfaceAlt: "#111933",
          cyan: "#66e3ff",
          violet: "#8d7dff",
          glow: "#14cfff",
          rose: "#ff6aa6",
        },
      },
      boxShadow: {
        glow: "0 20px 80px rgba(20, 207, 255, 0.15)",
        card: "0 24px 60px rgba(2, 7, 23, 0.45)",
      },
      backgroundImage: {
        "grid-radial":
          "radial-gradient(circle at top left, rgba(102, 227, 255, 0.16), transparent 26%), radial-gradient(circle at top right, rgba(141, 125, 255, 0.18), transparent 32%), linear-gradient(140deg, rgba(7, 12, 29, 0.92), rgba(4, 8, 24, 0.98))",
      },
      animation: {
        "soft-pulse": "soft-pulse 2.4s ease-in-out infinite",
        "drift-line": "drift-line 6s linear infinite",
      },
      keyframes: {
        "soft-pulse": {
          "0%, 100%": { opacity: "0.55", transform: "scale(0.94)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        "drift-line": {
          "0%": { transform: "translateY(0%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};
