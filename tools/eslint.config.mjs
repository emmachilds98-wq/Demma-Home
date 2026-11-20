// N191: the joined 3D script (one scope) checked for names used but never made, made twice, and the like (tools/checks.py "names")
import js from "@eslint/js";
import globals from "globals";
export default [js.configs.recommended, { languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: { ...globals.browser, PIECEP: "readonly", DemmaTools: "readonly" } },
  rules: { "no-unused-vars": "off", "no-empty": "off" } }];
