# Start Action

1. Read current-feature.md - verify Goals are populated
2. If empty, error: "Run /feature load first"
3. Break the whole action into one numbered todo list and write it into the `## Progress` section of current-feature.md before doing anything else. It covers the setup steps (set Status to "In Progress", create the branch, read the related code), one step per implementation goal, and the final "run `npm test`, lint and `npm run build`" step
4. Set Status to "In Progress"
5. Create and checkout the feature branch (derive name from H1 heading)
6. Implement the steps one per turn, updating the Progress section as the first edit of each one, as described in the **Todo List** section of `context/ai-interaction.md`: completed steps checked and struck through (`- [x] ~~step~~`), the current step in bold marked "← current", and pending steps unchecked. Never merge, drop or renumber steps
7. End with the final list, all steps checked, followed by the summary