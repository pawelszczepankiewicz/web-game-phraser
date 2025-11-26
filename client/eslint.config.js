import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        Phaser: "readonly",
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        clearTimeout: "readonly",
        localStorage: "readonly",
        CustomEvent: "readonly",
        Date: "readonly",
        Math: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "vue/multi-word-component-names": "off",
    },
  },
];
