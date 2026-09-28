# Test Action

Before anything else, show the full todo list for this action (the steps below, with the functions to test listed once they're identified) then work one step per turn, pausing after each with a Continue button that shows the updated list, as described in the **Todo List** section of `context/ai-interaction.md`.

1. Read current-feature.md to understand what was implemented
2. Identify server actions and utility functions added/modified for this feature
3. Check if tests already exist for these functions
4. For functions without tests that have testable logic, write unit tests:
   - Create unit tests using Vitest
   - Focus on server actions and utilities (not components)
   - Test happy path and error cases
   - Do not write tests just to write them. Use your best judgement
5. Run `npm test` to verify all tests pass
6. Report test coverage for the new feature code