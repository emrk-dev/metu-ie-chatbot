// Author: emrk-dev
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        metu: {
          navy: "#003366",
          red:  "#CC0000",
          light: "#E8F0F7",
        },
      },
    },
  },
  plugins: [],
};

export default config;
