import globals from "globals";
import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {...globals.browser, ...globals.node}
        },
        rules: {
            "no-unused-vars": ["error", {"args": "none", "caughtErrors": "none"}]
        }
    },
    {
        files: ["spec/**/*.mjs"],
        languageOptions: {
            globals: globals.jasmine
        }
    }
];
