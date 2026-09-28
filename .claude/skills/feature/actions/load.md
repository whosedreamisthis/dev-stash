# Load Action

Before anything else, show the full todo list for this action (e.g. read the spec, look at the related code, write current-feature.md, confirm) then work one step per turn, ending each turn with the updated list and waiting for "continue", as described in the **Todo List** section of `context/ai-interaction.md`.

1. Check $ARGUMENTS (after "load"):
   - If it looks like a filename (single word, no spaces): Look for `context/features/{name}.md` OR `context/fixes/{name}.md`
   - If it's multiple words: Use as inline feature description, generate goals
   - If empty: Error - "load" requires a spec filename or feature description

2. Update current-feature.md:
   - Update H1 heading to include feature name (e.g., `# Current Feature: Add Navbar`)
   - Write goals as bullet points under ## Goals
   - Write any additional notes/context under ## Notes
   - Set Status to "Not Started"

3. Confirm spec loaded and show the feature summary