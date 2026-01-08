import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-merriweather)", "Georgia", "serif"],
      },
      colors: {
        notion: {
          bg: "#FFFFFF",
          sidebar: "#F7F7F5",
          hover: "#EFEFED",
          active: "rgba(55, 53, 47, 0.08)",
          text: "#37352F",
          "text-light": "rgba(55, 53, 47, 0.65)",
          "text-lighter": "rgba(55, 53, 47, 0.45)",
          border: "#E9E9E7",
        },
      },
    },
  },
  plugins: [],
};

export default config;
