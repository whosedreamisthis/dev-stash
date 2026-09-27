# Start Action

1. Read current-feature.md - verify Goals are populated
2. If empty, error: "Run /feature load first"
3. Set Status to "In Progress"
4. Create and checkout the feature branch (derive name from H1 heading)
5. Break the goals into numbered implementation steps and show the list in the format from `context/ai-interaction.md` before each step (including the first): completed steps checked and struck through (`- [x] ~~step~~`), the current step in bold marked "← current", and pending steps unchecked. Never merge or drop steps.
6. Implement the steps one by one