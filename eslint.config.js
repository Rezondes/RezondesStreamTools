// ESLint: checks the rules from CODING-RULES.md that can be read from the code.
// Run: npm run lint. Old violations are in eslint-suppressions.json and may only get fewer.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist/", "render/", "data/", "node_modules/", "config/"] },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      // Rule 17: hooks and their dependencies
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      // Rule 5: only erasable TypeScript syntax (Node type stripping)
      "no-restricted-syntax": ["error",
        { selector: "TSEnumDeclaration", message: "No enum (rule 5): use a union of string literals or an `as const` array." },
        { selector: "TSModuleDeclaration[kind='namespace']", message: "No namespace (rule 5)." },
        { selector: "TSParameterProperty", message: "No parameter properties (rule 5)." },
        { selector: "Decorator", message: "No decorators (rule 5)." },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],

      // Rule 9: readable names
      "id-length": ["error", { min: 2, exceptions: ["_", "x", "y"], properties: "never" }],
      "id-denylist": ["error", "ctx", "cfg", "msg", "btn", "ct", "cts", "vm", "tmp", "err", "evt", "val", "str", "arr", "obj", "num", "idx", "cb"],

      // Rules 8 and 3: types PascalCase, no I prefixes
      "@typescript-eslint/naming-convention": ["error",
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "interface", format: ["PascalCase"], custom: { regex: "^I[A-Z]", match: false } },
      ],

      // Rule 15: no any except at marked boundaries (with eslint-disable-next-line and a reason)
      "@typescript-eslint/no-explicit-any": "error",

      // Rule 30: no forgotten promises
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],

      // SOLID: keep files and functions small
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", { max: 60, skipBlankLines: true, skipComments: true, IIFEs: true }],
    },
  },

  // Rule 21: renderers for videos and GIFs depend only on t
  {
    files: ["src/stinger.ts", "src/banners.ts"],
    rules: {
      "no-restricted-properties": ["error",
        { object: "Math", property: "random", message: "Renderers are pure functions of t (rule 21): use hash()." },
        { object: "Date", property: "now", message: "Renderers are pure functions of t (rule 21)." },
      ],
    },
  },

  // Rule 4: the core knows no themes
  {
    files: ["src/core/**"],
    rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["**/themes/**"], message: "Core never imports a theme (rule 4)." }] }] },
  },

  // Checks may have large test cases; the configuration itself is JavaScript
  { files: ["**/*.check.ts"], rules: { "max-lines-per-function": "off" } },
  { files: ["**/*.js"], ...tseslint.configs.disableTypeChecked },
);
