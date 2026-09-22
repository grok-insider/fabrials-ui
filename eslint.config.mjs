import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "packages/ai-ui/src/contracts.ts", "packages/ai-ui/src/provider-icon-data.ts"] },
  ...tseslint.configs.recommended,
  { rules: { "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }] } },
);
