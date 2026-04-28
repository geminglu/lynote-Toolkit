/** @type {import("prettier").Config} */
const prettierConfig = {
  plugins: ["prettier-plugin-organize-imports", "prettier-plugin-tailwindcss"],
  tailwindStylesheet: "app/globals.css",
  tailwindFunctions: ["clsx", "cva", "cn"],
};

export default prettierConfig;
