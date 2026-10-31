import globals from "globals";
import js from "@eslint/js";

export default [
    {
        ignores: ["public/"]
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: globals.node
        },
        rules: {
            "no-unused-vars": ["error", {"args": "none", "caughtErrors": "none"}]
        }
    }
];
