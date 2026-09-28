# Review Action

Before anything else, show the full todo list for this action (the steps below) and repost it before every step, as described in the **Todo List** section of `context/ai-interaction.md`.

1. Read current-feature.md to understand the goals
2. Review all code changes made for this feature
3. Check for:
   - ✅ Goals met
   - ❌ Goals missing or incomplete
   - ⚠️ Code quality issues or bugs
   - 🚫 Scope creep (code beyond goals)
   - 🧪 Tests: new or changed server actions and utilities with testable logic have Vitest tests, and `npm test` passes
4. Final verdict: Ready to complete or needs changes