import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  plugins: [
    plugin((api) => {
      api.addUtilities({
        ".form-select-bg": {
          "background-image":
            `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3e%3cpath d='M7 7l3-3 3 3m0 6l-3 3-3-3' stroke='%239fa6b2' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e")`,
          "background-position": "right 0.5rem center",
          "background-size": "1.5em 1.5em",
          "background-repeat": "no-repeat",
        },
      });
    }),
  ],
  theme: {
    extend: {
      colors: {
        fresh: "#FFDB1E",
        lightBackground: "#ffffff",
        darkBackground: "#28292A", /* "#1e1e1e" */
        lightText: "#1e1e1e",
        darkText: "#C7C7C7",  /* #d5d5ebc7 */
        primaryLight: "#007aff",
        primaryDark: "#0d6efd",
      },
      animation: {
        rotate: "rotate 10s linear infinite",
      },
      keyframes: {
        rotate: {
          "0%": { transform: "rotate(0deg) scale(10)" },
          "100%": { transform: "rotate(-360deg) scale(10)" },
        },
      },
    },
  },
  darkMode: "selector",
} satisfies Config;
