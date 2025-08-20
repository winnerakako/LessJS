module.exports = {
  // Core formatting options
  semi: true, // Use semicolons
  trailingComma: 'es5', // Trailing commas where valid in ES5
  singleQuote: true, // Use single quotes

  // Indentation and spacing
  tabWidth: 2, // 2 spaces for indentation
  useTabs: false, // Use spaces, not tabs

  // Line wrapping
  printWidth: 80, // Wrap lines at 80 characters
  bracketSpacing: true, // Spaces inside object literals: { foo: bar }
  bracketSameLine: false, // Put > on new line in JSX

  // Arrow functions
  arrowParens: 'always', // Always use parentheses: (x) => x

  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120, // Allow longer lines in JSON
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 100, // Slightly longer lines for markdown
        proseWrap: 'always', // Wrap prose in markdown
      },
    },
    {
      files: '*.ts',
      options: {
        parser: 'typescript',
      },
    },
  ],
};
