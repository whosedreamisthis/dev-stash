# AI Interaction Guidelines

## Communication

- Be concise and direct
- Explain non-obvious decisions briefly
- Ask before large refactors or architectural changes
- Don't add features not in the project spec
- Never delete files without clarification
- Always show the todo list before every step (see **Todo List** below)

## Todo List

Every piece of work on a feature or fix is tracked with a visible todo list. This applies to **every** action, not just implementation: loading a spec (`/feature load`), starting (status update, branch creation, reading code), implementing, testing, reviewing, and completing (commit, merge, branch delete, context reset, push).

1. **Plan first.** At the very start of an action, break it into numbered steps and end the turn with the full list, before doing anything, including before reading files or running commands.
2. **One step per turn, with a Continue button.** Before the first step and after each step, pause with the AskUserQuestion tool: the question names the next step (e.g. "Step 8 of 9: Push main to origin. Continue?"), the first option is **Continue** with the **full**, updated list in its preview, and the second is **Stop here**. On Continue, do only that step, then pause again. Text written between tool calls in the middle of a turn doesn't show up in my editor, so never rely on it for the list, and don't make me type "continue".
3. **Use this exact format:**

   ```
   - [x] ~~1. Completed step~~
   - [ ] **2. Current step ← current**
   - [ ] 3. Pending step
   ```

   - Completed steps: checked **and** struck through
   - Current step: unchecked, bold, marked `← current`
   - Pending steps: unchecked, plain text
4. **Say what the current step does.** Under the list, add one line saying what the current step will do and why.
5. **Never merge, drop or renumber steps.** Don't collapse steps into ranges like "1–5", and don't leave completed steps out. If a new step turns out to be needed, add it to the list and say so.
6. **Finish with the list.** When the action is done, show the final list with every step checked and struck through, followed by the summary.

## Workflow

This is the common workflow that we will use for every single feature/fix:

1. **Document** - Document the feature in @context/current-feature.md.
2. **Branch** - Create new branch for feature, fix, etc
3. **Implement** - Implement the feature/fix that I create in @context/current-feature.md. implement one feature goal at a time, show me which goal is being implemented when you are asking permission to make changes. Show the full todo list before every step, as described in **Todo List** above.
4. **Test** - Write Vitest unit tests for new or changed server actions and utilities (not components), where there is logic worth testing. Run `npm test` and `npm run build` and fix any failures. I verify the feature in the browser
5. **Iterate** - Iterate and change things if needed
6. **Commit** - Only after build passes and everything works. create a verbose commit message, don't include that claude co authored feature.
7. **Merge** - Merge to main
8. **Delete Branch** - Delete branch after merge
9. **Review** - Review AI-generated code periodically and on demand.
10. Mark as completed in @context/current-feature.md (with a one-line entry in its Completed Features list) and add the full summary to `context/feature-history.md`

Do NOT commit without permission and until the tests and build pass. If either fails, fix the issues first.

## Branching

We will create a new branch for every feature/fix. Name branch **feature/[feature]** or **fix[fix]**, etc. Ask to delete the branch once merged.

## Commits

- Ask before committing (don't auto-commit)
- Use conventional commit messages (feat:, fix:, chore:, etc.)
- Keep commits focused (one feature/fix per commit)
- Never put "Generated With Claude" or similar notion in the commit messages

## When Stuck

- If something isn't working after 2-3 attempts, stop and explain the issue
- Don't keep trying random fixes
- Ask for clarification if requirements are unclear

## Code Changes

- Make minimal changes to accomplish the task
- Don't refactor unrelated code unless asked
- Don't add "nice to have" features
- Preserve existing patterns in the codebase
- When updating current-feature.md status to completed, clear its feature description, Goals and Notes, add a one-line entry to the end of its Completed Features list, and append the full summary to the end of `context/feature-history.md`

## Code Review

Review AI-generated code periodically, especially for:

- Security (auth checks, input validation)
- Performance (unnecessary re-renders, N+1 queries)
- Logic errors (edge cases)
- Patterns (matches existing codebase?)
