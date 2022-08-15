import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import daisyui from "daisyui";

const tailwindConfig = {
  content: ["./src/**/*.{svelte,js,ts}"],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#fef08a",
          secondary: "#a8a29e",
          accent: "#fdba74",
          neutral: "#78716c",
          "base-100": "#f5f5f4",
          info: "#57534e",
          success: "#22c55e",
          warning: "#facc15",
          error: "#f87171",
        },
      },
    ],
  },
  plugins: [daisyui],
};

const config = {
  plugins: [tailwindcss(tailwindConfig), autoprefixer],
};

export default config;
