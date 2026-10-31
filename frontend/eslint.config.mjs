import globals from "globals";
import importPlugin from "eslint-plugin-import";
import js from "@eslint/js";
import react from "eslint-plugin-react";

export default [
    js.configs.recommended,
    react.configs.flat.recommended,
    importPlugin.flatConfigs.recommended,
    {
        files: ["src/**/*.{js,jsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: globals.browser
        },
        settings: {
            react: {
                version: "detect"
            }
        },
        rules: {
            "indent": ["error", 4],
            "semi": [2, "always"],
            "sort-imports": ["error", {"memberSyntaxSortOrder": ["none", "all", "multiple", "single"]}],
            "react/display-name": 0
        }
    }
];
