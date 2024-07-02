# Contribution

## Commits

The Conventional Commits specification is a lightweight convention on top of commit messages. It provides an easy set of rules for creating an explicit commit history; which makes it easier to write automated tools on top of. This convention dovetails with SemVer, by describing the features, fixes, and breaking changes made in commit messages.

The commit message should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

1. The commit contains the following structural elements, to communicate intent to the consumers of your library:

1. fix: a commit of the type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).

1. feat: a commit of the type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).

1. BREAKING CHANGE: a commit that has a footer BREAKING CHANGE:, or appends a ! after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any type.

1. types other than fix: and feat: are allowed, for example @commitlint/config-conventional (based on the Angular convention) recommends build:, chore:, ci:, docs:, style:, refactor:, perf:, test:, and others.
   footers other than BREAKING CHANGE: <description> may be provided and follow a convention similar to git trailer format.

1. Additional types are not mandated by the Conventional Commits specification, and have no implicit effect in Semantic Versioning (unless they include a BREAKING CHANGE). A scope may be provided to a commit’s type, to provide additional contextual information and is contained within parenthesis, e.g., feat(parser): add ability to parse arrays.

### Commit types

| Type       | Title                    | Description                                                                                                 |
| ---------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `feat`     | Features                 | A new feature                                                                                               |
| `fix`      | Bug Fixes                | A bug Fix                                                                                                   |
| `docs`     | Documentation            | Documentation only changes                                                                                  |
| `style`    | Styles                   | Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)      |
| `refactor` | Code Refactoring         | A code change that neither fixes a bug nor adds a feature                                                   |
| `perf`     | Performance Improvements | A code change that improves performance                                                                     |
| `test`     | Tests                    | Adding missing tests or correcting existing tests                                                           |
| `build`    | Builds                   | Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)         |
| `ci`       | Continuous Integrations  | Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs) |
| `chore`    | Chores                   | Other changes that don't modify src or test files                                                           |
| `revert`   | Reverts                  | Reverts a previous commit                                                                                   |

[Read more](https://www.conventionalcommits.org/en/v1.0.0/#summary).

## Change Log

Every release is documented on the GitHub Releases page.
