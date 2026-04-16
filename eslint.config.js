const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const perfectionist = require("eslint-plugin-perfectionist");

module.exports = tseslint.config([
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      perfectionist,
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "comma-dangle": ["error", "always-multiline"],
      "perfectionist/sort-imports": [
        "error",
        {
          type: "line-length",
          order: "asc",
          newlinesBetween: 1,
          groups: [
            "side-effect",
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "unknown",
          ],
        },
      ],
    },
  },
]);