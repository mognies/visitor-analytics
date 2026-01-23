- This system analyzes customer interests based on their page visit history.
- Default to using Bun instead of Node.js.
- After completing any code changes, always run `bun run check` in the console directory to verify code quality.

# Directory Structure
- sdk: This is an SDK to embed in websites you want to analyze, to record visitor history.
- console: This is a console application to analyze customer interests based on their page visit history.
- sample-site: This is a sample website that uses the SDK to record visitor history.

# Workflow
This project uses [Jujutsu (jj)](https://github.com/martinvonz/jj) for version control.

1. **Describe early and often**: Use `jj describe` to add meaningful commit messages
2. **Use `jj new` frequently**: Keep logically separate changes in separate revisions
3. **Review before pushing**: Use `jj log` and `jj diff` to review changes before `jj git push`
4. **Leverage rebasing**: jj makes it easy to edit history before pushing with `jj edit`, `jj rebase`, etc.
5. **Parallel development**: Create multiple independent changes and work on them in parallel
