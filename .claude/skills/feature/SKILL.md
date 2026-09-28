---
name: feature
description: Manage current feature workflow - start, review, explain or complete
argument-hint: load|start|test|review|explain|complete
---

# Feature Workflow

Manages the full lifecycle of a feature from spec to merge.

## Working File

@context/current-feature.md

### File Structure

current-feature.md has these sections:

- `# Current Feature` - H1 heading with feature name when active
- `## Status` - Not Started | In Progress | Complete
- `## Goals` - Bullet points of what success looks like
- `## Notes` - Additional context, constraints, or details from spec
- `## Completed Features` - One short line per completed feature (append only, earliest to latest), so every session knows what exists

### History File

Full summaries of completed features are recorded in `context/feature-history.md` (append only, earliest to latest). It isn't imported here or in `CLAUDE.md`, so it stays out of every session's context; read it only when the one-line entry isn't enough.

## Task

Execute the requested action: $ARGUMENTS

| Action     | Description                               |
| ---------- | ----------------------------------------- |
| `load`     | Load a feature spec or inline description |
| `start`    | Begin implementation, create branch       |
| `test`     | Write and run unit tests for the feature  |
| `review`   | Check goals met, code quality             |
| `explain`  | Document what changed and why             |
| `complete` | Commit, push, merge, reset                |

See [actions/](actions/) for detailed instructions.

If no action provided, explain the available options.

## Todo List

Every action, not just implementation, follows the **Todo List** section of `context/ai-interaction.md`:

- Break the action into numbered steps and pause with the list before doing anything, including reading files or running commands.
- One step per turn: before the first step and after each step, pause with AskUserQuestion. The question names the next step ("Step N of M: ... Continue?"), the first option is "Continue" with the full, updated list in its `preview`, and the second is "Stop here". Text between tool calls mid-turn isn't visible to the user, so never rely on it for the list, and don't ask them to type "continue".
- Format: completed steps `- [x] ~~N. step~~`, the current step `- [ ] **N. step ← current**` with one line saying what it will do, and pending steps `- [ ] N. step`.
- Never merge steps into ranges, drop completed ones or renumber them. If a step is added mid-way, say so.
- End with the final list, all steps checked, followed by the summary.
