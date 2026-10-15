// ESLint: prüft die Regeln aus CODING-RULES.md, die sich am Code ablesen lassen.
// Ausführen: npm run lint. Alte Verstösse stehen in eslint-suppressions.json und dürfen nur weniger werden.
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
      // Regel 17: Hooks und ihre Abhängigkeiten
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      // Regel 5: nur löschbare TypeScript-Syntax (Node Type Stripping)
      "no-restricted-syntax": ["error",
        { selector: "TSEnumDeclaration", message: "No enum (rule 5): use a union of string literals or an `as const` array." },
        { selector: "TSModuleDeclaration[kind='namespace']", message: "No namespace (rule 5)." },
        { selector: "TSParameterProperty", message: "No parameter properties (rule 5)." },
        { selector: "Decorator", message: "No decorators (rule 5)." },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],

      // Regel 9: lesbare Namen
      "id-length": ["error", { min: 2, exceptions: ["_", "x", "y"], properties: "never" }],
      "id-denylist": ["error", "ctx", "cfg", "msg", "btn", "ct", "cts", "vm", "tmp", "err", "evt", "val", "str", "arr", "obj", "num", "idx", "cb"],

      // Regel 8 und 3: Typen PascalCase, keine I-Präfixe
      "@typescript-eslint/naming-convention": ["error",
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "interface", format: ["PascalCase"], custom: { regex: "^I[A-Z]", match: false } },
      ],

      // Regel 15: kein any ausser an markierten Grenzen (mit eslint-disable-next-line und Begründung)
      "@typescript-eslint/no-explicit-any": "error",

      // Regel 30: keine vergessenen Promises
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],

      // SOLID: Dateien und Funktionen klein halten
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", { max: 60, skipBlankLines: true, skipComments: true, IIFEs: true }],
    },
  },

  // Regel 21: Renderer für Videos und GIFs hängen nur von t ab
  {
    files: ["src/stinger.ts", "src/banners.ts"],
    rules: {
      "no-restricted-properties": ["error",
        { object: "Math", property: "random", message: "Renderers are pure functions of t (rule 21): use hash()." },
        { object: "Date", property: "now", message: "Renderers are pure functions of t (rule 21)." },
      ],
    },
  },

  // Regel 4: der Kern kennt keine Themes
  {
    files: ["src/core/**"],
    rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["**/themes/**"], message: "Core never imports a theme (rule 4)." }] }] },
  },

  // Checks dürfen grosse Testfälle haben; die Konfiguration selbst ist JavaScript
  { files: ["**/*.check.ts"], rules: { "max-lines-per-function": "off" } },
  { files: ["**/*.js"], ...tseslint.configs.disableTypeChecked },
);
