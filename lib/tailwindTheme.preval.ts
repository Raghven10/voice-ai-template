import preval from "next-plugin-preval";
import tailwindConfig from "@/tailwind.config.js";

async function getTheme() {
  // In Tailwind v4, config is already usable directly
  return tailwindConfig.theme;
}

export default preval(getTheme());
