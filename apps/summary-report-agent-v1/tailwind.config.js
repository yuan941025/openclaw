/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        mist: "#66748b",
        surface: "#fffefd",
        shell: "#f5f2ec",
        accent: "#5b5df6",
        accentSoft: "#ececff",
        sage: "#1b8a6b",
        warn: "#b97820",
        danger: "#c94b4b",
      },
      boxShadow: {
        card: "0 20px 60px rgba(18, 24, 38, 0.08)",
        soft: "0 18px 34px rgba(91, 93, 246, 0.18)",
      },
      backgroundImage: {
        "hero-wash":
          "radial-gradient(circle at top left, rgba(33, 87, 213, 0.12), transparent 34%), radial-gradient(circle at 85% 15%, rgba(29, 122, 99, 0.1), transparent 28%)",
      },
      fontFamily: {
        sans: ['"Aptos"', '"Segoe UI Variable Display"', '"Microsoft JhengHei"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
