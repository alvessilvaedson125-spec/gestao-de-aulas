
/* eslint-env browser */
// eslint.config.mjs — Flat config (ESLint 9)
import js from "@eslint/js";

export default [
  js.configs.recommended,

  // Padrão do app no browser
  {
    files: ["**/*.js"],
    ignores: [
      "node_modules/**",
      ".firebase/**",
      "dist/**",
      "build/**",
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
      },
    },
  },

  // Arquivos de TESTE (Jest + Node + CommonJS)
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        // Jest
        describe: "readonly",
        test: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        afterEach: "readonly",
        // Node helpers usados nos testes
        require: "readonly",
        __dirname: "readonly",
        module: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
    },
  },

  // Service worker do Firebase (importScripts + firebase são globais)
  {
    files: ["firebase-messaging-sw.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        importScripts: "readonly",
        firebase: "readonly",
        self: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
    },
  },

  // Scripts que recebem firebase/Chart via CDN (sem import)
  {
    files: ["public/src/js/**/*.js", "public/**/*.js"],
    languageOptions: {
      globals: {
        firebase: "readonly",
        Chart: "readonly",
      },
    },
  },

  // Arquivos de configuração Node/CommonJS
  {
    files: [
      "tailwind.config.js",
      "jest.config.cjs",
      "tests/styleMock.js",
    ],
    languageOptions: {
      sourceType: "commonjs",
      globals: { module: "readonly", require: "readonly" },
    },
    rules: {
      "no-undef": "off",
    },
  },
];
