# Contributing to JomBeelajar

Thank you for considering contributing to JomBeelajar! This document outlines the process for contributing to the project.

## Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md) to foster an inclusive community.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please create an issue using the bug report template. Include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment information

### Suggesting Features

If you have a feature idea, please create an issue using the feature request template. Include:

- A clear, descriptive title
- A detailed description of the feature
- Any relevant mockups or examples
- The problem this feature would solve

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Write or update tests as necessary
5. Ensure all tests pass (`npm test`)
6. Commit your changes following our commit message guidelines
7. Push to your branch (`git push origin feature/your-feature-name`)
8. Open a pull request

## Development Process

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for feature development
- `feature/[feature-name]` - Feature branches
- `fix/[issue-number]` - Bug fix branches

### Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): subject

body

footer
```

Where `type` is one of:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to the build process or tools

### Code Style

- Follow the project's ESLint and Prettier configurations
- Write meaningful comments for complex logic
- Use descriptive variable and function names
- Write self-documenting code when possible

### Testing Requirements

- Write tests for all new features
- Maintain or improve test coverage
- Test both success and failure cases
- Mock external dependencies appropriately

## Documentation

- Update documentation for any changes to APIs or features
- Document complex functions and components
- Keep README and other docs up to date
- Include JSDoc comments for public functions

## Review Process

Pull requests require:

1. Passing all automated tests
2. Code review by at least one maintainer
3. Documentation updates if needed
4. No outstanding requested changes

## Getting Help

If you need help with the contribution process:

- Join our [Discord server](https://discord.gg/example)
- Check the [documentation](./docs)
- Open an issue with the "question" label

## Recognition

All contributors will be recognized in our CONTRIBUTORS.md file.

Thank you for contributing to JomBeelajar!
