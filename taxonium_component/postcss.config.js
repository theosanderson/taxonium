import prefixwrap from "postcss-prefixwrap";
import tailwind from "@tailwindcss/postcss";

export default {
  plugins: [tailwind(), prefixwrap(".taxonium", { nested: true })],
};
